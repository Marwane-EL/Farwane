"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sparkles,
  Users,
  Zap,
  Plus,
  Trash2,
  FolderPlus,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  Loader2,
  Package,
  Palette,
  Flame,
  Star,
  User as UserIcon,
} from "lucide-react"
import type { MemeLibrary, NicheItem, UserProfile } from "@/types/game"
import { NicheLibraryPanel } from "@/components/game/niche-library-panel"
import { FloatingMemesBg } from "@/components/game/floating-memes-bg"
import { PlayerAvatar } from "@/components/game/player-avatar"
import { useNicheLibrary } from "@/hooks/use-niche-library"

interface HomeViewProps {
  onCreateGame: (pseudo: string) => void
  onJoinGame: (code: string, pseudo: string) => void
  error: string | null
  isLoading: boolean
  onDismissError: () => void
  libraries: MemeLibrary[]
  onCreateLibrary: (name: string) => void
  onDeleteLibrary: (id: string) => void
  onAddMemeToLibrary: (libraryId: string, url: string) => void
  onRemoveMemeFromLibrary: (libraryId: string, memeIndex: number) => void
  memeUrls?: string[]
  profile?: UserProfile | null
  onOpenAuth?: () => void
  onOpenProfile?: (tab: "bangers" | "favorites" | "profile") => void
  externalNiches?: NicheItem[]
  onAddExternalNiche?: (text: string) => void
  onEditExternalNiche?: (id: string, text: string) => void
  onDeleteExternalNiche?: (id: string) => void
}

