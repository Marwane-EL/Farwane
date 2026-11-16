"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send } from "lucide-react"
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

export function RoomChat({ messages, currentPlayerId, onSendMessage }: RoomChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenCountRef = useRef(messages.length)
  const scrollEndRef = useRef<HTMLDivElement>(null)

  // Track unread messages when chat is closed
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0)
      lastSeenCountRef.current = messages.length
    } else if (messages.length > lastSeenCountRef.current) {
      const newOnes = messages.slice(lastSeenCountRef.current).filter((m) => m.playerId !== currentPlayerId)
      if (newOnes.length > 0) {
        setUnreadCount((prev) => prev + newOnes.length)
      }
      lastSeenCountRef.current = messages.length
    }
  }, [messages, isOpen, currentPlayerId])

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
      {/* Floating Chat Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Ouvrir le chat"
          className="fixed bottom-20 right-3 sm:bottom-6 sm:right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full border-2 border-border bg-card text-foreground font-black text-xs sm:text-sm shadow-[4px_4px_0px_var(--border)] hover:border-primary hover:-translate-y-0.5 active:translate-y-0 transition-all"
        >
          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          <span className="hidden sm:inline">Chat</span>
          {unreadCount > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-black flex items-center justify-center animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-5 z-50 w-[calc(100vw-1.5rem)] max-w-sm h-80 sm:h-96 flex flex-col rounded-xl border-2 border-border bg-card shadow-[6px_6px_0px_var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border bg-muted/40 shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider">
                Chat en direct
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Fermer le chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground px-4">
                <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-xs font-bold">Aucun message pour l&apos;instant</p>
                <p className="text-[11px] opacity-75 mt-0.5">
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
                    <div className="flex items-center gap-1 mb-0.5 px-1">
                      <PlayerAvatar avatar={msg.avatar} className="text-xs" imgClassName="w-4 h-4 rounded-full object-cover" />
                      <span className="text-[10px] font-black text-muted-foreground">
                        {isMine ? "Toi" : msg.pseudo}
                      </span>
                    </div>
                    <div
                      className={`max-w-[85%] px-3 py-1.5 rounded-xl border-2 text-xs sm:text-sm font-medium break-words ${
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
          <div className="flex items-center gap-1 px-2.5 py-1.5 border-t border-border/50 bg-muted/20 shrink-0">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSendMessage(emoji)}
                className="flex-1 py-0.5 rounded-md hover:bg-muted text-sm transition-transform active:scale-90"
                title={`Envoyer ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex items-center gap-1.5 p-2 border-t-2 border-border bg-background shrink-0">
            <Input
              type="text"
              placeholder="Écris un message..."
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 200))}
              className="h-9 text-xs sm:text-sm border-2"
              maxLength={200}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="h-9 w-9 shrink-0"
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
