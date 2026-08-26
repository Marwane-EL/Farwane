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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              Meme {currentIndex + 1}/{totalMemes}
            </span>
            <div className="flex items-center gap-1 px-2 py-1 rounded border-2 border-border bg-muted/30 text-xs font-bold text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{votedCount}/{eligibleVoters}</span>
            </div>
          </div>
          {/* Neo-brut timer badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border-2 font-black font-mono transition-all duration-300 ${
              isUrgent
                ? "bg-destructive/20 border-destructive text-destructive shadow-[3px_3px_0px_oklch(0.45_0.25_25_/_0.6)] animate-pulse"
                : "bg-muted/40 border-border shadow-[2px_2px_0px_var(--border)]"
            }`}
          >
            <Clock className={`h-4 w-4 sm:h-5 sm:w-5 ${isUrgent ? "animate-bounce" : ""}`} />
            <span className="text-lg sm:text-2xl">{timeLeft}s</span>
          </div>
        </div>

        {/* Progress bar — neo-brut style */}
        <div className="h-2 sm:h-2.5 bg-muted rounded border-2 border-border overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalMemes) * 100}%` }}
          />
        </div>
      </div>

      {/* Meme display */}
      <Card className="w-full max-w-2xl border-2 border-border mb-2 animate-in fade-in zoom-in-95 duration-500 delay-100 flex-1 min-h-0 flex flex-col shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.4)]">
        <CardContent className="p-2 sm:p-4 flex-1 min-h-0 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center w-full h-full max-h-full justify-center gap-1.5 sm:gap-2">
            {/* Meme image */}
            <div className="relative w-full flex-1 min-h-0 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden border-2 border-border/50 group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                <DownloadMemeButton meme={meme} />
              </div>
              <MemeMedia
                src={meme.imageUrl}
                alt="Meme"
                className="max-h-full max-w-full object-contain"
              />
            </div>

            {/* Caption — neo-brut */}
            <div className="w-full text-center p-2.5 rounded-lg border-2 border-primary/40 bg-primary/5 shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.3)] shrink-0 overflow-y-auto max-h-32 sm:max-h-40">
              <p className="text-base sm:text-xl md:text-2xl font-black text-foreground leading-tight break-words whitespace-pre-wrap">
                &quot;{meme.caption}&quot;
              </p>
            </div>

            {/* Anonymous indicator */}
            <p className="text-xs text-muted-foreground shrink-0 font-medium">
              Créé par un joueur anonyme 🎭
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vote buttons or waiting state */}
      <div className="w-full max-w-4xl shrink-0">
        {isOwnMeme ? (
          <div className="text-center animate-in fade-in duration-300 py-1">
            <p className="text-base sm:text-xl font-black text-secondary mb-1">C&apos;est ta légende ! 😏</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-2 font-medium">Les autres joueurs sont en train de voter...</p>
            {isHost && (
              <Button onClick={onForceAdvance} variant="outline" size="sm" className="mt-2">
                <SkipForward className="mr-2 h-4 w-4" />
                Forcer le passage
              </Button>
            )}
          </div>
        ) : (
          <>
            {hasVotedOnCurrent && (
              <div className="text-center animate-in fade-in duration-300 mb-2">
                <p className="text-sm sm:text-lg text-accent mb-1 font-black">Vote enregistré ! ✨</p>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">En attente des autres joueurs...</p>
                {isHost && (
                  <Button onClick={onForceAdvance} variant="outline" size="sm" className="mt-2">
                    <SkipForward className="mr-2 h-4 w-4" />
                    Forcer le passage
                  </Button>
                )}
              </div>
            )}

            <div className="w-full animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
              {/* Vote options */}
              <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-1.5 sm:gap-2 justify-center mb-2">
                {voteOptions.map((option) => {
                  const isSelected = selectedVote === option.id

                  const selectedStyles: Record<string, string> = {
                    destructive: "bg-destructive text-destructive-foreground border-destructive shadow-[2px_2px_0px_oklch(0.45_0.25_25)]",
                    secondary: "bg-secondary text-secondary-foreground border-secondary shadow-[2px_2px_0px_oklch(0.65_0.2_90)]",
                    primary: "bg-primary text-primary-foreground border-primary shadow-[2px_2px_0px_oklch(0.55_0.25_300)]",
                    accent: "bg-accent text-accent-foreground border-accent shadow-[2px_2px_0px_oklch(0.6_0.22_145)]",
                  }
                  const hoverStyles: Record<string, string> = {
                    destructive: "hover:border-destructive hover:text-destructive hover:bg-destructive/10",
                    secondary: "hover:border-secondary hover:text-secondary-foreground hover:bg-secondary hover:shadow-[3px_3px_0px_oklch(0.65_0.2_90)]",
                    primary: "hover:border-primary hover:text-primary hover:bg-primary/10",
                    accent: "hover:border-accent hover:text-accent hover:bg-accent/10",
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleVote(option.id)}
                      disabled={hasVotedOnCurrent || isOwnMeme}
                      className={`
                        sm:flex-1 sm:min-w-[120px] sm:max-w-[180px] h-auto py-1.5 px-1 sm:py-2.5 sm:px-3
                        flex flex-col items-center justify-center gap-0.5
                        border-2 rounded-lg font-bold text-center
                        transition-all duration-150 select-none
                        disabled:opacity-70 disabled:cursor-not-allowed
                        shadow-[3px_3px_0px_var(--border)]
                        active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                        ${isSelected ? selectedStyles[option.color] + " translate-x-[2px] translate-y-[2px] shadow-none" : "border-border bg-card " + hoverStyles[option.color] + " hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_var(--border)]"}
                      `}
                    >
                      <span className="text-[10px] sm:hidden font-black text-center leading-tight">{option.shortLabel}</span>
                      <span className="hidden sm:block text-xs sm:text-sm font-black text-center leading-tight">{option.label}</span>
                      <span className="text-[9px] sm:text-xs opacity-70 font-bold">{option.points} pt{option.points > 1 ? "s" : ""}</span>
                    </button>
                  )
                })}
                {/* Heart vote — mobile */}
                <button
                  onClick={() => handleVote("heart", true)}
                  disabled={hasVotedOnCurrent || isOwnMeme || hasUsedHeart}
                  className={`
                    sm:hidden h-auto py-1.5 px-1 flex flex-col items-center justify-center gap-0.5
                    border-2 rounded-lg font-bold transition-all duration-150 select-none
                    shadow-[3px_3px_0px_oklch(0.5_0.25_25_/_0.4)]
                    active:translate-x-[2px] active:translate-y-[2px] active:shadow-none
                    ${hasUsedHeart && selectedVote !== "heart" ? "opacity-50 grayscale border-red-500/30" : "border-red-500/60"}
                    ${selectedVote === "heart"
                      ? "bg-red-500 text-white border-red-500 translate-x-[2px] translate-y-[2px] shadow-none"
                      : "bg-card hover:bg-red-500/10 hover:border-red-500 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[4px_4px_0px_oklch(0.5_0.25_25_/_0.4)]"}
                  `}
                >
                  <span className="text-base">❤️</span>
                  <span className="text-[9px] font-black">+10</span>
                  {hasUsedHeart && selectedVote !== "heart" && <span className="text-[8px] opacity-75">Utilisé</span>}
                </button>
              </div>

              {/* Heart button — desktop only */}
              <div className="hidden sm:flex justify-center border-t-2 border-dashed border-border/50 pt-3 mt-1 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  Ou alors...
                </div>
                <button
                  onClick={() => handleVote("heart", true)}
                  disabled={hasVotedOnCurrent || isOwnMeme || hasUsedHeart}
                  className={`
                    h-12 sm:h-14 px-6 sm:px-10 text-sm sm:text-lg font-black border-2 rounded-lg
                    transition-all duration-150 select-none
                    active:translate-x-[2px] active:translate-y-[2px]
                    ${hasUsedHeart && selectedVote !== "heart"
                      ? "opacity-50 grayscale border-red-500/30 shadow-none"
                      : "shadow-[4px_4px_0px_oklch(0.5_0.25_25_/_0.5)]"}
                    ${selectedVote === "heart"
                      ? "bg-red-500 text-white border-red-500 translate-x-[2px] translate-y-[2px] shadow-none"
                      : "border-red-500/60 hover:bg-red-500/10 hover:border-red-500 hover:text-red-400 hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[6px_6px_0px_oklch(0.5_0.25_25_/_0.5)]"}
                  `}
                >
                  <span className="text-2xl mr-2">❤️</span>
                  COUP DE CŒUR (+10 pts)
                  {hasUsedHeart && selectedVote !== "heart" && (
                    <span className="ml-2 text-xs font-normal opacity-75">(Déjà utilisé)</span>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
