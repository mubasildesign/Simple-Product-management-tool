"use client"

import { useState } from "react"
import { firebaseReady } from "@/lib/settings"
import { firebaseAccount } from "@/lib/firebase-rest"
import type { AiProvider, FirebaseConfig } from "@/lib/types"
import { SparkleIcon } from "@/components/ui/icons"
import { SetupGuide } from "@/components/setup-guide"

export type SetupInput = {
  workspaceName: string
  ownerName: string
  ownerEmail: string
  projectName: string
  authMode: "local" | "firebase"
  firebase: FirebaseConfig
  ai?: { provider: AiProvider; baseUrl: string; model: string; apiKey: string; enabled: boolean }
}

export function SetupScreen({ onFinish }: { onFinish: (input: SetupInput) => Promise<void> }) {
  const [authMode, setAuthMode] = useState<"local" | "firebase">("local")
  const [firebase, setFirebase] = useState<FirebaseConfig>({ apiKey: "", authDomain: "", projectId: "", appId: "" })
  const [form, setForm] = useState({ workspaceName: "", ownerName: "", ownerEmail: "", projectName: "", password: "", apiKey: "" })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function finish() {
    setError("")
    if (!form.workspaceName.trim() || !form.ownerName.trim() || !form.ownerEmail.includes("@")) {
      setError("Add a workspace name, your name, and email before continuing.")
      return
    }
    setBusy(true)
    try {
      if (authMode === "firebase") {
        if (!firebaseReady(firebase)) throw new Error("Paste all four Firebase config values, or choose local use.")
        if (form.password.length < 6) throw new Error("Use a password of at least 6 characters. Firebase requires it.")
        let idToken: string
        try {
          idToken = await firebaseAccount(firebase, form.ownerEmail.trim(), form.password, true)
        } catch (caught) {
          if (!(caught instanceof Error) || !caught.message.includes("already")) throw caught
          idToken = await firebaseAccount(firebase, form.ownerEmail.trim(), form.password, false)
        }
        const session = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, apiKey: firebase.apiKey }) })
        if (!session.ok) throw new Error("Firebase accepted the password, but Atlas could not start the session.")
      }
      await onFinish({
        workspaceName: form.workspaceName,
        ownerName: form.ownerName,
        ownerEmail: form.ownerEmail,
        projectName: form.projectName,
        authMode,
        firebase,
        ai: form.apiKey.trim() ? { provider: "openai", baseUrl: "https://api.openai.com/v1", model: "gpt-4.1-mini", apiKey: form.apiKey.trim(), enabled: true } : undefined,
      })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Setup could not be finished.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="setup-screen">
      <section className="setup-card">
        <span className="brand-mark"><SparkleIcon size={15} /></span>
        <p className="eyebrow mt-5">First launch</p>
        <h1 className="page-title">Set up Atlas</h1>
        <p className="mt-2 text-[14px] leading-6 text-ink-soft">This install is empty. You choose the workspace, the login, and whether AI is connected.</p>
        <label className="field"><span>Workspace name</span><input value={form.workspaceName} onChange={(event) => update("workspaceName", event.target.value)} placeholder="Northwind product" /></label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="field !mt-0"><span>Your name</span><input value={form.ownerName} onChange={(event) => update("ownerName", event.target.value)} /></label>
          <label className="field !mt-0"><span>Email</span><input type="email" value={form.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} /></label>
        </div>
        <label className="field"><span>First project, if you want one</span><input value={form.projectName} onChange={(event) => update("projectName", event.target.value)} placeholder="Optional" /></label>
        <fieldset className="mt-5">
          <legend className="text-[12px] text-ink-soft">Login</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <button type="button" className={`choice ${authMode === "local" ? "active" : ""}`} onClick={() => setAuthMode("local")}>Just this server</button>
            <button type="button" className={`choice ${authMode === "firebase" ? "active" : ""}`} onClick={() => setAuthMode("firebase")}>Firebase Authentication</button>
          </div>
        </fieldset>
        {authMode === "firebase" ? (
          <div className="mt-3 grid gap-3">
            {(["apiKey", "authDomain", "projectId", "appId"] as const).map((field) => (
              <label className="field !mt-0" key={field}><span>{field}</span><input value={firebase[field]} onChange={(event) => setFirebase({ ...firebase, [field]: event.target.value.trim() })} /></label>
            ))}
            <label className="field !mt-0"><span>Password for this login</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} /></label>
          </div>
        ) : <p className="mt-3 text-[12px] leading-5 text-ink-soft">Local mode has no shared sign-in. You can connect Firebase later in Settings.</p>}
        <label className="field"><span>AI key, optional</span><input type="password" value={form.apiKey} placeholder="Leave blank to skip" onChange={(event) => update("apiKey", event.target.value)} /></label>
        {error ? <p className="mt-3 text-[13px] text-danger" role="alert">{error}</p> : null}
        <button className="btn-primary mt-5" disabled={busy} onClick={() => void finish()}>{busy ? "Setting up…" : "Finish setup"}</button>
      </section>
      <SetupGuide />
    </main>
  )
}
