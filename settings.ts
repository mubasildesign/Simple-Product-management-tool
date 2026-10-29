import type { AiProvider, FirebaseConfig, MemberRole, Settings, Store, ThemePreset } from "@/lib/types"

export const THEME_PRESETS: Record<ThemePreset, { label: string; canvas: string; ink: string; accent: string }> = {
  stone: { label: "Stone", canvas: "#f5f4f0", ink: "#22231f", accent: "#7257d9" },
  dusk: { label: "Dusk", canvas: "#eef0f6", ink: "#1b2030", accent: "#5b6cff" },
  grove: { label: "Grove", canvas: "#f2f6f2", ink: "#1d2822", accent: "#2f8f6b" },
  ink: { label: "Ink", canvas: "#141513", ink: "#f3f1ea", accent: "#b7a6f5" },
}

export const ACCENTS = ["#7257d9", "#5b6cff", "#2f8f6b", "#d4784a", "#c45b78", "#3d8fd4"]

const PROVIDERS = new Set<AiProvider>(["openai", "anthropic", "compatible"])
const PRESETS = new Set<ThemePreset>(["stone", "dusk", "grove", "ink"])
const ROLES = new Set<MemberRole>(["owner", "admin", "member", "viewer"])

export function defaultFirebase(): FirebaseConfig {
  return { apiKey: "", authDomain: "", projectId: "", appId: "" }
}

export function firebaseReady(config: FirebaseConfig) {
  return [config.apiKey, config.authDomain, config.projectId, config.appId].every((value) => value.trim().length > 8)
}

export function defaultSettings(): Settings {
  return {
    githubUrl: "",
    theme: { preset: "stone", accent: THEME_PRESETS.stone.accent },
    ai: {
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-4.1-mini",
      enabled: false,
      apiKey: "",
      hasKey: false,
      keyHint: "",
    },
  }
}

export function normalizeStore(store: Store): Store {
  const defaults = defaultSettings()
  const themePreset = PRESETS.has(store.settings?.theme?.preset) ? store.settings.theme.preset : defaults.theme.preset
  const provider = PROVIDERS.has(store.settings?.ai?.provider) ? store.settings.ai.provider : defaults.ai.provider
  const apiKey = typeof store.settings?.ai?.apiKey === "string" ? store.settings.ai.apiKey.trim() : ""
  const firebase = { ...defaultFirebase(), ...store.auth?.firebase }
  return {
    ...store,
    setup: { complete: Boolean(store.setup?.complete) },
    auth: {
      mode: store.auth?.mode === "firebase" && firebaseReady(firebase) ? "firebase" : "local",
      firebase,
    },
    settings: {
      githubUrl: safeUrl(store.settings?.githubUrl),
      theme: {
        preset: themePreset,
        accent: safeColor(store.settings?.theme?.accent, THEME_PRESETS[themePreset].accent),
      },
      ai: {
        provider,
        baseUrl: safeHttpUrl(store.settings?.ai?.baseUrl) || defaultBaseUrl(provider),
        model: (store.settings?.ai?.model || defaultModel(provider)).slice(0, 80),
        enabled: Boolean(store.settings?.ai?.enabled),
        apiKey,
        hasKey: apiKey.length > 0,
        keyHint: apiKey ? `••••${apiKey.slice(-4)}` : "",
      },
    },
    people: (store.people ?? []).map((person, index) => ({
      ...person,
      access: ROLES.has(person.access) ? person.access : index === 0 ? "owner" : "member",
    })),
  }
}

export function publicStore(store: Store): Store {
  const normalized = normalizeStore(store)
  return {
    ...normalized,
    settings: {
      ...normalized.settings,
      ai: { ...normalized.settings.ai, apiKey: "" },
    },
  }
}

export function defaultBaseUrl(provider: AiProvider) {
  if (provider === "anthropic") return "https://api.anthropic.com"
  return "https://api.openai.com/v1"
}

export function defaultModel(provider: AiProvider) {
  if (provider === "anthropic") return "claude-sonnet-4-5"
  return "gpt-4.1-mini"
}

function safeColor(value: string | undefined, fallback: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value! : fallback
}

function safeUrl(value: string | undefined) {
  const url = safeHttpUrl(value)
  return url.includes("github.com") || url === "" ? url : ""
}

function safeHttpUrl(value: string | undefined) {
  try {
    const url = new URL(value || "")
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString().replace(/\/$/, "") : ""
  } catch {
    return ""
  }
}
