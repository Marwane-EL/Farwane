"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, RotateCcw, Home, Sparkles, Crown, Loader2, EyeOff, Heart } from "lucide-react"
import { RoomCodeBadge } from "@/components/game/room-code-badge"
import { PlayerAvatar } from "@/components/game/player-avatar"
import type { Player, GameMode, HeartRedistribution } from "@/types/game"

interface FinalResultsViewProps {
  players: Player[]
  playerScores: Record<string, number>
  onNewGame: () => void
  onBackToHome: () => void
  isHost: boolean
  roomCode?: string
  gameMode?: GameMode
  codenames?: Record<string, string>
  heartRedistribution?: HeartRedistribution | null
}

export function FinalResultsView({
  players, playerScores, onNewGame, onBackToHome, isHost,
  roomCode,
  gameMode,
  heartRedistribution,
}: FinalResultsViewProps) {
  const isIncognito = gameMode === "incognito"
  const leaderboard = players
    .map((p) => ({ ...p, totalScore: playerScores[p.id] || 0 }))
    .sort((a, b) => b.totalScore - a.totalScore)

  const winner = leaderboard[0]
  const isCrowded = leaderboard.length > 4

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Scrollable main content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
        <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center">
          {/* Celebration Title */}
          <div className="text-center mb-3 sm:mb-5 animate-in fade-in slide-in-from-top-8 duration-700 shrink-0 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1.5">
              {isIncognito && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border-2 border-secondary bg-secondary/20 text-[11px] font-black text-secondary uppercase tracking-wide">
                  <EyeOff className="h-3 w-3" /> Mode Fantôme
                </span>
              )}
              {roomCode && <RoomCodeBadge roomCode={roomCode} />}
            </div>
            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
              <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-400 animate-pulse" />
              <Trophy className="h-8 w-8 sm:h-11 sm:w-11 text-yellow-400 animate-bounce" />
              <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-yellow-400 animate-pulse" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight shimmer-text">
              FIN DE PARTIE
            </h1>
            <p className={`text-xs sm:text-base mt-1 ${isIncognito ? "text-accent font-black" : "text-muted-foreground font-medium"}`}>
              {isIncognito ? "🎭 Mode Fantôme : Les Masques Tombent !" : "Et le grand gagnant est..."}
            </p>
          </div>

          {/* Responsive 2-column grid on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-start">
            {/* Winner Card — Neo-brut gold */}
            {winner && (
              <div className="md:col-span-5 flex justify-center animate-in fade-in zoom-in-95 duration-700 delay-200">
                <div className="w-full max-w-sm border-4 border-yellow-400 rounded-xl bg-yellow-400/10 shadow-[6px_6px_0px_oklch(0.75_0.19_95_/_0.5)] p-4 sm:p-6 text-center">
                  {isIncognito && (
                    <div className="mb-2">
                      <span className="inline-block px-2.5 py-0.5 rounded-full border-2 border-yellow-400/60 bg-yellow-400/20 text-[11px] font-black text-yellow-300 uppercase tracking-wider">
                        👑 L&apos;Inconnu #1 Révélé
                      </span>
                    </div>
                  )}
                  <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-400 mx-auto mb-2 animate-bounce" />
                  <div className="text-4xl sm:text-5xl mb-2 flex justify-center">
                    <PlayerAvatar avatar={winner.avatar} imgClassName="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-yellow-400" />
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-yellow-400 mb-1 truncate">
                    {winner.pseudo}
                  </h2>
                  <p className="text-2xl sm:text-3xl font-black text-yellow-300">
                    {winner.totalScore} points
                  </p>
                  {heartRedistribution?.bonuses[winner.id] ? (
                    <span className="inline-block mt-2 px-2 py-0.5 rounded border border-red-500/40 bg-red-500/15 text-[11px] font-black text-red-400">
                      dont +{heartRedistribution.bonuses[winner.id]} ❤️ redistribués
                    </span>
                  ) : null}
                </div>
              </div>
            )}

            {/* Full Leaderboard — compact & scrollable when many players */}
            <Card className="md:col-span-7 w-full border-2 border-border animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 py-0 gap-0">
              <CardContent className="p-3 sm:p-5">
                <h3 className="text-center font-black text-xs sm:text-sm text-muted-foreground uppercase tracking-widest mb-3">
                  {isIncognito ? "🎭 Le Grand Dévoilement Final" : `Classement final (${leaderboard.length} joueurs)`}
                </h3>

                {heartRedistribution && heartRedistribution.unusedCount > 0 && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg border-2 border-red-500/40 bg-red-500/10 flex items-center justify-center gap-2 text-center animate-in fade-in duration-500">
                    <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500 shrink-0" />
                    <p className="text-[11px] sm:text-xs font-bold text-red-400">
                      {heartRedistribution.unusedCount} Coup{heartRedistribution.unusedCount > 1 ? "s" : ""} de Cœur non utilisé{heartRedistribution.unusedCount > 1 ? "s" : ""} redistribué{heartRedistribution.unusedCount > 1 ? "s" : ""} aux autres joueurs !
                    </p>
                  </div>
                )}

                <div className={`grid gap-2 ${isCrowded ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {leaderboard.map((player, i) => {
                    const rankBorder = i === 0
                      ? "border-yellow-400/70 bg-yellow-400/10 shadow-[2px_2px_0px_oklch(0.85_0.19_95_/_0.5)]"
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
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 transition-all duration-200 animate-in fade-in slide-in-from-left-4 ${rankBorder} ${isCrowded && i === 0 ? "sm:col-span-2" : ""}`}
                        style={{ animationDelay: `${(i + 2) * 70}ms` }}
                      >
                        <span className={`text-base sm:text-lg font-black w-6 shrink-0 text-center ${rankColor}`}>{medal}</span>
                        <PlayerAvatar avatar={player.avatar} className="text-xl sm:text-2xl shrink-0" imgClassName="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-sm truncate">{player.pseudo}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {heartRedistribution?.bonuses[player.id] ? (
                            <span className="px-1.5 py-0.5 rounded border border-red-500/40 bg-red-500/15 text-[10px] font-black text-red-400">
                              +{heartRedistribution.bonuses[player.id]}❤️
                            </span>
                          ) : null}
                          <span className={`text-sm sm:text-base font-black ${rankColor}`}>
                            {player.totalScore} pts
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Actions Footer — always visible */}
      <div className="shrink-0 px-3 pb-3 pt-2 sm:px-4 sm:pb-4 border-t-2 border-border bg-background/95 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-md mx-auto">
          {isHost ? (
            <Button onClick={onNewGame} size="lg" variant="accent"
              className="flex-1 h-11 sm:h-13 text-sm sm:text-base font-black uppercase tracking-wide"
            >
              <RotateCcw className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Nouvelle partie
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border-2 border-border bg-muted/30 shadow-[3px_3px_0px_var(--border)]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs sm:text-sm text-muted-foreground font-medium">En attente de l&apos;hôte...</span>
            </div>
          )}
          <Button onClick={onBackToHome} variant="outline" size="lg"
            className="h-11 sm:h-13 px-6 text-sm sm:text-base font-bold"
          >
            <Home className="mr-2 h-4 w-4" />
            Quitter
          </Button>
        </div>
      </div>
    </div>
  )
}
