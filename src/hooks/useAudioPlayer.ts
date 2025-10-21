"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getOriginalTracks,
  normalizeTrackUrl,
  getDefaultVolume,
} from "@/services/music";
import { isAssetPreloaded } from "@/services/preload";
import type { MusicPlayerState, Track } from "@/types/music";

const clampVolume = (v: number) =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;

const loadStoredVolume = (): number => {
  try {
    const raw = localStorage.getItem("mp_volume");
    if (raw != null) return clampVolume(parseFloat(raw));
  } catch {}
  return getDefaultVolume();
};

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const useAudioPlayer = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const changeTokenRef = useRef(0);
  const transitioningRef = useRef(false);
  const isPlayingRef = useRef(false);
  const seekRafRef = useRef<number | null>(null);

  const shuffledPlaylist = useMemo(() => {
    const list = [...getOriginalTracks()].map((t) => ({
      ...t,
      audioUrl: normalizeTrackUrl(t.audioUrl),
    }));
    return shuffleArray(list);
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
    isTrackLoading: false,
  }));

  const { currentTrack, isPlaying, currentTime, duration, volume, isExpanded, isTrackLoading } =
    playerState;

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audio.volume = clampVolume(volume);

    const onTimeUpdate = () => {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: audio.currentTime || 0,
      }));
    };

    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setPlayerState((prev) => ({ ...prev, duration: audio.duration }));
      }
    };

    const onEnded = () => {
      handleNext();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    audioRef.current = audio;

    if (currentTrack) {
      changeTrack(currentTrack, false);
    }

    return () => {
      audio.pause();
      audio.src = "";
      audio.load();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("mp_volume", String(volume));
    } catch {}
    const audio = audioRef.current;
    if (audio) audio.volume = clampVolume(volume);
  }, [volume]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const changeTrack = useCallback((track: Track, shouldPlay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    const normalizedUrl = normalizeTrackUrl(track.audioUrl);
    const isCached = isAssetPreloaded(track.audioUrl);

    setPlayerState((prev) => ({ ...prev, isTrackLoading: !isCached }));
    transitioningRef.current = true;
    const token = ++changeTokenRef.current;

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {}

    audio.src = normalizedUrl;
    audio.preload = "auto";
    audio.load();

    const ready = () => {
      if (changeTokenRef.current !== token) return;
      try {
        audio.currentTime = 0;
      } catch {}
      transitioningRef.current = false;
      setPlayerState((prev) => ({ ...prev, isTrackLoading: false }));
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setPlayerState((prev) => ({ ...prev, duration: audio.duration }));
      }
      if (shouldPlay) {
        audio.play().catch(() => {});
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      }
    };

    if (isCached && audio.readyState >= 3) {
      ready();
    } else if (audio.readyState >= 3) {
      ready();
    } else {
      audio.addEventListener("canplaythrough", ready, { once: true });
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setPlayerState((prev) => {
      const nextPlaying = !prev.isPlaying;
      if (nextPlaying) {
        if (!transitioningRef.current) {
          audio.play().catch(() => {});
        }
      } else {
        audio.pause();
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  }, []);

  const handleNext = useCallback(() => {
    if (transitioningRef.current) return;
    const wasPlaying = isPlayingRef.current;
    setPlayerState((prev) => {
      const nextIndex = (prev.currentTrackIndex + 1) % prev.playlist.length;
      const nextTrack = prev.playlist[nextIndex]!;
      const updated = {
        ...prev,
        currentTrackIndex: nextIndex,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: 0,
      };
      changeTrack(nextTrack, wasPlaying);
      return updated;
    });
  }, [changeTrack]);

  const PREV_RESTART_THRESHOLD = 3;
  const handlePrevious = useCallback(() => {
    if (transitioningRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    setPlayerState((prev) => {
      if ((prev.currentTime || 0) > PREV_RESTART_THRESHOLD) {
        try {
          audio.currentTime = 0;
        } catch {}
        if (prev.isPlaying && !transitioningRef.current) {
          audio.play().catch(() => {});
        }
        return { ...prev, currentTime: 0 };
      }

      const wasPlaying = isPlayingRef.current;
      const prevIndex =
        prev.currentTrackIndex === 0
          ? prev.playlist.length - 1
          : prev.currentTrackIndex - 1;
      const prevTrack = prev.playlist[prevIndex]!;
      const updated = {
        ...prev,
        currentTrackIndex: prevIndex,
        currentTrack: prevTrack,
        currentTime: 0,
        duration: 0,
      };
      changeTrack(prevTrack, wasPlaying);
      return updated;
    });
  }, [changeTrack]);

  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (seekRafRef.current) cancelAnimationFrame(seekRafRef.current);
    seekRafRef.current = requestAnimationFrame(() => {
      try {
        audio.currentTime = newTime;
      } catch {}
      setPlayerState((prev) => ({ ...prev, currentTime: newTime }));
    });
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setPlayerState((prev) => ({ ...prev, volume: clampVolume(newVolume) }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const progressPercent = useMemo(
    () => (duration ? (currentTime / duration) * 100 : 0),
    [currentTime, duration]
  );
  const volumePercent = useMemo(() => volume * 100, [volume]);

  return {
    playerState,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isExpanded,
    isTrackLoading,
    progressPercent,
    volumePercent,
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleSeek,
    handleVolumeChange,
    toggleExpanded,
  } as const;
};
