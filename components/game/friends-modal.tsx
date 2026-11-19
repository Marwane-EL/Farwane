"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  X,
  Users,
  UserPlus,
  Bell,
  Search,
  Send,
  Check,
  Trash2,
  Loader2,
} from "lucide-react"
import type { FriendProfile, FriendshipEntry } from "@/types/game"
import { PlayerAvatar } from "@/components/game/player-avatar"

interface FriendsModalProps {
  open: boolean
  onClose: () => void
  friends: FriendshipEntry[]
  incomingRequests: FriendshipEntry[]
  outgoingRequests: FriendshipEntry[]
  onlineUserIds: Set<string>
  activeRoomCode?: string
  onSearchPlayers: (query: string) => Promise<FriendProfile[]>
  onSendFriendRequest: (targetUserId: string) => Promise<boolean>
  onAcceptFriendRequest: (friendshipId: string, requesterUserId: string) => Promise<void>
  onRemoveFriendship: (friendshipId: string, otherUserId: string) => Promise<void>
  onSendRoomInvite: (friendUserId: string, friendPseudo: string, roomCode: string) => void
}

export function FriendsModal({
  open,
  onClose,
  friends,
  incomingRequests,
  outgoingRequests,
  onlineUserIds,
  activeRoomCode,
  onSearchPlayers,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRemoveFriendship,
  onSendRoomInvite,
}: FriendsModalProps) {
  const [tab, setTab] = useState<"friends" | "requests" | "add">("friends")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<FriendProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  if (!open) return null

  const sortedFriends = [...friends].sort((a, b) => {
    const aOnline = onlineUserIds.has(a.user.id) ? 1 : 0
    const bOnline = onlineUserIds.has(b.user.id) ? 1 : 0
    if (aOnline !== bOnline) return bOnline - aOnline
    return a.user.pseudo.localeCompare(b.user.pseudo)
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim().length < 2) return
    setSearching(true)
    setHasSearched(true)
    try {
      const res = await onSearchPlayers(searchQuery)
      setSearchResults(res)
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-xl h-[80vh] max-h-[640px] rounded-2xl border-2 border-primary bg-card shadow-[6px_6px_0px_oklch(0.75_0.25_300_/_0.45)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-border bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl border-2 border-primary bg-primary/15 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight">Mes Amis</h2>
              <p className="text-xs text-muted-foreground">
                {activeRoomCode
                  ? `Salon actif (${activeRoomCode}) — invite tes amis en 1 clic`
                  : "Ajoute tes potes et invite-les directement en partie"}
              </p>
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
        <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-border/60 bg-card shrink-0">
          <button
            type="button"
            onClick={() => setTab("friends")}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              tab === "friends"
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Amis ({friends.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all relative ${
              tab === "requests"
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Demandes</span>
            {incomingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-destructive text-white text-[10px] font-black">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab("add")}
            className={`py-2 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              tab === "add"
                ? "border-secondary bg-secondary/15 text-secondary"
                : "border-border bg-muted/20 text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5">
          {tab === "friends" && (
            <div className="space-y-2.5">
              {sortedFriends.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl p-6">
                  <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm font-bold">Tu n&apos;as pas encore d&apos;amis ajoutés</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Va dans l&apos;onglet <strong>Ajouter</strong> pour chercher tes potes par leur pseudo !
                  </p>
                  <Button size="sm" onClick={() => setTab("add")} className="font-black text-xs">
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Ajouter un ami
                  </Button>
                </div>
              ) : (
                sortedFriends.map((entry) => {
                  const isOnline = onlineUserIds.has(entry.user.id)
                  return (
                    <div
                      key={entry.friendshipId}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-border bg-muted/15"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-10 h-10 rounded-xl border border-border bg-card flex items-center justify-center text-xl shrink-0">
                          <PlayerAvatar
                            avatar={entry.user.avatar}
                            imgClassName="w-full h-full rounded-xl object-cover"
                          />
                          <span
                            className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${
                              isOnline ? "bg-emerald-400" : "bg-muted-foreground/40"
                            }`}
                            title={isOnline ? "En ligne" : "Hors ligne"}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm truncate">{entry.user.pseudo}</p>
                          <p className={`text-[11px] font-bold ${isOnline ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {isOnline ? "En ligne" : "Hors ligne"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {activeRoomCode && (
                          <Button
                            size="sm"
                            disabled={!isOnline}
                            onClick={() =>
                              onSendRoomInvite(entry.user.id, entry.user.pseudo, activeRoomCode)
                            }
                            className="h-8 px-3 text-xs font-black"
                            title={isOnline ? "Envoyer une invitation directe" : "Joueur hors ligne"}
                          >
                            <Send className="w-3.5 h-3.5 mr-1" />
                            Inviter
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveFriendship(entry.friendshipId, entry.user.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/15"
                          title="Retirer des amis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {tab === "requests" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                  Demandes reçues ({incomingRequests.length})
                </h3>
                {incomingRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-3">Aucune demande en attente.</p>
                ) : (
                  <div className="space-y-2">
                    {incomingRequests.map((req) => (
                      <div
                        key={req.friendshipId}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-accent/50 bg-accent/10"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-lg shrink-0 overflow-hidden">
                            <PlayerAvatar
                              avatar={req.user.avatar}
                              imgClassName="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-black text-sm truncate">{req.user.pseudo}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => onAcceptFriendRequest(req.friendshipId, req.user.id)}
                            className="h-8 px-3 text-xs font-black"
                          >
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Accepter
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onRemoveFriendship(req.friendshipId, req.user.id)}
                            className="h-8 w-8 text-destructive hover:bg-destructive/15"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                  Demandes envoyées ({outgoingRequests.length})
                </h3>
                {outgoingRequests.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">Aucune demande envoyée en attente.</p>
                ) : (
                  <div className="space-y-2">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req.friendshipId}
                        className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-muted/15"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg border border-border bg-card flex items-center justify-center text-base shrink-0 overflow-hidden">
                            <PlayerAvatar
                              avatar={req.user.avatar}
                              imgClassName="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-bold text-sm truncate">{req.user.pseudo}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveFriendship(req.friendshipId, req.user.id)}
                          className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                        >
                          Annuler
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "add" && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher le pseudo d'un joueur..."
                  className="h-10 border-2 border-border font-bold text-sm"
                />
                <Button
                  type="submit"
                  disabled={searching || searchQuery.trim().length < 2}
                  className="h-10 px-4 font-black text-xs shrink-0"
                >
                  {searching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-1.5" />
                      Chercher
                    </>
                  )}
                </Button>
              </form>

              {hasSearched && searchResults.length === 0 && !searching && (
                <p className="text-xs text-center text-muted-foreground py-6">
                  Aucun joueur inscrit trouvé pour &ldquo;{searchQuery}&rdquo;.
                </p>
              )}

              <div className="space-y-2">
                {searchResults.map((player) => {
                  const isAlreadyFriend = friends.some((f) => f.user.id === player.id)
                  const isPending =
                    incomingRequests.some((f) => f.user.id === player.id) ||
                    outgoingRequests.some((f) => f.user.id === player.id)

                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border-2 border-border bg-muted/15"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center text-lg shrink-0 overflow-hidden">
                          <PlayerAvatar
                            avatar={player.avatar}
                            imgClassName="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-black text-sm truncate">{player.pseudo}</span>
                      </div>

                      {isAlreadyFriend ? (
                        <span className="text-xs font-bold text-emerald-400 px-2.5 py-1 rounded-lg bg-emerald-500/10">
                          Déjà ami
                        </span>
                      ) : isPending ? (
                        <span className="text-xs font-bold text-muted-foreground px-2.5 py-1 rounded-lg bg-muted">
                          En attente
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => onSendFriendRequest(player.id)}
                          className="h-8 px-3 text-xs font-black"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
