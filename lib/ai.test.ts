import { afterEach, describe, expect, it } from "vitest"
import { isProposalSafe, runAssistant } from "@/lib/ai"
import { createEmptyStore } from "@/lib/seed"
import type { AIProposal } from "@/lib/types"

afterEach(() => {
  delete process.env.AI_API_KEY
  delete process.env.OPENAI_API_KEY
})

describe("assistant fallback", () => {
  it("answers an empty workspace without inventing work", async () => {
    const result = await runAssistant("What should I focus on today?", createEmptyStore())
    expect(result.mode).toBe("demo")
    expect(result.proposal).toBeNull()
    expect(result.reply).toContain("Nothing is scheduled")
  })

  it("creates a reviewable ticket only after a project exists", async () => {
    const store = createEmptyStore()
    expect((await runAssistant("Add a task to prepare the research plan", store)).proposal).toBeNull()
    store.projects = [{ id: "project", name: "Research", summary: "", health: "calm", accent: "#7257d9", startDate: "", targetDate: "" }]
    const result = await runAssistant("Add a task to prepare the research plan", store)
    expect(result.proposal?.actions[0].type).toBe("create_work_item")
    expect(isProposalSafe(result.proposal!, store)).toBe(true)
  })

  it("rejects proposals that reference unknown projects", () => {
    const store = createEmptyStore()
    const proposal: AIProposal = {
      id: "proposal",
      title: "Add work",
      rationale: "Test",
      status: "pending",
      source: "fallback",
      createdAt: "",
      actions: [{ type: "create_work_item", payload: { projectId: "missing", goalId: null, title: "Write the brief", ownerIds: [], due: "", status: "planned", priority: "medium", note: "" } }],
    }
    expect(isProposalSafe(proposal, store)).toBe(false)
  })
})
