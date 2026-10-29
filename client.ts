import type { Store } from "@/lib/types"

export type View = "today" | "work" | "people" | "knowledge" | "settings"

export const VIEWS: View[] = ["today", "work", "people", "knowledge", "settings"]

export type ToastInput = { tone: "ok" | "error"; text: string; action?: { label: string; run: () => void } }

export type Operation = Record<string, unknown> & { type: string }
export type Mutate = (optimistic: (store: Store) => Store, operation: Operation) => Promise<Store | null>

let queue: Promise<unknown> = Promise.resolve()

export function send(operation: Operation): Promise<Store> {
  const run = queue.then(
    () => request(operation),
    () => request(operation),
  )
  queue = run.catch(() => undefined)
  return run
}

async function request(operation: Operation): Promise<Store> {
  let response: Response
  try {
    response = await fetch("/api/store", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(operation),
    })
  } catch {
    throw new Error("Could not reach your workspace. Check your connection and try again.")
  }
  const data = (await response.json().catch(() => ({}))) as Store & { error?: string }
  if (!response.ok) throw new Error(data.error || "Could not save that change.")
  return data
}
