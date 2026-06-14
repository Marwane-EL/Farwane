"use client"

import { useEffect, useRef, useState } from "react"
import { VolumeX, Volume2, Play } from "lucide-react"

interface MemeMediaProps {
  src: string
  alt: string
  className?: string
  forceMuted?: boolean
}

export function MemeMedia({ src, alt, className, forceMuted = false }: MemeMediaProps) {
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  const [playBlocked, setPlayBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(forceMuted)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVolume(parseFloat(localStorage.getItem("memeVolume") || "0.5"))
    }
  }, [])

  useEffect(() => {
    if (isVideo && videoRef.current) {
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
  }, [src, isVideo, forceMuted, volume])

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
        <video
          ref={videoRef}
          src={src}
          className="max-w-full max-h-full object-contain rounded-md"
          autoPlay
          loop
          playsInline
          muted={forceMuted}
        />
        
        {/* Play Overlay if browser blocks autoplay */}
        {playBlocked && !forceMuted && (
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

        {/* Optional: Mute/Unmute toggle button & Volume Slider */}
        {!playBlocked && !forceMuted && (
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
    <img src={src} alt={alt} className={className} />
  )
}

