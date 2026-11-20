import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const CHECK_TIMEOUT_MS = 8000
const CONCURRENCY = 12
const DEFINITELY_DEAD_STATUSES = new Set([404, 410, 451])

interface BrokenItem {
  packId: string
  packName: string
  url: string
  reason: string
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isAuthorized(req: Request): boolean {
  const adminToken = req.headers.get("x-admin-token")
  if (adminToken && process.env.ADMIN_PASSWORD && adminToken === process.env.ADMIN_PASSWORD) {
    return true
  }
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_PASSWORD
  if (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true
  }
  return false
}

async function checkUrlHealth(url: string): Promise<{ dead: boolean; reason: string }> {
  const trimmed = (url || "").trim()
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return { dead: true, reason: "invalid-url" }
  }

  const attempt = async (method: "HEAD" | "GET") => {
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
        // Drain/cancel body immediately so we don't download full videos
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
    // Some hosts reject HEAD with 403/405/501 — retry with a tiny ranged GET
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      res = await attempt("GET")
    }

    if (DEFINITELY_DEAD_STATUSES.has(res.status)) {
      return { dead: true, reason: `HTTP ${res.status}` }
    }

    // If a direct media URL returns an HTML error page instead of image/video, flag it
    const contentType = (res.headers.get("content-type") || "").toLowerCase()
    const isTenorPage = /tenor\.com\/view\//i.test(trimmed)
    if (res.ok && contentType.includes("text/html") && !isTenorPage) {
      return { dead: true, reason: "HTML instead of media" }
    }

    // Treat 5xx / 429 / timeouts as transient (do not delete)
    return { dead: false, reason: `HTTP ${res.status}` }
  } catch (err) {
    // Transient network error or timeout: keep the URL safe
    const msg = err instanceof Error ? err.name : "network-error"
    return { dead: false, reason: `transient:${msg}` }
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIdx = 0

  async function runner() {
    while (nextIdx < items.length) {
      const idx = nextIdx++
      results[idx] = await worker(items[idx])
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runner())
  await Promise.all(runners)
  return results
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dryRun = searchParams.get("dryRun") === "1"

  const supabase = getAdminClient()
  const { data: packs, error } = await supabase
    .from("meme_packs")
    .select("id, name, memes")
    .order("created_at", { ascending: true })

  if (error || !packs) {
    return NextResponse.json({ error: error?.message || "Failed to load packs" }, { status: 500 })
  }

  // Deduplicate URLs across all packs before checking
  const uniqueUrls = Array.from(
    new Set(
      packs.flatMap((p) => (Array.isArray(p.memes) ? (p.memes as string[]) : []))
    )
  )

  const checkResults = await runWithConcurrency(uniqueUrls, CONCURRENCY, async (url) => ({
    url,
    ...(await checkUrlHealth(url)),
  }))

  const deadMap = new Map<string, string>()
  for (const r of checkResults) {
    if (r.dead) deadMap.set(r.url, r.reason)
  }

  const brokenItems: BrokenItem[] = []
  let packsUpdated = 0
  let totalRemoved = 0

  for (const pack of packs) {
    const memes = Array.isArray(pack.memes) ? (pack.memes as string[]) : []
    const cleaned: string[] = []

    for (const url of memes) {
      const deadReason = deadMap.get(url)
      if (deadReason) {
        brokenItems.push({
          packId: pack.id,
          packName: pack.name,
          url,
          reason: deadReason,
        })
      } else {
        cleaned.push(url)
      }
    }

    if (cleaned.length !== memes.length) {
      totalRemoved += memes.length - cleaned.length
      if (!dryRun) {
        const { error: updateErr } = await supabase
          .from("meme_packs")
          .update({ memes: cleaned })
          .eq("id", pack.id)
        if (!updateErr) {
          packsUpdated++
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    checkedUrls: uniqueUrls.length,
    packsScanned: packs.length,
    packsUpdated,
    removedCount: totalRemoved,
    brokenItems: brokenItems.slice(0, 100),
    checkedAt: new Date().toISOString(),
  })
}
