import { type Track, type Playlist } from "@/types/music";

const durationValueCache = new Map<string, number>(); // nilai durasi final
const durationPromiseCache = new Map<string, Promise<number>>(); // in-flight promise

export const getMusicData = (): { tracks: Track[]; playlists: Playlist[] } => {
  return {
    tracks: [
      {
        id: "every-breath-you-take",
        title: "Every Breath You Take",
        artist: "The Police",
        album: "Synchronicity",
        duration: 0,
        audioUrl: "/music/Every Breath You Take.mp3", // disarankan ganti kebab-case tanpa spasi
        coverImage: "/music/images/Every Breath You Take.jpeg",
        genre: "Rock",
      },
      {
        id: "i-want-it-that-way",
        title: "I Want It That Way",
        artist: "Backstreet Boys",
        album: "Millennium",
        duration: 0,
        audioUrl: "/music/I Want It That Way.mp3",
        coverImage: "/music/images/I Want It That Way.jpeg",
        genre: "Pop",
      },
    ],
    playlists: [
      {
        id: "default-playlist",
        name: "My Playlist",
        tracks: [
          {
            id: "every-breath-you-take",
            title: "Every Breath You Take",
            artist: "The Police",
            album: "Synchronicity",
            duration: 0,
            audioUrl: "/music/Every Breath You Take.mp3",
            coverImage: "/music/images/Every Breath You Take.jpeg",
            genre: "Rock",
          },
          {
            id: "i-want-it-that-way",
            title: "I Want It That Way",
            artist: "Backstreet Boys",
            album: "Millennium",
            duration: 0,
            audioUrl: "/music/I Want It That Way.mp3",
            coverImage: "/music/images/I Want It That Way.jpeg",
            genre: "Pop",
          },
        ],
        coverImage: "/music/images/Every Breath You Take.jpeg",
      },
    ],
  };
};

export const getAudioDuration = (audioUrl: string): Promise<number> => {
  // Guard SSR
  if (typeof window === "undefined") return Promise.resolve(0);

  // Cache nilai final
  if (durationValueCache.has(audioUrl)) {
    return Promise.resolve(durationValueCache.get(audioUrl)!);
  }

  // Cache in-flight promise
  if (durationPromiseCache.has(audioUrl)) {
    return durationPromiseCache.get(audioUrl)!;
  }

  const p = new Promise<number>((resolve) => {
    const audio = new Audio();
    const encodedSrc = encodeURI(audioUrl); // aman untuk spasi
    let settled = false;

    const done = (value: number) => {
      if (settled) return;
      settled = true;
      durationValueCache.set(audioUrl, value);
      durationPromiseCache.delete(audioUrl);
      // cleanup
      audio.removeAttribute("src");
      audio.load();
      resolve(value);
    };

    const timeoutId = window.setTimeout(() => {
      // timeout: kembalikan 0 agar UI nonaktifkan slider
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

    audio.crossOrigin = "anonymous"; // aman utk same-origin; diperlukan bila CDN
    audio.preload = "metadata";
    audio.src = encodedSrc;
  });

  durationPromiseCache.set(audioUrl, p);
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

export const loadTrackDuration = async (audioUrl: string): Promise<number> => {
  // satu pintu lewat getAudioDuration agar cache konsisten
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
