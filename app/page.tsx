"use client"

import { useState } from "react"
import { HomeView } from "@/components/game/home-view"
import { LobbyView } from "@/components/game/lobby-view"
import { CreationView } from "@/components/game/creation-view"
import { VotingView } from "@/components/game/voting-view"
import { ResultsView } from "@/components/game/results-view"

export type GamePhase = "home" | "lobby" | "creation" | "voting" | "results"

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

// Default admin meme packs
const defaultMemePacks: MemePack[] = [
  {
    id: "default-1",
    name: "Memes par defaut (Admin)",
    isDefault: true,
    memes: [
      "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif",
      "https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif",
      "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif",
      "https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif",
      "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif",
    ],
  },
  {
    id: "default-2",
    name: "Pack Reaction GIFs",
    isDefault: true,
    memes: [
      "https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif",
      "https://media.giphy.com/media/LRVnPYqM8DLag/giphy.gif",
      "https://media.giphy.com/media/3o7TKTDn976rzVgky4/giphy.gif",
      "https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif",
    ],
  },
]

// Mock data
const mockPlayers: Player[] = [
  { id: "1", pseudo: "MemeLord420", avatar: "🎮", score: 1250, isHost: true },
  { id: "2", pseudo: "GifMaster", avatar: "🔥", score: 980, isHost: false },
  { id: "3", pseudo: "LOLQueen", avatar: "👑", score: 1100, isHost: false },
  { id: "4", pseudo: "DankDude", avatar: "💀", score: 750, isHost: false },
  { id: "5", pseudo: "ViralVibes", avatar: "🚀", score: 890, isHost: false },
]

const prompts = [
  "Quand tu realises que c'est lundi demain...",
  "Mon cerveau pendant un examen",
  "La tete de mon chat quand je rentre tard",
  "Moi essayant d'expliquer mon travail a mes parents",
  "L'ambiance en soiree a 2h du mat",
]

