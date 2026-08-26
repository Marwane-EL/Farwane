"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, RotateCcw, Home, Sparkles, Loader2, Star } from "lucide-react"
import { MemeMedia } from "@/components/game/meme-media"
import { DownloadMemeButton } from "@/components/game/download-meme-button"
import type { Meme, Player } from "@/types/game"

interface ResultsViewProps {
  memes: Meme[]
  players: Player[]
  playerScores: Record<string, number>
  currentRound: number
  totalRounds: number
  onPlayAgain: () => void
  onBackToHome: () => void
  isHost: boolean
}

export function ResultsView({
  memes, players, playerScores,
  currentRound, totalRounds,
  onPlayAgain, onBackToHome, isHost,
}: ResultsViewProps) {
  const sortedMemes = [...memes].sort((a, b) => b.votes - a.votes)
  const topThree = sortedMemes.slice(0, 3)
  const isLastRound = currentRound >= totalRounds

  // Cumulative leaderboard
  const leaderboard = players
    .map((p) => ({ ...p, totalScore: playerScores[p.id] || 0 }))
    .sort((a, b) => b.totalScore - a.totalScore)

  const podiumConfig = [
    {
      icon: Trophy,
      borderColor: "border-yellow-400",
      shadowColor: "shadow-[4px_4px_0px_oklch(0.85_0.19_95_/_0.6)]",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-400/10",
      barBg: "bg-yellow-400",
      label: "1er",
      barH: "h-24 sm:h-32 md:h-40"
    },
    {
      icon: Medal,
      borderColor: "border-gray-400",
      shadowColor: "shadow-[4px_4px_0px_rgba(156,163,175,0.5)]",
      textColor: "text-gray-300",
      bgColor: "bg-gray-400/10",
      barBg: "bg-gray-400",
      label: "2ème",
      barH: "h-18 sm:h-24 md:h-32"
    },
    {
      icon: Award,
      borderColor: "border-orange-400",
      shadowColor: "shadow-[4px_4px_0px_rgba(251,146,60,0.5)]",
      textColor: "text-orange-400",
      bgColor: "bg-orange-400/10",
      barBg: "bg-orange-400",
      label: "3ème",
      barH: "h-14 sm:h-20 md:h-24"
    },
  ]
  const podiumOrder = [1, 0, 2]

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center px-3 py-3 sm:px-4 sm:py-6 pb-4 min-h-full">

        {/* Title */}
        <div className="text-center mb-3 sm:mb-5 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
          <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
            Manche {currentRound}/{totalRounds}
          </p>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-secondary animate-pulse" />
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black tracking-tight shimmer-text">
              RÉSULTATS
            </h1>
            <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-accent animate-pulse" />
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-6 w-full max-w-sm sm:max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 shrink-0">
          {podiumOrder.map((orderIndex, visualIndex) => {
            const meme = topThree[orderIndex]
            const config = podiumConfig[orderIndex]
            if (!meme || !config) return null
            const Icon = config.icon
            return (
              <div key={meme.id} className="flex flex-col items-center flex-1 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${(visualIndex + 1) * 200}ms` }}>
                <div className={`w-full border-2 ${config.borderColor} ${config.bgColor} ${config.shadowColor} rounded-lg mb-2 transition-transform hover:-translate-x-[1px] hover:-translate-y-[1px] relative group`}>
                  <div className="p-2 sm:p-3 text-center relative">
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <DownloadMemeButton meme={meme} className="h-7 w-7" />
                    </div>
                    <div className="w-full aspect-square rounded-md overflow-hidden mb-1.5 bg-muted/50 border border-border/30">
                      <MemeMedia src={meme.imageUrl} alt={`Meme de ${meme.playerPseudo}`} className="w-full h-full object-cover" forceMuted />
                    </div>
                    <p className="font-black text-xs sm:text-sm truncate">{meme.playerPseudo}</p>
                    <p className={`text-base sm:text-xl font-black ${config.textColor}`}>{meme.votes} pts</p>
                  </div>
                </div>
                <div className={`w-full ${config.barH} rounded-t-lg ${config.barBg} flex items-center justify-center border-2 border-t-0 border-l-0 border-r-0 border-transparent`}>
                  <div className="text-center">
                    <Icon className="h-5 w-5 sm:h-8 sm:w-8 md:h-10 md:w-10 mx-auto text-background mb-0.5" />
                    <p className="text-base sm:text-xl md:text-2xl font-black text-background">{config.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cumulative Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="w-full max-w-lg border-2 border-border mb-4 animate-in fade-in zoom-in-95 duration-500 delay-400 shrink-0 py-0 gap-0">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-center font-black text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-secondary" />
                Classement général
              </h3>
              <div className="space-y-2">
                {leaderboard.map((player, i) => (
                  <div key={player.id} className={`flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg border-2 transition-all ${
                    i === 0 ? "border-yellow-400/60 bg-yellow-400/10 shadow-[2px_2px_0px_oklch(0.85_0.19_95_/_0.4)]" :
                    i === 1 ? "border-gray-400/40 bg-gray-400/5" :
                    i === 2 ? "border-orange-400/40 bg-orange-400/5" :
                    "border-border/40 bg-muted/20"
                  }`}>
                    <span className="text-xs sm:text-sm font-black text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-base sm:text-lg">{player.avatar}</span>
                    <span className="font-bold text-sm flex-1 truncate">{player.pseudo}</span>
                    <span className="font-black text-primary text-sm sm:text-base shrink-0">{player.totalScore} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      </div>

      {/* Sticky action buttons — always visible */}
      <div className="shrink-0 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 border-t-2 border-border bg-background">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-700">
          {isHost ? (
            <Button onClick={onPlayAgain} size="lg" variant="accent"
              className="flex-1 h-11 sm:h-14 text-sm sm:text-lg font-black uppercase tracking-wide"
            >
              <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {isLastRound ? "Résultats finaux 🏆" : `Manche ${currentRound + 1}/${totalRounds}`}
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border-2 border-border bg-muted/30 shadow-[3px_3px_0px_var(--border)]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">En attente de l&apos;hôte...</span>
            </div>
          )}
          <Button onClick={onBackToHome} variant="outline" size="lg"
            className="h-11 sm:h-14 px-6 text-base font-bold"
          >
            <Home className="mr-2 h-4 w-4" />
            Quitter
          </Button>
        </div>
      </div>
    </div>
  )
}
