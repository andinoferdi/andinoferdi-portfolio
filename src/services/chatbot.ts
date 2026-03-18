import {
  type ChatApiMessage,
  type ChatApiRequest,
  type ChatStreamEvent,
  type HandleModelFallbackOptions,
  type HandleModelFallbackResult,
  type Message,
  type MessageContent,
} from "@/types/chatbot";

export const AUTO_MODEL_ID = "auto";
export const CHAT_HISTORY_KEY = "andino_chat_history_v1";
const MAX_MESSAGE_HISTORY = 24;

const MODEL_DISPLAY_NAME_MAP: Record<string, string> = {
  [AUTO_MODEL_ID]: "Auto (Cerebras Fallback)",
  "gpt-oss-120b": "GPT-OSS 120B",
  "llama3.1-8b": "Llama 3.1 8B",
  "zai-glm-4.7": "ZAI GLM 4.7",
  "qwen-3-235b-a22b-instruct-2507": "Qwen 3 235B Instruct",
  "qwen-3-235b-a22b-thinking-2507": "Qwen 3 235B Thinking",
};

const isBrowser = (): boolean => typeof window !== "undefined";

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
};

const toPlainTextContent = (content: string | MessageContent[]): string => {
  if (typeof content === "string") return content;

  return content
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n")
    .trim();
};

const serializeMessagesForApi = (messages: Message[]): ChatApiMessage[] => {
  return messages.slice(-MAX_MESSAGE_HISTORY).map((message) => ({
    role: message.role,
    content: message.content,
    timestamp: message.timestamp?.toISOString(),
    model: message.model,
    images: message.images,
  }));
};

const parseChatHistory = (raw: string): Message[] => {
  try {
    const parsed = JSON.parse(raw) as Array<
      Omit<Message, "timestamp"> & { timestamp: string }
    >;

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }))
      .filter((item) => !Number.isNaN(item.timestamp.getTime()));
  } catch {
    return [];
  }
};

const readChatHistory = (): Message[] => {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(CHAT_HISTORY_KEY);
  if (!raw) return [];
  return parseChatHistory(raw);
};

const parseSseChatStream = async (
  stream: ReadableStream<Uint8Array>,
  signal?: AbortSignal,
  onChunk?: (chunk: string) => void
): Promise<HandleModelFallbackResult> => {
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let buffered = "";
  let eventDataLines: string[] = [];
  let resolvedModel = "unknown";
  let generatedText = "";
  let receivedDone = false;

  const flushEvent = () => {
    if (!eventDataLines.length) return;
    const data = eventDataLines.join("\n").trim();
    eventDataLines = [];
    if (!data) return;

    let event: ChatStreamEvent;
    try {
      event = JSON.parse(data) as ChatStreamEvent;
    } catch {
      throw new Error("Invalid stream payload from /api/chatbot.");
    }

    if (event.type === "meta") {
      resolvedModel = event.model;
      return;
    }

    if (event.type === "token") {
      generatedText += event.text;
      onChunk?.(event.text);
      return;
    }

    if (event.type === "done") {
      resolvedModel = event.model;
      generatedText = event.text ?? generatedText;
      receivedDone = true;
      return;
    }

    if (event.type === "error") {
      throw new Error(event.error || "Chatbot stream error.");
    }
  };

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffered += decoder.decode(value, { stream: true });

      while (true) {
        const newlineIndex = buffered.indexOf("\n");
        if (newlineIndex === -1) break;

        const rawLine = buffered.slice(0, newlineIndex);
        buffered = buffered.slice(newlineIndex + 1);
        const line = rawLine.endsWith("\r")
          ? rawLine.slice(0, -1)
          : rawLine;

        if (!line) {
          flushEvent();
          continue;
        }

        if (line.startsWith("data:")) {
          eventDataLines.push(line.slice(5).trimStart());
        }
      }
    }

    buffered += decoder.decode();
    if (buffered.trim()) {
      const fallbackLines = buffered.split(/\r?\n/);
      for (const rawLine of fallbackLines) {
        const line = rawLine.trimEnd();
        if (!line) {
          flushEvent();
          continue;
        }

        if (line.startsWith("data:")) {
          eventDataLines.push(line.slice(5).trimStart());
        }
      }
    }

    flushEvent();
  } finally {
    reader.releaseLock();
  }

  if (!receivedDone && !signal?.aborted) {
    throw new Error("Chat stream ended unexpectedly.");
  }

  return {
    content: generatedText,
    model: resolvedModel,
  };
};

export const generateMessageId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export const formatTimestamp = (value: Date | string): string => {
  const timestamp = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "--:--";

  const hours = String(timestamp.getHours()).padStart(2, "0");
  const minutes = String(timestamp.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

export const getModelDisplayName = (modelId: string): string => {
  if (!modelId) return MODEL_DISPLAY_NAME_MAP[AUTO_MODEL_ID];
  return MODEL_DISPLAY_NAME_MAP[modelId] ?? modelId;
};

export const saveChatHistory = (messages: Message[]): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      CHAT_HISTORY_KEY,
      JSON.stringify(messages.slice(-MAX_MESSAGE_HISTORY))
    );
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
};

export const clearChatHistory = (): void => {
  if (!isBrowser()) return;

  try {
    window.localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
};

export const loadChatHistory = (): Message[] => {
  return readChatHistory();
};

export const handleModelFallback = async (
  messages: Message[],
  options: HandleModelFallbackOptions,
  onChunk?: (chunk: string) => void,
  abortSignal?: AbortSignal
): Promise<HandleModelFallbackResult> => {
  const normalizedMessages = serializeMessagesForApi(messages);
  const normalizedUserText = options.userText.trim();
  const hasHistoryContent = normalizedMessages.some(
    (message) => toPlainTextContent(message.content).length > 0
  );

  if (!normalizedUserText && !hasHistoryContent) {
    throw new Error("No valid message content to send.");
  }

  const requestPayload: ChatApiRequest = {
    messages: normalizedMessages,
    selectedModelId: options.selectedModelId || AUTO_MODEL_ID,
    hasImages: options.hasImages,
    userText: normalizedUserText,
  };

  const response = await fetch("/api/chatbot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
    signal: abortSignal,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const errorMessage =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Chat request failed with status ${response.status}.`;
    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("Chat response stream is empty.");
  }

  try {
    const parsed = await parseSseChatStream(response.body, abortSignal, onChunk);

    if (!parsed.content.trim()) {
      throw new Error("Model returned an empty response.");
    }

    return parsed;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }
    throw new Error(getErrorMessage(error));
  }
};
