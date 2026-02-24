import { NextRequest } from "next/server";
import { getProjectsData } from "@/services/projects";
import { getExperienceData } from "@/services/journey";
import { getProfileData } from "@/services/profile";
import { getTechStackData } from "@/services/techstack";
import { type MessageContent, type StreamChunk } from "@/types/chatbot";

type IncomingMessage = {
  role?: string;
  content?: string | MessageContent[];
};

type ModelMessage = {
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
};

type ParseState = {
  buffer: string;
  decoder: TextDecoder;
  isEventStream: boolean;
};

type ProbeResult = {
  parseState: ParseState;
  prefetchedContent: string;
  reader: ReadableStreamDefaultReader<Uint8Array>;
};

type ResolvedUpstream = {
  attempts: number;
  fallbackIndex: number;
  modelUsed: string;
  probeResult: ProbeResult;
};

type RouteErrorCode =
  | "AUTH_ERROR"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMITED"
  | "PROVIDER_UNAVAILABLE"
  | "BAD_REQUEST"
  | "UPSTREAM_ERROR"
  | "TIMEOUT";

type RouteError = Error & {
  code: RouteErrorCode;
  attempts: number;
  fallbackIndex: number;
  modelUsed?: string;
  statusCode: number;
  retryAfterMs?: number;
};

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "AndinoFerdi Portfolio";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const DEFAULT_PRIMARY_MODEL = "openrouter/free";
const DEFAULT_FALLBACK_MODELS = [
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "google/gemma-3-12b-it:free",
  "nvidia/nemotron-nano-12b-v2-vl:free",
];
const ROUTER_FREE_MODELS = new Set(["openrouter/free", "openrouter/auto"]);
const QUOTA_EXCEEDED_MARKERS = [
  "free-models-per-day",
  "unlock 1000 free model requests per day",
  "daily rate limit",
];

const MAX_CONTEXT_MESSAGES = 6;
const MAX_MODEL_INPUT_TEXT_CHARS = 1800;
const MAX_TEXT_PART_CHARS = 700;
const SYSTEM_PROMPT_MAX_CHARS = 2200;
const MAX_STREAM_OUTPUT_CHARS = 16_000;
const TOTAL_BUDGET_MS = 60_000;
const REQUEST_CONNECT_TIMEOUT_MS = 12_000;
const FIRST_TOKEN_TIMEOUT_MS = 30_000;
const STREAM_STALL_TIMEOUT_MS = 15_000;
const ERROR_LOG_TEXT_MAX_CHARS = 320;

const createRouteError = (options: {
  code: RouteErrorCode;
  message: string;
  attempts: number;
  fallbackIndex: number;
  modelUsed?: string;
  statusCode: number;
  retryAfterMs?: number;
}): RouteError => {
  const error = new Error(options.message) as RouteError;
  error.code = options.code;
  error.attempts = options.attempts;
  error.fallbackIndex = options.fallbackIndex;
  error.modelUsed = options.modelUsed;
  error.statusCode = options.statusCode;
  error.retryAfterMs = options.retryAfterMs;
  return error;
};

