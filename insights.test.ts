import { describe, expect, it } from "vitest"
import { createEmptyStore } from "@/lib/seed"
import { focusScore, getFocusItems, projectProgress, workload } from "@/lib/insights"
import type { WorkItem } from "@/lib/types"

function item(partial: Partial<WorkItem> & Pick<WorkItem, "id" | "status" | "priority">): WorkItem {
  return { projectId: "project", goalId: null, title: partial.id, ownerIds: [], due: "2026-10-20", note: "", createdAt: "", updatedAt: "", ...partial }
}

describe("workspace insights", () => {
  it("puts urgent blocked work ahead of routine planned work", () => {
    const store = createEmptyStore()
    store.workItems = [
      item({ id: "planned", status: "planned", priority: "medium" }),
      item({ id: "blocked", status: "blocked", priority: "urgent", due: "2026-10-16" }),
    ]
    expect(focusScore(store.workItems[1])).toBeGreaterThan(focusScore(store.workItems[0]))
    expect(getFocusItems(store)[0].id).toBe("blocked")
  })

  it("computes progress and workload from the tickets a team adds", () => {
    const store = createEmptyStore()
    store.projects = [{ id: "project", name: "Launch", summary: "", health: "calm", accent: "#7257d9", startDate: "", targetDate: "" }]
    store.people = [{ id: "owner", name: "Ada", role: "Owner", email: "ada@example.com", color: "violet", capacity: "open", access: "owner" }]
    store.workItems = [
      item({ id: "done", status: "done", priority: "low", ownerIds: ["owner"] }),
      item({ id: "open", status: "planned", priority: "high", ownerIds: ["owner"] }),
    ]
    expect(projectProgress(store, "project")).toBe(50)
    expect(workload(store, "owner")).toBe(1)
  })
})
