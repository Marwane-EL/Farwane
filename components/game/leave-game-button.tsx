"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

interface LeaveGameButtonProps {
  onLeave?: () => void
  variant?: "ghost" | "outline" | "default"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  showText?: boolean
}

export function LeaveGameButton({
  onLeave,
  variant = "ghost",
  size = "sm",
  className = "",
  showText = true,
}: LeaveGameButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!onLeave) return null

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setShowConfirm(true)}
        className={`h-8 px-2.5 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border/60 rounded-lg gap-1.5 transition-colors font-bold select-none cursor-pointer shrink-0 ${className}`}
        title="Quitter la partie"
      >
        <LogOut className="w-3.5 h-3.5 shrink-0" />
        {showText && <span className="hidden xs:inline">Quitter</span>}
      </Button>

      {showConfirm && mounted && typeof document !== "undefined" && createPortal(
        <div 
          className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false)
          }}
        >
          <div 
            className="bg-card border-2 border-border shadow-[6px_6px_0px_rgba(0,0,0,0.6)] rounded-2xl p-6 max-w-sm w-full text-center space-y-4 my-auto relative z-10 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-destructive/15 text-destructive border-2 border-destructive/40 flex items-center justify-center mx-auto shadow-inner">
              <LogOut className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-foreground tracking-tight">
                Quitter la partie ?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed px-2">
                Tu vas quitter la salle et revenir à l'accueil.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 font-bold h-11 border-2 text-sm"
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setShowConfirm(false)
                  onLeave()
                }}
                className="flex-1 font-black shadow-lg h-11 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-transform active:scale-95"
              >
                Quitter
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
