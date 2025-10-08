"use client"

import type React from "react"

import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, SkipBack, SkipForward, Volume2, ChevronUp, ChevronDown } from "lucide-react"
import Image from "next/image"
import { getOriginalTracks, formatTime, getDefaultVolume } from "@/services/music"
import type { MusicPlayerState } from "@/types/music"

// Utility functions for volume management
const validateVolume = (volume: number): number => {
  if (isNaN(volume) || volume < 0) return 0
  if (volume > 1) return 1
  return volume
}

const getStoredVolume = (): number => {
  try {
    const saved = localStorage.getItem("mp_volume")
    if (saved !== null) {
      const volume = Number.parseFloat(saved)
      return validateVolume(volume)
    }
  } catch (error) {
    console.warn("Failed to load volume from localStorage:", error)
  }
  return getDefaultVolume()
}

export const MiniPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null)

  const shuffledPlaylist = useMemo(() => {
    const tracks = [...getOriginalTracks()]
    for (let i = tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[tracks[i], tracks[j]] = [tracks[j], tracks[i]]
    }
    return tracks
  }, [])

  const [playerState, setPlayerState] = useState<MusicPlayerState>(() => ({
    currentTrack: shuffledPlaylist[0] || null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: getStoredVolume(),
    isShuffled: true,
    repeatMode: "none",
    playlist: shuffledPlaylist,
    currentTrackIndex: 0,
    isExpanded: false,
  }))

  const { currentTrack, isPlaying, currentTime, duration, volume, isExpanded } = playerState

  // Remove this useEffect as we now handle volume initialization in useState

  useEffect(() => {
    try {
      localStorage.setItem("mp_volume", String(volume))
    } catch (error) {
      console.warn("Failed to save volume to localStorage:", error)
    }
    if (audioRef.current) {
      audioRef.current.volume = validateVolume(volume)
    }
  }, [volume])

  const pendingReadyRef = useRef(false)
  const isPlayingRef = useRef(isPlaying)

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    if (pendingReadyRef.current) return
    if (isPlayingRef.current) {
      a.play().catch(() => {})
    } else {
      a.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const a = audioRef.current
    if (!a || !currentTrack) return

    // Clear any existing timeouts/intervals
    const cleanup = () => {
      a.pause()
      a.currentTime = 0
      a.removeAttribute("src")
      a.load()
    }

    // Force immediate cleanup for first track
    cleanup()

    // Set new source
    a.src = currentTrack.audioUrl
    a.load()

    const ensureZeroThenPlay = () => {
      const afterSeek = () => {
        a.removeEventListener("seeked", afterSeek)
        pendingReadyRef.current = false
        if (isPlayingRef.current) {
          a.play().catch(() => {})
        }
      }

      if (a.currentTime > 0.01) {
        a.addEventListener("seeked", afterSeek, { once: true })
        try {
          a.currentTime = 0
        } catch {
          afterSeek()
        }
      } else {
        afterSeek()
      }
    }

    const onCanPlay = () => {
      a.removeEventListener("canplay", onCanPlay)
      if (a.duration && a.duration > 0) {
        setPlayerState((prev) => ({ ...prev, duration: a.duration }))
      }
      ensureZeroThenPlay()
    }

    const onLoadedData = () => {
      a.removeEventListener("loadeddata", onLoadedData)
      if (a.duration && a.duration > 0) {
        setPlayerState((prev) => ({ ...prev, duration: a.duration }))
      }
    }

    if (a.readyState >= 3) {
      onCanPlay()
    } else {
      a.addEventListener("canplay", onCanPlay, { once: true })
      a.addEventListener("loadeddata", onLoadedData, { once: true })
    }

    return () => {
      a.removeEventListener("canplay", onCanPlay)
      a.removeEventListener("loadeddata", onLoadedData)
      cleanup()
    }
  }, [currentTrack])

  const [primed, setPrimed] = useState(false)
  const handlePlayPause = useCallback(() => {
    const a = audioRef.current
    if (!a) return

    if (!playerState.isPlaying && !primed) {
      a.play()
        .then(() => {
          a.pause()
          try {
            a.currentTime = 0
          } catch {}
          setPrimed(true)
          setPlayerState((prev) => ({ ...prev, isPlaying: true }))
        })
        .catch(() => {
          setPlayerState((prev) => ({ ...prev, isPlaying: true }))
        })
      return
    }

    setPlayerState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
  }, [playerState.isPlaying, primed])

  const handleNext = useCallback(() => {
    // Add 0.5 second delay before switching
    setTimeout(() => {
      setPlayerState((prev) => {
        const nextIndex = (prev.currentTrackIndex + 1) % prev.playlist.length
        const nextTrack = prev.playlist[nextIndex]
        
        // Force audio cleanup
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.load()
        }
        
        return {
          ...prev,
          currentTrackIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          duration: 0,
          isPlaying: true,
        }
      })
    }, 500)
  }, [])

  const PREV_RESTART_THRESHOLD = 3
  const handlePrevious = useCallback(() => {
    // Add 0.5 second delay before switching
    setTimeout(() => {
      setPlayerState((prev) => {
        const t = prev.currentTime || 0
        if (t > PREV_RESTART_THRESHOLD) {
          if (audioRef.current) {
            try {
              audioRef.current.currentTime = 0
            } catch {}
          }
          return { ...prev, currentTime: 0, isPlaying: true }
        }
        
        const prevIndex = prev.currentTrackIndex === 0 ? prev.playlist.length - 1 : prev.currentTrackIndex - 1
        const prevTrack = prev.playlist[prevIndex]
        
        // Force audio cleanup
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          audioRef.current.load()
        }
        
        return {
          ...prev,
          currentTrackIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          duration: 0,
          isPlaying: true,
        }
      })
    }, 500)
  }, [])

  const handleVolumeChange = (newVolume: number) => {
    const validatedVolume = validateVolume(newVolume)
    setPlayerState((prev) => ({ ...prev, volume: validatedVolume }))
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setPlayerState((prev) => ({
        ...prev,
        currentTime: audioRef.current?.currentTime || 0,
      }))
    }
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    const audioDuration = audioRef.current.duration
    if (audioDuration && audioDuration > 0) {
      setPlayerState((prev) => ({ ...prev, duration: audioDuration }))
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number.parseFloat(e.target.value)
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = newTime
      } catch {}
      setPlayerState((prev) => ({ ...prev, currentTime: newTime }))
    }
  }

  const toggleExpanded = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }))
  }, [])

  const progressPercent = useMemo(() => (duration ? (currentTime / duration) * 100 : 0), [currentTime, duration])
  const volumePercent = useMemo(() => volume * 100, [volume])

  if (!currentTrack) return null

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        preload="auto"
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNext}
      />

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
                      priority={true}
                      className="w-full h-full object-cover fix-mobile-flicker"
                      onError={() => {
                        console.warn(`Failed to load image: ${currentTrack.coverImage}`)
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePlayPause()
                      }}
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
                  <button
                    onClick={toggleExpanded}
                    className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
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
                      priority={true}
                      className="w-full h-full object-contain fix-mobile-flicker"
                      onError={() => {
                        console.warn(`Failed to load image: ${currentTrack.coverImage}`)
                      }}
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
                    <button
                      onClick={handlePrevious}
                      className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <SkipBack className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground" />
                    </button>

                    <button
                      onClick={handlePlayPause}
                      className="p-1.5 sm:p-2 rounded-full bg-foreground hover:bg-foreground/90 transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background" />
                      ) : (
                        <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-background ml-0.5" />
                      )}
                    </button>

                    <button
                      onClick={handleNext}
                      className="p-0.5 sm:p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
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
                      onChange={(e) => handleVolumeChange(Number.parseFloat(e.target.value))}
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
  )
}
