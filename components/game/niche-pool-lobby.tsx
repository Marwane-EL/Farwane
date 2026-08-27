"use client"

import { useState } from "react"
import { Plus, Trash2, ChevronDown, AlertTriangle, BookOpen, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import type { NichePoolItem, NicheItem } from "@/types/game"

interface NichePoolLobbyProps {
  nichePool: NichePoolItem[]
  currentPlayerId: string
  isHost: boolean
  nicheRoundRatio: number
  personalNiches: NicheItem[]         // from useNicheLibrary
  onAdd: (text: string, saveToLibrary: boolean) => void
  onRemove: (id: string) => void
}

export function NichePoolLobby({
  nichePool,
  currentPlayerId,
  isHost,
  nicheRoundRatio,
  personalNiches,
  onAdd,
  onRemove,
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

  const nicheEnabled = nicheRoundRatio > 0
  const poolEmpty = nichePool.length === 0

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wide">
        <Tag className="h-3.5 w-3.5 text-accent" />
        <span>Niches pour cette partie</span>
        <span className="ml-auto bg-muted/50 px-2 py-0.5 rounded-full">
          {nichePool.length} niche{nichePool.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Warning: niches enabled but pool empty */}
      {nicheEnabled && poolEmpty && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/15 border border-secondary/40 text-secondary text-xs font-bold">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Ajoutez au moins 1 niche pour activer ce mode
        </div>
      )}

      {/* Pool list */}
      {nichePool.length > 0 && (
        <ul className="space-y-1 max-h-36 overflow-y-auto pr-1">
          {nichePool.map((niche) => {
            const canRemove = isHost || niche.addedBy === currentPlayerId
            return (
              <li
                key={niche.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/40 group text-sm"
              >
                <span className="flex-1 font-medium truncate">{niche.text}</span>
                {canRemove && (
                  <button
                    onClick={() => onRemove(niche.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Add input row */}
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, 100))}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={"Ajouter une niche..."}
          className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border-2 border-border focus:border-accent outline-none transition-colors text-sm"
        />
        {personalNiches.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-2 shrink-0" title="Depuis ma bibliothèque">
                <BookOpen className="h-4 w-4" />
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
                  className="cursor-pointer text-sm font-medium"
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
          className="h-9 px-3 font-black shrink-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Save to library checkbox */}
      <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground font-medium select-none w-fit">
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
