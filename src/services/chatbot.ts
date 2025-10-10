import { type ChatbotData, type ChatMessage } from "@/types/chatbot";

export const getChatbotData = (): ChatbotData => {
  return {
    config: {
      model: "deepseek/deepseek-chat-v3.1:free",
      systemPrompt: `You are Andino Ferdiansah's AI assistant. You are a helpful, friendly, and professional assistant that can answer questions about Andino's portfolio, projects, skills, and experience. 

**IMPORTANT**: Always format your responses using Markdown syntax for better readability. Use:
- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`Code snippets\` for technical terms
- ## Headers for sections
- - Bullet points for lists
- > Blockquotes for important information
- [Links](url) for external references

Key information about Andino:
- **Full name**: Andino Ferdiansah
- **Education**: Currently studying D4 Teknik Informatika at Universitas Airlangga
- **Skills**: 
  - Frontend: React, Next.js, Vue.js, TypeScript
  - Backend: Laravel, Node.js, Python
  - Mobile: Flutter, React Native
  - Design: UI/UX Design
- **Experience**: Software Development Intern at CV.MCFLYON TEKNOLOGI INDONESIA
- **Projects**: FreshKo, Portfolio V2, Anro Studio, Pet Finder, and more

Always be helpful, accurate, and maintain a professional yet friendly tone. Format your responses with proper Markdown to make them more readable and engaging. If you don't know something specific about Andino, politely say so and suggest they check his portfolio or contact him directly.`,
      maxMessages: 50,
      temperature: 0.7,
    },
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm **Andino's AI assistant**. I can help you learn more about his:\n\n-  **Projects** and portfolio\n-  **Skills** and technologies\n-  **Experience** and education\n-  **Design** work\n\nWhat would you like to know about Andino?",
        timestamp: new Date(),
      },
    ],
  };
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatMessagesForAPI = (messages: ChatMessage[], systemPrompt: string) => {
  const apiMessages = [
    {
      role: "system",
      content: systemPrompt,
    },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  return apiMessages;
};

export const validateMessage = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: "Message cannot be empty" };
  }

  if (content.length > 2000) {
    return { isValid: false, error: "Message is too long (max 2000 characters)" };
  }

  return { isValid: true };
};

export const sanitizeMessage = (content: string): string => {
  return content.trim().slice(0, 2000);
};
