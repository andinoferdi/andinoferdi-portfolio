import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { createCerebras } from "@ai-sdk/cerebras";
import { z } from "zod";
import { getProjectsData } from "@/services/projects";
import { getExperienceData } from "@/services/journey";
import { getProfileData } from "@/services/profile";
import { getTechStackData } from "@/services/techstack";
import { getCertificateData } from "@/services/certificate";
import { getGalleryData } from "@/services/gallery";
import { getMusicData } from "@/services/music";
import { getHomePageData } from "@/services/hero";
import { type ChatStreamEvent } from "@/types/chatbot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const AUTO_MODEL_ID = "auto";
const DEFAULT_MODEL = "llama3.1-8b";
const DEFAULT_FALLBACK_MODELS = [
  "zai-glm-4.7",
  "qwen-3-235b-a22b-instruct-2507",
  "gpt-oss-120b",
] as const;
const MAX_REQUEST_MESSAGES = 40;
const MAX_REQUEST_CHARACTERS = 30_000;
const MAX_CONTEXT_GALLERY_ITEMS = 12;
const MAX_CONTEXT_TRACKS = 14;
const STREAM_COMMIT_CHARACTER_THRESHOLD = 120;

const messageContentPartSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string(),
  }),
  z.object({
    type: z.literal("image_url"),
    image_url: z.object({
      url: z.string(),
    }),
  }),
]);

const messageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.union([z.string(), z.array(messageContentPartSchema)]),
  timestamp: z.string().optional(),
  model: z.string().optional(),
  images: z.array(z.string()).optional(),
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1).max(MAX_REQUEST_MESSAGES),
  selectedModelId: z.string().optional(),
  hasImages: z.boolean().optional().default(false),
  userText: z.string().optional().default(""),
});

type ParsedRequest = z.infer<typeof requestSchema>;

type AttemptClassification =
  | "model_unavailable"
  | "model_access_denied"
  | "stream_failed";

type AttemptStage = "before_stream" | "during_stream";

interface AttemptErrorEntry {
  attempt: number;
  model: string;
  reason: string;
  classification: AttemptClassification;
  stage: AttemptStage;
}

const formatAttemptErrors = (attempts: AttemptErrorEntry[]): string => {
  if (!attempts.length) {
    return "No model attempts were recorded.";
  }

  return attempts
    .map(
      (attempt) =>
        `${attempt.attempt}. ${attempt.model} [${attempt.classification}/${attempt.stage}] - ${attempt.reason}`
    )
    .join(" | ");
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
};

const getErrorCode = (error: unknown): string | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "data" in error &&
    typeof (error as { data?: { code?: unknown } }).data?.code === "string"
  ) {
    return (error as { data: { code: string } }).data.code;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
};

const getStatusCode = (error: unknown): number | null => {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode?: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }

  return null;
};

const classifyModelError = (error: unknown): AttemptClassification => {
  const message = getErrorMessage(error).toLowerCase();
  const code = (getErrorCode(error) ?? "").toLowerCase();
  const statusCode = getStatusCode(error);

  if (
    statusCode === 404 ||
    code.includes("not_found") ||
    message.includes("does not exist")
  ) {
    return "model_unavailable";
  }

  if (
    statusCode === 401 ||
    statusCode === 403 ||
    code.includes("permission") ||
    code.includes("access") ||
    message.includes("access") ||
    message.includes("permission") ||
    message.includes("unauthorized") ||
    message.includes("forbidden")
  ) {
    return "model_access_denied";
  }

  return "stream_failed";
};

const canFallbackAfterError = (error: unknown): boolean => {
  const classification = classifyModelError(error);
  return (
    classification === "model_unavailable" ||
    classification === "model_access_denied"
  );
};

const extractTextFromContent = (
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >
): string => {
  if (typeof content === "string") return content.trim();

  return content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();
};

const parseFallbackModels = (): string[] => {
  const fromEnv = process.env.CEREBRAS_MODEL_FALLBACKS ?? "";
  if (!fromEnv.trim()) return [...DEFAULT_FALLBACK_MODELS];

  return fromEnv
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
};

const buildModelChain = (selectedModelId?: string): string[] => {
  const primary = process.env.CEREBRAS_MODEL?.trim() || DEFAULT_MODEL;
  const fallbacks = parseFallbackModels();

  const preferred =
    selectedModelId && selectedModelId !== AUTO_MODEL_ID
      ? selectedModelId.trim()
      : "";

  const chain = [preferred, primary, ...fallbacks].filter(Boolean);
  return [...new Set(chain)];
};

