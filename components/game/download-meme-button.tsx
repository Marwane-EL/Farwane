"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import type { Meme } from "@/types/game"
import { toast } from "sonner"
import { getApiBase } from "@/lib/utils"
import { getCachedMediaUrl } from "@/lib/media-cache"

interface DownloadMemeButtonProps {
  meme: {
    imageUrl: string
    caption: string
    playerPseudo: string
    niche?: string
  }
  className?: string
  showLabel?: boolean
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ""

  for (const word of words) {
    const test = current ? `${current} ${word}` : word
    if (ctx.measureText(test).width <= maxWidth) {
      current = test
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : [""]
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function DownloadMemeButton({ meme, className = "", showLabel = false }: DownloadMemeButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(meme.imageUrl)
      let mediaSrc = await getCachedMediaUrl(meme.imageUrl)
      if (!mediaSrc.startsWith("blob:")) {
        mediaSrc = `${getApiBase()}/api/proxy?url=${encodeURIComponent(meme.imageUrl)}`
      }

      // Canvas layout dimensions (high-res 800px wide)
      const W = 800
      const PAD = 32
      const INNER_W = W - PAD * 2
      const HEADER_H = 54

      // Measure caption & niche lines using an offscreen context
      const measureCanvas = document.createElement("canvas")
      const mCtx = measureCanvas.getContext("2d")!

      mCtx.font = "900 30px system-ui, -apple-system, sans-serif"
      const captionText = meme.caption?.trim() ? `"${meme.caption.trim()}"` : '""'
      const captionLines = wrapText(mCtx, captionText, INNER_W - 48)
      const CAPTION_LINE_H = 38
      const CAPTION_BOX_H = Math.max(84, captionLines.length * CAPTION_LINE_H + 36)

      let nicheLines: string[] = []
      let NICHE_BOX_H = 0
      if (meme.niche?.trim()) {
        mCtx.font = "700 20px system-ui, -apple-system, sans-serif"
        nicheLines = wrapText(mCtx, `Thème : ${meme.niche.trim()}`, INNER_W - 36)
        NICHE_BOX_H = nicheLines.length * 26 + 24
      }

      const MEDIA_BOX_H = 520
      const GAP = 18
      const totalH =
        PAD +
        HEADER_H +
        (NICHE_BOX_H > 0 ? NICHE_BOX_H + GAP : 0) +
        MEDIA_BOX_H +
        GAP +
        CAPTION_BOX_H +
        PAD

      const canvas = document.createElement("canvas")
      canvas.width = W
      canvas.height = totalH
      const ctx = canvas.getContext("2d")!

      const renderFrame = (source: HTMLImageElement | HTMLVideoElement, srcW: number, srcH: number) => {
        // 1. Background (#0d0b14 FarWane dark theme)
        ctx.fillStyle = "#0d0b14"
        ctx.fillRect(0, 0, W, totalH)

        // Subtle neo-brutalist outer border
        ctx.strokeStyle = "#a855f7"
        ctx.lineWidth = 6
        drawRoundedRect(ctx, 6, 6, W - 12, totalH - 12, 24)
        ctx.stroke()

        let cursorY = PAD

        // 2. Header (FarWane brand + Author badge)
        ctx.fillStyle = "#c084fc"
        ctx.font = "900 28px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "middle"
        ctx.fillText("FarWane", PAD, cursorY + HEADER_H / 2)

        const authorLabel = `Par ${meme.playerPseudo || "Anonyme"}`
        ctx.font = "800 20px system-ui, -apple-system, sans-serif"
        const authorW = ctx.measureText(authorLabel).width + 28
        ctx.fillStyle = "#1e1b2e"
        drawRoundedRect(ctx, W - PAD - authorW, cursorY + 6, authorW, HEADER_H - 12, 12)
        ctx.fill()
        ctx.strokeStyle = "#4ade80"
        ctx.lineWidth = 2.5
        ctx.stroke()

        ctx.fillStyle = "#4ade80"
        ctx.textAlign = "right"
        ctx.fillText(authorLabel, W - PAD - 14, cursorY + HEADER_H / 2)

        cursorY += HEADER_H

        // 3. Optional Niche box
        if (NICHE_BOX_H > 0) {
          ctx.fillStyle = "#1f1635"
          drawRoundedRect(ctx, PAD, cursorY, INNER_W, NICHE_BOX_H, 14)
          ctx.fill()
          ctx.strokeStyle = "#c084fc"
          ctx.lineWidth = 2
          ctx.stroke()

          ctx.fillStyle = "#e9d5ff"
          ctx.font = "700 20px system-ui, -apple-system, sans-serif"
          ctx.textAlign = "center"
          nicheLines.forEach((line, i) => {
            ctx.fillText(line, W / 2, cursorY + 24 + i * 26)
          })
          cursorY += NICHE_BOX_H + GAP
        }

        // 4. Media container
        ctx.fillStyle = "#14121d"
        drawRoundedRect(ctx, PAD, cursorY, INNER_W, MEDIA_BOX_H, 18)
        ctx.fill()
        ctx.strokeStyle = "#2e2a3b"
        ctx.lineWidth = 3
        ctx.stroke()

        // Fit media inside MEDIA_BOX_H preserving aspect ratio
        if (srcW > 0 && srcH > 0) {
          const padMedia = 12
          const maxMW = INNER_W - padMedia * 2
          const maxMH = MEDIA_BOX_H - padMedia * 2
          const scale = Math.min(maxMW / srcW, maxMH / srcH)
          const drawW = srcW * scale
          const drawH = srcH * scale
          const drawX = PAD + (INNER_W - drawW) / 2
          const drawY = cursorY + (MEDIA_BOX_H - drawH) / 2

          ctx.save()
          drawRoundedRect(ctx, drawX, drawY, drawW, drawH, 12)
          ctx.clip()
          ctx.drawImage(source, drawX, drawY, drawW, drawH)
          ctx.restore()
        }

        cursorY += MEDIA_BOX_H + GAP

        // 5. Neo-Brutalist Caption Card
        // Hard shadow
        ctx.fillStyle = "rgba(168, 85, 247, 0.45)"
        drawRoundedRect(ctx, PAD + 5, cursorY + 5, INNER_W, CAPTION_BOX_H, 16)
        ctx.fill()

        // Main caption box
        ctx.fillStyle = "#181523"
        drawRoundedRect(ctx, PAD, cursorY, INNER_W, CAPTION_BOX_H, 16)
        ctx.fill()
        ctx.strokeStyle = "#a855f7"
        ctx.lineWidth = 3
        ctx.stroke()

        ctx.fillStyle = "#ffffff"
        ctx.font = "900 30px system-ui, -apple-system, sans-serif"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        const totalTextH = captionLines.length * CAPTION_LINE_H
        const startTextY = cursorY + (CAPTION_BOX_H - totalTextH) / 2 + CAPTION_LINE_H / 2
        captionLines.forEach((line, idx) => {
          ctx.fillText(line, W / 2, startTextY + idx * CAPTION_LINE_H)
        })
      }

      const safeAuthor = (meme.playerPseudo || "meme").replace(/[^a-zA-Z0-9_-]/g, "")

      if (isVideo) {
        const video = document.createElement("video")
        video.crossOrigin = "anonymous"
        video.src = mediaSrc
        video.playsInline = true
        video.muted = false
        video.volume = 1

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve()
          video.onerror = () => reject(new Error("Video load error"))
          video.load()
        })

        // Try recording full video with caption via MediaRecorder if supported
        const canRecord =
          typeof MediaRecorder !== "undefined" &&
          typeof canvas.captureStream === "function"

        if (canRecord) {
          toast.info("Génération de la vidéo avec légende en cours...")
          const mimeType = MediaRecorder.isTypeSupported("video/mp4")
            ? "video/mp4"
            : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
              ? "video/webm;codecs=vp9"
              : "video/webm"
          const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm"

          const stream = canvas.captureStream(30)

          // Route audio through an AudioContext MediaStreamDestination (without connecting to speakers!)
          // so the recorded file keeps its sound while the user's speakers stay completely silent.
          let audioCtx: AudioContext | null = null
          try {
            const AudioContextClass =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
            if (AudioContextClass) {
              audioCtx = new AudioContextClass()
              const sourceNode = audioCtx.createMediaElementSource(video)
              const destNode = audioCtx.createMediaStreamDestination()
              sourceNode.connect(destNode)
              destNode.stream.getAudioTracks().forEach((t) => stream.addTrack(t))
            } else {
              video.muted = true
            }
          } catch {
            // Fallback: mute speaker output if AudioContext capture fails
            video.muted = true
          }

          const chunks: BlobPart[] = []
          const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2_500_000,
          })
          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data)
          }

          const recordDone = new Promise<Blob>((resolve) => {
            recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
          })

          let rafId = 0
          const pump = () => {
            renderFrame(video, video.videoWidth || 600, video.videoHeight || 600)
            if (!video.paused && !video.ended) {
              rafId = requestAnimationFrame(pump)
            }
          }

          recorder.start()
          try {
            if (audioCtx && audioCtx.state === "suspended") {
              await audioCtx.resume()
            }
            await video.play()
          } catch {
            video.muted = true
            await video.play()
          }
          pump()

          // Cap recording at 12 seconds max or video end
          await Promise.race([
            new Promise<void>((res) => {
              video.onended = () => res()
            }),
            new Promise<void>((res) => setTimeout(res, Math.min((video.duration || 8) * 1000, 12000))),
          ])

          cancelAnimationFrame(rafId)
          video.pause()
          recorder.stop()
          if (audioCtx) {
            audioCtx.close().catch(() => {})
          }

          const videoBlob = await recordDone
          const url = URL.createObjectURL(videoBlob)
          const link = document.createElement("a")
          link.download = `farwane-banger-${safeAuthor}.${ext}`
          link.href = url
          link.click()
          setTimeout(() => URL.revokeObjectURL(url), 5000)
          toast.success("Vidéo FarWane avec légende téléchargée !")
          return
        }

        // Fallback: seek to 0.3s and export PNG card
        video.currentTime = Math.min(0.3, (video.duration || 1) / 2)
        await new Promise<void>((res) => {
          video.onseeked = () => res()
          setTimeout(res, 500)
        })
        renderFrame(video, video.videoWidth || 600, video.videoHeight || 600)
      } else {
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = mediaSrc
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error("Image load error"))
        })
        renderFrame(img, img.naturalWidth || 600, img.naturalHeight || 600)
      }

      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `farwane-banger-${safeAuthor}.png`
      link.href = dataUrl
      link.click()
      toast.success("Banger téléchargé avec succès !")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Impossible de télécharger ce mème.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size={showLabel ? "sm" : "icon"}
      onClick={(e) => {
        e.stopPropagation()
        handleDownload()
      }}
      disabled={isDownloading}
      className={`rounded-full shadow-md bg-background/80 backdrop-blur-sm border-2 hover:bg-background ${className}`}
      title="Télécharger avec la légende FarWane"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Download className="h-4 w-4 text-primary" />
      )}
      {showLabel && <span className="ml-1.5 text-xs font-black">Télécharger</span>}
    </Button>
  )
}
