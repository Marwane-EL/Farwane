"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import { HomeView } from "@/components/game/home-view"
import { LobbyView } from "@/components/game/lobby-view"
import { CreationView } from "@/components/game/creation-view"
import { VotingView } from "@/components/game/voting-view"
import { ResultsView } from "@/components/game/results-view"
import { FinalResultsView } from "@/components/game/final-results-view"
import { RoomChat } from "@/components/game/room-chat"
import { AuthModal } from "@/components/game/auth-modal"
import { ProfileModal } from "@/components/game/profile-modal"
import { useGameRoom } from "@/hooks/use-game-room"
import { useNicheLibrary } from "@/hooks/use-niche-library"
import { useAuthProfile } from "@/hooks/use-auth-profile"
import { resetTetrisScore } from "@/components/game/tetris/TetrisGame"
import { resetSnakeScore } from "@/components/game/snake/SnakeGame"

function resetMiniGames() {
  resetTetrisScore()
  resetSnakeScore()
}

export default function MemeGame() {
  const [mounted, setMounted] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [profileModalTab, setProfileModalTab] = useState<"bangers" | "favorites" | "profile" | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const {
    phase, roomCode, players, currentPlayer,
    settings, currentRound, playerScores, roundStartedAt,
    memePacks,
    selectedPack, myMemeUrl,
    submissions, currentMemeIndex, hasSubmitted,
    hasVotedOnCurrent, currentVoters, hasUsedHeart,
    error, isLoading, libraries,
    nichePool, currentNiche,
    chatMessages, sendChatMessage,
    sendDuelEvent, subscribeDuelEvents,
    heartRedistribution,
    createRoom, joinRoom, leaveRoom,
    updateSettings, selectPack, startGame,
    submitMeme, moveToVoting, vote,
    advanceMeme, nextRound, newGame,
    refreshMeme, refreshesLeft,
    setError,
    createLibrary, deleteLibrary, addMemeToLibrary, removeMemeFromLibrary, hydrateLibraries,
    addNicheToPool, removeNicheFromPool, clearNichePool,
    codenames,
  } = useGameRoom()

  const {
    niches: personalNiches,
    addNiche: addToPersonalLibrary,
    editNiche: editPersonalNiche,
    deleteNiche: deletePersonalNiche,
    hydrateNiches,
  } = useNicheLibrary((updatedNiches) => {
    syncNichesToCloud(updatedNiches)
  })

  const {
    profile,
    signUp,
    signIn,
    signOut,
    updateIdentity,
    isFavoriteMeme,
    toggleFavoriteMeme,
    isSavedBanger,
    toggleSavedBanger,
    removeBanger,
    syncNichesToCloud,
    syncLibrariesToCloud,
    recordGameResult,
  } = useAuthProfile({
    onHydrateNiches: hydrateNiches,
    onHydrateLibraries: hydrateLibraries,
    onRequireAuth: () => setAuthModalOpen(true),
  })

  // Sync personal libraries to cloud when logged in
  useEffect(() => {
    if (profile?.id) {
      syncLibrariesToCloud(libraries)
    }
  }, [libraries, profile?.id, syncLibrariesToCloud])

  // Record game stats once when entering final-results
  const statsRecordedRef = useRef(false)
  useEffect(() => {
    if (phase !== "final-results") {
      statsRecordedRef.current = false
      return
    }
    if (statsRecordedRef.current || !profile || !currentPlayer) return
    statsRecordedRef.current = true

    const myPoints = playerScores[currentPlayer.id] || 0
    const maxScore = Math.max(0, ...players.map((p) => playerScores[p.id] || 0))
    const won = players.length > 1 && myPoints > 0 && myPoints >= maxScore
    const myHearts = submissions
      .filter((m) => m.playerId === currentPlayer.id)
      .reduce((acc, m) => acc + (m.hearts || 0), 0)

    recordGameResult({ won, points: myPoints, heartsReceived: myHearts })
  }, [phase, profile, currentPlayer, playerScores, players, submissions, recordGameResult])

  // Inject virtual "Mes Favoris" pack into userLibraries for the Lobby
  const lobbyLibraries = useMemo(() => {
    if (!profile || profile.favoriteMemes.length === 0) return libraries
    return [
      {
        id: "lib-account-favorites",
        name: "Mes Favoris",
        memes: profile.favoriteMemes,
      },
      ...libraries,
    ]
  }, [libraries, profile])

  const duelPlayer = currentPlayer
    ? {
        id: currentPlayer.id,
        name:
          settings.gameMode === "incognito"
            ? codenames[currentPlayer.id] || "Fantôme 👻"
            : currentPlayer.pseudo,
        avatar: settings.gameMode === "incognito" ? "👻" : currentPlayer.avatar,
      }
    : undefined

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
            onCreateGame={(pseudo) => createRoom(pseudo, profile?.avatar)}
            onJoinGame={(code, pseudo) => joinRoom(code, pseudo, profile?.avatar)}
            error={error}
            isLoading={isLoading}
            onDismissError={() => setError(null)}
            libraries={libraries}
            onCreateLibrary={createLibrary}
            onDeleteLibrary={deleteLibrary}
            onAddMemeToLibrary={addMemeToLibrary}
            onRemoveMemeFromLibrary={removeMemeFromLibrary}
            memeUrls={memePacks.flatMap((p) => p.memes)}
            profile={profile}
            onOpenAuth={() => setAuthModalOpen(true)}
            onOpenProfile={(tab) => setProfileModalTab(tab)}
            externalNiches={personalNiches}
            onAddExternalNiche={addToPersonalLibrary}
            onEditExternalNiche={editPersonalNiche}
            onDeleteExternalNiche={deletePersonalNiche}
          />
        )}
        {phase === "lobby" && (
          <LobbyView
            roomCode={roomCode}
            players={players}
            currentPlayer={currentPlayer}
            memePacks={memePacks}
            userLibraries={lobbyLibraries}
            selectedPack={selectedPack}
            settings={settings}
            nichePool={nichePool}
            personalNiches={personalNiches}
            onSelectPack={selectPack}
            onUpdateSettings={updateSettings}
            onAddNiche={(text, save) => {
              addNicheToPool(text, currentPlayer?.id ?? "")
              if (save) addToPersonalLibrary(text)
            }}
            onRemoveNiche={(id) => removeNicheFromPool(id, currentPlayer?.id ?? "", currentPlayer?.isHost ?? false)}
            onClearNiches={() => clearNichePool(currentPlayer?.isHost ?? false)}
            onStartGame={() => { resetMiniGames(); startGame(); }}
            onLeave={() => { resetMiniGames(); leaveRoom(); }}
          />
        )}
        {phase === "creation" && (
          <CreationView
            roomCode={roomCode}
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
            currentNiche={currentNiche}
            nichePool={nichePool}
            roundStartedAt={roundStartedAt}
            onLeave={() => { resetMiniGames(); leaveRoom(); }}
            duelPlayer={duelPlayer}
            sendDuelEvent={sendDuelEvent}
            subscribeDuelEvents={subscribeDuelEvents}
            isFavoriteMeme={isFavoriteMeme(myMemeUrl)}
            onToggleFavoriteMeme={() => toggleFavoriteMeme(myMemeUrl)}
          />
        )}
        {phase === "voting" && submissions.length > 0 && (
          <VotingView
            roomCode={roomCode}
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
            onLeave={() => { resetMiniGames(); leaveRoom(); }}
            gameMode={settings.gameMode}
            isFavoriteMeme={isFavoriteMeme(submissions[currentMemeIndex].imageUrl)}
            onToggleFavoriteMeme={toggleFavoriteMeme}
            isSavedBanger={isSavedBanger(
              submissions[currentMemeIndex].imageUrl,
              submissions[currentMemeIndex].caption
            )}
            onToggleSavedBanger={toggleSavedBanger}
          />
        )}
        {phase === "results" && (
          <ResultsView
            roomCode={roomCode}
            memes={submissions}
            players={players}
            playerScores={playerScores}
            currentRound={currentRound}
            totalRounds={settings.totalRounds}
            onPlayAgain={nextRound}
            onBackToHome={leaveRoom}
            isHost={currentPlayer?.isHost || false}
            gameMode={settings.gameMode}
            codenames={codenames}
            currentPlayerId={currentPlayer?.id || ""}
            isFavoriteMeme={isFavoriteMeme}
            onToggleFavoriteMeme={toggleFavoriteMeme}
            isSavedBanger={isSavedBanger}
            onToggleSavedBanger={toggleSavedBanger}
          />
        )}
        {phase === "final-results" && (
          <FinalResultsView
            roomCode={roomCode}
            players={players}
            playerScores={playerScores}
            onNewGame={() => { resetMiniGames(); newGame(); }}
            onBackToHome={() => { resetMiniGames(); leaveRoom(); }}
            isHost={currentPlayer?.isHost || false}
            gameMode={settings.gameMode}
            codenames={codenames}
            heartRedistribution={heartRedistribution}
          />
        )}
        {phase !== "home" && currentPlayer && (
          <RoomChat
            messages={chatMessages}
            currentPlayerId={currentPlayer.id}
            onSendMessage={sendChatMessage}
          />
        )}
      </div>

      {/* Account Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSignIn={signIn}
        onSignUp={signUp}
      />

      {/* Profile, Bangers & Favorites Modal */}
      {profile && profileModalTab !== null && (
        <ProfileModal
          open={true}
          initialTab={profileModalTab}
          onClose={() => setProfileModalTab(null)}
          profile={profile}
          onUpdateIdentity={updateIdentity}
          onToggleFavoriteMeme={toggleFavoriteMeme}
          onRemoveBanger={removeBanger}
          onSignOut={signOut}
        />
      )}
    </main>
  )
}
