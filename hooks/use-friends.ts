"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { FriendProfile, FriendshipEntry, UserProfile } from "@/types/game"
import { toast } from "sonner"
import {
  showFriendSuccessToast,
  showIncomingFriendRequestToast,
  showRoomInviteSentToast,
  showRoomInviteToast,
} from "@/components/game/friend-toasts"

interface RawFriendshipRow {
  id: string
  requester_id: string
  addressee_id: string
  status: "pending" | "accepted"
}

export function useFriends(
  profile: UserProfile | null,
  onAcceptRoomInvite?: (roomCode: string) => void
) {
  const [friends, setFriends] = useState<FriendshipEntry[]>([])
  const [incomingRequests, setIncomingRequests] = useState<FriendshipEntry[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<FriendshipEntry[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set())
  const [loadingFriends, setLoadingFriends] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const onAcceptInviteRef = useRef(onAcceptRoomInvite)
  onAcceptInviteRef.current = onAcceptRoomInvite

  const loadFriendships = useCallback(async () => {
    if (!profile?.id) {
      setFriends([])
      setIncomingRequests([])
      setOutgoingRequests([])
      return
    }

    setLoadingFriends(true)
    try {
      const { data: rows, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`)

      if (error || !rows) {
        return
      }

      const typedRows = rows as RawFriendshipRow[]
      const otherIds = Array.from(
        new Set(
          typedRows.map((r) => (r.requester_id === profile.id ? r.addressee_id : r.requester_id))
        )
      )

      const profileMap = new Map<string, FriendProfile>()
      if (otherIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, pseudo, avatar")
          .in("id", otherIds)

        if (profilesData) {
          for (const p of profilesData as FriendProfile[]) {
            profileMap.set(p.id, {
              id: p.id,
              pseudo: p.pseudo || "Joueur",
              avatar: p.avatar || "🎮",
            })
          }
        }
      }

      const acceptedList: FriendshipEntry[] = []
      const incomingList: FriendshipEntry[] = []
      const outgoingList: FriendshipEntry[] = []

      for (const row of typedRows) {
        const otherId = row.requester_id === profile.id ? row.addressee_id : row.requester_id
        const otherProfile = profileMap.get(otherId) ?? {
          id: otherId,
          pseudo: "Joueur",
          avatar: "🎮",
        }

        if (row.status === "accepted") {
          acceptedList.push({
            friendshipId: row.id,
            user: otherProfile,
            status: "accepted",
            direction: "accepted",
          })
        } else if (row.addressee_id === profile.id) {
          incomingList.push({
            friendshipId: row.id,
            user: otherProfile,
            status: "pending",
            direction: "incoming",
          })
        } else {
          outgoingList.push({
            friendshipId: row.id,
            user: otherProfile,
            status: "pending",
            direction: "outgoing",
          })
        }
      }

      setFriends(acceptedList)
      setIncomingRequests(incomingList)
      setOutgoingRequests(outgoingList)
    } finally {
      setLoadingFriends(false)
    }
  }, [profile?.id])

  // Load friendships when user logs in
  useEffect(() => {
    loadFriendships()
  }, [loadFriendships])

  const acceptFriendRequest = useCallback(
    async (friendshipId: string, requesterUserId: string) => {
      if (!profile?.id) return
      const { error } = await supabase
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", friendshipId)

      if (error) {
        toast.error("Impossible d'accepter la demande")
        return
      }

      await loadFriendships()
      channelRef.current?.send({
        type: "broadcast",
        event: "friend:refresh",
        payload: {
          targetUserId: requesterUserId,
          fromUserId: profile.id,
          fromPseudo: profile.pseudo,
          fromAvatar: profile.avatar,
          kind: "accepted",
        },
      })
      showFriendSuccessToast("Nouvel ami !", "Demande d'ami acceptée", profile.avatar, "emerald")
    },
    [profile?.id, profile?.pseudo, profile?.avatar, loadFriendships]
  )

  const removeFriendship = useCallback(
    async (friendshipId: string, otherUserId: string) => {
      if (!profile?.id) return
      const { error } = await supabase
        .from("friendships")
        .delete()
        .eq("id", friendshipId)

      if (error) {
        toast.error("Impossible de supprimer cette relation")
        return
      }

      await loadFriendships()
      channelRef.current?.send({
        type: "broadcast",
        event: "friend:refresh",
        payload: { targetUserId: otherUserId },
      })
      toast.success("Liste d'amis mise à jour")
    },
    [profile?.id, loadFriendships]
  )

  // Subscribe to global friends channel for online presence + live invites
  useEffect(() => {
    if (!profile?.id) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setOnlineUserIds(new Set())
      return
    }

    const channel = supabase.channel("global:friends", {
      config: { presence: { key: profile.id } },
    })

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      setOnlineUserIds(new Set(Object.keys(state)))
    })

    channel.on("broadcast", { event: "friend:refresh" }, ({ payload }) => {
      if (payload?.targetUserId !== profile.id) return
      loadFriendships()

      const fromPseudo = (payload?.fromPseudo as string) || "Un joueur"
      const fromAvatar = (payload?.fromAvatar as string) || "🎮"
      const fromUserId = payload?.fromUserId as string | undefined
      const friendshipId = payload?.friendshipId as string | undefined

      if (payload?.kind === "request") {
        showIncomingFriendRequestToast({
          fromPseudo,
          fromAvatar,
          onAccept:
            friendshipId && fromUserId
              ? () => acceptFriendRequest(friendshipId, fromUserId)
              : undefined,
          onDecline:
            friendshipId && fromUserId
              ? () => removeFriendship(friendshipId, fromUserId)
              : undefined,
        })
      } else if (payload?.kind === "accepted") {
        showFriendSuccessToast(
          "Demande acceptée !",
          `${fromPseudo} est maintenant ton ami`,
          fromAvatar,
          "emerald"
        )
      }
    })

    channel.on("broadcast", { event: "room:invite" }, ({ payload }) => {
      if (payload?.targetUserId !== profile.id) return
      const fromPseudo = (payload?.fromPseudo as string) || "Un ami"
      const fromAvatar = (payload?.fromAvatar as string) || "🎮"
      const invitedRoomCode = (payload?.roomCode as string) || ""
      if (!invitedRoomCode) return

      showRoomInviteToast({
        fromPseudo,
        fromAvatar,
        roomCode: invitedRoomCode,
        onJoin: () => {
          onAcceptInviteRef.current?.(invitedRoomCode)
        },
      })
    })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          id: profile.id,
          pseudo: profile.pseudo,
        })
      }
    })

    channelRef.current = channel
    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [profile?.id, profile?.pseudo, loadFriendships, acceptFriendRequest, removeFriendship])

  const searchPlayersByPseudo = useCallback(
    async (query: string): Promise<FriendProfile[]> => {
      const clean = query.trim()
      if (!profile?.id || clean.length < 2) return []

      const { data, error } = await supabase
        .from("user_profiles")
        .select("id, pseudo, avatar")
        .ilike("pseudo", `%${clean}%`)
        .neq("id", profile.id)
        .limit(12)

      if (error || !data) return []
      return data as FriendProfile[]
    },
    [profile?.id]
  )

  const sendFriendRequest = useCallback(
    async (targetUserId: string) => {
      if (!profile?.id || targetUserId === profile.id) return false

      const alreadyRelated =
        friends.some((f) => f.user.id === targetUserId) ||
        incomingRequests.some((f) => f.user.id === targetUserId) ||
        outgoingRequests.some((f) => f.user.id === targetUserId)

      if (alreadyRelated) {
        toast.info("Une demande ou amitié existe déjà avec ce joueur")
        return false
      }

      const { data: inserted, error } = await supabase
        .from("friendships")
        .insert({
          requester_id: profile.id,
          addressee_id: targetUserId,
          status: "pending",
        })
        .select("id")
        .single()

      if (error) {
        toast.error("Impossible d'envoyer la demande d'ami")
        return false
      }

      await loadFriendships()
      channelRef.current?.send({
        type: "broadcast",
        event: "friend:refresh",
        payload: {
          targetUserId,
          friendshipId: inserted?.id,
          fromUserId: profile.id,
          fromPseudo: profile.pseudo,
          fromAvatar: profile.avatar,
          kind: "request",
        },
      })
      showFriendSuccessToast(
        "Demande envoyée !",
        "Ton invitation d'ami a bien été transmise",
        profile.avatar,
        "purple"
      )
      return true
    },
    [
      profile?.id,
      profile?.pseudo,
      profile?.avatar,
      friends,
      incomingRequests,
      outgoingRequests,
      loadFriendships,
    ]
  )

  const sendRoomInvite = useCallback(
    (friendUserId: string, friendPseudo: string, activeRoomCode: string) => {
      if (!profile || !channelRef.current || !activeRoomCode) return
      channelRef.current.send({
        type: "broadcast",
        event: "room:invite",
        payload: {
          targetUserId: friendUserId,
          fromPseudo: profile.pseudo,
          fromAvatar: profile.avatar,
          roomCode: activeRoomCode,
        },
      })
      const friendEntry = friends.find((f) => f.user.id === friendUserId)
      showRoomInviteSentToast(friendPseudo, friendEntry?.user.avatar)
    },
    [profile, friends]
  )

  return {
    friends,
    incomingRequests,
    outgoingRequests,
    onlineUserIds,
    loadingFriends,
    refreshFriends: loadFriendships,
    searchPlayersByPseudo,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriendship,
    sendRoomInvite,
  }
}
