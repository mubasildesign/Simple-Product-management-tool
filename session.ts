import { cookies } from "next/headers"
import { firebaseEmail } from "@/lib/firebase-rest"
import type { Store } from "@/lib/types"

export const SESSION_COOKIE = "atlas_session"

export async function memberEmail(store: Store) {
  if (!store.setup.complete || store.auth.mode !== "firebase") return "local"
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const email = await firebaseEmail(store.auth.firebase.apiKey, token)
  return store.people.some((person) => person.email.toLowerCase() === email) ? email : null
}

export function canEnter(store: Store, email: string | null) {
  return email === "local" || Boolean(email)
}
