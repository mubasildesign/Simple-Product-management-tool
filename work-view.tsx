"use client"

import { useMemo, useState } from "react"
import type { Priority, Status, Store, WorkItem } from "@/lib/types"
import { dueLabel } from "@/lib/insights"
import { CalendarIcon, GroupIcon, PlusIcon, SearchIcon, TasksIcon } from "@/components/ui/icons"
import { Avatar, PriorityDot, StatusPill } from "@/components/ui/workspace"

const statuses: Status[] = ["backlog", "planned", "in_progress", "blocked", "done"]
const statusLabel: Record<Status, string> = { backlog: "Backlog", planned: "Planned", in_progress: "In progress", blocked: "Blocked", done: "Done" }

export function WorkView({
  store,
  onOpen,
  onPatch,
  onCreate,
  onCreateProject,
}: {
  store: Store
  onOpen: (item: WorkItem) => void
  onPatch: (id: string, patch: Partial<WorkItem>) => void
  onCreate: (projectId: string, title: string) => void
  onCreateProject: (name: string) => void
}) {
  const [projectId, setProjectId] = useState("all")
  const [status, setStatus] = useState<Status | "all">("all")
  const [query, setQuery] = useState("")
  const [layout, setLayout] = useState<"list" | "board">("list")
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")
  const [projectDraft, setProjectDraft] = useState("")

  const items = useMemo(
    () =>
      store.workItems.filter((item) => {
        const matchesProject = projectId === "all" || item.projectId === projectId
        const matchesStatus = status === "all" || item.status === status
        return matchesProject && matchesStatus && item.title.toLowerCase().includes(query.toLowerCase())
      }),
    [projectId, query, status, store.workItems],
  )

  function add() {
    if (!draft.trim() || !store.projects.length) return
    onCreate(projectId === "all" ? store.projects[0].id : projectId, draft.trim())
    setDraft("")
    setAdding(false)
  }

  return (
    <div className="page-wrap max-w-[1320px]">
      <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1 className="page-title">Work</h1>
          <p className="mt-2 text-[14px] text-ink-soft">Plans that stay useful when the day changes.</p>
        </div>
        <button className="btn-primary" onClick={() => store.projects.length ? setAdding(true) : undefined} disabled={!store.projects.length}><PlusIcon /> Add work</button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="filter-control min-w-[200px]">
          <span className="project-dot" style={{ background: projectId === "all" ? "#8D8A83" : store.projects.find((project) => project.id === projectId)?.accent }} />
          <select aria-label="Project" value={projectId} onChange={(event) => setProjectId(event.target.value)}>
            <option value="all">All projects</option>
            {store.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label className="filter-control">
          <select aria-label="Status" value={status} onChange={(event) => setStatus(event.target.value as Status | "all")}>
            <option value="all">Any status</option>
            {statuses.map((item) => <option value={item} key={item}>{statusLabel[item]}</option>)}
          </select>
        </label>
        <label className="search-control">
          <SearchIcon />
          <input aria-label="Search work" placeholder="Search work" value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="view-toggle sm:ml-auto">
          <button aria-label="List view" className={layout === "list" ? "active" : ""} onClick={() => setLayout("list")}><TasksIcon /></button>
          <button aria-label="Board view" className={layout === "board" ? "active" : ""} onClick={() => setLayout("board")}><GroupIcon /></button>
        </div>
      </div>

      {!store.projects.length ? (
        <form className="surface-card mb-4 flex flex-wrap gap-2 p-4" onSubmit={(event) => { event.preventDefault(); if (!projectDraft.trim()) return; onCreateProject(projectDraft.trim()); setProjectDraft("") }}>
          <input className="min-w-0 flex-1 bg-transparent px-2 outline-none" aria-label="First project name" placeholder="Name your first project" value={projectDraft} onChange={(event) => setProjectDraft(event.target.value)} />
          <button className="btn-primary" type="submit">Create project</button>
        </form>
      ) : null}

      {adding ? (
        <div className="mb-4 flex gap-2 rounded-2xl border border-accent/30 bg-white p-3 shadow-soft">
          <input autoFocus className="min-w-0 flex-1 bg-transparent px-2 text-[14px] outline-none" placeholder="What needs to happen?" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") add(); if (event.key === "Escape") setAdding(false) }} />
          <button className="btn-primary" onClick={add}>Add</button>
          <button className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : null}

      {layout === "list" ? (
        <div className="work-table">
          <div className="work-head">
            <span>Work item</span><span>Status</span><span>Owner</span><span>Due</span><span>Priority</span>
          </div>
          {items.map((item) => {
            const project = store.projects.find((candidate) => candidate.id === item.projectId)
            const owners = store.people.filter((person) => item.ownerIds.includes(person.id))
            return (
              <div className="work-row" key={item.id}>
                <button className="min-w-0 text-left" onClick={() => onOpen(item)}>
                  <span className="block truncate text-[13px] font-medium">{item.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-faint"><span className="project-dot" style={{ background: project?.accent }} />{project?.name}</span>
                </button>
                <label className="cell-select">
                  <StatusPill status={item.status} />
                  <select aria-label={`Status for ${item.title}`} value={item.status} onChange={(event) => onPatch(item.id, { status: event.target.value as Status })}>
                    {statuses.map((value) => <option key={value} value={value}>{statusLabel[value]}</option>)}
                  </select>
                </label>
                <span className="flex -space-x-1">{owners.length ? owners.map((person) => <Avatar key={person.id} person={person} />) : <span className="text-[12px] text-ink-faint">Unassigned</span>}</span>
                <span className={`flex items-center gap-1.5 text-[12px] ${dueLabel(item.due) === "Overdue" ? "text-danger" : "text-ink-soft"}`}><CalendarIcon size={13} />{dueLabel(item.due)}</span>
                <label className="cell-select">
                  <PriorityDot priority={item.priority} withLabel />
                  <select aria-label={`Priority for ${item.title}`} value={item.priority} onChange={(event) => onPatch(item.id, { priority: event.target.value as Priority })}>
                    {(["urgent", "high", "medium", "low"] as Priority[]).map((value) => <option key={value}>{value}</option>)}
                  </select>
                </label>
              </div>
            )
          })}
          {!items.length ? <div className="empty-state">Nothing matches those filters. A little space can be useful.</div> : null}
        </div>
      ) : (
        <div className="board-grid">
          {statuses.filter((item) => item !== "done").map((column) => (
            <section key={column} className="board-column">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[12px] font-semibold">{statusLabel[column]}</span>
                <span className="text-[11px] text-ink-faint">{items.filter((item) => item.status === column).length}</span>
              </div>
              <div className="grid gap-2">
                {items.filter((item) => item.status === column).map((item) => {
                  const project = store.projects.find((candidate) => candidate.id === item.projectId)
                  return (
                    <button key={item.id} className="board-card text-left" onClick={() => onOpen(item)}>
                      <span className="mb-3 block h-1 w-8 rounded-full" style={{ background: project?.accent }} />
                      <span className="text-[13px] font-medium leading-5">{item.title}</span>
                      <span className="mt-4 flex items-center justify-between"><span className="text-[11px] text-ink-faint">{dueLabel(item.due)}</span><PriorityDot priority={item.priority} /></span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
