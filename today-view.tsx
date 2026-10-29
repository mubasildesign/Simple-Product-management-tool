"use client"

import { dueLabel, getFocusItems, projectProgress } from "@/lib/insights"
import type { Store, WorkItem } from "@/lib/types"
import { ArrowUpIcon, CheckIcon, SparkleIcon } from "@/components/ui/icons"
import { Avatar, PriorityDot, Progress } from "@/components/ui/workspace"

export function TodayView({
  store,
  onOpen,
  onAssistant,
  onProposal,
  onCreateWork,
}: {
  store: Store
  onOpen: (item: WorkItem) => void
  onAssistant: () => void
  onProposal: (id: string, status: "applied" | "dismissed") => void
  onCreateWork: () => void
}) {
  const focus = getFocusItems(store)
  const proposal = store.aiProposals.find((item) => item.status === "pending")
  const name = store.people[0]?.name.split(" ")[0] || "there"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const today = new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date())

  return (
    <div className="page-wrap max-w-[1180px]">
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">{today}</p>
          <h1 className="page-title">{greeting}, {name}.</h1>
          <p className="mt-2 max-w-xl text-[15px] text-ink-soft">{store.workItems.length ? "Here is the work that needs you today." : "Your workspace is empty. Add a project and the first ticket when you are ready."}</p>
        </div>
        <button className="ask-button" onClick={onAssistant}>
          <SparkleIcon size={15} />
          Ask Atlas
          <kbd>⌘ K</kbd>
        </button>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <div className="surface-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="eyebrow">Your focus</p>
              <h2 className="section-title mt-1">Three things move the work forward</h2>
            </div>
            <span className="quiet-badge">AI prioritized</span>
          </div>
          <div className="divide-y divide-line">
            {!focus.length ? <div className="empty-state"><p>No open work yet.</p><button className="btn-primary mt-3" onClick={onCreateWork}>Add the first ticket</button></div> : null}
            {focus.map((item, index) => {
              const project = store.projects.find((candidate) => candidate.id === item.projectId)
              const owners = store.people.filter((person) => item.ownerIds.includes(person.id))
              return (
                <button key={item.id} className="focus-row w-full text-left" onClick={() => onOpen(item)}>
                  <span className="focus-number">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium text-ink">{item.title}</span>
                    <span className="mt-1 flex items-center gap-2 text-[12px] text-ink-faint">
                      <span className="truncate">{project?.name}</span>
                      <span>·</span>
                      <span className={dueLabel(item.due) === "Overdue" ? "text-danger" : ""}>{dueLabel(item.due)}</span>
                    </span>
                  </span>
                  <PriorityDot priority={item.priority} />
                  <span className="flex -space-x-1.5">{owners.map((person) => <Avatar key={person.id} person={person} size="sm" />)}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="assistant-glow p-5 sm:p-6">
            <span className="sparkle-mark"><SparkleIcon size={16} /></span>
            <p className="eyebrow mt-4">A gentle nudge</p>
            <h2 className="section-title mt-1">{proposal?.title ?? "Your plan looks balanced"}</h2>
            <p className="mt-3 text-[13px] leading-6 text-ink-soft">
              {proposal?.rationale ?? "There are no urgent changes to review. Keep the current focus and check in after the next update."}
            </p>
          </div>
          {proposal ? (
            <div className="flex gap-2 border-t border-line p-4">
              <button className="btn-primary flex-1" onClick={() => onProposal(proposal.id, "applied")}><CheckIcon /> Apply</button>
              <button className="btn-secondary" onClick={() => onProposal(proposal.id, "dismissed")}>Not now</button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow">Project pulse</p>
            <h2 className="section-title mt-1">Everything in motion</h2>
          </div>
          <span className="text-[12px] text-ink-faint">Updated moments ago</span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {!store.projects.length ? <div className="empty-state surface-card">No projects yet. The first one you create will show up here.</div> : null}
          {store.projects.map((project) => {
            const progress = projectProgress(store, project.id)
            const open = store.workItems.filter((item) => item.projectId === project.id && item.status !== "done").length
            const goal = store.goals.find((item) => item.projectId === project.id)
            return (
              <article className="project-card" key={project.id}>
                <div className="mb-5 flex items-start justify-between">
                  <span className="project-mark" style={{ background: project.accent }}>{project.name[0]}</span>
                  <span className={`health health-${project.health}`}>{project.health === "at_risk" ? "At risk" : project.health}</span>
                </div>
                <h3 className="text-[15px] font-semibold">{project.name}</h3>
                <p className="mt-1 line-clamp-2 min-h-10 text-[12px] leading-5 text-ink-soft">{project.summary}</p>
                <div className="mt-5">
                  <Progress value={progress} color={project.accent} />
                  <div className="mt-2 flex justify-between text-[11px] text-ink-faint">
                    <span>{progress}% complete</span>
                    <span>{open} open</span>
                  </div>
                </div>
                {goal ? (
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-3 py-2.5 text-[12px]">
                    <span className="truncate text-ink-soft">{goal.title}</span>
                    <span className="ml-3 font-semibold tabular-nums">{goal.current}{goal.unit}/{goal.target}{goal.unit}</span>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-4 pb-10 lg:grid-cols-2">
        <div className="surface-card p-5">
          <p className="eyebrow">Latest signals</p>
          <div className="mt-3 divide-y divide-line">
            {!store.updates.length ? <p className="py-6 text-[13px] text-ink-faint">No updates yet. Notes you add will gather here.</p> : null}
            {store.updates.map((update) => {
              const person = store.people.find((item) => item.id === update.authorId)
              const project = store.projects.find((item) => item.id === update.projectId)
              return (
                <div key={update.id} className="flex gap-3 py-3.5">
                  {person ? <Avatar person={person} /> : null}
                  <div className="min-w-0">
                    <p className="text-[13px] leading-5">{update.text}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{person?.name} · {project?.name}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        <button className="capture-card group text-left" onClick={onAssistant}>
          <span className="sparkle-mark"><ArrowUpIcon size={15} /></span>
          <span>
            <span className="eyebrow">Capture without organizing</span>
            <span className="section-title mt-1 block">Tell Atlas what changed</span>
            <span className="mt-2 block max-w-md text-[13px] leading-6 text-ink-soft">A decision, a new task, a concern, or a half-formed idea. Atlas will suggest where it belongs before saving anything.</span>
          </span>
        </button>
      </section>
    </div>
  )
}
