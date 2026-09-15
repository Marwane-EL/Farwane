"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { Player, Meme, MemePack, MemeLibrary, GamePhase, GameSettings, NichePoolItem } from "@/types/game"
import { getCachedPacks } from "@/lib/packs-cache"
import { getApiBase } from "@/lib/utils"

const avatars = ["🎮", "🔥", "👑", "💀", "🚀", "🎲", "🎯", "⚡", "🌟", "🎪", "🦄", "🐉"]

const DEFAULT_SETTINGS: GameSettings = {
  timerDuration: 90,
  totalRounds: 5,
  maxPlayers: 8,
  gameMode: "classic",
  maxRefreshes: 5,
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

// Pick a niche according to game mode and max 2 occurrences rule
function drawNiche(
  pool: import("@/types/game").NichePoolItem[],
  usedCounts: Record<string, number>,
  gameMode: import("@/types/game").GameMode
): import("@/types/game").NichePoolItem | null {
  if (gameMode !== "niche" || pool.length === 0) return null

  // A niche can appear at most 2 times in the entire game
  const available = pool.filter((n) => (usedCounts[n.id] || 0) < 2)
  if (available.length === 0) {
    // If somehow all reached 2, fallback to least used
    const minUsage = Math.min(...pool.map((n) => usedCounts[n.id] || 0))
    const candidates = pool.filter((n) => (usedCounts[n.id] || 0) === minUsage)
    const picked = candidates[Math.floor(Math.random() * candidates.length)]
    usedCounts[picked.id] = (usedCounts[picked.id] || 0) + 1
    return picked
  }

  // Prioritize niches with the fewest uses (e.g. 0 uses before 1 use)
  const minUsage = Math.min(...available.map((n) => usedCounts[n.id] || 0))
  const candidates = available.filter((n) => (usedCounts[n.id] || 0) === minUsage)
  const picked = candidates[Math.floor(Math.random() * candidates.length)]
  usedCounts[picked.id] = (usedCounts[picked.id] || 0) + 1
  return picked
}

const SESSION_STORAGE_KEY = "farwane_active_session_v1"

interface StoredSession {
  roomCode: string
  player: Player
  phase: GamePhase
  currentRound: number
  playerScores: Record<string, number>
  submissions: Meme[]
  currentMemeIndex: number
  myMemeUrl: string
  hasSubmitted: boolean
  refreshesLeft: number
  hasUsedHeart: boolean
  settings: GameSettings
  selectedPack: MemePack | null
  currentNiche: NichePoolItem | null
  roundStartedAt?: number
  assignments?: Record<string, string>
}

export function useGameRoom() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const playerIdRef = useRef<string>("")
  const usedMemeUrlsRef = useRef<Set<string>>(new Set())
  const usedNicheCountRef = useRef<Record<string, number>>({})

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
  const [roundStartedAt, setRoundStartedAt] = useState<number | undefined>(undefined)

  // Niche state
  const [nichePool, setNichePool] = useState<NichePoolItem[]>([])
  const [currentNiche, setCurrentNiche] = useState<NichePoolItem | null>(null)

  // Meme packs from Supabase
  const [memePacks, setMemePacks] = useState<MemePack[]>([])
  const [packsLoading, setPacksLoading] = useState(true)

  // Game state
  const [selectedPack, setSelectedPack] = useState<MemePack | null>(null)
  const [myMemeUrl, setMyMemeUrl] = useState("")
  const [submissions, setSubmissions] = useState<Meme[]>([])
  const [currentMemeIndex, setCurrentMemeIndex] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [refreshesLeft, setRefreshesLeft] = useState(DEFAULT_SETTINGS.maxRefreshes)
  const [hasUsedHeart, setHasUsedHeart] = useState(false)

  // Synced voting state
  const [hasVotedOnCurrent, setHasVotedOnCurrent] = useState(false)
  const [currentVoters, setCurrentVoters] = useState<string[]>([])

  // Libraries (persisted in localStorage)
  const [libraries, setLibraries] = useState<MemeLibrary[]>([])

  // Up-to-date refs to prevent stale closure bugs during real-time sync
  const phaseRef = useRef<GamePhase>(phase)
  const settingsRef = useRef<GameSettings>(settings)
  const selectedPackRef = useRef<MemePack | null>(selectedPack)
  const currentRoundRef = useRef<number>(currentRound)
  const playerScoresRef = useRef<Record<string, number>>(playerScores)
  const submissionsRef = useRef<Meme[]>(submissions)
  const currentMemeIndexRef = useRef<number>(currentMemeIndex)
  const currentNicheRef = useRef<NichePoolItem | null>(currentNiche)
  const nichePoolRef = useRef<NichePoolItem[]>(nichePool)
  const roundStartedAtRef = useRef<number | undefined>(roundStartedAt)
  const currentAssignmentsRef = useRef<Record<string, string>>({})
  const currentPlayerRef = useRef<Player | null>(currentPlayer)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => { settingsRef.current = settings }, [settings])
  useEffect(() => { selectedPackRef.current = selectedPack }, [selectedPack])
  useEffect(() => { currentRoundRef.current = currentRound }, [currentRound])
  useEffect(() => { playerScoresRef.current = playerScores }, [playerScores])
  useEffect(() => { submissionsRef.current = submissions }, [submissions])
  useEffect(() => { currentMemeIndexRef.current = currentMemeIndex }, [currentMemeIndex])
  useEffect(() => { currentNicheRef.current = currentNiche }, [currentNiche])
  useEffect(() => { nichePoolRef.current = nichePool }, [nichePool])
  useEffect(() => { roundStartedAtRef.current = roundStartedAt }, [roundStartedAt])
  useEffect(() => { currentPlayerRef.current = currentPlayer }, [currentPlayer])

  // Initial load: setup persistent player id & auto-reconnect if session exists
  useEffect(() => {
    let id = sessionStorage.getItem("player_id")
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem("player_id", id)
    }
    playerIdRef.current = id

    // Auto-reconnect if session exists
    const rawSession = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (rawSession) {
      try {
        const saved = JSON.parse(rawSession) as StoredSession
        if (saved && saved.roomCode && saved.player) {
          supabase
            .from("rooms")
            .select("code, status, host_id")
            .eq("code", saved.roomCode)
            .single()
            .then(({ data: roomData, error: roomError }) => {
              if (!roomError && roomData && roomData.status !== "closed") {
                const isHost = roomData.host_id === saved.player.id
                const restoredPlayer: Player = {
                  ...saved.player,
                  isHost,
                }
                setRoomCode(saved.roomCode)
                setCurrentPlayer(restoredPlayer)
                setPhase(saved.phase)
                setCurrentRound(saved.currentRound || 1)
                setPlayerScores(saved.playerScores || {})
                setSubmissions(saved.submissions || [])
                setCurrentMemeIndex(saved.currentMemeIndex || 0)
                setMyMemeUrl(saved.myMemeUrl || "")
                setHasSubmitted(saved.hasSubmitted || false)
                setRefreshesLeft(saved.refreshesLeft ?? DEFAULT_SETTINGS.maxRefreshes)
                setHasUsedHeart(saved.hasUsedHeart || false)
                if (saved.settings) setSettings(saved.settings)
                if (saved.selectedPack) setSelectedPack(saved.selectedPack)
                if (saved.currentNiche) setCurrentNiche(saved.currentNiche)
                if (saved.roundStartedAt) setRoundStartedAt(saved.roundStartedAt)
                if (saved.assignments) currentAssignmentsRef.current = saved.assignments

                subscribeToRoom(saved.roomCode, restoredPlayer, true)
              } else {
                sessionStorage.removeItem(SESSION_STORAGE_KEY)
              }
            })
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
  }, [])

  // Persist session to sessionStorage whenever meaningful state changes
  useEffect(() => {
    if (typeof window === "undefined") return
    if (!roomCode || !currentPlayer || phase === "home") {
      sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return
    }

    const sessionData: StoredSession = {
      roomCode,
      player: currentPlayer,
      phase,
      currentRound,
      playerScores,
      submissions,
      currentMemeIndex,
      myMemeUrl,
      hasSubmitted,
      refreshesLeft,
      hasUsedHeart,
      settings,
      selectedPack,
      currentNiche,
      roundStartedAt,
      assignments: currentAssignmentsRef.current,
    }
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
    } catch {
      // storage quota or private browsing
    }
  }, [
    roomCode, currentPlayer, phase, currentRound,
    playerScores, submissions, currentMemeIndex,
    myMemeUrl, hasSubmitted, refreshesLeft,
    hasUsedHeart, settings, selectedPack, currentNiche, roundStartedAt
  ])

  // Sync room code to URL (?room=CODE) and clear when leaving
  useEffect(() => {
    if (typeof window === "undefined") return
    if (roomCode && phase !== "home") {
      const currentUrl = new URL(window.location.href)
      if (currentUrl.searchParams.get("room") !== roomCode) {
        currentUrl.searchParams.set("room", roomCode)
        window.history.replaceState(null, "", currentUrl.toString())
      }
    } else if (phase === "home") {
      const currentUrl = new URL(window.location.href)
      if (currentUrl.searchParams.has("room")) {
        currentUrl.searchParams.delete("room")
        window.history.replaceState(null, "", currentUrl.pathname + (currentUrl.search ? currentUrl.search : ""))
      }
    }
  }, [roomCode, phase])

  useEffect(() => {
    async function fetchMemePacks() {
      const TENOR_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

      try {
        const packs = await getCachedPacks(async () => {
          const { data, error: fetchErr } = await supabase
            .from("meme_packs")
            .select("id, name, memes, is_default")
            .order("created_at", { ascending: true })
          if (fetchErr || !data) throw fetchErr ?? new Error("No data")
          return data.map((row) => ({
            id: row.id,
            name: row.name,
            memes: (row.memes as string[]) || [],
            isDefault: row.is_default,
          }))
        })

        const allUrls = packs.flatMap((p) => p.memes)
        const now = Date.now()

        type TenorCacheEntry = { resolved: string; cachedAt: number }
        const rawCache = JSON.parse(localStorage.getItem("tenor_url_cache_v2") || "{}")
        const tenorCache: Record<string, TenorCacheEntry> = rawCache

        const urlsToResolve = allUrls.filter((url) => {
          if (!url.includes("tenor.com/view/")) return false
          const entry = tenorCache[url]
          if (!entry) return true
          return now - entry.cachedAt > TENOR_CACHE_TTL_MS
        })

        if (urlsToResolve.length > 0) {
          try {
            const apiBase = getApiBase()
            const res = await fetch(`${apiBase}/api/resolve-urls`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ urls: urlsToResolve }),
            })
            const { resolved } = await res.json()
            urlsToResolve.forEach((url, i) => {
              if (resolved[i] && resolved[i] !== url) {
                tenorCache[url] = { resolved: resolved[i], cachedAt: now }
              }
            })
            localStorage.setItem("tenor_url_cache_v2", JSON.stringify(tenorCache))
          } catch {
            console.error("Failed to resolve Tenor URLs")
          }
        }

        const resolvedPacks = packs.map((pack) => ({
          ...pack,
          memes: pack.memes.map((url) => tenorCache[url]?.resolved || url),
        }))

        setMemePacks(resolvedPacks)

        const currentLibraries: MemeLibrary[] = JSON.parse(
          localStorage.getItem("meme_libraries") || "[]"
        )
        const allOptions: MemePack[] = [
          ...resolvedPacks,
          ...currentLibraries
            .filter((lib) => lib.memes.length >= 3)
            .map((lib) => ({ id: lib.id, name: lib.name, memes: lib.memes, isDefault: false })),
        ]
        if (allOptions.length > 0) {
          const best = allOptions.reduce((a, b) => (b.memes.length > a.memes.length ? b : a))
          setSelectedPack(best)
        }
      } catch {
        console.error("Failed to fetch meme packs")
      } finally {
        setPacksLoading(false)
      }
    }
    fetchMemePacks()
  }, [])

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
  const subscribeToRoom = useCallback((code: string, player: Player, isReconnect = false, isLateJoin = false) => {
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

    // Niche pool sync
    channel.on("broadcast", { event: "niche:pool-sync" }, ({ payload }) => {
      setNichePool(payload.pool)
    })

    // Niche drawn for this round
    channel.on("broadcast", { event: "niche:round" }, ({ payload }) => {
      setCurrentNiche(payload.niche ?? null)
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
      setRefreshesLeft(payload.settings?.maxRefreshes ?? DEFAULT_SETTINGS.maxRefreshes)
      setCurrentNiche(payload.niche ?? null)
      if (payload.roundStartedAt) {
        setRoundStartedAt(payload.roundStartedAt)
        roundStartedAtRef.current = payload.roundStartedAt
      }
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
      setRefreshesLeft(payload.settings?.maxRefreshes ?? settings.maxRefreshes ?? DEFAULT_SETTINGS.maxRefreshes)
      setCurrentMemeIndex(0)
      setCurrentNiche(payload.niche ?? null)
      if (payload.roundStartedAt) {
        setRoundStartedAt(payload.roundStartedAt)
        roundStartedAtRef.current = payload.roundStartedAt
      }
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
      setHasUsedHeart(false)
      setCurrentNiche(null)
      setRoundStartedAt(undefined)
      currentAssignmentsRef.current = {}
    })

    // ─── Late Joiner & Reconnection State Sync ─────────────────────────────────
    // Host listens for sync requests from reconnecting or late-joining players
    channel.on("broadcast", { event: "game:request-sync" }, ({ payload }) => {
      if (!currentPlayerRef.current?.isHost || !channelRef.current) return
      const joiningPlayer = payload?.player as Player | undefined
      if (!joiningPlayer) return

      // If in creation phase and this player does not have a meme, assign one!
      if (phaseRef.current === "creation" && selectedPackRef.current) {
        if (!currentAssignmentsRef.current[joiningPlayer.id]) {
          const available = selectedPackRef.current.memes.filter(
            (u) => !usedMemeUrlsRef.current.has(u)
          )
          const pool = available.length > 0 ? available : selectedPackRef.current.memes
          const assigned = pool[Math.floor(Math.random() * pool.length)]
          usedMemeUrlsRef.current.add(assigned)
          currentAssignmentsRef.current[joiningPlayer.id] = assigned
        }
      }

      channelRef.current.send({
        type: "broadcast",
        event: "game:sync-state",
        payload: {
          targetPlayerId: joiningPlayer.id,
          phase: phaseRef.current,
          settings: settingsRef.current,
          selectedPack: selectedPackRef.current,
          currentRound: currentRoundRef.current,
          playerScores: playerScoresRef.current,
          submissions: submissionsRef.current,
          currentMemeIndex: currentMemeIndexRef.current,
          currentNiche: currentNicheRef.current,
          nichePool: nichePoolRef.current,
          roundStartedAt: roundStartedAtRef.current,
          assignments: currentAssignmentsRef.current,
        },
      })
    })

    // Player receives authoritative state snapshot
    channel.on("broadcast", { event: "game:sync-state" }, ({ payload }) => {
      if (payload?.targetPlayerId && payload.targetPlayerId !== playerIdRef.current) return

      if (payload.phase) setPhase(payload.phase)
      if (payload.settings) setSettings(payload.settings)
      if (payload.selectedPack) setSelectedPack(payload.selectedPack)
      if (typeof payload.currentRound === "number") setCurrentRound(payload.currentRound)
      if (payload.playerScores) setPlayerScores(payload.playerScores)
      if (payload.submissions) {
        setSubmissions(payload.submissions)
        // If my submission is already in the list, mark as submitted
        if (payload.submissions.some((s: Meme) => s.playerId === playerIdRef.current)) {
          setHasSubmitted(true)
        }
      }
      if (typeof payload.currentMemeIndex === "number") setCurrentMemeIndex(payload.currentMemeIndex)
      if (payload.currentNiche !== undefined) setCurrentNiche(payload.currentNiche)
      if (payload.nichePool) setNichePool(payload.nichePool)
      if (payload.roundStartedAt) {
        setRoundStartedAt(payload.roundStartedAt)
        roundStartedAtRef.current = payload.roundStartedAt
      }
      if (payload.assignments) {
        currentAssignmentsRef.current = payload.assignments
        if (payload.assignments[playerIdRef.current]) {
          setMyMemeUrl(payload.assignments[playerIdRef.current])
        }
      }
      setIsLoading(false)
    })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(player)
        // If not host, immediately request the current game state
        if (!player.isHost) {
          channel.send({
            type: "broadcast",
            event: "game:request-sync",
            payload: { player, isReconnect, isLateJoin },
          })
        }
      }
    })

    channelRef.current = channel
  }, [])

  // --- Actions ---

  const createRoom = useCallback(async (pseudo: string) => {
    setIsLoading(true)
    setError(null)
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
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
      const formattedCode = code.trim().toUpperCase()
      const { data, error: fetchError } = await supabase
        .from("rooms").select("code, status, host_id").eq("code", formattedCode).single()
      if (fetchError || !data) {
        setError("Salon introuvable ! Vérifie le code.")
        return
      }
      if (data.status === "closed") {
        setError("Cette partie est terminée !")
        return
      }

      const isHost = data.host_id === playerIdRef.current
      const player: Player = {
        id: playerIdRef.current, pseudo: pseudo.trim(),
        avatar: getRandomAvatar(), score: 0, isHost,
      }
      setCurrentPlayer(player)
      setRoomCode(formattedCode)

      if (data.status === "waiting") {
        setPhase("lobby")
        subscribeToRoom(formattedCode, player)
      } else {
        // Status is "playing" — allowed to join an ongoing game!
        subscribeToRoom(formattedCode, player, false, true /* isLateJoin */)
      }
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
    usedNicheCountRef.current = {}
    const playerIds = players.map((p) => p.id)
    const assignments = assignRandomMemes(playerIds, selectedPack.memes, usedMemeUrlsRef.current)
    currentAssignmentsRef.current = assignments

    // Draw niche for round 1
    const niche = drawNiche(nichePool, usedNicheCountRef.current, settings.gameMode)
    const now = Date.now()

    setMyMemeUrl(assignments[playerIdRef.current] || "")
    setCurrentNiche(niche)
    setRoundStartedAt(now)
    roundStartedAtRef.current = now
    setPhase("creation")
    setCurrentRound(1)
    setPlayerScores({})
    setSubmissions([])
    setHasSubmitted(false)
    setRefreshesLeft(settings.maxRefreshes)
    setHasUsedHeart(false)
    channelRef.current.send({
      type: "broadcast", event: "game:start",
      payload: { pack: selectedPack, assignments, settings, niche, roundStartedAt: now },
    })
  }, [currentPlayer, selectedPack, roomCode, settings, players, nichePool])

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

  const vote = useCallback((memeId: string, score: number, isHeart: boolean = false) => {
    if (!channelRef.current || !currentPlayer || hasVotedOnCurrent) return
    if (isHeart && hasUsedHeart) return // Security check

    const finalScore = isHeart ? score + 10 : score
    
    setHasVotedOnCurrent(true)
    if (isHeart) setHasUsedHeart(true)
    
    setCurrentVoters((prev) => prev.includes(currentPlayer.id) ? prev : [...prev, currentPlayer.id])
    setSubmissions((prev) => prev.map((m) => (m.id === memeId ? { ...m, votes: m.votes + finalScore } : m)))
    channelRef.current.send({
      type: "broadcast", event: "game:vote",
      payload: { memeId, score: finalScore, voterId: currentPlayer.id },
    })
  }, [currentPlayer, hasVotedOnCurrent, hasUsedHeart])

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
      const timer = setTimeout(() => advanceMeme(), 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, currentPlayer, submissions, currentMemeIndex, currentVoters, players, advanceMeme])

  // Host auto-advance: when all players have submitted their memes
  useEffect(() => {
    if (phase !== "creation" || !currentPlayer?.isHost) return
    if (submissions.length > 0 && submissions.length >= players.length) {
      const timer = setTimeout(() => moveToVoting(), 2000)
      return () => clearTimeout(timer)
    }
  }, [phase, currentPlayer, submissions.length, players.length, moveToVoting])

  // Host fallback timer: advance after 20s even if not all voted
  useEffect(() => {
    if (phase !== "voting" || !currentPlayer?.isHost) return
    const timer = setTimeout(() => advanceMeme(), 20000)
    return () => clearTimeout(timer)
  }, [phase, currentPlayer, currentMemeIndex, advanceMeme])

  const nextRound = useCallback(() => {
    if (!currentPlayer?.isHost || !channelRef.current || !selectedPack) return

    if (currentRound >= settings.totalRounds) {
      setPhase("final-results")
      channelRef.current.send({
        type: "broadcast", event: "game:final",
        payload: { scores: playerScores },
      })
    } else {
      const nextRoundNum = currentRound + 1
      const playerIds = players.map((p) => p.id)
      const assignments = assignRandomMemes(playerIds, selectedPack.memes, usedMemeUrlsRef.current)
      currentAssignmentsRef.current = assignments

      const niche = drawNiche(nichePool, usedNicheCountRef.current, settings.gameMode)
      const now = Date.now()

      setMyMemeUrl(assignments[playerIdRef.current] || "")
      setCurrentNiche(niche)
      setRoundStartedAt(now)
      roundStartedAtRef.current = now
      setPhase("creation")
      setCurrentRound(nextRoundNum)
      setSubmissions([])
      setHasSubmitted(false)
      setRefreshesLeft(settings.maxRefreshes)
      setCurrentMemeIndex(0)
      channelRef.current.send({
        type: "broadcast", event: "game:next-round",
        payload: { assignments, round: nextRoundNum, niche, settings, roundStartedAt: now },
      })
    }
  }, [currentPlayer, selectedPack, currentRound, settings, playerScores, players, nichePool])

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
    setHasUsedHeart(false)
    setCurrentNiche(null)
    setRoundStartedAt(undefined)
    currentAssignmentsRef.current = {}
    usedNicheCountRef.current = {}
    usedMemeUrlsRef.current.clear()
    await supabase.from("rooms").update({ status: "waiting" }).eq("code", roomCode)
    channelRef.current.send({ type: "broadcast", event: "game:new-game", payload: {} })
  }, [currentPlayer, roomCode])

  const leaveRoom = useCallback(async () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY)
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/")
    }
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
    setHasUsedHeart(false)
    setError(null)
    setCurrentRound(1)
    setPlayerScores({})
    setSettings(DEFAULT_SETTINGS)
    setRoundStartedAt(undefined)
    currentAssignmentsRef.current = {}
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

  // ─── Niche pool actions ──────────────────────────────────────────────────────

  const addNicheToPool = useCallback((text: string, playerId: string) => {
    if (!channelRef.current) return
    const clean = text.trim().slice(0, 100)
    if (!clean) return
    setNichePool((prev) => {
      if (prev.some((n) => n.text.toLowerCase() === clean.toLowerCase())) return prev
      const next: NichePoolItem[] = [
        ...prev,
        { id: `n_${Math.random().toString(36).slice(2, 8)}`, text: clean, addedBy: playerId },
      ]
      channelRef.current?.send({ type: "broadcast", event: "niche:pool-sync", payload: { pool: next } })
      return next
    })
  }, [])

  

  const clearNichePool = useCallback((isHost: boolean) => {
    if (!channelRef.current || !isHost) return
    setNichePool([])
    channelRef.current?.send({ type: "broadcast", event: "niche:pool-sync", payload: { pool: [] } })
  }, [])

  const removeNicheFromPool = useCallback((id: string, requesterId: string, isHost: boolean) => {
    if (!channelRef.current) return
    setNichePool((prev) => {
      const target = prev.find((n) => n.id === id)
      if (!target) return prev
      if (!isHost && target.addedBy !== requesterId) return prev
      const next = prev.filter((n) => n.id !== id)
      channelRef.current?.send({ type: "broadcast", event: "niche:pool-sync", payload: { pool: next } })
      return next
    })
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
    settings, currentRound, playerScores, roundStartedAt,
    memePacks, packsLoading,
    selectedPack, myMemeUrl,
    submissions, currentMemeIndex, hasSubmitted,
    hasVotedOnCurrent, currentVoters, hasUsedHeart,
    error, isLoading, libraries,
    nichePool, currentNiche,
    createRoom, joinRoom, leaveRoom,
    updateSettings, selectPack, startGame,
    submitMeme, moveToVoting, vote,
    advanceMeme, nextRound, newGame,
    refreshMeme, refreshesLeft,
    setError,
    createLibrary, deleteLibrary, addMemeToLibrary, removeMemeFromLibrary,
    addNicheToPool, removeNicheFromPool, clearNichePool,
  }
}