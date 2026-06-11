"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Clock, ThumbsDown, Meh, Laugh, Sparkles, Users, SkipForward } from "lucide-react"
import { MemeMedia } from "@/components/game/meme-media"
import { DownloadMemeButton } from "@/components/game/download-meme-button"
import type { Meme } from "@/types/game"

interface VotingViewProps {
  meme: Meme
  currentIndex: number
  totalMemes: number
  onVote: (memeId: string, score: number, isHeart?: boolean) => void
  currentPlayerId: string
  hasVotedOnCurrent: boolean
  votedCount: number
  totalPlayers: number
  isHost: boolean
  onForceAdvance: () => void
  hasUsedHeart: boolean
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
  hasUsedHeart,
}: VotingViewProps) {
  const [timeLeft, setTimeLeft] = useState(20)
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const isOwnMeme = meme.playerId === currentPlayerId
  const eligibleVoters = totalPlayers - 1

  // Reset state when meme changes
  useEffect(() => {
    setTimeLeft(20)
    setSelectedVote(null)
  }, [currentIndex])

  // Visual timer
  useEffect(() => {
    if (isOwnMeme) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [currentIndex, isOwnMeme])

  const handleVote = (vote: string, isHeart: boolean = false) => {
    if (hasVotedOnCurrent || isOwnMeme) return
    const scoreMap: Record<string, number> = {
      bide: 0,
      bof: 1,
      drole: 3,
      masterclass: 4,
      banger: 5,
      heart: 0
    }
    const score = scoreMap[vote] || 0
    setSelectedVote(vote)
    onVote(meme.id, score, isHeart)
  }

  const isUrgent = timeLeft <= 5

  const voteOptions = [
    { id: "bide", label: "Va t'asseoir 🪑", shortLabel: "Bide 🪑", icon: ThumbsDown, color: "destructive", points: 0 },
    { id: "bof", label: "Sympa mais bof 🤷", shortLabel: "Bof 🤷", icon: Meh, color: "secondary", points: 1 },
    { id: "drole", label: "Très drôle 😂", shortLabel: "Drôle 😂", icon: Laugh, color: "primary", points: 3 },
    { id: "masterclass", label: "MasterClass 🔥", shortLabel: "Master 🔥", icon: Sparkles, color: "accent", points: 4 },
    { id: "banger", label: "Banger Absolu 🤯", shortLabel: "Banger 🤯", icon: Sparkles, color: "accent", points: 5 },
  ]

  return (
    <div className="h-full flex flex-col items-center px-2 py-2 sm:px-4 sm:py-3 overflow-hidden">
      {/* Timer and progress */}
      <div className="w-full max-w-2xl mb-2 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Meme {currentIndex + 1}/{totalMemes}
          </p>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>{votedCount}/{eligibleVoters}</span>
            </div>
            <div
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border-2 transition-all duration-300 ${isUrgent
                ? "bg-destructive/20 border-destructive text-destructive animate-pulse"
                : "bg-muted/50 border-border"
                }`}
            >
              <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${isUrgent ? "animate-bounce" : ""}`} />
              <span className="text-lg sm:text-2xl font-black font-mono">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalMemes) * 100}%` }}
          />
        </div>
      </div>

      {/* Meme display */}
      <Card className="w-full max-w-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-2 animate-in fade-in zoom-in-95 duration-500 delay-100 flex-1 min-h-0 flex flex-col">
        <CardContent className="p-2 sm:p-4 flex-1 min-h-0 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full h-full max-h-full justify-center gap-1.5 sm:gap-2">
            {/* Meme image */}
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center bg-muted/30 rounded-xl overflow-hidden group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                <DownloadMemeButton meme={meme} />
              </div>
              <MemeMedia
                src={meme.imageUrl}
                alt="Meme"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Caption */}
            <div className="w-full text-center p-2 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border/50 shrink-0">
              <p className="text-base sm:text-xl md:text-2xl font-bold text-foreground leading-tight line-clamp-2">
                {'"'}{meme.caption}{'"'}
              </p>
            </div>

            {/* Anonymous indicator */}
            <p className="text-xs text-muted-foreground shrink-0">
              Créé par un joueur anonyme 🎭
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vote buttons or waiting state */}
      <div className="w-full max-w-4xl shrink-0">
        {isOwnMeme ? (
          <div className="text-center animate-in fade-in duration-300 py-1">
            <p className="text-base sm:text-xl font-bold text-secondary mb-1">C&apos;est ta légende ! 😏</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Les autres joueurs sont en train de voter...</p>
            {isHost && (
              <Button
                onClick={onForceAdvance}
                variant="outline"
                size="sm"
                className="mt-2 border-2"
              >
                <SkipForward className="mr-2 h-4 w-4" />
                Forcer le passage
              </Button>
            )}
          </div>
        ) : (
          <>
            {hasVotedOnCurrent && (
              <div className="text-center animate-in fade-in duration-300 mb-2">
                <p className="text-sm sm:text-lg text-primary mb-1">Vote enregistré ! ✨</p>
                <p className="text-xs sm:text-sm text-muted-foreground">En attente des autres joueurs...</p>
                {isHost && (
                  <Button
                    onClick={onForceAdvance}
                    variant="outline"
                    size="sm"
                    className="mt-2 border-2"
                  >
                    <SkipForward className="mr-2 h-4 w-4" />
                    Forcer le passage
                  </Button>
                )}
              </div>
            )}

            <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
              {/* Vote options — 2 rows on mobile, wrapped on desktop */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 justify-center mb-2">
                {voteOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedVote === option.id

                  return (
                    <Button
                      key={option.id}
                      onClick={() => handleVote(option.id)}
                      disabled={hasVotedOnCurrent || isOwnMeme}
                      variant={isSelected ? "default" : "outline"}
                      className={`
                        sm:flex-1 sm:min-w-[130px] sm:max-w-[180px] h-auto py-1.5 px-1 sm:py-2 sm:px-3 flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-300
                        ${isSelected ? "scale-105" : "hover:scale-105"}
                        ${option.color === "destructive" && "hover:bg-destructive/20 hover:border-destructive hover:text-destructive"}
                        ${option.color === "secondary" && "hover:bg-secondary/20 hover:border-secondary hover:text-secondary"}
                        ${option.color === "primary" && "hover:bg-primary/20 hover:border-primary hover:text-primary"}
                        ${option.color === "accent" && "hover:bg-accent/20 hover:border-accent hover:text-accent"}
                        ${isSelected && option.color === "destructive" && "bg-destructive text-destructive-foreground border-destructive"}
                        ${isSelected && option.color === "secondary" && "bg-secondary text-secondary-foreground border-secondary"}
                        ${isSelected && option.color === "primary" && "bg-primary text-primary-foreground border-primary"}
                        ${isSelected && option.color === "accent" && "bg-accent text-accent-foreground border-accent"}
                        disabled:opacity-70
                      `}
                    >
                      <span className="text-[10px] sm:hidden font-bold text-center leading-tight">{option.shortLabel}</span>
                      <span className="hidden sm:block text-xs sm:text-sm font-bold text-center leading-tight">{option.label}</span>
                      <span className="text-[9px] sm:text-xs opacity-80">{option.points} pt{option.points > 1 ? "s" : ""}</span>
                    </Button>
                  )
                })}
                {/* Heart vote — in the grid on mobile */}
                <Button
                  onClick={() => handleVote("heart", true)}
                  disabled={hasVotedOnCurrent || isOwnMeme || hasUsedHeart}
                  variant={selectedVote === "heart" ? "default" : "outline"}
                  className={`
                    sm:hidden h-auto py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 border-2 transition-all duration-300 rounded-lg
                    ${hasUsedHeart && selectedVote !== "heart" ? "opacity-50 grayscale" : ""}
                    ${selectedVote === "heart"
                      ? "bg-red-500 text-white border-red-500 scale-105"
                      : "hover:bg-red-500/20 hover:text-red-500 hover:border-red-500 border-red-500/50"}
                  `}
                >
                  <span className="text-base">❤️</span>
                  <span className="text-[9px] font-bold">+10</span>
                  {hasUsedHeart && selectedVote !== "heart" && <span className="text-[8px] opacity-75">Utilisé</span>}
                </Button>
              </div>

              {/* Heart button — desktop only, full width bar */}
              <div className="hidden sm:flex justify-center border-t border-border/50 pt-3 mt-1 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-2 text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Ou alors...
                </div>
                <Button
                  onClick={() => handleVote("heart", true)}
                  disabled={hasVotedOnCurrent || isOwnMeme || hasUsedHeart}
                  variant={selectedVote === "heart" ? "default" : "outline"}
                  className={`
                    h-12 sm:h-14 px-4 sm:px-8 text-sm sm:text-lg font-black border-2 transition-all duration-300 rounded-full
                    ${hasUsedHeart && selectedVote !== "heart" ? "opacity-50 grayscale" : "shadow-[0_0_15px_rgba(239,68,68,0.5)]"}
                    ${selectedVote === "heart"
                      ? "bg-red-500 text-white border-red-500 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.8)]"
                      : "hover:bg-red-500/20 hover:text-red-500 hover:border-red-500 hover:scale-105 border-red-500/50"}
                  `}
                >
                  <span className="text-2xl mr-2">❤️</span>
                  COUP DE CŒUR (+10 pts)
                  {hasUsedHeart && selectedVote !== "heart" && (
                    <span className="ml-2 text-xs font-normal opacity-75">(Déjà utilisé)</span>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
