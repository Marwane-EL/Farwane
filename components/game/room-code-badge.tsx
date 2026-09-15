"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

interface RoomCodeBadgeProps {
  roomCode: string
  className?: string
}

export function RoomCodeBadge({ roomCode, className = "" }: RoomCodeBadgeProps) {
  const [copied, setCopied] = useState(false)

  if (!roomCode) return null

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(10)
      }
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy room code:", err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Cliquer pour copier le code de la partie"
      className={`h-8 px-2.5 bg-card/90 hover:bg-muted active:scale-95 border-2 border-border/80 rounded-lg flex items-center gap-1.5 text-xs font-mono font-black text-foreground shadow-[2px_2px_0px_var(--border)] transition-all cursor-pointer select-none shrink-0 ${className}`}
    >
      <span className="text-muted-foreground text-[10px] uppercase font-sans font-bold hidden xs:inline">Code :</span>
      <span className="text-primary font-black tracking-wider uppercase">{roomCode}</span>
      {copied ? (
        <span className="flex items-center gap-0.5 text-accent text-[11px] font-sans font-black animate-in fade-in zoom-in-95 duration-150">
          <Check className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Copié !</span>
        </span>
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
      )}
    </button>
  )
}
