import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    const missing = [
      !supabaseUrl && "NEXT_PUBLIC_SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean)
    console.warn(`[api/auth/signup] Fallback client signUp — variable(s) manquante(s) : ${missing.join(", ")}`)
    return NextResponse.json(
      {
        fallback: true,
        error: `Configuration serveur incomplète (${missing.join(", ")} manquante)`,
      },
      { status: 501 }
    )
  }

  try {
    const { email, password, pseudo, avatar } = (await req.json()) as {
      email?: string
      password?: string
      pseudo?: string
      avatar?: string
    }

    if (!email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Email valide et mot de passe (6+ caractères) requis" },
        { status: 400 }
      )
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const cleanPseudo = (pseudo || "").trim().slice(0, 15) || "Joueur"
    const { data, error } = await admin.auth.admin.createUser({
      email: email.trim(),
      password,
      email_confirm: true,
      user_metadata: {
        pseudo: cleanPseudo,
        avatar: avatar || "🎮",
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, userId: data.user?.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