const isRouteError = (error: unknown): error is RouteError => {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Partial<RouteError>;
  return (
    (candidate.code === "AUTH_ERROR" ||
      candidate.code === "QUOTA_EXCEEDED" ||
      candidate.code === "RATE_LIMITED" ||
      candidate.code === "PROVIDER_UNAVAILABLE" ||
      candidate.code === "BAD_REQUEST" ||
      candidate.code === "UPSTREAM_ERROR" ||
      candidate.code === "TIMEOUT") &&
    typeof candidate.attempts === "number" &&
    typeof candidate.fallbackIndex === "number" &&
    typeof candidate.statusCode === "number"
  );
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const clampText = (value: string, maxChars: number): string => {
  const clean = normalizeWhitespace(value);
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars)}...[ringkas]`;
};

const extractTextFromContent = (content: string | MessageContent[]): string => {
  if (typeof content === "string") {
    return normalizeWhitespace(content);
  }

  const textSegments = content
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text || "")
    .filter((text) => text.trim().length > 0);

  return normalizeWhitespace(textSegments.join(" "));
};

const sanitizeIncomingMessages = (messages: IncomingMessage[]): ModelMessage[] => {
  return messages
    .map((message) => {
      const role = message.role;
      const content = message.content;

      if (role !== "user" && role !== "assistant" && role !== "system") {
        return null;
      }

      if (typeof content === "string") {
        const clean = clampText(content, MAX_MODEL_INPUT_TEXT_CHARS);
        if (clean.length === 0) return null;
        return { role, content: clean } as ModelMessage;
      }

      if (!Array.isArray(content)) {
        return null;
      }

      const sanitizedParts: MessageContent[] = [];
      let remainingTextBudget = MAX_MODEL_INPUT_TEXT_CHARS;

      for (const part of content) {
        if (part.type === "text" && typeof part.text === "string") {
          if (remainingTextBudget <= 0) continue;
          const limitedText = clampText(
            part.text,
            Math.min(remainingTextBudget, MAX_TEXT_PART_CHARS)
          );
          if (limitedText.length === 0) continue;

          sanitizedParts.push({
            type: "text",
            text: limitedText,
          });
          remainingTextBudget -= limitedText.length;
          continue;
        }

        if (
          part.type === "image_url" &&
          typeof part.image_url?.url === "string" &&
          part.image_url.url.length > 0
        ) {
          sanitizedParts.push({
            type: "image_url",
            image_url: { url: part.image_url.url },
          });
        }
      }

      if (sanitizedParts.length === 0) {
        const fallbackText = extractTextFromContent(content);
        if (!fallbackText) return null;

        return {
          role,
          content: clampText(fallbackText, MAX_MODEL_INPUT_TEXT_CHARS),
        } as ModelMessage;
      }

      return {
        role,
        content: sanitizedParts,
      } as ModelMessage;
    })
    .filter((message): message is ModelMessage => message !== null);
};

const getLatestUserText = (messages: ModelMessage[]): string => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === "user") {
      return extractTextFromContent(messages[index].content);
    }
  }
  return "";
};

const extractKeywords = (input: string): string[] => {
  const stopWords = new Set([
    "yang",
    "dan",
    "atau",
    "untuk",
    "dengan",
    "tentang",
    "please",
    "tolong",
    "apa",
    "bagaimana",
    "jelaskan",
    "the",
    "and",
    "from",
    "into",
    "your",
    "anda",
    "kamu",
    "saya",
    "ini",
    "itu",
  ]);

  return Array.from(
    new Set(
      input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 3 && !stopWords.has(token))
    )
  ).slice(0, 10);
};

const scoreByKeywords = (text: string, keywords: string[]): number => {
  if (keywords.length === 0) return 0;
  const haystack = text.toLowerCase();
  return keywords.reduce((total, keyword) => {
    return total + (haystack.includes(keyword) ? 1 : 0);
  }, 0);
};

const buildSystemPrompt = (messages: ModelMessage[]): string => {
  const projects = getProjectsData().projects;
  const experiences = getExperienceData().experiences;
  const profiles = getProfileData().profiles;
  const techStack = getTechStackData().categories;

  const latestUserText = getLatestUserText(messages);
  const keywords = extractKeywords(latestUserText);

  const rankedProjects = [...projects]
    .map((project) => ({
      project,
      score: scoreByKeywords(
        `${project.title} ${project.description} ${project.technologies.join(" ")}`,
        keywords
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(({ project }) => {
      return `- ${project.title}: ${clampText(project.description, 100)} | Tech: ${project.technologies
        .slice(0, 4)
        .join(", ")}`;
    });

  const rankedExperiences = [...experiences]
    .map((experience) => ({
      experience,
      score: scoreByKeywords(
        `${experience.title} ${experience.company} ${experience.description} ${experience.technologies.join(" ")}`,
        keywords
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 1)
    .map(({ experience }) => {
      return `- ${experience.title} at ${experience.company} (${experience.period.start} - ${experience.period.end})`;
    });

  const skillSummary = techStack
    .slice(0, 2)
    .map((category) => {
      return `${category.name}: ${category.technologies
        .slice(0, 4)
        .map((technology) => technology.name)
        .join(", ")}`;
    })
    .join(" | ");

  const prompt = `
You are AndinoBot for Andino Ferdiansah portfolio.

