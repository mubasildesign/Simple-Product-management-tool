import { describe, expect, it } from "vitest"
import { createEmptyStore } from "@/lib/seed"
import { publicStore } from "@/lib/settings"

describe("public settings", () => {
  it("keeps the AI key on the server and exposes only a hint", () => {
    const store = createEmptyStore()
    store.settings.ai.apiKey = "sk-test-secret-1234"
    store.settings.ai.enabled = true
    const visible = publicStore(store)
    expect(visible.settings.ai.apiKey).toBe("")
    expect(visible.settings.ai.hasKey).toBe(true)
    expect(visible.settings.ai.keyHint).toBe("••••1234")
    expect(JSON.stringify(visible)).not.toContain("sk-test-secret")
  })

  it("accepts a GitHub link and drops other websites", () => {
    const store = createEmptyStore()
    store.settings.githubUrl = "https://github.com/example/atlas"
    expect(publicStore(store).settings.githubUrl).toBe("https://github.com/example/atlas")
    store.settings.githubUrl = "https://example.com"
    expect(publicStore(store).settings.githubUrl).toBe("")
  })
})
