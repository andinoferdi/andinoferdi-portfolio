import { type Track, type Playlist } from "@/types/music";

// Cache untuk menyimpan durasi yang sudah dimuat
const durationCache = new Map<string, number>();

// Loading state untuk durasi yang sedang dimuat
const loadingDurations = new Set<string>();

export const getMusicData = (): { tracks: Track[]; playlists: Playlist[] } => {
  return {
    tracks: [
      {
        id: "every-breath-you-take",
        title: "Every Breath You Take",
        artist: "The Police",
        album: "Synchronicity",
        duration: 0, // Will be loaded dynamically
        audioUrl: "/music/Every Breath You Take.mp3",
        coverImage: "/music/images/Every Breath You Take.jpeg",
        genre: "Rock"
      }
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
            duration: 0, // Will be loaded dynamically
            audioUrl: "/music/Every Breath You Take.mp3",
            coverImage: "/music/images/Every Breath You Take.jpeg",
            genre: "Rock"
          }
        ],
        coverImage: "/music/images/Every Breath You Take.jpeg"
      }
    ]
  };
};

export const getAudioDuration = (audioUrl: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    
    // Set timeout untuk menghindari loading yang terlalu lama
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout loading audio: ${audioUrl}`));
    }, 10000); // 10 detik timeout
    
    audio.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        resolve(audio.duration);
      } else {
        reject(new Error(`Invalid duration for audio: ${audioUrl}`));
      }
    });
    
    audio.addEventListener('error', (e) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load audio: ${audioUrl} - ${e.type}`));
    });
    
    // Set crossOrigin untuk menghindari CORS issues
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    audio.src = audioUrl;
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getDefaultVolume = (): number => {
  return 0.5; 
};

export const loadTrackDuration = async (audioUrl: string): Promise<number> => {
  // Cek cache terlebih dahulu
  if (durationCache.has(audioUrl)) {
    return durationCache.get(audioUrl)!;
  }

  // Cek apakah sedang loading
  if (loadingDurations.has(audioUrl)) {
    // Wait for existing loading to complete
    return new Promise((resolve, reject) => {
      const checkCache = () => {
        if (durationCache.has(audioUrl)) {
          resolve(durationCache.get(audioUrl)!);
        } else if (!loadingDurations.has(audioUrl)) {
          reject(new Error(`Failed to load duration for ${audioUrl}`));
        } else {
          setTimeout(checkCache, 100);
        }
      };
      checkCache();
    });
  }

  // Mark as loading
  loadingDurations.add(audioUrl);

  try {
    const duration = await getAudioDuration(audioUrl);
    durationCache.set(audioUrl, duration);
    return duration;
  } catch (error) {
    console.warn(`Failed to load duration for ${audioUrl}:`, error);
    // Set fallback duration (4:12 = 252 seconds)
    const fallbackDuration = 252;
    durationCache.set(audioUrl, fallbackDuration);
    return fallbackDuration;
  } finally {
    // Remove from loading set
    loadingDurations.delete(audioUrl);
  }
};

export const preloadTrackDurations = async (tracks: Track[]): Promise<void> => {
  const promises = tracks.map(track => loadTrackDuration(track.audioUrl));
  await Promise.allSettled(promises);
};

export const getCachedDuration = (audioUrl: string): number | null => {
  return durationCache.get(audioUrl) || null;
};

export const clearDurationCache = (): void => {
  durationCache.clear();
  loadingDurations.clear();
};
