import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normalizeMemeUrls } from "@/lib/utils"

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

// POST /api/admin/packs/[id]/memes — add URLs to an existing pack
// Body: { memes: string[] }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { memes } = await req.json()
  if (!Array.isArray(memes)) {
    return NextResponse.json({ error: "memes array required" }, { status: 400 })
  }

  const supabase = getAdminClient()
  // Fetch current memes
  const { data: pack, error: fetchErr } = await supabase
    .from("meme_packs")
    .select("memes")
    .eq("id", id)
    .single()

  if (fetchErr || !pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 })

  const normalizedMemes = await normalizeMemeUrls(memes)
  const updatedMemes = [...(pack.memes as string[]), ...normalizedMemes]
  const { data, error } = await supabase
    .from("meme_packs")
    .update({ memes: updatedMemes })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pack: data })
}

// DELETE /api/admin/packs/[id]/memes?index=N — remove one meme by index
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const index = parseInt(searchParams.get("index") ?? "-1", 10)
  if (index < 0) return NextResponse.json({ error: "index required" }, { status: 400 })

  const supabase = getAdminClient()
  const { data: pack, error: fetchErr } = await supabase
    .from("meme_packs")
    .select("memes")
    .eq("id", id)
    .single()

  if (fetchErr || !pack) return NextResponse.json({ error: "Pack not found" }, { status: 404 })

  const updatedMemes = (pack.memes as string[]).filter((_, i) => i !== index)
  const { data, error } = await supabase
    .from("meme_packs")
    .update({ memes: updatedMemes })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pack: data })
}
