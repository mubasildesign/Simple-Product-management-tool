import { NextResponse } from "next/server"
import { defaultBaseUrl, defaultModel, firebaseReady, publicStore } from "@/lib/settings"
import { canEnter, memberEmail } from "@/lib/session"
import { getPublicStore, getStore, mutateStore } from "@/lib/store"
import type { AIProposal, AiProvider, FirebaseConfig, Person, Project, Settings, Store, WorkItem } from "@/lib/types"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const store = await getStore()
  if (!canEnter(store, await memberEmail(store))) return NextResponse.json({ error: "Sign in to open this workspace." }, { status: 401 })
  return NextResponse.json(publicStore(store))
}

type Operation =
  | { type: "create_work_item"; item: WorkItem }
  | { type: "update_work_item"; id: string; patch: Partial<WorkItem> }
  | { type: "delete_work_item"; id: string }
  | { type: "update_person"; id: string; patch: Partial<Person> }
  | { type: "create_person"; person: Person }
  | { type: "update_document"; id: string; content: string; title?: string }
  | { type: "update_goal"; id: string; current: number }
  | { type: "add_proposal"; proposal: AIProposal }
  | { type: "proposal_status"; id: string; status: "applied" | "dismissed" }
  | { type: "delete_person"; id: string }
  | {
      type: "update_settings"
      workspaceName?: string
      githubUrl?: string
      theme?: Settings["theme"]
      ai?: Partial<Settings["ai"]> & { clearKey?: boolean }
    }
  | {
      type: "complete_setup"
      workspaceName: string
      ownerName: string
      ownerEmail: string
      projectName?: string
      authMode: "local" | "firebase"
      firebase?: FirebaseConfig
      ai?: Partial<Settings["ai"]>
    }
  | { type: "create_project"; project: Project }
  | { type: "create_document"; document: Store["documents"][number] }
  | { type: "update_auth"; mode: "local" | "firebase"; firebase?: FirebaseConfig }

export async function PATCH(request: Request) {
  try {
    const current = await getStore()
    const operationPreview = await request.clone().json() as Operation
    if (operationPreview.type !== "complete_setup" && !canEnter(current, await memberEmail(current))) {
      return NextResponse.json({ error: "Sign in to change this workspace." }, { status: 401 })
    }
    const operation = operationPreview
    const store = await mutateStore((draft) => applyOperation(draft, operation))
    return NextResponse.json(publicStore(store))
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save the change." }, { status: 400 })
  }
}

