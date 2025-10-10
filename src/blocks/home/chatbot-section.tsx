"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendChatRequest } from "@/services/chatbot";
import type { ChatMessage } from "@/types/chatbot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/input";
import { RightScrollBar } from "@/components/ui/right-scroll-bar";

interface ChatMessageItemProps {
	message: ChatMessage;
}

const ChatMessageItem = ({ message }: ChatMessageItemProps) => {
	const isUser = message.role === "user";
	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}
			role="listitem"
			aria-label={isUser ? "User message" : "Assistant message"}
		>
			<div className={cn(
				"max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed",
				isUser ? "bg-foreground text-background" : "bg-muted text-foreground border border-border"
			)}>
				{message.content}
			</div>
		</div>
	);
};

export const ChatbotSection = () => {
	const inputRef = useRef<HTMLTextAreaElement | null>(null);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>([{
		role: "system",
		content: "You are a helpful assistant for Andino Ferdiansah's portfolio website.",
	}]);

	const visibleMessages = useMemo(() => messages.filter(m => m.role !== "system"), [messages]);

	useEffect(() => {
		const el = inputRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = Math.min(160, el.scrollHeight) + "px";
	}, [input]);

	const handleSend = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		const newUserMessage: ChatMessage = { role: "user", content: trimmed };
		setInput("");
		setMessages(prev => [...prev, newUserMessage]);
		setIsLoading(true);
		try {
			const response = await sendChatRequest([...messages, newUserMessage]);
			const assistant = response.choices?.[0]?.message;
			if (assistant) {
				setMessages(prev => [...prev, { role: assistant.role, content: assistant.content }]);
			}
		} catch {
			setMessages(prev => [...prev, { role: "assistant", content: "Maaf, terjadi kesalahan. Coba lagi." }]);
		} finally {
			setIsLoading(false);
		}
	}, [input, isLoading, messages]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	return (
    <section className="py-20 px-4" aria-label="Chatbot">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-3">
            Chatbot
          </h2>
          <p className="text-lg text-muted-foreground">
            Ask anything about this portfolio.
          </p>
        </div>
        <Card variant="elevated" className="border-border/70">
          <CardHeader padding="sm">
            <CardTitle size="sm" className="text-muted-foreground">
              Assistant
            </CardTitle>
          </CardHeader>
          <CardContent padding="sm" className="space-y-4">
            <div className="pr-1">
              <RightScrollBar maxHeight={420} role="list" className="space-y-3 pr-4">
              {visibleMessages.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Mulai percakapan di bawah.
                </div>
              )}
              {visibleMessages.map((m, i) => (
                <ChatMessageItem key={i} message={m} />
              ))}
              {isLoading && (
                <div
                  className="flex justify-start"
                  role="status"
                  aria-live="polite"
                >
                  <div className="rounded-xl px-3 py-2 text-sm bg-muted text-foreground border border-border">
                    Sedang menulis...
                  </div>
                </div>
              )}
              </RightScrollBar>
            </div>
            <div className="flex items-end gap-2">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tulis pesan dan tekan Enter untuk kirim"
                uiSize="default"
                radius="default"
                variant="default"
                autoResize
                maxHeight={160}
                aria-label="Input pesan"
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || input.trim().length === 0}
                size="responsive"
              >
                Kirim
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};


