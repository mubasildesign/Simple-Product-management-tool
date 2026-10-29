import { AppShell } from "@/components/app-shell"
import { LoginScreen } from "@/components/login-screen"
import { VIEWS, type View } from "@/lib/client"
import { canEnter, memberEmail } from "@/lib/session"
import { getPublicStore, getStore } from "@/lib/store"

export const dynamic = "force-dynamic"

export default async function HomePage({ searchParams }: { searchParams: Promise<{ view?: string; item?: string }> }) {
  const params = await searchParams
  const full = await getStore()
  const view: View = VIEWS.includes(params.view as View) ? (params.view as View) : "today"
  if (full.setup.complete && !canEnter(full, await memberEmail(full))) {
    return <LoginScreen workspaceName={full.workspace.name} firebase={full.auth.firebase} />
  }

  return <AppShell initialStore={await getPublicStore()} initialView={view} initialItemId={params.item ?? null} />
}
