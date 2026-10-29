import type { Person, Priority, Status } from "@/lib/types"

const statusLabels: Record<Status, string> = {
  backlog: "Backlog",
  planned: "Planned",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
}

export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill status-${status}`}>{statusLabels[status]}</span>
}

export function PriorityDot({ priority, withLabel = false }: { priority: Priority; withLabel?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12px] capitalize text-ink-soft">
      <span className={`h-2 w-2 rounded-full priority-${priority}`} />
      {withLabel ? priority : null}
    </span>
  )
}

export function Avatar({ person, size = "md" }: { person: Person; size?: "sm" | "md" | "lg" }) {
  const initials = person.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  return (
    <span
      title={person.name}
      className={`avatar avatar-${person.color} ${size === "sm" ? "h-6 w-6 text-[9px]" : size === "lg" ? "h-10 w-10 text-[12px]" : "h-7 w-7 text-[10px]"}`}
    >
      {initials}
    </span>
  )
}

export function Progress({ value, color = "#7C5CFC" }: { value: number; color?: string }) {
  return (
    <span className="block h-1.5 overflow-hidden rounded-full bg-[#EAE8E3]">
      <span className="block h-full rounded-full transition-[width]" style={{ width: `${Math.max(0, Math.min(value, 100))}%`, background: color }} />
    </span>
  )
}
