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
    // Cek cache terlebih dahulu
    if (durationCache.has(audioUrl)) {
      resolve(durationCache.get(audioUrl)!);
      return;
    }

    // Cek apakah sedang loading
    if (loadingDurations.has(audioUrl)) {
      // Wait for existing loading to complete
      const checkInterval = setInterval(() => {
        if (durationCache.has(audioUrl)) {
          clearInterval(checkInterval);
          resolve(durationCache.get(audioUrl)!);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error(`Timeout loading duration for ${audioUrl}`));
      }, 10000);
      return;
    }

    // Mark as loading
    loadingDurations.add(audioUrl);

    const audio = new Audio();
    
    const cleanup = () => {
      loadingDurations.delete(audioUrl);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplaythrough', onCanPlayThrough);
    };

    const onLoadedMetadata = () => {
      const duration = audio.duration;
      if (isFinite(duration) && duration > 0) {
        durationCache.set(audioUrl, duration);
        cleanup();
        resolve(duration);
      } else {
        cleanup();
        reject(new Error(`Invalid duration for ${audioUrl}`));
      }
    };

    const onError = (e: Event) => {
      cleanup();
      reject(new Error(`Failed to load audio metadata for ${audioUrl}: ${e}`));
    };

    const onCanPlayThrough = () => {
      // Fallback jika loadedmetadata tidak terpanggil
      if (!durationCache.has(audioUrl)) {
        const duration = audio.duration;
        if (isFinite(duration) && duration > 0) {
          durationCache.set(audioUrl, duration);
          cleanup();
          resolve(duration);
        }
      }
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplaythrough', onCanPlayThrough);
    
    // Set timeout untuk mencegah hanging
    setTimeout(() => {
      if (loadingDurations.has(audioUrl)) {
        cleanup();
        reject(new Error(`Timeout loading duration for ${audioUrl}`));
      }
    }, 15000);

    audio.src = audioUrl;
    audio.load();
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
  try {
    return await getAudioDuration(audioUrl);
  } catch (error) {
    console.warn(`Failed to load duration for ${audioUrl}:`, error);
    return 0; // Fallback duration
  }
};

export const loadAllTrackDurations = async (tracks: Track[]): Promise<Track[]> => {
  const loadPromises = tracks.map(async (track) => {
    try {
      const duration = await loadTrackDuration(track.audioUrl);
      return { ...track, duration };
    } catch (error) {
      console.warn(`Failed to load duration for track ${track.id}:`, error);
      return track; // Return original track with duration 0
    }
  });

  return Promise.all(loadPromises);
};

export const getCachedDuration = (audioUrl: string): number | null => {
  return durationCache.get(audioUrl) || null;
};

export const clearDurationCache = (): void => {
  durationCache.clear();
  loadingDurations.clear();
};