function applyOperation(store: Store, operation: Operation) {
  if (!operation || typeof operation.type !== "string") throw new Error("A valid operation is required.")
  if (operation.type === "create_work_item") {
    if (!operation.item.title.trim()) throw new Error("Give this work item a name.")
    store.workItems.push(operation.item)
  } else if (operation.type === "update_work_item") {
    const item = store.workItems.find((candidate) => candidate.id === operation.id)
    if (!item) throw new Error("That work item no longer exists.")
    Object.assign(item, operation.patch, { updatedAt: new Date().toISOString() })
  } else if (operation.type === "delete_work_item") {
    store.workItems = store.workItems.filter((item) => item.id !== operation.id)
  } else if (operation.type === "update_person") {
    const person = store.people.find((candidate) => candidate.id === operation.id)
    if (!person) throw new Error("That person no longer exists.")
    Object.assign(person, operation.patch)
  } else if (operation.type === "create_person") {
    if (!operation.person.name.trim()) throw new Error("Add a name first.")
    store.people.push({ ...operation.person, access: operation.person.access || "member" })
  } else if (operation.type === "delete_person") {
    if (store.people.length <= 1) throw new Error("Keep at least one person in the workspace.")
    const owners = store.people.filter((person) => person.access === "owner")
    const target = store.people.find((person) => person.id === operation.id)
    if (!target) throw new Error("That person no longer exists.")
    if (target.access === "owner" && owners.length <= 1) throw new Error("Keep at least one owner.")
    store.people = store.people.filter((person) => person.id !== operation.id)
    store.workItems.forEach((item) => {
      item.ownerIds = item.ownerIds.filter((id) => id !== operation.id)
    })
  } else if (operation.type === "update_settings") {
    if (operation.workspaceName?.trim()) store.workspace.name = operation.workspaceName.trim().slice(0, 60)
    if (typeof operation.githubUrl === "string") store.settings.githubUrl = operation.githubUrl.trim()
    if (operation.theme) store.settings.theme = { preset: operation.theme.preset, accent: operation.theme.accent }
    if (operation.ai) {
      const provider = (operation.ai.provider || store.settings.ai.provider) as AiProvider
      store.settings.ai.provider = provider
      store.settings.ai.baseUrl = operation.ai.baseUrl?.trim() || defaultBaseUrl(provider)
      store.settings.ai.model = operation.ai.model?.trim() || defaultModel(provider)
      store.settings.ai.enabled = operation.ai.enabled ?? store.settings.ai.enabled
      if (operation.ai.clearKey) store.settings.ai.apiKey = ""
      else if (operation.ai.apiKey?.trim()) store.settings.ai.apiKey = operation.ai.apiKey.trim()
    }
  } else if (operation.type === "update_document") {
    const document = store.documents.find((candidate) => candidate.id === operation.id)
    if (!document) throw new Error("That document no longer exists.")
    document.content = operation.content
    if (operation.title?.trim()) document.title = operation.title.trim()
    document.updatedAt = new Date().toISOString()
  } else if (operation.type === "update_goal") {
    const goal = store.goals.find((candidate) => candidate.id === operation.id)
    if (!goal) throw new Error("That goal no longer exists.")
    goal.current = Math.max(0, Math.min(operation.current, goal.target))
  } else if (operation.type === "add_proposal") {
    store.aiProposals.unshift(operation.proposal)
  } else if (operation.type === "proposal_status") {
    const proposal = store.aiProposals.find((candidate) => candidate.id === operation.id)
    if (!proposal) throw new Error("That suggestion is no longer available.")
    if (operation.status === "applied" && proposal.status === "pending") {
      for (const action of proposal.actions) {
        if (action.type === "create_work_item") {
          const now = new Date().toISOString()
          store.workItems.push({ ...action.payload, id: crypto.randomUUID(), createdAt: now, updatedAt: now })
        } else {
          const item = store.workItems.find((candidate) => candidate.id === action.workItemId)
          if (item) Object.assign(item, action.payload, { updatedAt: new Date().toISOString() })
        }
      }
    }
    proposal.status = operation.status
  } else if (operation.type === "complete_setup") {
    if (store.setup.complete) throw new Error("This workspace is already set up.")
    const workspaceName = operation.workspaceName.trim()
    const ownerName = operation.ownerName.trim()
    const ownerEmail = operation.ownerEmail.trim().toLowerCase()
    if (!workspaceName || !ownerName || !ownerEmail.includes("@")) throw new Error("Add a workspace name, your name, and a valid email.")
    store.workspace.name = workspaceName.slice(0, 60)
    store.people = [{ id: crypto.randomUUID(), name: ownerName, email: ownerEmail, role: "Owner", color: "violet", capacity: "open", access: "owner" }]
    store.projects = []
    store.workItems = []
    store.goals = []
    store.documents = []
    store.updates = []
    store.aiProposals = []
    if (operation.projectName?.trim()) {
      store.projects.push({ id: crypto.randomUUID(), name: operation.projectName.trim().slice(0, 80), summary: "", health: "calm", accent: store.settings.theme.accent, startDate: "", targetDate: "" })
    }
    if (operation.authMode === "firebase" && operation.firebase && firebaseReady(operation.firebase)) {
      store.auth = { mode: "firebase", firebase: operation.firebase }
    }
    if (operation.ai?.apiKey?.trim()) {
      store.settings.ai = { ...store.settings.ai, ...operation.ai, apiKey: operation.ai.apiKey.trim(), enabled: true }
    }
    store.setup.complete = true
  } else if (operation.type === "create_project") {
    if (!operation.project.name.trim()) throw new Error("Name the project first.")
    store.projects.push(operation.project)
  } else if (operation.type === "create_document") {
    if (!operation.document.title.trim()) throw new Error("Name the document first.")
    store.documents.unshift(operation.document)
  } else if (operation.type === "update_auth") {
    if (operation.mode === "firebase" && operation.firebase && firebaseReady(operation.firebase)) {
      store.auth = { mode: "firebase", firebase: operation.firebase }
    } else if (operation.mode === "local") {
      store.auth.mode = "local"
    } else throw new Error("Firebase needs an API key, auth domain, project ID, and app ID.")
  }
}
