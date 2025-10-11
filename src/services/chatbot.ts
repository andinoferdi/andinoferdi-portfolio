import {
  type Message,
  type PortfolioContext,
  type StreamChunk,
  type ChatHistory,
} from "@/types/chatbot";
import { getProjectsData } from "./projects";
import { getExperienceData } from "./journey";
import { getProfileData } from "./profile";

if (typeof window === "undefined") {
  console.log("🔍 Environment Variables Check:");
  console.log("API_KEY exists:", !!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY);
  console.log(
    "API_KEY length:",
    process.env.NEXT_PUBLIC_OPENROUTER_API_KEY?.length || 0
  );
  console.log("SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL);
  console.log("SITE_NAME:", process.env.NEXT_PUBLIC_SITE_NAME);
  console.log(
    "All NEXT_PUBLIC_ vars:",
    Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_"))
  );
}

const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || "AndinoFerdi Portfolio";
console.log(
  "Using API_KEY from:",
  process.env.NEXT_PUBLIC_OPENROUTER_API_KEY
    ? ".env file"
    : "NOT SET - Please configure NEXT_PUBLIC_OPENROUTER_API_KEY"
);

export const MODELS = [
  "openrouter/auto",
  "openai/gpt-oss-20b:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen3-coder:free",
  "alibaba/tongyi-deepresearch-30b-a3b:free",
];

export const MODEL_DISPLAY_NAMES = [
  "Auto Router",
  "GPT-OSS",
  "Gemini Flash",
  "Qwen Coder",
  "Tongyi Research",
];

const CHAT_HISTORY_KEY = "andinoferdi_chat_history";

export const getPortfolioContext = (): PortfolioContext => {
  const projectsData = getProjectsData();
  const experienceData = getExperienceData();
  const profileData = getProfileData();

  return {
    projects: projectsData.projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      technologies: project.technologies,
      liveUrl: project.liveUrl,
      githubUrl: project.githubUrl,
    })),
    experiences: experienceData.experiences.map((exp) => ({
      id: exp.id,
      title: exp.title,
      company: exp.company,
      period: exp.period,
      description: exp.description,
      technologies: exp.technologies,
      current: exp.current,
    })),
    profiles: profileData.profiles.map((profile) => ({
      quote: profile.quote,
      name: profile.name,
      designation: profile.designation,
    })),
    cvDownload: {
      url: profileData.cvDownload.url,
      label: profileData.cvDownload.label,
    },
  };
};

export const createSystemPrompt = (): Message => {
  const context = getPortfolioContext();

  const systemContent = `You are an AI assistant representing Andino Ferdiansah, a talented developer and designer. Here's information about him:

PROFILE SUMMARY:
${context.profiles.map((p) => `- ${p.name}: ${p.quote}`).join("\n")}

PROJECTS:
${context.projects
  .map(
    (p) => `
- ${p.title}: ${p.description}
  Technologies: ${p.technologies.join(", ")}
  Live URL: ${p.liveUrl || "N/A"}
  GitHub: ${p.githubUrl || "N/A"}
`
  )
  .join("")}

EXPERIENCE:
${context.experiences
  .map(
    (exp) => `
- ${exp.title} at ${exp.company} (${exp.period.start} - ${exp.period.end})${
      exp.current ? " [CURRENT]" : ""
    }
  ${exp.description}
  Technologies: ${exp.technologies.join(", ")}
`
  )
  .join("")}

CV DOWNLOAD: ${context.cvDownload.label} - ${context.cvDownload.url}

INSTRUCTIONS:
- Answer questions about Andino's projects, skills, and experience based on the information above
- Be helpful, professional, and informative
- If asked about general topics not related to the portfolio, you can still help
- Always respond in the same language as the user's question
- Keep responses concise but informative
- If you don't know something specific, say so politely`;

  return {
    id: "system-prompt",
    role: "system",
    content: systemContent,
    timestamp: new Date(),
  };
};

export const parseStreamResponse = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (content: string) => void
): Promise<void> => {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") {
            return;
          }

          try {
            const chunk: StreamChunk = JSON.parse(data);

            if (chunk.choices && chunk.choices[0]?.delta?.content) {
              onChunk(chunk.choices[0].delta.content);
            }
          } catch (error) {
            console.warn("Failed to parse chunk:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Stream reading error:", error);
    throw error;
  }
};

export const sendChatMessage = async (
  messages: Message[],
  modelIndex: number = 0,
  onStream?: (chunk: string) => void
): Promise<{ content: string; model: string }> => {
  if (!API_KEY) {
    throw new Error(
      "OpenRouter API key not found. Please set NEXT_PUBLIC_OPENROUTER_API_KEY in your .env.local file"
    );
  }

  const systemPrompt = createSystemPrompt();
  const apiMessages = [
    systemPrompt,
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": SITE_URL,
        "X-Title": SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS[modelIndex],
        messages: apiMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API Error (${response.status}): ${errorText}`;

    if (response.status === 401) {
      errorMessage = `Authentication failed (401): Please check your OpenRouter API key. ${errorText}`;
    } else if (response.status === 429) {
      errorMessage = `Rate limit exceeded (429): Please try again later. ${errorText}`;
    } else if (response.status >= 500) {
      errorMessage = `Server error (${response.status}): Please try again later. ${errorText}`;
    }

    throw new Error(errorMessage);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Failed to get response reader");
  }

  let fullContent = "";

  if (onStream) {
    await parseStreamResponse(reader, (chunk) => {
      fullContent += chunk;
      onStream(chunk);
    });
  } else {
    await parseStreamResponse(reader, (chunk) => {
      fullContent += chunk;
    });
  }

  return {
    content: fullContent,
    model: MODELS[modelIndex],
  };
};


export const handleModelFallback = async (
  messages: Message[],
  startModelIndex: number = 0,
  onStream?: (chunk: string) => void
): Promise<{ content: string; model: string; finalIndex: number }> => {
  let lastError: Error | null = null;
  const rateLimitedModels: string[] = [];

  const order: number[] = [];
  for (let i = startModelIndex; i < MODELS.length; i++) order.push(i);
  for (let i = 0; i < startModelIndex; i++) order.push(i);

  for (const i of order) {
    try {
      const result = await sendChatMessage(messages, i, onStream);
      return { content: result.content, model: result.model, finalIndex: i };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes("429") || errorMessage.includes("Rate limit")) {
        console.warn(` ${MODEL_DISPLAY_NAMES[i]} rate limited, skipping...`);
        rateLimitedModels.push(MODEL_DISPLAY_NAMES[i]);

        if (rateLimitedModels.length === MODELS.length) {
          throw new Error(
            "All free models have reached their daily limit. Please try again next time"
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }

      lastError = error instanceof Error ? error : new Error(errorMessage);
      console.error(` ${MODEL_DISPLAY_NAMES[i]} Failed:`, errorMessage);
      break;
    }
  }

  throw lastError || new Error("All models fail or reach their limits.");
};

export const saveChatHistory = (messages: Message[]): void => {
  if (typeof window === "undefined") return;

  try {
    const chatHistory: ChatHistory = {
      messages,
      lastUpdated: Date.now(),
    };

    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
};

export const loadChatHistory = (): Message[] => {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];

    const chatHistory: ChatHistory = JSON.parse(stored);

    return chatHistory.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error("Failed to load chat history:", error);
    return [];
  }
};

export const clearChatHistory = (): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    console.error("Failed to clear chat history:", error);
  }
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};
