import type { FirebaseConfig } from "@/lib/types"

type AuthResponse = { idToken?: string; email?: string; error?: { message?: string } }

export async function firebaseAccount(config: FirebaseConfig, email: string, password: string, create: boolean) {
  const method = create ? "signUp" : "signInWithPassword"
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:${method}?key=${encodeURIComponent(config.apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const data = (await response.json()) as AuthResponse
  if (!response.ok || !data.idToken) throw new Error(firebaseMessage(data.error?.message))
  return data.idToken
}

export async function firebaseEmail(apiKey: string, idToken: string) {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { users?: Array<{ email?: string }> }
  return data.users?.[0]?.email?.toLowerCase() ?? null
}

function firebaseMessage(code: string | undefined) {
  if (code === "EMAIL_EXISTS") return "That email already has a Firebase login. Use the same password to continue."
  if (code === "EMAIL_NOT_FOUND" || code === "INVALID_LOGIN_CREDENTIALS" || code === "INVALID_PASSWORD") return "That email or password does not match Firebase."
  if (code === "WEAK_PASSWORD : Password should be at least 6 characters") return "Use a password of at least 6 characters."
  return "Firebase could not sign you in. Check the config, the authorized domain, and that Email/Password is enabled."
}
