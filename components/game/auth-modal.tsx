"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Loader2, Sparkles, LogIn, UserPlus, AlertCircle, Upload } from "lucide-react"
import { toast } from "sonner"
import { PlayerAvatar, compressImageToAvatarDataUrl, isImageAvatar } from "@/components/game/player-avatar"

const AVATAR_CHOICES = ["🎮", "🔥", "👑", "💀", "🚀", "🎲", "🎯", "⚡", "🌟", "🎪", "🦄", "🐉"]

interface AuthModalProps {
  open: boolean
  onClose: () => void
  onSignIn: (email: string, password: string) => Promise<unknown>
  onSignUp: (email: string, password: string, pseudo: string, avatar: string) => Promise<unknown>
}

export function AuthModal({ open, onClose, onSignIn, onSignUp }: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [pseudo, setPseudo] = useState("")
  const [avatar, setAvatar] = useState("🔥")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!open) return null

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const dataUrl = await compressImageToAvatarDataUrl(file)
      setAvatar(dataUrl)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Image invalide")
    } finally {
      e.target.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === "signup") {
        if (!pseudo.trim()) {
          setError("Choisis un pseudo")
          setLoading(false)
          return
        }
        await onSignUp(email, password, pseudo, avatar)
        toast.success("Compte créé ! Bienvenue sur FarWane")
      } else {
        await onSignIn(email, password)
        toast.success("Connexion réussie !")
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur d'authentification")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border-2 border-primary bg-card p-5 sm:p-6 shadow-[6px_6px_0px_oklch(0.75_0.25_300_/_0.5)] relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/40 text-primary text-xs font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Compte FarWane
          </div>
          <h2 className="text-2xl font-black">
            {mode === "signin" ? "Bon retour !" : "Créer un compte"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Retrouve tes mèmes favoris, tes Bangers (Hall of Fame) et ta synchro cloud
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-muted/50 border border-border mb-4">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null) }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mode === "signin"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Connexion
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null) }}
            className={`py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all ${
              mode === "signup"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Inscription
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Ton pseudo par défaut
                </label>
                <Input
                  type="text"
                  placeholder="Ex: FarwaneKing"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                  maxLength={15}
                  required
                  className="h-11 font-bold border-2 border-border"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Choisis ton avatar
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importer une photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>

                {isImageAvatar(avatar) && (
                  <div className="flex items-center gap-3 mb-2 p-2 rounded-xl border-2 border-primary bg-primary/10">
                    <PlayerAvatar avatar={avatar} imgClassName="w-10 h-10 rounded-full object-cover" />
                    <span className="text-xs font-bold text-primary flex-1">Photo personnalisée sélectionnée</span>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_CHOICES.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setAvatar(em)}
                      className={`h-10 rounded-xl border-2 text-lg flex items-center justify-center transition-all ${
                        avatar === em
                          ? "border-primary bg-primary/20 scale-105"
                          : "border-border bg-muted/30 hover:bg-muted"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="toi@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 border-2 border-border"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-muted-foreground block mb-1.5">
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="6 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              className="h-11 border-2 border-border"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl border-2 border-destructive bg-destructive/15 text-destructive text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-sm font-black uppercase tracking-wider"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : mode === "signin" ? (
              <LogIn className="w-4 h-4 mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            {mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </Button>
        </form>
      </div>
    </div>
  )
}
