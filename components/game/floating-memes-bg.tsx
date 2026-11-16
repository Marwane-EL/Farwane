"use client"

import { useEffect, useState } from "react"
import type { CSSProperties } from "react"

interface FloatingItem {
  url: string
  isVideo: boolean
  startX: number
  startY: number
  midX: number
  midY: number
  endX: number
  endY: number
  angleDeg: number
  rot: number
  duration: number
  delay: number
  sizeClass: string
}

interface Particle {
  x: number
  y: number
  size: number
  color: string
  opacity: number
  dx: number
  dy: number
  duration: number
  delay: number
}

const SIZES = [
  "w-24 h-24 sm:w-32 sm:h-32",
  "w-28 h-24 sm:w-36 sm:h-28",
  "w-24 h-28 sm:w-32 sm:h-36",
  "w-28 h-28 sm:w-36 sm:h-36",
]

const PARTICLE_COLORS = [
  "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]",
  "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
  "bg-amber-300 shadow-[0_0_8px_rgba(252,211,77,0.8)]",
  "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]",
  "bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8)]",
]

const SPARKS = [
  { dist: 95, spread: -10, delay: "0s", dur: "1.2s", size: "w-1.5 h-1.5", color: "bg-purple-300/70 shadow-[0_0_6px_rgba(216,180,254,0.6)]" },
  { dist: 115, spread: 10, delay: "0.28s", dur: "1.4s", size: "w-1 h-1", color: "bg-cyan-300/60 shadow-[0_0_5px_rgba(103,232,249,0.5)]" },
  { dist: 105, spread: -3, delay: "0.55s", dur: "1.3s", size: "w-1.5 h-1.5", color: "bg-emerald-300/60 shadow-[0_0_5px_rgba(110,231,183,0.5)]" },
  { dist: 120, spread: 6, delay: "0.85s", dur: "1.5s", size: "w-1 h-1", color: "bg-white/50 shadow-[0_0_4px_rgba(255,255,255,0.45)]" },
]

function isVideoFile(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min))
}

/** Pick a random edge point (0=left, 1=right, 2=top, 3=bottom) in vw/vh */
function randomEdgePoint(edge: number): { x: number; y: number } {
  switch (edge) {
    case 0: // left
      return { x: -20, y: randomBetween(5, 90) }
    case 1: // right
      return { x: 115, y: randomBetween(5, 90) }
    case 2: // top
      return { x: randomBetween(5, 90), y: -22 }
    default: // bottom
      return { x: randomBetween(5, 90), y: 115 }
  }
}