export default function MemeGame() {
  const [phase, setPhase] = useState<GamePhase>("home")
  const [roomCode, setRoomCode] = useState("MEME")
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [players] = useState<Player[]>(mockPlayers)
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [currentRoundMemeIndex, setCurrentRoundMemeIndex] = useState(0)
  const [currentPrompt] = useState(prompts[Math.floor(Math.random() * prompts.length)])
  
  // Libraries state
  const [libraries, setLibraries] = useState<MemeLibrary[]>([])
  
  // Selected meme pack for the game
  const [selectedPack, setSelectedPack] = useState<MemePack | null>(null)
  
  // Memes submitted this round
  const [submittedMemes, setSubmittedMemes] = useState<Meme[]>([])

  // Library management functions
  const handleCreateLibrary = (name: string) => {
    const newLibrary: MemeLibrary = {
      id: `lib-${Date.now()}`,
      name,
      memes: [],
    }
    setLibraries([...libraries, newLibrary])
  }

  const handleDeleteLibrary = (id: string) => {
    setLibraries(libraries.filter((lib) => lib.id !== id))
  }

  const handleAddMemeToLibrary = (libraryId: string, url: string) => {
    setLibraries(
      libraries.map((lib) =>
        lib.id === libraryId
          ? { ...lib, memes: [...lib.memes, url] }
          : lib
      )
    )
  }

  const handleRemoveMemeFromLibrary = (libraryId: string, memeIndex: number) => {
    setLibraries(
      libraries.map((lib) =>
        lib.id === libraryId
          ? { ...lib, memes: lib.memes.filter((_, i) => i !== memeIndex) }
          : lib
      )
    )
  }

  const handleCreateGame = () => {
    const newCode = generateRoomCode()
    setRoomCode(newCode)
    setCurrentPlayer({
      id: "host",
      pseudo: "Vous",
      avatar: "🎯",
      score: 0,
      isHost: true,
    })
    setPhase("lobby")
  }

  const handleJoinGame = (code: string, pseudo: string) => {
    setRoomCode(code)
    setCurrentPlayer({
      id: "player",
      pseudo,
      avatar: "🎲",
      score: 0,
      isHost: false,
    })
    setPhase("lobby")
  }

  const handleSelectPack = (pack: MemePack) => {
    setSelectedPack(pack)
  }

  const handleStartGame = () => {
    if (selectedPack && selectedPack.memes.length >= 3) {
      setCurrentRoundMemeIndex(0)
      setPhase("creation")
    }
  }

  const handleSubmitMeme = (caption: string) => {
    // Add the submitted meme
    const newMeme: Meme = {
      id: `meme-${Date.now()}`,
      playerId: currentPlayer?.id || "unknown",
      playerPseudo: currentPlayer?.pseudo || "Anonyme",
      imageUrl: selectedPack?.memes[currentRoundMemeIndex] || "",
      caption,
      votes: Math.floor(Math.random() * 50), // Mock votes for demo
    }
    setSubmittedMemes([...submittedMemes, newMeme])
    setPhase("voting")
    setCurrentMemeIndex(0)
  }

  // Create mock memes for voting (simulating other players' submissions)
  const getMockMemesForVoting = (): Meme[] => {
    const currentMemeUrl = selectedPack?.memes[currentRoundMemeIndex] || ""
    return [
      {
        id: "1",
        playerId: "3",
        playerPseudo: "LOLQueen",
        imageUrl: currentMemeUrl,
        caption: "Quand le code compile du premier coup",
        votes: 42,
      },
      {
        id: "2",
        playerId: "1",
        playerPseudo: "MemeLord420",
        imageUrl: currentMemeUrl,
        caption: "Moi devant le frigo a 3h du mat",
        votes: 38,
      },
      {
        id: "3",
        playerId: "2",
        playerPseudo: "GifMaster",
        imageUrl: currentMemeUrl,
        caption: "Le lundi matin en reunion",
        votes: 25,
      },
    ]
  }

  const votingMemes = getMockMemesForVoting()

  const handleVote = () => {
    if (currentMemeIndex < votingMemes.length - 1) {
      setCurrentMemeIndex(currentMemeIndex + 1)
    } else {
      setPhase("results")
    }
  }

  const handlePlayAgain = () => {
    // Move to next meme in the pack
    const nextIndex = (currentRoundMemeIndex + 1) % (selectedPack?.memes.length || 1)
    setCurrentRoundMemeIndex(nextIndex)
    setSubmittedMemes([])
    setPhase("creation")
    setCurrentMemeIndex(0)
  }

  const handleBackToHome = () => {
    setPhase("home")
    setCurrentPlayer(null)
    setSelectedPack(null)
    setSubmittedMemes([])
  }

  const currentMemeUrl = selectedPack?.memes[currentRoundMemeIndex] || ""

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10">
        {phase === "home" && (
          <HomeView 
            onCreateGame={handleCreateGame} 
            onJoinGame={handleJoinGame}
            libraries={libraries}
            onCreateLibrary={handleCreateLibrary}
            onDeleteLibrary={handleDeleteLibrary}
            onAddMemeToLibrary={handleAddMemeToLibrary}
            onRemoveMemeFromLibrary={handleRemoveMemeFromLibrary}
          />
        )}
        {phase === "lobby" && (
          <LobbyView
            roomCode={roomCode}
            players={players}
            currentPlayer={currentPlayer}
            memePacks={defaultMemePacks}
            userLibraries={libraries}
            selectedPack={selectedPack}
            onSelectPack={handleSelectPack}
            onStartGame={handleStartGame}
            onLeave={handleBackToHome}
          />
        )}
        {phase === "creation" && (
          <CreationView
            prompt={currentPrompt}
            currentMemeUrl={currentMemeUrl}
            onSubmit={handleSubmitMeme}
          />
        )}
        {phase === "voting" && (
          <VotingView
            meme={votingMemes[currentMemeIndex]}
            currentIndex={currentMemeIndex}
            totalMemes={votingMemes.length}
            onVote={handleVote}
          />
        )}
        {phase === "results" && (
          <ResultsView
            memes={votingMemes}
            onPlayAgain={handlePlayAgain}
            onBackToHome={handleBackToHome}
          />
        )}
      </div>
    </main>
  )
}

function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}