export function HomeView({
  onCreateGame,
  onJoinGame,
  error,
  isLoading,
  onDismissError,
  libraries,
  onCreateLibrary,
  onDeleteLibrary,
  onAddMemeToLibrary,
  onRemoveMemeFromLibrary,
  memeUrls = [],
  profile,
  onOpenAuth,
  onOpenProfile,
  externalNiches,
  onAddExternalNiche,
  onEditExternalNiche,
  onDeleteExternalNiche,
}: HomeViewProps) {
  const [joinCode, setJoinCode] = useState("")
  const [pseudo, setPseudo] = useState("")
  const [hostPseudo, setHostPseudo] = useState("")
  const [showLibrary, setShowLibrary] = useState(false)
  const [newLibraryName, setNewLibraryName] = useState("")
  const [expandedLibrary, setExpandedLibrary] = useState<string | null>(null)
  const [newMemeUrl, setNewMemeUrl] = useState("")

  // Pre-fill room code from URL query parameter & expand panels on desktop
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const roomParam = params.get("room")
      if (roomParam) {
        setJoinCode(roomParam.toUpperCase().slice(0, 4))
      }
      if (window.innerWidth >= 768) {
        setShowLibrary(true)
      }
    }
  }, [])

  const localNicheHook = useNicheLibrary()
  const niches = externalNiches ?? localNicheHook.niches
  const addNiche = onAddExternalNiche ?? localNicheHook.addNiche
  const editNiche = onEditExternalNiche ?? localNicheHook.editNiche
  const deleteNiche = onDeleteExternalNiche ?? localNicheHook.deleteNiche

  // Auto-fill pseudo from logged-in account
  useEffect(() => {
    if (profile?.pseudo) {
      setHostPseudo((prev) => prev || profile.pseudo)
      setPseudo((prev) => prev || profile.pseudo)
    }
  }, [profile?.pseudo])

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = joinCode.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
    if (clean.length === 4 && pseudo.trim()) {
      onJoinGame(clean, pseudo.trim())
    }
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (hostPseudo.trim()) {
      onCreateGame(hostPseudo.trim())
    }
  }

  const handleCreateLibrary = (e: React.FormEvent) => {
    e.preventDefault()
    if (newLibraryName.trim()) {
      onCreateLibrary(newLibraryName.trim())
      setNewLibraryName("")
    }
  }

  const handleAddMeme = (libraryId: string) => {
    if (newMemeUrl.trim()) {
      onAddMemeToLibrary(libraryId, newMemeUrl.trim())
      setNewMemeUrl("")
    }
  }

  return (
    <div className="h-full w-full flex flex-col items-center overflow-hidden relative">
      {/* Floating random memes/GIFs drifting across the background */}
      <FloatingMemesBg memeUrls={memeUrls} />

      {/* Scrollable inner zone on very small screens, top-aligned logo + centered wide cards on desktop */}
      <div className="relative z-10 flex-1 w-full overflow-y-auto flex flex-col items-center justify-start px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 pb-4">

        {/* Top Account Bar */}
        <div className="w-full max-w-7xl flex items-center justify-end gap-2 mb-2 shrink-0">
          {profile ? (
            <>
              <button
                type="button"
                onClick={() => onOpenProfile?.("bangers")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-amber-500/50 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 text-xs font-black transition-all"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Bangers ({profile.savedBangers.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenProfile?.("favorites")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-primary/50 bg-primary/15 hover:bg-primary/25 text-primary text-xs font-black transition-all"
              >
                <Star className="w-3.5 h-3.5" />
                <span>Favoris ({profile.favoriteMemes.length})</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenProfile?.("profile")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-border bg-card hover:bg-muted text-xs font-black transition-all shadow-[2px_2px_0px_var(--border)]"
              >
                <PlayerAvatar avatar={profile.avatar} className="text-base leading-none" imgClassName="w-5 h-5 rounded-full object-cover" />
                <span>{profile.pseudo}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border-2 border-primary/60 bg-primary/15 hover:bg-primary/25 text-primary text-xs sm:text-sm font-black transition-all shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.4)]"
            >
              <UserIcon className="w-4 h-4" />
              <span>Se connecter / Créer un compte</span>
            </button>
          )}
        </div>

        {/* Logo */}
        <div className="text-center mb-5 sm:mb-8 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative inline-flex items-center justify-center gap-3 sm:gap-4">
            <img src="/farwaneLogo.png" alt="FarWane" className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-xl" />
            <div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none">
                <span className="shimmer-text">FarWane</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium tracking-widest uppercase">
                Créez · Votez · Dominez
              </p>
            </div>
            <Sparkles className="absolute -top-2 -right-3 w-5 h-5 text-secondary animate-bounce" />
            <Zap className="absolute -bottom-1 -left-3 w-4 h-4 text-accent animate-pulse" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-7xl mb-4 animate-in fade-in duration-300 shrink-0">
            <div className="flex items-center gap-3 p-2.5 rounded-lg border-2 border-destructive bg-destructive/10 shadow-[3px_3px_0px_oklch(0.45_0.25_25_/_0.5)] text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm font-bold">{error}</p>
              <button onClick={onDismissError} className="shrink-0 hover:opacity-70 transition-opacity">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content wrapper: wide symmetric 2x2 grid on desktop, fills vertical space cleanly */}
        <div className="w-full max-w-7xl flex-1 min-h-0 flex flex-col gap-4 sm:gap-5 pb-2">

          {/* Row 1: Create + Join side-by-side (natural compact height, no awkward gap) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 shrink-0 items-stretch animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

            {/* Create game form */}
            <Card className="border-2 border-primary/60 shadow-[5px_5px_0px_oklch(0.75_0.25_300_/_0.5)] hover:shadow-[7px_7px_0px_oklch(0.75_0.25_300_/_0.6)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200 flex flex-col">
              <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                <form onSubmit={handleCreate} className="space-y-3.5">
                  <div className="space-y-3">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 text-primary">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      Créer une partie
                    </h2>
                    <p className="text-xs text-muted-foreground text-center hidden sm:block">
                      Lance une room privée et partage le code à 4 lettres avec tes potes
                    </p>
                    <Input
                      type="text"
                      placeholder="Ton pseudo"
                      value={hostPseudo}
                      onChange={(e) => { setHostPseudo(e.target.value.slice(0, 15)); onDismissError() }}
                      className="h-12 sm:h-14 text-center text-lg font-bold border-2 border-border focus-visible:border-primary"
                      maxLength={15}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      size="lg"
                      disabled={!hostPseudo.trim() || isLoading}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-black uppercase tracking-wide"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Créer une partie
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Package className="h-3.5 w-3.5" />
                      <span className="font-medium">Packs inclus, prêt à jouer !</span>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Join game form */}
            <Card className="border-2 border-accent/50 shadow-[5px_5px_0px_oklch(0.8_0.22_145_/_0.4)] hover:shadow-[7px_7px_0px_oklch(0.8_0.22_145_/_0.5)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200 flex flex-col">
              <CardContent className="p-5 sm:p-6 flex-1 flex flex-col justify-center">
                <form onSubmit={handleJoin} className="space-y-3.5">
                  <div className="space-y-3">
                    <h2 className="text-sm sm:text-base font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 text-accent">
                      <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                      Rejoindre une partie
                    </h2>
                    <p className="text-xs text-muted-foreground text-center hidden sm:block">
                      Entre le code de la room et ton pseudo pour entrer directement dans la partie
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        type="text"
                        placeholder="CODE"
                        value={joinCode}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4)
                          setJoinCode(clean)
                          onDismissError()
                        }}
                        className="h-12 sm:h-14 text-center text-2xl sm:text-3xl font-black tracking-[0.45em] uppercase border-2 border-border focus-visible:border-primary"
                        maxLength={4}
                      />
                      <Input
                        type="text"
                        placeholder="Ton pseudo"
                        value={pseudo}
                        onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                        className="h-12 sm:h-14 text-center text-lg font-bold border-2 border-border focus-visible:border-primary"
                        maxLength={15}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      type="submit"
                      size="lg"
                      variant="accent"
                      disabled={joinCode.length !== 4 || !pseudo.trim() || isLoading}
                      className="w-full h-12 sm:h-14 text-base sm:text-lg font-black uppercase tracking-wide"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                      Rejoindre
                    </Button>
                    {!isLoading && (joinCode.length !== 4 || !pseudo.trim()) && (
                      <p className="text-[11px] text-center text-muted-foreground font-medium animate-in fade-in">
                        {joinCode.length !== 4 && !pseudo.trim()
                          ? "Entre le code à 4 lettres et ton pseudo"
                          : joinCode.length !== 4
                          ? `Code incomplet (${joinCode.length}/4 lettres)`
                          : "Entre ton pseudo pour rejoindre"}
                      </p>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Mes Niches + Collections perso side-by-side (expands into remaining space) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start md:flex-1 md:min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">

            {/* Niche Library */}
            <NicheLibraryPanel
              niches={niches}
              onAdd={addNiche}
              onEdit={editNiche}
              onDelete={deleteNiche}
            />

            {/* Collections perso */}
            <div>
              <button
                onClick={() => setShowLibrary(!showLibrary)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card hover:bg-muted/30 transition-all duration-200 text-sm group shadow-[3px_3px_0px_var(--border)]"
              >
                <span className="flex items-center gap-2 font-black uppercase tracking-wide">
                  <Palette className="h-4 w-4 text-secondary/80 group-hover:text-secondary transition-colors" />
                  <span>Collections perso</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                    {libraries.length}
                  </span>
                </span>
                {showLibrary ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

            {showLibrary && (
              <div className="mt-2 border-2 border-border/50 rounded-lg bg-card shadow-[3px_3px_0px_var(--border)] overflow-hidden">
                <div className="p-3 border-b-2 border-border/30">
                  <p className="text-xs text-muted-foreground text-center font-medium">En plus des packs inclus, crée tes propres collections</p>
                </div>

                {/* Create new library */}
                <div className="p-3 space-y-3">
                  <form onSubmit={handleCreateLibrary} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Nom de la collection..."
                      value={newLibraryName}
                      onChange={(e) => setNewLibraryName(e.target.value.slice(0, 30))}
                      className="flex-1 h-9 text-sm"
                      maxLength={30}
                    />
                    <Button
                      type="submit"
                      size="sm"
                      variant="secondary"
                      disabled={!newLibraryName.trim()}
                      className="h-9 px-3"
                    >
                      <FolderPlus className="h-4 w-4" />
                    </Button>
                  </form>

                  {/* Libraries list */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {libraries.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
                        <p className="text-xs font-medium">Aucune collection perso</p>
                      </div>
                    ) : (
                      libraries.map((library) => (
                        <div key={library.id} className="border-2 border-border/60 rounded-lg overflow-hidden shadow-[2px_2px_0px_var(--border)]">
                          <div
                            className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedLibrary(expandedLibrary === library.id ? null : library.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{library.name}</span>
                              <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted border border-border rounded font-medium">
                                {library.memes.length} memes
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                                onClick={(e) => { e.stopPropagation(); onDeleteLibrary(library.id) }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                              {expandedLibrary === library.id
                                ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              }
                            </div>
                          </div>

                          {expandedLibrary === library.id && (
                            <div className="p-2 border-t-2 border-border/30 space-y-2">
                              <div className="flex gap-2">
                                <Input
                                  type="url"
                                  placeholder="Colle un lien Giphy/Tenor..."
                                  value={newMemeUrl}
                                  onChange={(e) => setNewMemeUrl(e.target.value)}
                                  className="flex-1 h-8 text-xs"
                                />
                                <Button size="sm" onClick={() => handleAddMeme(library.id)} disabled={!newMemeUrl.trim()} className="h-8 px-2">
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                              {library.memes.length > 0 ? (
                                <div className="grid grid-cols-4 gap-1.5">
                                  {library.memes.map((meme, index) => (
                                    <div key={index} className="relative group aspect-square rounded-md overflow-hidden bg-muted/50 border-2 border-border/40">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={meme} alt={`Meme ${index + 1}`} className="w-full h-full object-cover" />
                                      <button
                                        onClick={() => onRemoveMemeFromLibrary(library.id, index)}
                                        className="absolute top-0.5 right-0.5 p-0.5 bg-destructive rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X className="h-2.5 w-2.5 text-white" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-[10px] text-center text-muted-foreground py-1 font-medium">Ajoute des memes à cette collection</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>

          </div>

        </div>

        {/* Discreet legal footer links (required for Steam / Store) */}
        <footer className="w-full max-w-7xl pt-2 flex items-center justify-center gap-4 text-[11px] text-muted-foreground/70 shrink-0">
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Confidentialité
          </Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Conditions d&apos;utilisation
          </Link>
        </footer>

      </div>
    </div>
  )
}
