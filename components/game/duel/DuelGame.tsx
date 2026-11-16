"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Swords, RotateCcw, LogOut, Loader2, Sparkles } from "lucide-react"
import type { DuelEvent, DuelKind, DuelPlayer, RpsChoice } from "@/types/game"
import { PlayerAvatar } from "@/components/game/player-avatar"

interface QueueEntry {
  player: DuelPlayer
  game: DuelKind
}

interface ActiveMatch {
  matchId: string
  game: DuelKind
  opponent: DuelPlayer
  isHost: boolean // host = X in Morpion, and starts match #1
}

interface DuelGameProps {
  me: DuelPlayer
  sendDuelEvent: (event: DuelEvent) => void
  subscribeDuelEvents: (cb: (event: DuelEvent) => void) => () => void
}

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

function getTttWinner(board: (string | null)[]): { winner: "X" | "O" | "draw" | null; line: number[] | null } {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as "X" | "O", line }
    }
  }
  if (board.every((c) => c !== null)) {
    return { winner: "draw", line: null }
  }
  return { winner: null, line: null }
}

const RPS_META: Record<RpsChoice, { emoji: string; label: string; beats: RpsChoice }> = {
  rock: { emoji: "✊", label: "Pierre", beats: "scissors" },
  paper: { emoji: "✋", label: "Feuille", beats: "rock" },
  scissors: { emoji: "✌️", label: "Ciseaux", beats: "paper" },
}

function getRpsOutcome(mine: RpsChoice, theirs: RpsChoice): "win" | "lose" | "draw" {
  if (mine === theirs) return "draw"
  return RPS_META[mine].beats === theirs ? "win" : "lose"
}

