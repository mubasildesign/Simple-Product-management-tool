"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">The tracker did not load</h1>
      <p className="mt-2 text-[15px] text-[#6B6F76]">Try again. If it keeps happening, refresh the page.</p>
      <button type="button" className="btn-primary mt-6 w-fit" onClick={() => reset()}>
        Try again
      </button>
    </main>
  )
}
