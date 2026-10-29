"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { firebaseAccount } from "@/lib/firebase-rest"
import { ACCENTS, THEME_PRESETS, firebaseReady } from "@/lib/settings"
import type { AiProvider, FirebaseConfig, MemberRole, Person, Settings, Store, ThemePreset } from "@/lib/types"
import { SetupGuide } from "@/components/setup-guide"
import { PlusIcon } from "@/components/ui/icons"
import { Avatar } from "@/components/ui/workspace"

const ROLES: MemberRole[] = ["owner", "admin", "member", "viewer"]

export function SettingsView({
  store,
  onSave,
  onPatchPerson,
  onCreatePerson,
  onDeletePerson,
  onAuth,
}: {
  store: Store
  onSave: (patch: { workspaceName?: string; githubUrl?: string; theme?: Settings["theme"]; ai?: Partial<Settings["ai"]> & { clearKey?: boolean } }) => void
  onPatchPerson: (id: string, patch: Partial<Person>) => void
  onCreatePerson: (person: Pick<Person, "name" | "email" | "role" | "access">) => void
  onDeletePerson: (person: Person) => void
  onAuth: (mode: "local" | "firebase", firebase: FirebaseConfig) => void
}) {
  const { settings } = store
  const [section, setSection] = useState<"general" | "appearance" | "ai" | "members" | "login">("general")
  const router = useRouter()
  const [firebase, setFirebase] = useState<FirebaseConfig>(store.auth.firebase)
  const [loginPassword, setLoginPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [name, setName] = useState(store.workspace.name)
  const [githubUrl, setGithubUrl] = useState(settings.githubUrl)
  const [provider, setProvider] = useState<AiProvider>(settings.ai.provider)
  const [model, setModel] = useState(settings.ai.model)
  const [baseUrl, setBaseUrl] = useState(settings.ai.baseUrl)
  const [apiKey, setApiKey] = useState("")
  const [member, setMember] = useState({ name: "", email: "", role: "Member", access: "member" as MemberRole })

  function saveGeneral() {
    const url = githubUrl.trim()
    onSave({ workspaceName: name, githubUrl: url && !/^https?:\/\//i.test(url) ? `https://${url}` : url })
  }

  return (
    <div className="page-wrap max-w-[1080px]">
      <header className="mb-7">
        <p className="eyebrow">Workspace</p>
        <h1 className="page-title">Settings</h1>
        <p className="mt-2 max-w-xl text-[14px] text-ink-soft">Appearance, members, and optional AI. The product works fully with AI turned off.</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav className="settings-nav" aria-label="Settings sections">
          {([
            ["general", "General"],
            ["appearance", "Theme"],
            ["ai", "AI"],
            ["members", "Members"],
            ["login", "Login"],
          ] as const).map(([id, label]) => (
            <button key={id} className={section === id ? "active" : ""} aria-current={section === id ? "page" : undefined} onClick={() => setSection(id)}>{label}</button>
          ))}
        </nav>
        <div className="grid gap-4">
          {section === "general" ? (
            <section className="surface-card p-5 sm:p-6">
              <h2 className="section-title">Open source workspace</h2>
              <p className="mt-2 text-[13px] leading-6 text-ink-soft">Released under the MIT licence. Add your GitHub repository and the link appears in the sidebar.</p>
              <label className="field"><span>Workspace name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label>
              <label className="field"><span>GitHub repository</span><input value={githubUrl} onChange={(event) => setGithubUrl(event.target.value)} placeholder="https://github.com/you/atlas" /></label>
              <button className="btn-primary mt-4" onClick={saveGeneral}>Save general settings</button>
            </section>
          ) : null}

          {section === "appearance" ? (
            <section className="surface-card p-5 sm:p-6">
              <h2 className="section-title">Theme</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                {(Object.keys(THEME_PRESETS) as ThemePreset[]).map((preset) => (
                  <button key={preset} className={`theme-swatch ${settings.theme.preset === preset ? "active" : ""}`} onClick={() => onSave({ theme: { preset, accent: THEME_PRESETS[preset].accent } })}>
                    <span style={{ background: THEME_PRESETS[preset].canvas, borderColor: THEME_PRESETS[preset].ink }}><i style={{ background: THEME_PRESETS[preset].accent }} /></span>
                    {THEME_PRESETS[preset].label}
                  </button>
                ))}
              </div>
              <p className="mt-5 text-[12px] text-ink-soft">Accent</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACCENTS.map((accent) => (
                  <button key={accent} aria-label={`Use accent ${accent}`} className={`accent-dot ${settings.theme.accent === accent ? "active" : ""}`} style={{ background: accent }} onClick={() => onSave({ theme: { preset: settings.theme.preset, accent } })} />
                ))}
              </div>
            </section>
          ) : null}

          {section === "ai" ? (
            <section className="surface-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="section-title">Your AI provider</h2>
                  <p className="mt-2 max-w-lg text-[13px] leading-6 text-ink-soft">Add a key for summaries, work reports, and suggested tickets. The key stays on the server and is never sent back to the browser.</p>
                </div>
                <button className={settings.ai.enabled ? "quiet-badge live" : "quiet-badge"} onClick={() => onSave({ ai: { enabled: !settings.ai.enabled } })}>{settings.ai.enabled ? "On" : "Off"}</button>
              </div>
              <label className="field"><span>Provider</span>
                <select value={provider} onChange={(event) => setProvider(event.target.value as AiProvider)}>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="compatible">OpenAI-compatible</option>
                </select>
              </label>
              <label className="field"><span>Model</span><input value={model} onChange={(event) => setModel(event.target.value)} /></label>
              <label className="field"><span>Base URL</span><input value={baseUrl} onChange={(event) => setBaseUrl(event.target.value)} /></label>
              <label className="field"><span>API key {settings.ai.hasKey ? `· saved ${settings.ai.keyHint}` : ""}</span><input type="password" value={apiKey} autoComplete="off" placeholder={settings.ai.hasKey ? "Enter a new key to replace it" : "sk-..."} onChange={(event) => setApiKey(event.target.value)} /></label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => { onSave({ ai: { provider, model, baseUrl, enabled: true, ...(apiKey.trim() ? { apiKey } : {}) } }); setApiKey("") }}>Save AI settings</button>
                {settings.ai.hasKey ? <button className="btn-secondary" onClick={() => onSave({ ai: { clearKey: true, enabled: false } })}>Remove key</button> : null}
              </div>
            </section>
          ) : null}

          {section === "login" ? (
            <section className="grid gap-4 lg:grid-cols-2">
              <div className="surface-card p-5 sm:p-6">
                <h2 className="section-title">Login</h2>
                <p className="mt-2 text-[13px] leading-6 text-ink-soft">Current mode: {store.auth.mode === "firebase" ? `Firebase (${store.auth.firebase.projectId})` : "this server only, no shared sign-in"}.</p>
                {(["apiKey", "authDomain", "projectId", "appId"] as const).map((field) => (
                  <label className="field" key={field}><span>{field}</span><input value={firebase[field]} onChange={(event) => setFirebase({ ...firebase, [field]: event.target.value.trim() })} /></label>
                ))}
                <label className="field"><span>Owner password</span><input type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} /></label>
                {loginError ? <p className="mt-3 text-[13px] text-danger" role="alert">{loginError}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn-primary" disabled={!firebaseReady(firebase)} onClick={() => void (async () => {
                    setLoginError("")
                    const owner = store.people.find((person) => person.access === "owner")
                    if (!owner?.email) { setLoginError("Add an owner email before connecting Firebase."); return }
                    try {
                      let idToken: string
                      try { idToken = await firebaseAccount(firebase, owner.email, loginPassword, true) }
                      catch { idToken = await firebaseAccount(firebase, owner.email, loginPassword, false) }
                      const session = await fetch("/api/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken, apiKey: firebase.apiKey }) })
                      if (!session.ok) throw new Error("The login could not be saved.")
                      onAuth("firebase", firebase)
                      router.refresh()
                    } catch (caught) { setLoginError(caught instanceof Error ? caught.message : "Could not connect Firebase.") }
                  })()}>Use Firebase</button>
                  <button className="btn-secondary" onClick={() => { void fetch("/api/session", { method: "DELETE" }); onAuth("local", firebase); router.refresh() }}>Use local mode</button>
                </div>
              </div>
              <SetupGuide />
            </section>
          ) : null}
          {section === "members" ? (
            <section className="surface-card overflow-hidden">
              <div className="flex items-center justify-between p-5 pb-3"><h2 className="section-title">Members</h2><span className="text-[12px] text-ink-faint">{store.people.length} people</span></div>
              <form className="member-form grid gap-2 border-y border-line p-4 sm:grid-cols-[1fr_1fr_140px_auto]" onSubmit={(event) => { event.preventDefault(); if (!member.name.trim()) return; onCreatePerson(member); setMember({ name: "", email: "", role: "Member", access: "member" }) }}>
                <input aria-label="Member name" placeholder="Name" value={member.name} onChange={(event) => setMember({ ...member, name: event.target.value })} />
                <input aria-label="Member email" placeholder="Email" value={member.email} onChange={(event) => setMember({ ...member, email: event.target.value })} />
                <select aria-label="Member access" value={member.access} onChange={(event) => setMember({ ...member, access: event.target.value as MemberRole })}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select>
                <button className="btn-primary" type="submit"><PlusIcon /> Add</button>
              </form>
              {store.people.map((person) => (
                <div className="member-row" key={person.id}>
                  <Avatar person={person} />
                  <div className="min-w-0"><p className="truncate text-[13px] font-medium">{person.name}</p><p className="truncate text-[11px] text-ink-faint">{person.email || person.role || "No email"}</p></div>
                  <select aria-label={`Access for ${person.name}`} value={person.access} onChange={(event) => onPatchPerson(person.id, { access: event.target.value as MemberRole })}>{ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select>
                  <button className="text-[12px] text-danger" onClick={() => onDeletePerson(person)}>Remove</button>
                </div>
              ))}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
