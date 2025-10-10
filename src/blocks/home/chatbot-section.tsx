"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RightScrollBar } from "@/components/ui/right-scroll-bar";
import { getChatbotData, generateMessageId, validateMessage, sanitizeMessage } from "@/services/chatbot";
import { type ChatMessage, type ChatbotState } from "@/types/chatbot";
import { Send, Bot, User, Loader2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage = ({ content }: MarkdownMessageProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-1">{children}</h3>,
        h4: ({ children }) => <h4 className="text-sm font-bold mb-1">{children}</h4>,
        h5: ({ children }) => <h5 className="text-sm font-semibold mb-1">{children}</h5>,
        h6: ({ children }) => <h6 className="text-xs font-semibold mb-1">{children}</h6>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="ml-2">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/30 pl-3 italic mb-2">
            {children}
          </blockquote>
        ),
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
                {children}
              </code>
            );
          }
          return (
            <code className="block bg-muted p-2 rounded text-xs font-mono overflow-x-auto mb-2">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-muted p-2 rounded overflow-x-auto mb-2">
            {children}
          </pre>
        ),
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        table: ({ children }) => (
          <div className="overflow-x-auto mb-2">
            <table className="min-w-full border-collapse border border-border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
        th: ({ children }) => (
          <th className="border border-border px-2 py-1 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-2 py-1">
            {children}
          </td>
        ),
        hr: () => <hr className="border-border my-2" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export const ChatbotSection = () => {
  const chatbotData = getChatbotData();
  const [state, setState] = useState<ChatbotState>({
    messages: chatbotData.initialMessages,
    isLoading: false,
    error: null,
    isTyping: false,
  });

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  const [previousMessageCount, setPreviousMessageCount] = useState(1);

  useEffect(() => {
    if (state.messages.length > previousMessageCount) {
      setTimeout(() => scrollToBottom(), 200);
    }
    setPreviousMessageCount(state.messages.length);
  }, [state.messages.length, previousMessageCount]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || state.isLoading) return;

    const validation = validateMessage(inputValue);
    if (!validation.isValid) {
      setState(prev => ({ ...prev, error: validation.error || "Invalid message" }));
      return;
    }

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: "user",
      content: sanitizeMessage(inputValue),
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
      isTyping: true,
    }));

    setInputValue("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...state.messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const assistantMessage: ChatMessage = {
        id: generateMessageId(),
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        isTyping: false,
      }));

    } catch (error) {
      console.error("Chat error:", error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        isTyping: false,
        error: error instanceof Error ? error.message : "Something went wrong",
      }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <section className="py-20 px-4" id="chatbot-section">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Chat with AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ask me anything about my projects, skills, or experience. I&apos;m here to help!
          </p>
        </div>

        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              AI Assistant
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            <RightScrollBar ref={scrollContainerRef} className="flex-1 p-6" maxHeight="400px">
              <div className="space-y-4">
                <AnimatePresence>
                  {state.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {message.role === "user" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </div>
                        <div className={`rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}>
                          <div className="text-sm">
                            <MarkdownMessage 
                              content={message.content} 
                            />
                          </div>
                          <p className={`text-xs mt-1 ${
                            message.role === "user" 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {state.isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted text-foreground rounded-lg px-4 py-2">
                      <div className="flex items-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">AI is typing...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {state.error && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3 justify-start"
                  >
                    <div className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-4 py-2">
                      <p className="text-sm">{state.error}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="mt-2 h-6 px-2 text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </RightScrollBar>

            <div className="flex-shrink-0 p-6 border-t">
              <div className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about my projects or experience..."
                  disabled={state.isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || state.isLoading}
                  size="icon"
                >
                  {state.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
