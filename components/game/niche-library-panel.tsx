"use client"

import { useState } from "react"
import { Plus, Trash2, Pencil, Check, X, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { NicheItem } from "@/types/game"

interface NicheLibraryPanelProps {
  niches: NicheItem[]
  onAdd: (text: string) => void
  onEdit: (id: string, text: string) => void
  onDelete: (id: string) => void
}

export function NicheLibraryPanel({ niches, onAdd, onEdit, onDelete }: NicheLibraryPanelProps) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")

  const handleAdd = () => {
    if (!input.trim()) return
    onAdd(input)
    setInput("")
  }

  const startEdit = (niche: NicheItem) => {
    setEditingId(niche.id)
    setEditText(niche.text)
  }

  const confirmEdit = () => {
    if (editingId) onEdit(editingId, editText)
    setEditingId(null)
    setEditText("")
  }

  return (
    <div className="w-full border-2 border-border rounded-xl overflow-hidden shadow-[3px_3px_0px_var(--border)]">
      {/* Accordion header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card hover:bg-muted/30 transition-colors font-black uppercase tracking-wide text-sm"
      >
        <span className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          Mes Niches
          <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            {niches.length}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 bg-card/60 space-y-3">
          {/* Add input */}
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 100))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder={"Ex: Quand Kevin arrive en retard..."}
              className="flex-1 h-9 px-3 rounded-lg bg-muted/50 border-2 border-border focus:border-accent outline-none transition-colors text-sm"
            />
            <Button
              size="sm"
              variant="accent"
              onClick={handleAdd}
              disabled={!input.trim()}
              className="h-9 px-3 font-black"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{input.length}/100 caractères · Stockées dans ton navigateur</p>

          {/* Niche list */}
          {niches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-2">
              Aucune niche pour l&apos;instant — ajoutes-en une !
            </p>
          ) : (
            <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {niches.map((niche) => (
                <li
                  key={niche.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 border border-border/50 group"
                >
                  {editingId === niche.id ? (
                    <>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value.slice(0, 100))}
                        onKeyDown={(e) => e.key === "Enter" && confirmEdit()}
                        className="flex-1 h-7 px-2 rounded bg-background border border-border text-sm outline-none focus:border-accent"
                        autoFocus
                      />
                      <button onClick={confirmEdit} className="text-accent hover:scale-110 transition-transform">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:scale-110 transition-transform">
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium truncate">{niche.text}</span>
                      <button
                        onClick={() => startEdit(niche)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(niche.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
