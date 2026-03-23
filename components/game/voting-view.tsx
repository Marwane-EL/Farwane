"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, ThumbsDown, Meh, Laugh, Sparkles, Users, SkipForward } from "lucide-react"
import { MemeMedia } from "@/components/game/meme-media"
import type { Meme } from "@/types/game"

interface VotingViewProps {
  meme: Meme
  currentIndex: number
  totalMemes: number
  onVote: (memeId: string, score: number) => void
  currentPlayerId: string
  hasVotedOnCurrent: boolean
  votedCount: number
  totalPlayers: number
  isHost: boolean
  onForceAdvance: () => void
}

export function VotingView({
  meme,
  currentIndex,
  totalMemes,
  onVote,
  currentPlayerId,
  hasVotedOnCurrent,
  votedCount,
  totalPlayers,
  isHost,
  onForceAdvance,
}: VotingViewProps) {
  const [timeLeft, setTimeLeft] = useState(20)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const isOwnMeme = meme.playerId === currentPlayerId
  const eligibleVoters = totalPlayers - 1 // everyone except the creator

  // Reset state when meme changes
  useEffect(() => {
    setTimeLeft(20)
    setSelectedVote(null)
  }, [currentIndex])

  // Visual timer (purely decorative — host controls actual advancement)
  useEffect(() => {
    if (isOwnMeme) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [currentIndex, isOwnMeme])

  const handleVote = (vote: string) => {
    if (hasVotedOnCurrent || isOwnMeme) return
    const scoreMap: Record<string, number> = { nul: 0, pasMal: 1, mdr: 3 }
    const score = scoreMap[vote] || 0
    setSelectedVote(vote)
    onVote(meme.id, score)
  }

  const isUrgent = timeLeft <= 5

  const voteOptions = [
    { id: "nul", label: "Nul 💩", icon: ThumbsDown, color: "destructive" },
    { id: "pasMal", label: "Pas mal 😏", icon: Meh, color: "secondary" },
    { id: "mdr", label: "MDR 🤣", icon: Laugh, color: "accent" },
  ]

  // Own meme screen — waiting for others to vote
  // No early return for own meme anymore — we show the same UI but block voting

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-6">
      {/* Timer and progress */}
      <div className="w-full max-w-2xl mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Meme {currentIndex + 1}/{totalMemes}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{votedCount}/{eligibleVoters}</span>
            </div>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all duration-300 ${
                isUrgent
                  ? "bg-destructive/20 border-destructive text-destructive animate-pulse"
                  : "bg-muted/50 border-border"
              }`}
            >
              <Clock className={`h-5 w-5 ${isUrgent ? "animate-bounce" : ""}`} />
              <span className="text-2xl font-black font-mono">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalMemes) * 100}%` }}
          />
        </div>
      </div>

      {/* Meme display */}
      <Card className="w-full max-w-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-8 animate-in fade-in zoom-in-95 duration-500 delay-100">
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            {/* Meme image */}
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden mb-4">
              <MemeMedia
                src={meme.imageUrl}
                alt="Meme"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Caption */}
            <div className="w-full text-center p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border/50">
              <p className="text-xl md:text-2xl font-bold text-foreground">
                {'"'}{meme.caption}{'"'}
              </p>
            </div>

            {/* Anonymous indicator */}
            <p className="mt-4 text-sm text-muted-foreground">
              Créé par un joueur anonyme 🎭
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vote buttons or waiting state */}
      {isOwnMeme ? (
        <div className="text-center animate-in fade-in duration-300">
          <p className="text-xl font-bold text-secondary mb-2">C&apos;est ta légende ! 😏</p>
          <p className="text-sm text-muted-foreground mb-4">Les autres joueurs sont en train de voter...</p>
          {isHost && (
            <Button
              onClick={onForceAdvance}
              variant="outline"
              size="sm"
              className="mt-4 border-2"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Forcer le passage
            </Button>
          )}
        </div>
      ) : hasVotedOnCurrent ? (
        <div className="text-center animate-in fade-in duration-300">
          <p className="text-lg text-primary mb-2">Vote enregistré ! ✨</p>
          <p className="text-sm text-muted-foreground">En attente des autres joueurs...</p>
          {isHost && (
            <Button
              onClick={onForceAdvance}
              variant="outline"
              size="sm"
              className="mt-4 border-2"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Forcer le passage
            </Button>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
          {voteOptions.map((option) => {
            const Icon = option.icon
            const isSelected = selectedVote === option.id

            return (
              <Button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVotedOnCurrent || isOwnMeme}
                size="lg"
                variant={isSelected ? "default" : "outline"}
                className={`
                  h-16 px-8 text-lg font-bold border-2 transition-all duration-300
                  ${isSelected ? "scale-110" : "hover:scale-105"}
                  ${option.color === "destructive" && "hover:bg-destructive/20 hover:border-destructive hover:text-destructive"}
                  ${option.color === "secondary" && "hover:bg-secondary/20 hover:border-secondary hover:text-secondary"}
                  ${option.color === "accent" && "hover:bg-accent/20 hover:border-accent hover:text-accent"}
                  ${isSelected && option.color === "destructive" && "bg-destructive text-destructive-foreground border-destructive"}
                  ${isSelected && option.color === "secondary" && "bg-secondary text-secondary-foreground border-secondary"}
                  ${isSelected && option.color === "accent" && "bg-accent text-accent-foreground border-accent"}
                  disabled:opacity-70
                `}
              >
                <Icon className="mr-2 h-6 w-6" />
                {option.label}
              </Button>
            )
          })}
        </div>
      )}
    </div>
  )
}
