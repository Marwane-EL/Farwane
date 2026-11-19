"use client"

import { useEffect, useRef, useState } from "react"
import { VolumeX, Volume2, Play, Loader2 } from "lucide-react"
import { getCachedMediaUrl, isVideoUrl, peekCachedMediaUrl } from "@/lib/media-cache"

interface MemeMediaProps {
  src: string
  alt: string
  className?: string
  forceMuted?: boolean
}

export function MemeMedia({ src, alt, className, forceMuted = false }: MemeMediaProps) {
  const isVideo = isVideoUrl(src)
  const videoRef = useRef<HTMLVideoElement>(null)

  const [resolvedSrc, setResolvedSrc] = useState<string>(() =>
    isVideo ? (peekCachedMediaUrl(src) ?? "") : src
  )
  const [playBlocked, setPlayBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(forceMuted)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVolume(parseFloat(localStorage.getItem("memeVolume") || "0.5"))
    }
  }, [])

  // Resolve video via in-memory Blob cache so loops & remounts consume 0 network egress
  useEffect(() => {
    if (!isVideo) {
      setResolvedSrc(src)
      return
    }

    const immediate = peekCachedMediaUrl(src)
    if (immediate) {
      setResolvedSrc(immediate)
      return
    }

    let cancelled = false
    setResolvedSrc("")
    setPlayBlocked(false)

    getCachedMediaUrl(src).then((finalUrl) => {
      if (!cancelled) {
        setResolvedSrc(finalUrl)
      }
    })

    return () => {
      cancelled = true
    }
  }, [src, isVideo])

  // Sync volume changes without restarting video playback
  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.volume = volume
    }
  }, [isVideo, volume])

  // Start playback only when the resolved video source or mute constraint changes
  useEffect(() => {
    if (isVideo && resolvedSrc && videoRef.current) {
      videoRef.current.volume = volume
      if (forceMuted) {
        videoRef.current.muted = true
        setIsMuted(true)
      }

      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true
            if (!forceMuted) setIsMuted(true)
            videoRef.current.play().catch(() => {
              if (!forceMuted) setPlayBlocked(true)
            })
          }
        })
      }
    }

    const el = videoRef.current
    return () => {
      if (el) {
        el.pause()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedSrc, isVideo, forceMuted])

  const handleManualPlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setPlayBlocked(false)
    }
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    const newVol = parseFloat(e.target.value)
    setVolume(newVol)
    localStorage.setItem("memeVolume", newVol.toString())
    if (videoRef.current) {
      videoRef.current.volume = newVol
      if (newVol > 0 && isMuted) {
        videoRef.current.muted = false
        setIsMuted(false)
      } else if (newVol === 0 && !isMuted) {
        videoRef.current.muted = true
        setIsMuted(true)
      }
    }
  }

  if (isVideo) {
    return (
      <div className={`relative flex items-center justify-center ${className || ''}`}>
        {!resolvedSrc ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <video
            ref={videoRef}
            src={resolvedSrc}
            className="max-w-full max-h-full object-contain rounded-md"
            autoPlay
            loop
            playsInline
            preload="auto"
            muted={forceMuted}
          />
        )}

        {/* Play Overlay if browser blocks autoplay */}
        {resolvedSrc && playBlocked && !forceMuted && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-md cursor-pointer backdrop-blur-[2px]"
            onClick={handleManualPlay}
          >
            <div className="bg-primary/90 text-primary-foreground p-4 rounded-full animate-pulse shadow-xl">
              <Play className="w-8 h-8 ml-1" />
            </div>
            <p className="absolute bottom-4 text-white text-sm font-bold drop-shadow-md">
              Clique pour activer la vidéo avec le son
            </p>
          </div>
        )}

        {/* Mute/Unmute toggle button & Volume Slider */}
        {resolvedSrc && !playBlocked && !forceMuted && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-2 bg-black/60 p-2 rounded-full z-20 hover:bg-black/80 transition-all duration-300 group"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={toggleMute}
              className="text-white"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0" max="1" step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 opacity-0 group-hover:w-20 group-hover:opacity-100 transition-all duration-300 accent-white cursor-pointer"
            />
          </div>
        )}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" />
  )
}
