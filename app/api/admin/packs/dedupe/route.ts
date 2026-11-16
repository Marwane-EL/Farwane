import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { dedupeMemeUrls } from "@/lib/meme-dedupe"

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

// POST /api/admin/packs/dedupe?id=PACK_ID — remove duplicate meme URLs from a pack
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

  if (fetchErr || !pack) {
    return NextResponse.json({ error: "Pack not found" }, { status: 404 })
  }

  const currentMemes = (pack.memes as string[]) ?? []
  const { unique, removedCount } = dedupeMemeUrls(currentMemes)

  if (removedCount > 0) {
    const { data, error: updateErr } = await supabase
      .from("meme_packs")
      .update({ memes: unique })
      .eq("id", id)
      .select()
      .single()

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, removedCount, remainingCount: unique.length, pack: data })
  }

  return NextResponse.json({ ok: true, removedCount: 0, remainingCount: unique.length })
}
