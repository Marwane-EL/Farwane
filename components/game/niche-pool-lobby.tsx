"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, AlertTriangle, BookOpen, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import type { NichePoolItem, NicheItem, GameMode } from "@/types/game"

interface NichePoolLobbyProps {
  nichePool: NichePoolItem[]
  currentPlayerId: string
  isHost: boolean
  gameMode: GameMode
  minRequiredNiches: number
  personalNiches: NicheItem[]         // from useNicheLibrary
  onAdd: (text: string, saveToLibrary: boolean) => void
  onRemove: (id: string) => void
  onClearAll?: () => void
}

export function NichePoolLobby({
  nichePool,
  currentPlayerId,
  isHost,
  gameMode,
  minRequiredNiches,
  personalNiches,
  onAdd,
  onRemove,
  onClearAll,
}: NichePoolLobbyProps) {
  const [input, setInput] = useState("")
  const [saveToLibrary, setSaveToLibrary] = useState(false)

  const handleAdd = () => {
    const clean = input.trim()
    if (!clean) return
    onAdd(clean, saveToLibrary)
    setInput("")
  }

  const handleAddFromLibrary = (niche: NicheItem) => {
    onAdd(niche.text, false)
  }

  const isNicheMode = gameMode === "niche"
  const missingNiches = Math.max(0, minRequiredNiches - nichePool.length)
  const hasEnough = nichePool.length >= minRequiredNiches

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wide">
        <Tag className="h-3.5 w-3.5 text-accent" />
        <span>Niches pour la partie</span>
        <div className="ml-auto flex items-center gap-2">
          {isHost && nichePool.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] text-muted-foreground hover:text-destructive flex items-center gap-1 font-bold transition-colors hover:underline"
              title="Supprimer toutes les niches de la partie"
            >
              <Trash2 className="h-3 w-3" />
              Tout effacer
            </button>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            isNicheMode
              ? hasEnough
                ? "bg-accent/20 text-accent border border-accent/40"
                : "bg-destructive/20 text-destructive border border-destructive/40"
              : "bg-muted/50 text-muted-foreground"
          }`}>
            {nichePool.length} {isNicheMode ? `/ ${minRequiredNiches} min` : "niche" + (nichePool.length > 1 ? "s" : "")}
          </span>
        </div>
      </div>

      {/* Mode Niche requirements indicator */}
      {isNicheMode && !hasEnough && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-secondary/15 border border-secondary/40 text-secondary text-xs font-bold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>Ajoutez encore {missingNiches} niche{missingNiches > 1 ? "s" : ""} requise{missingNiches > 1 ? "s" : ""}</span>
        </div>
      )}

      {/* Pool list as compact wrap chips */}
      {nichePool.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {nichePool.map((niche) => {
            const canRemove = isHost || niche.addedBy === currentPlayerId
            return (
              <span
                key={niche.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/40 border border-border/60 text-xs font-medium group hover:border-accent/40 transition-colors"
              >
                <span className="truncate max-w-[130px] sm:max-w-[170px]">{niche.text}</span>
                {canRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(niche.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                    title="Supprimer la niche"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </span>
            )
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic py-0.5">Aucune niche ajoutée pour l&apos;instant.</p>
      )}

      {/* Add input row */}
      <div className="flex gap-1.5 pt-0.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 100))}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={"Ajouter une niche..."}
          className="flex-1 h-8 px-2.5 rounded-md bg-muted/50 border-2 border-border focus:border-accent outline-none transition-colors text-xs sm:text-sm"
        />
        {personalNiches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 shrink-0" title="Depuis ma bibliothèque">
                <BookOpen className="h-3.5 w-3.5" />
                <ChevronDown className="h-3 w-3 ml-0.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px] max-h-60 overflow-y-auto border-2 border-border shadow-[3px_3px_0px_var(--border)]">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                Ma bibliothèque
              </DropdownMenuLabel>
              {personalNiches.map((niche) => (
                <DropdownMenuItem
                  key={niche.id}
                  onClick={() => handleAddFromLibrary(niche)}
                  className="cursor-pointer text-xs font-medium"
                  disabled={nichePool.some((n) => n.text.toLowerCase() === niche.text.toLowerCase())}
                >
                  {niche.text}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          size="sm"
          variant="accent"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="h-8 px-2.5 font-black shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Save to library checkbox */}
      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-muted-foreground font-medium select-none w-fit">
        <input
          type="checkbox"
          checked={saveToLibrary}
          onChange={(e) => setSaveToLibrary(e.target.checked)}
          className="w-3.5 h-3.5 accent-[oklch(var(--accent))]"
        />
        Sauvegarder aussi dans ma bibliothèque perso
      </label>
    </div>
  )
}
