import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { password } = await req.json()
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminPassword) {
    return NextResponse.json({ ok: false, error: "Admin not configured" }, { status: 500 })
  }

  if (password === adminPassword) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false, error: "Mot de passe incorrect" }, { status: 401 })
}
