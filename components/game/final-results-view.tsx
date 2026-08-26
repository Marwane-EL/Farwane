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
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-2 shimmer-text">
            FIN DE PARTIE
          </h1>
          <p className="text-base sm:text-xl text-muted-foreground font-medium">
            Et le grand gagnant est...
          </p>
        </div>

        {/* Winner Card — Neo-brut gold */}
        {winner && (
          <div className="w-full max-w-sm sm:max-w-md mb-6 sm:mb-10 animate-in fade-in zoom-in-95 duration-700 delay-300">
            <div className="border-4 border-yellow-400 rounded-lg bg-yellow-400/10 shadow-[8px_8px_0px_oklch(0.75_0.19_95_/_0.5)] p-6 sm:p-8 text-center">
              <Crown className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-400 mx-auto mb-3 animate-bounce" />
              <div className="text-5xl sm:text-6xl mb-3">{winner.avatar}</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-yellow-400 mb-2">
                {winner.pseudo}
              </h2>
              <p className="text-3xl sm:text-4xl font-black text-yellow-300">
                {winner.totalScore} points
              </p>
            </div>
          </div>
        )}

        {/* Full Leaderboard */}
        <Card className="w-full max-w-lg border-2 border-border mb-6 sm:mb-10 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
          <CardContent className="p-4 sm:p-6">
            <h3 className="text-center font-black text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3 sm:mb-4">
              Classement final
            </h3>
            <div className="space-y-2 sm:space-y-2.5">
              {leaderboard.map((player, i) => {
                const rankBorder = i === 0
                  ? "border-yellow-400/70 bg-yellow-400/10 shadow-[3px_3px_0px_oklch(0.85_0.19_95_/_0.5)]"
                  : i === 1
                  ? "border-gray-400/50 bg-gray-400/5 shadow-[2px_2px_0px_rgba(156,163,175,0.3)]"
                  : i === 2
                  ? "border-orange-400/50 bg-orange-400/5 shadow-[2px_2px_0px_rgba(251,146,60,0.3)]"
                  : "border-border/40 bg-muted/15"

                const rankColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-primary"
                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`

                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all duration-200 animate-in fade-in slide-in-from-left-4 ${rankBorder}`}
                    style={{ animationDelay: `${(i + 3) * 100}ms` }}
                  >
                    <span className={`text-xl sm:text-2xl font-black w-7 sm:w-8 ${rankColor}`}>{medal}</span>
                    <span className="text-2xl sm:text-3xl">{player.avatar}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm sm:text-lg truncate">{player.pseudo}</p>
                    </div>
                    <span className={`text-base sm:text-xl font-black shrink-0 ${rankColor}`}>
                      {player.totalScore} pts
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-700 w-full max-w-md">
          {isHost ? (
            <Button onClick={onNewGame} size="lg" variant="accent"
              className="flex-1 h-12 sm:h-14 text-base sm:text-lg font-black uppercase tracking-wide"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Nouvelle partie
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 px-6 py-3 rounded-lg border-2 border-border bg-muted/30 shadow-[3px_3px_0px_var(--border)]">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">En attente de l&apos;hôte...</span>
            </div>
          )}
          <Button onClick={onBackToHome} variant="outline" size="lg"
            className="h-12 sm:h-14 px-6 text-base font-bold"
          >
            <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Quitter
          </Button>
        </div>

      </div>
    </div>
  )
}
