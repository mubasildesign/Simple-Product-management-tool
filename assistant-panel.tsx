"use client"

import { useEffect, useRef, useState } from "react"
import type { AIProposal } from "@/lib/types"
import { ArrowUpIcon, CheckIcon, CloseIcon, SparkleIcon } from "@/components/ui/icons"

type Result = { reply: string; proposal: AIProposal | null; mode: "live" | "demo" }

export function AssistantPanel({ open, onClose, onProposal }: { open: boolean; onClose: () => void; onProposal: (proposal: AIProposal) => void }) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()) }, [open])
  if (!open) return null

  async function submit(text = message) {
    if (!text.trim() || loading) return
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Atlas could not respond.")
      setResult(data)
      setMessage("")
    } catch (error) {
      setResult({ reply: error instanceof Error ? error.message : "Atlas could not respond.", proposal: null, mode: "demo" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <section className="assistant-panel drawer-in" role="dialog" aria-modal="true" aria-label="Ask Atlas" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-line px-5 py-4">
          <span className="brand-mark"><SparkleIcon size={15} /></span>
          <div><h2 className="text-[14px] font-semibold">Ask Atlas</h2><p className="text-[11px] text-ink-faint">Think together. Review before changing.</p></div>
          <button className="icon-button ml-auto" onClick={onClose} aria-label="Close assistant"><CloseIcon /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {!result && !loading ? (
            <>
              <div className="assistant-welcome">
                <SparkleIcon size={22} />
                <h3>What would make the day clearer?</h3>
                <p>Capture work, ask about priorities, or turn a loose thought into a reviewable plan.</p>
              </div>
              <div className="mt-5 grid gap-2">
                {["What should I focus on today?", "Add a task to prepare the onboarding research plan", "What looks at risk this week?"].map((prompt) => <button key={prompt} onClick={() => { setMessage(prompt); void submit(prompt) }} className="prompt-chip">{prompt}</button>)}
              </div>
            </>
          ) : null}
          {loading ? <div className="assistant-thinking"><span /><span /><span /> Atlas is reading the workspace…</div> : null}
          {result ? (
            <div className="fade-in">
              <span className={`quiet-badge ${result.mode === "demo" ? "" : "live"}`}>{result.mode === "demo" ? "Local demo" : "Live AI"}</span>
              <p className="mt-4 text-[14px] leading-7">{result.reply}</p>
              {result.proposal ? (
                <div className="proposal-card">
                  <p className="eyebrow">Proposed change</p><h3>{result.proposal.title}</h3><p>{result.proposal.rationale}</p>
                  <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" onClick={() => { onProposal(result.proposal!); setResult(null) }}><CheckIcon /> Add to review</button><button className="btn-secondary" onClick={() => setResult(null)}>Discard</button></div>
                </div>
              ) : <button className="mt-5 text-[12px] font-medium text-accent" onClick={() => setResult(null)}>Ask something else</button>}
            </div>
          ) : null}
        </div>
        <form className="assistant-composer" onSubmit={(event) => { event.preventDefault(); void submit() }}>
          <textarea ref={inputRef} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submit() } }} placeholder="Ask, capture, or plan…" rows={2} />
          <button disabled={!message.trim() || loading} aria-label="Send"><ArrowUpIcon /></button>
          <p>Enter to send · Shift Enter for a new line</p>
        </form>
      </section>
    </div>
  )
}
