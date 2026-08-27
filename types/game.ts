export type GamePhase = "home" | "lobby" | "creation" | "voting" | "results" | "final-results"

export interface GameSettings {
  timerDuration: number // seconds for creation phase
  totalRounds: number
  maxPlayers: number
  nicheRoundRatio: number // 0 = disabled, 0.33 = ~1/3, 0.5 = ~1/2, 1 = every round
}

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
