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
      <div className="text-center mb-4 sm:mb-6 shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative inline-flex items-center justify-center gap-3">
          <img src="/farwaneLogo.png" alt="FarWane" className="w-16 h-16 sm:w-24 sm:h-24 object-contain drop-shadow-xl" />
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter">
            <span className="shimmer-text">
              FarWane
            </span>
          </h1>
          <Sparkles className="absolute -top-3 -right-5 w-7 h-7 text-secondary animate-bounce" />
          <Zap className="absolute -bottom-1 -left-3 w-5 h-5 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground text-sm sm:text-base mt-2">
          Créez des memes. Votez. Dominez.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="w-full max-w-2xl mb-3 animate-in fade-in duration-300 shrink-0">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{error}</p>
            <button onClick={onDismissError} className="shrink-0 hover:opacity-70">
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
          <Card className="border-2 border-primary/30 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors duration-300">
            <CardContent className="p-6">
              <form onSubmit={handleCreate} className="space-y-4">
                <h2 className="text-base font-bold text-center flex items-center justify-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Créer une partie
                </h2>
                <Input
                  type="text"
                  placeholder="Ton pseudo"
                  value={hostPseudo}
                  onChange={(e) => { setHostPseudo(e.target.value.slice(0, 15)); onDismissError() }}
                  className="h-12 sm:h-14 text-center text-lg bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                  maxLength={15}
                />
                <Button
                  type="submit"
                  size="lg"
                  disabled={!hostPseudo.trim() || isLoading}
                  className="w-full h-12 sm:h-14 text-lg font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Créer une partie
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <Package className="h-3 w-3" />
                  <span>Packs inclus, prêt à jouer !</span>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Separator */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground font-medium">ou</span>
            </div>
          </div>

          {/* Join game form */}
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:border-accent/40 transition-colors duration-300">
            <CardContent className="p-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <h2 className="text-base font-bold text-center flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-accent" />
                  Rejoindre une partie
                </h2>
                <div className="space-y-4">
                  <Input
                    type="text"
                    placeholder="Code (4 lettres)"
                    value={joinCode}
                    onChange={(e) => { setJoinCode(e.target.value.toUpperCase().slice(0, 4)); onDismissError() }}
                    className="h-12 sm:h-14 text-center text-2xl font-bold tracking-[0.5em] uppercase bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                    maxLength={4}
                  />
                  <Input
                    type="text"
                    placeholder="Ton pseudo"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                    className="h-12 sm:h-14 text-center text-lg bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                    maxLength={15}
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  disabled={joinCode.length !== 4 || !pseudo.trim() || isLoading}
                  className="w-full h-12 sm:h-14 text-lg font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02]"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                  Rejoindre
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Collections perso — compact pill */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
          <button
            onClick={() => setShowLibrary(!showLibrary)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-all duration-200 text-sm text-muted-foreground group"
          >
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-secondary/70 group-hover:text-secondary transition-colors" />
              <span className="font-medium">Collections perso</span>
              {libraries.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-secondary/20 text-secondary text-[10px] font-bold">
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
            <div className="mt-2 border border-border/30 rounded-xl bg-card/30 backdrop-blur-sm overflow-hidden">
              <div className="p-3 border-b border-border/20">
                <p className="text-xs text-muted-foreground text-center">En plus des packs inclus, crée tes propres collections</p>
              </div>

              {/* Create new library */}
              <div className="p-3 space-y-3">
                <form onSubmit={handleCreateLibrary} className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Nom de la collection..."
                    value={newLibraryName}
                    onChange={(e) => setNewLibraryName(e.target.value.slice(0, 30))}
                    className="flex-1 h-9 text-sm bg-muted/50 border border-border focus:border-primary transition-colors"
                    maxLength={30}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newLibraryName.trim()}
                    className="h-9 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                </form>

                {/* Libraries list */}
                <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                  {libraries.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-1.5 opacity-40" />
                      <p className="text-xs">Aucune collection perso</p>
                    </div>
                  ) : (
                    libraries.map((library) => (
                      <div key={library.id} className="border border-border/50 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between px-3 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => setExpandedLibrary(expandedLibrary === library.id ? null : library.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{library.name}</span>
                            <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded-full">
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
                          <div className="p-2 border-t border-border/30 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                type="url"
                                placeholder="Colle un lien Giphy/Tenor..."
                                value={newMemeUrl}
                                onChange={(e) => setNewMemeUrl(e.target.value)}
                                className="flex-1 h-8 text-xs bg-muted/50 border border-border focus:border-primary transition-colors"
                              />
                              <Button size="sm" onClick={() => handleAddMeme(library.id)} disabled={!newMemeUrl.trim()} className="h-8 px-2">
                                <Plus className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            {library.memes.length > 0 ? (
                              <div className="grid grid-cols-4 gap-1.5">
                                {library.memes.map((meme, index) => (
                                  <div key={index} className="relative group aspect-square rounded-md overflow-hidden bg-muted/50">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={meme} alt={`Meme ${index + 1}`} className="w-full h-full object-cover" />
                                    <button
                                      onClick={() => onRemoveMemeFromLibrary(library.id, index)}
                                      className="absolute top-0.5 right-0.5 p-0.5 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-2.5 w-2.5 text-white" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[10px] text-center text-muted-foreground py-1">Ajoute des memes à cette collection</p>
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
