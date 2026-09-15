/**
 * packs-cache.ts
 * Module-level singleton cache for meme packs.
 * Prevents redundant Supabase fetches across page navigations within the same browser session.
 */

import type { MemePack } from "@/types/game"

const DEFAULT_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface PacksCacheEntry {
  data: MemePack[]
  fetchedAt: number
}

// Module-level singleton — persists across React re-renders and component mounts
let _cache: PacksCacheEntry | null = null

/**
 * Returns cached meme packs if still valid (within TTL), otherwise calls `fetcher`,
 * stores the result, and returns it.
 *
 * @param fetcher  Async function that fetches fresh packs from Supabase
 * @param ttlMs    Cache TTL in milliseconds (default: 10 minutes)
 */
export async function getCachedPacks(
  fetcher: () => Promise<MemePack[]>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<MemePack[]> {
  const now = Date.now()
  if (_cache && now - _cache.fetchedAt < ttlMs) {
    return _cache.data
  }
  const data = await fetcher()
  _cache = { data, fetchedAt: now }
  return data
}

/** Manually invalidate the cache (call after admin mutations) */
export function invalidatePacksCache(): void {
  _cache = null
}

/** Returns true if valid cached data exists */
export function hasValidCache(ttlMs: number = DEFAULT_TTL_MS): boolean {
  return _cache !== null && Date.now() - _cache.fetchedAt < ttlMs
}
