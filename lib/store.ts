import { promises as fs } from "fs"
import path from "path"
import { createEmptyStore } from "@/lib/seed"
import { normalizeStore, publicStore } from "@/lib/settings"
import type { Store } from "@/lib/types"

const filePath = path.join(process.cwd(), "data", "store.json")

let chain: Promise<void> = Promise.resolve()

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const run = chain.then(work, work)
  chain = run.then(
    () => undefined,
    () => undefined,
  )
  return run
}

async function write(store: Store) {
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(store, null, 2))
}

async function readStore(): Promise<Store> {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, "utf8")) as Store
    if (parsed?.version === 4) return normalizeStore(parsed)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error
  }
  const fresh = createEmptyStore()
  await write(fresh)
  return fresh
}

export function getStore() {
  return enqueue(() => readStore())
}

export async function getPublicStore() {
  return publicStore(await getStore())
}

export function mutateStore(mutator: (store: Store) => void) {
  return enqueue(async () => {
    const store = await readStore()
    mutator(store)
    await write(store)
    return store
  })
}
