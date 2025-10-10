import { NextRequest, NextResponse } from "next/server";
import { type ChatRequestBody, type ChatCompletionResponse, type ChatMessage } from "@/types/chatbot";
import { buildPortfolioSystemPrompt } from "@/services/chatbot-knowledge";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as ChatRequestBody;
		const model = body.model ?? "openai/gpt-4o";

		if (!process.env.OPENROUTER_API_KEY) {
			return NextResponse.json({ error: "Missing OPENROUTER_API_KEY" }, { status: 500 });
		}

		const systemMessage: ChatMessage = {
			role: "system",
			content: buildPortfolioSystemPrompt(),
		};

		const res = await fetch(OPENROUTER_API_URL, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
				"Content-Type": "application/json",
				"HTTP-Referer": req.headers.get("referer") ?? "https://andinoferdi-portfolio",
				"X-Title": "AndinoFerdi Portfolio",
			},
			body: JSON.stringify({
				model,
				messages: [systemMessage, ...body.messages],
				stream: false,
			}),
		});

		if (!res.ok) {
			const text = await res.text();
			return NextResponse.json({ error: "Upstream error", details: text }, { status: res.status });
		}

		const data = (await res.json()) as ChatCompletionResponse;
		return NextResponse.json(data);
	} catch {
		return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
	}
}


