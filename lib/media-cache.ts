/**
 * media-cache.ts
 * Session-level in-memory Blob URL cache for meme videos.
 *
 * Why this drastically reduces Supabase / CDN Cached Egress:
 * 1. HTML5 `<video loop>` often sends repeated HTTP 206 Range requests on each loop
 *    (especially on mobile Safari / Chrome WebViews).
 * 2. The same meme is mounted in CreationView, then VotingView, then ResultsView (podium).
 * 3. Fetching the video once into a local `blob:` URL serves all loops and remounts
 *    100% from RAM with 0 additional network requests.
 */

const MAX_CACHED_BLOBS = 50

const blobUrlCache = new Map<string, string>()
const inFlightFetches = new Map<string, Promise<string>>()

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url)
}

/**
 * Returns a cached `blob:` URL if already downloaded, or fetches the video once,
 * stores it in memory, and returns the `blob:` URL.
 * Falls back to the original `url` if CORS or network prevents Blob creation.
 */
export async function getCachedMediaUrl(url: string): Promise<string> {
  if (!url || !isVideoUrl(url) || url.startsWith("blob:") || url.startsWith("data:")) {
    return url
  }

  const cached = blobUrlCache.get(url)
  if (cached) {
    // Refresh LRU order
    blobUrlCache.delete(url)
    blobUrlCache.set(url, cached)
    return cached
  }

  const existingPromise = inFlightFetches.get(url)
  if (existingPromise) {
    return existingPromise
  }

  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, {
        mode: "cors",
        cache: "force-cache",
      })
      if (!response.ok) return url

      const blob = await response.blob()
      if (blob.size === 0) return url

      // Evict oldest blob if cache is full
      if (blobUrlCache.size >= MAX_CACHED_BLOBS) {
        const oldestKey = blobUrlCache.keys().next().value
        if (oldestKey) {
          const oldBlobUrl = blobUrlCache.get(oldestKey)
          if (oldBlobUrl) URL.revokeObjectURL(oldBlobUrl)
          blobUrlCache.delete(oldestKey)
        }
      }

      const blobUrl = URL.createObjectURL(blob)
      blobUrlCache.set(url, blobUrl)
      return blobUrl
    } catch {
      // Fallback to direct URL if server blocks CORS fetch
      return url
    } finally {
      inFlightFetches.delete(url)
    }
  })()

  inFlightFetches.set(url, fetchPromise)
  return fetchPromise
}

/**
 * Synchronously peeks at the cache (returns blob URL if ready, otherwise null).
 */
export function peekCachedMediaUrl(url: string): string | null {
  return blobUrlCache.get(url) ?? null
}

