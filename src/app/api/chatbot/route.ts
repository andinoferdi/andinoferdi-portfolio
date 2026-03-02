import { NextRequest } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import { getProjectsData } from "@/services/projects";
import { getExperienceData } from "@/services/journey";
import { getProfileData } from "@/services/profile";
import { getTechStackData } from "@/services/techstack";
import { type MessageContent } from "@/types/chatbot";

type IncomingMessage = {
  role?: string;
  content?: string | MessageContent[];
};

type ModelMessage = {
  role: "user" | "assistant" | "system";
  content: string | MessageContent[];
};

type ProviderMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type ProviderProbeResult = {
  prefetchedContent: string;
  iterator: AsyncIterator<unknown> | null;
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

const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY;
const DEFAULT_CEREBRAS_MODEL = "gpt-oss-120b";
const DEFAULT_CEREBRAS_FALLBACK_MODELS = [
  "llama3.1-8b",
  "zai-glm-4.7",
  "qwen-3-235b-a22b-instruct-2507",
];
const CEREBRAS_MODEL = process.env.CEREBRAS_MODEL?.trim() || DEFAULT_CEREBRAS_MODEL;
const CEREBRAS_MODEL_FALLBACKS = process.env.CEREBRAS_MODEL_FALLBACKS;
const cerebrasClient = CEREBRAS_API_KEY
  ? new Cerebras({ apiKey: CEREBRAS_API_KEY })
  : null;

const QUOTA_EXCEEDED_MARKERS = [
  "quota",
  "insufficient",
  "credit",
  "free tier",
  "free plan",
];
const AUTH_ERROR_MARKERS = [
  "invalid api key",
  "unauthorized",
  "forbidden",
  "authentication",
  "api key",
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

      const textParts: string[] = [];
      let remainingTextBudget = MAX_MODEL_INPUT_TEXT_CHARS;
      let hasImage = false;

      for (const part of content) {
        if (part.type === "text" && typeof part.text === "string") {
          if (remainingTextBudget <= 0) continue;
          const limitedText = clampText(
            part.text,
            Math.min(remainingTextBudget, MAX_TEXT_PART_CHARS)
          );
          if (limitedText.length === 0) continue;

          textParts.push(limitedText);
          remainingTextBudget -= limitedText.length;
          continue;
        }

        if (
          part.type === "image_url" &&
          typeof part.image_url?.url === "string" &&
          part.image_url.url.length > 0
        ) {
          hasImage = true;
        }
      }

      const combinedText = normalizeWhitespace(textParts.join(" "));
      if (combinedText.length > 0) {
        return {
          role,
          content: combinedText,
        } as ModelMessage;
      }

      if (hasImage) {
        return {
          role,
          content:
            "[Pengguna mengirim gambar. Fitur gambar chatbot saat ini dinonaktifkan.]",
        } as ModelMessage;
      }

      const fallbackText = extractTextFromContent(content);
      if (!fallbackText) return null;

      return {
        role,
        content: clampText(fallbackText, MAX_MODEL_INPUT_TEXT_CHARS),
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
- Image input is currently disabled in this chatbot.

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

const buildModelMessages = (messages: ModelMessage[]): ModelMessage[] => {
  const conversation = messages.filter((message) => message.role !== "system");
  const trimmedConversation = conversation.slice(-MAX_CONTEXT_MESSAGES);
  const prompt = buildSystemPrompt(trimmedConversation);

  return [{ role: "system", content: prompt }, ...trimmedConversation];
};

const toProviderMessages = (messages: ModelMessage[]): ProviderMessage[] => {
  return messages
    .map((message) => {
      const text = clampText(
        extractTextFromContent(message.content),
        MAX_MODEL_INPUT_TEXT_CHARS
      );
      if (!text) return null;
      return {
        role: message.role,
        content: text,
      };
    })
    .filter((message): message is ProviderMessage => message !== null);
};

const getRemainingBudgetMs = (routeStartedAt: number): number => {
  return Math.max(0, TOTAL_BUDGET_MS - (Date.now() - routeStartedAt));
};

const toLogText = (value: string): string => {
  return clampText(value, ERROR_LOG_TEXT_MAX_CHARS);
};

const isAsyncIterable = (value: unknown): value is AsyncIterable<unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof (value as AsyncIterable<unknown>)[Symbol.asyncIterator] === "function"
  );
};

const extractTextFromUnknown = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => extractTextFromUnknown(item)).join("");
  }

  if (value && typeof value === "object") {
    const candidate = value as { type?: unknown; text?: unknown };

    if (candidate.type === "text" && typeof candidate.text === "string") {
      return candidate.text;
    }

    if (typeof candidate.text === "string") {
      return candidate.text;
    }
  }

  return "";
};

