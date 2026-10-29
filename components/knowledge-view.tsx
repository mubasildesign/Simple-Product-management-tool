"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Document, Store } from "@/lib/types"
import { DocIcon, SearchIcon } from "@/components/ui/icons"

export function KnowledgeView({ store, onSave, onCreate }: { store: Store; onSave: (id: string, content: string) => void; onCreate: (title: string) => void }) {
  const [selectedId, setSelectedId] = useState(store.documents[0]?.id ?? "")
  const selected = store.documents.find((document) => document.id === selectedId) ?? store.documents[0]
  const [draft, setDraft] = useState(selected?.content ?? "")
  const [editing, setEditing] = useState(false)
  const [query, setQuery] = useState("")
  const [title, setTitle] = useState("")

  useEffect(() => {
    setDraft(selected?.content ?? "")
    setEditing(false)
  }, [selected?.id, selected?.content])

  const documents = store.documents.filter((document) => `${document.title} ${document.content}`.toLowerCase().includes(query.toLowerCase()))
  const projectName = (document: Document) => store.projects.find((project) => project.id === document.projectId)?.name ?? "Workspace"

  return (
    <div className="knowledge-layout">
      <aside className="knowledge-list">
        <div className="mb-5"><p className="eyebrow">Shared context</p><h1 className="page-title">Knowledge</h1></div>
        <label className="search-control w-full"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search knowledge" /></label>
        <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (!title.trim()) return; onCreate(title.trim()); setTitle("") }}>
          <input className="min-w-0 flex-1 rounded-lg border border-line bg-transparent px-2" aria-label="New document title" placeholder="New document" value={title} onChange={(event) => setTitle(event.target.value)} />
          <button className="btn-secondary" type="submit">Add</button>
        </form>
        <div className="mt-4 grid gap-1">
          {documents.map((document) => (
            <button key={document.id} onClick={() => setSelectedId(document.id)} className={`document-link ${selected?.id === document.id ? "active" : ""}`}>
              <DocIcon size={15} /><span className="min-w-0"><span className="block truncate text-[13px] font-medium">{document.title}</span><span className="mt-0.5 block text-[10px] uppercase tracking-wide text-ink-faint">{document.kind} · {projectName(document)}</span></span>
            </button>
          ))}
        </div>
      </aside>
      <main className="knowledge-document">
        {selected ? (
          <>
            <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
              <div><span className="quiet-badge">{selected.kind}</span><p className="mt-2 text-[11px] text-ink-faint">{projectName(selected)} · Edited recently</p></div>
              {editing ? (
                <div className="flex gap-2"><button className="btn-secondary" onClick={() => { setDraft(selected.content); setEditing(false) }}>Cancel</button><button className="btn-primary" onClick={() => { onSave(selected.id, draft); setEditing(false) }}>Save</button></div>
              ) : <button className="btn-secondary" onClick={() => setEditing(true)}>Edit document</button>}
            </div>
            {editing ? (
              <textarea className="document-editor" value={draft} onChange={(event) => setDraft(event.target.value)} aria-label={`Edit ${selected.title}`} />
            ) : (
              <article className="prose-doc"><ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.content}</ReactMarkdown></article>
            )}
          </>
        ) : <div className="empty-state">Choose a document to begin.</div>}
      </main>
    </div>
  )
}
