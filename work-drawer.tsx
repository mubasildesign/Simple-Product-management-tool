"use client"

import type { Priority, Status, Store, WorkItem } from "@/lib/types"
import { CalendarIcon, CloseIcon } from "@/components/ui/icons"
import { Avatar } from "@/components/ui/workspace"

export function WorkDrawer({ item, store, onClose, onPatch, onDelete }: { item: WorkItem; store: Store; onClose: () => void; onPatch: (id: string, patch: Partial<WorkItem>) => void; onDelete: (item: WorkItem) => void }) {
  const project = store.projects.find((candidate) => candidate.id === item.projectId)
  return (
    <div className="overlay" onMouseDown={onClose}>
      <section className="work-drawer drawer-in" role="dialog" aria-modal="true" aria-label={item.title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center border-b border-line px-5 py-4">
          <span className="flex items-center gap-2 text-[12px] text-ink-soft"><span className="project-dot" style={{ background: project?.accent }} />{project?.name}</span>
          <button className="icon-button ml-auto" onClick={onClose} aria-label="Close work item"><CloseIcon /></button>
        </header>
        <div className="overflow-y-auto p-6">
          <textarea className="drawer-title" value={item.title} rows={2} onChange={(event) => onPatch(item.id, { title: event.target.value })} />
          <div className="drawer-fields">
            <label><span>Status</span><select value={item.status} onChange={(event) => onPatch(item.id, { status: event.target.value as Status })}><option value="backlog">Backlog</option><option value="planned">Planned</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="done">Done</option></select></label>
            <label><span>Priority</span><select value={item.priority} onChange={(event) => onPatch(item.id, { priority: event.target.value as Priority })}><option>urgent</option><option>high</option><option>medium</option><option>low</option></select></label>
            <label><span>Due</span><span className="flex items-center gap-2"><CalendarIcon /><input type="date" value={item.due} onChange={(event) => onPatch(item.id, { due: event.target.value })} /></span></label>
            <div><span>Owners</span><span className="flex items-center gap-2">{store.people.filter((person) => item.ownerIds.includes(person.id)).map((person) => <span key={person.id} className="flex items-center gap-1.5"><Avatar person={person} size="sm" /><small>{person.name}</small></span>)}</span></div>
          </div>
          <label className="mt-7 block"><span className="eyebrow">Notes</span><textarea className="notes-area" placeholder="Context, decisions, links…" value={item.note} onChange={(event) => onPatch(item.id, { note: event.target.value })} /></label>
          <div className="mt-8 border-t border-line pt-5"><button className="text-[12px] text-danger" onClick={() => onDelete(item)}>Delete work item</button></div>
        </div>
      </section>
    </div>
  )
}
