export type ChatRole = "system" | "user" | "assistant";

export interface MessageContentText {
  type: "text";
  text: string;
}

export interface MessageContentImage {
  type: "image_url";
  image_url: {
    url: string;
  };
}

export type MessageContent = MessageContentText | MessageContentImage;

export interface Message {
  id: string;
  role: ChatRole;
  content: string | MessageContent[];
  timestamp: Date;
  model?: string;
  isStreaming?: boolean;
  images?: string[];
}

export type ChatModelMode = "auto";

export interface ChatbotState {
  messages: Message[];
  isLoading: boolean;
  selectedModelId: string;
  selectedMode: ChatModelMode;
  error: string | null;
  isStreaming: boolean;
  editingMessageId: string | null;
  isEditing: boolean;
}

export interface SendMessageParams {
  content: string;
  images?: string[];
  onStream?: (chunk: string) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export interface HandleModelFallbackOptions {
  selectedModelId: string;
  hasImages: boolean;
  userText: string;
}

export interface HandleModelFallbackResult {
  content: string;
  model: string;
}

export interface ChatApiMessage {
  role: ChatRole;
  content: string | MessageContent[];
  timestamp?: string;
  model?: string;
  images?: string[];
}

export interface ChatApiRequest {
  messages: ChatApiMessage[];
  selectedModelId: string;
  hasImages: boolean;
  userText: string;
}

export interface ChatStreamMetaEvent {
  type: "meta";
  model: string;
}

export interface ChatStreamTokenEvent {
  type: "token";
  text: string;
}

export interface ChatStreamDoneEvent {
  type: "done";
  model: string;
  text: string;
}

export interface ChatStreamErrorEvent {
  type: "error";
  error: string;
  model?: string;
}

export type ChatStreamEvent =
  | ChatStreamMetaEvent
  | ChatStreamTokenEvent
  | ChatStreamDoneEvent
  | ChatStreamErrorEvent;
