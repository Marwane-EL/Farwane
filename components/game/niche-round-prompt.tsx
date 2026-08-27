"use client"

import { Target } from "lucide-react"
import type { NichePoolItem } from "@/types/game"

interface NicheRoundPromptProps {
  niche: NichePoolItem
}

export function NicheRoundPrompt({ niche }: NicheRoundPromptProps) {
  return (
    <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 border-accent/60 bg-accent/10 shadow-[3px_3px_0px_oklch(0.6_0.22_145_/_0.3)] animate-in fade-in slide-in-from-top-2 duration-400">
      <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-accent/20 border border-accent/40">
        <Target className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-accent uppercase tracking-widest leading-none mb-0.5">
          Thème du round
        </p>
        <p className="text-sm font-bold text-foreground truncate">
          &ldquo;{niche.text}&rdquo;
        </p>
      </div>
    </div>
  )
}
