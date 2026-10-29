export type Status = "backlog" | "planned" | "in_progress" | "blocked" | "done"
export type Priority = "urgent" | "high" | "medium" | "low"
export type PersonColor = "violet" | "blue" | "teal" | "green" | "amber" | "orange" | "rose" | "slate"
export type ProjectHealth = "calm" | "attention" | "at_risk"

export type MemberRole = "owner" | "admin" | "member" | "viewer"
export type ThemePreset = "stone" | "dusk" | "grove" | "ink"
export type AiProvider = "openai" | "anthropic" | "compatible"

export type Person = {
  id: string
  name: string
  role: string
  email: string
  color: PersonColor
  capacity: "open" | "balanced" | "full"
  access: MemberRole
}

export type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

export type Settings = {
  githubUrl: string
  theme: { preset: ThemePreset; accent: string }
  ai: {
    provider: AiProvider
    baseUrl: string
    model: string
    enabled: boolean
    apiKey: string
    hasKey: boolean
    keyHint: string
  }
}

export type Project = {
  id: string
  name: string
  summary: string
  health: ProjectHealth
  accent: string
  startDate: string
  targetDate: string
}

export type Goal = {
  id: string
  projectId: string
  title: string
  current: number
  target: number
  unit: string
}

export type WorkItem = {
  id: string
  projectId: string
  goalId: string | null
  title: string
  ownerIds: string[]
  due: string
  status: Status
  priority: Priority
  note: string
  createdAt: string
  updatedAt: string
}

export type Document = {
  id: string
  projectId: string | null
  title: string
  kind: "brief" | "decision" | "note" | "plan"
  content: string
  updatedAt: string
}

export type Update = {
  id: string
  projectId: string
  authorId: string
  text: string
  createdAt: string
}

export type ProposalAction =
  | { type: "create_work_item"; payload: Omit<WorkItem, "id" | "createdAt" | "updatedAt"> }
  | { type: "update_work_item"; workItemId: string; payload: Partial<Omit<WorkItem, "id" | "createdAt" | "updatedAt">> }

export type AIProposal = {
  id: string
  title: string
  rationale: string
  status: "pending" | "applied" | "dismissed"
  source: "assistant" | "daily_focus" | "fallback"
  actions: ProposalAction[]
  createdAt: string
}

export type Store = {
  version: 4
  setup: { complete: boolean }
  auth: { mode: "local" | "firebase"; firebase: FirebaseConfig }
  workspace: { id: string; name: string }
  settings: Settings
  projects: Project[]
  goals: Goal[]
  workItems: WorkItem[]
  people: Person[]
  documents: Document[]
  updates: Update[]
  aiProposals: AIProposal[]
}

export type WorkItemPatch = Partial<Omit<WorkItem, "id" | "createdAt" | "updatedAt">>
export type PersonPatch = Partial<Omit<Person, "id">>
