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
    <div className="h-full w-full flex flex-col overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col items-center px-4 py-4 sm:py-6 min-h-fit">

        {/* Room code — neo-brut badge */}
        <div className="text-center mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4 duration-500 shrink-0">
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-2">Code de la partie</p>
          <div className="inline-flex items-center justify-center gap-3 px-6 py-4 rounded-lg border-2 border-secondary/70 bg-card shadow-[6px_6px_0px_oklch(0.85_0.2_90_/_0.5)]">
            <h1 className="text-4xl sm:text-6xl font-black tracking-[0.4em] text-secondary">
              {roomCode}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={copyCode}
              className="h-10 w-10 sm:h-12 sm:w-12 shrink-0"
            >
              {copied ? <Check className="h-5 w-5 text-accent" /> : <Copy className="h-5 w-5 text-muted-foreground" />}
            </Button>
          </div>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Partage ce code avec tes potes !</p>
        </div>

        {/* Host controls */}
        {isHost && (
          <div className="w-full max-w-md space-y-3 mb-5 animate-in fade-in slide-in-from-top-6 duration-500">
            {/* Pack Selection */}
            <Card className="border-2 border-primary/60 shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.5)]">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <Package className="h-5 w-5 text-primary shrink-0" />
                  <span className="font-black flex-1 min-w-[80px] uppercase text-sm tracking-wide">Pack de Memes :</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="min-w-[160px] sm:min-w-[180px] justify-between h-9 sm:h-10 text-sm">
                        <span className="truncate">{selectedPack ? selectedPack.name : "Choisir un pack..."}</span>
                        <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[220px] border-2 border-border shadow-[4px_4px_0px_var(--border)]">
                      <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Packs officiels</DropdownMenuLabel>
                      {memePacks.map((pack) => (
                        <DropdownMenuItem key={pack.id} onClick={() => onSelectPack(pack)} className="cursor-pointer font-medium">
                          <div className="flex items-center justify-between w-full">
                            <span>{pack.name}</span>
                            <span className="text-xs text-muted-foreground">{pack.memes.length} memes</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {userLibraries.length > 0 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Mes Bibliothèques</DropdownMenuLabel>
                          {userLibraries.map((library) => (
                            <DropdownMenuItem
                              key={library.id}
                              onClick={() => onSelectPack({ id: library.id, name: library.name, memes: library.memes, isDefault: false })}
                              className="cursor-pointer font-medium"
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
                {!selectedPack && <p className="text-xs text-destructive mt-2 text-center font-bold">Choisis un pack de memes pour lancer la partie</p>}
              </CardContent>
            </Card>

            {/* Game Settings */}
            <Card className="border-2 border-secondary/50 shadow-[4px_4px_0px_oklch(0.85_0.2_90_/_0.4)]">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="h-4 w-4 text-secondary" />
                  <span className="font-black uppercase text-sm tracking-wide">Paramètres</span>
                </div>

                {/* Timer */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wide">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Timer de création</span>
                  </div>
                  <div className="flex gap-2">
                    {timerOptions.map((t) => (
                      <Button
                        key={t}
                        size="sm"
                        variant={settings.timerDuration === t ? "secondary" : "outline"}
                        onClick={() => onUpdateSettings({ ...settings, timerDuration: t })}
                        className="flex-1 h-9 font-black text-xs sm:text-sm"
                      >
                        {t}s
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Rounds */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold uppercase tracking-wide">
                    <Hash className="h-3.5 w-3.5" />
                    <span>Nombre de manches</span>
                  </div>
                  <div className="flex gap-2">
                    {roundOptions.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={settings.totalRounds === r ? "secondary" : "outline"}
                        onClick={() => onUpdateSettings({ ...settings, totalRounds: r })}
                        className="flex-1 h-9 font-black text-xs sm:text-sm"
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

        {/* Non-host: settings info */}
        {!isHost && (
          <Card className="w-full max-w-md mb-5 border-2 border-border shadow-[3px_3px_0px_var(--border)] animate-in fade-in duration-300">
            <CardContent className="p-3 sm:p-4 space-y-2">
              {selectedPack && (
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground font-medium">Pack :</span>
                  <span className="font-bold text-sm">{selectedPack.name}</span>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground font-medium">
                <span className="flex items-center gap-1"><Timer className="h-4 w-4" /> {settings.timerDuration}s</span>
                <span className="flex items-center gap-1"><Hash className="h-4 w-4" /> {settings.totalRounds} manches</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players grid */}
        <Card className="w-full max-w-2xl border-2 border-border mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100 py-0 gap-0">
          <CardContent className="p-3 sm:p-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-center mb-3 text-muted-foreground flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              Joueurs ({players.length}/{settings.maxPlayers})
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {players.map((player, index) => (
                <div key={player.id} className="animate-in fade-in zoom-in-95 duration-300" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                    player.id === currentPlayer?.id
                      ? "border-primary bg-primary/10 shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.4)]"
                      : "border-border bg-muted/20 hover:border-primary/50 hover:shadow-[2px_2px_0px_var(--border)]"
                  }`}>
                    {player.isHost && <Crown className="absolute -top-2 -right-2 h-4 w-4 sm:h-5 sm:w-5 text-secondary animate-bounce" />}
                    <div className="text-3xl sm:text-4xl mb-1 sm:mb-2">{player.avatar}</div>
                    <p className="font-bold text-xs sm:text-sm truncate max-w-full">{player.pseudo}</p>
                    {player.id === currentPlayer?.id && <span className="text-[10px] sm:text-xs text-primary mt-0.5 font-bold">(toi)</span>}
                  </div>
                </div>
              ))}
              {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-border/40 opacity-50">
                  <div className="text-3xl mb-1">?</div>
                  <p className="text-xs text-muted-foreground font-medium">En attente...</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
      </div>

      {/* Sticky action buttons — always visible */}
      <div className="shrink-0 px-4 pb-3 pt-2 sm:pb-4 border-t-2 border-border bg-background">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {isHost ? (
            <Button
              onClick={onStartGame} size="lg" variant="accent" disabled={!canStart}
              className="flex-1 h-11 sm:h-14 text-base sm:text-lg font-black uppercase tracking-wide"
            >
              <Play className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Lancer la partie
            </Button>
          ) : (
            <div className="flex-1 flex items-center justify-center gap-3 px-6 py-2.5 rounded-lg border-2 border-border bg-muted/30 shadow-[3px_3px_0px_var(--border)]">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground font-medium">En attente du chef de salon...</span>
            </div>
          )}
          <Button onClick={onLeave} variant="outline" size="lg"
            className="h-11 sm:h-14 px-6 text-base font-bold hover:border-destructive hover:text-destructive hover:shadow-[3px_3px_0px_oklch(0.45_0.25_25_/_0.5)] transition-all"
          >
            <LogOut className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Quitter
          </Button>
        </div>
      </div>
    </div>
  )
}
