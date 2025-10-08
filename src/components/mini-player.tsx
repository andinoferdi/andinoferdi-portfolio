"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronUp, ChevronDown } from "lucide-react";
import Image from "next/image";
import { getOriginalTracks, formatTime, getDefaultVolume, normalizeTrackUrl } from "@/services/music";
import type { MusicPlayerState } from "@/types/music";

// Utils volume
const clampVolume = (v: number) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
const loadStoredVolume = (): number => {
  try {
    const raw = localStorage.getItem("mp_volume");
    if (raw != null) return clampVolume(parseFloat(raw));
  } catch {}
  return getDefaultVolume();
};

const detectMobileSafari = (): boolean => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const maxTouchPoints = (navigator as Navigator & { maxTouchPoints?: number }).maxTouchPoints;
  const isIOS = /iP(ad|hone|od)/.test(ua) || (navigator.platform === "MacIntel" && maxTouchPoints && maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua) && /Apple/i.test(navigator.vendor || "");
  return Boolean(isIOS && isSafari);
};

export const MiniPlayer: React.FC = () => {
  // 1) Singleton audio element (detached from DOM)
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const changeTokenRef = useRef(0); // naik tiap ganti track → cegah overlap
  const transitioningRef = useRef(false); // guard transisi
  const isPlayingRef = useRef(false);
  const primedRef = useRef(false); // iOS output warm-up
  const isMobileSafariRef = useRef<boolean>(false);

  // 2) Playlist awal (shuffle sekali di mount)
  const shuffledPlaylist = useMemo(() => {
    const list = [...getOriginalTracks()].map(t => ({ ...t, audioUrl: normalizeTrackUrl(t.audioUrl) }));
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, []);

  const [playerState, setPlayerState] = useState<MusicPlayerState>(() => ({
    currentTrack: shuffledPlaylist[0] || null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: loadStoredVolume(),
    isShuffled: true,
    repeatMode: "none",
    playlist: shuffledPlaylist,
    currentTrackIndex: 0,
    isExpanded: false,
  }));

  const { currentTrack, isPlaying, currentTime, duration, volume, isExpanded } = playerState;

  // 3) Init audio once
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    a.crossOrigin = "anonymous";
    (a as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    a.volume = clampVolume(volume);
    
    // Mobile Safari specific settings
    isMobileSafariRef.current = detectMobileSafari();
    if (isMobileSafariRef.current) {
      a.preload = "metadata"; // iOS prefers metadata preload
      a.onloadstart = () => {}; // Prevent iOS audio context issues
    }

    const onTimeUpdate = () => {
      setPlayerState(prev => ({ ...prev, currentTime: a.currentTime || 0 }));
    };
    const onLoadedMetadata = () => {
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setPlayerState(prev => ({ ...prev, duration: a.duration }));
      }
    };
    const onEnded = () => {
      handleNext();
    };

    a.addEventListener("timeupdate", onTimeUpdate);
    a.addEventListener("loadedmetadata", onLoadedMetadata);
    a.addEventListener("ended", onEnded);

    audioRef.current = a;

    // Preload currentTrack on mount without autoplay
    if (currentTrack) {
      changeTrack(currentTrack, /* autoplay */ false);
    }

    return () => {
      a.pause();
      a.src = "";
      a.load();
      a.removeEventListener("timeupdate", onTimeUpdate);
      a.removeEventListener("loadedmetadata", onLoadedMetadata);
      a.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 4) Persist & apply volume
  useEffect(() => {
    try { localStorage.setItem("mp_volume", String(volume)); } catch {}
    const a = audioRef.current; if (a) a.volume = clampVolume(volume);
  }, [volume]);

  // Keep isPlaying in ref for async callbacks
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // 5) Core: changeTrack with token & robust cleanup
  const changeTrack = useCallback((track: NonNullable<MusicPlayerState["currentTrack"]>, autoplay: boolean) => {
    const a = audioRef.current; if (!a) return;

    transitioningRef.current = true;
    const token = ++changeTokenRef.current;

    // Full cleanup of previous media
    a.pause();
    a.src = "";
    a.load();
    try { a.currentTime = 0; } catch {}

    // Set new source
    a.src = normalizeTrackUrl(track.audioUrl);
    a.load();

    const ready = () => {
      // Ignore stale events
      if (changeTokenRef.current !== token) return;
      try { a.currentTime = 0; } catch {}
      transitioningRef.current = false;
      if (Number.isFinite(a.duration) && a.duration > 0) {
        setPlayerState(prev => ({ ...prev, duration: a.duration }));
      }
      if (autoplay && isPlayingRef.current) {
        // Mobile Safari needs user gesture for first play
        if (isMobileSafariRef.current && !primedRef.current) {
          primedRef.current = true;
          a.play().then(() => {
            a.pause();
            try { a.currentTime = 0; } catch {}
            if (isPlayingRef.current) {
              a.play().catch(() => {});
            }
          }).catch(() => {
            if (isPlayingRef.current) {
              a.play().catch(() => {});
            }
          });
        } else {
          a.play().catch(() => {});
        }
      }
    };

    // Mobile Safari needs different ready state handling
    if (isMobileSafariRef.current) {
      if (a.readyState >= 2) { // HAVE_CURRENT_DATA
        ready();
      } else {
        a.addEventListener("canplay", ready, { once: true });
      }
    } else {
      if (a.readyState >= 3) { // HAVE_FUTURE_DATA
        ready();
      } else {
        a.addEventListener("canplaythrough", ready, { once: true });
      }
    }
  }, []);

  // 6) Controls
  const handlePlayPause = useCallback(() => {
    const a = audioRef.current; if (!a) return;

    setPlayerState(prev => {
      const nextPlaying = !prev.isPlaying;
      // Only act after state is set; but we can act immediately too
      if (nextPlaying) {
        // If still transitioning, defer; otherwise play
        if (!transitioningRef.current) {
          // Mobile Safari needs user gesture for first play
          if (isMobileSafariRef.current && !primedRef.current) {
            primedRef.current = true;
            a.play().then(() => {
              a.pause();
              try { a.currentTime = 0; } catch {}
              a.play().catch(() => {});
            }).catch(() => {
              a.play().catch(() => {});
            });
          } else {
            a.play().catch(() => {});
          }
        }
      } else {
        a.pause();
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  }, []);

  const handleNext = useCallback(() => {
    if (transitioningRef.current) return; // guard spam
    setPlayerState(prev => {
      const nextIndex = (prev.currentTrackIndex + 1) % prev.playlist.length;
      const nextTrack = prev.playlist[nextIndex];
      // update state immediately for UI
      const updated = { ...prev, currentTrackIndex: nextIndex, currentTrack: nextTrack, currentTime: 0, duration: 0 };
      // switch audio with autoplay respecting current isPlaying
      changeTrack(nextTrack!, /* autoplay */ true);
      return updated;
    });
  }, [changeTrack]);

  const PREV_RESTART_THRESHOLD = 3;
  const handlePrevious = useCallback(() => {
    if (transitioningRef.current) return; // guard spam
    const a = audioRef.current; if (!a) return;

    setPlayerState(prev => {
      if ((prev.currentTime || 0) > PREV_RESTART_THRESHOLD) {
        try { a.currentTime = 0; } catch {}
        if (prev.isPlaying && !transitioningRef.current) {
          a.play().catch(() => {});
        }
        return { ...prev, currentTime: 0 };
      }
      const prevIndex = prev.currentTrackIndex === 0 ? prev.playlist.length - 1 : prev.currentTrackIndex - 1;
      const prevTrack = prev.playlist[prevIndex];
      const updated = { ...prev, currentTrackIndex: prevIndex, currentTrack: prevTrack, currentTime: 0, duration: 0 };
      changeTrack(prevTrack!, /* autoplay */ true);
      return updated;
    });
  }, [changeTrack]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const a = audioRef.current; if (!a) return;
    const newTime = parseFloat(e.target.value);
    try { a.currentTime = newTime; } catch {}
    setPlayerState(prev => ({ ...prev, currentTime: newTime }));
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setPlayerState(prev => ({ ...prev, volume: clampVolume(v) }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setPlayerState(prev => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const progressPercent = useMemo(() => (duration ? (currentTime / duration) * 100 : 0), [currentTime, duration]);
  const volumePercent = useMemo(() => volume * 100, [volume]);

  if (!currentTrack) return null;

  return (
    <>
      {/* Tidak ada <audio> di DOM. Kita pakai singleton Audio API di memory. */}
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed right-2 sm:right-4 top-24 sm:top-20 z-40 fix-mobile-flicker"
      >
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.div
              key="mini"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-background rounded-xl shadow-2xl border border-border p-2 w-48 sm:w-56 md:w-64 cursor-pointer fix-mobile-flicker gpu-accelerated"
              onClick={toggleExpanded}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden image-container">
                  <Image
                    src={currentTrack.coverImage || "/placeholder.svg"}
                    alt={currentTrack.title}
                    width={40}
                    height={40}
                    sizes="(max-width: 640px) 32px, 40px"
                    priority
                    className="w-full h-full object-cover fix-mobile-flicker"
                  />
                  {isPlaying && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="flex items-center gap-0.5">
                        <div className="w-0.5 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                        <div className="w-0.5 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                        <div className="w-0.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                        <div className="w-0.5 h-2.5 bg-white rounded-full animate-pulse" style={{ animationDelay: "450ms" }} />
                        <div className="w-0.5 h-1 bg-white rounded-full animate-pulse" style={{ animationDelay: "600ms" }} />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-xs text-foreground truncate">{currentTrack.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}
                    className="p-2 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
                    ) : (
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-background" />
                    )}
                  </button>

                  <ChevronUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="bg-background rounded-2xl shadow-2xl border border-border p-3 w-48 sm:w-52 md:w-56 fix-mobile-flicker gpu-accelerated"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h3 className="font-bold text-sm sm:text-base text-foreground">Now Playing</h3>
                <button onClick={toggleExpanded} className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                  <ChevronDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                </button>
              </div>

              <div className="relative w-full h-36 sm:h-40 md:h-48 rounded-xl overflow-hidden mb-2 sm:mb-3">
                <div className="relative w-full h-full rounded-xl overflow-hidden image-container">
                  <Image
                    src={currentTrack.coverImage || "/placeholder.svg"}
                    alt={currentTrack.title}
                    width={224}
                    height={192}
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                    priority
                    className="w-full h-full object-contain fix-mobile-flicker"
                  />
                </div>
              </div>

              <div className="text-center mb-2 sm:mb-3">
                <h4 className="font-bold text-sm sm:text-base text-foreground">{currentTrack.title}</h4>
                <p className="text-xs text-muted-foreground">{currentTrack.artist}</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>

                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 sm:h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercent}%, rgba(150, 150, 150, 0.3) ${progressPercent}%, rgba(150, 150, 150, 0.3) 100%)`,
                  }}
                />

                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  <button onClick={handlePrevious} className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" />
                  </button>

                  <button onClick={handlePlayPause} className="p-1.5 sm:p-2 rounded-full bg-foreground hover:bg-foreground/90 transition-colors">
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background" />
                    ) : (
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background ml-0.5" />
                    )}
                  </button>

                  <button onClick={handleNext} className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                    <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" />
                  </button>
                </div>

                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Volume2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 sm:h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volumePercent}%, rgba(150, 150, 150, 0.3) ${volumePercent}%, rgba(150, 150, 150, 0.3) 100%)`,
                    }}
                  />
                  <span className="text-xs text-muted-foreground w-6 sm:w-8">{Math.round(volume * 100)}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};