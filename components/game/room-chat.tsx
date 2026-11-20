"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PlayerAvatar } from "@/components/game/player-avatar"
import type { ChatMessage } from "@/types/game"

interface RoomChatProps {
  messages: ChatMessage[]
  currentPlayerId: string
  onSendMessage: (text: string) => void
}

const QUICK_REACTIONS = ["😂", "💀", "🔥", "😭", "🤯"]
const PREVIEW_DURATION_MS = 6000
const MAX_PREVIEWS = 3

/** Subtle Web Audio "pop" sound for incoming chat messages */
function playChatPopSound() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(520, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.06, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
    osc.onended = () => ctx.close().catch(() => {})
  } catch {
    // Audio playback blocked or unavailable
  }
}

export function RoomChat({ messages, currentPlayerId, onSendMessage }: RoomChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [previews, setPreviews] = useState<ChatMessage[]>([])
  const [pulseButton, setPulseButton] = useState(false)

  const lastSeenCountRef = useRef(messages.length)
  const previewTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const scrollEndRef = useRef<HTMLDivElement>(null)

  // Load sound preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("farwane_chat_sound")
      if (saved === "0") setSoundEnabled(false)
    }
  }, [])

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev
      if (typeof window !== "undefined") {
        localStorage.setItem("farwane_chat_sound", next ? "1" : "0")
      }
      return next
    })
  }

  // Cleanup preview timers on unmount
  useEffect(() => {
    const timers = previewTimersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  // Track unread messages & push live ephemeral previews when chat is closed
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      setPreviews([])
      previewTimersRef.current.forEach((timer) => clearTimeout(timer))
      previewTimersRef.current.clear()
      lastSeenCountRef.current = messages.length
      return
    }

    if (messages.length > lastSeenCountRef.current) {
      const newOnes = messages
        .slice(lastSeenCountRef.current)
        .filter((m) => m.playerId !== currentPlayerId)

      if (newOnes.length > 0) {
        setUnreadCount((prev) => prev + newOnes.length)
        setPulseButton(true)
        setTimeout(() => setPulseButton(false), 700)

        if (soundEnabled) {
          playChatPopSound()
        }

        setPreviews((prev) => {
          const merged = [...prev, ...newOnes]
          return merged.slice(-MAX_PREVIEWS)
        })

        for (const msg of newOnes) {
          const existing = previewTimersRef.current.get(msg.id)
          if (existing) clearTimeout(existing)
          const timer = setTimeout(() => {
            setPreviews((prev) => prev.filter((p) => p.id !== msg.id))
            previewTimersRef.current.delete(msg.id)
          }, PREVIEW_DURATION_MS)
          previewTimersRef.current.set(msg.id, timer)
        }
      }
      lastSeenCountRef.current = messages.length
    }
  }, [messages, isOpen, currentPlayerId, soundEnabled])

  // Auto-scroll to bottom when open or receiving messages
  useEffect(() => {
    if (isOpen) {
      scrollEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    onSendMessage(input)
    setInput("")
  }

  return (
    <>
      {/* Live Ephemeral Chat Previews + Floating Chat Toggle Button (when closed) */}
      {!isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-5 z-40 flex flex-col items-end gap-2 pointer-events-none">
          {/* Ephemeral live feed bubbles */}
          {previews.length > 0 && (
            <div className="flex flex-col items-end gap-2 max-w-[300px] sm:max-w-[360px]">
              {previews.map((msg) => (
                <button
                  key={msg.id}
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="pointer-events-auto text-left flex items-start gap-2.5 px-4 py-2.5 rounded-2xl rounded-br-sm border-2 border-primary/80 bg-card/95 backdrop-blur-md text-foreground shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.5)] hover:border-primary hover:scale-[1.02] transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
                >
                  <div className="w-8 h-8 rounded-lg border-2 border-primary/50 bg-primary/15 flex items-center justify-center text-base shrink-0 overflow-hidden mt-0.5">
                    <PlayerAvatar
                      avatar={msg.avatar}
                      imgClassName="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-black uppercase tracking-wider text-primary leading-tight truncate">
                      {msg.pseudo}
                    </span>
                    <span className="block text-sm sm:text-base font-bold leading-snug break-words line-clamp-3 mt-0.5">
                      {msg.text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Chat Toggle Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir le chat"
            className={`pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-full border-2 bg-card text-foreground font-black text-xs sm:text-sm hover:border-primary hover:-translate-y-0.5 active:translate-y-0 transition-all ${
              pulseButton || unreadCount > 0
                ? "border-primary shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.5)]"
                : "border-border shadow-[4px_4px_0px_var(--border)]"
            } ${pulseButton ? "scale-105" : ""}`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            <span className="hidden sm:inline">Chat</span>
            {unreadCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-black flex items-center justify-center animate-bounce">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-5 z-50 w-[calc(100vw-1.5rem)] max-w-md h-96 sm:h-[440px] flex flex-col rounded-xl border-2 border-border bg-card shadow-[6px_6px_0px_var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <span className="font-black text-sm sm:text-base uppercase tracking-wider">
                Chat en direct
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSound}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title={soundEnabled ? "Couper le son du chat" : "Activer le son du chat"}
                aria-label={soundEnabled ? "Couper le son du chat" : "Activer le son du chat"}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Fermer le chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground px-4">
                <MessageCircle className="w-9 h-9 mb-2 opacity-30" />
                <p className="text-sm font-bold">Aucun message pour l&apos;instant</p>
                <p className="text-xs opacity-75 mt-1">
                  Discute avec les autres joueurs sans couper la partie !
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.playerId === currentPlayerId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <PlayerAvatar avatar={msg.avatar} className="text-sm" imgClassName="w-5 h-5 rounded-full object-cover" />
                      <span className="text-xs font-black text-muted-foreground">
                        {isMine ? "Toi" : msg.pseudo}
                      </span>
                    </div>
                    <div
                      className={`max-w-[88%] px-3.5 py-2 rounded-2xl border-2 text-sm sm:text-base font-semibold leading-snug break-words ${
                        isMine
                          ? "bg-primary text-primary-foreground border-primary rounded-tr-sm"
                          : "bg-muted/50 text-foreground border-border rounded-tl-sm"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={scrollEndRef} />
          </div>

          {/* Quick emoji reactions */}
          <div className="flex items-center gap-1 px-3 py-1.5 border-t border-border/50 bg-muted/20 shrink-0">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSendMessage(emoji)}
                className="flex-1 py-1 rounded-md hover:bg-muted text-base transition-transform active:scale-90"
                title={`Envoyer ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-2.5 border-t-2 border-border bg-background shrink-0">
            <Input
              type="text"
              placeholder="Écris un message..."
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 200))}
              className="h-10 text-sm sm:text-base border-2"
              maxLength={200}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-10 w-10 shrink-0"
              aria-label="Envoyer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
