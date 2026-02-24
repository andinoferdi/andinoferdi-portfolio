"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatTime } from "@/services/music";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const SEEK_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

function SmartImage({
  src,
  alt,
  imgClass,
  blurDataURL,
}: {
  src: string;
  alt: string;
  imgClass?: string;
  blurDataURL?: string;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <Image
        src={hasError ? "/placeholder.svg" : src || "/placeholder.svg"}
        alt={alt}
        fill
        sizes="224px"
        className={imgClass}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}

export const MiniPlayer: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isExpanded,
    isTrackLoading,
    isEngineTransitioning,
    volumePercent,
    handlePlayPause,
    handleNext,
    handlePrevious,
    handleSeek,
    handleVolumeChange,
    toggleExpanded,
  } = useAudioPlayer();

  const [hasAnimated, setHasAnimated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [hasLoadedInitialTrack, setHasLoadedInitialTrack] = useState(false);

  useEffect(() => {
    if (currentTrack && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [currentTrack, hasAnimated]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const checkReducedMotion = () => {
      setPrefersReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      );
    };

    checkMobile();
    checkReducedMotion();

    window.addEventListener("resize", checkMobile);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    mediaQuery.addEventListener("change", checkReducedMotion);

    return () => {
      window.removeEventListener("resize", checkMobile);
      mediaQuery.removeEventListener("change", checkReducedMotion);
    };
  }, []);

  useEffect(() => {
    if (!isTrackLoading && currentTrack && !hasLoadedInitialTrack) {
      setHasLoadedInitialTrack(true);
    }
  }, [currentTrack, hasLoadedInitialTrack, isTrackLoading]);

  if (!currentTrack) return null;

  return (
    <motion.div
      initial={
        hasAnimated
          ? { x: 0, opacity: 1 }
          : isMobile
          ? { opacity: 0 }
          : { x: 400, opacity: 0 }
      }
      animate={{ x: 0, opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : isMobile ? 0.15 : 0.3,
        ease: "easeOut",
      }}
      style={{
        willChange: "transform, opacity",
      }}
      className="fixed right-2 sm:right-4 top-24 sm:top-20 z-40"
    >
      {isTrackLoading && !hasLoadedInitialTrack && (
        <div
          className={cn(
            "absolute inset-0 rounded-xl flex items-center justify-center z-50",
            isMobile ? "bg-background/90" : "bg-background/80 backdrop-blur-sm"
          )}
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading track...
          </div>
        </div>
      )}
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <MiniPlayerCollapsed
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onExpand={toggleExpanded}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
            isEngineTransitioning={isEngineTransitioning}
          />
        ) : (
          <MiniPlayerExpanded
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            volumePercent={volumePercent}
            onPlayPause={handlePlayPause}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onCollapse={toggleExpanded}
            isMobile={isMobile}
            prefersReducedMotion={prefersReducedMotion}
            isEngineTransitioning={isEngineTransitioning}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface MiniPlayerCollapsedProps {
  currentTrack: NonNullable<ReturnType<typeof useAudioPlayer>["currentTrack"]>;
  isPlaying: boolean;
  onPlayPause: () => void;
  onExpand: () => void;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  isEngineTransitioning: boolean;
}

const MiniPlayerCollapsed: React.FC<MiniPlayerCollapsedProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onExpand,
  isMobile,
  prefersReducedMotion,
  isEngineTransitioning,
}) => (
  <motion.div
    key="mini"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{
      duration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.5,
      ease: "easeOut",
    }}
    style={{
      willChange: "transform, opacity",
    }}
    className="bg-background rounded-xl shadow-2xl border border-border p-2 w-48 sm:w-56 md:w-64 cursor-pointer"
    onClick={onExpand}
    role="button"
    tabIndex={0}
    aria-label={`Now playing: ${currentTrack.title} by ${currentTrack.artist}`}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onExpand();
      }
    }}
  >
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg overflow-hidden">
        <SmartImage
          key={currentTrack.id}
          src={currentTrack.coverImage || "/placeholder.svg"}
          alt={currentTrack.title}
          imgClass="object-cover"
        />
        {isPlaying && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="flex items-center gap-0.5">
              <div
                className="w-0.5 h-2 bg-white rounded-full animate-pulse"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-0.5 h-3 bg-white rounded-full animate-pulse"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-0.5 h-1.5 bg-white rounded-full animate-pulse"
                style={{ animationDelay: "300ms" }}
              />
              <div
                className="w-0.5 h-2.5 bg-white rounded-full animate-pulse"
                style={{ animationDelay: "450ms" }}
              />
              <div
                className="w-0.5 h-1 bg-white rounded-full animate-pulse"
                style={{ animationDelay: "600ms" }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-xs text-foreground truncate">
          {currentTrack.title}
        </h4>
        <p className="text-xs text-muted-foreground truncate">
          {currentTrack.artist}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPlayPause();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          disabled={isEngineTransitioning}
          className="p-2 rounded-full bg-foreground text-background hover:bg-foreground/80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={isPlaying ? "Pause" : "Play"}
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
);

interface MiniPlayerExpandedProps {
  currentTrack: NonNullable<ReturnType<typeof useAudioPlayer>["currentTrack"]>;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  volumePercent: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onCollapse: () => void;
  isMobile: boolean;
  prefersReducedMotion: boolean;
  isEngineTransitioning: boolean;
}

const MiniPlayerExpanded: React.FC<MiniPlayerExpandedProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  volumePercent,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onCollapse,
  isMobile,
  prefersReducedMotion,
  isEngineTransitioning,
}) => {
  const TRACK_TRANSITION_MS = 180;
  const PREV_RESTART_THRESHOLD = 3;
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(currentTime);
  const [displayTime, setDisplayTime] = useState(currentTime);
  const [isTrackTransitioning, setIsTrackTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(volume <= 0.001);
  const transitionRafRef = useRef<number | null>(null);
  const transitionTimeoutRef = useRef<number | null>(null);
  const prevTrackIdRef = useRef(currentTrack.id);
  const isSeekingRef = useRef(false);
  const lastNonZeroVolumeRef = useRef(volume > 0.001 ? volume : 0.2);

  useEffect(() => {
    if (!isSeeking && !isTrackTransitioning) {
      setSeekValue(currentTime);
    }
  }, [currentTime, isSeeking, isTrackTransitioning]);

  useEffect(() => {
    if (!isSeeking && !isTrackTransitioning) {
      setDisplayTime(currentTime);
    }
  }, [currentTime, isSeeking, isTrackTransitioning]);

  useEffect(() => {
    const muted = volume <= 0.001;
    setIsMuted(muted);
    if (!muted) {
      lastNonZeroVolumeRef.current = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (transitionRafRef.current) {
        cancelAnimationFrame(transitionRafRef.current);
      }
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    isSeekingRef.current = isSeeking;
  }, [isSeeking]);

  useEffect(() => {
    const trackChanged = prevTrackIdRef.current !== currentTrack.id;
    prevTrackIdRef.current = currentTrack.id;

    if (!isTrackTransitioning || !trackChanged) return;

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }
    transitionTimeoutRef.current = window.setTimeout(() => {
      setIsTrackTransitioning(false);
      transitionTimeoutRef.current = null;
    }, prefersReducedMotion ? 0 : TRACK_TRANSITION_MS);

    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
    };
  }, [
    TRACK_TRANSITION_MS,
    currentTrack.id,
    isTrackTransitioning,
    prefersReducedMotion,
  ]);

  const animateDisplayTimeToZero = useCallback(
    (fromTime: number, onDone: () => void) => {
      if (prefersReducedMotion) {
        setDisplayTime(0);
        onDone();
        return;
      }

      if (transitionRafRef.current) {
        cancelAnimationFrame(transitionRafRef.current);
      }

      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / TRACK_TRANSITION_MS);
        const eased = 1 - (1 - t) * (1 - t);
        setDisplayTime(Math.max(0, fromTime * (1 - eased)));
        if (t < 1) {
          transitionRafRef.current = requestAnimationFrame(step);
          return;
        }
        transitionRafRef.current = null;
        onDone();
      };

      transitionRafRef.current = requestAnimationFrame(step);
    },
    [prefersReducedMotion]
  );

  const runTrackChangeTransition = useCallback(
    (action: () => void) => {
      if (isTrackTransitioning) return;

      const fromTime = isSeeking ? seekValue : displayTime;
      setIsTrackTransitioning(true);

      animateDisplayTimeToZero(fromTime, () => {
        action();
        if (transitionTimeoutRef.current) {
          window.clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = window.setTimeout(() => {
          setIsTrackTransitioning(false);
          transitionTimeoutRef.current = null;
        }, prefersReducedMotion ? 0 : TRACK_TRANSITION_MS * 3);
      });
    },
    [
      animateDisplayTimeToZero,
      displayTime,
      isSeeking,
      isTrackTransitioning,
      prefersReducedMotion,
      seekValue,
    ]
  );

  const toggleMute = useCallback(() => {
    if (isMuted) {
      onVolumeChange(lastNonZeroVolumeRef.current > 0.001 ? lastNonZeroVolumeRef.current : 0.2);
      return;
    }

    if (volume > 0.001) {
      lastNonZeroVolumeRef.current = volume;
    }
    onVolumeChange(0);
  }, [isMuted, onVolumeChange, volume]);

  const handlePreviousClick = useCallback(() => {
    if (currentTime > PREV_RESTART_THRESHOLD) {
      isSeekingRef.current = false;
      setIsSeeking(false);
      setSeekValue(0);
      setDisplayTime(0);
      onSeek(0);
      return;
    }
    runTrackChangeTransition(onPrevious);
  }, [currentTime, onPrevious, onSeek, runTrackChangeTransition]);

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const rawDisplayTime = isSeeking ? seekValue : displayTime;
  const safeDisplayTime =
    safeDuration > 0
      ? Math.min(Math.max(0, rawDisplayTime), safeDuration)
      : Math.max(0, rawDisplayTime);
  const displayProgress =
    safeDuration > 0
      ? Math.min(100, Math.max(0, (safeDisplayTime / safeDuration) * 100))
      : 0;
  const controlsLocked = isTrackTransitioning || isEngineTransitioning;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(parseFloat(e.target.value));
  };

  const commitSeek = useCallback(() => {
    if (!isSeekingRef.current) return;

    isSeekingRef.current = false;
    setIsSeeking(false);
    if (safeDuration <= 0 || isTrackTransitioning) {
      setSeekValue(0);
      setDisplayTime(0);
      return;
    }

    const nextTime = Math.min(Math.max(0, seekValue), safeDuration);
    setSeekValue(nextTime);
    setDisplayTime(nextTime);
    onSeek(nextTime);
  }, [isTrackTransitioning, onSeek, safeDuration, seekValue]);

  return (
    <motion.div
      key="expanded"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.5,
        ease: "easeOut",
      }}
      style={{
        willChange: "transform, opacity",
      }}
      className="bg-background rounded-2xl shadow-2xl border border-border overflow-hidden w-48 sm:w-52 md:w-56"
      role="dialog"
      aria-label="Music player controls"
    >
      <motion.div
        className="relative w-full aspect-square"
        animate={{ opacity: isTrackTransitioning ? 0.45 : 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : TRACK_TRANSITION_MS / 1000, ease: "easeInOut" }}
      >
        <SmartImage
          key={currentTrack.id}
          src={currentTrack.coverImage || "/placeholder.svg"}
          alt={currentTrack.title}
          imgClass="object-cover"
        />
        <button
          onClick={onCollapse}
          className="absolute right-2 top-2 rounded-full bg-black/40 p-1 text-white backdrop-blur-sm transition-colors hover:bg-black/60 cursor-pointer"
          aria-label="Collapse player"
        >
          <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </button>
      </motion.div>

      <div className="space-y-1.5 p-3 sm:space-y-2">
        <motion.div
          className="text-center"
          animate={{ opacity: isTrackTransitioning ? 0.2 : 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : TRACK_TRANSITION_MS / 1000, ease: "easeInOut" }}
        >
          <h4 className="wrap-break-word text-pretty font-bold text-sm leading-tight text-foreground sm:text-base">
            {currentTrack.title}
          </h4>
          <p className="truncate text-xs text-muted-foreground">
            {currentTrack.artist}
          </p>
        </motion.div>
        <motion.div
          className="flex items-center justify-between text-xs text-muted-foreground"
          animate={{ opacity: isTrackTransitioning ? 0.2 : 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : TRACK_TRANSITION_MS / 1000, ease: "easeInOut" }}
        >
          <span>{formatTime(safeDisplayTime)}</span>
          <span>{formatTime(safeDuration)}</span>
        </motion.div>

        <motion.div
          animate={{ opacity: isTrackTransitioning ? 0.2 : 1 }}
          transition={{ duration: prefersReducedMotion ? 0 : TRACK_TRANSITION_MS / 1000, ease: "easeInOut" }}
        >
          <input
            type="range"
            min="0"
            max={safeDuration}
            value={safeDisplayTime}
            disabled={safeDuration <= 0 || controlsLocked}
            onChange={handleSeekChange}
            onPointerDown={() => {
              isSeekingRef.current = true;
              setIsSeeking(true);
            }}
            onPointerUp={commitSeek}
            onPointerCancel={commitSeek}
            onBlur={commitSeek}
            onKeyDown={(e) => {
              if (!SEEK_KEYS.has(e.key)) return;
              isSeekingRef.current = true;
              setIsSeeking(true);
            }}
            onKeyUp={(e) => {
              if (!SEEK_KEYS.has(e.key)) return;
              commitSeek();
            }}
            className="w-full h-1.5 sm:h-2 bg-muted rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${displayProgress}%, rgba(150, 150, 150, 0.3) ${displayProgress}%, rgba(150, 150, 150, 0.3) 100%)`,
            }}
            aria-label="Seek track"
          />
        </motion.div>

        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <button
            onClick={handlePreviousClick}
            disabled={controlsLocked}
            className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous track"
          >
            <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" />
          </button>

          <button
            onClick={onPlayPause}
            disabled={isEngineTransitioning}
            className="p-1.5 sm:p-2 rounded-full bg-foreground hover:bg-foreground/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background" />
            ) : (
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background ml-0.5" />
            )}
          </button>

          <button
            onClick={() => runTrackChangeTransition(onNext)}
            disabled={controlsLocked}
            className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next track"
          >
            <SkipForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={toggleMute}
            className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <Volume2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="flex-1 h-1.5 sm:h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${volumePercent}%, rgba(150, 150, 150, 0.3) ${volumePercent}%, rgba(150, 150, 150, 0.3) 100%)`,
            }}
            aria-label="Volume control"
          />
          <span className="w-6 text-right text-xs text-muted-foreground sm:w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};



