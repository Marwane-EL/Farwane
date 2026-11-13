"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Zap } from "lucide-react"

const GRID_SIZE = 16
const INITIAL_SPEED_MS = 145
const MIN_SPEED_MS = 70
const BEST_SCORE_KEY = "snakeBestScore"

type Point = { x: number; y: number }
type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

const INITIAL_SNAKE: Point[] = [
  { x: 8, y: 8 },
  { x: 7, y: 8 },
  { x: 6, y: 8 },
]

const OPPOSITE: Record<Direction, Direction> = {
  UP: "DOWN",
  DOWN: "UP",
  LEFT: "RIGHT",
  RIGHT: "LEFT",
}

/** Appelable depuis l'extérieur pour réinitialiser le meilleur score Snake entre deux parties */
export function resetSnakeScore() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(BEST_SCORE_KEY)
  }
}

function getRandomFood(snake: Point[]): Point {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const freeCells: Point[] = []
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!occupied.has(`${x},${y}`)) {
        freeCells.push({ x, y })
      }
    }
  }
  if (freeCells.length === 0) return { x: 0, y: 0 }
  return freeCells[Math.floor(Math.random() * freeCells.length)]
}

interface SnakeGameProps {
  roundNumber?: number
}

export function SnakeGame({ roundNumber = 1 }: SnakeGameProps) {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE)
  const [food, setFood] = useState<Point>(() => getRandomFood(INITIAL_SNAKE))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const directionRef = useRef<Direction>("RIGHT")
  const directionQueueRef = useRef<Direction[]>([])
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(BEST_SCORE_KEY)
      if (saved) setBestScore(Number(saved) || 0)
    }
  }, [])

  const updateBestScore = useCallback((nextScore: number) => {
    setBestScore((prev) => {
      const updated = Math.max(prev, nextScore)
      if (typeof window !== "undefined") {
        localStorage.setItem(BEST_SCORE_KEY, String(updated))
      }
      return updated
    })
  }, [])

  const queueDirection = useCallback((nextDir: Direction) => {
    const queue = directionQueueRef.current
    const lastPlanned = queue.length > 0 ? queue[queue.length - 1] : directionRef.current
    if (nextDir === lastPlanned || OPPOSITE[lastPlanned] === nextDir) return
    if (queue.length < 2) {
      queue.push(nextDir)
    }
  }, [])

  const handleRestart = useCallback(() => {
    directionRef.current = "RIGHT"
    directionQueueRef.current = []
    setSnake(INITIAL_SNAKE)
    setFood(getRandomFood(INITIAL_SNAKE))
    setScore(0)
    setGameOver(false)
    setIsPaused(false)
  }, [])

  // Keyboard controls (ignored when typing in an input/textarea such as RoomChat)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
        case "z":
        case "Z":
          e.preventDefault()
          queueDirection("UP")
          break
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault()
          queueDirection("DOWN")
          break
        case "ArrowLeft":
        case "a":
        case "A":
        case "q":
        case "Q":
          e.preventDefault()
          queueDirection("LEFT")
          break
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault()
          queueDirection("RIGHT")
          break
        case " ":
          e.preventDefault()
          if (gameOver) {
            handleRestart()
          } else {
            setIsPaused((p) => !p)
          }
          break
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [gameOver, handleRestart, queueDirection])

  // Main game loop
  const speedMs = Math.max(MIN_SPEED_MS, INITIAL_SPEED_MS - Math.floor(score / 10) * 4)

  useEffect(() => {
    if (gameOver || isPaused) return

    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const nextDir = directionQueueRef.current.shift() ?? directionRef.current
        directionRef.current = nextDir

        const head = prevSnake[0]
        const nextHead: Point = {
          x: head.x + (nextDir === "RIGHT" ? 1 : nextDir === "LEFT" ? -1 : 0),
          y: head.y + (nextDir === "DOWN" ? 1 : nextDir === "UP" ? -1 : 0),
        }

        // Wall collision
        if (
          nextHead.x < 0 ||
          nextHead.x >= GRID_SIZE ||
          nextHead.y < 0 ||
          nextHead.y >= GRID_SIZE
        ) {
          setGameOver(true)
          return prevSnake
        }

        const ateFood = nextHead.x === food.x && nextHead.y === food.y
        const bodyToCheck = ateFood ? prevSnake : prevSnake.slice(0, -1)

        // Self collision
        if (bodyToCheck.some((seg) => seg.x === nextHead.x && seg.y === nextHead.y)) {
          setGameOver(true)
          return prevSnake
        }

        const nextSnake = ateFood
          ? [nextHead, ...prevSnake]
          : [nextHead, ...prevSnake.slice(0, -1)]

        if (ateFood) {
          setScore((s) => {
            const nextScore = s + 10
            updateBestScore(nextScore)
            return nextScore
          })
          setFood(getRandomFood(nextSnake))
        }

        return nextSnake
      })
    }, speedMs)

    return () => clearInterval(timer)
  }, [food, gameOver, isPaused, speedMs, updateBestScore])

  // Touch swipe controls on the board
  const handleTouchStart = (e: React.TouchEvent) => {
    if (gameOver) return
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (gameOver || !touchStartRef.current) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    const THRESHOLD = 22

    if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return

    if (Math.abs(dx) > Math.abs(dy)) {
      queueDirection(dx > 0 ? "RIGHT" : "LEFT")
    } else {
      queueDirection(dy > 0 ? "DOWN" : "UP")
    }

    if (typeof window !== "undefined" && window.navigator?.vibrate) {
      window.navigator.vibrate(8)
    }
    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = () => {
    touchStartRef.current = null
  }

  const snakeMap = new Map<string, number>()
  snake.forEach((seg, idx) => snakeMap.set(`${seg.x},${seg.y}`, idx))

  return (
    <div className="flex flex-col items-center p-2 sm:p-3 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden relative">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm sm:text-base font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
            Snake
          </h3>
          <span className="flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Zap className="w-3 h-3" />
            R{roundNumber}
          </span>
        </div>
        <div className="flex gap-1.5 items-center">
          <div className="text-xs sm:text-sm font-bold bg-muted px-2.5 py-1 rounded-full flex items-center gap-2">
            <span>Score: {score}</span>
            <span className="text-amber-400 flex items-center gap-1 text-[11px]">
              <Trophy className="w-3 h-3" />
              {bestScore}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1 text-xs sm:text-sm px-2.5 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground rounded-full transition-all border border-border font-medium"
            title="Recommencer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Square Board */}
      <div
        className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden py-0.5 touch-none select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="h-full max-h-full aspect-square rounded-lg border-2 border-emerald-500/50 bg-black/95 p-1 grid gap-[1px] shadow-inner"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
            const x = index % GRID_SIZE
            const y = Math.floor(index / GRID_SIZE)
            const key = `${x},${y}`
            const snakeIdx = snakeMap.get(key)
            const isFood = food.x === x && food.y === y

            let cellClass = "bg-white/[0.03] rounded-[2px]"
            if (snakeIdx === 0) {
              cellClass = "bg-emerald-400 rounded-[3px] shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            } else if (snakeIdx !== undefined) {
              cellClass = "bg-emerald-500/80 rounded-[2px]"
            } else if (isFood) {
              cellClass = "bg-rose-500 rounded-full scale-90 shadow-[0_0_8px_rgba(244,63,94,0.9)]"
            }

            return <div key={key} className={cellClass} />
          })}
        </div>
      </div>

      {/* Mobile / Touch D-Pad */}
      <div className="w-full flex items-center justify-center gap-1.5 pt-1.5 shrink-0 select-none touch-none">
        <button
          type="button"
          aria-label="Gauche"
          onPointerDown={(e) => {
            e.preventDefault()
            queueDirection("LEFT")
          }}
          className="h-10 w-12 sm:h-9 sm:w-11 flex items-center justify-center bg-card hover:bg-muted active:scale-90 border-2 border-border rounded-lg text-foreground shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Haut"
          onPointerDown={(e) => {
            e.preventDefault()
            queueDirection("UP")
          }}
          className="h-10 w-12 sm:h-9 sm:w-11 flex items-center justify-center bg-card hover:bg-muted active:scale-90 border-2 border-border rounded-lg text-foreground shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Bas"
          onPointerDown={(e) => {
            e.preventDefault()
            queueDirection("DOWN")
          }}
          className="h-10 w-12 sm:h-9 sm:w-11 flex items-center justify-center bg-card hover:bg-muted active:scale-90 border-2 border-border rounded-lg text-foreground shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
        >
          <ArrowDown className="w-5 h-5" />
        </button>
        <button
          type="button"
          aria-label="Droite"
          onPointerDown={(e) => {
            e.preventDefault()
            queueDirection("RIGHT")
          }}
          className="h-10 w-12 sm:h-9 sm:w-11 flex items-center justify-center bg-card hover:bg-muted active:scale-90 border-2 border-border rounded-lg text-foreground shadow-[2px_2px_0px_rgba(0,0,0,0.3)] transition-transform touch-manipulation"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Game Over Overlay */}
      {gameOver && (
        <div className="absolute inset-0 z-30 bg-background/85 backdrop-blur-md flex flex-col items-center justify-center rounded-xl p-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <h2 className="text-2xl sm:text-3xl font-black mb-1.5 text-destructive tracking-tight">GAME OVER</h2>
          <div className="bg-card/90 border-2 border-border p-3 rounded-xl mb-4 w-full max-w-xs shadow-md">
            <p className="text-sm font-bold mb-1">
              Score : <span className="text-emerald-400 font-black text-lg">{score}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Meilleur score : <span className="text-amber-400 font-bold">{bestScore}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Rejouer
          </button>
        </div>
      )}
    </div>
  )
}
