import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isAuthenticated(req: Request): boolean {
  const token = req.headers.get("x-admin-token")
  return token === process.env.ADMIN_PASSWORD
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function resolveTenorUrl(url: string): Promise<string> {
  if (!url.includes("tenor.com/view/")) return url
  try {
    const oembedUrl = `https://tenor.com/oembed?url=${encodeURIComponent(url)}`
    const res = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot)" },
    })
    if (!res.ok) return url
    const data = await res.json()
    const thumbnail: string | undefined = data.thumbnail_url
    if (thumbnail && thumbnail.includes("media.tenor.com")) {
      const gifUrl = thumbnail.replace(/AAAA[A-Z]\//, "AAAAC/").replace(/\.png$/, ".gif")
      try {
        const check = await fetch(gifUrl, { method: "HEAD" })
        if (check.ok) return gifUrl
      } catch { /* fallthrough to thumbnail */ }
      return thumbnail
    }
    return url
  } catch {
    return url
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// ─── Route ────────────────────────────────────────────────────────────────────

// POST /api/admin/packs/[id]/fix
// Returns a Server-Sent Events stream: { processed, total } progress ticks,
// then a final { done, fixedCount, pack } event.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const supabase = getAdminClient()

  const { data: pack, error: fetchErr } = await supabase
    .from("meme_packs")
    .select("memes")
    .eq("id", id)
    .single()

  if (fetchErr || !pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 })

  const currentMemes = pack.memes as string[]
  const total = currentMemes.length
  const resolved: string[] = new Array(total)
  let processed = 0

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  const send = (obj: object) =>
    writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

  // Kick off background processing
  ;(async () => {
    // Pass-through non-Tenor URLs immediately
    const tenorIndices: number[] = []
    currentMemes.forEach((url, i) => {
      if (url.includes("tenor.com/view/")) {
        tenorIndices.push(i)
      } else {
        resolved[i] = url
        processed++
      }
    })

    // Send initial progress (non-Tenor URLs already done)
    await send({ processed, total })

    // Resolve Tenor URLs in batches of 5 with 200ms delay between batches
    const tenorUrls = tenorIndices.map(i => currentMemes[i])
    const batches = chunk(tenorUrls, 5)
    let batchStart = 0

    for (let b = 0; b < batches.length; b++) {
      const batch = batches[b]
      const results = await Promise.allSettled(batch.map(resolveTenorUrl))

      for (let j = 0; j < results.length; j++) {
        const globalIdx = tenorIndices[batchStart + j]
        const result = results[j]
        resolved[globalIdx] = result.status === "fulfilled" ? result.value : tenorUrls[batchStart + j]
        processed++
      }
      batchStart += batch.length

      await send({ processed, total })

      if (b < batches.length - 1) {
        await new Promise(r => setTimeout(r, 200))
      }
    }

    // Save to DB
    const fixedCount = resolved.filter((m, i) => m !== currentMemes[i]).length

    const { data: updated, error: updateErr } = await supabase
      .from("meme_packs")
      .update({ memes: resolved })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) {
      await send({ error: updateErr.message })
    } else {
      await send({ done: true, fixedCount, pack: updated })
    }

    await writer.close()
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
