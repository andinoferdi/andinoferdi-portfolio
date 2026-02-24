import { type ChatHistory, type Message, type MessageContent } from "@/types/chatbot";

export const AUTO_MODEL_ID = "auto";
export type RuntimeRoute = "internal/chatbot";
export const DEFAULT_ROUTE_MODEL: RuntimeRoute = "internal/chatbot";

const MAX_IMAGES_PER_REQUEST = 3;
const MAX_TOTAL_IMAGE_BASE64_CHARS = 8_500_000;
const MAX_CONTEXT_MESSAGES = 6;
const MAX_TEXT_CHARS_PER_MESSAGE = 1800;
const MAX_TEXT_CHARS_PER_PART = 700;
const MAX_OLD_ASSISTANT_CHARS = 1000;
const MAX_NETWORK_RETRIES = 2;
const RETRY_DELAY_MS = 250;
const FREE_MODEL_QUOTA_MARKERS = [
  "free-models-per-day",
  "unlock 1000 free model requests per day",
  "kuota harian model gratis habis",
];

export const TEXT_MODELS: string[] = [DEFAULT_ROUTE_MODEL];
export const VISION_MODELS: string[] = [DEFAULT_ROUTE_MODEL];
export const ALL_MODELS: Array<{
  id: string;
  name: string;
  family: "text";
  supportsVision: true;
  free: false;
  priority: 1;
}> = [
  {
    id: DEFAULT_ROUTE_MODEL,
    name: "Auto (Server Route)",
    family: "text",
    supportsVision: true,
    free: false,
    priority: 1,
  },
];
export const MODELS = [DEFAULT_ROUTE_MODEL];
export const MODEL_DISPLAY_NAMES = ["Auto (Server Route)"];

const MODEL_ID_NAME_MAP = new Map<string, string>([
  [AUTO_MODEL_ID, "Auto (Server Route)"],
  [DEFAULT_ROUTE_MODEL, "Auto (Server Route)"],
]);

const CHAT_HISTORY_KEY = "andinoferdi_chat_history";

type ChatRequestMessage = {
  role: "user" | "assistant";
  content: string | MessageContent[];
};

const wait = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const normalizeWhitespace = (value: string): string => {
  return value.replace(/\s+/g, " ").trim();
};

