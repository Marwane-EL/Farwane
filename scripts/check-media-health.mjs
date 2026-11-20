/**
 * Standalone daily media health-check script for GitHub Actions (12:00 Paris).
 * Scans every URL in Supabase `meme_packs` and removes definitely dead links
 * (HTTP 404 / 410 / 451 or HTML error pages returned instead of media).
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DRY_RUN = process.env.DRY_RUN === "1"

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const CHECK_TIMEOUT_MS = 8000
const CONCURRENCY = 15
const DEFINITELY_DEAD_STATUSES = new Set([404, 410, 451])

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Supabase ${res.status}: ${body}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function checkUrl(url) {
  const trimmed = (url || "").trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return { dead: true, reason: "invalid-url" }
  }

  const attempt = async (method) => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS)
    try {
      const res = await fetch(trimmed, {
        method,
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; FarWaneMediaChecker/1.0)",
          ...(method === "GET" ? { Range: "bytes=0-1023" } : {}),
        },
      })
      if (method === "GET") {
        try {
          await res.body?.cancel()
        } catch {
          // ignore
        }
      }
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  try {
    let res = await attempt("HEAD")
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await attempt("GET")
    }

    if (DEFINITELY_DEAD_STATUSES.has(res.status)) {
      return { dead: true, reason: `HTTP ${res.status}` }
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase()
    const isTenorPage = /tenor\.com\/view\//i.test(trimmed)
    if (res.ok && contentType.includes("text/html") && !isTenorPage) {
      return { dead: true, reason: "HTML instead of media" }
    }

    return { dead: false, reason: `HTTP ${res.status}` }
  } catch (err) {
    return { dead: false, reason: `transient:${err?.name || "error"}` }
  }
}

async function runWithConcurrency(items, limit, worker) {
  const results = new Array(items.length)
  let nextIdx = 0

  async function runner() {
    while (nextIdx < items.length) {
      const idx = nextIdx++
      results[idx] = await worker(items[idx])
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runner()))
  return results
}

async function main() {
  console.log(`Starting FarWane media health-check (dryRun=${DRY_RUN})...`)
  const packs = await supabaseRequest("meme_packs?select=id,name,memes&order=created_at.asc")

  const uniqueUrls = Array.from(
    new Set(packs.flatMap((p) => (Array.isArray(p.memes) ? p.memes : [])))
  )
  console.log(`Checking ${uniqueUrls.length} unique media URLs across ${packs.length} pack(s)...`)

  const checks = await runWithConcurrency(uniqueUrls, CONCURRENCY, async (url) => ({
    url,
    ...(await checkUrl(url)),
  }))

  const deadMap = new Map()
  for (const r of checks) {
    if (r.dead) deadMap.set(r.url, r.reason)
  }

  let totalRemoved = 0
  let packsUpdated = 0

  for (const pack of packs) {
    const memes = Array.isArray(pack.memes) ? pack.memes : []
    const cleaned = memes.filter((u) => !deadMap.has(u))
    const removed = memes.length - cleaned.length

    if (removed > 0) {
      totalRemoved += removed
      console.log(`Pack "${pack.name}": ${removed} dead URL(s) detected:`)
      for (const u of memes) {
        if (deadMap.has(u)) {
          console.log(`  - [${deadMap.get(u)}] ${u}`)
        }
      }
      if (!DRY_RUN) {
        await supabaseRequest(`meme_packs?id=eq.${encodeURIComponent(pack.id)}`, {
          method: "PATCH",
          body: JSON.stringify({ memes: cleaned }),
        })
        packsUpdated++
      }
    }
  }

  console.log(
    `Done! Scanned ${uniqueUrls.length} URLs across ${packs.length} packs. Removed ${totalRemoved} dead URL(s) across ${packsUpdated} pack(s).`
  )
}

main().catch((err) => {
  console.error("Media health-check failed:", err)
  process.exit(1)
})
