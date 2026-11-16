"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"
import type {
  UserProfile,
  UserStats,
  SavedBanger,
  NicheItem,
  MemeLibrary,
} from "@/types/game"
import { toast } from "sonner"

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  wins: 0,
  totalPoints: 0,
  heartsReceived: 0,
}

const LOCAL_NICHES_KEY = "farwane_niches_v1"
const LOCAL_LIBRARIES_KEY = "meme-libraries"
const LOCAL_PROFILE_BACKUP_KEY = "farwane_profile_backup_v1"

function readLocalJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function mergeNiches(cloud: NicheItem[], local: NicheItem[]): NicheItem[] {
  const map = new Map<string, NicheItem>()
  for (const item of [...cloud, ...local]) {
    if (!item?.text) continue
    const key = item.text.trim().toLowerCase()
    if (!map.has(key)) map.set(key, item)
  }
  return Array.from(map.values())
}

function mergeLibraries(cloud: MemeLibrary[], local: MemeLibrary[]): MemeLibrary[] {
  const map = new Map<string, MemeLibrary>()
  for (const lib of [...cloud, ...local]) {
    if (!lib?.name) continue
    const key = lib.name.trim().toLowerCase()
    const existing = map.get(key)
    if (!existing) {
      map.set(key, lib)
    } else {
      const mergedMemes = Array.from(new Set([...existing.memes, ...lib.memes]))
      map.set(key, { ...existing, memes: mergedMemes })
    }
  }
  return Array.from(map.values())
}