export function DuelGame({ me, sendDuelEvent, subscribeDuelEvents }: DuelGameProps) {
  const [selectedKind, setSelectedKind] = useState<DuelKind>("ttt")
  const [isQueuing, setIsQueuing] = useState(false)
  const [queueList, setQueueList] = useState<QueueEntry[]>([])
  const [match, setMatch] = useState<ActiveMatch | null>(null)
  const [opponentLeft, setOpponentLeft] = useState(false)

  // Morpion state
  const [tttBoard, setTttBoard] = useState<(string | null)[]>(Array(9).fill(null))
  const [tttStarter, setTttStarter] = useState<"host" | "guest">("host")
  const [tttTurn, setTttTurn] = useState<"X" | "O">("X")
  const [scores, setScores] = useState({ me: 0, opponent: 0 })

  // RPS (BO3) state
  const [rpsRound, setRpsRound] = useState(1)
  const [myPick, setMyPick] = useState<RpsChoice | null>(null)
  const [oppPick, setOppPick] = useState<RpsChoice | null>(null)
  const [rpsSeriesOver, setRpsSeriesOver] = useState(false)

  // Refs for stable event handler
  const isQueuingRef = useRef(isQueuing)
  const selectedKindRef = useRef(selectedKind)
  const matchRef = useRef(match)
  const rpsRoundRef = useRef(rpsRound)
  isQueuingRef.current = isQueuing
  selectedKindRef.current = selectedKind
  matchRef.current = match
  rpsRoundRef.current = rpsRound

  const resetMatchState = useCallback((nextStarter: "host" | "guest" = "host") => {
    setTttBoard(Array(9).fill(null))
    setTttStarter(nextStarter)
    setTttTurn(nextStarter === "host" ? "X" : "O")
    setRpsRound(1)
    setMyPick(null)
    setOppPick(null)
    setRpsSeriesOver(false)
    setOpponentLeft(false)
  }, [])

  // Announce presence on mount & clean up on unmount
  useEffect(() => {
    sendDuelEvent({ type: "duel:hello", playerId: me.id })
    return () => {
      if (isQueuingRef.current) {
        sendDuelEvent({ type: "duel:cancel", playerId: me.id })
      }
      if (matchRef.current) {
        sendDuelEvent({ type: "duel:leave", matchId: matchRef.current.matchId, playerId: me.id })
      }
    }
  }, [me.id, sendDuelEvent])

  // Subscribe to duel events
  useEffect(() => {
    return subscribeDuelEvents((ev) => {
      if (ev.type === "duel:hello") {
        if (ev.playerId !== me.id && isQueuingRef.current) {
          sendDuelEvent({ type: "duel:queue", player: me, game: selectedKindRef.current })
        }
        return
      }

      if (ev.type === "duel:queue") {
        if (ev.player.id === me.id) return
        setQueueList((prev) => {
          const filtered = prev.filter((q) => q.player.id !== ev.player.id)
          return [...filtered, { player: ev.player, game: ev.game }]
        })
        return
      }

      if (ev.type === "duel:cancel") {
        setQueueList((prev) => prev.filter((q) => q.player.id !== ev.playerId))
        return
      }

      if (ev.type === "duel:accept") {
        setQueueList((prev) =>
          prev.filter((q) => q.player.id !== ev.host.id && q.player.id !== ev.guest.id)
        )
        if (ev.host.id === me.id || ev.guest.id === me.id) {
          const amHost = ev.host.id === me.id
          setIsQueuing(false)
          setMatch({
            matchId: ev.matchId,
            game: ev.game,
            opponent: amHost ? ev.guest : ev.host,
            isHost: amHost,
          })
          setScores({ me: 0, opponent: 0 })
          resetMatchState("host")
        }
        return
      }

      const active = matchRef.current
      if (!active || !("matchId" in ev) || ev.matchId !== active.matchId) return

      if (ev.type === "duel:leave") {
        if (ev.playerId !== me.id) {
          setOpponentLeft(true)
        }
        return
      }

      if (ev.type === "duel:move") {
        if (ev.playerId === me.id) return
        const oppSymbol = active.isHost ? "O" : "X"
        const mySymbol = active.isHost ? "X" : "O"
        setTttBoard((prev) => {
          if (prev[ev.index] !== null) return prev
          const next = [...prev]
          next[ev.index] = oppSymbol
          const res = getTttWinner(next)
          if (res.winner === oppSymbol) {
            setScores((s) => ({ ...s, opponent: s.opponent + 1 }))
          }
          return next
        })
        setTttTurn(mySymbol)
        return
      }

      if (ev.type === "duel:rps_pick") {
        if (ev.playerId === me.id) return
        if (ev.round === rpsRoundRef.current) {
          setOppPick(ev.choice)
        }
        return
      }

      if (ev.type === "duel:rematch") {
        if (active.game === "ttt") {
          setTttStarter((prevStarter) => {
            const nextStarter = prevStarter === "host" ? "guest" : "host"
            resetMatchState(nextStarter)
            return nextStarter
          })
        } else {
          setScores({ me: 0, opponent: 0 })
          resetMatchState("host")
        }
      }
    })
  }, [me, resetMatchState, sendDuelEvent, subscribeDuelEvents])

  // Evaluate RPS round when both players have picked
  useEffect(() => {
    if (!match || match.game !== "rps" || !myPick || !oppPick) return
    const outcome = getRpsOutcome(myPick, oppPick)
    if (outcome === "win") {
      setScores((prev) => {
        const nextMe = prev.me + 1
        if (nextMe >= 2) setRpsSeriesOver(true)
        return { ...prev, me: nextMe }
      })
    } else if (outcome === "lose") {
      setScores((prev) => {
        const nextOpp = prev.opponent + 1
        if (nextOpp >= 2) setRpsSeriesOver(true)
        return { ...prev, opponent: nextOpp }
      })
    }
  }, [match, myPick, oppPick])

  const toggleQueue = (kind?: DuelKind) => {
    const targetKind = kind ?? selectedKind
    if (isQueuing) {
      setIsQueuing(false)
      sendDuelEvent({ type: "duel:cancel", playerId: me.id })
    } else {
      setSelectedKind(targetKind)
      setIsQueuing(true)
      sendDuelEvent({ type: "duel:queue", player: me, game: targetKind })
    }
  }

  const acceptChallenge = (entry: QueueEntry) => {
    const matchId = crypto.randomUUID()
    const payload: DuelEvent = {
      type: "duel:accept",
      matchId,
      game: entry.game,
      host: entry.player,
      guest: me,
    }
    sendDuelEvent(payload)
    setQueueList((prev) => prev.filter((q) => q.player.id !== entry.player.id))
    setIsQueuing(false)
    setMatch({
      matchId,
      game: entry.game,
      opponent: entry.player,
      isHost: false,
    })
    setScores({ me: 0, opponent: 0 })
    resetMatchState("host")
  }

  const leaveMatch = () => {
    if (match) {
      sendDuelEvent({ type: "duel:leave", matchId: match.matchId, playerId: me.id })
    }
    setMatch(null)
    setOpponentLeft(false)
  }

  const handleTttClick = (index: number) => {
    if (!match || match.game !== "ttt" || opponentLeft) return
    const mySymbol = match.isHost ? "X" : "O"
    const oppSymbol = match.isHost ? "O" : "X"
    if (tttTurn !== mySymbol) return
    if (tttBoard[index] !== null) return
    if (getTttWinner(tttBoard).winner !== null) return

    const next = [...tttBoard]
    next[index] = mySymbol
    setTttBoard(next)
    setTttTurn(oppSymbol)

    const res = getTttWinner(next)
    if (res.winner === mySymbol) {
      setScores((s) => ({ ...s, me: s.me + 1 }))
    }

    sendDuelEvent({ type: "duel:move", matchId: match.matchId, playerId: me.id, index })
  }

  const handleRpsPick = (choice: RpsChoice) => {
    if (!match || match.game !== "rps" || myPick || rpsSeriesOver || opponentLeft) return
    setMyPick(choice)
    sendDuelEvent({
      type: "duel:rps_pick",
      matchId: match.matchId,
      playerId: me.id,
      round: rpsRound,
      choice,
    })
  }

  const nextRpsRound = () => {
    setRpsRound((r) => r + 1)
    setMyPick(null)
    setOppPick(null)
  }

  const triggerRematch = () => {
    if (!match || opponentLeft) return
    sendDuelEvent({ type: "duel:rematch", matchId: match.matchId, playerId: me.id })
    if (match.game === "ttt") {
      const nextStarter = tttStarter === "host" ? "guest" : "host"
      resetMatchState(nextStarter)
    } else {
      setScores({ me: 0, opponent: 0 })
      resetMatchState("host")
    }
  }

  // ─── Queue / Lobby View ──────────────────────────────────────────────────────
  if (!match) {
    return (
      <div className="flex flex-col p-3 sm:p-4 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            <h3 className="text-sm sm:text-base font-black">Duel 1v1 en attente</h3>
          </div>
          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
            <PlayerAvatar avatar={me.avatar} imgClassName="w-4 h-4 rounded-full object-cover" />
            <span>{me.name}</span>
          </span>
        </div>

        {/* Game selector */}
        <div className="grid grid-cols-2 gap-2 mb-3 shrink-0">
          <button
            type="button"
            disabled={isQueuing}
            onClick={() => setSelectedKind("ttt")}
            className={`p-2.5 rounded-xl border-2 text-left transition-all ${
              selectedKind === "ttt"
                ? "border-primary bg-primary/15 shadow-[2px_2px_0px_oklch(0.75_0.25_300_/_0.4)]"
                : "border-border bg-card hover:bg-muted/60"
            } disabled:opacity-60`}
          >
            <div className="font-black text-sm">❌⭕ Morpion</div>
            <div className="text-[11px] text-muted-foreground">Grille 3×3 rapide</div>
          </button>
          <button
            type="button"
            disabled={isQueuing}
            onClick={() => setSelectedKind("rps")}
            className={`p-2.5 rounded-xl border-2 text-left transition-all ${
              selectedKind === "rps"
                ? "border-primary bg-primary/15 shadow-[2px_2px_0px_oklch(0.75_0.25_300_/_0.4)]"
                : "border-border bg-card hover:bg-muted/60"
            } disabled:opacity-60`}
          >
            <div className="font-black text-sm">✊✋✌️ PFC</div>
            <div className="text-[11px] text-muted-foreground">BO3 express</div>
          </button>
        </div>

        {/* Queue button */}
        <button
          type="button"
          onClick={() => toggleQueue()}
          className={`w-full py-2.5 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all shrink-0 mb-3 ${
            isQueuing
              ? "bg-destructive/15 border-destructive text-destructive hover:bg-destructive/25"
              : "bg-primary text-primary-foreground border-primary hover:opacity-90"
          }`}
        >
          {isQueuing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Recherche d&apos;un adversaire... (Annuler)
            </>
          ) : (
            <>
              <Swords className="w-4 h-4" />
              Chercher un adversaire ({selectedKind === "ttt" ? "Morpion" : "PFC"})
            </>
          )}
        </button>

        {/* Waiting opponents */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-1.5">
            Joueurs prêts ({queueList.length})
          </div>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {queueList.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4">
                Personne en attente pour l&apos;instant. Lance une recherche pour inviter les autres joueurs qui ont déjà envoyé leur meme !
              </div>
            ) : (
              queueList.map((entry) => (
                <div
                  key={entry.player.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <PlayerAvatar avatar={entry.player.avatar} className="text-lg shrink-0" imgClassName="w-6 h-6 rounded-full object-cover" />
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{entry.player.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {entry.game === "ttt" ? "❌⭕ Morpion" : "✊✋✌️ Pierre-Feuille-Ciseaux"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => acceptChallenge(entry)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground font-black text-xs shrink-0 hover:opacity-90"
                  >
                    Affronter
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ─── Active Match View ───────────────────────────────────────────────────────
  const mySymbol = match.isHost ? "X" : "O"
  const tttResult = match.game === "ttt" ? getTttWinner(tttBoard) : null
  const rpsOutcome = myPick && oppPick ? getRpsOutcome(myPick, oppPick) : null

  return (
    <div className="flex flex-col p-3 sm:p-4 bg-card/50 backdrop-blur-sm rounded-xl border-2 border-border w-full max-w-lg mx-auto shadow-xl h-full overflow-hidden">
      {/* Match Header */}
      <div className="flex items-center justify-between gap-2 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-black min-w-0">
          <span className="truncate flex items-center gap-1">
            <PlayerAvatar avatar={me.avatar} imgClassName="w-4 h-4 rounded-full object-cover" /> Toi
          </span>
          <span className="px-2 py-0.5 rounded-full bg-muted border border-border shrink-0">
            {scores.me} - {scores.opponent}
          </span>
          <span className="truncate flex items-center gap-1">
            <PlayerAvatar avatar={match.opponent.avatar} imgClassName="w-4 h-4 rounded-full object-cover" /> {match.opponent.name}
          </span>
        </div>
        <button
          type="button"
          onClick={leaveMatch}
          className="text-xs px-2.5 py-1 rounded-lg border border-border bg-muted hover:bg-destructive/20 hover:text-destructive font-bold flex items-center gap-1 shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          Quitter
        </button>
      </div>

      {opponentLeft ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <p className="text-sm font-bold text-muted-foreground">
            {match.opponent.name} a quitté le duel.
          </p>
          <button
            type="button"
            onClick={leaveMatch}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-sm"
          >
            Retour au lobby duel
          </button>
        </div>
      ) : match.game === "ttt" ? (
        /* ─── Morpion ──────────────────────────────────────────────────────── */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
          <div className="text-xs sm:text-sm font-black">
            {tttResult?.winner === "draw" ? (
              <span className="text-amber-400">Match nul !</span>
            ) : tttResult?.winner ? (
              tttResult.winner === mySymbol ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" /> Victoire !
                </span>
              ) : (
                <span className="text-destructive">Défaite...</span>
              )
            ) : tttTurn === mySymbol ? (
              <span className="text-primary">À ton tour ({mySymbol})</span>
            ) : (
              <span className="text-muted-foreground">Tour de {match.opponent.name}...</span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 w-52 h-52 sm:w-60 sm:h-60">
            {tttBoard.map((cell, idx) => {
              const isWinCell = tttResult?.line?.includes(idx)
              const canPlay = !tttResult?.winner && tttTurn === mySymbol && cell === null
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!canPlay}
                  onClick={() => handleTttClick(idx)}
                  className={`rounded-xl border-2 text-3xl sm:text-4xl font-black flex items-center justify-center transition-all ${
                    isWinCell
                      ? "border-emerald-400 bg-emerald-500/20 scale-105"
                      : canPlay
                        ? "border-border bg-card hover:bg-muted active:scale-95"
                        : "border-border bg-card/60"
                  } ${cell === "X" ? "text-primary" : "text-emerald-400"}`}
                >
                  {cell}
                </button>
              )
            })}
          </div>

          {tttResult?.winner && (
            <button
              type="button"
              onClick={triggerRematch}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Revanche
            </button>
          )}
        </div>
      ) : (
        /* ─── Pierre-Feuille-Ciseaux (BO3) ─────────────────────────────────── */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Manche {rpsRound} · Premier à 2
          </div>

          {myPick && oppPick ? (
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="flex items-center justify-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl sm:text-5xl">{RPS_META[myPick].emoji}</span>
                  <span className="text-xs font-bold">Toi ({RPS_META[myPick].label})</span>
                </div>
                <span className="text-sm font-black text-muted-foreground">VS</span>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-4xl sm:text-5xl">{RPS_META[oppPick].emoji}</span>
                  <span className="text-xs font-bold">{match.opponent.name}</span>
                </div>
              </div>

              <div className="text-sm sm:text-base font-black">
                {rpsSeriesOver ? (
                  scores.me >= 2 ? (
                    <span className="text-emerald-400">🏆 Tu gagnes le BO3 !</span>
                  ) : (
                    <span className="text-destructive">💀 {match.opponent.name} gagne le BO3 !</span>
                  )
                ) : rpsOutcome === "win" ? (
                  <span className="text-emerald-400">Manche gagnée !</span>
                ) : rpsOutcome === "lose" ? (
                  <span className="text-destructive">Manche perdue</span>
                ) : (
                  <span className="text-amber-400">Égalité !</span>
                )}
              </div>

              {rpsSeriesOver ? (
                <button
                  type="button"
                  onClick={triggerRematch}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-black text-xs sm:text-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Revanche BO3
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextRpsRound}
                  className="px-4 py-2 rounded-xl bg-accent text-accent-foreground font-black text-xs sm:text-sm"
                >
                  Manche suivante
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-xs">
                {(["rock", "paper", "scissors"] as RpsChoice[]).map((choice) => {
                  const chosen = myPick === choice
                  return (
                    <button
                      key={choice}
                      type="button"
                      disabled={Boolean(myPick)}
                      onClick={() => handleRpsPick(choice)}
                      className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                        chosen
                          ? "border-primary bg-primary/20 scale-105"
                          : myPick
                            ? "border-border bg-card/40 opacity-50"
                            : "border-border bg-card hover:bg-muted active:scale-95"
                      }`}
                    >
                      <span className="text-3xl sm:text-4xl">{RPS_META[choice].emoji}</span>
                      <span className="text-xs font-black">{RPS_META[choice].label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {myPick
                  ? `Choix verrouillé ! En attente de ${match.opponent.name}...`
                  : oppPick
                    ? `${match.opponent.name} a déjà choisi — à toi !`
                    : "Choisis ton coup !"}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