const buildPortfolioContext = (): string => {
  const siteName =
    process.env.NEXT_PUBLIC_SITE_NAME || "AndinoFerdi Portfolio";
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://andinoferdi.vercel.app";
  const heroData = getHomePageData();
  const profileData = getProfileData();
  const projects = getProjectsData().projects;
  const experiences = getExperienceData().experiences;
  const techCategories = getTechStackData().categories;
  const certificates = getCertificateData().certificates;
  const gallery = getGalleryData().items.slice(0, MAX_CONTEXT_GALLERY_ITEMS);
  const tracks = getMusicData(false).tracks.slice(0, MAX_CONTEXT_TRACKS);

  const profileSummary = profileData.profiles
    .map(
      (profile, index) =>
        `${index + 1}. ${profile.name} (${profile.designation}) - ${profile.quote}`
    )
    .join("\n");

  const projectSummary = projects
    .map(
      (project, index) =>
        `${index + 1}. ${project.title} - ${project.description} | Tech: ${project.technologies.join(
          ", "
        )}${project.liveUrl ? ` | Live: ${project.liveUrl}` : ""}`
    )
    .join("\n");

  const journeySummary = experiences
    .map(
      (experience, index) =>
        `${index + 1}. ${experience.title} at ${experience.company} (${experience.period.start} - ${experience.period.end}) | ${experience.description}`
    )
    .join("\n");

  const techSummary = techCategories
    .map(
      (category) =>
        `- ${category.name}: ${category.technologies
          .map((tech) => tech.name)
          .join(", ")}`
    )
    .join("\n");

  const certificateSummary = certificates
    .map((certificate, index) => {
      const imageList = certificate.images.join(", ");
      return `${index + 1}. ${imageList}`;
    })
    .join("\n");

  const gallerySummary = gallery
    .map((item, index) => `${index + 1}. ${item.title}`)
    .join("\n");

  const musicSummary = tracks
    .map(
      (track, index) =>
        `${index + 1}. ${track.title} - ${track.artist} (${track.album})`
    )
    .join("\n");

  return `
[PUBLIC SITE METADATA]
- Site name: ${siteName}
- Site URL: ${siteUrl}

[HERO]
- Greeting: ${heroData.hero.greeting}
- Flip words: ${heroData.hero.flipWords.join(", ")}

[PROFILE ROLES]
${profileSummary}

[PROJECTS]
${projectSummary}

[JOURNEY]
${journeySummary}

[TECH STACK]
${techSummary}

[CERTIFICATES]
${certificateSummary}

[RECENT GALLERY ITEMS]
${gallerySummary}

[PLAYLIST SAMPLE]
${musicSummary}

[CV DOWNLOAD]
- ${profileData.cvDownload.label}: ${profileData.cvDownload.url}
`.trim();
};

const buildSystemPrompt = (portfolioContext: string): string => {
  return `
You are AndinoBot, the official assistant for Andino Ferdiansah's portfolio website.

Primary behavior:
1. For questions about Andino Ferdiansah and this portfolio, prioritize the provided PORTFOLIO FACTS.
2. If a portfolio-specific detail is not present in facts, answer honestly that the specific data is not available.
3. Do not fabricate projects, timelines, links, contact details, certifications, or technical claims.

Secondary behavior:
4. For general knowledge questions, provide a useful and correct general answer.
5. Keep responses concise, practical, and in the user's language.
6. If user asks for secrets, API keys, tokens, or private credentials, refuse and explain briefly.

PORTFOLIO FACTS:
${portfolioContext}
`.trim();
};

const createSseEvent = (event: ChatStreamEvent): string => {
  return `data: ${JSON.stringify(event)}\n\n`;
};

const isReasoningModel = (modelId: string): boolean => {
  return modelId.trim().toLowerCase() === "gpt-oss-120b";
};

