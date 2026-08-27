export type GamePhase = "home" | "lobby" | "creation" | "voting" | "results" | "final-results"

export type GameMode = "classic" | "niche"

export interface GameSettings {
  timerDuration: number // seconds for creation phase
  totalRounds: number
  maxPlayers: number
  gameMode: GameMode // "classic" | "niche"
  maxRefreshes: number // number of meme rerolls allowed per round
}

export const getMinNichesRequired = (totalRounds: number) => Math.ceil(totalRounds / 2)

export interface Player {
  id: string
  pseudo: string
  avatar: string
  score: number
  isHost: boolean
}

export interface Meme {
  id: string
  playerId: string
  playerPseudo: string
  imageUrl: string
  caption: string
  votes: number
}

export interface MemeLibrary {
  id: string
  name: string
  memes: string[] // Array of image URLs
}

export interface MemePack {
  id: string
  name: string
  memes: string[]
  isDefault: boolean
}

// ─── Niches ───────────────────────────────────────────────────────────────────

/** Stored in localStorage (personal library, persists across games) */
export interface NicheItem {
  id: string
  text: string
  createdAt: number // unix timestamp ms
}

/** Lives in the room state for one game session (ephemeral) */
export interface NichePoolItem {
  id: string
  text: string
  addedBy: string // player id — used to allow self-deletion
}
