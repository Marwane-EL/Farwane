"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, Dices, Target, CheckCircle2 } from "lucide-react"
import type { NichePoolItem } from "@/types/game"

interface NicheLotteryOverlayProps {
  pool: NichePoolItem[]
  targetNiche: NichePoolItem
  onComplete: () => void
}

export function NicheLotteryOverlay({ pool, targetNiche, onComplete }: NicheLotteryOverlayProps) {
  // Ensure we have candidates to cycle through
  const candidates = pool.length > 0 ? pool : [targetNiche]
  const [displayNiche, setDisplayNiche] = useState<NichePoolItem>(candidates[0])
  const [isLocked, setIsLocked] = useState(false)
  const [phase, setPhase] = useState<"spinning" | "locked" | "closing">("spinning")

  const onCompleteRef = useRef(onComplete)
  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    // Generate a sequence of random niches ending on targetNiche
    const sequenceLength = Math.max(14, candidates.length * 3)
    const sequence: NichePoolItem[] = []
    
    let lastId = ""
    for (let i = 0; i < sequenceLength - 1; i++) {
      const available = candidates.filter((c) => c.id !== lastId)
      const picked = available[Math.floor(Math.random() * available.length)] || candidates[0]
      sequence.push(picked)
      lastId = picked.id
    }
    sequence.push(targetNiche)

    let step = 0
    let timeoutId: NodeJS.Timeout

    const tick = () => {
      if (step < sequence.length) {
        setDisplayNiche(sequence[step])
        step++

        // Deceleration curve: begins at 50ms, ramps up to 420ms
        const progress = step / sequence.length
        let delay = 50
        if (progress > 0.4) delay = 80
        if (progress > 0.6) delay = 140
        if (progress > 0.75) delay = 220
        if (progress > 0.88) delay = 340
        if (progress > 0.95) delay = 480

        timeoutId = setTimeout(tick, delay)
      } else {
        // Finished sequence: lock on target
        setDisplayNiche(targetNiche)
        setIsLocked(true)
        setPhase("locked")

        // Wait on the final reveal before closing
        setTimeout(() => {
          setPhase("closing")
          setTimeout(() => {
            onCompleteRef.current()
          }, 400)
        }, 1300)
      }
    }

    // Start with a tiny initial delay for smooth entry
    timeoutId = setTimeout(tick, 150)

    return () => clearTimeout(timeoutId)
  }, [candidates, targetNiche])

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-md bg-background/85 flex flex-col items-center justify-center p-4 select-none transition-opacity duration-400 ${
        phase === "closing" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        <div
          className={`w-[480px] h-[480px] rounded-full blur-3xl transition-all duration-700 ${
            isLocked
              ? "bg-accent/30 scale-125"
              : "bg-secondary/20 scale-100 animate-pulse"
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-lg w-full text-center">
        {/* Header badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-border bg-card shadow-[3px_3px_0px_var(--border)] mb-6 animate-bounce">
          <Dices className="h-4 w-4 text-secondary animate-spin" style={{ animationDuration: "3s" }} />
          <span className="text-xs font-black uppercase tracking-widest text-foreground">
            {isLocked ? "Thème sélectionné !" : "Tirage de la Niche..."}
          </span>
          <Sparkles className="h-4 w-4 text-accent" />
        </div>

        {/* Roulette ticket container */}
        <div className="w-full relative px-2 py-4 flex flex-col items-center">
          {/* Main Étiquette Card */}
          <div
            className={`w-full py-6 px-5 rounded-2xl border-3 transition-all duration-300 transform flex flex-col items-center justify-center ${
              isLocked
                ? "bg-card border-accent shadow-[6px_6px_0px_oklch(0.6_0.22_145)] scale-105"
                : "bg-card/90 border-border shadow-[4px_4px_0px_var(--border)] scale-100"
            }`}
          >
            {/* Tag header */}
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md border ${
                isLocked
                  ? "bg-accent/20 text-accent border-accent/40"
                  : "bg-muted text-muted-foreground border-border"
              }`}>
                {isLocked ? "🎯 Thème officiel du round" : "🎲 Niche en jeu"}
              </span>
            </div>

            {/* Niche Text */}
            <p
              className={`text-xl sm:text-2xl md:text-3xl font-black transition-all leading-snug tracking-tight ${
                isLocked
                  ? "text-foreground scale-100 animate-in zoom-in-95 duration-200"
                  : "text-foreground/90 blur-[0.3px]"
              }`}
            >
              &ldquo;{displayNiche.text}&rdquo;
            </p>

            {isLocked && (
              <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-accent animate-in fade-in slide-in-from-bottom-2 duration-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>À vos claviers !</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-4 text-xs text-muted-foreground font-medium">
          {isLocked
            ? "Lancement de la phase de création..."
            : "La roulette sélectionne la private joke du round"}
        </p>
      </div>
    </div>
  )
}
