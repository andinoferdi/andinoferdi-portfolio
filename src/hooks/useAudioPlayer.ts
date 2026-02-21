"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getOriginalTracks,
  normalizeTrackUrl,
  getDefaultVolume,
} from "@/services/music";
import { getPreloadedAudioObjectUrl, preloadImage } from "@/services/preload";
import type { MusicPlayerState, Track } from "@/types/music";

const clamp01 = (v: number) =>
  Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;

const clampTime = (t: number, dur: number) => {
  const safeT = Number.isFinite(t) ? t : 0;
  if (Number.isFinite(dur) && dur > 0) return Math.min(Math.max(0, safeT), dur);
  return Math.max(0, safeT);
};

const loadStoredVolume = (): number => {
  try {
    const raw = localStorage.getItem("mp_volume");
    if (raw != null) return clamp01(parseFloat(raw));
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

  const volumeRef = useRef(loadStoredVolume());
  const durationRef = useRef(0);

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
    volume: volumeRef.current,
    isShuffled: true,
    repeatMode: "none",
    playlist: shuffledPlaylist,
    currentTrackIndex: 0,
    isExpanded: false,
    isTrackLoading: false,
  }));

  const { currentTrack, isPlaying, currentTime, duration, volume } =
    playerState;

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    volumeRef.current = volume;
    try {
      localStorage.setItem("mp_volume", String(volume));
    } catch {}

    const a = audioRef.current;
    if (a) a.volume = clamp01(volume);
  }, [volume]);

  const waitCanPlay = (audio: HTMLAudioElement, token: number) =>
    new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const cleanup = () => {
        audio.removeEventListener("canplay", onCanPlay);
        audio.removeEventListener("error", onError);
        if (timeoutId) clearTimeout(timeoutId);
      };

      const onCanPlay = () => {
        if (settled) return;
        if (changeTokenRef.current !== token) {
          settled = true;
          cleanup();
          return;
        }
        settled = true;
        cleanup();
        resolve();
      };

      const onError = () => {
        if (settled) return;
        if (changeTokenRef.current !== token) {
          settled = true;
          cleanup();
          return;
        }
        settled = true;
        cleanup();
        reject(new Error("audio error"));
      };

      timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error("canplay timeout"));
      }, 15000);

      audio.addEventListener("canplay", onCanPlay);
      audio.addEventListener("error", onError);

      if (audio.readyState >= 2) onCanPlay();
    });

  const changeTrack = useCallback(async (track: Track, shouldPlay: boolean) => {
    const audio = audioRef.current;
    if (!audio) return;

    const token = ++changeTokenRef.current;
    const releaseTransition = () => {
      if (changeTokenRef.current === token) {
        transitioningRef.current = false;
      }
    };

    transitioningRef.current = true;

    durationRef.current = 0;

    setPlayerState((prev) => ({
      ...prev,
      isTrackLoading: true,
      currentTime: 0,
      duration: 0,
    }));

    if (track.coverImage) {
      void preloadImage(track.coverImage);
    }

    const normalizedTrackUrl = normalizeTrackUrl(track.audioUrl);
    const preloadedAudioUrl =
      getPreloadedAudioObjectUrl(track.audioUrl) ||
      getPreloadedAudioObjectUrl(normalizedTrackUrl);
    const encodedUrl = preloadedAudioUrl || encodeURI(normalizedTrackUrl);

    audio.pause();
    try {
      audio.currentTime = 0;
    } catch {}

    audio.src = encodedUrl;
    audio.load();

    try {
      await waitCanPlay(audio, token);
    } catch {
      if (changeTokenRef.current !== token) return;
      releaseTransition();
      setPlayerState((prev) => ({
        ...prev,
        isTrackLoading: false,
        isPlaying: false,
      }));
      return;
    }

    if (changeTokenRef.current !== token) return;

    const quickDur =
      Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 0;

    durationRef.current = quickDur;
    setPlayerState((prev) => ({
      ...prev,
      isTrackLoading: false,
      duration: quickDur,
    }));

    if (!shouldPlay) {
      releaseTransition();
      return;
    }

    try {
      let played = false;

      try {
        await audio.play();
        played = true;
      } catch {}

      if (!played) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (changeTokenRef.current !== token) return;

        try {
          await audio.play();
          played = true;
        } catch {}
      }

      if (changeTokenRef.current !== token) return;
      setPlayerState((prev) => ({ ...prev, isPlaying: played }));
    } finally {
      releaseTransition();
    }
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    (audio as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
    audio.volume = clamp01(volumeRef.current);

    audioRef.current = audio;

    const onTimeUpdate = () => {
      const dur =
        durationRef.current ||
        (Number.isFinite(audio.duration) ? audio.duration : 0);
      const ct = clampTime(audio.currentTime || 0, dur);
      setPlayerState((prev) => ({
        ...prev,
        currentTime: ct,
      }));
    };

    const onLoadedMetadata = () => {
      const d =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0;
      if (!d) return;

      durationRef.current = Math.max(durationRef.current || 0, d);
      setPlayerState((prev) => ({
        ...prev,
        duration: Math.max(prev.duration || 0, d),
      }));
    };

    const onDurationChange = () => {
      const ct = audio.currentTime || 0;
      if (ct > 2) return;

      const d =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : 0;
      if (!d) return;

      durationRef.current = Math.max(durationRef.current || 0, d);
      setPlayerState((prev) => ({
        ...prev,
        duration: Math.max(prev.duration || 0, d),
      }));
    };

    const onEnded = () => {
      if (transitioningRef.current) return;
      handleNext();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);

    if (playerState.currentTrack) {
      changeTrack(playerState.currentTrack, false);
    }

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);

      audio.pause();
      audio.src = "";
      audio.load();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlayingRef.current) {
      audio.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      return;
    }

    if (transitioningRef.current) return;

    try {
      await audio.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    } catch {
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const handleNext = useCallback(() => {
    if (transitioningRef.current) return;
    const wasPlaying = isPlayingRef.current;

    setPlayerState((prev) => {
      const nextIndex = (prev.currentTrackIndex + 1) % prev.playlist.length;
      const nextTrack = prev.playlist[nextIndex]!;
      changeTrack(nextTrack, wasPlaying);
      return {
        ...prev,
        currentTrackIndex: nextIndex,
        currentTrack: nextTrack,
        currentTime: 0,
        duration: 0,
      };
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
        return { ...prev, currentTime: 0 };
      }

      const wasPlaying = isPlayingRef.current;
      const prevIndex =
        prev.currentTrackIndex === 0
          ? prev.playlist.length - 1
          : prev.currentTrackIndex - 1;

      const prevTrack = prev.playlist[prevIndex]!;
      changeTrack(prevTrack, wasPlaying);

      return {
        ...prev,
        currentTrackIndex: prevIndex,
        currentTrack: prevTrack,
        currentTime: 0,
        duration: 0,
      };
    });
  }, [changeTrack]);

  const handleSeek = useCallback((newTime: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    const dur =
      durationRef.current ||
      (Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : 0);

    const t = clampTime(newTime, dur);

    try {
      audio.currentTime = t;
    } catch {}

    setPlayerState((prev) => ({ ...prev, currentTime: t }));
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setPlayerState((prev) => ({ ...prev, volume: clamp01(newVolume) }));
  }, []);

  const toggleExpanded = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const progressPercent = useMemo(() => {
    if (!duration || duration <= 0) return 0;
    return Math.min(
      100,
      Math.max(0, (Math.min(currentTime, duration) / duration) * 100)
    );
  }, [currentTime, duration]);

  const volumePercent = useMemo(() => clamp01(volume) * 100, [volume]);

  return {
    playerState,
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isExpanded: playerState.isExpanded,
    isTrackLoading: playerState.isTrackLoading,
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
