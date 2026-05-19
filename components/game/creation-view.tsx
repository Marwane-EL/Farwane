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
}: CreationViewProps) {
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

  // Timer — no dependency on caption, so it won't restart on keystrokes
  useEffect(() => {
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
  }, [])

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
      <div className="h-full w-full flex flex-col items-center py-4 px-4 overflow-hidden">
        <div className="text-center animate-in fade-in zoom-in-95 duration-500 w-full max-w-4xl mx-auto flex flex-col items-center min-h-0">
          <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 text-accent mx-auto mb-2 animate-bounce shrink-0" />
          <h2 className="text-xl sm:text-2xl font-black mb-2 bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent shrink-0">
            Meme envoyé !
          </h2>
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-muted/50 border-2 border-border mb-3 shrink-0">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm sm:text-base font-medium text-muted-foreground">
              {submissionCount}/{totalPlayers} joueurs ont soumis
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2 shrink-0">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>En attente des autres joueurs...</span>
          </div>

          <div className="flex gap-2 mb-2 shrink-0">
            <Button
              variant={activeMiniGame === "pokemon" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMiniGame("pokemon")}
              className="h-8 rounded-full text-xs"
            >
              Pokémon
            </Button>
            <Button
              variant={activeMiniGame === "tetris" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveMiniGame("tetris")}
              className="h-8 rounded-full text-xs"
            >
              <Gamepad2 className="w-3 h-3 mr-1" />
              Tetris
            </Button>
          </div>
          
          <div className="flex-1 min-h-0 w-full flex justify-center pb-2 relative z-0">
            {activeMiniGame === "pokemon" ? <PokemonMemory /> : <TetrisGame />}
          </div>

          {/* Host can force move to voting if someone is slow/AFK */}
          {isHost && submissionCount >= 1 && submissionCount < totalPlayers && (
            <Button
              onClick={onForceVoting}
              size="sm"
              variant="outline"
              className="mt-2 h-10 px-6 text-sm font-bold transition-all duration-300 hover:scale-105 bg-background border-2 shrink-0"
            >
              Forcer le passage aux votes ({submissionCount})
            </Button>
          )}

          {submissionCount >= totalPlayers && (
             <div className="mt-2 px-6 py-2 bg-primary/20 text-primary border border-primary/30 rounded-full font-bold animate-pulse text-sm sm:text-base shrink-0">
                Lancement des votes imminent...
             </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col px-4 py-2 sm:py-4 overflow-hidden">
      {/* Timer */}
      <div className="flex justify-center mb-2 sm:mb-4 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
        <div
          className={`flex items-center gap-2 px-4 py-1.5 sm:px-6 sm:py-2 rounded-full border-2 transition-all duration-300 ${
            isUrgent
              ? "bg-destructive/20 border-destructive text-destructive animate-pulse"
              : "bg-muted/50 border-border"
          }`}
        >
          <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${isUrgent ? "animate-bounce" : ""}`} />
          <span className="text-xl sm:text-2xl font-black font-mono tracking-wider">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">restants</span>
        </div>
      </div>

      {/* Round info */}
      <div className="text-center mb-2 sm:mb-4 shrink-0 animate-in fade-in slide-in-from-top-6 duration-500 delay-100">
        <p className="text-xs text-muted-foreground mb-0.5">Manche {currentRound}/{totalRounds}</p>
        <h2 className="text-base md:text-lg font-bold text-foreground">
          Écris la légende la plus drôle ! 😂
        </h2>
      </div>

      {/* Main content - Image and Caption */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full min-h-0 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
        {/* Imposed Meme Image */}
        <Card className="w-full flex-1 min-h-0 border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-2 sm:mb-4 flex flex-col">
          <CardContent className="p-3 sm:p-4 flex flex-col items-center flex-1 min-h-0">
            <div className="w-full flex justify-between items-center mb-2 px-2 shrink-0">
              <p className="text-xs sm:text-sm text-muted-foreground">Image imposée pour cette manche :</p>
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshMeme}
                disabled={refreshesLeft <= 0 || hasSubmitted}
                title="Changer d'image"
                className="gap-1.5 h-7 px-2 text-xs hover:bg-white/10 hover:text-white border-border/50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Changer</span>
                <span className="text-muted-foreground">({refreshesLeft})</span>
              </Button>
            </div>
            <div className="relative w-full flex-1 min-h-0 flex justify-center items-center rounded-lg overflow-hidden bg-muted/30 border-2 border-border/50 p-2">
              <MemeMedia
                src={currentMemeUrl}
                alt="Meme imposé"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </CardContent>
        </Card>

        {/* Caption Input */}
        <Card className="w-full shrink-0 border-2 border-primary/30 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
            <h3 className="font-semibold text-center text-sm sm:text-base hidden sm:block">
              Écris ta légende / blague !
            </h3>
            <Textarea
              placeholder="Ta punchline ici..."
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 150))}
              className="resize-none h-20 sm:h-24 text-base sm:text-lg bg-muted/50 border-2 border-border focus:border-primary transition-colors text-center"
              maxLength={150}
            />
            <div className="flex justify-between items-center">
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                Sois créatif et fais rire les autres !
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground ml-auto">
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
          className="h-12 sm:h-14 px-8 sm:px-12 text-lg sm:text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <Send className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
          {"J'ai fini !"}
        </Button>
      </div>
    </div>
  )

}
