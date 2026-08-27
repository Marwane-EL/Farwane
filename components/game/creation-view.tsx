"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Send, CheckCircle, Users, Loader2, RefreshCw } from "lucide-react"
import { MemeMedia } from "@/components/game/meme-media"
import { PokemonMemory } from "@/components/game/pokemon-memory"
import { TetrisGame } from "@/components/game/tetris/TetrisGame"
import { Gamepad2 } from "lucide-react"
import { NicheRoundPrompt } from "@/components/game/niche-round-prompt"
import { NicheLotteryOverlay } from "@/components/game/niche-lottery-overlay"
import type { NichePoolItem } from "@/types/game"

interface CreationViewProps {
  currentMemeUrl: string
  timerDuration: number
  onSubmit: (caption: string) => void
  hasSubmitted: boolean
  submissionCount: number
  totalPlayers: number
  isHost: boolean
  onForceVoting: () => void
  currentRound: number
  totalRounds: number
  onRefreshMeme: () => void
  refreshesLeft: number
  currentNiche: NichePoolItem | null
  nichePool?: NichePoolItem[]
}

export function CreationView({
  currentMemeUrl,
  timerDuration,
  onSubmit,
  hasSubmitted,
  submissionCount,
  totalPlayers,
  isHost,
  onForceVoting,
  currentRound,
  totalRounds,
  onRefreshMeme,
  refreshesLeft,
  currentNiche,
  nichePool = [],
}: CreationViewProps) {
  const [isLotteryActive, setIsLotteryActive] = useState(!!currentNiche)
  const [timeLeft, setTimeLeft] = useState(timerDuration)
  const [caption, setCaption] = useState("")
  const [activeMiniGame, setActiveMiniGame] = useState<"pokemon" | "tetris">("pokemon")
  const captionRef = useRef("")

  // Keep ref in sync with state
  useEffect(() => {
    captionRef.current = caption
  }, [caption])

  // Stable onSubmit ref to avoid timer restarts
  const onSubmitRef = useRef(onSubmit)
  useEffect(() => {
    onSubmitRef.current = onSubmit
  }, [onSubmit])

  // Timer (only ticks when lottery is not active)
  useEffect(() => {
    if (isLotteryActive) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (captionRef.current.trim()) {
            onSubmitRef.current(captionRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isLotteryActive])

  const handleSubmit = useCallback(() => {
    if (caption.trim()) {
      onSubmit(caption)
    }
  }, [caption, onSubmit])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const isUrgent = timeLeft <= 30
  const canSubmit = caption.trim().length > 0 && !hasSubmitted

  // Waiting screen after submission
  if (hasSubmitted) {
    return (
      <div className="h-full w-full flex items-center justify-center overflow-y-auto">
        <div className="flex flex-col items-center justify-center py-4 px-4 pb-20 w-full max-w-4xl mx-auto">
          <div className="text-center animate-in fade-in zoom-in-95 duration-500 w-full flex flex-col items-center">
            {/* Submitted badge */}
            <div className="mb-3 px-5 py-3 rounded-lg border-2 border-accent bg-accent/10 shadow-[4px_4px_0px_oklch(0.6_0.22_145_/_0.4)] shrink-0 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-accent shrink-0" />
              <div className="text-left">
                <h2 className="text-base sm:text-xl font-black text-accent">Meme envoyé !</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mt-0.5">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>{submissionCount}/{totalPlayers} joueurs ont soumis</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 shrink-0 font-medium">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>En attente des autres joueurs...</span>
            </div>

            {/* Minigame switcher — neo-brut */}
            <div className="flex gap-2 mb-3 shrink-0">
              <Button
                variant={activeMiniGame === "pokemon" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMiniGame("pokemon")}
                className="h-8 px-4 rounded-full text-xs font-black"
              >
                Pokémon
              </Button>
              <Button
                variant={activeMiniGame === "tetris" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveMiniGame("tetris")}
                className="h-8 px-4 rounded-full text-xs font-black"
              >
                <Gamepad2 className="w-3 h-3 mr-1" />
                Tetris
              </Button>
            </div>

            {/* Minigame */}
            <div className="w-full flex justify-center pb-2 relative z-0" style={{ height: '420px', maxHeight: '55vh' }}>
              {activeMiniGame === "pokemon" ? <PokemonMemory /> : <TetrisGame roundNumber={currentRound} />}
            </div>

            {isHost && submissionCount >= 1 && submissionCount < totalPlayers && (
              <Button
                onClick={onForceVoting}
                size="sm"
                variant="outline"
                className="mt-2 h-10 px-6 text-sm font-black shrink-0"
              >
                Forcer le passage aux votes ({submissionCount})
              </Button>
            )}

            {submissionCount >= totalPlayers && (
              <div className="mt-2 px-5 py-2 border-2 border-primary/50 bg-primary/15 shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.4)] rounded-lg font-black animate-pulse text-sm sm:text-base text-primary shrink-0">
                Lancement des votes imminent...
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-4 py-2 sm:py-4 overflow-hidden">
      {/* Timer — neo-brut badge */}
      <div className="flex justify-center mb-2 sm:mb-4 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className={`flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg border-2 font-black font-mono transition-all duration-300 ${isUrgent
            ? "bg-destructive/15 border-destructive text-destructive shadow-[4px_4px_0px_oklch(0.45_0.25_25_/_0.5)] animate-pulse"
            : "bg-muted/40 border-border shadow-[3px_3px_0px_var(--border)]"
            }`}
        >
          <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${isUrgent ? "animate-bounce" : ""}`} />
          <span className="text-2xl sm:text-3xl tracking-wider">{formatTime(timeLeft)}</span>
          <span className="text-xs sm:text-sm font-bold hidden sm:inline opacity-70">restants</span>
        </div>
      </div>

      {/* Round info */}
      <div className="text-center mb-2 sm:mb-3 shrink-0 animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-0.5">
          Manche {currentRound}/{totalRounds}
        </p>
        <h2 className="text-base md:text-lg font-black text-foreground">
          Écris la légende la plus drôle ! 😂
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-0 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
        {/* Niche Lottery Animation Overlay */}
        {isLotteryActive && currentNiche && (
          <NicheLotteryOverlay
            pool={nichePool}
            targetNiche={currentNiche}
            onComplete={() => setIsLotteryActive(false)}
          />
        )}

        {/* Niche prompt — shown when this round has a niche (after lottery is done) */}
        {!isLotteryActive && currentNiche && (
          <div className="w-full max-w-2xl mx-auto mb-1 sm:mb-2 shrink-0">
            <NicheRoundPrompt niche={currentNiche} />
          </div>
        )}

        {/* Meme Image */}
        <Card className="w-full flex-1 min-h-0 border-2 border-border shadow-[4px_4px_0px_var(--border)] mb-1 sm:mb-4 flex flex-col py-0 gap-0">
          <CardContent className="p-3 sm:p-4 flex flex-col items-center flex-1 min-h-0">
            <div className="w-full flex justify-between items-center mb-2 px-1 shrink-0">
              <p className="text-xs sm:text-sm text-muted-foreground font-bold uppercase tracking-wide">Image imposée :</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshMeme}
                disabled={refreshesLeft <= 0 || hasSubmitted}
                className="gap-1.5 h-7 px-2 text-xs font-bold"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Changer</span>
                <span className="text-muted-foreground">({refreshesLeft})</span>
              </Button>
            </div>
            <div className="relative w-full flex-1 min-h-0 flex justify-center items-center rounded-lg overflow-hidden bg-muted/20 border-2 border-border/50 p-2">
              <MemeMedia
                src={currentMemeUrl}
                alt="Meme imposé"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Caption Input */}
        <Card className="w-full shrink-0 border-2 border-primary/50 shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.4)]">
          <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h3 className="font-black text-center text-xs uppercase tracking-widest text-primary hidden sm:block">
              Écris ta légende / blague !
            </h3>
            <Textarea
              placeholder="Ta punchline ici..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              className="resize-none h-20 sm:h-24 text-base sm:text-lg text-center font-bold"
              maxLength={150}
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block font-medium">
                Sois créatif et fais rire les autres !
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground ml-auto font-bold">
                {caption.length}/150
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit button */}
      <div className="flex justify-center mt-2 sm:mt-4 shrink-0 animate-in fade-in slide-in-from-bottom-8 duration-500 delay-300">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          variant="accent"
          className="h-12 sm:h-14 px-8 sm:px-12 text-lg sm:text-xl font-black uppercase tracking-wide"
        >
          <Send className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          {"J'ai fini !"}
        </Button>
      </div>
    </div>
  )
}
