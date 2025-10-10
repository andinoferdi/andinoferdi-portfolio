import { NextRequest, NextResponse } from "next/server";
import {
  getChatbotData,
  formatMessagesForAPI,
  validateMessage,
  sanitizeMessage,
} from "@/services/chatbot";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENROUTER_API_KEY" },
        { status: 500 }
      );
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request: messages array is required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json(
        { error: "Invalid request: last message must be from user" },
        { status: 400 }
      );
    }

    const validation = validateMessage(lastMessage.content);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const chatbotData = getChatbotData();
    const apiMessages = formatMessagesForAPI(
      messages,
      chatbotData.config.systemPrompt
    );

    const refererFromReq = request.headers.get("referer");

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          refererFromReq ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          "https://andinoferdi.vercel.app",
        "X-Title": "AndinoFerdi Portfolio",
      },
      body: JSON.stringify({
        model: chatbotData.config.model,
        messages: apiMessages,
        temperature: chatbotData.config.temperature,
        max_tokens: 1000,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter API error:", errorText);
      return NextResponse.json(
        { error: "Failed to get response from AI service", details: errorText },
        { status: 500 }
      );
    }

    const data = await res.json();

    if (!data?.choices?.[0]?.message?.content) {
      return NextResponse.json(
        { error: "Invalid response from AI service" },
        { status: 500 }
      );
    }

    const assistantMessage = sanitizeMessage(data.choices[0].message.content);
    return NextResponse.json({ message: assistantMessage, success: true });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
