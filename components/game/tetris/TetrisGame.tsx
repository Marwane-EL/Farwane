"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Play, RotateCcw } from "lucide-react"
import { useTetris } from "./useTetris"
import Board from "./Board"
import UpcomingBlocks from "./UpcomingBlocks"

export function TetrisGame() {
  const [gameOver, setGameOver] = useState(false)

  const handleGameOver = () => {
    setGameOver(true)
  }

  const { board, startGame, isPlaying, score, upcomingBlocks } = useTetris(handleGameOver)

  return (
    <div className="tetris-game flex flex-col items-center p-2 sm:p-3 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border mt-0 w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden relative">
      <div className="flex justify-between items-center w-full mb-2 shrink-0">
        <h3 className="text-sm sm:text-base font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
          Tetris
        </h3>
        <div className="flex gap-4 items-center">
          <div className="text-sm font-bold bg-muted px-3 py-1 rounded-full">Score: {score}</div>
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

      {!isPlaying && !gameOver && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-4 text-center">
          <h2 className="text-2xl font-black mb-2 text-primary">TETRIS</h2>
          <p className="text-sm text-muted-foreground mb-4">Utilise les flèches directionnelles pour jouer.</p>
          <button 
            onClick={() => {
              setGameOver(false)
              startGame()
            }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
          >
            <Play className="w-5 h-5" />
            Lancer la partie
          </button>
        </div>
      )}

      {gameOver && (
        <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl p-4 text-center">
          <h2 className="text-2xl font-black mb-2 text-destructive">GAME OVER</h2>
          <p className="text-lg font-bold mb-4">Score: <span className="text-primary">{score}</span></p>
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
