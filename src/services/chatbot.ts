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
import { getTechStackData } from "./techstack";
import { getCertificateData } from "./certificate";

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

export const AUTO_MODEL_ID = "auto";
export type RuntimeRoute = "openrouter/free";
export const DEFAULT_ROUTE_MODEL: RuntimeRoute = "openrouter/free";
const MAX_IMAGES_PER_REQUEST = 3;
const MAX_TOTAL_IMAGE_BASE64_CHARS = 8_500_000;
const MAX_RETRIES = 3;

// Backward-compatible exports used by existing UI pieces.
export const TEXT_MODELS: string[] = [DEFAULT_ROUTE_MODEL];
export const VISION_MODELS: string[] = [DEFAULT_ROUTE_MODEL];
export const ALL_MODELS: Array<{
  id: string;
  name: string;
  family: "text";
  supportsVision: true;
  free: true;
  priority: 1;
}> = [
  {
    id: DEFAULT_ROUTE_MODEL,
    name: "Auto (OpenRouter Free)",
    family: "text",
    supportsVision: true,
    free: true,
    priority: 1,
  },
];
export const MODELS = [DEFAULT_ROUTE_MODEL];
export const MODEL_DISPLAY_NAMES = ["Auto (OpenRouter Free)"];

const CHAT_HISTORY_KEY = "andinoferdi_chat_history";

