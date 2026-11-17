export type GamePhase = "home" | "lobby" | "creation" | "voting" | "results" | "final-results"

export type GameMode = "classic" | "niche" | "incognito"

export interface GameSettings {
  timerDuration: number // seconds for creation phase
  totalRounds: number
  maxPlayers: number
  gameMode: GameMode // "classic" | "niche" | "incognito"
  maxRefreshes: number // number of meme rerolls allowed per round
}

export const getMinNichesRequired = (totalRounds: number) => Math.ceil(totalRounds / 2)

export const SECRET_CODENAMES = [
  "Agent 007 🕶️",
  "L'Infiltré 🕵️",
  "Ninja Masqué 🥷",
  "Fantôme Malin 👻",
  "Ombre Rapide 👤",
  "Maître Mystère 🎭",
  "Caméléon 🦎",
  "Taupe Secrète 🦔",
  "Espion Doré 👑",
  "Corbeau Furtif 🦅",
  "Loup Solitaire 🐺",
  "Spectre Bleu 🔮",
]

export interface Player {
  id: string
  pseudo: string
  avatar: string
  score: number
  isHost: boolean
  codename?: string
}

export interface Meme {
  id: string
  playerId: string
  playerPseudo: string
  imageUrl: string
  caption: string
  votes: number
  niche?: string
  hearts?: number
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

export interface ChatMessage {
  id: string
  playerId: string
  pseudo: string
  avatar: string
  text: string
  timestamp: number
}

export interface HeartRedistribution {
  unusedCount: number
  bonuses: Record<string, number> // playerId -> bonus points received from others' unused hearts
}

// ─── 1v1 Mini-Game Duels (Ephemeral Realtime Broadcast) ───────────────────────

export type DuelKind = "ttt" | "rps"
export type RpsChoice = "rock" | "paper" | "scissors"

export interface DuelPlayer {
  id: string
  name: string
  avatar: string
}

export type DuelEvent =
  | { type: "duel:hello"; playerId: string }
  | { type: "duel:queue"; player: DuelPlayer; game: DuelKind }
  | { type: "duel:cancel"; playerId: string }
  | { type: "duel:accept"; matchId: string; game: DuelKind; host: DuelPlayer; guest: DuelPlayer }
  | { type: "duel:move"; matchId: string; playerId: string; index: number }
  | { type: "duel:rps_pick"; matchId: string; playerId: string; round: number; choice: RpsChoice }
  | { type: "duel:rematch"; matchId: string; playerId: string }
  | { type: "duel:leave"; matchId: string; playerId: string }

// ─── User Account, Favorites & Bangers (Hall of Fame) ─────────────────────────

export interface SavedBanger {
  id: string
  imageUrl: string
  caption: string
  playerPseudo: string
  niche?: string
  createdAt: number
}

export interface UserStats {
  gamesPlayed: number
  wins: number
  totalPoints: number
  heartsReceived: number
}

export interface UserProfile {
  id: string
  email?: string
  pseudo: string
  avatar: string
  favoriteMemes: string[]       // Raw media URLs usable as a playable pack ("⭐ Mes Favoris")
  savedBangers: SavedBanger[]   // Hall of Fame creations (media + caption + author)
  niches: NicheItem[]
  libraries: MemeLibrary[]
  stats: UserStats
}

export interface LiveReaction {
  id: string
  kind: "emoji" | "text"
  content: string
  authorLabel?: string
  xPercent: number
  createdAt: number
}