const extractTextFromProviderChunk = (chunk: unknown): string => {
  if (!chunk || typeof chunk !== "object") {
    return "";
  }

  const asChunk = chunk as {
    choices?: Array<{
      delta?: { content?: unknown };
      message?: { content?: unknown };
      text?: unknown;
    }>;
    output_text?: unknown;
    content?: unknown;
  };

  if (Array.isArray(asChunk.choices) && asChunk.choices.length > 0) {
    return asChunk.choices
      .map((choice) => {
        if (choice.delta) {
          const deltaText = extractTextFromUnknown(choice.delta.content);
          if (deltaText.length > 0) return deltaText;
        }

        if (choice.message) {
          const messageText = extractTextFromUnknown(choice.message.content);
          if (messageText.length > 0) return messageText;
        }

        return extractTextFromUnknown(choice.text);
      })
      .join("");
  }

  const outputText = extractTextFromUnknown(asChunk.output_text);
  if (outputText.length > 0) {
    return outputText;
  }

  return extractTextFromUnknown(asChunk.content);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown error";
};

const getErrorStatusCode = (error: unknown): number | null => {
  if (!error || typeof error !== "object") {
    return null;
  }

  const candidate = error as {
    status?: unknown;
    statusCode?: unknown;
    response?: { status?: unknown };
    error?: { status?: unknown; statusCode?: unknown };
  };

  const possibleStatus = [
    candidate.status,
    candidate.statusCode,
    candidate.response?.status,
    candidate.error?.status,
    candidate.error?.statusCode,
  ];

  for (const value of possibleStatus) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
};

const isQuotaExceededError = (errorText: string): boolean => {
  const normalized = errorText.toLowerCase();
  return QUOTA_EXCEEDED_MARKERS.some((marker) => normalized.includes(marker));
};

const isAuthErrorText = (errorText: string): boolean => {
  const normalized = errorText.toLowerCase();
  return AUTH_ERROR_MARKERS.some((marker) => normalized.includes(marker));
};

const createAbortError = (): DOMException => {
  return new DOMException("Client aborted request", "AbortError");
};

const parseModelList = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((model) => model.trim())
    .filter((model) => model.length > 0);
};

const unique = (list: string[]): string[] => {
  return Array.from(new Set(list));
};

const resolveModelOrder = (): string[] => {
  const envPrimary = process.env.CEREBRAS_MODEL?.trim();
  const envFallbacks = parseModelList(CEREBRAS_MODEL_FALLBACKS);

  const primary = envPrimary || DEFAULT_CEREBRAS_MODEL;
  const fallbacks =
    envFallbacks.length > 0 ? envFallbacks : DEFAULT_CEREBRAS_FALLBACK_MODELS;

  return unique([primary, ...fallbacks]);
};

const requestCerebrasCompletion = async (
  model: string,
  messages: ProviderMessage[],
  requestSignal: AbortSignal,
  routeStartedAt: number
): Promise<unknown> => {
  if (!cerebrasClient) {
    throw createRouteError({
      code: "AUTH_ERROR",
      message: "AUTH_ERROR: CEREBRAS_API_KEY belum diset di server.",
      attempts: 1,
      fallbackIndex: 0,
      modelUsed: model,
      statusCode: 500,
    });
  }

  if (requestSignal.aborted) {
    throw createAbortError();
  }

  const remainingBudgetMs = getRemainingBudgetMs(routeStartedAt);
  if (remainingBudgetMs <= 0) {
    throw new Error("TOTAL_BUDGET_TIMEOUT");
  }

  const connectTimeoutMs = Math.min(REQUEST_CONNECT_TIMEOUT_MS, remainingBudgetMs);

  return await new Promise<unknown>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      requestSignal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createAbortError());
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("CONNECT_TIMEOUT"));
    }, connectTimeoutMs);

    requestSignal.addEventListener("abort", onAbort, { once: true });

    cerebrasClient.chat.completions
      .create({
        model,
        messages,
        stream: true,
        max_completion_tokens: 1800,
        temperature: 0.4,
        top_p: 1,
      })
      .then((completion) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(completion);
      })
      .catch((error: unknown) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });
  });
};

const readIteratorNextWithTimeout = async (
  iterator: AsyncIterator<unknown>,
  timeoutMs: number,
  signal: AbortSignal,
  timeoutLabel: string
): Promise<IteratorResult<unknown>> => {
  if (signal.aborted) {
    throw createAbortError();
  }

  return await new Promise<IteratorResult<unknown>>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      signal.removeEventListener("abort", onAbort);
    };

    const onAbort = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(createAbortError());
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(timeoutLabel));
    }, timeoutMs);

    signal.addEventListener("abort", onAbort, { once: true });

    iterator
      .next()
      .then((result) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(result);
      })
      .catch((error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });
  });
};