const clampText = (value: string, maxChars: number): string => {
  const clean = normalizeWhitespace(value);
  if (clean.length <= maxChars) {
    return clean;
  }

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

const summarizeAssistantText = (text: string): string => {
  const clean = normalizeWhitespace(text);
  if (clean.length <= MAX_OLD_ASSISTANT_CHARS) {
    return clean;
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let summary = "";
  for (const sentence of sentences) {
    const candidate = summary ? `${summary} ${sentence}` : sentence;
    if (candidate.length > MAX_OLD_ASSISTANT_CHARS) {
      break;
    }
    summary = candidate;
    if (summary.length >= MAX_OLD_ASSISTANT_CHARS * 0.8) {
      break;
    }
  }

  if (summary.length > 0) {
    return `${summary} [ringkas]`;
  }

  return `${clean.slice(0, MAX_OLD_ASSISTANT_CHARS)}...[ringkas]`;
};

const sanitizeMessageContent = (
  content: string | MessageContent[],
  role: "user" | "assistant",
  isOldAssistant: boolean
): string | MessageContent[] | null => {
  if (typeof content === "string") {
    const text =
      role === "assistant" && isOldAssistant
        ? summarizeAssistantText(content)
        : clampText(content, MAX_TEXT_CHARS_PER_MESSAGE);

    return text.length > 0 ? text : null;
  }

  if (!Array.isArray(content) || content.length === 0) {
    return null;
  }

  const sanitizedParts: MessageContent[] = [];
  let remainingTextBudget =
    role === "assistant" && isOldAssistant
      ? MAX_OLD_ASSISTANT_CHARS
      : MAX_TEXT_CHARS_PER_MESSAGE;

  for (const part of content) {
    if (part.type === "text" && typeof part.text === "string") {
      if (remainingTextBudget <= 0) {
        continue;
      }

      const normalizedPart =
        role === "assistant" && isOldAssistant
          ? summarizeAssistantText(part.text)
          : normalizeWhitespace(part.text);

      const limitedText = clampText(
        normalizedPart,
        Math.min(remainingTextBudget, MAX_TEXT_CHARS_PER_PART)
      );

      if (limitedText.length === 0) {
        continue;
      }

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
    const fallback = extractTextFromContent(content);
    if (!fallback) {
      return null;
    }

    return role === "assistant" && isOldAssistant
      ? summarizeAssistantText(fallback)
      : clampText(fallback, MAX_TEXT_CHARS_PER_MESSAGE);
  }

  return sanitizedParts;
};

const buildRequestMessages = (messages: Message[]): ChatRequestMessage[] => {
  const nonSystemMessages = messages.filter(
    (message): message is Message & { role: "user" | "assistant" } => {
      return message.role === "user" || message.role === "assistant";
    }
  );

  const trimmedConversation = nonSystemMessages.slice(-MAX_CONTEXT_MESSAGES);

  return trimmedConversation
    .map((message, index, list) => {
      const isOldAssistant =
        message.role === "assistant" && index < list.length - 2;
      const sanitizedContent = sanitizeMessageContent(
        message.content,
        message.role,
        isOldAssistant
      );

      if (!sanitizedContent) {
        return null;
      }

      return {
        role: message.role,
        content: sanitizedContent,
      } as ChatRequestMessage;
    })
    .filter((message): message is ChatRequestMessage => message !== null);
};

const estimateImagePayloadChars = (messages: ChatRequestMessage[]): {
  imageCount: number;
  totalBase64Chars: number;
} => {
  let imageCount = 0;
  let totalBase64Chars = 0;

  for (const message of messages) {
    if (!Array.isArray(message.content)) {
      continue;
    }

    for (const contentItem of message.content) {
      if (contentItem.type !== "image_url" || !contentItem.image_url?.url) {
        continue;
      }

      imageCount += 1;
      totalBase64Chars += contentItem.image_url.url.length;
    }
  }

  return { imageCount, totalBase64Chars };
};

const isFreeModelQuotaExceeded = (errorText: string): boolean => {
  const normalized = errorText.toLowerCase();
  return FREE_MODEL_QUOTA_MARKERS.some((marker) =>
    normalized.includes(marker)
  );
};

const mapStatusError = (status: number, errorText: string): Error => {
  if (status === 400) {
    return new Error(
      `BAD_REQUEST: ${errorText || "Format request chatbot tidak valid."}`
    );
  }

  if (status === 401) {
    return new Error("AUTH_ERROR: Autentikasi chatbot gagal di server.");
  }

  if (status === 413) {
    return new Error(
      "IMAGE_PAYLOAD_TOO_LARGE: Ukuran total gambar terlalu besar."
    );
  }

  if (status === 429) {
    if (isFreeModelQuotaExceeded(errorText)) {
      return new Error(
        "FREE_MODEL_QUOTA_EXCEEDED: Kuota harian model gratis habis."
      );
    }
    return new Error("RATE_LIMITED: Rate limit OpenRouter tercapai.");
  }

  if (status === 503) {
    return new Error(
      "PROVIDER_UNAVAILABLE: Provider model gratis sedang tidak tersedia."
    );
  }

  if (status === 499) {
    return new DOMException("The operation was aborted.", "AbortError");
  }

  if (status >= 500) {
    return new Error(`SERVER_ERROR: ${errorText || "Server chatbot gagal."}`);
  }

  return new Error(`API_ERROR (${status}): ${errorText || "Unknown error"}`);
};

export const getModelDisplayName = (modelId?: string): string => {
  if (!modelId) {
    return "Auto (Server Route)";
  }

  return MODEL_ID_NAME_MAP.get(modelId) || modelId;
};

export const sendChatMessage = async (
  messages: Message[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<{ content: string; model: string }> => {
  const requestMessages = buildRequestMessages(messages);

  if (requestMessages.length === 0) {
    throw new Error("BAD_REQUEST: Percakapan kosong atau tidak valid.");
  }

  const payloadEstimate = estimateImagePayloadChars(requestMessages);

  if (payloadEstimate.imageCount > MAX_IMAGES_PER_REQUEST) {
    throw new Error(
      `IMAGE_LIMIT: Maksimal ${MAX_IMAGES_PER_REQUEST} gambar per pesan.`
    );
  }

  if (payloadEstimate.totalBase64Chars > MAX_TOTAL_IMAGE_BASE64_CHARS) {
    throw new Error(
      "IMAGE_PAYLOAD_TOO_LARGE: Ukuran total gambar terlalu besar. Kurangi jumlah gambar atau kompres gambar."
    );
  }

  let response: Response | null = null;
  let lastNetworkError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_NETWORK_RETRIES; attempt += 1) {
    try {
      response = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: requestMessages }),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw mapStatusError(response.status, errorText.trim());
      }

      lastNetworkError = null;
      break;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const isMappedStatusError =
        errorMessage.startsWith("BAD_REQUEST:") ||
        errorMessage.startsWith("AUTH_ERROR:") ||
        errorMessage.startsWith("IMAGE_LIMIT:") ||
        errorMessage.startsWith("IMAGE_PAYLOAD_TOO_LARGE:") ||
        errorMessage.startsWith("FREE_MODEL_QUOTA_EXCEEDED:") ||
        errorMessage.startsWith("RATE_LIMITED:") ||
        errorMessage.startsWith("PROVIDER_UNAVAILABLE:") ||
        errorMessage.startsWith("SERVER_ERROR:") ||
        errorMessage.startsWith("API_ERROR");

      if (isMappedStatusError) {
        throw (error instanceof Error ? error : new Error(errorMessage));
      }

      lastNetworkError = new Error(`NETWORK_ERROR: ${errorMessage}`);

      if (attempt < MAX_NETWORK_RETRIES) {
        await wait(RETRY_DELAY_MS);
        continue;
      }

      throw lastNetworkError;
    }
  }

  if (!response || !response.ok) {
    throw (
      lastNetworkError ||
      new Error("SERVER_ERROR: Gagal terhubung ke server chatbot.")
    );
  }

  const modelFromHeader =
    response.headers.get("x-chatbot-model-used") || DEFAULT_ROUTE_MODEL;
  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error("SERVER_ERROR: Stream respons chatbot tidak tersedia.");
  }

  const decoder = new TextDecoder();
  let fullContent = "";

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException("The operation was aborted.", "AbortError");
      }

      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) {
        continue;
      }

      fullContent += chunk;
      onStream?.(chunk);
    }

    const flushChunk = decoder.decode();
    if (flushChunk) {
      fullContent += flushChunk;
      onStream?.(flushChunk);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    const message = error instanceof Error ? error.message : "stream failed";
    throw new Error(`NETWORK_ERROR: ${message}`);
  } finally {
    reader.releaseLock();
  }

  if (fullContent.trim().length === 0) {
    throw new Error("EMPTY_RESPONSE: Chatbot mengembalikan respons kosong.");
  }

  return {
    content: fullContent,
    model: modelFromHeader,
  };
};

