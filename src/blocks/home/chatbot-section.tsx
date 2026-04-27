"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { RightScrollBar } from "@/components/ui/right-scroll-bar";
import {
  Bot,
  User,
  Send,
  X,
  RotateCcw,
  AlertCircle,
  Pencil,
  Copy,
} from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import {
  formatTimestamp,
  getModelDisplayName,
} from "@/services/chatbot";
import { motion, AnimatePresence } from "framer-motion";
import { type Message } from "@/types/chatbot";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const ChatbotSection = () => {
  const [inputValue, setInputValue] = useState("");
  // TODO_CEREBRAS_IMAGE_DISABLED: fitur gambar chatbot dinonaktifkan sementara.
  // const [selectedImages, setSelectedImages] = useState<string[]>([]);
  // const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // TODO_CEREBRAS_IMAGE_DISABLED: fitur gambar chatbot dinonaktifkan sementara.
  // const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  const {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
    cancelRequest,
    updateAndResendMessage,
  } = useChatbot();

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior });
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    const behavior: ScrollBehavior =
      lastMessage.role === "assistant" && lastMessage.isStreaming
        ? "auto"
        : "smooth";
    scrollToBottom(behavior);
  }, [messages]);

  // TODO_CEREBRAS_IMAGE_DISABLED: handler upload gambar dinonaktifkan sementara.
  // const validateFileType = async (file: File): Promise<{ isValid: boolean; reason?: string }> => {
  //   try {
  //     const result = await validateImageFileStrict(file);
  //     return result;
  //   } catch (error) {
  //     console.error("File validation error:", error);
  //     return { isValid: false, reason: "File validation failed" };
  //   }
  // };
  //
  // const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const files = e.target.files;
  //   if (!files) return;
  //
  //   if (selectedImages.length + files.length > 10) {
  //     toast.error("Maksimal 10 images yang bisa diupload");
  //     return;
  //   }
  //
  //   const imagePromises = Array.from(files).map(async (file) => {
  //     const validationResult = await validateFileType(file);
  //     if (!validationResult.isValid) {
  //       toast.error(`File ${file.name} tidak didukung: ${validationResult.reason}`);
  //       return null;
  //     }
  //
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast.error(`File ${file.name} terlalu besar. Maksimal 5MB`);
  //       return null;
  //     }
  //
  //     const base64 = await imageToBase64(file);
  //     return base64;
  //   });
  //
  //   const images = await Promise.all(imagePromises);
  //   const validImages = images.filter((img) => img !== null) as string[];
  //   setSelectedImages((prev) => [...prev, ...validImages]);
  //
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = "";
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const message = inputValue.trim();

    setInputValue("");

    await sendMessage({
      content: message || "",
      onComplete: () => {
        inputRef.current?.focus();
      },
      onError: (error) => {
        console.error("Chat error:", error);
        inputRef.current?.focus();
      },
    });
  };

  const handleEditMessage = (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message && message.role === "user") {
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content.find((c) => c.type === "text")?.text || "";

      setEditingMessageId(messageId);
      setEditingContent(content);

      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 100);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingMessageId || !editingContent.trim()) return;

    const message = messages.find((msg) => msg.id === editingMessageId);
    if (!message) return;

    const images = message.images || [];
    const messageId = editingMessageId;
    const content = editingContent.trim();

    // Close UI immediately
    setEditingMessageId(null);
    setEditingContent("");

    // Then send the update
    await updateAndResendMessage(
      messageId,
      content,
      images,
      () => {
        // Already closed, no need to do anything
      },
      (error) => {
        console.error("Edit error:", error);
        // Optionally: reopen edit UI on error
      }
    );
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleKeyDownEdit = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleCopyMessage = async (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (message) {
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content.find((c) => c.type === "text")?.text || "";

      try {
        await navigator.clipboard.writeText(content);
        toast.success("Message copied to clipboard");
      } catch (error) {
        console.error("Failed to copy:", error);
        toast.error("Failed to copy message");
      }
    }
  };

  const handleClearMessages = () => {
    clearMessages();
    setInputValue("");
    setEditingMessageId(null);
    setEditingContent("");
  };

  const handleCancelRequest = () => {
    cancelRequest();
    if (editingMessageId) {
      handleCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
    // Shift+Enter allows new line in textarea
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const timestamp = formatTimestamp(message.timestamp);

    if (isUser) {
      const hasLegacyImages = Boolean(message.images && message.images.length > 0);
      const hasText =
        typeof message.content === "string"
          ? message.content.trim()
          : message.content.find((c) => c.type === "text")?.text?.trim();

      return (
        <div key={message.id}>
          {/* TODO_CEREBRAS_IMAGE_DISABLED: rendering gambar user dinonaktifkan sementara. */}

          {hasText && (
            <motion.div
              key={`${message.id}-text`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index * 0.05, 0.15),
              }}
              className="flex gap-3 justify-end"
            >
              <div className="flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] flex-row-reverse">
                <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                  <User className="h-3 w-3 md:h-4 md:w-4" />
                </div>
                <div className="relative group">
                  {editingMessageId === message.id ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg px-3 py-3 md:px-4 bg-primary/10 border border-primary/30"
                    >
                      <Textarea
                        ref={editInputRef}
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        onKeyDown={handleKeyDownEdit}
                        className="w-full min-h-20! max-h-50 resize-none bg-transparent border-none p-2 text-xs md:text-sm focus:ring-0 focus:outline-none leading-relaxed py-2!"
                        placeholder="Edit your message..."
                        autoResize={true}
                        maxHeight={200}
                        style={{
                          lineHeight: "1.6",
                          minHeight: "80px",
                          paddingTop: "12px",
                          paddingBottom: "12px",
                          boxSizing: "border-box",
                          overflow: "hidden",
                        }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                          Press Enter to save, Esc to cancel
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleCancelEdit}
                            className="h-6 px-2 text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            disabled={!editingContent.trim()}
                            className="h-6 px-2 text-xs"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="group/message">
                      <div className="rounded-lg px-3 py-2 md:px-4 bg-primary text-primary-foreground">
                        <div className="text-xs md:text-sm">
                          <div className="whitespace-pre-wrap">
                            {typeof message.content === "string"
                              ? message.content
                              : message.content.find((c) => c.type === "text")
                                  ?.text}
                          </div>
                        </div>
                        <div className="text-xs mt-1 text-primary-foreground/70">
                          {timestamp}
                        </div>
                      </div>

                      {/* Action Buttons - Separate from message background */}
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleCopyMessage(message.id)}
                          className="p-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors cursor-pointer"
                          title="Copy message"
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                        {!hasLegacyImages && (
                          <button
                            onClick={() => handleEditMessage(message.id)}
                            className="p-1.5 bg-muted hover:bg-muted/80 rounded-full transition-colors cursor-pointer"
                            title="Edit message"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      );
    }

    // Assistant message
    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.15) }}
        className="flex gap-3 justify-start"
      >
        <div className="flex gap-2 md:gap-3 max-w-[90%] md:max-w-[80%] flex-row">
          <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
            <Bot className="h-3 w-3 md:h-4 md:w-4" />
          </div>
          <div className="rounded-lg px-3 py-2 md:px-4 bg-muted text-foreground">
            <div className="text-xs md:text-sm">
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
                        <h3 className="text-base font-bold mb-2">{children}</h3>
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
                  {typeof message.content === "string" ? message.content : ""}
                </ReactMarkdown>
                {message.isStreaming && (
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-current ml-1"
                  />
                )}
              </div>
            </div>
            <div className="text-xs mt-1 text-muted-foreground">
              {timestamp}
              {message.model && (
                <span className="ml-2 px-1.5 py-0.5 bg-background/20 rounded text-xs">
                  {getModelDisplayName(message.model)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <section className="py-10 px-2 md:py-20 md:px-4" id="chatbot-section">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10 md:mb-16" data-aos="fade-up">
          <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Chat with AI
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ask me anything about my projects, skills, or experience. I&apos;m
            here to help!
          </p>
        </header>
        <Card
          className="h-125 md:h-150 flex flex-col"
          data-aos="fade-up"
        >
          <CardHeader className="shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                AndinoBot
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
                    onClick={handleClearMessages}
                    disabled={isLoading || isStreaming}
                    className={cn(
                      "text-muted-foreground hover:text-foreground cursor-pointer",
                      isLoading || isStreaming
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted"
                    )}
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

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
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
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0">
                          <Bot className="h-3 w-3 md:h-4 md:w-4" />
                        </div>
                        <div className="rounded-lg px-3 py-2 md:px-4 bg-muted text-foreground">
                          <div className="text-xs md:text-sm">
                            <p className="mb-2">
                              Hi, I&apos;m an AndinoBot. Ask me anything about
                              Andino Ferdiansah&apos;s projects or experience.
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

            <div className="shrink-0 p-3 md:p-6 border-t">
              {/* TODO_CEREBRAS_IMAGE_DISABLED: preview gambar yang dipilih dinonaktifkan sementara. */}

              <form onSubmit={handleSubmit} className="relative">
                {/* TODO_CEREBRAS_IMAGE_DISABLED: input upload gambar dinonaktifkan sementara. */}
                <div className="relative flex items-center">
                  {/* TODO_CEREBRAS_IMAGE_DISABLED: tombol upload gambar dinonaktifkan sementara. */}
                  <Textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 min-h-14 max-h-32 resize-none right-scrollbar px-4 py-4 pr-18"
                    disabled={isLoading}
                    autoResize={true}
                    maxHeight={128}
                    rows={1}
                  />
                  <Button
                    type={isLoading && isStreaming ? "button" : "submit"}
                    disabled={!isLoading && !inputValue.trim()}
                    onClick={
                      isLoading && isStreaming ? handleCancelRequest : undefined
                    }
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 rounded-full w-9 h-9 p-0",
                      isLoading && isStreaming
                        ? "cursor-pointer"
                        : !isLoading && !inputValue.trim()
                        ? "cursor-not-allowed"
                        : "cursor-pointer"
                    )}
                  >
                    {isLoading && isStreaming ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TODO_CEREBRAS_IMAGE_DISABLED: modal gambar chatbot dinonaktifkan sementara. */}
    </section>
  );
};
