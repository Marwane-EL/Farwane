"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Player, Meme, MemePack, MemeLibrary, GamePhase, GameSettings } from "@/types/game"

const avatars = ["🎮", "🔥", "👑", "💀", "🚀", "🎲", "🎯", "⚡", "🌟", "🎪", "🦄", "🐉"]

const prompts = [
  "Quand tu réalises que c'est lundi demain...",
  "Mon cerveau pendant un examen",
  "La tête de mon chat quand je rentre tard",
  "Moi essayant d'expliquer mon travail à mes parents",
  "L'ambiance en soirée à 2h du mat",
  "Quand le WiFi se coupe en plein stream",
  "Mon regard quand quelqu'un dit 'c'est facile'",
  "La tête du prof quand personne n'a fait ses devoirs",
  "Quand tu trouves 5€ dans ta vieille veste",
  "Le chien quand tu fais semblant de lancer la balle",
]

const DEFAULT_SETTINGS: GameSettings = {
  timerDuration: 90,
  totalRounds: 5,
  maxPlayers: 8,
}

function generateRoomCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ"
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += letters[Math.floor(Math.random() * letters.length)]
  }
  return code
}

function getRandomAvatar(): string {
  return avatars[Math.floor(Math.random() * avatars.length)]
}

function getRandomPrompt(used: string[]): string {
  const available = prompts.filter((p) => !used.includes(p))
  const pool = available.length > 0 ? available : prompts
  return pool[Math.floor(Math.random() * pool.length)]
}

