"use client"

import { useState } from "react"
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
  Palette
} from "lucide-react"
import type { MemeLibrary } from "@/types/game"

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
}: HomeViewProps) {
  const [joinCode, setJoinCode] = useState("")
  const [pseudo, setPseudo] = useState("")
  const [hostPseudo, setHostPseudo] = useState("")
  const [showLibrary, setShowLibrary] = useState(false)
  const [newLibraryName, setNewLibraryName] = useState("")
  const [expandedLibrary, setExpandedLibrary] = useState<string | null>(null)
  const [newMemeUrl, setNewMemeUrl] = useState("")

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (joinCode.length === 4 && pseudo.trim()) {
      onJoinGame(joinCode.toUpperCase(), pseudo.trim())
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
    <div className="h-full w-full flex flex-col items-center overflow-hidden">
      {/* Scrollable inner zone */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center px-4 py-4 sm:py-6">

        {/* Logo */}
        <div className="text-center mb-5 sm:mb-7 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative inline-flex items-center justify-center gap-3">
            <img src="/farwaneLogo.png" alt="FarWane" className="w-14 h-14 sm:w-20 sm:h-20 object-contain drop-shadow-xl" />
            <div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none">
                <span className="shimmer-text">FarWane</span>
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium tracking-wide uppercase">
                Créez · Votez · Dominez
              </p>
            </div>
            <Sparkles className="absolute -top-3 -right-2 w-6 h-6 text-secondary animate-bounce" />
            <Zap className="absolute -bottom-1 -left-2 w-4 h-4 text-accent animate-pulse" />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-lg mb-3 animate-in fade-in duration-300 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-destructive bg-destructive/10 shadow-[3px_3px_0px_oklch(0.45_0.25_25_/_0.5)] text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="flex-1 text-sm font-bold">{error}</p>
              <button onClick={onDismissError} className="shrink-0 hover:opacity-70 transition-opacity">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content wrapper */}
        <div className="w-full max-w-lg flex flex-col gap-4 mb-4">

          {/* Main actions — stacked */}
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">

            {/* Create game form */}
            <Card className="border-2 border-primary/60 shadow-[5px_5px_0px_oklch(0.75_0.25_300_/_0.5)] hover:shadow-[7px_7px_0px_oklch(0.75_0.25_300_/_0.6)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200">
              <CardContent className="p-5">
                <form onSubmit={handleCreate} className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 text-primary">
                    <Sparkles className="h-4 w-4" />
                    Créer une partie
                  </h2>
                  <Input
                    type="text"
                    placeholder="Ton pseudo"
                    value={hostPseudo}
                    onChange={(e) => { setHostPseudo(e.target.value.slice(0, 15)); onDismissError() }}
                    className="h-12 sm:h-13 text-center text-lg font-bold border-2 border-border focus-visible:border-primary"
                    maxLength={15}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!hostPseudo.trim() || isLoading}
                    className="w-full h-12 sm:h-13 text-base font-black uppercase tracking-wide"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Créer une partie
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                    <Package className="h-3 w-3" />
                    <span className="font-medium">Packs inclus, prêt à jouer !</span>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Separator */}
            <div className="relative my-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-border/60" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground font-black uppercase tracking-widest text-xs">ou</span>
              </div>
            </div>

            {/* Join game form */}
            <Card className="border-2 border-accent/50 shadow-[5px_5px_0px_oklch(0.8_0.22_145_/_0.4)] hover:shadow-[7px_7px_0px_oklch(0.8_0.22_145_/_0.5)] hover:-translate-x-[1px] hover:-translate-y-[1px] transition-all duration-200">
              <CardContent className="p-5">
                <form onSubmit={handleJoin} className="space-y-3">
                  <h2 className="text-sm font-black uppercase tracking-widest text-center flex items-center justify-center gap-2 text-accent">
                    <Users className="h-4 w-4" />
                    Rejoindre une partie
                  </h2>
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="CODE"
                      value={joinCode}
                      onChange={(e) => { setJoinCode(e.target.value.toUpperCase().slice(0, 4)); onDismissError() }}
                      className="h-14 sm:h-16 text-center text-3xl font-black tracking-[0.6em] uppercase border-2 border-border focus-visible:border-primary"
                      maxLength={4}
                    />
                    <Input
                      type="text"
                      placeholder="Ton pseudo"
                      value={pseudo}
                      onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                      className="h-12 sm:h-13 text-center text-lg font-bold border-2 border-border focus-visible:border-primary"
                      maxLength={15}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    variant="accent"
                    disabled={joinCode.length !== 4 || !pseudo.trim() || isLoading}
                    className="w-full h-12 sm:h-13 text-base font-black uppercase tracking-wide"
                  >
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                    Rejoindre
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Collections perso */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
            <button
              onClick={() => setShowLibrary(!showLibrary)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 border-border/50 bg-muted/20 hover:bg-muted/40 hover:border-border transition-all duration-200 text-sm text-muted-foreground group shadow-[2px_2px_0px_var(--border)] hover:shadow-[3px_3px_0px_var(--border)] hover:-translate-x-[1px] hover:-translate-y-[1px]"
            >
              <span className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-secondary/70 group-hover:text-secondary transition-colors" />
                <span className="font-bold">Collections perso</span>
                {libraries.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded border-2 border-secondary/40 bg-secondary/15 text-secondary text-[10px] font-black">
                    {libraries.length}
                  </span>
                )}
              </span>
              {showLibrary ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
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
    </div>
  )
}
