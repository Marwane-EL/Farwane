"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import * as htmlToImage from "html-to-image"
import type { Meme } from "@/types/game"
import { toast } from "sonner"

interface DownloadMemeButtonProps {
  meme: Meme
  className?: string
}

export function DownloadMemeButton({ meme, className }: DownloadMemeButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      // Create a temporary container for a high-quality export
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.top = "-9999px"
      container.style.width = "600px"
      container.style.backgroundColor = "#09090b" // Zinc-950 (dark theme)
      container.style.padding = "24px"
      container.style.display = "flex"
      container.style.flexDirection = "column"
      container.style.alignItems = "center"
      container.style.borderRadius = "16px"
      container.style.fontFamily = "system-ui, sans-serif"

      // Add FarWane watermark
      const header = document.createElement("div")
      header.style.width = "100%"
      header.style.display = "flex"
      header.style.justifyContent = "space-between"
      header.style.alignItems = "center"
      header.style.marginBottom = "16px"
      
      const logo = document.createElement("span")
      logo.innerText = "FarWane 🎭"
      logo.style.color = "#a1a1aa" // Zinc-400
      logo.style.fontSize = "14px"
      logo.style.fontWeight = "bold"
      
      const author = document.createElement("span")
      author.innerText = `Par ${meme.playerPseudo}`
      author.style.color = "#a1a1aa"
      author.style.fontSize = "14px"
      
      header.appendChild(logo)
      header.appendChild(author)
      container.appendChild(header)

      // Add Image
      const imgContainer = document.createElement("div")
      imgContainer.style.width = "100%"
      imgContainer.style.backgroundColor = "#18181b" // Zinc-900
      imgContainer.style.borderRadius = "12px"
      imgContainer.style.overflow = "hidden"
      imgContainer.style.display = "flex"
      imgContainer.style.justifyContent = "center"
      imgContainer.style.alignItems = "center"
      imgContainer.style.marginBottom = "24px"

      // Determine if it's a video (gif/mp4) or image
      // Note: html-to-image doesn't capture videos well, so we use an img tag and hope for a thumbnail or fallback.
      // If it's tenor, we might have to replace the URL to a static version if possible, but Tenor GIFs usually render the first frame on canvas.
      const img = document.createElement("img")
      img.crossOrigin = "anonymous" // Important for CORS
      img.src = meme.imageUrl
      img.style.maxWidth = "100%"
      img.style.maxHeight = "500px"
      img.style.objectFit = "contain"
      
      // Wait for image to load before capturing
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = () => {
          // If CORS fails, try without crossOrigin
          img.removeAttribute("crossOrigin")
          img.src = meme.imageUrl + "?" + new Date().getTime() // Cache bust
          img.onload = resolve
          img.onerror = reject
        }
      })

      imgContainer.appendChild(img)
      container.appendChild(imgContainer)

      // Add Caption
      const caption = document.createElement("p")
      caption.innerText = `"${meme.caption}"`
      caption.style.color = "#ffffff"
      caption.style.fontSize = "28px"
      caption.style.fontWeight = "900"
      caption.style.textAlign = "center"
      caption.style.margin = "0"
      caption.style.wordBreak = "break-word"
      
      container.appendChild(caption)

      // Add to DOM temporarily
      document.body.appendChild(container)

      // Generate Image
      const dataUrl = await htmlToImage.toPng(container, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: false,
      })

      // Remove from DOM
      document.body.removeChild(container)

      // Trigger download
      const link = document.createElement("a")
      link.download = `farwane-meme-${meme.playerPseudo}.png`
      link.href = dataUrl
      link.click()
      
      toast.success("Meme téléchargé avec succès !")
    } catch (error) {
      console.error("Download failed:", error)
      toast.error("Impossible de télécharger l'image. (Erreur CORS ou format non supporté)")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={(e) => {
        e.stopPropagation()
        handleDownload()
      }}
      disabled={isDownloading}
      className={`rounded-full shadow-md bg-background/80 backdrop-blur-sm border-2 hover:bg-background ${className}`}
      title="Télécharger le meme"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <Download className="h-4 w-4 text-primary" />
      )}
    </Button>
  )
}
