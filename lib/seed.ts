import { defaultFirebase, defaultSettings } from "@/lib/settings"
import type { Store } from "@/lib/types"

export function createEmptyStore(): Store {
  return {
    version: 4,
    setup: { complete: false },
    auth: { mode: "local", firebase: defaultFirebase() },
    workspace: { id: "workspace", name: "" },
    settings: defaultSettings(),
    people: [],
    projects: [],
    goals: [],
    workItems: [],
    documents: [],
    updates: [],
    aiProposals: [],
  }
}
