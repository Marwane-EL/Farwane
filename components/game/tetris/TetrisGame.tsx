"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, RotateCcw, Zap, ArrowLeft, ArrowRight, ArrowDown, RotateCw, ChevronsDown, Trash2 } from "lucide-react"
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

function useLongPress(callback: () => void, initialDelay = 180, repeatInterval = 70) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  const start = useCallback(() => {
    callbackRef.current()
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(10)
    }
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        callbackRef.current()
      }, repeatInterval)
    }, initialDelay)
  }, [initialDelay, repeatInterval])

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (intervalRef.current) clearInterval(intervalRef.current)
    timerRef.current = null
    intervalRef.current = null
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault()
      start()
    },
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  }
}

export function TetrisGame({ roundNumber = 1 }: TetrisGameProps) {
  const [gameOver, setGameOver] = useState(false)
  const [savedScore, setSavedScore] = useState(0)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const val = localStorage.getItem(SCORE_KEY)
      setSavedScore(val ? JSON.parse(val) : 0)
    }
  }, [])

  const handleGameOver = () => {
    setGameOver(true)
    const val = localStorage.getItem(SCORE_KEY)
    setSavedScore(val ? JSON.parse(val) : 0)
  }

  const {
    board,
    startGame,
    restartGame,
    isPlaying,
    score,
    upcomingBlocks,
    moveLeft,
    moveRight,
    rotate,
    drop,
    startFastDrop,
    stopFastDrop,
    hardDrop,
  } = useTetris(handleGameOver)

  useEffect(() => {
    if (!isPlaying && !gameOver) {
      startGame()
    }
  }, [startGame, isPlaying, gameOver])

  const handleRestart = (resetScore = false) => {
    setGameOver(false)
    restartGame(resetScore)
    if (resetScore) {
      setSavedScore(0)
    }
  }

  // Long press bindings for smooth movement
  const leftPress = useLongPress(moveLeft)
  const rightPress = useLongPress(moveRight)

  // Touch gestures directly on the board
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isPlaying) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() }
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPlaying || !lastTouchRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - lastTouchRef.current.x
    const dy = touch.clientY - lastTouchRef.current.y

    const STEP_X = 22
    const STEP_Y = 26

    if (Math.abs(dx) >= STEP_X) {
      if (dx > 0) {
        moveRight()
      } else {
        moveLeft()
      }
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(8)
      }
      lastTouchRef.current.x = touch.clientX
    }

    if (dy >= STEP_Y) {
      drop()
      lastTouchRef.current.y = touch.clientY
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isPlaying || !touchStartRef.current) return
    const touch = e.changedTouches[0]
    const totalDx = Math.abs(touch.clientX - touchStartRef.current.x)
    const totalDy = Math.abs(touch.clientY - touchStartRef.current.y)
    const duration = Date.now() - touchStartRef.current.time

    // Quick tap rotates block
    if (totalDx < 15 && totalDy < 15 && duration < 240) {
      rotate()
      if (typeof window !== "undefined" && window.navigator?.vibrate) {
        window.navigator.vibrate(10)
      }
    }
    touchStartRef.current = null
    lastTouchRef.current = null
  }

  const level = Math.floor((isPlaying ? score : savedScore) / 1000) + 1
  const displayScore = isPlaying ? score : savedScore

  return (
    <div className="tetris-game flex flex-col items-center p-2 sm:p-3 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border mt-0 w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm sm:text-base font-black bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
            Tetris
          </h3>
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400">
            <Zap className="w-3 h-3" />
            Niv. {level} · R{roundNumber}
          </span>
        </div>
        <div className="flex gap-1.5 items-center">
          <div className="text-xs sm:text-sm font-bold bg-muted px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span>Score: {displayScore}</span>
            {displayScore > 0 && (
              <button
                type="button"
                onClick={() => handleRestart(true)}
                title="Remettre le score à zéro"
                className="text-muted-foreground hover:text-destructive text-[10px] uppercase font-bold tracking-wider hover:underline"
              >
                Reset
              </button>
            )}
          </div>
          <button
            onClick={() => handleRestart(false)}
            className="flex items-center gap-1 text-xs sm:text-sm px-2.5 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-full transition-all duration-300 border border-border font-medium"
            title="Recommencer un nouveau plateau vide"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nouveau plateau</span>
          </button>
        </div>
      </div>

      {/* Board & Upcoming area with gesture support */}
      <div
        className="flex-1 w-full flex items-center justify-center gap-3 sm:gap-8 min-h-0 overflow-hidden py-0.5 touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Board currentBoard={board} />
        <div className="hidden sm:flex flex-col pt-4">
          <div className="text-xs text-muted-foreground font-bold mb-2">SUIVANT</div>
          <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
        </div>
      </div>

      {/* Mobile Arcade Gamepad Controls */}
      <div className="w-full flex items-center justify-between gap-1.5 pt-1.5 px-0.5 shrink-0 select-none touch-none">
        {/* D-Pad Directional Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            {...leftPress}
            type="button"
            aria-label="Gauche"
            className="h-10 w-11 sm:h-9 sm:w-10 flex items-center justify-center bg-card hover:bg-muted active:scale-90 active:bg-primary/30 border-2 border-border rounded-lg text-foreground font-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            {...rightPress}
            type="button"
            aria-label="Droite"
            className="h-10 w-11 sm:h-9 sm:w-10 flex items-center justify-center bg-card hover:bg-muted active:scale-90 active:bg-primary/30 border-2 border-border rounded-lg text-foreground font-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Descendre"
            onPointerDown={(e) => {
              e.preventDefault()
              drop()
              startFastDrop()
              if (typeof window !== "undefined" && window.navigator?.vibrate) window.navigator.vibrate(10)
            }}
            onPointerUp={(e) => {
              e.preventDefault()
              stopFastDrop()
            }}
            onPointerLeave={stopFastDrop}
            onPointerCancel={stopFastDrop}
            onContextMenu={(e) => e.preventDefault()}
            className="h-10 w-11 sm:h-9 sm:w-10 flex items-center justify-center bg-card hover:bg-muted active:scale-90 active:bg-primary/30 border-2 border-border rounded-lg text-foreground font-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            aria-label="Hard drop"
            onPointerDown={(e) => {
              e.preventDefault()
              hardDrop()
              if (typeof window !== "undefined" && window.navigator?.vibrate) window.navigator.vibrate(16)
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="h-10 px-2.5 sm:h-9 flex items-center justify-center gap-1 bg-amber-500/15 hover:bg-amber-500/25 active:scale-90 border-2 border-amber-500/50 rounded-lg text-amber-400 font-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
            title="Chute instantanée"
          >
            <ChevronsDown className="w-5 h-5" />
            <span className="text-[10px] font-black tracking-wider hidden xs:inline">DROP</span>
          </button>
          <button
            type="button"
            aria-label="Tourner"
            onPointerDown={(e) => {
              e.preventDefault()
              rotate()
              if (typeof window !== "undefined" && window.navigator?.vibrate) window.navigator.vibrate(12)
            }}
            onContextMenu={(e) => e.preventDefault()}
            className="h-10 px-3 sm:h-9 flex items-center justify-center gap-1 bg-purple-500/20 hover:bg-purple-500/30 active:scale-90 border-2 border-purple-500/60 rounded-lg text-purple-300 font-black shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
            title="Tourner la pièce"
          >
            <RotateCw className="w-5 h-5 text-purple-400" />
            <span className="text-[10px] font-black tracking-wider hidden xs:inline">ROTER</span>
          </button>
        </div>
      </div>

      {gameOver && (
        <div className="absolute inset-0 z-20 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center rounded-xl p-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-2xl sm:text-3xl font-black mb-1.5 text-destructive tracking-tight">GAME OVER</h2>
          <div className="bg-card/90 border-2 border-border p-3 rounded-xl mb-4 w-full max-w-xs shadow-md">
            <p className="text-sm font-bold mb-1">
              Score ce tour : <span className="text-primary font-black text-lg">{score}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Score total enregistré : <span className="text-accent font-bold">{savedScore}</span>
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
            <button
              onClick={() => handleRestart(false)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Rejouer
            </button>
            <button
              onClick={() => handleRestart(true)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-destructive hover:text-destructive-foreground border-2 border-border rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm text-foreground"
            >
              <Trash2 className="w-4 h-4" />
              Reset Score
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