Rules:
- Reply in the same language as user.
- Default to complete, structured, and thorough answers.
- Use concise answers only when user explicitly asks for short reply.
- Use headings, numbered steps, and examples when they improve clarity.
- Use only portfolio facts for personal/project history.
- If data is unavailable, state it clearly.
- If image identity is unclear, ask short clarification.

Profile:
${profiles.map((profile) => `- ${profile.name}: ${clampText(profile.quote, 90)}`).join("\n")}

Relevant projects:
${rankedProjects.join("\n")}

Relevant experience:
${rankedExperiences.join("\n")}

Skill highlights:
${skillSummary}

Photo policy:
- Solo photos: /images/self/1.jpg to /images/self/4.jpg.
- Other gallery photos may include groups.
`.trim();

  return clampText(prompt, SYSTEM_PROMPT_MAX_CHARS);
};

const parseModelList = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
};

const isRouteModelAllowed = (model: string): boolean => {
  const normalized = model.toLowerCase();
  return normalized.endsWith(":free") || ROUTER_FREE_MODELS.has(normalized);
};

const isQuotaExceededError = (errorText: string): boolean => {
  const normalized = errorText.toLowerCase();
  return QUOTA_EXCEEDED_MARKERS.some((marker) => normalized.includes(marker));
};

const unique = (list: string[]): string[] => {
  return Array.from(new Set(list));
};

const resolveModelOrder = (): string[] => {
  const envPrimary = process.env.CHATBOT_MODEL_PRIMARY?.trim();
  const envFallbacks = parseModelList(process.env.CHATBOT_MODEL_FALLBACKS);

  const primary = envPrimary && isRouteModelAllowed(envPrimary)
    ? envPrimary
    : DEFAULT_PRIMARY_MODEL;
  const fallbacks = envFallbacks.length > 0
    ? envFallbacks.filter(isRouteModelAllowed)
    : DEFAULT_FALLBACK_MODELS;

  const order = unique([primary, ...fallbacks]);
  if (order.length > 0) {
    return order;
  }

  return unique([DEFAULT_PRIMARY_MODEL, ...DEFAULT_FALLBACK_MODELS]);
};

const buildModelMessages = (messages: ModelMessage[]): ModelMessage[] => {
  const conversation = messages.filter((message) => message.role !== "system");
  const trimmedConversation = conversation.slice(-MAX_CONTEXT_MESSAGES);
  const prompt = buildSystemPrompt(trimmedConversation);

  return [{ role: "system", content: prompt }, ...trimmedConversation];
};

const readSafeText = async (response: Response): Promise<string> => {
  try {
    return (await response.text()).trim();
  } catch {
    return "";
  }
};

const getRemainingBudgetMs = (routeStartedAt: number): number => {
  return Math.max(0, TOTAL_BUDGET_MS - (Date.now() - routeStartedAt));
};

const getAttemptBackoffMs = (attempts: number): number => {
  if (attempts <= 1) return 1000;
  if (attempts === 2) return 2500;
  return 5000;
};

const parseRetryAfterMs = (headerValue: string | null): number | null => {
  if (!headerValue) return null;

  const asSeconds = Number.parseFloat(headerValue);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.round(asSeconds * 1000);
  }

  const asDate = Date.parse(headerValue);
  if (Number.isNaN(asDate)) return null;

  const deltaMs = asDate - Date.now();
  return deltaMs > 0 ? deltaMs : 0;
};

const toLogText = (value: string): string => {
  return clampText(value, ERROR_LOG_TEXT_MAX_CHARS);
};

const readWithTimeout = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  timeoutMs: number,
  timeoutLabel: string
): Promise<ReadableStreamReadResult<Uint8Array>> => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    const readPromise = reader.read();
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(timeoutLabel));
      }, timeoutMs);
    });

    return await Promise.race([readPromise, timeoutPromise]);
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};

const extractTextFromChunk = (chunk: StreamChunk): string => {
  const choice = chunk.choices?.[0];
  if (!choice) return "";

  const deltaContent = choice.delta?.content as unknown;
  if (typeof deltaContent === "string") {
    return deltaContent;
  }

  if (Array.isArray(deltaContent)) {
    return deltaContent
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          (item as { type?: string }).type === "text" &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("");
  }

  const messageContent = (choice as { message?: { content?: unknown } }).message
    ?.content;
  if (typeof messageContent === "string") {
    return messageContent;
  }

  if (Array.isArray(messageContent)) {
    return messageContent
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          item &&
          typeof item === "object" &&
          "type" in item &&
          (item as { type?: string }).type === "text" &&
          "text" in item &&
          typeof (item as { text?: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("");
  }

  const directText = (choice as { text?: unknown }).text;
  if (typeof directText === "string") {
    return directText;
  }

  return "";
};

const extractSseContent = (payload: string): string => {
  if (!payload || payload === "[DONE]") return "";

  try {
    const parsed: StreamChunk = JSON.parse(payload);
    return extractTextFromChunk(parsed);
  } catch {
    return "";
  }
};

const extractContentFromChunkText = (
  chunkText: string,
  parseState: ParseState
): string => {
  if (!parseState.isEventStream) {
    return chunkText;
  }

  parseState.buffer += chunkText;
  const lines = parseState.buffer.split("\n");
  parseState.buffer = lines.pop() || "";

  let content = "";
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) continue;
    const payload = line.slice(5).trim();
    content += extractSseContent(payload);
  }

  return content;
};

const flushParseState = (parseState: ParseState): string => {
  if (!parseState.isEventStream) {
    return "";
  }

  const line = parseState.buffer.trim();
  parseState.buffer = "";

  if (!line.startsWith("data:")) {
    return "";
  }

  const payload = line.slice(5).trim();
  return extractSseContent(payload);
};

const requestUpstream = async (
  model: string,
  modelMessages: ModelMessage[],
  requestSignal: AbortSignal,
  routeStartedAt: number
): Promise<Response> => {
  const remainingBudgetMs = getRemainingBudgetMs(routeStartedAt);
  if (remainingBudgetMs <= 0) {
    throw new Error("TOTAL_BUDGET_TIMEOUT");
  }

  const connectTimeoutMs = Math.min(REQUEST_CONNECT_TIMEOUT_MS, remainingBudgetMs);
  const connectSignal = AbortSignal.timeout(connectTimeoutMs);
  const combinedSignal = AbortSignal.any([requestSignal, connectSignal]);

  try {
    return await fetch(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: modelMessages,
        stream: true,
        temperature: 0.4,
        max_tokens: 1800,
        reasoning: {
          effort: "none",
          exclude: true,
        },
      }),
      signal: combinedSignal,
    });
  } catch (error) {
    if (requestSignal.aborted) {
      throw new DOMException("Client aborted request", "AbortError");
    }

    if (connectSignal.aborted) {
      throw new Error("CONNECT_TIMEOUT");
    }

    throw error instanceof Error ? error : new Error(String(error));
  }
};

const probeFirstVisibleContent = async (
  upstream: Response,
  requestSignal: AbortSignal,
  routeStartedAt: number
): Promise<ProbeResult> => {
  const reader = upstream.body?.getReader();
  if (!reader) {
    throw new Error("EMPTY_STREAM");
  }

  const parseState: ParseState = {
    buffer: "",
    decoder: new TextDecoder(),
    isEventStream: (upstream.headers.get("content-type") || "").includes(
      "text/event-stream"
    ),
  };

  while (true) {
    if (requestSignal.aborted) {
      throw new DOMException("Client aborted request", "AbortError");
    }

    const remainingBudgetMs = getRemainingBudgetMs(routeStartedAt);
    if (remainingBudgetMs <= 0) {
      throw new Error("TOTAL_BUDGET_TIMEOUT");
    }

    const readTimeoutMs = Math.min(FIRST_TOKEN_TIMEOUT_MS, remainingBudgetMs);
    const result = await readWithTimeout(reader, readTimeoutMs, "FIRST_TOKEN_TIMEOUT");

    if (result.done) {
      const flushed = flushParseState(parseState);
      if (flushed.length > 0) {
        return {
          parseState,
          prefetchedContent: flushed,
          reader,
        };
      }

      throw new Error("EMPTY_STREAM");
    }

    const chunkText = parseState.decoder.decode(result.value, { stream: true });
    const content = extractContentFromChunkText(chunkText, parseState);

    if (content.length > 0) {
      return {
        parseState,
        prefetchedContent: content,
        reader,
      };
    }
  }
};

const createPlainTextStream = (
  probeResult: ProbeResult,
  options: {
    clientSignal: AbortSignal;
    routeStartedAt: number;
  }
): ReadableStream<Uint8Array> => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const { parseState, reader } = probeResult;
      let emittedChars = 0;

      if (probeResult.prefetchedContent.length > 0) {
        const prefetched = probeResult.prefetchedContent.slice(
          0,
          Math.max(0, MAX_STREAM_OUTPUT_CHARS - emittedChars)
        );
        if (prefetched.length > 0) {
          controller.enqueue(encoder.encode(prefetched));
          emittedChars += prefetched.length;
        }
        if (emittedChars >= MAX_STREAM_OUTPUT_CHARS) {
          controller.close();
          return;
        }
      }

      try {
        while (true) {
          if (options.clientSignal.aborted) {
            await reader.cancel();
            controller.close();
            return;
          }

          const remainingBudgetMs = getRemainingBudgetMs(options.routeStartedAt);
          if (remainingBudgetMs <= 0) {
            controller.close();
            return;
          }

          const readTimeoutMs = Math.min(STREAM_STALL_TIMEOUT_MS, remainingBudgetMs);
          const result = await readWithTimeout(
            reader,
            readTimeoutMs,
            "STREAM_STALL_TIMEOUT"
          );

          if (result.done) {
            break;
          }

          const chunkText = parseState.decoder.decode(result.value, { stream: true });
          const content = extractContentFromChunkText(chunkText, parseState);

          if (content.length > 0) {
            const remaining = MAX_STREAM_OUTPUT_CHARS - emittedChars;
            if (remaining <= 0) {
              controller.close();
              return;
            }
            const safeContent = content.slice(0, remaining);
            if (safeContent.length > 0) {
              controller.enqueue(encoder.encode(safeContent));
              emittedChars += safeContent.length;
            }
            if (emittedChars >= MAX_STREAM_OUTPUT_CHARS) {
              controller.close();
              return;
            }
          }
        }

        const decoderTail = parseState.decoder.decode();
        if (decoderTail.length > 0) {
          const tailContent = extractContentFromChunkText(decoderTail, parseState);
          if (tailContent.length > 0) {
            const remaining = MAX_STREAM_OUTPUT_CHARS - emittedChars;
            const safeTail = tailContent.slice(0, Math.max(0, remaining));
            if (safeTail.length > 0) {
              controller.enqueue(encoder.encode(safeTail));
              emittedChars += safeTail.length;
            }
          }
        }

        const flushed = flushParseState(parseState);
        if (flushed.length > 0) {
          const remaining = MAX_STREAM_OUTPUT_CHARS - emittedChars;
          const safeFlushed = flushed.slice(0, Math.max(0, remaining));
          if (safeFlushed.length > 0) {
            controller.enqueue(encoder.encode(safeFlushed));
          }
        }

        controller.close();
      } catch {
        try {
          await reader.cancel();
        } catch {
          // Ignore cancel error.
        }

        controller.close();
      } finally {
        reader.releaseLock();
      }
    },
  });
};

const resolveUpstreamStream = async (
  modelOrder: string[],
  modelMessages: ModelMessage[],
  requestSignal: AbortSignal,
  routeStartedAt: number
): Promise<ResolvedUpstream> => {
  let attempts = 0;
  let lastError: RouteError | null = null;
  let nextRetryAfterMs: number | null = null;

  for (let index = 0; index < modelOrder.length; index += 1) {
    if (requestSignal.aborted) {
      throw new DOMException("Client aborted request", "AbortError");
    }

    if (getRemainingBudgetMs(routeStartedAt) <= 0) {
      break;
    }

    const model = modelOrder[index];
    attempts += 1;

    try {
      const upstream = await requestUpstream(
        model,
        modelMessages,
        requestSignal,
        routeStartedAt
      );

      if (!upstream.ok) {
        const errorText = await readSafeText(upstream);
        const retryAfterMs = parseRetryAfterMs(upstream.headers.get("retry-after"));
        nextRetryAfterMs = retryAfterMs;

        console.error("[chatbot][upstream-fail]", {
          status: upstream.status,
          model,
          attempts,
          fallbackIndex: index,
          elapsedMs: Date.now() - routeStartedAt,
          retryAfterMs,
          errorText: toLogText(errorText || "No detail"),
        });

        if (upstream.status === 401 || upstream.status === 403) {
          throw createRouteError({
            code: "AUTH_ERROR",
            message: `AUTH_ERROR: ${errorText || "Invalid API key"}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: 401,
          });
        }

        if (upstream.status === 429 && isQuotaExceededError(errorText)) {
          throw createRouteError({
            code: "QUOTA_EXCEEDED",
            message: `QUOTA_EXCEEDED: ${errorText || "Daily free quota reached"}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: 429,
            retryAfterMs: retryAfterMs ?? undefined,
          });
        }

        if (upstream.status === 429) {
          lastError = createRouteError({
            code: "RATE_LIMITED",
            message: `RATE_LIMITED (${model}): ${errorText || "Rate limit reached"}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: 429,
            retryAfterMs: retryAfterMs ?? undefined,
          });
          continue;
        }

        if (upstream.status === 503) {
          lastError = createRouteError({
            code: "PROVIDER_UNAVAILABLE",
            message: `PROVIDER_UNAVAILABLE (${model}): ${errorText || "Provider unavailable"}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: 503,
          });
          continue;
        }

        if (upstream.status === 400) {
          lastError = createRouteError({
            code: "BAD_REQUEST",
            message: `BAD_REQUEST (${model}): ${errorText || "Invalid payload"}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: 400,
          });
          continue;
        }

        lastError = createRouteError({
          code: "UPSTREAM_ERROR",
          message: `UPSTREAM_ERROR (${model}, ${upstream.status}): ${errorText || "No detail"}`,
          attempts,
          fallbackIndex: index,
          modelUsed: model,
          statusCode: upstream.status >= 500 ? 500 : upstream.status,
        });
      } else {
        const probeResult = await probeFirstVisibleContent(
          upstream,
          requestSignal,
          routeStartedAt
        );

        return {
          attempts,
          fallbackIndex: index,
          modelUsed: model,
          probeResult,
        };
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      if (isRouteError(error) && (
        error.code === "AUTH_ERROR" ||
        error.code === "QUOTA_EXCEEDED"
      )) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const timeoutLikeError =
        errorMessage === "CONNECT_TIMEOUT" ||
        errorMessage === "FIRST_TOKEN_TIMEOUT" ||
        errorMessage === "STREAM_STALL_TIMEOUT" ||
        errorMessage === "TOTAL_BUDGET_TIMEOUT" ||
        errorMessage === "EMPTY_STREAM";

      lastError = isRouteError(error)
        ? error
        : createRouteError({
            code: timeoutLikeError ? "TIMEOUT" : "UPSTREAM_ERROR",
            message: timeoutLikeError
              ? `TIMEOUT (${model}): ${errorMessage}`
              : `UPSTREAM_ERROR (${model}): ${errorMessage}`,
            attempts,
            fallbackIndex: index,
            modelUsed: model,
            statusCode: timeoutLikeError ? 500 : 500,
          });

      console.error("[chatbot][attempt-error]", {
        model,
        attempts,
        fallbackIndex: index,
        elapsedMs: Date.now() - routeStartedAt,
        code: lastError.code,
        message: toLogText(lastError.message),
      });
    }

    if (index < modelOrder.length - 1) {
      const remainingBudgetMs = getRemainingBudgetMs(routeStartedAt);
      if (remainingBudgetMs > 0) {
        const cooldownMs = Math.max(
          nextRetryAfterMs ?? 0,
          getAttemptBackoffMs(attempts)
        );
        nextRetryAfterMs = null;
        await wait(Math.min(cooldownMs, remainingBudgetMs));
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw createRouteError({
    code: "TIMEOUT",
    message: "Semua model gratis gagal merespons dalam batas waktu.",
    attempts,
    fallbackIndex: attempts > 0 ? Math.min(attempts - 1, modelOrder.length - 1) : -1,
    modelUsed:
      attempts > 0
        ? modelOrder[Math.min(attempts - 1, modelOrder.length - 1)]
        : undefined,
    statusCode: 500,
  });
};

export async function POST(request: NextRequest) {
  const routeStartedAt = Date.now();

  if (!OPENROUTER_API_KEY) {
    return new Response("OPENROUTER_API_KEY belum diset di server.", {
      status: 500,
    });
  }

  let body: { messages?: IncomingMessage[] } = {};

  try {
    body = (await request.json()) as { messages?: IncomingMessage[] };
  } catch {
    return new Response("Payload JSON tidak valid.", { status: 400 });
  }

  const incomingMessages = Array.isArray(body.messages) ? body.messages : [];
  const sanitizedMessages = sanitizeIncomingMessages(incomingMessages);

  if (sanitizedMessages.length === 0) {
    return new Response("messages wajib berisi minimal satu item valid.", {
      status: 400,
    });
  }

  const modelMessages = buildModelMessages(sanitizedMessages);
  const modelOrder = resolveModelOrder();

  try {
    const resolved = await resolveUpstreamStream(
      modelOrder,
      modelMessages,
      request.signal,
      routeStartedAt
    );

    const stream = createPlainTextStream(resolved.probeResult, {
      clientSignal: request.signal,
      routeStartedAt,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "x-chatbot-model-used": resolved.modelUsed,
        "x-chatbot-attempts": String(resolved.attempts),
        "x-chatbot-fallback-index": String(resolved.fallbackIndex),
        "x-chatbot-route-time-ms": String(Date.now() - routeStartedAt),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }

    const routeError = isRouteError(error) ? error : null;
    const attempts = routeError?.attempts ?? 0;
    const fallbackIndex = routeError?.fallbackIndex ?? -1;
    const modelUsed = routeError?.modelUsed;
    const statusCode = routeError?.statusCode ?? 500;
    const retryAfterMs = routeError?.retryAfterMs;
    const message = error instanceof Error ? error.message : String(error);
    const elapsedMs = String(Date.now() - routeStartedAt);

    const diagnosticHeaders: Record<string, string> = {
      ...(modelUsed ? { "x-chatbot-model-used": modelUsed } : {}),
      "x-chatbot-attempts": String(attempts),
      "x-chatbot-fallback-index": String(fallbackIndex),
      "x-chatbot-route-time-ms": elapsedMs,
    };
    if (retryAfterMs && retryAfterMs > 0) {
      diagnosticHeaders["retry-after"] = String(Math.ceil(retryAfterMs / 1000));
    }

    const respond = (status: number, failureReason: string, body: string) => {
      console.error("[chatbot][route-fail]", {
        status,
        failureReason,
        attempts,
        fallbackIndex,
        modelUsed,
        elapsedMs: Number(elapsedMs),
        message: toLogText(message),
      });
      return new Response(body, {
        status,
        headers: {
          ...diagnosticHeaders,
          "x-chatbot-failure-reason": failureReason,
        },
      });
    };

    if (routeError?.code === "AUTH_ERROR" || message.startsWith("AUTH_ERROR:")) {
      return respond(401, "auth_error", "Autentikasi model gagal di server.");
    }

    if (routeError?.code === "QUOTA_EXCEEDED" || message.startsWith("QUOTA_EXCEEDED:")) {
      return respond(
        429,
        "quota_exceeded",
        "Kuota harian model gratis habis. Tunggu reset kuota OpenRouter atau tambahkan kredit."
      );
    }

    if (routeError?.code === "RATE_LIMITED" || message.startsWith("RATE_LIMITED")) {
      return respond(
        429,
        "rate_limited",
        "Rate limit OpenRouter tercapai. Tunggu sebentar lalu coba lagi."
      );
    }

    if (
      routeError?.code === "PROVIDER_UNAVAILABLE" ||
      message.startsWith("PROVIDER_UNAVAILABLE")
    ) {
      return respond(
        503,
        "provider_unavailable",
        "Provider model gratis sedang tidak tersedia untuk request ini. Silakan coba lagi beberapa saat."
      );
    }

    if (routeError?.code === "BAD_REQUEST" || message.startsWith("BAD_REQUEST")) {
      return respond(400, "bad_request", "Payload chatbot tidak valid.");
    }

    if (routeError?.code === "TIMEOUT" || message.startsWith("TIMEOUT")) {
      return respond(
        500,
        "timeout",
        "Permintaan chatbot timeout di server. Silakan coba lagi."
      );
    }

    return respond(
      statusCode >= 400 && statusCode < 600 ? statusCode : 500,
      "upstream_error",
      "Server chatbot sementara bermasalah. Silakan coba lagi."
    );
  }
}