export function useGameRoom() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const playerIdRef = useRef<string>("")
  const usedPromptsRef = useRef<string[]>([])

  useEffect(() => {
    let id = sessionStorage.getItem("player_id")
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem("player_id", id)
    }
    playerIdRef.current = id
  }, [])

  // Core state
  const [phase, setPhase] = useState<GamePhase>("home")
  const [roomCode, setRoomCode] = useState("")
  const [players, setPlayers] = useState<Player[]>([])
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Game settings & round tracking
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [currentRound, setCurrentRound] = useState(1)
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({})

  // Game state
  const [selectedPack, setSelectedPack] = useState<MemePack | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [currentRoundMemeIndex, setCurrentRoundMemeIndex] = useState(0)
  const [submissions, setSubmissions] = useState<Meme[]>([])
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  // Libraries (persisted in localStorage)
  const [libraries, setLibraries] = useState<MemeLibrary[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("meme_libraries")
    if (saved) {
      try { setLibraries(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("meme_libraries", JSON.stringify(libraries))
  }, [libraries])

  // Subscribe to room channel
  const subscribeToRoom = useCallback((code: string, player: Player) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channel = supabase.channel(`room:${code}`, {
      config: { presence: { key: player.id } },
    })

    // Presence sync
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const playerList: Player[] = []
      for (const entries of Object.values(state)) {
        if (entries && entries.length > 0) {
          const p = entries[0] as unknown as Player
          playerList.push({ id: p.id, pseudo: p.pseudo, avatar: p.avatar, score: p.score, isHost: p.isHost })
        }
      }
      setPlayers(playerList)
    })

    // Settings update
    channel.on("broadcast", { event: "game:settings" }, ({ payload }) => {
      setSettings(payload.settings)
    })

    // Pack selected
    channel.on("broadcast", { event: "game:select-pack" }, ({ payload }) => {
      setSelectedPack(payload.pack)
    })

    // Game start
    channel.on("broadcast", { event: "game:start" }, ({ payload }) => {
      setPhase("creation")
      setSelectedPack(payload.pack)
      setCurrentPrompt(payload.prompt)
      setCurrentRoundMemeIndex(payload.roundIndex)
      setSettings(payload.settings)
      setCurrentRound(1)
      setPlayerScores({})
      setSubmissions([])
      setHasSubmitted(false)
    })

    // Meme submitted
    channel.on("broadcast", { event: "game:submit" }, ({ payload }) => {
      setSubmissions((prev) => {
        if (prev.find((m) => m.id === payload.meme.id)) return prev
        return [...prev, payload.meme]
      })
    })

    // Move to voting
    channel.on("broadcast", { event: "game:voting" }, ({ payload }) => {
      setPhase("voting")
      setSubmissions(payload.submissions)
      setCurrentMemeIndex(0)
    })

    // Vote received
    channel.on("broadcast", { event: "game:vote" }, ({ payload }) => {
      setSubmissions((prev) =>
        prev.map((m) => (m.id === payload.memeId ? { ...m, votes: m.votes + payload.score } : m))
      )
    })

    // Round results (with scores)
    channel.on("broadcast", { event: "game:results" }, ({ payload }) => {
      setPhase("results")
      setSubmissions(payload.submissions)
      setPlayerScores(payload.scores)
      setCurrentRound(payload.currentRound)
    })

    // Next round
    channel.on("broadcast", { event: "game:next-round" }, ({ payload }) => {
      setPhase("creation")
      setCurrentPrompt(payload.prompt)
      setCurrentRoundMemeIndex(payload.roundIndex)
      setCurrentRound(payload.round)
      setSubmissions([])
      setHasSubmitted(false)
      setCurrentMemeIndex(0)
    })

    // Final results
    channel.on("broadcast", { event: "game:final" }, ({ payload }) => {
      setPhase("final-results")
      setPlayerScores(payload.scores)
    })

    // New game (back to lobby)
    channel.on("broadcast", { event: "game:new-game" }, () => {
      setPhase("lobby")
      setCurrentRound(1)
      setPlayerScores({})
      setSubmissions([])
      setSelectedPack(null)
      setHasSubmitted(false)
      setCurrentMemeIndex(0)
      setCurrentRoundMemeIndex(0)
    })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(player)
      }
    })

    channelRef.current = channel
  }, [])

  // --- Actions ---

  const createRoom = useCallback(async (pseudo: string) => {
    setIsLoading(true)
    setError(null)
    try {
      let code = generateRoomCode()
      let attempts = 0
      while (attempts < 5) {
        const { error: insertError } = await supabase
          .from("rooms")
          .insert({ code, host_id: playerIdRef.current, status: "waiting" })
        if (!insertError) break
        code = generateRoomCode()
        attempts++
      }
      if (attempts >= 5) {
        setError("Impossible de créer le salon. Réessaye.")
        return
      }
      const player: Player = {
        id: playerIdRef.current, pseudo: pseudo || "Hôte",
        avatar: getRandomAvatar(), score: 0, isHost: true,
      }
      setCurrentPlayer(player)
      setRoomCode(code)
      setSettings(DEFAULT_SETTINGS)
      subscribeToRoom(code, player)
      setPhase("lobby")
    } catch {
      setError("Erreur lors de la création du salon")
    } finally {
      setIsLoading(false)
    }
  }, [subscribeToRoom])

  const joinRoom = useCallback(async (code: string, pseudo: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from("rooms").select("*").eq("code", code).single()
      if (fetchError || !data) {
        setError("Salon introuvable ! Vérifie le code.")
        return
      }
      if (data.status !== "waiting") {
        setError("Cette partie a déjà commencé !")
        return
      }
      const player: Player = {
        id: playerIdRef.current, pseudo,
        avatar: getRandomAvatar(), score: 0, isHost: false,
      }
      setCurrentPlayer(player)
      setRoomCode(code)
      subscribeToRoom(code, player)
      setPhase("lobby")
    } catch {
      setError("Erreur lors de la connexion au salon")
    } finally {
      setIsLoading(false)
    }
  }, [subscribeToRoom])

  const updateSettings = useCallback((newSettings: GameSettings) => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setSettings(newSettings)
    channelRef.current.send({ type: "broadcast", event: "game:settings", payload: { settings: newSettings } })
  }, [currentPlayer])

  const selectPack = useCallback((pack: MemePack) => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setSelectedPack(pack)
    channelRef.current.send({ type: "broadcast", event: "game:select-pack", payload: { pack } })
  }, [currentPlayer])

  const startGame = useCallback(async () => {
    if (!currentPlayer?.isHost || !channelRef.current || !selectedPack) return
    if (selectedPack.memes.length < 3) return
    await supabase.from("rooms").update({ status: "playing" }).eq("code", roomCode)
    usedPromptsRef.current = []
    const prompt = getRandomPrompt(usedPromptsRef.current)
    usedPromptsRef.current.push(prompt)
    setPhase("creation")
    setCurrentPrompt(prompt)
    setCurrentRoundMemeIndex(0)
    setCurrentRound(1)
    setPlayerScores({})
    setSubmissions([])
    setHasSubmitted(false)
    channelRef.current.send({
      type: "broadcast", event: "game:start",
      payload: { pack: selectedPack, prompt, roundIndex: 0, settings },
    })
  }, [currentPlayer, selectedPack, roomCode, settings])

  const submitMeme = useCallback((caption: string) => {
    if (!channelRef.current || !currentPlayer || hasSubmitted) return
    const meme: Meme = {
      id: crypto.randomUUID(), playerId: currentPlayer.id,
      playerPseudo: currentPlayer.pseudo,
      imageUrl: selectedPack?.memes[currentRoundMemeIndex] || "",
      caption, votes: 0,
    }
    setHasSubmitted(true)
    setSubmissions((prev) => [...prev, meme])
    channelRef.current.send({ type: "broadcast", event: "game:submit", payload: { meme } })
  }, [currentPlayer, selectedPack, currentRoundMemeIndex, hasSubmitted])

  const moveToVoting = useCallback(() => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setPhase("voting")
    setCurrentMemeIndex(0)
    channelRef.current.send({ type: "broadcast", event: "game:voting", payload: { submissions } })
  }, [currentPlayer, submissions])

  const vote = useCallback((memeId: string, score: number) => {
    if (!channelRef.current || !currentPlayer) return
    setSubmissions((prev) => prev.map((m) => (m.id === memeId ? { ...m, votes: m.votes + score } : m)))
    channelRef.current.send({
      type: "broadcast", event: "game:vote",
      payload: { memeId, score, voterId: currentPlayer.id },
    })
  }, [currentPlayer])

  const nextMemeOrResults = useCallback(() => {
    if (currentMemeIndex < submissions.length - 1) {
      setCurrentMemeIndex((prev) => prev + 1)
    } else {
      // All memes voted — calculate round scores
      const newScores = { ...playerScores }
      for (const sub of submissions) {
        newScores[sub.playerId] = (newScores[sub.playerId] || 0) + sub.votes
      }
      setPlayerScores(newScores)
      setPhase("results")

      if (currentPlayer?.isHost && channelRef.current) {
        channelRef.current.send({
          type: "broadcast", event: "game:results",
          payload: { submissions, scores: newScores, currentRound },
        })
      }
    }
  }, [currentMemeIndex, submissions, currentPlayer, playerScores, currentRound])

  const nextRound = useCallback(() => {
    if (!currentPlayer?.isHost || !channelRef.current || !selectedPack) return

    if (currentRound >= settings.totalRounds) {
      // Last round → final results
      setPhase("final-results")
      channelRef.current.send({
        type: "broadcast", event: "game:final",
        payload: { scores: playerScores },
      })
    } else {
      // More rounds to play
      const nextRoundNum = currentRound + 1
      const nextMemeIdx = (currentRoundMemeIndex + 1) % selectedPack.memes.length
      const prompt = getRandomPrompt(usedPromptsRef.current)
      usedPromptsRef.current.push(prompt)
      setPhase("creation")
      setCurrentPrompt(prompt)
      setCurrentRoundMemeIndex(nextMemeIdx)
      setCurrentRound(nextRoundNum)
      setSubmissions([])
      setHasSubmitted(false)
      setCurrentMemeIndex(0)
      channelRef.current.send({
        type: "broadcast", event: "game:next-round",
        payload: { roundIndex: nextMemeIdx, prompt, round: nextRoundNum },
      })
    }
  }, [currentPlayer, selectedPack, currentRound, currentRoundMemeIndex, settings.totalRounds, playerScores])

  const newGame = useCallback(async () => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setPhase("lobby")
    setCurrentRound(1)
    setPlayerScores({})
    setSubmissions([])
    setSelectedPack(null)
    setHasSubmitted(false)
    setCurrentMemeIndex(0)
    setCurrentRoundMemeIndex(0)
    usedPromptsRef.current = []
    await supabase.from("rooms").update({ status: "waiting" }).eq("code", roomCode)
    channelRef.current.send({ type: "broadcast", event: "game:new-game", payload: {} })
  }, [currentPlayer, roomCode])

  const leaveRoom = useCallback(async () => {
    if (channelRef.current) {
      await channelRef.current.untrack()
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    if (currentPlayer?.isHost && roomCode) {
      await supabase.from("rooms").delete().eq("code", roomCode)
    }
    setPhase("home")
    setCurrentPlayer(null)
    setPlayers([])
    setRoomCode("")
    setSelectedPack(null)
    setSubmissions([])
    setCurrentMemeIndex(0)
    setCurrentRoundMemeIndex(0)
    setHasSubmitted(false)
    setError(null)
    setCurrentRound(1)
    setPlayerScores({})
    setSettings(DEFAULT_SETTINGS)
  }, [currentPlayer, roomCode])

  // Library management
  const createLibrary = useCallback((name: string) => {
    setLibraries((prev) => [...prev, { id: `lib-${Date.now()}`, name, memes: [] }])
  }, [])
  const deleteLibrary = useCallback((id: string) => {
    setLibraries((prev) => prev.filter((lib) => lib.id !== id))
  }, [])
  const addMemeToLibrary = useCallback((libraryId: string, url: string) => {
    setLibraries((prev) => prev.map((lib) =>
      lib.id === libraryId ? { ...lib, memes: [...lib.memes, url] } : lib
    ))
  }, [])
  const removeMemeFromLibrary = useCallback((libraryId: string, memeIndex: number) => {
    setLibraries((prev) => prev.map((lib) =>
      lib.id === libraryId ? { ...lib, memes: lib.memes.filter((_, i) => i !== memeIndex) } : lib
    ))
  }, [])

  // Cleanup
  useEffect(() => {
    return () => { if (channelRef.current) supabase.removeChannel(channelRef.current) }
  }, [])

  return {
    phase, roomCode, players, currentPlayer,
    settings, currentRound, playerScores,
    selectedPack, currentPrompt, currentRoundMemeIndex,
    submissions, currentMemeIndex, hasSubmitted,
    error, isLoading, libraries,
    createRoom, joinRoom, leaveRoom,
    updateSettings, selectPack, startGame,
    submitMeme, moveToVoting, vote,
    nextMemeOrResults, nextRound, newGame,
    setError,
    createLibrary, deleteLibrary, addMemeToLibrary, removeMemeFromLibrary,
  }
}