const probeFirstVisibleContent = async (
  completion: unknown,
  requestSignal: AbortSignal,
  routeStartedAt: number
): Promise<ProviderProbeResult> => {
  if (isAsyncIterable(completion)) {
    const iterator = completion[Symbol.asyncIterator]();

    while (true) {
      if (requestSignal.aborted) {
        throw createAbortError();
      }

      const remainingBudgetMs = getRemainingBudgetMs(routeStartedAt);
      if (remainingBudgetMs <= 0) {
        throw new Error("TOTAL_BUDGET_TIMEOUT");
      }

      const readTimeoutMs = Math.min(FIRST_TOKEN_TIMEOUT_MS, remainingBudgetMs);
      const result = await readIteratorNextWithTimeout(
        iterator,
        readTimeoutMs,
        requestSignal,
        "FIRST_TOKEN_TIMEOUT"
      );

      if (result.done) {
        throw new Error("EMPTY_STREAM");
      }

      const content = extractTextFromProviderChunk(result.value);
      if (content.length > 0) {
        return {
          prefetchedContent: content,
          iterator,
        };
      }
    }
  }

  const content = extractTextFromProviderChunk(completion);
  if (content.length === 0) {
    throw new Error("EMPTY_STREAM");
  }

  return {
    prefetchedContent: content,
    iterator: null,
  };
};

const createPlainTextStream = (
  probeResult: ProviderProbeResult,
  options: {
    clientSignal: AbortSignal;
    routeStartedAt: number;
  }
): ReadableStream<Uint8Array> => {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      let emittedChars = 0;

      const emitChunk = (content: string) => {
        if (!content) return;

        const remainingChars = MAX_STREAM_OUTPUT_CHARS - emittedChars;
        if (remainingChars <= 0) return;

        const safeContent = content.slice(0, Math.max(0, remainingChars));
        if (safeContent.length <= 0) return;

        controller.enqueue(encoder.encode(safeContent));
        emittedChars += safeContent.length;
      };

      const closeIterator = async () => {
        if (!probeResult.iterator?.return) {
          return;
        }

        try {
          await probeResult.iterator.return();
        } catch {
          // Ignore iterator close errors.
        }
      };

      try {
        emitChunk(probeResult.prefetchedContent);

        if (!probeResult.iterator || emittedChars >= MAX_STREAM_OUTPUT_CHARS) {
          controller.close();
          return;
        }

        while (true) {
          if (options.clientSignal.aborted) {
            throw createAbortError();
          }

          const remainingBudgetMs = getRemainingBudgetMs(options.routeStartedAt);
          if (remainingBudgetMs <= 0) {
            throw new Error("TOTAL_BUDGET_TIMEOUT");
          }

          const readTimeoutMs = Math.min(STREAM_STALL_TIMEOUT_MS, remainingBudgetMs);
          const result = await readIteratorNextWithTimeout(
            probeResult.iterator,
            readTimeoutMs,
            options.clientSignal,
            "STREAM_STALL_TIMEOUT"
          );

          if (result.done) {
            break;
          }

          const content = extractTextFromProviderChunk(result.value);
          emitChunk(content);

          if (emittedChars >= MAX_STREAM_OUTPUT_CHARS) {
            break;
          }
        }

        controller.close();
      } catch {
        await closeIterator();
        controller.close();
      }
    },
  });
};