export const handleModelFallback = async (
  messages: Message[],
  options: {
    selectedModelId: string;
    hasImages: boolean;
    userText: string;
  },
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<{ content: string; model: string; finalModelId: string }> => {
  void options;
  try {
    const result = await sendChatMessage(messages, onStream, signal);

    return {
      content: result.content,
      model: result.model,
      finalModelId: result.model,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.startsWith("BAD_REQUEST:")) {
      throw new Error(
        "Permintaan tidak valid. Periksa format teks atau gambar lalu coba lagi."
      );
    }
    if (errorMessage.startsWith("AUTH_ERROR:")) {
      throw new Error("Autentikasi chatbot gagal di server.");
    }
    if (errorMessage.startsWith("IMAGE_LIMIT:")) {
      throw new Error(errorMessage.replace("IMAGE_LIMIT: ", ""));
    }
    if (errorMessage.startsWith("IMAGE_PAYLOAD_TOO_LARGE:")) {
      throw new Error(
        errorMessage.replace("IMAGE_PAYLOAD_TOO_LARGE: ", "")
      );
    }
    if (errorMessage.startsWith("FREE_MODEL_QUOTA_EXCEEDED:")) {
      throw new Error(
        "Kuota harian model gratis habis. Tunggu reset kuota OpenRouter atau tambahkan kredit."
      );
    }
    if (errorMessage.startsWith("RATE_LIMITED:")) {
      throw new Error("Rate limit OpenRouter tercapai. Tunggu sebentar lalu coba lagi.");
    }
    if (errorMessage.startsWith("PROVIDER_UNAVAILABLE:")) {
      throw new Error(
        "Provider model gratis sedang tidak tersedia untuk request ini. Coba lagi beberapa saat."
      );
    }
    if (errorMessage.startsWith("EMPTY_RESPONSE:")) {
      throw new Error("Chatbot mengembalikan respons kosong. Silakan coba lagi.");
    }
    if (errorMessage.startsWith("API_ERROR (400):")) {
      throw new Error("Permintaan tidak valid. Periksa format teks atau gambar lalu coba lagi.");
    }
    if (errorMessage.startsWith("SERVER_ERROR:")) {
      throw new Error("Server chatbot sementara bermasalah. Silakan coba lagi nanti.");
    }

    throw (error instanceof Error ? error : new Error(errorMessage));
  }
};

export const saveChatHistory = (messages: Message[]): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const chatHistory: ChatHistory = {
      messages,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
};

export const loadChatHistory = (): Message[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) {
      return [];
    }

    const chatHistory: ChatHistory = JSON.parse(stored);

    return chatHistory.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    }));
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
};

export const clearChatHistory = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

