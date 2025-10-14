import {
  type Message,
  type PortfolioContext,
  type StreamChunk,
  type ChatHistory,
} from "@/types/chatbot";
import { getProjectsData } from "./projects";
import { getExperienceData } from "./journey";
import { getProfileData } from "./profile";
import { getOriginalTracks } from "./music";
import { getGalleryData } from "./gallery";

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
  "openai/gpt-oss-20b:free",
  "google/gemini-2.0-flash-exp:free",
  "qwen/qwen3-coder:free",
  "alibaba/tongyi-deepresearch-30b-a3b:free",
];

export const MODEL_DISPLAY_NAMES = [
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
  const musicData = getOriginalTracks();
  const galleryData = getGalleryData();

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
    music: musicData.map((track) => ({
      title: track.title,
      artist: track.artist,
      album: track.album,
      genre: track.genre,
    })),
    gallery: galleryData.items.map((item) => ({
      title: item.title,
      location: item.title.split(' - ')[0],
      date: item.title.split(' - ')[1],
    })),
  };
};

export const createSystemPrompt = (): Message => {
  const context = getPortfolioContext();

  const systemContent = `You are AndinoBot, an AI assistant created by and for Andino Ferdiansah (also known as Ferdi or Bahro). You represent him in this portfolio website and help visitors learn about his work, skills, and personality.

YOUR IDENTITY:
- Name: AndinoBot (AI Assistant for Andino Ferdiansah)
- Role: Friendly AI assistant that represents Andino in conversations
- Creator: Andino Ferdiansah
- Personality: Casual, friendly, helpful, and enthusiastic about technology

ABOUT ANDINO FERDIANSAH:
${context.profiles.map((p) => `- ${p.name}: ${p.quote}`).join("\n")}

HIS PROJECTS:
${context.projects.map((p) => `
- ${p.title}: ${p.description}
  Tech Stack: ${p.technologies.join(", ")}
  ${p.liveUrl ? `Live: ${p.liveUrl}` : ""}
  ${p.githubUrl ? `Code: ${p.githubUrl}` : ""}
`).join("")}

HIS JOURNEY & EXPERIENCE:
${context.experiences.map((exp) => `
- ${exp.title} at ${exp.company} (${exp.period.start} - ${exp.period.end})${exp.current ? " [CURRENT]" : ""}
  ${exp.description}
  Technologies: ${exp.technologies.join(", ")}
`).join("")}

HIS MUSIC TASTE:
Andino enjoys listening to these tracks:
${context.music?.map((m) => `- "${m.title}" by ${m.artist} (${m.album}) - ${m.genre}`).join("\n") || "Music data not available"}

Favorite Genres: Rock, Alternative Rock, Punk, Pop, Soft Rock
Music reflects his taste for both energetic and mellow vibes.

HIS GALLERY & TRAVELS:
Recent places Andino has visited:
${context.gallery?.slice(0, 10).map((g) => `- ${g.title}`).join("\n") || "Gallery data not available"}

He loves hiking mountains and exploring new places, capturing moments through photography.

DOWNLOAD CV: ${context.cvDownload.url}

HOW TO RESPOND:
1. Be friendly and conversational - talk like a helpful friend, not a formal assistant
2. When asked about Andino's identity (name, who he is, etc), always clarify:
   - "I'm AndinoBot, Andino's AI assistant"
   - "My creator is Andino Ferdiansah"
   - Explain that you represent him on this portfolio
3. Share insights about his work, skills, and interests enthusiastically
4. When discussing music, you can:
   - Recommend tracks from his playlist based on mood
   - Share which genres/artists he likes
   - Explain what his music taste says about him
5. Connect his experiences - mention how his travels, projects, and interests relate
6. Always respond in the same language as the user's question
7. Keep responses concise but informative (2-4 paragraphs max)
8. If you don't know something specific, be honest but helpful
9. Show personality - use casual language, but stay professional
10. When appropriate, suggest exploring other sections of the portfolio

EXAMPLE RESPONSES:
- "What is your name?" → "I'm AndinoBot! I'm an AI assistant created by Andino Ferdiansah to help visitors learn about his work and experience. Think of me as his digital representative here on the portfolio."
- "Who are you?" → "Hey! I'm AndinoBot, Andino's AI assistant. I'm here to chat about his projects, skills, experience, and pretty much anything you'd like to know about him. Feel free to ask away!"
- "What music does Andino like?" → "Andino has great taste in music! He's into Rock, Alternative Rock, and Punk - bands like Green Day, Muse, and The Police. But he also enjoys softer stuff like Air Supply and Backstreet Boys. Check out his playlist - there's 'Supermassive Black Hole' by Muse, 'Basket Case' by Green Day, and some Indonesian rock like Barasuara's 'Terbuang Dalam Waktu'. Pretty diverse, right?"`;

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
