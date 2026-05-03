"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Player, Meme, MemePack, MemeLibrary, GamePhase, GameSettings } from "@/types/game"


const avatars = ["🎮", "🔥", "👑", "💀", "🚀", "🎲", "🎯", "⚡", "🌟", "🎪", "🦄", "🐉"]

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

// Assign a unique random meme to each player, avoiding recently used ones
function assignRandomMemes(
  playerIds: string[],
  allMemes: string[],
  usedUrls: Set<string>
): Record<string, string> {
  let available = allMemes.filter((url) => !usedUrls.has(url))
  // Reset if not enough available
  if (available.length < playerIds.length) {
    usedUrls.clear()
    available = [...allMemes]
  }
  // Shuffle (Fisher-Yates)
  const shuffled = [...available]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const assignments: Record<string, string> = {}
  playerIds.forEach((id, i) => {
    assignments[id] = shuffled[i % shuffled.length]
    usedUrls.add(shuffled[i % shuffled.length])
  })
  return assignments
}

export function useGameRoom() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const playerIdRef = useRef<string>("")
  const usedMemeUrlsRef = useRef<Set<string>>(new Set())

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

  // Meme packs from Supabase
  const [memePacks, setMemePacks] = useState<MemePack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)

  useEffect(() => {
    async function fetchMemePacks() {
      try {
        const { data, error: fetchErr } = await supabase
          .from("meme_packs")
          .select("*")
          .order("created_at", { ascending: true })
        if (!fetchErr && data) {
          const packs: MemePack[] = data.map((row) => ({
            id: row.id,
            name: row.name,
            memes: (row.memes as string[]) || [],
            isDefault: row.is_default,
          }))

          // Resolve Tenor page URLs → direct media URLs (with cache)
          const allUrls = packs.flatMap((p) => p.memes)
          const cache: Record<string, string> = JSON.parse(
            localStorage.getItem("tenor_url_cache") || "{}"
          )
          const urlsToResolve = allUrls.filter(
            (url) => url.includes("tenor.com/view/") && !cache[url]
          )

          if (urlsToResolve.length > 0) {
            try {
              const res = await fetch("/api/resolve-urls", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls: urlsToResolve }),
              })
              const { resolved } = await res.json()
              urlsToResolve.forEach((url, i) => {
                if (resolved[i] && resolved[i] !== url) {
                  cache[url] = resolved[i]
                }
              })
              localStorage.setItem("tenor_url_cache", JSON.stringify(cache))
            } catch {
              console.error("Failed to resolve Tenor URLs")
            }
          }

          // Apply cache: replace Tenor page URLs with resolved media URLs
          for (const pack of packs) {
            pack.memes = pack.memes.map((url) => cache[url] || url)
          }

          setMemePacks(packs)
        }
      } catch {
        console.error("Failed to fetch meme packs")
      } finally {
        setPacksLoading(false)
      }
    }
    fetchMemePacks()
  }, [])

  // Game state
  const [selectedPack, setSelectedPack] = useState<MemePack | null>(null)
  const [myMemeUrl, setMyMemeUrl] = useState("")
  const [submissions, setSubmissions] = useState<Meme[]>([])
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [refreshesLeft, setRefreshesLeft] = useState(5)

  // Synced voting state
  const [hasVotedOnCurrent, setHasVotedOnCurrent] = useState(false)
  const [currentVoters, setCurrentVoters] = useState<string[]>([])

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
      setMyMemeUrl(payload.assignments[playerIdRef.current] || "")
      setSettings(payload.settings)
      setCurrentRound(1)
      setPlayerScores({})
      setSubmissions([])
      setHasSubmitted(false)
      setRefreshesLeft(5)
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
      setHasVotedOnCurrent(false)
      setCurrentVoters([])
    })

    // Vote received
    channel.on("broadcast", { event: "game:vote" }, ({ payload }) => {
      setSubmissions((prev) =>
        prev.map((m) => (m.id === payload.memeId ? { ...m, votes: m.votes + payload.score } : m))
      )
      setCurrentVoters((prev) => prev.includes(payload.voterId) ? prev : [...prev, payload.voterId])
    })

    // Host advances everyone to next meme
    channel.on("broadcast", { event: "game:advance-meme" }, ({ payload }) => {
      setCurrentMemeIndex(payload.nextIndex)
      setHasVotedOnCurrent(false)
      setCurrentVoters([])
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
      setMyMemeUrl(payload.assignments[playerIdRef.current] || "")
      setCurrentRound(payload.round)
      setSubmissions([])
      setHasSubmitted(false)
      setRefreshesLeft(5)
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
      setMyMemeUrl("")
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
    usedMemeUrlsRef.current.clear()
    const playerIds = players.map((p) => p.id)
    const assignments = assignRandomMemes(playerIds, selectedPack.memes, usedMemeUrlsRef.current)
    setMyMemeUrl(assignments[playerIdRef.current] || "")
    setPhase("creation")
    setCurrentRound(1)
    setPlayerScores({})
    setSubmissions([])
    setHasSubmitted(false)
    setRefreshesLeft(5)
    channelRef.current.send({
      type: "broadcast", event: "game:start",
      payload: { pack: selectedPack, assignments, settings },
    })
  }, [currentPlayer, selectedPack, roomCode, settings, players])

  const submitMeme = useCallback((caption: string) => {
    if (!channelRef.current || !currentPlayer || hasSubmitted) return
    const meme: Meme = {
      id: crypto.randomUUID(), playerId: currentPlayer.id,
      playerPseudo: currentPlayer.pseudo,
      imageUrl: myMemeUrl,
      caption, votes: 0,
    }
    setHasSubmitted(true)
    setSubmissions((prev) => [...prev, meme])
    channelRef.current.send({ type: "broadcast", event: "game:submit", payload: { meme } })
  }, [currentPlayer, myMemeUrl, hasSubmitted])

  const moveToVoting = useCallback(() => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setPhase("voting")
    setCurrentMemeIndex(0)
    setHasVotedOnCurrent(false)
    setCurrentVoters([])
    channelRef.current.send({ type: "broadcast", event: "game:voting", payload: { submissions } })
  }, [currentPlayer, submissions])

  const vote = useCallback((memeId: string, score: number) => {
    if (!channelRef.current || !currentPlayer || hasVotedOnCurrent) return
    setHasVotedOnCurrent(true)
    setCurrentVoters((prev) => [...prev, currentPlayer.id])
    setSubmissions((prev) => prev.map((m) => (m.id === memeId ? { ...m, votes: m.votes + score } : m)))
    channelRef.current.send({
      type: "broadcast", event: "game:vote",
      payload: { memeId, score, voterId: currentPlayer.id },
    })
  }, [currentPlayer, hasVotedOnCurrent])

  // Host: advance to next meme (used by auto-advance and force-advance)
  const advanceMeme = useCallback(() => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    if (currentMemeIndex < submissions.length - 1) {
      const nextIdx = currentMemeIndex + 1
      setCurrentMemeIndex(nextIdx)
      setHasVotedOnCurrent(false)
      setCurrentVoters([])
      channelRef.current.send({
        type: "broadcast", event: "game:advance-meme",
        payload: { nextIndex: nextIdx },
      })
    } else {
      // Last meme → results
      setTimeout(() => {
        const newScores = { ...playerScores }
        for (const sub of submissions) {
          newScores[sub.playerId] = (newScores[sub.playerId] || 0) + sub.votes
        }
        setPlayerScores(newScores)
        setPhase("results")
        channelRef.current?.send({
          type: "broadcast", event: "game:results",
          payload: { submissions, scores: newScores, currentRound },
        })
      }, 0)
    }
  }, [currentPlayer, currentMemeIndex, submissions, playerScores, currentRound])

  // Host auto-advance: when all eligible players have voted
  useEffect(() => {
    if (phase !== "voting" || !currentPlayer?.isHost) return
    const currentMeme = submissions[currentMemeIndex]
    if (!currentMeme) return
    const eligibleVoters = players.filter((p) => p.id !== currentMeme.playerId).length
    if (eligibleVoters > 0 && currentVoters.length >= eligibleVoters) {
      // Small delay so last voter sees their vote registered
      const timer = setTimeout(() => advanceMeme(), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, currentPlayer, submissions, currentMemeIndex, currentVoters, players, advanceMeme])

  // Host fallback timer: advance after 20s even if not all voted
  useEffect(() => {
    if (phase !== "voting" || !currentPlayer?.isHost) return
    const timer = setTimeout(() => advanceMeme(), 20000)
    return () => clearTimeout(timer)
  }, [phase, currentPlayer, currentMemeIndex, advanceMeme])

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
      const playerIds = players.map((p) => p.id)
      const assignments = assignRandomMemes(playerIds, selectedPack.memes, usedMemeUrlsRef.current)
      setMyMemeUrl(assignments[playerIdRef.current] || "")
      setPhase("creation")
      setCurrentRound(nextRoundNum)
      setSubmissions([])
      setHasSubmitted(false)
      setRefreshesLeft(5)
      setCurrentMemeIndex(0)
      channelRef.current.send({
        type: "broadcast", event: "game:next-round",
        payload: { assignments, round: nextRoundNum },
      })
    }
  }, [currentPlayer, selectedPack, currentRound, settings.totalRounds, playerScores, players])

  const newGame = useCallback(async () => {
    if (!currentPlayer?.isHost || !channelRef.current) return
    setPhase("lobby")
    setCurrentRound(1)
    setPlayerScores({})
    setSubmissions([])
    setSelectedPack(null)
    setHasSubmitted(false)
    setCurrentMemeIndex(0)
    setMyMemeUrl("")
    usedMemeUrlsRef.current.clear()
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
    setMyMemeUrl("")
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

  // Refresh meme functionality
  const refreshMeme = useCallback(() => {
    if (refreshesLeft <= 0 || !selectedPack || hasSubmitted) return

    let available = selectedPack.memes.filter(
      (url) => !usedMemeUrlsRef.current.has(url) && url !== myMemeUrl
    )
    if (available.length === 0) {
      available = selectedPack.memes.filter((url) => url !== myMemeUrl)
      if (available.length === 0) available = selectedPack.memes
    }

    const newMemeUrl = available[Math.floor(Math.random() * available.length)]
    usedMemeUrlsRef.current.add(newMemeUrl)
    setMyMemeUrl(newMemeUrl)
    setRefreshesLeft((prev) => prev - 1)
  }, [refreshesLeft, selectedPack, myMemeUrl, hasSubmitted])

  return {
    phase, roomCode, players, currentPlayer,
    settings, currentRound, playerScores,
    memePacks, packsLoading,
    selectedPack, myMemeUrl,
    submissions, currentMemeIndex, hasSubmitted,
    hasVotedOnCurrent, currentVoters,
    error, isLoading, libraries,
    createRoom, joinRoom, leaveRoom,
    updateSettings, selectPack, startGame,
    submitMeme, moveToVoting, vote,
    advanceMeme, nextRound, newGame,
    refreshMeme, refreshesLeft,
    setError,
    createLibrary, deleteLibrary, addMemeToLibrary, removeMemeFromLibrary,
  }
}
