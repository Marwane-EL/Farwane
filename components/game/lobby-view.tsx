"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Copy, Check, Play, LogOut, Crown, Loader2, Package, ChevronDown, Settings, Timer, Hash, Users
} from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { Player, MemeLibrary, MemePack, GameSettings } from "@/types/game"

interface LobbyViewProps {
  roomCode: string
  players: Player[]
  currentPlayer: Player | null
  memePacks: MemePack[]
  userLibraries: MemeLibrary[]
  selectedPack: MemePack | null
  settings: GameSettings
  onSelectPack: (pack: MemePack) => void
  onUpdateSettings: (settings: GameSettings) => void
  onStartGame: () => void
  onLeave: () => void
}

export function LobbyView({
  roomCode, players, currentPlayer, memePacks,
  userLibraries, selectedPack, settings,
  onSelectPack, onUpdateSettings, onStartGame, onLeave,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isHost = currentPlayer?.isHost
  const canStart = selectedPack && selectedPack.memes.length >= 3 && players.length >= 2

  const timerOptions = [30, 60, 90, 120]
  const roundOptions = [3, 5, 7, 10]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Room code */}
      <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <p className="text-muted-foreground text-sm mb-2">Code de la partie</p>
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-5xl md:text-7xl font-black tracking-[0.3em] bg-gradient-to-r from-secondary via-primary to-accent bg-clip-text text-transparent">
            {roomCode}
          </h1>
          <Button variant="ghost" size="icon" onClick={copyCode} className="h-12 w-12 rounded-full hover:bg-muted transition-colors">
            {copied ? <Check className="h-6 w-6 text-accent" /> : <Copy className="h-6 w-6 text-muted-foreground" />}
          </Button>
        </div>
        <p className="text-muted-foreground text-sm mt-2">Partage ce code avec tes potes !</p>
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="w-full max-w-md space-y-4 mb-6 animate-in fade-in slide-in-from-top-6 duration-500">
          {/* Pack Selection */}
          <Card className="border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold flex-1">Pack de Memes :</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[180px] justify-between border-2 border-border hover:border-primary">
                      <span className="truncate">{selectedPack ? selectedPack.name : "Choisir un pack..."}</span>
                      <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[220px]">
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Packs officiels</DropdownMenuLabel>
                    {memePacks.map((pack) => (
                      <DropdownMenuItem key={pack.id} onClick={() => onSelectPack(pack)} className="cursor-pointer">
                        <div className="flex items-center justify-between w-full">
                          <span>{pack.name}</span>
                          <span className="text-xs text-muted-foreground">{pack.memes.length} memes</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {userLibraries.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs text-muted-foreground">Mes Bibliothèques</DropdownMenuLabel>
                        {userLibraries.map((library) => (
                          <DropdownMenuItem
                            key={library.id}
                            onClick={() => onSelectPack({ id: library.id, name: library.name, memes: library.memes, isDefault: false })}
                            className="cursor-pointer"
                            disabled={library.memes.length < 3}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{library.name}</span>
                              <span className={`text-xs ${library.memes.length < 3 ? "text-destructive" : "text-muted-foreground"}`}>
                                {library.memes.length} memes
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {!selectedPack && <p className="text-xs text-destructive mt-2 text-center">Choisis un pack de memes pour lancer la partie</p>}
            </CardContent>
          </Card>

          {/* Game Settings */}
          <Card className="border-2 border-secondary/50 bg-gradient-to-r from-secondary/10 to-primary/10">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="h-5 w-5 text-secondary" />
                <span className="font-semibold">Paramètres</span>
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span>Timer de création</span>
                </div>
                <div className="flex gap-2">
                  {timerOptions.map((t) => (
                    <Button
                      key={t}
                      size="sm"
                      variant={settings.timerDuration === t ? "default" : "outline"}
                      onClick={() => onUpdateSettings({ ...settings, timerDuration: t })}
                      className={`flex-1 h-9 font-bold transition-all ${
                        settings.timerDuration === t
                          ? "bg-secondary text-secondary-foreground shadow-md"
                          : "hover:border-secondary"
                      }`}
                    >
                      {t}s
                    </Button>
                  ))}
                </div>
              </div>

              {/* Rounds */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Hash className="h-4 w-4" />
                  <span>Nombre de manches</span>
                </div>
                <div className="flex gap-2">
                  {roundOptions.map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={settings.totalRounds === r ? "default" : "outline"}
                      onClick={() => onUpdateSettings({ ...settings, totalRounds: r })}
                      className={`flex-1 h-9 font-bold transition-all ${
                        settings.totalRounds === r
                          ? "bg-secondary text-secondary-foreground shadow-md"
                          : "hover:border-secondary"
                      }`}
                    >
                      {r}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Non-host: show settings + pack info */}
      {!isHost && (
        <Card className="w-full max-w-md mb-6 border-2 border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in duration-300">
          <CardContent className="p-4 space-y-2">
            {selectedPack && (
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Pack :</span>
                <span className="font-semibold text-sm">{selectedPack.name}</span>
              </div>
            )}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Timer className="h-4 w-4" /> {settings.timerDuration}s</span>
              <span className="flex items-center gap-1"><Hash className="h-4 w-4" /> {settings.totalRounds} manches</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players grid */}
      <Card className="w-full max-w-2xl border-2 border-border/50 bg-card/50 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-center mb-4 text-muted-foreground">
            <Users className="inline h-5 w-5 mr-2" />
            Joueurs ({players.length}/{settings.maxPlayers})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map((player, index) => (
              <div key={player.id} className="animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="relative flex flex-col items-center p-4 rounded-xl bg-muted/30 border-2 border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
                  {player.isHost && <Crown className="absolute -top-2 -right-2 h-5 w-5 text-secondary animate-bounce" />}
                  <div className="text-4xl mb-2">{player.avatar}</div>
                  <p className="font-semibold text-sm truncate max-w-full">{player.pseudo}</p>
                  {player.id === currentPlayer?.id && <span className="text-xs text-primary mt-1">(toi)</span>}
                </div>
              </div>
            ))}
            {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed border-border/30 opacity-50">
                <div className="text-4xl mb-2">?</div>
                <p className="text-sm text-muted-foreground">En attente...</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-500 delay-200">
        {isHost ? (
          <Button
            onClick={onStartGame} size="lg" disabled={!canStart}
            className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Play className="mr-2 h-6 w-6" />
            Lancer la partie
          </Button>
        ) : (
          <div className="flex items-center gap-3 px-8 py-4 rounded-full bg-muted/50 border-2 border-border/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-lg text-muted-foreground">En attente du chef de salon...</span>
          </div>
        )}
        <Button onClick={onLeave} variant="outline" size="lg"
          className="h-16 px-8 text-lg font-semibold border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all duration-300"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Quitter
        </Button>
      </div>
    </div>
  )
}
