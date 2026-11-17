"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  X,
  HelpCircle,
  Users,
  Sparkles,
  Heart,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react"

interface HowToPlayModalProps {
  open: boolean
  onClose: () => void
}

const STEPS = [
  {
    number: 1,
    title: "Crée ou rejoins un salon",
    description:
      "Lance une partie privée et partage le code à 4 lettres avec tes potes, ou entre leur code pour rejoindre le salon instantanément.",
    icon: Users,
    accentClass: "text-primary border-primary/50 bg-primary/15",
    candidates: [
      "/CommentJouer/CreerRejoindre.png",
    ],
  },
  {
    number: 2,
    title: "Tu obtiens un mème, écris ta légende",
    description:
      "À chaque manche, tu reçois une vidéo ou image imposée. Écris la punchline la plus drôle avant la fin du chrono — et joue aux mini-jeux en attendant les autres !",
    icon: Sparkles,
    accentClass: "text-secondary border-secondary/50 bg-secondary/15",
    candidates: [
      "/CommentJouer/EcritTaLegende.png",
    ],
  },
  {
    number: 3,
    title: "Vote & donne ton unique Coup de Cœur",
    description:
      "Note les créations de tes potes et utilise ton unique Coup de Cœur (+10 pts bonus) de la partie sur le mème qui t'a fait plier !",
    icon: Heart,
    accentClass: "text-rose-400 border-rose-500/50 bg-rose-500/15",
    candidates: [
      "/CommentJouer/NoteTesPote.png",
    ],
  },
  {
    number: 4,
    title: "Remporte la partie avec le plus de points",
    description:
      "Cumule le maximum de points au fil des manches pour décrocher la couronne finale et sauvegarde les meilleurs Bangers dans ton Hall of Fame !",
    icon: Trophy,
    accentClass: "text-amber-400 border-amber-500/50 bg-amber-500/15",
    candidates: [
      "/CommentJouer/RemporteLaPartie.png",
    ],
  },
]

export function HowToPlayModal({ open, onClose }: HowToPlayModalProps) {
  const [stepIdx, setStepIdx] = useState(0)
  const [candidateIdx, setCandidateIdx] = useState(0)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    if (open) {
      setStepIdx(0)
      setCandidateIdx(0)
      setImgFailed(false)
    }
  }, [open])

  useEffect(() => {
    setCandidateIdx(0)
    setImgFailed(false)
  }, [stepIdx])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setStepIdx((s) => Math.min(STEPS.length - 1, s + 1))
      } else if (e.key === "ArrowLeft") {
        setStepIdx((s) => Math.max(0, s - 1))
      } else if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const current = STEPS[stepIdx]
  const Icon = current.icon
  const isFirst = stepIdx === 0
  const isLast = stepIdx === STEPS.length - 1
  const currentImgSrc = current.candidates[candidateIdx]

  const handleImageError = () => {
    if (candidateIdx < current.candidates.length - 1) {
      setCandidateIdx((c) => c + 1)
    } else {
      setImgFailed(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border-2 border-primary bg-card shadow-[6px_6px_0px_oklch(0.75_0.25_300_/_0.45)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">Comment jouer ?</h2>
              <p className="text-xs text-muted-foreground">
                Étape {current.number} sur {STEPS.length}
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {STEPS.map((s, idx) => (
              <button
                key={s.number}
                type="button"
                onClick={() => setStepIdx(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  idx === stepIdx
                    ? "w-7 bg-primary"
                    : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                }`}
                aria-label={`Étape ${s.number}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Screenshot Frame */}
          <div className="w-full aspect-video rounded-xl border-2 border-border bg-black/70 overflow-hidden flex items-center justify-center relative shadow-inner">
            {!imgFailed ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={currentImgSrc}
                src={currentImgSrc}
                alt={`Étape ${current.number} — ${current.title}`}
                onError={handleImageError}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
                <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center ${current.accentClass}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Capture : <code>/public/commentJoueur/etape{current.number}.png</code>
                </p>
              </div>
            )}

            <span className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg border-2 text-xs font-black backdrop-blur-md ${current.accentClass}`}>
              Étape {current.number}
            </span>
          </div>

          {/* Step Title & Description */}
          <div className="text-center space-y-1.5 px-2">
            <h3 className="text-lg sm:text-xl font-black flex items-center justify-center gap-2">
              <Icon className="w-5 h-5 text-primary shrink-0" />
              <span>{current.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {current.description}
            </p>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3.5 border-t border-border bg-muted/20 flex items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
            className="font-black text-xs"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>

          <span className="text-xs font-bold text-muted-foreground">
            {current.number} / {STEPS.length}
          </span>

          {isLast ? (
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="font-black text-xs px-5"
            >
              C&apos;est parti !
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setStepIdx((s) => Math.min(STEPS.length - 1, s + 1))}
              className="font-black text-xs px-4"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
