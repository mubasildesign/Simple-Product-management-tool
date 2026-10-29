"use client"

import type { ReactNode } from "react"
import type { View } from "@/lib/client"
import type { Store } from "@/lib/types"
import { DocIcon, HomeIcon, SettingsIcon, SparkleIcon, TasksIcon, UsersIcon } from "@/components/ui/icons"
import { Avatar } from "@/components/ui/workspace"

const NAV: Array<{ id: View; label: string; icon: ReactNode }> = [
  { id: "today", label: "Today", icon: <HomeIcon /> },
  { id: "work", label: "Work", icon: <TasksIcon /> },
  { id: "people", label: "People", icon: <UsersIcon /> },
  { id: "knowledge", label: "Knowledge", icon: <DocIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
]

export function Sidebar({ store, view, onView, onAssistant }: { store: Store; view: View; onView: (view: View) => void; onAssistant: () => void }) {
  const me = store.people[0]
  return (
    <>
      <aside className="sidebar-shell">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <span className="brand-mark"><SparkleIcon size={15} /></span>
          <div className="min-w-0"><p className="truncate font-[family-name:var(--font-display)] text-[14px] font-semibold">Atlas</p><p className="truncate text-[10px] uppercase tracking-[0.12em] text-ink-faint">{store.workspace.name}</p></div>
          <button aria-label="Open settings" className="ml-auto text-ink-faint" onClick={() => onView("settings")}>···</button>
        </div>
        <button className="sidebar-ask" onClick={onAssistant}><SparkleIcon size={14} /><span>Ask anything</span><kbd>⌘K</kbd></button>
        <nav className="mt-4 grid gap-1" aria-label="Main">
          {NAV.map((item) => <button key={item.id} onClick={() => onView(item.id)} className={`nav-link ${view === item.id ? "active" : ""}`} aria-current={view === item.id ? "page" : undefined}><span>{item.icon}</span>{item.label}{item.id === "work" ? <small>{store.workItems.filter((work) => work.status !== "done").length}</small> : null}</button>)}
        </nav>
        <div className="mt-7 px-2">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">Projects</p>
          {store.projects.length ? store.projects.map((project) => <button key={project.id} onClick={() => onView("work")} className="project-link"><span className="project-dot" style={{ background: project.accent }} /> <span className="truncate">{project.name}</span></button>) : <p className="px-2 text-[11px] text-ink-faint">No projects yet</p>}
        </div>
        {store.settings.githubUrl ? <a className="source-link" href={store.settings.githubUrl} target="_blank" rel="noreferrer">Open source on GitHub</a> : <button className="source-link" onClick={() => onView("settings")}>Add GitHub link</button>}
        <div className="mt-3 flex items-center gap-2.5 border-t border-line px-3 pt-4">
          {me ? <Avatar person={me} /> : null}<span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{me?.name || "Not set up"}</span><span className="block text-[10px] text-ink-faint">{store.auth.mode === "firebase" ? "Firebase login" : "No shared login"}</span></span><span className="presence-dot" />
        </div>
      </aside>
      <nav className="mobile-nav" aria-label="Main">
        {NAV.map((item) => <button key={item.id} onClick={() => onView(item.id)} className={view === item.id ? "active" : ""}><span>{item.icon}</span><small>{item.label}</small></button>)}
        <button onClick={onAssistant}><span><SparkleIcon /></span><small>Ask</small></button>
      </nav>
    </>
  )
}
