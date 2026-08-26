"use client"
import { useState, useEffect } from "react"
import { HomeView } from "@/components/game/home-view"
import { LobbyView } from "@/components/game/lobby-view"
import { CreationView } from "@/components/game/creation-view"
import { VotingView } from "@/components/game/voting-view"
import { ResultsView } from "@/components/game/results-view"
import { FinalResultsView } from "@/components/game/final-results-view"
import { useGameRoom } from "@/hooks/use-game-room"
import { resetTetrisScore } from "@/components/game/tetris/TetrisGame"

export default function MemeGame() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    phase, roomCode, players, currentPlayer,
    settings, currentRound, playerScores,
    memePacks, packsLoading,
    selectedPack, myMemeUrl,
    submissions, currentMemeIndex, hasSubmitted,
    hasVotedOnCurrent, currentVoters, hasUsedHeart,
    error, isLoading, libraries,
    createRoom, joinRoom, leaveRoom,
    updateSettings, selectPack, startGame,
    submitMeme, moveToVoting, vote,
    advanceMeme, nextRound, newGame,
    refreshMeme, refreshesLeft,
    setError,
    createLibrary, deleteLibrary, addMemeToLibrary, removeMemeFromLibrary,
  } = useGameRoom()


  return (
    <main className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col relative">
      {/* Dot texture background */}
      <div className="fixed inset-0 dot-texture opacity-100 pointer-events-none" />
      {/* Subtle grid overlay */}
      <div className="fixed inset-0 grid-pattern opacity-40 pointer-events-none" />
      {/* Aurora blobs — légers */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />
      </div>

      <div className="relative z-10 flex-1 w-full h-full flex flex-col overflow-hidden">
        {phase === "home" && (
          <HomeView
            onCreateGame={createRoom}
            onJoinGame={joinRoom}
            error={error}
            isLoading={isLoading}
            onDismissError={() => setError(null)}
            libraries={libraries}
            onCreateLibrary={createLibrary}
            onDeleteLibrary={deleteLibrary}
            onAddMemeToLibrary={addMemeToLibrary}
            onRemoveMemeFromLibrary={removeMemeFromLibrary}
          />
        )}
        {phase === "lobby" && (
          <LobbyView
            roomCode={roomCode}
            players={players}
            currentPlayer={currentPlayer}
            memePacks={memePacks}
            userLibraries={libraries}
            selectedPack={selectedPack}
            settings={settings}
            onSelectPack={selectPack}
            onUpdateSettings={updateSettings}
            onStartGame={() => { resetTetrisScore(); startGame(); }}
            onLeave={() => { resetTetrisScore(); leaveRoom(); }}
          />
        )}
        {phase === "creation" && (
          <CreationView
            currentMemeUrl={myMemeUrl}
            timerDuration={settings.timerDuration}
            onSubmit={submitMeme}
            hasSubmitted={hasSubmitted}
            submissionCount={submissions.length}
            totalPlayers={players.length}
            isHost={currentPlayer?.isHost || false}
            onForceVoting={moveToVoting}
            currentRound={currentRound}
            totalRounds={settings.totalRounds}
            onRefreshMeme={refreshMeme}
            refreshesLeft={refreshesLeft}
          />
        )}
        {phase === "voting" && submissions.length > 0 && (
          <VotingView
            meme={submissions[currentMemeIndex]}
            currentIndex={currentMemeIndex}
            totalMemes={submissions.length}
            onVote={vote}
            currentPlayerId={currentPlayer?.id || ""}
            hasVotedOnCurrent={hasVotedOnCurrent}
            votedCount={currentVoters.length}
            totalPlayers={players.length}
            isHost={currentPlayer?.isHost || false}
            onForceAdvance={advanceMeme}
            hasUsedHeart={hasUsedHeart}
          />
        )}
        {phase === "results" && (
          <ResultsView
            memes={submissions}
            players={players}
            playerScores={playerScores}
            currentRound={currentRound}
            totalRounds={settings.totalRounds}
            onPlayAgain={nextRound}
            onBackToHome={leaveRoom}
            isHost={currentPlayer?.isHost || false}
          />
        )}
        {phase === "final-results" && (
          <FinalResultsView
            players={players}
            playerScores={playerScores}
            onNewGame={() => { resetTetrisScore(); newGame(); }}
            onBackToHome={() => { resetTetrisScore(); leaveRoom(); }}
            isHost={currentPlayer?.isHost || false}
          />
        )}
      </div>
    </main>
  )
}
