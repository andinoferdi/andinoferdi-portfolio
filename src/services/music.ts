import { type Track, type Playlist } from "@/types/music";

export const getMusicData = (): { tracks: Track[]; playlists: Playlist[] } => {
  return {
    tracks: [
      {
        id: "every-breath-you-take",
        title: "Every Breath You Take",
        artist: "The Police",
        album: "Synchronicity",
        duration: 0, // Will be detected automatically
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
            duration: 0, // Will be detected automatically
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
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', (e) => {
      reject(e);
    });
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
