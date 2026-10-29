import { getFocusItems } from "@/lib/insights"
import { defaultBaseUrl, defaultModel } from "@/lib/settings"
import type { AIProposal, Store } from "@/lib/types"

export type AssistantResult = {
  reply: string
  proposal: AIProposal | null
  mode: "live" | "demo"
}

export async function runAssistant(message: string, store: Store): Promise<AssistantResult> {
  const configured = store.settings?.ai
  const key = (configured?.enabled && configured.apiKey) || process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  if (!key) return fallbackAssistant(message, store)

  const provider = configured?.provider || "openai"
  const baseUrl = (configured?.baseUrl || process.env.AI_BASE_URL || defaultBaseUrl(provider)).replace(/\/$/, "")
  const model = configured?.model || process.env.AI_MODEL || defaultModel(provider)
  const context = {
    projects: store.projects,
    goals: store.goals,
    workItems: store.workItems.filter((item) => item.status !== "done"),
    people: store.people.map(({ id, name, role }) => ({ id, name, role })),
  }
  const content = provider === "anthropic" ? await anthropic(baseUrl, key, model, context, message) : await openAiCompatible(baseUrl, key, model, context, message)
  const parsed = JSON.parse(content || "{}") as {
    reply?: string
    proposal?: { title?: string; rationale?: string; actions?: AIProposal["actions"] }
  }
  return {
    reply: parsed.reply || "I reviewed the workspace and prepared a suggestion.",
    proposal: parsed.proposal?.actions?.length
      ? {
          id: crypto.randomUUID(),
          title: parsed.proposal.title || "Suggested workspace change",
          rationale: parsed.proposal.rationale || "Based on the current workspace context.",
          actions: parsed.proposal.actions,
          status: "pending",
          source: "assistant",
          createdAt: new Date().toISOString(),
        }
      : null,
    mode: "live",
  }
}

const instructions =
  "You are the calm planning copilot for a product workspace. Return JSON with reply and optional proposal. A proposal has title, rationale, and one action. Actions may be create_work_item with payload fields projectId, goalId, title, ownerIds, due YYYY-MM-DD, status, priority, note; or update_work_item with workItemId and payload. Never invent IDs. Prefer concise, low-pressure language. If the user asks a question, proposal may be null."

async function openAiCompatible(baseUrl: string, key: string, model: string, context: unknown, message: string) {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: `Workspace:\n${JSON.stringify(context)}\n\nRequest: ${message}` },
      ],
    }),
  })
  if (!response.ok) throw new Error("The AI provider is unavailable right now. Your workspace is unchanged.")
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
  return payload.choices?.[0]?.message?.content || "{}"
}

async function anthropic(baseUrl: string, key: string, model: string, context: unknown, message: string) {
  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: instructions,
      messages: [{ role: "user", content: `Workspace:\n${JSON.stringify(context)}\n\nRequest: ${message}\n\nReturn only JSON.` }],
    }),
  })
  if (!response.ok) throw new Error("The AI provider is unavailable right now. Your workspace is unchanged.")
  const payload = (await response.json()) as { content?: Array<{ text?: string }> }
  return payload.content?.map((part) => part.text || "").join("") || "{}"
}

function fallbackAssistant(message: string, store: Store): AssistantResult {
  const normalized = message.toLowerCase()
  const focus = getFocusItems(store)
  if (normalized.includes("focus") || normalized.includes("today") || normalized.includes("priority")) {
    const names = focus.map((item) => item.title)
    return {
      reply: names.length ? `Your clearest focus is ${names.slice(0, 2).join(" and ")}.` : "Nothing is scheduled yet. Add a project and a ticket when you are ready.",
      proposal: null,
      mode: "demo",
    }
  }

  const project = store.projects.find((item) => normalized.includes(item.name.toLowerCase())) ?? store.projects[0]
  if (!project) {
    return { reply: "Create a project first. Then I can suggest a ticket inside it.", proposal: null, mode: "demo" }
  }
  const title = extractTitle(message)
  const proposal: AIProposal = {
    id: crypto.randomUUID(),
    title: `Add “${title}”`,
    rationale: `I placed this in ${project.name} as a planned item. You can review every field before applying it.`,
    status: "pending",
    source: "fallback",
    createdAt: new Date().toISOString(),
    actions: [
      {
        type: "create_work_item",
        payload: {
          projectId: project.id,
          goalId: store.goals.find((goal) => goal.projectId === project.id)?.id ?? null,
          title,
          ownerIds: [],
          due: "",
          status: "planned",
          priority: normalized.includes("urgent") ? "urgent" : normalized.includes("important") ? "high" : "medium",
          note: "Captured with the local demo assistant.",
        },
      },
    ],
  }
  return {
    reply: "I turned that into a small, reviewable change. Nothing has been added yet.",
    proposal,
    mode: "demo",
  }
}

function extractTitle(message: string) {
  const cleaned = message
    .replace(/^(please\s+)?(add|create|remember|capture|make)(\s+(a|an|the))?\s+(task|item|to-do)?\s*:?\s*/i, "")
    .replace(/^to\s+/i, "")
    .trim()
  return (cleaned || "Clarify the next step").slice(0, 100)
}

export function isProposalSafe(proposal: AIProposal, store: Store) {
  const projectIds = new Set(store.projects.map((project) => project.id))
  const workItemIds = new Set(store.workItems.map((item) => item.id))
  return proposal.actions.every((action) => {
    if (action.type === "create_work_item") return Boolean(action.payload.title?.trim()) && projectIds.has(action.payload.projectId)
    return workItemIds.has(action.workItemId)
  })
}
