"use client"

import { useEffect, useRef, useState } from "react"
import { VolumeX, Volume2, Play } from "lucide-react"

interface MemeMediaProps {
  src: string
  alt: string
  className?: string
}

export function MemeMedia({ src, alt, className }: MemeMediaProps) {
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(src)
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // States for handling autoplay blocking
  const [playBlocked, setPlayBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  useEffect(() => {
    if (isVideo && videoRef.current) {
      // Attempt to play automatically
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // The browser blocked unmuted autoplay
          setPlayBlocked(true)
          // We can optionally fallback to muted autoplay:
          // if (videoRef.current) {
          //   videoRef.current.muted = true
          //   setIsMuted(true)
          //   videoRef.current.play()
          // }
        })
      }
    }
  }, [src, isVideo])

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
        />
        
        {/* Play Overlay if browser blocks autoplay */}
        {playBlocked && (
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

        {/* Optional: Mute/Unmute toggle button (only shows if it successfully plays) */}
        {!playBlocked && (
          <button
            onClick={toggleMute}
            className="absolute bottom-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors z-20"
            title={isMuted ? "Activer le son" : "Couper le son"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        )}
      </div>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  )
}