const mapProviderErrorToRouteError = (
  error: unknown,
  model: string,
  attempts: number,
  fallbackIndex: number
): RouteError => {
  if (isRouteError(error)) {
    return error;
  }

  const message = getErrorMessage(error);
  const statusCode = getErrorStatusCode(error);
  const normalizedMessage = message.toLowerCase();

  const timeoutLikeError =
    message === "CONNECT_TIMEOUT" ||
    message === "FIRST_TOKEN_TIMEOUT" ||
    message === "STREAM_STALL_TIMEOUT" ||
    message === "TOTAL_BUDGET_TIMEOUT" ||
    message === "EMPTY_STREAM";

  if (timeoutLikeError) {
    return createRouteError({
      code: "TIMEOUT",
      message: `TIMEOUT (${model}): ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 500,
    });
  }

  if (statusCode === 401 || statusCode === 403 || isAuthErrorText(normalizedMessage)) {
    return createRouteError({
      code: "AUTH_ERROR",
      message: `AUTH_ERROR: ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 401,
    });
  }

  if (statusCode === 429 && isQuotaExceededError(normalizedMessage)) {
    return createRouteError({
      code: "QUOTA_EXCEEDED",
      message: `QUOTA_EXCEEDED: ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 429,
    });
  }

  if (statusCode === 429) {
    return createRouteError({
      code: "RATE_LIMITED",
      message: `RATE_LIMITED (${model}): ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 429,
    });
  }

  if (statusCode === 400) {
    return createRouteError({
      code: "BAD_REQUEST",
      message: `BAD_REQUEST (${model}): ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 400,
    });
  }

  if (statusCode === 503 || statusCode === 502 || statusCode === 504) {
    return createRouteError({
      code: "PROVIDER_UNAVAILABLE",
      message: `PROVIDER_UNAVAILABLE (${model}): ${message}`,
      attempts,
      fallbackIndex,
      modelUsed: model,
      statusCode: 503,
    });
  }

  return createRouteError({
    code: "UPSTREAM_ERROR",
    message: `UPSTREAM_ERROR (${model}): ${message}`,
    attempts,
    fallbackIndex,
    modelUsed: model,
    statusCode: statusCode && statusCode >= 400 && statusCode < 600 ? statusCode : 500,
  });
};

export async function POST(request: NextRequest) {
  const routeStartedAt = Date.now();

  if (!CEREBRAS_API_KEY || !cerebrasClient) {
    return new Response("CEREBRAS_API_KEY belum diset di server.", {
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
  const providerMessages = toProviderMessages(modelMessages);

  if (providerMessages.length === 0) {
    return new Response("messages tidak memiliki konten teks valid.", {
      status: 400,
    });
  }

  try {
    const modelOrder = resolveModelOrder();
    let lastError: RouteError | null = null;

    for (let index = 0; index < modelOrder.length; index += 1) {
      const model = modelOrder[index];
      const attempts = index + 1;

      try {
        const completion = await requestCerebrasCompletion(
          model,
          providerMessages,
          request.signal,
          routeStartedAt
        );

        const probeResult = await probeFirstVisibleContent(
          completion,
          request.signal,
          routeStartedAt
        );

        const stream = createPlainTextStream(probeResult, {
          clientSignal: request.signal,
          routeStartedAt,
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "x-chatbot-model-used": model,
            "x-chatbot-attempts": String(attempts),
            "x-chatbot-fallback-index": String(index),
            "x-chatbot-route-time-ms": String(Date.now() - routeStartedAt),
          },
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw error;
        }

        const mappedError = mapProviderErrorToRouteError(
          error,
          model,
          attempts,
          index
        );

        console.error("[chatbot][model-attempt-fail]", {
          model,
          attempts,
          fallbackIndex: index,
          code: mappedError.code,
          message: toLogText(mappedError.message),
        });

        // Error yang tidak akan terselesaikan dengan fallback model.
        if (mappedError.code === "AUTH_ERROR" || mappedError.code === "BAD_REQUEST") {
          throw mappedError;
        }

        lastError = mappedError;
      }
    }

    throw (
      lastError ||
      createRouteError({
        code: "UPSTREAM_ERROR",
        message: "UPSTREAM_ERROR: Semua model fallback gagal merespons.",
        attempts: 1,
        fallbackIndex: 0,
        modelUsed: modelOrder[0] || CEREBRAS_MODEL,
        statusCode: 500,
      })
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }

    const routeError = isRouteError(error)
      ? error
      : mapProviderErrorToRouteError(error, CEREBRAS_MODEL, 1, 0);
    const attempts = routeError.attempts;
    const fallbackIndex = routeError.fallbackIndex;
    const modelUsed = routeError.modelUsed;
    const statusCode = routeError.statusCode;
    const retryAfterMs = routeError.retryAfterMs;
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

    const respond = (status: number, failureReason: string, bodyText: string) => {
      console.error("[chatbot][route-fail]", {
        status,
        failureReason,
        attempts,
        fallbackIndex,
        modelUsed,
        elapsedMs: Number(elapsedMs),
        message: toLogText(message),
      });

      return new Response(bodyText, {
        status,
        headers: {
          ...diagnosticHeaders,
          "x-chatbot-failure-reason": failureReason,
        },
      });
    };

    if (routeError.code === "AUTH_ERROR") {
      return respond(401, "auth_error", "Autentikasi model gagal di server.");
    }

    if (routeError.code === "QUOTA_EXCEEDED") {
      return respond(
        429,
        "quota_exceeded",
        "Kuota gratis Cerebras habis. Tunggu reset kuota atau gunakan model lain yang tersedia."
      );
    }

    if (routeError.code === "RATE_LIMITED") {
      return respond(
        429,
        "rate_limited",
        "Rate limit Cerebras tercapai. Tunggu sebentar lalu coba lagi."
      );
    }

    if (routeError.code === "PROVIDER_UNAVAILABLE") {
      return respond(
        503,
        "provider_unavailable",
        "Provider model sedang tidak tersedia untuk request ini. Silakan coba lagi beberapa saat."
      );
    }

    if (routeError.code === "BAD_REQUEST") {
      return respond(400, "bad_request", "Payload chatbot tidak valid.");
    }

    if (routeError.code === "TIMEOUT") {
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
