"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Copy, Check, Play, LogOut, Crown, Loader2, Package, ChevronDown, Settings, Timer, Hash, Users, Sparkles, AlertCircle, RefreshCw
} from "lucide-react"
import { useState } from "react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import type { Player, MemeLibrary, MemePack, GameSettings, NichePoolItem, NicheItem } from "@/types/game"
import { getMinNichesRequired } from "@/types/game"
import { NichePoolLobby } from "@/components/game/niche-pool-lobby"

interface LobbyViewProps {
  roomCode: string
  players: Player[]
  currentPlayer: Player | null
  memePacks: MemePack[]
  userLibraries: MemeLibrary[]
  selectedPack: MemePack | null
  settings: GameSettings
  nichePool: NichePoolItem[]
  personalNiches: NicheItem[]
  onSelectPack: (pack: MemePack) => void
  onUpdateSettings: (settings: GameSettings) => void
  onAddNiche: (text: string, saveToLibrary: boolean) => void
  onRemoveNiche: (id: string) => void
  onClearNiches?: () => void
  onStartGame: () => void
  onLeave: () => void
}

export function LobbyView({
  roomCode, players, currentPlayer, memePacks,
  userLibraries, selectedPack, settings,
  nichePool, personalNiches,
  onSelectPack, onUpdateSettings, onAddNiche, onRemoveNiche, onClearNiches, onStartGame, onLeave,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement("textarea")
      el.value = roomCode
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isHost = currentPlayer?.isHost
  const minRequiredNiches = getMinNichesRequired(settings.totalRounds)
  const hasEnoughNiches = settings.gameMode === "classic" || nichePool.length >= minRequiredNiches
  const canStart = Boolean(selectedPack && selectedPack.memes.length >= 3 && players.length >= 2 && hasEnoughNiches)

  const timerOptions = [30, 60, 90, 120]
  const roundOptions = [3, 5, 7, 10]

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      
      {/* Room code — signature neo-brut party badge centered with generous top/bottom margins */}
      <div className="text-center pt-3 sm:pt-4 pb-2 sm:pb-3 px-4 shrink-0 animate-in fade-in slide-in-from-top-4 duration-500">
        <p className="text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-widest mb-1">
          Code de la partie
        </p>
        <div className="inline-flex items-center justify-center gap-3 px-6 py-2 sm:px-8 sm:py-2.5 rounded-xl border-2 border-secondary/70 bg-card shadow-[5px_5px_0px_oklch(0.85_0.2_90_/_0.5)] hover:shadow-[6px_6px_0px_oklch(0.85_0.2_90_/_0.6)] transition-all">
          <h1 className="text-3xl sm:text-5xl font-black tracking-[0.35em] text-secondary pl-1 select-all">
            {roomCode}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyCode}
            className="h-8 w-8 sm:h-10 sm:w-10 shrink-0 hover:bg-secondary/20"
            title="Copier le code"
          >
            {copied ? (
              <Check className="h-5 w-5 text-accent animate-in zoom-in" />
            ) : (
              <Copy className="h-5 w-5 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1.5 font-medium">
          Partage ce code avec tes potes !
        </p>
      </div>

      {/* Main Content Area: Wider container (max-w-6xl/7xl), comfortable margins, scrollable on mobile, zero-scroll on desktop */}
      <div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden px-4 sm:px-6 py-2 sm:py-3">
        <div className="max-w-6xl xl:max-w-7xl mx-auto h-full flex flex-col md:grid md:grid-cols-2 gap-4 sm:gap-6">
          
          {/* LEFT COLUMN: Joueurs + Niches */}
          <div className="flex flex-col gap-3 sm:gap-4 min-h-0 h-full">
            
            {/* Joueurs Card */}
            <Card className="border-2 border-border shadow-[4px_4px_0px_var(--border)] flex-1 min-h-0 flex flex-col">
              <CardContent className="p-3 sm:p-4 flex flex-col h-full min-h-0">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest text-center mb-3 text-muted-foreground flex items-center justify-center gap-2 shrink-0">
                  <Users className="h-4 w-4 text-primary" />
                  Joueurs ({players.length}/{settings.maxPlayers})
                </h2>

                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 flex-1 min-h-0 overflow-y-auto pt-2.5 px-1 pb-1">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`animate-in fade-in zoom-in-95 duration-300 relative ${player.isHost ? "z-20" : "z-0"}`}
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <div
                        className={`relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 transition-all duration-200 ${
                          player.id === currentPlayer?.id
                            ? "border-primary bg-primary/10 shadow-[3px_3px_0px_oklch(0.75_0.25_300_/_0.4)]"
                            : "border-border bg-muted/20 hover:border-primary/50 hover:shadow-[2px_2px_0px_var(--border)]"
                        } ${player.isHost ? "z-20" : ""}`}
                      >
                        {player.isHost && (
                          <Crown className="absolute -top-2.5 -right-1.5 h-5 w-5 sm:h-6 sm:w-6 text-secondary fill-secondary drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] animate-bounce z-30 pointer-events-none" />
                        )}
                        <div className="text-2xl sm:text-3xl mb-1 select-none leading-none">
                          {player.avatar}
                        </div>
                        <p className="font-bold text-xs sm:text-sm truncate max-w-full text-center">
                          {player.pseudo}
                        </p>
                        {player.id === currentPlayer?.id && (
                          <span className="text-[10px] sm:text-xs text-primary font-bold">
                            (toi)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border-2 border-dashed border-border/40 opacity-50 bg-muted/5"
                    >
                      <div className="text-xl sm:text-2xl mb-1 text-muted-foreground select-none leading-none">
                        ?
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        En attente...
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Niches Card */}
            <Card className={`border-2 shadow-[4px_4px_0px_var(--border)] shrink-0 transition-all ${
              settings.gameMode === "niche"
                ? "border-accent/60 shadow-[4px_4px_0px_oklch(0.6_0.22_145_/_0.3)]"
                : "border-border/60"
            }`}>
              <CardContent className="p-3 sm:p-4">
                <NichePoolLobby
                  nichePool={nichePool}
                  currentPlayerId={currentPlayer?.id ?? ""}
                  isHost={isHost ?? false}
                  gameMode={settings.gameMode}
                  minRequiredNiches={minRequiredNiches}
                  personalNiches={personalNiches}
                  onAdd={(text, save) => onAddNiche(text, save)}
                  onRemove={onRemoveNiche}
                  onClearAll={onClearNiches}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Pack & Paramètres (Host) ou Configuration (Non-host) */}
          <div className="flex flex-col gap-3 sm:gap-4 min-h-0 h-full">
            {isHost ? (
              <>
                {/* Pack Selection */}
                <Card className="border-2 border-primary/60 shadow-[4px_4px_0px_oklch(0.75_0.25_300_/_0.5)] shrink-0">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Package className="h-5 w-5 text-primary shrink-0" />
                      <span className="font-black flex-1 min-w-[90px] uppercase text-xs sm:text-sm tracking-wide">
                        Pack de Memes :
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="min-w-[180px] sm:min-w-[210px] justify-between h-9 sm:h-10 text-xs sm:text-sm font-bold border-2">
                            <span className="truncate">{selectedPack ? selectedPack.name : "Choisir un pack..."}</span>
                            <ChevronDown className="h-4 w-4 ml-2 shrink-0 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[260px] max-h-72 overflow-y-auto border-2 border-border shadow-[4px_4px_0px_var(--border)]">
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                            Packs officiels
                          </DropdownMenuLabel>
                          {memePacks.map((pack) => (
                            <DropdownMenuItem
                              key={pack.id}
                              onClick={() => onSelectPack(pack)}
                              className="cursor-pointer font-medium text-xs sm:text-sm"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{pack.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {pack.memes.length} memes
                                </span>
                              </div>
                            </DropdownMenuItem>
                          ))}
                          {userLibraries.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuLabel className="text-xs text-muted-foreground font-bold uppercase tracking-wide">
                                Mes Bibliothèques
                              </DropdownMenuLabel>
                              {userLibraries.map((library) => (
                                <DropdownMenuItem
                                  key={library.id}
                                  onClick={() =>
                                    onSelectPack({
                                      id: library.id,
                                      name: library.name,
                                      memes: library.memes,
                                      isDefault: false,
                                    })
                                  }
                                  className="cursor-pointer font-medium text-xs sm:text-sm"
                                  disabled={library.memes.length < 3}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{library.name}</span>
                                    <span
                                      className={`text-xs ${
                                        library.memes.length < 3
                                          ? "text-destructive"
                                          : "text-muted-foreground"
                                      }`}
                                    >
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
                    {!selectedPack && (
                      <p className="text-xs text-destructive mt-2 text-center font-bold">
                        Choisis un pack de memes pour lancer la partie
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Game Settings */}
                <Card className="border-2 border-secondary/50 shadow-[4px_4px_0px_oklch(0.85_0.2_90_/_0.4)] flex-1 min-h-0 flex flex-col">
                  <CardContent className="p-3 sm:p-4 space-y-3 flex-1 min-h-0 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Settings className="h-4 w-4 text-secondary" />
                      <span className="font-black uppercase text-xs sm:text-sm tracking-wide">
                        Paramètres
                      </span>
                    </div>

                    {/* Game Mode */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                        <Sparkles className="h-3.5 w-3.5 text-secondary" />
                        <span>Mode de jeu</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={settings.gameMode === "classic" ? "secondary" : "outline"}
                          onClick={() => onUpdateSettings({ ...settings, gameMode: "classic" })}
                          className="h-8 sm:h-9 font-black text-xs sm:text-sm gap-1.5"
                        >
                          <span>🎭</span> Classique
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={settings.gameMode === "niche" ? "accent" : "outline"}
                          onClick={() => onUpdateSettings({ ...settings, gameMode: "niche" })}
                          className="h-8 sm:h-9 font-black text-xs sm:text-sm gap-1.5"
                        >
                          <span>🎯</span> Niches
                        </Button>
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                        <Timer className="h-3.5 w-3.5" />
                        <span>Timer de création</span>
                      </div>
                      <div className="flex gap-1.5">
                        {timerOptions.map((t) => (
                          <Button
                            key={t}
                            size="sm"
                            variant={settings.timerDuration === t ? "secondary" : "outline"}
                            onClick={() => onUpdateSettings({ ...settings, timerDuration: t })}
                            className="flex-1 h-7 sm:h-8 font-black text-xs"
                          >
                            {t}s
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Rounds */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                        <Hash className="h-3.5 w-3.5" />
                        <span>Nombre de manches</span>
                      </div>
                      <div className="flex gap-1.5">
                        {roundOptions.map((r) => (
                          <Button
                            key={r}
                            size="sm"
                            variant={settings.totalRounds === r ? "secondary" : "outline"}
                            onClick={() => onUpdateSettings({ ...settings, totalRounds: r })}
                            className="flex-1 h-7 sm:h-8 font-black text-xs"
                          >
                            {r}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Rerolls */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-bold uppercase tracking-wide">
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Changements d&apos;image par manche</span>
                      </div>
                      <div className="flex gap-1.5 items-center">
                        {[0, 5, 10].map((r) => (
                          <Button
                            key={r}
                            type="button"
                            size="sm"
                            variant={settings.maxRefreshes === r ? "secondary" : "outline"}
                            onClick={() => onUpdateSettings({ ...settings, maxRefreshes: r })}
                            className="flex-1 h-7 sm:h-8 font-black text-xs"
                          >
                            {r}
                          </Button>
                        ))}
                        <div className="flex-1 flex items-center relative">
                          <input
                            type="number"
                            min={0}
                            max={99}
                            value={settings.maxRefreshes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10)
                              if (!isNaN(val) && val >= 0) {
                                onUpdateSettings({ ...settings, maxRefreshes: Math.min(99, val) })
                              } else if (e.target.value === "") {
                                onUpdateSettings({ ...settings, maxRefreshes: 0 })
                              }
                            }}
                            placeholder="Perso"
                            className={`w-full h-7 sm:h-8 px-1 text-center rounded-md border-2 font-black text-xs outline-none transition-all ${
                              ![0, 5, 10].includes(settings.maxRefreshes)
                                ? "border-secondary bg-secondary/15 text-secondary shadow-[2px_2px_0px_oklch(0.85_0.2_90_/_0.5)]"
                                : "border-border bg-background hover:border-border/80 focus:border-secondary"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Non-Host Right Column */
              <div className="flex flex-col gap-3 sm:gap-4 h-full">
                <Card className="border-2 border-border shadow-[4px_4px_0px_var(--border)]">
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    {selectedPack && (
                      <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground font-medium">Pack :</span>
                        <span className="font-bold text-xs sm:text-sm">{selectedPack.name}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs font-bold text-muted-foreground">
                      <span className="flex items-center gap-1.5 p-2 rounded-md bg-muted/20 border border-border/40">
                        <Timer className="h-3.5 w-3.5 text-primary" /> {settings.timerDuration}s
                      </span>
                      <span className="flex items-center gap-1.5 p-2 rounded-md bg-muted/20 border border-border/40">
                        <Hash className="h-3.5 w-3.5 text-secondary" /> {settings.totalRounds} manches
                      </span>
                      <span className="flex items-center gap-1.5 p-2 rounded-md bg-muted/20 border border-border/40">
                        <RefreshCw className="h-3.5 w-3.5 text-accent" /> {settings.maxRefreshes} rerolls
                      </span>
                      <span className="flex items-center gap-1.5 p-2 rounded-md bg-muted/20 border border-border/40">
                        {settings.gameMode === "niche" ? "🎯 Mode Niches" : "🎭 Classique"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border/60 bg-muted/10 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm font-bold">En attente du chef de salon...</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    L&apos;hôte configure la partie et va bientôt la lancer !
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Action Footer with comfortable padding */}
      <div className="shrink-0 px-4 pb-4 pt-2.5 sm:pb-6 sm:pt-3 border-t-2 border-border bg-background/95 backdrop-blur-sm z-30">
        <div className="flex flex-col gap-2 w-full max-w-lg mx-auto">
          {/* Missing requirements warning */}
          {isHost && (
            <>
              {players.length < 2 && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground text-center">
                  <Users className="h-3.5 w-3.5 text-primary" />
                  <span>En attente d&apos;au moins 2 joueurs pour démarrer</span>
                </div>
              )}
              {players.length >= 2 && !selectedPack && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-destructive text-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Sélectionnez un pack de memes pour lancer</span>
                </div>
              )}
              {players.length >= 2 && selectedPack && settings.gameMode === "niche" && !hasEnoughNiches && (
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-secondary text-center">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Ajoutez encore {minRequiredNiches - nichePool.length} niche(s) pour lancer en Mode Niches</span>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 sm:gap-3 w-full">
            {isHost ? (
              <Button
                onClick={onStartGame}
                size="lg"
                variant="accent"
                disabled={!canStart}
                className="flex-1 h-11 sm:h-13 text-sm sm:text-base font-black uppercase tracking-wide shadow-[3px_3px_0px_oklch(0.6_0.22_145_/_0.5)] active:translate-y-0.5"
              >
                <Play className="mr-2 h-5 w-5 fill-current" />
                Lancer la partie
              </Button>
            ) : (
              <div className="flex-1 flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border-2 border-border bg-muted/30 text-xs sm:text-sm font-bold text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>En attente du chef de salon...</span>
              </div>
            )}
            <Button
              onClick={onLeave}
              variant="outline"
              size="lg"
              className="h-11 sm:h-13 px-5 sm:px-6 text-sm font-bold hover:border-destructive hover:text-destructive hover:shadow-[3px_3px_0px_oklch(0.45_0.25_25_/_0.5)] transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Quitter
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
