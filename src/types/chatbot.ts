export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatbotState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
}

export interface ChatbotConfig {
  model: string;
  systemPrompt: string;
  maxMessages: number;
  temperature: number;
}

export interface ChatbotResponse {
  message: string;
  success: boolean;
  error?: string;
}

export interface ChatbotData {
  config: ChatbotConfig;
  initialMessages: ChatMessage[];
}
