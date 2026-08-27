import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { normalizeMemeUrls } from "@/lib/utils"

// Server-side Supabase client using service role for admin operations
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    // Falls back to anon key if no service role key is provided
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

function isAuthenticated(req: Request): boolean {
  const token = req.headers.get("x-admin-token")
  return token === process.env.ADMIN_PASSWORD
}

// GET /api/admin/packs — list all packs
export async function GET(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = getAdminClient()
  const { data, error } = await supabase
    .from("meme_packs")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ packs: data })
}

// POST /api/admin/packs — create a new pack
// Body: { name: string, memes: string[] }
export async function POST(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { name, memes } = await req.json()
  if (!name?.trim() || !Array.isArray(memes)) {
    return NextResponse.json({ error: "name and memes required" }, { status: 400 })
  }

  const supabase = getAdminClient()
  const normalizedMemes = await normalizeMemeUrls(memes)
  const { data, error } = await supabase
    .from("meme_packs")
    .insert({ name: name.trim(), memes: normalizedMemes, is_default: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pack: data })
}

// DELETE /api/admin/packs?id=... — delete a pack
export async function DELETE(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const supabase = getAdminClient()
  const { error } = await supabase.from("meme_packs").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