export function FloatingMemesBg({ memeUrls }: { memeUrls: string[] }) {
  const [items, setItems] = useState<FloatingItem[]>([])
  const [particles, setParticles] = useState<Particle[]>([])

  // Generate particles once on mount (independent of memeUrls)
  useEffect(() => {
    const generated: Particle[] = Array.from({ length: 24 }, (_, idx) => ({
      x: randomBetween(3, 97),
      y: randomBetween(5, 95),
      size: randomBetween(3, 7),
      color: PARTICLE_COLORS[idx % PARTICLE_COLORS.length],
      opacity: Number((0.25 + Math.random() * 0.45).toFixed(2)),
      dx: randomBetween(-90, 90),
      dy: randomBetween(-140, -50),
      duration: randomBetween(7, 15),
      delay: -randomBetween(0, 12),
    }))
    setParticles(generated)
  }, [])

  // Pick random memes with random edge-to-edge trajectories
  useEffect(() => {
    if (!memeUrls || memeUrls.length === 0) return

    const COUNT = 6
    const imageUrls = memeUrls.filter((u) => !isVideoFile(u))
    const pool = imageUrls.length >= COUNT ? imageUrls : memeUrls

    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const picked = shuffled.slice(0, COUNT)

    const built: FloatingItem[] = picked.map((url, idx) => {
      const startEdge = idx % 4
      // Pick an exit edge different from startEdge (prefer opposite or adjacent)
      const possibleExits = [0, 1, 2, 3].filter((e) => e !== startEdge)
      const endEdge = possibleExits[Math.floor(Math.random() * possibleExits.length)]

      const start = randomEdgePoint(startEdge)
      const end = randomEdgePoint(endEdge)
      const midX = Math.round((start.x + end.x) / 2 + randomBetween(-15, 15))
      const midY = Math.round((start.y + end.y) / 2 + randomBetween(-15, 15))

      const duration = randomBetween(20, 32)
      const delay = -Math.floor((duration / COUNT) * idx)
      const angleDeg = Math.round((Math.atan2(end.y - start.y, end.x - start.x) * 180) / Math.PI)

      return {
        url,
        isVideo: isVideoFile(url),
        startX: start.x,
        startY: start.y,
        midX,
        midY,
        endX: end.x,
        endY: end.y,
        angleDeg,
        rot: randomBetween(-10, 10),
        duration,
        delay,
        sizeClass: SIZES[idx % SIZES.length],
      }
    })

    setItems(built)
  }, [memeUrls])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Ambient glowing particles */}
      {particles.map((p, idx) => {
        const pStyle: CSSProperties & Record<string, string | number> = {
          left: `${p.x}vw`,
          top: `${p.y}vh`,
          width: `${p.size}px`,
          height: `${p.size}px`,
          animationName: "particle-drift",
          animationDuration: `${p.duration}s`,
          animationDelay: `${p.delay}s`,
          animationTimingFunction: "ease-in-out",
          animationIterationCount: "infinite",
          "--p-opacity": p.opacity,
          "--p-dx": `${p.dx}px`,
          "--p-dy": `${p.dy}px`,
        }
        return (
          <span
            key={`particle-${idx}`}
            style={pStyle}
            className={`absolute rounded-full ${p.color} will-change-transform`}
          />
        )
      })}

      {/* Floating random memes/GIFs with rocket thruster particles */}
      {items.map((item, idx) => {
        const style: CSSProperties & Record<string, string | number> = {
          top: 0,
          left: 0,
          animationName: "float-random",
          animationDuration: `${item.duration}s`,
          animationDelay: `${item.delay}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          "--start-x": `${item.startX}vw`,
          "--start-y": `${item.startY}vh`,
          "--mid-x": `${item.midX}vw`,
          "--mid-y": `${item.midY}vh`,
          "--end-x": `${item.endX}vw`,
          "--end-y": `${item.endY}vh`,
        }

        return (
          <div
            key={`${item.url}-${idx}`}
            style={style}
            className={`absolute ${item.sizeClass} will-change-transform`}
          >
            {/* Subtle stardust trail pointing opposite to flight direction */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{ transform: `rotate(${item.angleDeg + 180}deg)` }}
            >
              {SPARKS.map((sp, sIdx) => {
                const sparkStyle: CSSProperties & Record<string, string | number> = {
                  animationName: "rocket-spark",
                  animationDuration: sp.dur,
                  animationDelay: sp.delay,
                  animationTimingFunction: "ease-out",
                  animationIterationCount: "infinite",
                  "--spark-dist": `${sp.dist}px`,
                  "--spark-spread": `${sp.spread}px`,
                }
                return (
                  <span
                    key={sIdx}
                    style={sparkStyle}
                    className={`absolute top-1/2 left-1/2 -translate-y-1/2 rounded-full ${sp.size} ${sp.color} opacity-80`}
                  />
                )
              })}
            </div>

            {/* Meme card */}
            <div
              style={{ transform: `rotate(${item.rot}deg)` }}
              className="relative z-10 w-full h-full rounded-xl overflow-hidden border-2 border-white/15 bg-black/40 shadow-lg opacity-25 sm:opacity-35"
            >
              {item.isVideo ? (
                <video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.url}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
