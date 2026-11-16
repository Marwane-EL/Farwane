const COPY_SUFFIX_RE = /\s*\(\d+\)(?=\.[^./]+$|$)/g

function stripCopySuffix(path: string): string {
  return path.replace(COPY_SUFFIX_RE, "")
}

/**
 * Normalizes a meme URL to a canonical comparison key to detect duplicates:
 * - case-insensitive host & path
 * - URL-decoded path (so "%20(1)" matches " (1)")
 * - strips duplicate OS/browser copy suffixes like " (1)", " (2)" before extension
 * - strips trailing slash & whitespace
 */
export function getMemeDedupeKey(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  try {
    const parsed = new URL(trimmed)
    let decodedPath = parsed.pathname
    try {
      decodedPath = decodeURIComponent(parsed.pathname)
    } catch { /* keep raw pathname if malformed percent-encoding */ }
    const cleanPath = stripCopySuffix(decodedPath).replace(/\/+$/, "")
    return `${parsed.hostname.toLowerCase()}${cleanPath.toLowerCase()}${parsed.search}`
  } catch {
    return stripCopySuffix(trimmed).toLowerCase()
  }
}

/**
 * Deduplicates an array of meme URLs while preserving order.
 * If both "foo (1).mp4" and "foo.mp4" exist, keeps the clean one without " (N)".
 */
export function dedupeMemeUrls(urls: string[]): { unique: string[]; removedCount: number } {
  const keyToIndex = new Map<string, number>()
  const unique: string[] = []

  for (const raw of urls) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    const key = getMemeDedupeKey(trimmed)

    const existingIdx = keyToIndex.get(key)
    if (existingIdx !== undefined) {
      // Prefer the cleaner URL without " (1)" if the existing one had a copy suffix
      const existingHasCopySuffix = COPY_SUFFIX_RE.test(decodeURIComponentSafe(unique[existingIdx]))
      COPY_SUFFIX_RE.lastIndex = 0
      const currentHasCopySuffix = COPY_SUFFIX_RE.test(decodeURIComponentSafe(trimmed))
      COPY_SUFFIX_RE.lastIndex = 0

      if (existingHasCopySuffix && !currentHasCopySuffix) {
        unique[existingIdx] = trimmed
      }
      continue
    }

    keyToIndex.set(key, unique.length)
    unique.push(trimmed)
  }

  return {
    unique,
    removedCount: urls.length - unique.length,
  }
}

function decodeURIComponentSafe(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
