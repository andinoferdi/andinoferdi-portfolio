import { type Track, type Playlist } from "@/types/music";

const durationValueCache = new Map<string, number>();
const durationPromiseCache = new Map<string, Promise<number>>();

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getMusicData = (
  shuffled = true
): { tracks: Track[]; playlists: Playlist[] } => {
  const originalTracks = getOriginalTracks();
  const tracks = shuffled ? shuffleArray(originalTracks) : originalTracks;

  return {
    tracks,
    playlists: [
      {
        id: "default-playlist",
        name: "My Playlist",
        tracks,
        coverImage: tracks[0]?.coverImage,
      },
    ],
  };
};

export const getAudioDuration = (audioUrl: string): Promise<number> => {
  if (typeof window === "undefined") return Promise.resolve(0);

  if (durationValueCache.has(audioUrl)) {
    return Promise.resolve(durationValueCache.get(audioUrl)!);
  }

  if (durationPromiseCache.has(audioUrl)) {
    return durationPromiseCache.get(audioUrl)!;
  }

  const p = new Promise<number>((resolve) => {
    const audio = new Audio();
    const encodedSrc = encodeURI(audioUrl);
    let settled = false;

    const done = (value: number) => {
      if (settled) return;
      settled = true;
      durationValueCache.set(audioUrl, value);
      durationPromiseCache.delete(audioUrl);
      audio.removeAttribute("src");
      audio.load();
      resolve(value);
    };

    const timeoutId = window.setTimeout(() => {
      done(0);
    }, 10000);

    audio.addEventListener(
      "loadedmetadata",
      () => {
        window.clearTimeout(timeoutId);
        const d = audio.duration;
        done(Number.isFinite(d) && d > 0 ? d : 0);
      },
      { once: true }
    );

    audio.addEventListener(
      "error",
      () => {
        window.clearTimeout(timeoutId);
        done(0);
      },
      { once: true }
    );

    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    audio.src = encodedSrc;
  });

  durationPromiseCache.set(audioUrl, p);
  return p;
};

// Accurate duration via decodeAudioData (more stable than HTMLMediaElement.duration)
const accurateDurationValueCache = new Map<string, number>();
const accurateDurationPromiseCache = new Map<string, Promise<number>>();

let decodeCtx: AudioContext | null = null;
const getDecodeCtx = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (decodeCtx && decodeCtx.state !== "closed") return decodeCtx;

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!Ctx) return null;
  decodeCtx = new Ctx();
  return decodeCtx;
};

export const getAudioDurationAccurate = (audioUrl: string): Promise<number> => {
  if (typeof window === "undefined") return Promise.resolve(0);

  if (accurateDurationValueCache.has(audioUrl)) {
    return Promise.resolve(accurateDurationValueCache.get(audioUrl)!);
  }
  if (accurateDurationPromiseCache.has(audioUrl)) {
    return accurateDurationPromiseCache.get(audioUrl)!;
  }

  const p = (async () => {
    try {
      const ctx = getDecodeCtx();
      if (!ctx) return 0;

      const encodedUrl = encodeURI(audioUrl);
      const res = await fetch(encodedUrl, { cache: "force-cache" });
      if (!res.ok) return 0;

      const buf = await res.arrayBuffer();
      const audioBuf = await ctx.decodeAudioData(buf.slice(0));
      const d = audioBuf?.duration;

      const dur = Number.isFinite(d) && d > 0 ? d : 0;
      accurateDurationValueCache.set(audioUrl, dur);
      return dur;
    } catch {
      return 0;
    } finally {
      accurateDurationPromiseCache.delete(audioUrl);
    }
  })();

  accurateDurationPromiseCache.set(audioUrl, p);
  return p;
};

export const formatTime = (seconds: number): string => {
  const s = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

export const getDefaultVolume = (): number => 0.5;

// Pastikan URL audio absolut agar tidak bermasalah di nested routes/SSR
export const normalizeTrackUrl = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== "undefined") {
    const base = window.location.origin;
    return `${base}${url.startsWith("/") ? url : "/" + url}`;
  }
  return url; // fallback (client-only anyway)
};

export const loadTrackDuration = async (audioUrl: string): Promise<number> => {
  return getAudioDuration(audioUrl);
};

