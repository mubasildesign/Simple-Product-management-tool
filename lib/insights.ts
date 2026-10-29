import type { Store, WorkItem } from "@/lib/types"

const priorityWeight: Record<WorkItem["priority"], number> = { urgent: 5, high: 3, medium: 1, low: 0 }

export function focusScore(item: WorkItem, now = new Date("2026-10-15T09:00:00.000Z")) {
  if (item.status === "done") return -100
  const due = item.due ? Math.ceil((new Date(`${item.due}T23:59:59`).getTime() - now.getTime()) / 86400000) : 30
  const dueWeight = due < 0 ? 8 : due === 0 ? 6 : due <= 2 ? 4 : due <= 7 ? 2 : 0
  const stateWeight = item.status === "blocked" ? 7 : item.status === "in_progress" ? 2 : 0
  return priorityWeight[item.priority] + dueWeight + stateWeight
}

export function getFocusItems(store: Store, count = 3) {
  return [...store.workItems].filter((item) => item.status !== "done").sort((a, b) => focusScore(b) - focusScore(a)).slice(0, count)
}

export function projectProgress(store: Store, projectId: string) {
  const items = store.workItems.filter((item) => item.projectId === projectId)
  if (!items.length) return 0
  return Math.round((items.filter((item) => item.status === "done").length / items.length) * 100)
}

export function workload(store: Store, personId: string) {
  return store.workItems.filter((item) => item.status !== "done" && item.ownerIds.includes(personId)).length
}

export function dueLabel(due: string) {
  const today = "2026-10-15"
  if (!due) return "No date"
  if (due < today) return "Overdue"
  if (due === today) return "Today"
  if (due === "2026-10-16") return "Tomorrow"
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(`${due}T12:00:00`))
}