export const getPortfolioContext = (): PortfolioContext => {
  const projectsData = getProjectsData();
  const experienceData = getExperienceData();
  const profileData = getProfileData();
  const musicData = getOriginalTracks();
  const galleryData = getGalleryData();
  const techStackData = getTechStackData();
  const certificateData = getCertificateData();

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
    techStack: {
      totalCategories: techStackData.categories.length,
      categories: techStackData.categories.map(cat => ({
        name: cat.name,
        description: cat.description,
        technologiesCount: cat.technologies.length,
        technologies: cat.technologies.map(tech => tech.name),
      })),
    },
    certificates: {
      totalCertificates: certificateData.certificates.length,
    },
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

YOUR ROLE & CAPABILITIES:
- You are an AI assistant representing Andino Ferdiansah on this portfolio
- You have BOTH portfolio-specific data AND general knowledge from your training
- Use your general knowledge to help understand context, explain concepts, and answer follow-up questions
- For portfolio-specific facts (projects, experience, skills): stick to the provided data
- For general topics (technology, programming, concepts): use your full knowledge
- You cannot see or remember previous conversations outside this session
- For image recognition, you can only identify the 4 confirmed solo photos below
- Be honest when you don't know something specific about the portfolio

ABOUT ANDINO FERDIANSAH:
${context.profiles.map((p) => `- ${p.name}: ${p.quote}`).join("\n")}

ANDINO'S PHOTOS (SOLO):
Only these 4 photos are confirmed to be Andino Ferdiansah alone:
- /images/self/1.jpg - Mt Lorokan (31 August 2025)
- /images/self/2.jpg - Ngalur Beach (26 July 2025)
- /images/self/3.jpg - Mt Cendono (19 July 2025)
- /images/self/4.jpg - Mt Penanggungan (13 September 2025)

GALLERY PHOTOS:
Gallery contains 36+ photos from various locations (universities, malls, mountains, events).
Most gallery photos include friends, groups, or other people - NOT only Andino.
These are travel/outing photos capturing moments with friends and places visited.

IMPORTANT: If user uploads a photo or asks about a photo from gallery:
- DO NOT assume it's Andino unless it matches the 4 confirmed solo photos above
- If unsure, ASK for clarification: "I see a photo, but I can't confirm who's in it. Could you provide more context?"
- For gallery photos, explain they are from his travels/outings and may include friends

WHEN TO USE GENERAL KNOWLEDGE:
1. Technology & Programming:
   - Explaining tech stacks, frameworks, languages mentioned in portfolio
   - Comparing technologies (e.g., "React vs Vue")
   - Best practices and industry trends
   - How certain technologies work
   
2. Context Understanding:
   - Understanding user's technical background
   - Clarifying programming concepts
   - Explaining why Andino chose certain technologies
   - Industry context and career advice

3. Problem Solving:
   - Helping users understand how projects work
   - Explaining technical decisions
   - Suggesting related topics based on user interest

WHEN TO STICK TO PORTFOLIO DATA:
1. Andino's Specific Information:
   - His exact projects and their details
   - His work experience and timeline
   - His specific skills and proficiency levels
   - His personal information (age, location, etc.)

2. Portfolio Facts:
   - Project URLs, GitHub links
   - Technologies used in specific projects
   - Company names and roles
   - Dates and timelines

If user asks "Does Andino know React?" → Check portfolio data
If user asks "What is React?" → Use general knowledge
If user asks "Why use Next.js?" → Use general knowledge + portfolio context

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

TECH STACK & SKILLS:
Andino has expertise across ${context.techStack?.totalCategories || 0} technology categories:
${context.techStack?.categories.map(cat => `
- ${cat.name} (${cat.technologiesCount} technologies): ${cat.description}
  Technologies: ${cat.technologies.join(", ")}
`).join("") || "Tech stack data not available"}

CERTIFICATIONS:
Andino has earned ${context.certificates?.totalCertificates || 0} professional certificates, demonstrating commitment to continuous learning and skill development.

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

SMART RESPONSE STRATEGY:
1. Identify question type:
   - Portfolio-specific fact? → Use provided data only
   - General knowledge? → Use full AI capabilities
   - Hybrid? → Combine both intelligently

2. Examples:
   Q: "What is Vue.js?"
   A: Use general knowledge to explain Vue.js comprehensively
   
   Q: "What Vue.js projects does Andino have?"
   A: Check portfolio data for Vue.js projects
   
   Q: "Why did Andino use Vue.js for this project?"
   A: Combine general Vue.js benefits + portfolio project context
   
   Q: "How does REST API work?"
   A: Use general knowledge to explain REST APIs
   
   Q: "Tell me about Andino's age"
   A: "I don't have personal details like age in the portfolio. I can tell you about his experience and skills though!"

WHEN TO BE CAUTIOUS & ASK FOR CLARIFICATION:
1. Image Recognition:
   - If user asks "who is this?" about an uploaded image
   - If the image doesn't match the 4 confirmed solo photos
   - If it's a group photo or unclear face
   → Response: "I can see it's a photo, but I can't identify specific people with certainty. Could you tell me more about what you'd like to know?"

2. Portfolio-Specific Information:
   - If asked about personal details not in the portfolio data
   - If question requires private information about Andino
   → Response: "I don't have specific information about that in the portfolio. Would you like to know about [suggest related topics]?"

RESPONSE CONFIDENCE LEVELS:
- HIGH confidence: Information directly from portfolio data (projects, tech stack, experience)
- MEDIUM confidence: Reasonable inferences from multiple data points
- LOW confidence: Speculation or information not in portfolio
→ For LOW confidence situations, ALWAYS clarify uncertainty and ask for clarification

NEVER:
- Make up portfolio-specific facts not in the data
- Invent projects, experiences, or skills for Andino
- Claim Andino said or did something not documented
- Make up personal information about Andino
- Provide incorrect technical information even for general topics
- Assume photos are of Andino without confirmation

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
11. ALWAYS ask for clarification when uncertain rather than guessing

BE HELPFUL & KNOWLEDGEABLE:
- If user asks about a technology in the portfolio, explain it enthusiastically
- If user needs context to understand something, provide it
- If user is curious about why certain tech choices, explain the benefits
- Connect Andino's work with broader industry context
- Be a knowledgeable guide, not just a data reader
- Make the conversation engaging by using your full AI capabilities

EXAMPLE RESPONSES:
- "What is your name?" → "I'm AndinoBot! I'm an AI assistant created by Andino Ferdiansah to help visitors learn about his work and experience. Think of me as his digital representative here on the portfolio."
- "Who are you?" → "Hey! I'm AndinoBot, Andino's AI assistant. I'm here to chat about his projects, skills, experience, and pretty much anything you'd like to know about him. Feel free to ask away!"
- "What music does Andino like?" → "Andino has great taste in music! He's into Rock, Alternative Rock, and Punk - bands like Green Day, Muse, and The Police. But he also enjoys softer stuff like Air Supply and Backstreet Boys. Check out his playlist - there's 'Supermassive Black Hole' by Muse, 'Basket Case' by Green Day, and some Indonesian rock like Barasuara's 'Terbuang Dalam Waktu'. Pretty diverse, right?"
- "What is Next.js?" → "Next.js is a powerful React framework for building web applications with features like server-side rendering, static site generation, and API routes. Andino uses Next.js in several projects including his portfolio website you're on right now! It's great for SEO and performance."
- "Why should I use TypeScript?" → "TypeScript adds static typing to JavaScript, catching errors during development and improving code quality. It's especially valuable in large projects. Andino uses TypeScript extensively in his projects - you can see it in his portfolio, FreshKo, and Pet Finder projects. It helps maintain code reliability and developer experience."
- "Who is in this photo?" → "I can see it's a photo, but I can't identify specific people with certainty. Could you tell me more about what you'd like to know? If this is from Andino's gallery, most photos there are from his travels and outings with friends."
- "What is Andino's age?" → "I don't have personal details like age in the portfolio. I can tell you about his experience and skills though! He's been working in tech with experience at Telkom Indonesia and various projects."
- "What technologies does Andino know?" → "Andino has expertise across 6 technology categories! He works with modern frameworks like Next.js, Laravel, and Flutter. For frontend, he uses React.js, Vue.js, and Tailwind CSS. On the backend, he's skilled in PHP, Node.js, Python, and Golang. He also works with databases like MySQL, PostgreSQL, and MongoDB. Plus he has design skills with Figma and Adobe Creative Suite. He's got ${context.certificates?.totalCertificates} professional certificates too!"`;

  return {
    id: "system-prompt",
    role: "system",
    content: systemContent,
    timestamp: new Date(),
  };
};

export const parseStreamResponse = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (content: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      // Check if request was aborted
      if (signal?.aborted) {
        throw new DOMException('The operation was aborted.', 'AbortError');
      }

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
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.log("Stream reading aborted by user");
      throw error;
    }
    console.error("Stream reading error:", error);
    throw error;
  }
};

const MODEL_ID_NAME_MAP = new Map<string, string>([
  [AUTO_MODEL_ID, "Auto (Free)"],
  [DEFAULT_ROUTE_MODEL, "Auto (OpenRouter Free)"],
]);

const estimateImagePayloadChars = (messages: Message[]): {
  imageCount: number;
  totalBase64Chars: number;
} => {
  let imageCount = 0;
  let totalBase64Chars = 0;

  for (const message of messages) {
    if (!Array.isArray(message.content)) continue;

    for (const contentItem of message.content) {
      if (contentItem.type !== "image_url" || !contentItem.image_url?.url) continue;
      imageCount += 1;
      totalBase64Chars += contentItem.image_url.url.length;
    }
  }

  return { imageCount, totalBase64Chars };
};

export const isVisionCapable = (): boolean => {
  return true;
};

export const getModelDisplayName = (modelId?: string): string => {
  if (!modelId) return "Auto (OpenRouter Free)";
  return MODEL_ID_NAME_MAP.get(modelId) ?? modelId;
};

export const resolveModelForRequest = (): { modelId: string; family: "text" } => {
  return { modelId: DEFAULT_ROUTE_MODEL, family: "text" };
};

export const getFallbackOrder = (): string[] => {
  return [DEFAULT_ROUTE_MODEL];
};

export const sendChatMessage = async (
  messages: Message[],
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
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
  const payloadEstimate = estimateImagePayloadChars(apiMessages);

  if (payloadEstimate.imageCount > MAX_IMAGES_PER_REQUEST) {
    throw new Error(
      `IMAGE_LIMIT: Maksimal ${MAX_IMAGES_PER_REQUEST} gambar per pesan.`
    );
  }

  if (payloadEstimate.totalBase64Chars > MAX_TOTAL_IMAGE_BASE64_CHARS) {
    throw new Error(
      "IMAGE_PAYLOAD_TOO_LARGE: Ukuran total gambar terlalu besar. Kurangi jumlah gambar atau kompres gambar."
    );
  }

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
        model: DEFAULT_ROUTE_MODEL,
        messages: apiMessages.map((m) => ({
          role: m.role,
          content: Array.isArray(m.content) ? m.content : m.content,
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 2000,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    if (process.env.NODE_ENV === "development") {
      console.warn("[OpenRouter] Request failed", {
        status: response.status,
        routeModel: DEFAULT_ROUTE_MODEL,
        hasImages: payloadEstimate.imageCount > 0,
        imageCount: payloadEstimate.imageCount,
        estimatedChars: payloadEstimate.totalBase64Chars,
      });
    }

    if (response.status === 404) {
      throw new Error(
        "ROUTE_UNAVAILABLE: Provider OpenRouter Free sementara tidak tersedia."
      );
    } else if (response.status === 429) {
      throw new Error("RATE_LIMITED: Antrian model sedang padat, coba lagi.");
    } else if (response.status === 402) {
      throw new Error("INSUFFICIENT_CREDITS: Provider insufficient balance");
    } else if (response.status === 502 || response.status === 503) {
      throw new Error(`MODEL_DOWN: ${errorText}`);
    } else if (response.status === 401) {
      throw new Error(
        "AUTH_ERROR: API key OpenRouter tidak valid atau belum diisi."
      );
    } else if (response.status === 400) {
      throw new Error(
        `BAD_REQUEST: Format request tidak valid. Periksa ukuran/jumlah gambar. ${errorText}`
      );
    } else if (response.status >= 500) {
      throw new Error(`SERVER_ERROR: ${errorText}`);
    }

    throw new Error(`API_ERROR (${response.status}): ${errorText}`);
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
    }, signal);
  } else {
    await parseStreamResponse(reader, (chunk) => {
      fullContent += chunk;
    }, signal);
  }

  if (fullContent.trim().length === 0) {
    throw new Error("EMPTY_RESPONSE: Model returned empty response");
  }

  return {
    content: fullContent,
    model: DEFAULT_ROUTE_MODEL,
  };
};

export const handleModelFallback = async (
  messages: Message[],
  options: {
    selectedModelId: string;
    hasImages: boolean;
    userText: string;
  },
  onStream?: (chunk: string) => void,
  signal?: AbortSignal
): Promise<{ content: string; model: string; finalModelId: string }> => {
  let lastError: Error | null = null;
  let retryDelay = 800;
  const modelId = DEFAULT_ROUTE_MODEL;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const shouldLog = process.env.NODE_ENV === "development";
    if (shouldLog) {
      console.log("[OpenRouter] Sending request", {
        attempt,
        routeModel: modelId,
        hasImages: options.hasImages,
      });
    }

    try {
      const result = await sendChatMessage(messages, onStream, signal);
      return {
        content: result.content,
        model: result.model,
        finalModelId: result.model,
      };
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      lastError = error instanceof Error ? error : new Error(errorMessage);

      const canRetry =
        errorMessage.startsWith("RATE_LIMITED:") ||
        errorMessage.startsWith("MODEL_DOWN:") ||
        errorMessage.startsWith("SERVER_ERROR:");

      if (canRetry && attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        retryDelay = Math.min(retryDelay * 2, 5000);
        continue;
      }

      if (errorMessage.startsWith("BAD_REQUEST:")) {
        throw new Error(
          "Permintaan tidak valid. Periksa format teks/gambar lalu coba lagi."
        );
      }
      if (errorMessage.startsWith("ROUTE_UNAVAILABLE:")) {
        throw new Error(
          "OpenRouter Free sedang tidak tersedia. Coba lagi beberapa saat."
        );
      }
      if (errorMessage.startsWith("AUTH_ERROR:")) {
        throw new Error("API key OpenRouter tidak valid.");
      }
      if (errorMessage.startsWith("IMAGE_LIMIT:")) {
        throw new Error(errorMessage.replace("IMAGE_LIMIT: ", ""));
      }
      if (errorMessage.startsWith("IMAGE_PAYLOAD_TOO_LARGE:")) {
        throw new Error(
          errorMessage.replace("IMAGE_PAYLOAD_TOO_LARGE: ", "")
        );
      }
      if (errorMessage.startsWith("RATE_LIMITED:")) {
        throw new Error("Antrian model sedang padat. Coba lagi sebentar.");
      }

      throw lastError;
    }
  }

  throw (
    lastError ||
    new Error("Chatbot sedang tidak tersedia sementara. Silakan coba lagi nanti.")
  );
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

export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
