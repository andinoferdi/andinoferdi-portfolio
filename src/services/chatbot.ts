import { type ChatMessage, type ChatCompletionResponse } from "@/types/chatbot";

export async function sendChatRequest(messages: ChatMessage[], model?: string): Promise<ChatCompletionResponse> {
	const res = await fetch("/api/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ messages, model }),
		cache: "no-store",
	});
	if (!res.ok) {
		throw new Error("Failed to get response");
	}
	return res.json();
}


