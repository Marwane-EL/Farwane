"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Sparkles, 
  Users, 
  Zap, 
  Library, 
  Plus, 
  Trash2, 
  FolderPlus,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react"
import type { MemeLibrary } from "@/app/page"

interface HomeViewProps {
  onCreateGame: () => void
  onJoinGame: (code: string, pseudo: string) => void
  libraries: MemeLibrary[]
  onCreateLibrary: (name: string) => void
  onDeleteLibrary: (id: string) => void
  onAddMemeToLibrary: (libraryId: string, url: string) => void
  onRemoveMemeFromLibrary: (libraryId: string, memeIndex: number) => void
}

export function HomeView({ 
  onCreateGame, 
  onJoinGame,
  libraries,
  onCreateLibrary,
  onDeleteLibrary,
  onAddMemeToLibrary,
  onRemoveMemeFromLibrary,
}: HomeViewProps) {
  const [joinCode, setJoinCode] = useState("")
  const [pseudo, setPseudo] = useState("")
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
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      {/* Logo */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative inline-block">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              MEME
            </span>
            <span className="text-foreground">CLASH</span>
          </h1>
          <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-secondary animate-bounce" />
          <Zap className="absolute -bottom-2 -left-4 w-6 h-6 text-accent animate-pulse" />
        </div>
        <p className="text-muted-foreground text-lg mt-4">
          Creez des memes. Votez. Dominez.
        </p>
      </div>

      {/* Main content */}
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
        {/* Left column - Game actions */}
        <div className="space-y-6">
          {/* Create game button */}
          <Button
            onClick={onCreateGame}
            size="lg"
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/40"
          >
            <Sparkles className="mr-2 h-6 w-6" />
            Creer une partie
          </Button>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">ou</span>
            </div>
          </div>

          {/* Join game form */}
          <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <form onSubmit={handleJoin} className="space-y-4">
                <h2 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                  <Users className="h-5 w-5 text-accent" />
                  Rejoindre une partie
                </h2>
                
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Code du salon (4 lettres)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 4))}
                    className="h-12 text-center text-2xl font-bold tracking-[0.5em] uppercase bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                    maxLength={4}
                  />
                  <Input
                    type="text"
                    placeholder="Ton pseudo"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value.slice(0, 15))}
                    className="h-12 text-center text-lg bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                    maxLength={15}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={joinCode.length !== 4 || !pseudo.trim()}
                  className="w-full h-14 text-lg font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-[1.02]"
                >
                  Rejoindre
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Library */}
        <Card className="border-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle 
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowLibrary(!showLibrary)}
            >
              <span className="flex items-center gap-2">
                <Library className="h-5 w-5 text-secondary" />
                Ma Bibliotheque
              </span>
              {showLibrary ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Cree tes collections de memes pour les utiliser en partie
            </p>
          </CardHeader>
          
          {showLibrary && (
            <CardContent className="space-y-4">
              {/* Create new library */}
              <form onSubmit={handleCreateLibrary} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Nom de la collection..."
                  value={newLibraryName}
                  onChange={(e) => setNewLibraryName(e.target.value.slice(0, 30))}
                  className="flex-1 h-10 bg-muted/50 border-2 border-border focus:border-primary transition-colors"
                  maxLength={30}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newLibraryName.trim()}
                  className="h-10 px-4 bg-secondary text-secondary-foreground hover:bg-secondary/80"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </form>

              {/* Libraries list */}
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {libraries.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucune collection pour le moment</p>
                    <p className="text-xs">Cree ta premiere collection ci-dessus !</p>
                  </div>
                ) : (
                  libraries.map((library) => (
                    <div 
                      key={library.id} 
                      className="border-2 border-border/50 rounded-lg overflow-hidden"
                    >
                      <div 
                        className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setExpandedLibrary(expandedLibrary === library.id ? null : library.id)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{library.name}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded-full">
                            {library.memes.length} memes
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteLibrary(library.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedLibrary === library.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      
                      {expandedLibrary === library.id && (
                        <div className="p-3 border-t border-border/50 space-y-3">
                          {/* Add meme input */}
                          <div className="flex gap-2">
                            <Input
                              type="url"
                              placeholder="Colle un lien Giphy/Tenor..."
                              value={newMemeUrl}
                              onChange={(e) => setNewMemeUrl(e.target.value)}
                              className="flex-1 h-9 text-sm bg-muted/50 border border-border focus:border-primary transition-colors"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleAddMeme(library.id)}
                              disabled={!newMemeUrl.trim()}
                              className="h-9 px-3"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Memes grid */}
                          {library.memes.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2">
                              {library.memes.map((meme, index) => (
                                <div 
                                  key={index} 
                                  className="relative group aspect-square rounded-md overflow-hidden bg-muted/50"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={meme}
                                    alt={`Meme ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <button
                                    onClick={() => onRemoveMemeFromLibrary(library.id, index)}
                                    className="absolute top-1 right-1 p-1 bg-destructive/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-center text-muted-foreground py-2">
                              Ajoute des memes a cette collection
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground animate-in fade-in duration-1000 delay-500">
        Pret a faire rire tes potes ?
      </p>
    </div>
  )
}
