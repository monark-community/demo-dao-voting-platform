import { cn } from "@/lib/utils"

/** The life of a proposal as a connected strip of steps: flat orange line art, horizontal on wide screens. */
export function Lifecycle({ steps, className }: { steps: { title: string; body: string }[]; className?: string }) {
  return (
    <ol className={cn("relative grid gap-6 lg:grid-cols-5 lg:gap-4", className)}>
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 lg:flex-col lg:gap-3">
          {/* connector */}
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute top-10 bottom-[-1.5rem] left-[19px] w-0.5 bg-primary lg:top-[19px] lg:right-[-1rem] lg:bottom-auto lg:left-10 lg:h-0.5 lg:w-auto"
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary text-sm font-extrabold",
              i === steps.length - 1 ? "bg-primary text-primary-foreground" : "bg-background"
            )}
          >
            {i + 1}
          </span>
          <div>
            <h3 className="font-bold">{s.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
