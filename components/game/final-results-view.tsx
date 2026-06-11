"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, RotateCcw, Home, Sparkles, Crown, Loader2 } from "lucide-react"
import type { Player } from "@/types/game"

interface FinalResultsViewProps {
  players: Player[]
  playerScores: Record<string, number>
  onNewGame: () => void
  onBackToHome: () => void
  isHost: boolean
}

export function FinalResultsView({
  players, playerScores, onNewGame, onBackToHome, isHost,
}: FinalResultsViewProps) {
  const leaderboard = players
    .map((p) => ({ ...p, totalScore: playerScores[p.id] || 0 }))
    .sort((a, b) => b.totalScore - a.totalScore)

  const winner = leaderboard[0]

  const rankStyles = [
    "border-yellow-400 bg-gradient-to-r from-yellow-400/20 to-yellow-600/10",
    "border-gray-400 bg-gradient-to-r from-gray-400/15 to-gray-500/5",
    "border-orange-400 bg-gradient-to-r from-orange-400/15 to-orange-600/5",
  ]

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex flex-col items-center px-4 py-6 sm:py-10 min-h-full">

        {/* Celebration Title */}
        <div className="text-center mb-6 sm:mb-10 animate-in fade-in slide-in-from-top-8 duration-700 shrink-0">
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
            <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-yellow-400 animate-pulse" />
            <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 animate-bounce" />
            <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-yellow-400 animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black bg-gradient-to-r from-yellow-400 via-secondary to-accent bg-clip-text text-transparent mb-2">
            FIN DE PARTIE
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground">
            Et le grand gagnant est...
          </p>
        </div>

        {/* Winner Card */}
        {winner && (
          <Card className="w-full max-w-sm sm:max-w-md mb-6 sm:mb-10 border-4 border-yellow-400 bg-gradient-to-br from-yellow-400/20 via-card to-yellow-600/10 animate-in fade-in zoom-in-95 duration-700 delay-300 shadow-2xl shadow-yellow-400/20">
            <CardContent className="p-6 sm:p-8 text-center">
              <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
              <div className="text-5xl sm:text-6xl mb-3">{winner.avatar}</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-400 mb-2">
                {winner.pseudo}
              </h2>
              <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-yellow-400 to-secondary bg-clip-text text-transparent">
                {winner.totalScore} points
              </p>
            </CardContent>
          </Card>
        )}

        {/* Full Leaderboard */}
        <Card className="w-full max-w-lg border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-center font-bold text-base sm:text-lg text-muted-foreground mb-3 sm:mb-4">
              Classement final
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {leaderboard.map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-left-4 ${i < 3 ? rankStyles[i] : "border-border/50 bg-muted/20"
                    }`}
                  style={{ animationDelay: `${(i + 3) * 100}ms` }}
                >
                  <span className={`text-xl sm:text-2xl font-black w-7 sm:w-8 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"
                    }`}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <span className="text-2xl sm:text-3xl">{player.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm sm:text-lg truncate">{player.pseudo}</p>
                  </div>
                  <span className={`text-base sm:text-xl font-black shrink-0 ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-primary"
                    }`}>
                    {player.totalScore} pts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 w-full max-w-md">
          {isHost ? (
            <Button onClick={onNewGame} size="lg"
              className="flex-1 h-12 sm:h-14 text-base sm:text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Nouvelle partie
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
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Quitter
          </Button>
        </div>

      </div>
    </div>
  )
}
