"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RightScrollBar } from "@/components/ui/right-scroll-bar";
import { Bot, User, Send, X, RotateCcw, AlertCircle } from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import { formatTimestamp, MODELS, MODEL_DISPLAY_NAMES } from "@/services/chatbot";
import { motion, AnimatePresence } from "framer-motion";
import { type Message } from "@/types/chatbot";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export const ChatbotSection = () => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    cancelRequest,
  } = useChatbot();

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  };

  // Auto scroll only when user sends a message, not during AI generation
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only auto scroll if the last message is from user
      if (lastMessage.role === "user") {
        scrollToBottom("smooth");
      }
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    const message = inputValue.trim();
    setInputValue("");
    await sendMessage({
      content: message,
      onComplete: () => {
        inputRef.current?.focus();
      },
      onError: (error) => {
        console.error("Chat error:", error);
        inputRef.current?.focus();
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const timestamp = formatTimestamp(message.timestamp);

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
        className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <div
            className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {isUser ? (
              <User className="h-3 w-3 md:h-4 md:w-4" />
            ) : (
              <Bot className="h-3 w-3 md:h-4 md:w-4" />
            )}
          </div>
          <div
            className={`rounded-lg px-3 py-2 md:px-4 ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <div className="text-xs md:text-sm">
              {isUser ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      code: (props: any) => {
                        const { inline, className, children } = props;
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            style={oneDark as any}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-md my-2"
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return <p className="mb-2 last:mb-0">{children}</p>;
                      },
                      ul({ children }) {
                        return (
                          <ul className="list-disc pl-4 mb-2">{children}</ul>
                        );
                      },
                      ol({ children }) {
                        return (
                          <ol className="list-decimal pl-4 mb-2">{children}</ol>
                        );
                      },
                      li({ children }) {
                        return <li className="mb-1">{children}</li>;
                      },
                      h1({ children }) {
                        return (
                          <h1 className="text-xl font-bold mb-2">{children}</h1>
                        );
                      },
                      h2({ children }) {
                        return (
                          <h2 className="text-lg font-bold mb-2">{children}</h2>
                        );
                      },
                      h3({ children }) {
                        return (
                          <h3 className="text-base font-bold mb-2">
                            {children}
                          </h3>
                        );
                      },
                      blockquote({ children }) {
                        return (
                          <blockquote className="border-l-4 border-primary pl-4 italic my-2">
                            {children}
                          </blockquote>
                        );
                      },
                      a({ children, href }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                      table({ children }) {
                        return (
                          <div className="overflow-x-auto my-2">
                            <table className="min-w-full border-collapse border border-border">
                              {children}
                            </table>
                          </div>
                        );
                      },
                      thead({ children }) {
                        return <thead className="bg-muted">{children}</thead>;
                      },
                      th({ children }) {
                        return (
                          <th className="border border-border px-3 py-2 text-left font-semibold">
                            {children}
                          </th>
                        );
                      },
                      td({ children }) {
                        return (
                          <td className="border border-border px-3 py-2">
                            {children}
                          </td>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && (
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-current ml-1"
                    />
                  )}
                </div>
              )}
            </div>
            <div
              className={`text-xs mt-1 ${
                isUser ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {timestamp}
              {!isUser && message.model && (
                <span className="ml-2 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                  {MODEL_DISPLAY_NAMES[MODELS.indexOf(message.model)] || message.model}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="py-10 md:py-20 px-2 md:px-4" id="chatbot-section">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-2xl md:text-4xl lg:text-6xl font-bold text-foreground mb-2 md:mb-4">
            Chat with AI
          </h2>
          <p className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
            Ask me anything about my projects, skills, or experience. I&apos;m
            here to help!
          </p>
        </div>

        <Card className="h-[500px] md:h-[600px] flex flex-col">
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AI Assistant
                {isLoading && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearMessages}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {error && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={retryLastMessage}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <RightScrollBar ref={scrollRef} className="flex-1 p-3 md:p-6">
              <div className="space-y-4">
                <AnimatePresence>
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex gap-3 justify-start"
                    >
                      <div className="flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] flex-row">
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
                          <Bot className="h-3 w-3 md:h-4 md:w-4" />
                        </div>
                        <div className="rounded-lg px-3 py-2 md:px-4 bg-muted text-foreground">
                          <div className="text-xs md:text-sm">
                            <p className="mb-2">
                              Hi, I&apos;m an AI assistant. Ask me anything about my
                              projects or experience.
                            </p>
                          </div>
                          <p className="text-xs mt-1 text-muted-foreground">
                            {formatTimestamp(new Date())}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {messages.map((message, index) =>
                  renderMessage(message, index)
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex gap-3 justify-center"
                  >
                    <div className="flex items-center gap-2 px-3 py-2 md:px-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs md:text-sm">{error}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={retryLastMessage}
                        className="h-6 px-2 text-destructive hover:bg-destructive/20"
                      >
                        Retry
                      </Button>
                    </div>
                  </motion.div>
                )}
              </div>
            </RightScrollBar>

            <div className="flex-shrink-0 p-3 md:p-6 border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything..."
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                >
                  {isLoading && isStreaming ? (
                    <X className="h-4 w-4" onClick={cancelRequest} />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
