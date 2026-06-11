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
    { icon: Trophy, color: "from-yellow-400 to-yellow-600", textColor: "text-yellow-400", bgColor: "bg-yellow-400/20", borderColor: "border-yellow-400", label: "1er", barH: "h-24 sm:h-32 md:h-40" },
    { icon: Medal, color: "from-gray-300 to-gray-500", textColor: "text-gray-300", bgColor: "bg-gray-400/20", borderColor: "border-gray-400", label: "2ème", barH: "h-18 sm:h-24 md:h-32" },
    { icon: Award, color: "from-orange-400 to-orange-700", textColor: "text-orange-400", bgColor: "bg-orange-400/20", borderColor: "border-orange-400", label: "3ème", barH: "h-14 sm:h-20 md:h-24" },
  ]
  const podiumOrder = [1, 0, 2]

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex flex-col items-center px-3 py-4 sm:px-4 sm:py-8 pb-10 min-h-full">

        {/* Title */}
        <div className="text-center mb-4 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
          <p className="text-sm text-muted-foreground mb-1">Manche {currentRound}/{totalRounds}</p>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-secondary animate-pulse" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
              RÉSULTATS
            </h1>
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-accent animate-pulse" />
          </div>
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 sm:gap-3 md:gap-4 mb-5 sm:mb-8 w-full max-w-sm sm:max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 shrink-0">
          {podiumOrder.map((orderIndex, visualIndex) => {
            const meme = topThree[orderIndex]
            const config = podiumConfig[orderIndex]
            if (!meme || !config) return null
            const Icon = config.icon
            return (
              <div key={meme.id} className="flex flex-col items-center flex-1 animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${(visualIndex + 1) * 200}ms` }}>
                <Card className={`w-full border-2 ${config.borderColor} ${config.bgColor} backdrop-blur-sm mb-2 transition-transform hover:scale-105 relative group`}>
                  <CardContent className="p-2 sm:p-3 text-center relative">
                    <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <DownloadMemeButton meme={meme} className="h-7 w-7" />
                    </div>
                    <div className="w-full aspect-square rounded-lg overflow-hidden mb-1.5 bg-muted/50">
                      <MemeMedia src={meme.imageUrl} alt={`Meme de ${meme.playerPseudo}`} className="w-full h-full object-cover" />
                    </div>
                    <p className="font-bold text-xs sm:text-sm truncate">{meme.playerPseudo}</p>
                    <p className={`text-base sm:text-xl font-black ${config.textColor}`}>{meme.votes} pts</p>
                  </CardContent>
                </Card>
                <div className={`w-full ${config.barH} rounded-t-xl bg-gradient-to-b ${config.color} flex items-center justify-center`}>
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
          <Card className="w-full max-w-lg border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-5 sm:mb-8 animate-in fade-in zoom-in-95 duration-500 delay-400 shrink-0">
            <CardContent className="p-3 sm:p-4">
              <h3 className="text-center font-semibold text-sm sm:text-base text-muted-foreground mb-3 flex items-center justify-center gap-2">
                <Star className="h-4 w-4 text-secondary" />
                Classement général
              </h3>
              <div className="space-y-2">
                {leaderboard.map((player, i) => (
                  <div key={player.id} className="flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-lg bg-muted/30">
                    <span className="text-xs sm:text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                    <span className="text-base sm:text-lg">{player.avatar}</span>
                    <span className="font-semibold text-sm flex-1 truncate">{player.pseudo}</span>
                    <span className="font-black text-primary text-sm sm:text-base shrink-0">{player.totalScore} pts</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-700 shrink-0 w-full max-w-md">
          {isHost ? (
            <Button onClick={onPlayAgain} size="lg"
              className="flex-1 h-12 sm:h-14 text-base sm:text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              {isLastRound ? "Résultats finaux 🏆" : `Manche ${currentRound + 1}/${totalRounds}`}
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-full bg-muted/50 border-2 border-border/50">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">En attente de l&apos;hôte...</span>
            </div>
          )}
          <Button onClick={onBackToHome} variant="outline" size="lg"
            className="h-12 sm:h-14 px-6 text-base font-semibold border-2 hover:bg-muted/50 transition-all duration-300"
          >
            <Home className="mr-2 h-4 w-4" />
            Quitter
          </Button>
        </div>

      </div>
    </div>
  )
}
