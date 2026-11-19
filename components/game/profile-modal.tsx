"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  X,
  Flame,
  Star,
  User as UserIcon,
  Trash2,
  LogOut,
  Trophy,
  Heart,
  Gamepad2,
  Sparkles,
  Check,
  Upload,
} from "lucide-react"
import type { UserProfile } from "@/types/game"
import { MemeMedia } from "@/components/game/meme-media"
import { DownloadMemeButton } from "@/components/game/download-meme-button"
import { PlayerAvatar, compressImageToAvatarDataUrl, isImageAvatar } from "@/components/game/player-avatar"
import { toast } from "sonner"

const AVATAR_CHOICES = ["🎮", "🔥", "👑", "💀", "🚀", "🎲", "🎯", "⚡", "🌟", "🎪", "🦄", "🐉"]

interface ProfileModalProps {
  open: boolean
  initialTab?: "bangers" | "favorites" | "profile"
  onClose: () => void
  profile: UserProfile
  onUpdateIdentity: (pseudo: string, avatar: string) => Promise<void>
  onToggleFavoriteMeme: (url: string) => Promise<boolean>
  onRemoveBanger: (id: string) => Promise<void>
  onSignOut: () => Promise<void>
}

export function ProfileModal({
  open,
  initialTab = "bangers",
  onClose,
  profile,
  onUpdateIdentity,
  onToggleFavoriteMeme,
  onRemoveBanger,
  onSignOut,
}: ProfileModalProps) {
  const [tab, setTab] = useState<"bangers" | "favorites" | "profile">(initialTab)
  const [pseudo, setPseudo] = useState(profile.pseudo)
  const [avatar, setAvatar] = useState(profile.avatar)
  const [savingProfile, setSavingProfile] = useState(false)
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

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    try {
      await onUpdateIdentity(pseudo, avatar)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl h-[86vh] max-h-[760px] rounded-2xl border-2 border-border bg-card shadow-[6px_6px_0px_oklch(0.75_0.25_300_/_0.4)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b-2 border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center text-2xl overflow-hidden">
              <PlayerAvatar avatar={profile.avatar} imgClassName="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black leading-tight">{profile.pseudo}</h2>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-2 px-4 sm:px-6 py-3 border-b border-border/60 bg-card shrink-0">
          <button
            type="button"
            onClick={() => setTab("bangers")}
            className={`py-2 px-3 rounded-xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
              tab === "bangers"
                ? "border-amber-500 bg-amber-500/15 text-amber-400"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Bangers ({profile.savedBangers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("favorites")}
            className={`py-2 px-3 rounded-xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
              tab === "favorites"
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Favoris ({profile.favoriteMemes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("profile")}
            className={`py-2 px-3 rounded-xl border-2 text-xs sm:text-sm font-black flex items-center justify-center gap-1.5 transition-all ${
              tab === "profile"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>Profil & Stats</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {tab === "bangers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black flex items-center gap-2 text-amber-400">
                    <Flame className="w-4 h-4" />
                    Hall of Fame — Mes Bangers
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Les mèmes les plus drôles sauvegardés avec la légende et leur auteur. Télécharge-les avec le style FarWane !
                  </p>
                </div>
              </div>

              {profile.savedBangers.length === 0 ? (
                <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl p-6">
                  <Flame className="w-10 h-10 mx-auto text-amber-400/40 mb-2" />
                  <p className="text-sm font-bold">Aucun Banger sauvegardé pour l&apos;instant</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pendant une partie (vote ou résultats), clique sur <strong>Banger</strong> pour conserver un mème légendaire avec sa blague !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.savedBangers.map((banger) => (
                    <div
                      key={banger.id}
                      className="rounded-2xl border-2 border-border bg-muted/15 overflow-hidden flex flex-col justify-between shadow-[4px_4px_0px_var(--border)]"
                    >
                      <div>
                        <div className="flex items-center justify-between px-3.5 py-2 border-b border-border/60 bg-card/60">
                          <span className="text-xs font-black text-amber-400">
                            Par {banger.playerPseudo}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(banger.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        {banger.niche && (
                          <div className="px-3.5 py-1.5 bg-primary/10 border-b border-primary/20 text-xs font-bold text-primary">
                            Thème : {banger.niche}
                          </div>
                        )}

                        <div className="aspect-video bg-black/90 flex items-center justify-center overflow-hidden">
                          <MemeMedia
                            src={banger.imageUrl}
                            alt={banger.caption}
                            className="w-full h-full object-contain"
                            forceMuted
                          />
                        </div>

                        <div className="p-3.5">
                          <p className="text-sm sm:text-base font-black text-center break-words">
                            &ldquo;{banger.caption}&rdquo;
                          </p>
                        </div>
                      </div>

                      <div className="px-3.5 py-2.5 border-t border-border/60 bg-card/60 flex items-center justify-between gap-2">
                        <DownloadMemeButton
                          meme={{
                            imageUrl: banger.imageUrl,
                            caption: banger.caption,
                            playerPseudo: banger.playerPseudo,
                            niche: banger.niche,
                          }}
                          showLabel
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveBanger(banger.id)}
                          className="text-destructive hover:bg-destructive/15 h-8 px-2.5 text-xs font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Retirer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "favorites" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-black flex items-center gap-2 text-primary">
                  <Star className="w-4 h-4" />
                  Pack &ldquo;Mes Favoris&rdquo;
                </h3>
                <p className="text-xs text-muted-foreground">
                  Les templates (vidéos/images brutes) que tu as mis en favori. Dès que tu en as au moins un, le pack <strong>Mes Favoris</strong> apparaît automatiquement dans le lobby de tes parties.
                </p>
              </div>

              {profile.favoriteMemes.length === 0 ? (
                <div className="text-center py-14 border-2 border-dashed border-border rounded-2xl p-6">
                  <Star className="w-10 h-10 mx-auto text-primary/40 mb-2" />
                  <p className="text-sm font-bold">Aucun mème favori dans ton pack</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    En pleine partie, clique sur l&apos;étoile sur n&apos;importe quel mème pour l&apos;ajouter à ton pack favori.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {profile.favoriteMemes.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="group relative aspect-square rounded-xl border-2 border-border bg-black/80 overflow-hidden"
                    >
                      <MemeMedia
                        src={url}
                        alt={`Favori ${idx + 1}`}
                        className="w-full h-full object-cover"
                        forceMuted
                      />
                      <button
                        type="button"
                        onClick={() => onToggleFavoriteMeme(url)}
                        title="Retirer des favoris"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 text-destructive hover:bg-destructive hover:text-white transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2.5">
                  Mes Statistiques
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl border-2 border-border bg-muted/20">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                      <Gamepad2 className="w-3.5 h-3.5 text-primary" />
                      Parties
                    </div>
                    <div className="text-2xl font-black">{profile.stats.gamesPlayed}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-border bg-muted/20">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Victoires
                    </div>
                    <div className="text-2xl font-black text-amber-400">{profile.stats.wins}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-border bg-muted/20">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      Points totaux
                    </div>
                    <div className="text-2xl font-black text-emerald-400">{profile.stats.totalPoints}</div>
                  </div>
                  <div className="p-3.5 rounded-xl border-2 border-border bg-muted/20">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      Coups de cœur
                    </div>
                    <div className="text-2xl font-black text-rose-500">{profile.stats.heartsReceived}</div>
                  </div>
                </div>
              </div>

              {/* Edit Identity */}
              <form onSubmit={handleSaveIdentity} className="space-y-4 p-4 rounded-2xl border-2 border-border bg-muted/10">
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Identité en jeu
                </h3>

                <div>
                  <label className="text-xs font-bold block mb-1.5">Pseudo</label>
                  <Input
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                    maxLength={15}
                    className="h-11 font-bold border-2 border-border max-w-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold">Avatar</label>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Importer une image
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
                    <div className="flex items-center gap-3 mb-2.5 p-2 rounded-xl border-2 border-primary bg-primary/10 max-w-sm">
                      <PlayerAvatar avatar={avatar} imgClassName="w-10 h-10 rounded-full object-cover" />
                      <span className="text-xs font-bold text-primary">Image personnalisée active</span>
                    </div>
                  )}

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                    {AVATAR_CHOICES.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setAvatar(em)}
                        className={`h-10 rounded-xl border-2 text-lg flex items-center justify-center transition-all ${
                          avatar === em
                            ? "border-primary bg-primary/20 scale-105"
                            : "border-border bg-card hover:bg-muted"
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button type="submit" disabled={savingProfile} className="font-black text-xs">
                    <Check className="w-4 h-4 mr-1.5" />
                    Enregistrer mon profil
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await onSignOut()
                      onClose()
                    }}
                    className="text-destructive border-destructive/40 hover:bg-destructive/15 font-bold text-xs"
                  >
                    <LogOut className="w-4 h-4 mr-1.5" />
                    Se déconnecter
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
