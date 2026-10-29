"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { firebaseAccount } from "@/lib/firebase-rest"
import type { FirebaseConfig } from "@/lib/types"
import { SparkleIcon } from "@/components/ui/icons"
import { SetupGuide } from "@/components/setup-guide"

export function LoginScreen({ workspaceName, firebase }: { workspaceName: string; firebase: FirebaseConfig }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError("")
    try {
      const idToken = await firebaseAccount(firebase, email.trim(), password, false)
      const response = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) })
      if (!response.ok) throw new Error("That account is not a member of this workspace.")
      router.refresh()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <span className="brand-mark"><SparkleIcon size={15} /></span>
        <p className="eyebrow mt-5">{workspaceName}</p>
        <h1 className="page-title">Sign in</h1>
        <p className="mt-2 text-[14px] text-ink-soft">Use the Firebase login for {firebase.projectId}. Only member emails can enter.</p>
        <form onSubmit={(event) => { event.preventDefault(); void submit() }}>
          <label className="field"><span>Email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label className="field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error ? <p className="mt-3 text-[13px] text-danger" role="alert">{error}</p> : null}
          <button className="btn-primary mt-5" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
      <SetupGuide />
    </main>
  )
}
