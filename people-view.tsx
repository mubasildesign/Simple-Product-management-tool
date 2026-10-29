"use client"

import { useMemo, useState } from "react"
import { workload } from "@/lib/insights"
import type { Person, Store } from "@/lib/types"
import { PlusIcon } from "@/components/ui/icons"
import { Avatar } from "@/components/ui/workspace"

export function PeopleView({ store, onPatch, onCreate }: { store: Store; onPatch: (id: string, patch: Partial<Person>) => void; onCreate: (name: string) => void }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState("")
  const average = useMemo(() => store.people.length ? Math.round(store.people.reduce((sum, person) => sum + workload(store, person.id), 0) / store.people.length) : 0, [store])
  const add = () => {
    if (!name.trim()) return
    onCreate(name.trim())
    setName("")
    setAdding(false)
  }

  return (
    <div className="page-wrap max-w-[1120px]">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div><p className="eyebrow">The humans behind the work</p><h1 className="page-title">People</h1><p className="mt-2 text-[14px] text-ink-soft">A useful workload signal, never a performance score.</p></div>
        <button className="btn-primary" onClick={() => setAdding(true)}><PlusIcon /> Add person</button>
      </header>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="mini-stat"><span>Team</span><strong>{store.people.length}</strong><small>people contributing</small></div>
        <div className="mini-stat"><span>Typical load</span><strong>{average}</strong><small>open items per person</small></div>
        <div className="mini-stat"><span>Available</span><strong>{store.people.filter((person) => person.capacity === "open").length}</strong><small>with room to help</small></div>
      </div>
      {adding ? (
        <div className="mb-4 flex gap-2 rounded-2xl border border-accent/30 bg-white p-3 shadow-soft">
          <input autoFocus className="min-w-0 flex-1 bg-transparent px-2 outline-none" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") add(); if (event.key === "Escape") setAdding(false) }} />
          <button className="btn-primary" onClick={add}>Add</button><button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : null}
      <section className="surface-card overflow-hidden">
        <div className="people-head"><span>Person</span><span>Role</span><span>Workload</span><span>Capacity</span></div>
        {store.people.map((person) => {
          const count = workload(store, person.id)
          const blocked = store.workItems.filter((item) => item.status === "blocked" && item.ownerIds.includes(person.id)).length
          return (
            <div className="people-row" key={person.id}>
              <div className="flex items-center gap-3">
                <Avatar person={person} size="lg" />
                <div className="min-w-0"><input className="inline-input font-medium" value={person.name} aria-label="Name" onChange={(event) => onPatch(person.id, { name: event.target.value })} /><p className="truncate text-[11px] text-ink-faint">{person.email || "No email needed"}</p></div>
              </div>
              <input className="inline-input text-ink-soft" value={person.role} aria-label={`Role for ${person.name}`} onChange={(event) => onPatch(person.id, { role: event.target.value })} />
              <div><p className="text-[13px] font-medium">{count} open</p><p className={`text-[11px] ${blocked ? "text-danger" : "text-ink-faint"}`}>{blocked ? `${blocked} blocked` : "Moving normally"}</p></div>
              <label className={`capacity capacity-${person.capacity}`}>
                <select value={person.capacity} aria-label={`Capacity for ${person.name}`} onChange={(event) => onPatch(person.id, { capacity: event.target.value as Person["capacity"] })}><option value="open">Open</option><option value="balanced">Balanced</option><option value="full">Full</option></select>
              </label>
            </div>
          )
        })}
      </section>
    </div>
  )
}
