import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

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

async function isUrlDefinitelyDead(rawUrl: string): Promise<boolean> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl.trim())
  } catch {
    return true // Invalid URL syntax
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return true
  }

  try {
    const headRes = await fetch(parsed.toString(), {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    })
    if (headRes.ok) return false
    if (headRes.status === 404 || headRes.status === 410 || headRes.status === 400) return true

    // Some servers reject HEAD (405/403) while GET works
    if (headRes.status === 405 || headRes.status === 403) {
      const getRes = await fetch(parsed.toString(), {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      })
      if (getRes.ok || getRes.status === 206) return false
      if (getRes.status === 404 || getRes.status === 410 || getRes.status === 400) return true
    }

    // 429 rate-limit / 5xx: keep URL, do not falsely delete
    return false
  } catch {
    // Network timeout or transient error: keep URL instead of deleting
    return false
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

// POST /api/admin/packs/cleanup?id=PACK_ID
export async function POST(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const supabase = getAdminClient()

  const { data: pack, error: fetchErr } = await supabase
    .from("meme_packs")
    .select("memes")
    .eq("id", id)
    .single()

  if (fetchErr || !pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 })

  const currentMemes = pack.memes as string[]
  const total = currentMemes.length
  const validity = new Array<boolean>(total).fill(false)
  let processed = 0

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const enc = new TextEncoder()

  const send = (obj: object) =>
    writer.write(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      await send({ processed: 0, total })

      const batches = chunk(currentMemes, 5)
      let offset = 0

      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b]
        const results = await Promise.allSettled(batch.map(isUrlDefinitelyDead))
        for (let j = 0; j < results.length; j++) {
          const res = results[j]
          const isDead = res.status === "fulfilled" && res.value
          validity[offset + j] = !isDead
          processed++
        }
        offset += batch.length
        await send({ processed, total })

        if (b < batches.length - 1) {
          await new Promise((r) => setTimeout(r, 150))
        }
      }

      const validMemes = currentMemes.filter((_, idx) => validity[idx])
      const removedCount = total - validMemes.length

      if (removedCount > 0) {
        const { error: updateErr } = await supabase
          .from("meme_packs")
          .update({ memes: validMemes })
          .eq("id", id)

        if (updateErr) {
          await send({ error: updateErr.message })
          await writer.close()
          return
        }
      }

      await send({ done: true, removedCount, remainingCount: validMemes.length })
    } catch (err) {
      await send({ error: err instanceof Error ? err.message : "Erreur inconnue" })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
