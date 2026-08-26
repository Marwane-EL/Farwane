"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw, Zap } from "lucide-react"
import { useTetris } from "./useTetris"
import Board from "./Board"
import UpcomingBlocks from "./UpcomingBlocks"

/** Clé localStorage partagée avec useTetris */
const SCORE_KEY = "tetrisScore"

/** Appelable depuis l'extérieur pour réinitialiser le score Tetris entre deux parties de jeu */
export function resetTetrisScore() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SCORE_KEY)
    localStorage.removeItem("tetrisBoard")
    localStorage.removeItem("tetrisUpcoming")
  }
}

interface TetrisGameProps {
  /** Numéro du round courant (1-based). Affiché et utilisé pour le badge de niveau. */
  roundNumber?: number
}

export function TetrisGame({ roundNumber = 1 }: TetrisGameProps) {
  const [gameOver, setGameOver] = useState(false)

  // Score cumulatif des rounds précédents (affiché avant que la partie commence)
  const [savedScore, setSavedScore] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem(SCORE_KEY)
      setSavedScore(val ? JSON.parse(val) : 0)
    }
  }, [])

  const handleGameOver = () => {
    setGameOver(true)
    // Rafraîchit le score affiché
    const val = localStorage.getItem(SCORE_KEY)
    setSavedScore(val ? JSON.parse(val) : 0)
  }

  const { board, startGame, isPlaying, score, upcomingBlocks } = useTetris(handleGameOver)

  useEffect(() => {
    if (!isPlaying && !gameOver) {
      startGame()
    }
  }, [startGame, isPlaying, gameOver])

  // Niveau calculé depuis le score (même formule que dans useTetris)
  const level = Math.floor((isPlaying ? score : savedScore) / 1000) + 1
  const displayScore = isPlaying ? score : savedScore

  return (
    <div className="tetris-game flex flex-col items-center p-2 sm:p-3 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border mt-0 w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden relative">
      <div className="flex justify-between items-center w-full mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            Tetris
          </h3>
          {/* Badge niveau + round */}
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400">
            <Zap className="w-3 h-3" />
            Niv. {level} · Round {roundNumber}
          </span>
        </div>
        <div className="flex gap-3 items-center">
          <div className="text-sm font-bold bg-muted px-3 py-1 rounded-full">
            Score: {displayScore}
          </div>
          <button
            onClick={() => {
              setGameOver(false)
              startGame()
            }}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-full transition-all duration-300 border border-border font-medium"
          >
            {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span className="hidden sm:inline">{isPlaying ? "Recommencer" : (gameOver ? "Rejouer" : "Jouer")}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full flex items-center justify-center gap-4 sm:gap-8 min-h-0 overflow-hidden py-1">
        <Board currentBoard={board} />
        <div className="hidden sm:flex flex-col pt-4">
          <div className="text-xs text-muted-foreground font-bold mb-2">SUIVANT</div>
          <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-4 text-center">
          <h2 className="text-2xl font-black mb-1 text-destructive">GAME OVER</h2>
          <p className="text-base font-bold mb-1">
            Score ce tour : <span className="text-primary">{score}</span>
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Score total : <span className="text-accent font-bold">{savedScore}</span>
          </p>
          <button
            onClick={() => {
              setGameOver(false)
              startGame()
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            <RotateCcw className="w-5 h-5" />
            Rejouer
          </button>
        </div>
      )}
    </div>
  )
}
