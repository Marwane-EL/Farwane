"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"
import type { FriendProfile, FriendshipEntry, UserProfile } from "@/types/game"
import { toast } from "sonner"

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
      if (payload?.fromPseudo && payload?.kind === "request") {
        toast.info(`${payload.fromPseudo} t'a envoyé une demande d'ami !`)
      } else if (payload?.fromPseudo && payload?.kind === "accepted") {
        toast.success(`${payload.fromPseudo} a accepté ta demande d'ami !`)
      }
    })

    channel.on("broadcast", { event: "room:invite" }, ({ payload }) => {
      if (payload?.targetUserId !== profile.id) return
      const fromPseudo = (payload?.fromPseudo as string) || "Un ami"
      const invitedRoomCode = (payload?.roomCode as string) || ""
      if (!invitedRoomCode) return

      toast.info(`${fromPseudo} t'invite à rejoindre son salon !`, {
        duration: 12000,
        action: {
          label: "Rejoindre",
          onClick: () => {
            onAcceptInviteRef.current?.(invitedRoomCode)
          },
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
  }, [profile?.id, profile?.pseudo, loadFriendships])

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

      const { error } = await supabase.from("friendships").insert({
        requester_id: profile.id,
        addressee_id: targetUserId,
        status: "pending",
      })

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
          fromPseudo: profile.pseudo,
          kind: "request",
        },
      })
      toast.success("Demande d'ami envoyée !")
      return true
    },
    [profile?.id, profile?.pseudo, friends, incomingRequests, outgoingRequests, loadFriendships]
  )

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
          fromPseudo: profile.pseudo,
          kind: "accepted",
        },
      })
      toast.success("Demande d'ami acceptée !")
    },
    [profile?.id, profile?.pseudo, loadFriendships]
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

  const sendRoomInvite = useCallback(
    (friendUserId: string, friendPseudo: string, activeRoomCode: string) => {
      if (!profile || !channelRef.current || !activeRoomCode) return
      channelRef.current.send({
        type: "broadcast",
        event: "room:invite",
        payload: {
          targetUserId: friendUserId,
          fromPseudo: profile.pseudo,
          roomCode: activeRoomCode,
        },
      })
      toast.success(`Invitation envoyée à ${friendPseudo} !`)
    },
    [profile]
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
