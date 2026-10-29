import { NextResponse } from "next/server"
import { firebaseEmail } from "@/lib/firebase-rest"
import { SESSION_COOKIE } from "@/lib/session"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const { idToken, apiKey } = (await request.json()) as { idToken?: string; apiKey?: string }
  const store = await getStore()
  const key = store.auth.firebase.apiKey || apiKey
  const email = idToken && key ? await firebaseEmail(key, idToken) : null
  if (!email) return NextResponse.json({ error: "That login could not be verified." }, { status: 401 })
  const response = NextResponse.json({ email })
  response.cookies.set(SESSION_COOKIE, idToken!, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 })
  return response
}
