"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, RotateCcw, Home, Sparkles } from "lucide-react"
import type { Meme } from "@/app/page"

interface ResultsViewProps {
  memes: Meme[]
  onPlayAgain: () => void
  onBackToHome: () => void
}

export function ResultsView({ memes, onPlayAgain, onBackToHome }: ResultsViewProps) {
  // Sort memes by votes (highest first)
  const sortedMemes = [...memes].sort((a, b) => b.votes - a.votes)
  const topThree = sortedMemes.slice(0, 3)

  const podiumConfig = [
    {
      position: 1,
      icon: Trophy,
      color: "from-yellow-400 to-yellow-600",
      textColor: "text-yellow-400",
      bgColor: "bg-yellow-400/20",
      borderColor: "border-yellow-400",
      label: "1er",
      size: "h-32 md:h-40",
    },
    {
      position: 2,
      icon: Medal,
      color: "from-gray-300 to-gray-500",
      textColor: "text-gray-300",
      bgColor: "bg-gray-400/20",
      borderColor: "border-gray-400",
      label: "2ème",
      size: "h-24 md:h-32",
    },
    {
      position: 3,
      icon: Award,
      color: "from-orange-400 to-orange-700",
      textColor: "text-orange-400",
      bgColor: "bg-orange-400/20",
      borderColor: "border-orange-400",
      label: "3ème",
      size: "h-20 md:h-24",
    },
  ]

  // Reorder for visual podium (2nd, 1st, 3rd)
  const podiumOrder = [1, 0, 2]

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Sparkles className="h-8 w-8 text-secondary animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
            RÉSULTATS
          </h1>
          <Sparkles className="h-8 w-8 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground">Le podium de cette manche !</p>
      </div>

      {/* Podium */}
      <div className="flex items-end justify-center gap-2 md:gap-4 mb-8 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        {podiumOrder.map((orderIndex, visualIndex) => {
          const meme = topThree[orderIndex]
          const config = podiumConfig[orderIndex]
          
          if (!meme || !config) return null

          const Icon = config.icon

          return (
            <div
              key={meme.id}
              className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-500"
              style={{ animationDelay: `${(visualIndex + 1) * 200}ms` }}
            >
              {/* Player card */}
              <Card
                className={`w-28 md:w-40 border-2 ${config.borderColor} ${config.bgColor} backdrop-blur-sm mb-2 transition-transform hover:scale-105`}
              >
                <CardContent className="p-3 md:p-4 text-center">
                  {/* Meme preview */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden mb-2 bg-muted/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={meme.imageUrl}
                      alt={`Meme de ${meme.playerPseudo}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Player name */}
                  <p className="font-bold text-sm md:text-base truncate">
                    {meme.playerPseudo}
                  </p>
                  
                  {/* Score */}
                  <p className={`text-lg md:text-xl font-black ${config.textColor}`}>
                    {meme.votes} pts
                  </p>
                </CardContent>
              </Card>

              {/* Podium stand */}
              <div
                className={`w-28 md:w-40 ${config.size} rounded-t-xl bg-gradient-to-b ${config.color} flex items-center justify-center transition-all duration-500`}
              >
                <div className="text-center">
                  <Icon className="h-8 w-8 md:h-10 md:w-10 mx-auto text-background mb-1" />
                  <p className="text-xl md:text-2xl font-black text-background">
                    {config.label}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Winner highlight */}
      {topThree[0] && (
        <Card className="w-full max-w-lg border-2 border-yellow-400/50 bg-gradient-to-r from-yellow-400/10 to-orange-400/10 mb-8 animate-in fade-in zoom-in-95 duration-500 delay-500">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-2">Meme gagnant</p>
            <p className="text-xl font-bold mb-4">
              {'"'}{topThree[0].caption}{'"'}
            </p>
            <p className="text-sm text-yellow-400">
              Par {topThree[0].playerPseudo} 🏆
            </p>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-700">
        <Button
          onClick={onPlayAgain}
          size="lg"
          className="h-16 px-10 text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40"
        >
          <RotateCcw className="mr-2 h-6 w-6" />
          Manche suivante
        </Button>

        <Button
          onClick={onBackToHome}
          variant="outline"
          size="lg"
          className="h-16 px-8 text-lg font-semibold border-2 hover:bg-muted/50 transition-all duration-300"
        >
          <Home className="mr-2 h-5 w-5" />
          Accueil
        </Button>
      </div>
    </div>
  )
}
