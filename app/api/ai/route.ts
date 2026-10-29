import { NextResponse } from "next/server"
import { isProposalSafe, runAssistant } from "@/lib/ai"
import { canEnter, memberEmail } from "@/lib/session"
import { getStore } from "@/lib/store"

export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const { message } = (await request.json()) as { message?: string }
    if (!message?.trim()) return NextResponse.json({ error: "Tell the assistant what you need." }, { status: 400 })
    const store = await getStore()
    if (!canEnter(store, await memberEmail(store))) return NextResponse.json({ error: "Sign in to use the assistant." }, { status: 401 })
    const result = await runAssistant(message.trim(), store)
    if (result.proposal && !isProposalSafe(result.proposal, store)) {
      return NextResponse.json({ error: "The suggestion referenced workspace data that no longer exists." }, { status: 409 })
    }
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The assistant could not respond." }, { status: 503 })
  }
}
