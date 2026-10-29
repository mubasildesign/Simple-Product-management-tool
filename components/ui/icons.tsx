import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Base({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  )
}

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" />
  </Base>
)

export const ChevronDownIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4.5 6.5 8 10l3.5-3.5" />
  </Base>
)

export const ChevronRightIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M6.5 4.5 10 8l-3.5 3.5" />
  </Base>
)

export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Base>
)

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="7" cy="7" r="4.25" />
    <path d="m10.25 10.25 3 3" />
  </Base>
)

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="3.5" width="11" height="10" rx="2" />
    <path d="M2.5 6.5h11M5.5 2v2.5M10.5 2v2.5" />
  </Base>
)

export const TasksIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" />
    <path d="m5 8 2 2 4-4" />
  </Base>
)

export const StarIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m8 2.5 1.7 3.4 3.8.6-2.75 2.65.65 3.75L8 11.1l-3.4 1.8.65-3.75L2.5 6.5l3.8-.6L8 2.5Z" />
  </Base>
)

export const UsersIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="6" cy="5.5" r="2.25" />
    <path d="M2 13c.4-2.2 2-3.5 4-3.5s3.6 1.3 4 3.5" />
    <path d="M10.5 3.4a2.2 2.2 0 0 1 0 4.2M11.75 9.75c1.2.45 2 1.6 2.25 3.25" />
  </Base>
)

export const DocIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 2.5h5l3 3v8H4z" />
    <path d="M9 2.5v3h3M6 8.5h4M6 11h4" />
  </Base>
)

export const MoreIcon = (p: IconProps) => (
  <Base {...p} strokeWidth={0} fill="currentColor">
    <circle cx="3.5" cy="8" r="1.25" />
    <circle cx="8" cy="8" r="1.25" />
    <circle cx="12.5" cy="8" r="1.25" />
  </Base>
)

export const CloseIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Base>
)

export const NoteIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 3.5h10M3 6.5h10M3 9.5h6" />
  </Base>
)

export const ExpandIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M9.5 2.5h4v4M13.5 2.5 9 7M6.5 13.5h-4v-4M2.5 13.5 7 9" />
  </Base>
)

export const GroupIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M2.5 4h11M4.5 8h9M6.5 12h7" />
  </Base>
)

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="5.5" r="2.5" />
    <path d="M3 13.5c.5-2.6 2.5-4 5-4s4.5 1.4 5 4" />
  </Base>
)

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m2.5 7 5.5-4.5L13.5 7v6.5h-11z" />
    <path d="M6.25 13.5V9h3.5v4.5" />
  </Base>
)

export const SparkleIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 1.75c.4 3.15 2.1 4.85 5.25 5.25C10.1 7.4 8.4 9.1 8 12.25 7.6 9.1 5.9 7.4 2.75 7 5.9 6.6 7.6 4.9 8 1.75Z" />
    <path d="M12.25 11c.15 1.2.8 1.85 2 2-1.2.15-1.85.8-2 2-.15-1.2-.8-1.85-2-2 1.2-.15 1.85-.8 2-2Z" />
  </Base>
)

export const ArrowUpIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M8 13V3M4 7l4-4 4 4" />
  </Base>
)

export const SettingsIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.8v1.7M8 12.5v1.7M1.8 8h1.7M12.5 8h1.7M3.4 3.4l1.2 1.2M11.4 11.4l1.2 1.2M12.6 3.4l-1.2 1.2M4.6 11.4l-1.2 1.2" />
  </Base>
)

export const InboxIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 3h10l1 6v4H2V9z" />
    <path d="M2 9h3l1 2h4l1-2h3" />
  </Base>
)
