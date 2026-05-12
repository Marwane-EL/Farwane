"use client"

import { HomeView } from "@/components/game/home-view"
import { LobbyView } from "@/components/game/lobby-view"
import { CreationView } from "@/components/game/creation-view"
import { VotingView } from "@/components/game/voting-view"
import { ResultsView } from "@/components/game/results-view"
import { FinalResultsView } from "@/components/game/final-results-view"
import { useGameRoom } from "@/hooks/use-game-room"

export default function MemeGame() {
  const {
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
  } = useGameRoom()


  return (
    <main className="h-[100dvh] w-full bg-background overflow-hidden flex flex-col relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-500" />
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
            onStartGame={startGame}
            onLeave={leaveRoom}
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
            onNewGame={newGame}
            onBackToHome={leaveRoom}
            isHost={currentPlayer?.isHost || false}
          />
        )}
      </div>
    </main>
  )
}
