export type ChatRole = "system" | "user" | "assistant";

export interface ChatMessage {
	role: ChatRole;
	content: string;
}

export interface ChatRequestBody {
	messages: ChatMessage[];
	model?: string;
}

export interface ChatChoiceMessage {
	role: ChatRole;
	content: string;
}

export interface ChatChoice {
	index: number;
	message: ChatChoiceMessage;
}

export interface ChatCompletionResponse {
	id: string;
	created: number;
	model: string;
	choices: ChatChoice[];
}


