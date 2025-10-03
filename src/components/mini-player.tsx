"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import {
  getMusicData,
  formatTime,
  getDefaultVolume,
  loadTrackDuration,
  preloadTrackDurations,
} from "@/services/music";
import { type MusicPlayerState } from "@/types/music";

export const MiniPlayer = () => {
  const { tracks } = getMusicData();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playerState, setPlayerState] = useState<MusicPlayerState>({
    currentTrack: tracks[0] || null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: getDefaultVolume(),
    isShuffled: false,
    repeatMode: "none",
    playlist: tracks,
    currentTrackIndex: 0,
    isExpanded: false,
  });

  const [isLoadingDuration, setIsLoadingDuration] = useState(false);

  const { currentTrack, isPlaying, currentTime, duration, volume, isExpanded } =
    playerState;

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Muat durasi saat track berubah
  useEffect(() => {
    const loadDuration = async () => {
      if (!currentTrack) return;
      setIsLoadingDuration(true);
      try {
        const realDuration = await loadTrackDuration(currentTrack.audioUrl);
        setPlayerState((prev) => ({
          ...prev,
          duration: realDuration,
        }));
      } catch (error) {
        console.warn("Failed to load track duration:", error);
      } finally {
        setIsLoadingDuration(false);
      }
    };
    loadDuration();
  }, [currentTrack]);

  // Preload durasi semua track saat mount
  useEffect(() => {
    const preloadDurations = async () => {
      try {
        await preloadTrackDurations(tracks);
      } catch (error) {
        console.warn("Failed to preload track durations:", error);
      }
    };
    preloadDurations();
  }, [tracks]);

  // Kontrol play/pause, ulangi panggilan play saat ganti track
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  const handlePlayPause = () => {
    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const handleNext = () => {
    setPlayerState((prev) => {
      const nextIndex = (prev.currentTrackIndex + 1) % prev.playlist.length;
      const nextTrack = prev.playlist[nextIndex];
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: 0, // akan dimuat lewat useEffect
        isPlaying: true, // selalu autoplay
      };
    });
  };

const PREV_RESTART_THRESHOLD = 3; // detik

const handlePrevious = () => {
  setPlayerState((prev) => {
    const t = prev.currentTime || 0;

    // Jika > 3 dtk: restart lagu saat ini ke 0 dan autoplay
    if (t > PREV_RESTART_THRESHOLD) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      return {
        ...prev,
        currentTime: 0,
        isPlaying: true,
      };
    }

    // Jika ≤ 3 dtk: pindah ke lagu sebelumnya dan autoplay
    const prevIndex =
      prev.currentTrackIndex === 0
        ? prev.playlist.length - 1
        : prev.currentTrackIndex - 1;

    const prevTrack = prev.playlist[prevIndex];

    return {
      ...prev,
      currentTrackIndex: prevIndex,
      currentTrack: prevTrack,
      currentTime: 0,
      duration: 0,
      isPlaying: true,
    };
  });
};


  const handleVolumeChange = (newVolume: number) => {
    setPlayerState((prev) => ({ ...prev, volume: newVolume }));
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
      }));
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const audioDuration = audioRef.current.duration;
    if (audioDuration && audioDuration > 0) {
      setPlayerState((prev) => ({
        ...prev,
        duration: audioDuration,
      }));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setPlayerState((prev) => ({ ...prev, currentTime: newTime }));
    }
  };

  const toggleExpanded = () => {
    setPlayerState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  };

  if (!currentTrack) return null;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="fixed right-2 sm:right-4 top-24 sm:top-20 z-40"
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="mini"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-2 w-48 sm:w-56 md:w-64 cursor-pointer"
              onClick={toggleExpanded}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
                  <Image
                    src={currentTrack.coverImage}
                    alt={currentTrack.title}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="flex items-center gap-0.5 audio-visualizer">
                        <div
                          className="w-0.5 h-2 bg-white rounded-full"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-0.5 h-3 bg-white rounded-full"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-0.5 h-1.5 bg-white rounded-full"
                          style={{ animationDelay: "300ms" }}
                        />
                        <div
                          className="w-0.5 h-2.5 bg-white rounded-full"
                          style={{ animationDelay: "450ms" }}
                        />
                        <div
                          className="w-0.5 h-1 bg-white rounded-full"
                          style={{ animationDelay: "600ms" }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-neutral-900 dark:text-white truncate">
                    {currentTrack.title}
                  </h4>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                    {currentTrack.artist}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayPause();
                    }}
                    className="p-1 sm:p-1.5 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-700 dark:text-neutral-300" />
                    ) : (
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-700 dark:text-neutral-300" />
                    )}
                  </button>

                  <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-neutral-500" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 p-3 w-48 sm:w-52 md:w-56"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  Now Playing
                </h3>
                <button
                  onClick={toggleExpanded}
                  className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              <div className="relative w-full h-36 sm:h-40 md:h-48 rounded-xl overflow-hidden mb-2 sm:mb-3">
                <Image
                  src={currentTrack.coverImage}
                  alt={currentTrack.title}
                  width={224}
                  height={192}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="text-center mb-2 sm:mb-3">
                <h4 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
                  <span>{formatTime(currentTime)}</span>
                  <span>
                    {isLoadingDuration ? (
                      <span className="animate-pulse">--:--</span>
                    ) : (
                      formatTime(duration)
                    )}
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  disabled={isLoadingDuration || duration === 0}
                  className="w-full h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider disabled:opacity-50 disabled:cursor-not-allowed"
                />

                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <button
                    onClick={handlePrevious}
                    className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-700 dark:text-neutral-300" />
                  </button>

                  <button
                    onClick={handlePlayPause}
                    className="p-1.5 sm:p-2 rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-neutral-900" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white dark:text-neutral-900 ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={handleNext}
                    className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-700 dark:text-neutral-300" />
                  </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neutral-600 dark:text-neutral-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) =>
                      handleVolumeChange(parseFloat(e.target.value))
                    }
                    className="flex-1 h-1.5 sm:h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 w-6 sm:w-8">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <style jsx>{`
        @keyframes audioWave {
          0%,
          100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }

        .audio-visualizer > div {
          animation: audioWave 1.2s ease-in-out infinite;
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};