const toModelMessages = (requestBody: ParsedRequest) => {
  return requestBody.messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant"
    )
    .map((message) => ({
      role: message.role,
      content: extractTextFromContent(message.content),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_REQUEST_MESSAGES);
};

const getLatestUserText = (requestBody: ParsedRequest): string => {
  const explicit = requestBody.userText.trim();
  if (explicit) return explicit;

  for (let index = requestBody.messages.length - 1; index >= 0; index -= 1) {
    const message = requestBody.messages[index];
    if (message.role !== "user") continue;
    const extracted = extractTextFromContent(message.content);
    if (extracted) return extracted;
  }

  return "";
};

export async function POST(request: NextRequest) {
  const parsedBody = requestSchema.safeParse(
    await request.json().catch(() => ({}))
  );

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid chatbot request payload.",
        issues: parsedBody.error.issues,
      },
      { status: 400 }
    );
  }

  const body = parsedBody.data;
  if (body.hasImages) {
    return NextResponse.json(
      { error: "Image chat is temporarily disabled for this chatbot." },
      { status: 400 }
    );
  }

  const latestUserText = getLatestUserText(body);
  if (!latestUserText) {
    return NextResponse.json(
      { error: "User message is required." },
      { status: 400 }
    );
  }

  const serializedChars = body.messages.reduce((sum, message) => {
    return sum + extractTextFromContent(message.content).length;
  }, 0);

  if (serializedChars > MAX_REQUEST_CHARACTERS) {
    return NextResponse.json(
      { error: "Message history is too large. Please clear chat and try again." },
      { status: 413 }
    );
  }

  const cerebrasApiKey = process.env.CEREBRAS_API_KEY?.trim();
  if (!cerebrasApiKey) {
    return NextResponse.json(
      { error: "CEREBRAS_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const modelChain = buildModelChain(body.selectedModelId);
  if (modelChain.length === 0) {
    return NextResponse.json(
      { error: "No Cerebras model configured for chatbot." },
      { status: 500 }
    );
  }

  const modelMessages = toModelMessages(body);
  if (modelMessages.length === 0) {
    return NextResponse.json(
      { error: "No valid conversation messages were provided." },
      { status: 400 }
    );
  }

  const portfolioContext = buildPortfolioContext();
  const systemPrompt = buildSystemPrompt(portfolioContext);
  const cerebras = createCerebras({ apiKey: cerebrasApiKey });
  const attemptErrors: AttemptErrorEntry[] = [];
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let committedModel: string | null = null;

      const enqueue = (event: ChatStreamEvent) => {
        if (closed) return;
        controller.enqueue(encoder.encode(createSseEvent(event)));
      };

      const recordAttemptError = (
        model: string,
        stage: AttemptStage,
        error: unknown,
        attempt: number
      ) => {
        const reason = getErrorMessage(error);
        const classification = classifyModelError(error);

        console.error(`[chatbot][${stage}]`, {
          attempt,
          model,
          classification,
          statusCode: getStatusCode(error),
          code: getErrorCode(error),
          reason,
        });

        attemptErrors.push({
          attempt,
          model,
          reason,
          classification,
          stage,
        });
      };

      const streamAttempt = async (
        model: string,
        attempt: number
      ): Promise<boolean> => {
        const result = streamText({
          model: cerebras(model),
          system: systemPrompt,
          messages: modelMessages,
          temperature: 0.4,
          maxRetries: 0,
          abortSignal: request.signal,
          providerOptions: isReasoningModel(model)
            ? {
                cerebras: {
                  reasoningEffort: "medium",
                },
              }
            : undefined,
        });

        const iterator = result.textStream[Symbol.asyncIterator]();
        const bufferedChunks: string[] = [];
        let aggregatedText = "";
        let hasCommitted = false;

        const commitBufferedChunks = () => {
          if (hasCommitted) return;
          hasCommitted = true;
          committedModel = model;
          enqueue({ type: "meta", model });

          for (const chunk of bufferedChunks) {
            enqueue({ type: "token", text: chunk });
          }
        };

        try {
          while (true) {
            const { done, value } = await iterator.next();
            if (done) break;
            if (!value) continue;

            aggregatedText += value;
            bufferedChunks.push(value);

            if (
              !hasCommitted &&
              aggregatedText.trim().length >= STREAM_COMMIT_CHARACTER_THRESHOLD
            ) {
              commitBufferedChunks();
              continue;
            }

            if (hasCommitted) {
              enqueue({ type: "token", text: value });
            }
          }

          if (!aggregatedText.trim()) {
            try {
              const finalText = await result.text;
              if (finalText) {
                aggregatedText = finalText;
                bufferedChunks.length = 0;
                bufferedChunks.push(finalText);
              }
            } catch {
              // Best-effort fallback only.
            }
          }

          commitBufferedChunks();
          enqueue({
            type: "done",
            model,
            text: aggregatedText,
          });

          return true;
        } catch (error) {
          const stage: AttemptStage = hasCommitted
            ? "during_stream"
            : "before_stream";
          recordAttemptError(model, stage, error, attempt);

          if (!hasCommitted && canFallbackAfterError(error)) {
            return false;
          }

          throw error;
        } finally {
          try {
            await iterator.return?.();
          } catch (cleanupError) {
            console.error("[chatbot][stream_cleanup_failed]", {
              attempt,
              model,
              reason: getErrorMessage(cleanupError),
            });
          }
        }
      };

      try {
        let streamedSuccessfully = false;

        for (let index = 0; index < modelChain.length; index += 1) {
          const model = modelChain[index];
          const completed = await streamAttempt(model, index + 1);

          if (completed) {
            streamedSuccessfully = true;
            break;
          }
        }

        if (!streamedSuccessfully) {
          throw new Error("All configured Cerebras models failed before streaming.");
        }
      } catch (error) {
        const baseReason = getErrorMessage(error);
        const reason =
          !committedModel && attemptErrors.length > 0
            ? `${baseReason} Attempts: ${formatAttemptErrors(attemptErrors)}`
            : baseReason;
        console.error("[chatbot][stream_aborted]", {
          model: committedModel,
          reason,
          attempts: attemptErrors,
        });
        enqueue({
          type: "error",
          model: committedModel ?? undefined,
          error: reason,
        });
      } finally {
        if (!closed) {
          closed = true;
          controller.close();
        }
      }
    },
    async cancel() {},
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
