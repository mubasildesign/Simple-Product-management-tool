"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { send, VIEWS, type Operation, type View } from "@/lib/client"
import type { AIProposal, Document, Person, PersonColor, Project, Store, WorkItem } from "@/lib/types"
import { Sidebar } from "@/components/sidebar"
import { SetupScreen, type SetupInput } from "@/components/setup-screen"
import { TodayView } from "@/components/today-view"
import { WorkView } from "@/components/work-view"
import { PeopleView } from "@/components/people-view"
import { KnowledgeView } from "@/components/knowledge-view"
import { SettingsView } from "@/components/settings-view"
import { AssistantPanel } from "@/components/assistant-panel"
import { WorkDrawer } from "@/components/work-drawer"
import { CloseIcon } from "@/components/ui/icons"

const personColors: PersonColor[] = ["violet", "teal", "blue", "orange", "green", "rose", "amber", "slate"]
const id = () => crypto.randomUUID()

export function AppShell({ initialStore, initialView, initialItemId }: { initialStore: Store; initialView: View; initialItemId: string | null }) {
  const [store, setStore] = useState(initialStore)
  const [view, setView] = useState(initialView)
  const [itemId, setItemId] = useState(initialItemId)
  const [assistant, setAssistant] = useState(false)
  const [toast, setToast] = useState<{ text: string; action?: { label: string; run: () => void }; error?: boolean } | null>(null)
  const serverRef = useRef(initialStore)
  const pending = useRef(0)
  const storeRef = useRef(store)
  storeRef.current = store

  useEffect(() => {
    document.documentElement.dataset.theme = store.settings.theme.preset
    document.documentElement.style.setProperty("--accent", store.settings.theme.accent)
  }, [store.settings.theme])

  const mutate = useCallback(async (optimistic: (current: Store) => Store, operation: Operation) => {
    setStore(optimistic)
    pending.current += 1
    try {
      const next = await send(operation)
      serverRef.current = next
      return next
    } catch (error) {
      setToast({ error: true, text: error instanceof Error ? error.message : "That change could not be saved." })
      return null
    } finally {
      pending.current -= 1
      if (pending.current === 0) setStore(serverRef.current)
    }
  }, [])

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setAssistant(true) }
      if (event.key === "Escape") { setAssistant(false); setItemId(null) }
    }
    window.addEventListener("keydown", shortcut)
    return () => window.removeEventListener("keydown", shortcut)
  }, [])

  useEffect(() => {
    const timer = setInterval(async () => {
      if (pending.current || document.visibilityState !== "visible") return
      const response = await fetch("/api/store", { cache: "no-store" }).catch(() => null)
      if (response?.ok) { const next = await response.json(); serverRef.current = next; setStore(next) }
    }, 20000)
    return () => clearInterval(timer)
  }, [])

  const syncUrl = (nextView: View, nextItem: string | null) => {
    const params = new URLSearchParams()
    if (nextView !== "today") params.set("view", nextView)
    if (nextItem) params.set("item", nextItem)
    window.history.pushState(null, "", params.size ? `?${params}` : window.location.pathname)
  }
  const goTo = (next: View) => { setView(next); setItemId(null); syncUrl(next, null); window.scrollTo({ top: 0, behavior: "smooth" }) }
  const openItem = (item: WorkItem) => { setItemId(item.id); syncUrl(view, item.id) }
  const patchItem = (workItemId: string, patch: Partial<WorkItem>) => void mutate((current) => ({ ...current, workItems: current.workItems.map((item) => item.id === workItemId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item) }), { type: "update_work_item", id: workItemId, patch })
  const createItem = (projectId: string, title: string) => {
    const now = new Date().toISOString()
    const item: WorkItem = { id: id(), projectId, goalId: store.goals.find((goal) => goal.projectId === projectId)?.id ?? null, title, ownerIds: [], due: "", status: "planned", priority: "medium", note: "", createdAt: now, updatedAt: now }
    void mutate((current) => ({ ...current, workItems: [...current.workItems, item] }), { type: "create_work_item", item })
  }
  const removeItem = (item: WorkItem) => {
    setItemId(null)
    void mutate((current) => ({ ...current, workItems: current.workItems.filter((candidate) => candidate.id !== item.id) }), { type: "delete_work_item", id: item.id }).then((result) => {
      if (result) setToast({ text: "Work item deleted.", action: { label: "Undo", run: () => void mutate((current) => ({ ...current, workItems: [...current.workItems, item] }), { type: "create_work_item", item }) } })
    })
  }
  const patchPerson = (personId: string, patch: Partial<Person>) => void mutate((current) => ({ ...current, people: current.people.map((person) => person.id === personId ? { ...person, ...patch } : person) }), { type: "update_person", id: personId, patch })
  const createPerson = (name: string) => {
    const person: Person = { id: id(), name, role: "", email: "", color: personColors[store.people.length % personColors.length], capacity: "open", access: "member" }
    void mutate((current) => ({ ...current, people: [...current.people, person] }), { type: "create_person", person })
  }
  const addProposal = (proposal: AIProposal) => {
    void mutate((current) => ({ ...current, aiProposals: [proposal, ...current.aiProposals] }), { type: "add_proposal", proposal })
    setAssistant(false)
    setToast({ text: "Suggestion added for review." })
  }
  const proposalStatus = (proposalId: string, status: "applied" | "dismissed") => {
    const proposal = store.aiProposals.find((item) => item.id === proposalId)
    void mutate((current) => {
      let next = { ...current, aiProposals: current.aiProposals.map((item) => item.id === proposalId ? { ...item, status } : item) }
      if (status === "applied" && proposal) {
        const additions = proposal.actions.filter((action) => action.type === "create_work_item").map((action) => {
          const now = new Date().toISOString()
          return { ...action.payload, id: id(), createdAt: now, updatedAt: now } as WorkItem
        })
        next = { ...next, workItems: [...next.workItems, ...additions] }
      }
      return next
    }, { type: "proposal_status", id: proposalId, status })
    setToast({ text: status === "applied" ? "Suggestion applied." : "Suggestion dismissed." })
  }

  const finishSetup = (input: SetupInput) => mutate((current) => ({
    ...current,
    setup: { complete: true },
    workspace: { ...current.workspace, name: input.workspaceName.trim() },
    auth: { mode: input.authMode === "firebase" ? "firebase" : "local", firebase: input.firebase },
    people: [{ id: id(), name: input.ownerName.trim(), email: input.ownerEmail.trim().toLowerCase(), role: "Owner", color: "violet", capacity: "open", access: "owner" }],
    projects: input.projectName.trim() ? [{ id: id(), name: input.projectName.trim(), summary: "", health: "calm", accent: current.settings.theme.accent, startDate: "", targetDate: "" }] : [],
    settings: input.ai ? { ...current.settings, ai: { ...current.settings.ai, ...input.ai, hasKey: true, keyHint: `••••${input.ai.apiKey.slice(-4)}`, apiKey: "" } } : current.settings,
  }), { type: "complete_setup", ...input })
  const createProject = (name: string) => {
    const project: Project = { id: id(), name, summary: "", health: "calm", accent: store.settings.theme.accent, startDate: "", targetDate: "" }
    void mutate((current) => ({ ...current, projects: [...current.projects, project] }), { type: "create_project", project })
  }
  const createDocument = (title: string) => {
    const document: Document = { id: id(), projectId: null, title, kind: "note", content: "", updatedAt: new Date().toISOString() }
    void mutate((current) => ({ ...current, documents: [document, ...current.documents] }), { type: "create_document", document })
  }

  const openItemData = store.workItems.find((item) => item.id === itemId)
  if (!store.setup.complete) return <SetupScreen onFinish={async (input) => { await finishSetup(input) }} />
  return (
    <div className="app-frame">
      <Sidebar store={store} view={view} onView={goTo} onAssistant={() => setAssistant(true)} />
      <main className="app-main">
        {view === "today" ? <TodayView store={store} onOpen={openItem} onAssistant={() => setAssistant(true)} onProposal={proposalStatus} onCreateWork={() => goTo("work")} /> : null}
        {view === "work" ? <WorkView store={store} onOpen={openItem} onPatch={patchItem} onCreate={createItem} onCreateProject={createProject} /> : null}
        {view === "people" ? <PeopleView store={store} onPatch={patchPerson} onCreate={createPerson} /> : null}
        {view === "knowledge" ? <KnowledgeView store={store} onCreate={createDocument} onSave={(documentId, content) => void mutate((current) => ({ ...current, documents: current.documents.map((document) => document.id === documentId ? { ...document, content, updatedAt: new Date().toISOString() } : document) }), { type: "update_document", id: documentId, content })} /> : null}
        {view === "settings" ? (
          <SettingsView
            store={store}
            onSave={(patch) => void mutate((current) => ({
              ...current,
              workspace: { ...current.workspace, name: patch.workspaceName?.trim() || current.workspace.name },
              settings: {
                ...current.settings,
                githubUrl: patch.githubUrl ?? current.settings.githubUrl,
                theme: patch.theme ?? current.settings.theme,
                ai: { ...current.settings.ai, ...patch.ai, apiKey: "", hasKey: patch.ai?.clearKey ? false : current.settings.ai.hasKey || Boolean(patch.ai?.apiKey) },
              },
            }), { type: "update_settings", ...patch })}
            onPatchPerson={patchPerson}
            onCreatePerson={(input) => {
              const person: Person = { id: id(), ...input, color: personColors[store.people.length % personColors.length], capacity: "open" }
              void mutate((current) => ({ ...current, people: [...current.people, person] }), { type: "create_person", person })
            }}
            onAuth={(mode, firebase) => void mutate((current) => ({ ...current, auth: { mode, firebase } }), { type: "update_auth", mode, firebase })}
            onDeletePerson={(person) => void mutate((current) => ({
              ...current,
              people: current.people.filter((item) => item.id !== person.id),
              workItems: current.workItems.map((item) => ({ ...item, ownerIds: item.ownerIds.filter((ownerId) => ownerId !== person.id) })),
            }), { type: "delete_person", id: person.id })}
          />
        ) : null}
      </main>
      <AssistantPanel open={assistant} onClose={() => setAssistant(false)} onProposal={addProposal} />
      {openItemData ? <WorkDrawer item={openItemData} store={store} onClose={() => setItemId(null)} onPatch={patchItem} onDelete={removeItem} /> : null}
      {toast ? <div className={`toast pop-in ${toast.error ? "error" : ""}`} role={toast.error ? "alert" : "status"}><span>{toast.text}</span>{toast.action ? <button onClick={() => { toast.action?.run(); setToast(null) }}>{toast.action.label}</button> : null}<button aria-label="Dismiss" onClick={() => setToast(null)}><CloseIcon /></button></div> : null}
    </div>
  )
}
