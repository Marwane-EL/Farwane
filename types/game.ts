export type GamePhase = "home" | "lobby" | "creation" | "voting" | "results" | "final-results"

export interface GameSettings {
  timerDuration: number // seconds for creation phase
  totalRounds: number
  maxPlayers: number
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