export function useAuthProfile(options?: {
  onHydrateNiches?: (niches: NicheItem[]) => void
  onHydrateLibraries?: (libraries: MemeLibrary[]) => void
  onRequireAuth?: () => void
}) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const profileRef = useRef<UserProfile | null>(null)
  profileRef.current = profile

  const onHydrateNichesRef = useRef(options?.onHydrateNiches)
  const onHydrateLibrariesRef = useRef(options?.onHydrateLibraries)
  const onRequireAuthRef = useRef(options?.onRequireAuth)
  onHydrateNichesRef.current = options?.onHydrateNiches
  onHydrateLibrariesRef.current = options?.onHydrateLibraries
  onRequireAuthRef.current = options?.onRequireAuth

  const persistProfileUpdate = useCallback(
    async (userId: string, patch: Record<string, unknown>, nextProfile: UserProfile) => {
      setProfile(nextProfile)
      if (typeof window !== "undefined") {
        localStorage.setItem(`${LOCAL_PROFILE_BACKUP_KEY}_${userId}`, JSON.stringify(nextProfile))
      }
      try {
        await supabase
          .from("user_profiles")
          .upsert({ id: userId, ...patch, updated_at: new Date().toISOString() })
      } catch {
        // Fallback already stored in localStorage backup
      }
    },
    []
  )

  const loadOrCreateProfile = useCallback(async (authUser: User) => {
    const metaPseudo = (authUser.user_metadata?.pseudo as string) || authUser.email?.split("@")[0] || "Joueur"
    const metaAvatar = (authUser.user_metadata?.avatar as string) || "🎮"
    const localNiches = readLocalJson<NicheItem[]>(LOCAL_NICHES_KEY, [])
    const localLibraries = readLocalJson<MemeLibrary[]>(LOCAL_LIBRARIES_KEY, [])
    const localBackup = readLocalJson<Partial<UserProfile>>(
      `${LOCAL_PROFILE_BACKUP_KEY}_${authUser.id}`,
      {}
    )

    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle()

      if (!error && data) {
        const mergedNiches = mergeNiches((data.niches as NicheItem[]) ?? [], localNiches)
        const mergedLibs = mergeLibraries((data.libraries as MemeLibrary[]) ?? [], localLibraries)
        const loaded: UserProfile = {
          id: authUser.id,
          email: authUser.email,
          pseudo: data.pseudo || metaPseudo,
          avatar: data.avatar || metaAvatar,
          favoriteMemes: (data.favorite_memes as string[]) ?? localBackup.favoriteMemes ?? [],
          savedBangers: (data.saved_bangers as SavedBanger[]) ?? localBackup.savedBangers ?? [],
          niches: mergedNiches,
          libraries: mergedLibs,
          stats: { ...DEFAULT_STATS, ...((data.stats as Partial<UserStats>) ?? {}) },
        }
        setProfile(loaded)
        if (typeof window !== "undefined") {
          localStorage.setItem(LOCAL_NICHES_KEY, JSON.stringify(mergedNiches))
          localStorage.setItem(LOCAL_LIBRARIES_KEY, JSON.stringify(mergedLibs))
          localStorage.setItem(`${LOCAL_PROFILE_BACKUP_KEY}_${authUser.id}`, JSON.stringify(loaded))
        }
        onHydrateNichesRef.current?.(mergedNiches)
        onHydrateLibrariesRef.current?.(mergedLibs)
        return
      }

      // First login or row doesn't exist yet -> create row
      const initial: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        pseudo: localBackup.pseudo || metaPseudo,
        avatar: localBackup.avatar || metaAvatar,
        favoriteMemes: localBackup.favoriteMemes ?? [],
        savedBangers: localBackup.savedBangers ?? [],
        niches: localNiches,
        libraries: localLibraries,
        stats: localBackup.stats ?? DEFAULT_STATS,
      }
      setProfile(initial)

      if (!error) {
        await supabase.from("user_profiles").insert({
          id: authUser.id,
          pseudo: initial.pseudo,
          avatar: initial.avatar,
          favorite_memes: initial.favoriteMemes,
          saved_bangers: initial.savedBangers,
          niches: initial.niches,
          libraries: initial.libraries,
          stats: initial.stats,
        })
      }
    } catch {
      const fallback: UserProfile = {
        id: authUser.id,
        email: authUser.email,
        pseudo: localBackup.pseudo || metaPseudo,
        avatar: localBackup.avatar || metaAvatar,
        favoriteMemes: localBackup.favoriteMemes ?? [],
        savedBangers: localBackup.savedBangers ?? [],
        niches: localNiches,
        libraries: localLibraries,
        stats: localBackup.stats ?? DEFAULT_STATS,
      }
      setProfile(fallback)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        loadOrCreateProfile(currentUser).finally(() => {
          if (mounted) setAuthLoading(false)
        })
      } else {
        setAuthLoading(false)
      }
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)
      if (currentUser) {
        loadOrCreateProfile(currentUser)
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadOrCreateProfile])

  const signUp = useCallback(
    async (email: string, password: string, pseudo: string, avatar: string) => {
      const cleanPseudo = pseudo.trim().slice(0, 15) || "Joueur"

      // Try server-side admin creation first (bypasses Supabase SMTP email rate limits)
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, pseudo: cleanPseudo, avatar }),
        })

        if (res.ok) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          })
          if (error) throw new Error(error.message)
          if (data.user) await loadOrCreateProfile(data.user)
          return data
        }

        const body = (await res.json().catch(() => ({}))) as { fallback?: boolean; error?: string }
        if (res.status !== 501 && !body.fallback) {
          throw new Error(body.error || "Impossible de créer le compte")
        }
      } catch (err) {
        if (err instanceof Error && err.message !== "Failed to fetch") {
          throw err
        }
      }

      // Fallback to standard client signUp if service role key is not configured
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { pseudo: cleanPseudo, avatar },
        },
      })
      if (error) {
        console.error("[auth/signUp] Supabase error:", error.message)
        if (error.message.toLowerCase().includes("rate limit")) {
          throw new Error(
            "Limite d'emails Supabase atteinte (email rate limit exceeded). Ajoute SUPABASE_SERVICE_ROLE_KEY dans .env pour créer des comptes instantanément sans email, ou attends ~1h après avoir désactivé 'Confirm email' dans Supabase."
          )
        }
        throw new Error(error.message)
      }
      if (data.user) {
        await loadOrCreateProfile(data.user)
      }
      return data
    },
    [loadOrCreateProfile]
  )

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (error) throw new Error(error.message)
    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    toast.success("Déconnecté")
  }, [])

  const updateIdentity = useCallback(
    async (pseudo: string, avatar: string) => {
      if (!profile) return
      const cleanPseudo = pseudo.trim().slice(0, 15) || profile.pseudo
      const next: UserProfile = { ...profile, pseudo: cleanPseudo, avatar }
      await persistProfileUpdate(
        profile.id,
        { pseudo: cleanPseudo, avatar },
        next
      )
      toast.success("Profil mis à jour !")
    },
    [persistProfileUpdate, profile]
  )

  const isFavoriteMeme = useCallback(
    (url: string) => Boolean(profile?.favoriteMemes.includes(url)),
    [profile]
  )

  const toggleFavoriteMeme = useCallback(
    async (url: string) => {
      if (!profile) {
        toast.error("Connecte-toi pour ajouter des mèmes à tes favoris", {
          action: onRequireAuthRef.current
            ? { label: "Se connecter", onClick: () => onRequireAuthRef.current?.() }
            : undefined,
        })
        return false
      }
      const exists = profile.favoriteMemes.includes(url)
      const nextFavs = exists
        ? profile.favoriteMemes.filter((u) => u !== url)
        : [url, ...profile.favoriteMemes]
      const next: UserProfile = { ...profile, favoriteMemes: nextFavs }
      await persistProfileUpdate(profile.id, { favorite_memes: nextFavs }, next)
      toast.success(exists ? "Retiré de tes mèmes favoris" : "Ajouté au pack Mes Favoris")
      return !exists
    },
    [persistProfileUpdate, profile]
  )

  const isSavedBanger = useCallback(
    (imageUrl: string, caption: string) =>
      Boolean(
        profile?.savedBangers.some(
          (b) => b.imageUrl === imageUrl && b.caption.trim() === caption.trim()
        )
      ),
    [profile]
  )

  const toggleSavedBanger = useCallback(
    async (input: { imageUrl: string; caption: string; playerPseudo: string; niche?: string }) => {
      if (!profile) {
        toast.error("Connecte-toi pour sauvegarder des Bangers dans ton Hall of Fame", {
          action: onRequireAuthRef.current
            ? { label: "Se connecter", onClick: () => onRequireAuthRef.current?.() }
            : undefined,
        })
        return false
      }
      const existing = profile.savedBangers.find(
        (b) => b.imageUrl === input.imageUrl && b.caption.trim() === input.caption.trim()
      )
      let nextBangers: SavedBanger[]
      if (existing) {
        nextBangers = profile.savedBangers.filter((b) => b.id !== existing.id)
      } else {
        const created: SavedBanger = {
          id: crypto.randomUUID(),
          imageUrl: input.imageUrl,
          caption: input.caption.trim(),
          playerPseudo: input.playerPseudo || "Anonyme",
          niche: input.niche,
          createdAt: Date.now(),
        }
        nextBangers = [created, ...profile.savedBangers]
      }
      const next: UserProfile = { ...profile, savedBangers: nextBangers }
      await persistProfileUpdate(profile.id, { saved_bangers: nextBangers }, next)
      toast.success(
        existing ? "Banger retiré du Hall of Fame" : "Banger sauvegardé dans ton Hall of Fame"
      )
      return !existing
    },
    [persistProfileUpdate, profile]
  )

  const removeBanger = useCallback(
    async (id: string) => {
      if (!profile) return
      const nextBangers = profile.savedBangers.filter((b) => b.id !== id)
      const next: UserProfile = { ...profile, savedBangers: nextBangers }
      await persistProfileUpdate(profile.id, { saved_bangers: nextBangers }, next)
      toast.success("Banger supprimé")
    },
    [persistProfileUpdate, profile]
  )

  const syncNichesToCloud = useCallback(
    async (niches: NicheItem[]) => {
      const curr = profileRef.current
      if (!curr) return
      if (JSON.stringify(curr.niches) === JSON.stringify(niches)) return
      const next: UserProfile = { ...curr, niches }
      await persistProfileUpdate(curr.id, { niches }, next)
    },
    [persistProfileUpdate]
  )

  const syncLibrariesToCloud = useCallback(
    async (libraries: MemeLibrary[]) => {
      const curr = profileRef.current
      if (!curr) return
      if (JSON.stringify(curr.libraries) === JSON.stringify(libraries)) return
      const next: UserProfile = { ...curr, libraries }
      await persistProfileUpdate(curr.id, { libraries }, next)
    },
    [persistProfileUpdate]
  )

  const recordGameResult = useCallback(
    async (result: { won: boolean; points: number; heartsReceived: number }) => {
      if (!profile) return
      const nextStats: UserStats = {
        gamesPlayed: profile.stats.gamesPlayed + 1,
        wins: profile.stats.wins + (result.won ? 1 : 0),
        totalPoints: Math.round((profile.stats.totalPoints + result.points) * 10) / 10,
        heartsReceived: profile.stats.heartsReceived + result.heartsReceived,
      }
      const next: UserProfile = { ...profile, stats: nextStats }
      await persistProfileUpdate(profile.id, { stats: nextStats }, next)
    },
    [persistProfileUpdate, profile]
  )

  return {
    user,
    profile,
    authLoading,
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
  }
}