export const preloadTrackDurations = async (tracks: Track[]): Promise<void> => {
  const promises = tracks.map((t) => getAudioDuration(t.audioUrl));
  await Promise.allSettled(promises);
};

export const getCachedDuration = (audioUrl: string): number | null => {
  return durationValueCache.get(audioUrl) ?? null;
};

export const clearDurationCache = (): void => {
  durationValueCache.clear();
  durationPromiseCache.clear();
};

export const getOriginalTracks = (): Track[] => [
  {
    id: "I-Just-Died-In-Your-Arms",
    title: "(I Just) Died In Your Arms",
    artist: "Cutting Crew",
    album: "Broadcast",
    duration: 0,
    audioUrl: "/music/(I Just) Died In Your Arms.mp3",
    coverImage: "/music/images/Broadcast.jpg",
    genre: "Pop Rock",
  },
  {
    id: "Every-Breath-You-Take",
    title: "Every Breath You Take",
    artist: "The Police",
    album: "Synchronicity",
    duration: 0,
    audioUrl: "/music/Every Breath You Take.mp3",
    coverImage: "/music/images/Synchronicity.jpg",
    genre: "Rock",
  },
  {
    id: "I-Want-It-That-Way",
    title: "I Want It That Way",
    artist: "Backstreet Boys",
    album: "Millennium",
    duration: 0,
    audioUrl: "/music/I Want It That Way.mp3",
    coverImage: "/music/images/Millennium.jpg",
    genre: "Pop",
  },
  {
    id: "Basket-Case",
    title: "Basket Case",
    artist: "Green Day",
    album: "Dookie",
    duration: 0,
    audioUrl: "/music/Basket Case.mp3",
    coverImage: "/music/images/Dookie.jpg",
    genre: "Punk",
  },
  {
    id: "Without-You",
    title: "Without You",
    artist: "Air Supply",
    album: "The Earth Is...",
    duration: 0,
    audioUrl: "/music/Without You.mp3",
    coverImage: "/music/images/The Earth Is...jpg",
    genre: "Soft Rock",
  },
  {
    id: "Goodbye",
    title: "Goodbye",
    artist: "Air Supply",
    album: "The Vanishing Race",
    duration: 0,
    audioUrl: "/music/Goodbye.mp3",
    coverImage: "/music/images/The Vanishing Race.jpg",
    genre: "Soft Rock",
  },
  {
    id: "Heaven",
    title: "Heaven",
    artist: "Bryan Adams",
    album: "Reckless",
    duration: 0,
    audioUrl: "/music/Heaven.mp3",
    coverImage: "/music/images/Reckless.jpg",
    genre: "Soft Rock",
  },
  {
    id: "Please-Forgive-Me",
    title: "Please Forgive Me",
    artist: "Bryan Adams",
    album: "Classic",
    duration: 0,
    audioUrl: "/music/Please Forgive Me.mp3",
    coverImage: "/music/images/Classic.jpg",
    genre: "Soft Rock",
  },
  {
    id: "Bohemian-Rhapsody",
    title: "Bohemian Rhapsody",
    artist: "Queen",
    album: "A Night At The Opera",
    duration: 0,
    audioUrl: "/music/Bohemian Rhapsody.mp3",
    coverImage: "/music/images/A Night At The Opera - Remastered.jpg",
    genre: "Alternative Rock",
  },
  {
    id: "Hotel-California",
    title: "Hotel California",
    artist: "Eagles",
    album: "Hotel California",
    duration: 0,
    audioUrl: "/music/Hotel California.mp3",
    coverImage: "/music/images/Hotel California.jpg",
    genre: "Classic Rock",
  },
  {
    id: "Right-Here-Waiting",
    title: "Right Here Waiting",
    artist: "Richard Marx",
    album: "Repeat Offender",
    duration: 0,
    audioUrl: "/music/Right Here Waiting.mp3",
    coverImage: "/music/images/Repeat Offender.jpg",
    genre: "Soft Rock",
  },
  {
    id: "Carrie",
    title: "Carrie",
    artist: "Europe",
    album: "The Final Countdown",
    duration: 0,
    audioUrl: "/music/Carrie.mp3",
    coverImage: "/music/images/The Final Countdown.jpg",
    genre: "Glam Metal",
  },
  {
    id: "Bitter-Sweet-Symphony",
    title: "Bitter Sweet Symphony",
    artist: "The Verve",
    album: "Urban Hymns",
    duration: 0,
    audioUrl: "/music/Bitter Sweet Symphony.mp3",
    coverImage: "/music/images/Urban Hymns.jpg",
    genre: "Alternative Rock",
  },
  {
    id: "Listen-To-Your-Heart",
    title: "Listen To Your Heart",
    artist: "Roxette",
    album: "Look Sharp!",
    duration: 0,
    audioUrl: "/music/Listen To Your Heart.mp3",
    coverImage: "/music/images/Look Sharp!.jpg",
    genre: "Pop Rock",
  },
  {
    id: "Kickstart-My-Heart",
    title: "Kickstart My Heart",
    artist: "Motley Crüe",
    album: "Dr. Feelgood",
    duration: 0,
    audioUrl: "/music/Kickstart My Heart.mp3",
    coverImage: "/music/images/Dr. Feelgood.jpg",
    genre: "Glam Metal",
  },
  {
    id: "Take-on-Me",
    title: "Take on Me",
    artist: "a-ha",
    album: "Hunting High and Low",
    duration: 0,
    audioUrl: "/music/Take on Me.mp3",
    coverImage: "/music/images/Hunting High and Low.jpg",
    genre: "Classic Pop",
  },
  {
    id: "Scene-Eight-The-Spirit-Carries-On",
    title: "Scene Eight: The Spirit Carries On",
    artist: "Dream Theater",
    album: "Metropolis, Pt. 2 Scenes from a Memory",
    duration: 0,
    audioUrl: "/music/Scene Eight_ The Spirit Carries On.mp3",
    coverImage: "/music/images/Metropolis, Pt. 2 Scenes from a Memory.jpg",
    genre: "Progressive Metal",
  },
  {
    id: "Hysteria",
    title: "Hysteria",
    artist: "Muse",
    album: "Absolution",
    duration: 0,
    audioUrl: "/music/Hysteria.mp3",
    coverImage: "/music/images/Absolution.jpg",
    genre: "Alternative Rock",
  },
  {
    id: "Cryin",
    title: "Cryin'",
    artist: "Aerosmith",
    album: "Get A Grip",
    duration: 0,
    audioUrl: "/music/Cryin'.mp3",
    coverImage: "/music/images/Get A Grip.jpg",
    genre: "Hard Rock",
  },
  {
    id: "Hold-the-Line",
    title: "Hold the Line",
    artist: "TOTO",
    album: "Toto",
    duration: 0,
    audioUrl: "/music/Hold the Line.mp3",
    coverImage: "/music/images/Toto.jpg",
    genre: "Classic Rock",
  },
  {
    id: "Dont-Stop-Believin",
    title: "Don't Stop Believin'",
    artist: "Journey",
    album: "Escape",
    duration: 0,
    audioUrl: "/music/Dont Stop Believin.mp3",
    coverImage: "/music/images/Escape.jpg",
    genre: "Arena Rock",
  },
  {
    id: "I-Live-My-Life-For-You",
    title: "I Live My Life for You",
    artist: "FireHouse",
    album: "3",
    duration: 0,
    audioUrl: "/music/I Live My Life For You.mp3",
    coverImage: "/music/images/3.jpg",
    genre: "Hard Rock",
  },
  {
    id: "Runaway",
    title: "Runaway",
    artist: "Bon Jovi",
    album: "Bon Jovi",
    duration: 0,
    audioUrl: "/music/Runaway.mp3",
    coverImage: "/music/images/Bon Jovi.jpg",
    genre: "Hard Rock",
  },
  {
    id: "Youre-All-I-Need",
    title: "You're All I Need",
    artist: "White Lion",
    album: "Mane Attraction",
    duration: 0,
    audioUrl: "/music/Youre All I Need.mp3",
    coverImage: "/music/images/Mane Attraction.jpg",
    genre: "Hard Rock",
  },
  {
    id: "Chop-Suey",
    title: "Chop Suey!",
    artist: "System Of A Down",
    album: "Toxicity",
    duration: 0,
    audioUrl: "/music/Chop Suey!.mp3",
    coverImage: "/music/images/Toxicity.jpg",
    genre: "Alternative Metal",
  },
];
