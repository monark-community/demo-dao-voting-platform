import type { VotingModel } from "@/lib/demo/types"

/** Balances of twelve sample members, used to draw the three voting models. */
const SAMPLE = [5600, 4200, 3900, 3400, 3100, 2400, 1800, 1400, 1100, 900, 650, 450]
const MAX = SAMPLE[0] ?? 1

/**
 * Flat orange line art for a voting model: equal dots (one wallet, one vote),
 * dots sized by tGOV (token-weighted), or small dots lending power to three
 * delegates (delegation). One member splits their power between two delegates
 * and keeps a share, so it is drawn half filled with two thinner lines.
 */
export function ModelDots({ model, className }: { model: VotingModel; className?: string }) {
  const cols = 6
  const cell = (i: number) => ({ x: 26 + (i % cols) * 44, y: 30 + Math.floor(i / cols) * 44 })
  if (model === "delegated") {
    const hubs = [
      { x: 60, y: 110 },
      { x: 150, y: 110 },
      { x: 240, y: 110 },
    ]
    return (
      <svg viewBox="0 0 290 140" className={className} aria-hidden="true">
        {SAMPLE.map((b, i) => {
          const x = 20 + i * 22.7
          const y = 26
          const hub = hubs[i % 3] ?? hubs[0]!
          const direct = i === 0 || i === 4 || i === 7
          const split = i === 5
          const r = 3 + (b / MAX) * 5
          const targets = split ? [hubs[1]!, hubs[2]!] : direct ? [] : [hub]
          return (
            <g key={i}>
              {targets.map((h, j) => (
                <path key={j} d={`M ${x} ${y} C ${x} ${y + 40}, ${h.x} ${h.y - 44}, ${h.x} ${h.y - 14}`} fill="none" stroke="var(--primary)" strokeWidth={split ? 1 : 1.5} strokeLinecap="round" opacity="0.8" />
              ))}
              <circle cx={x} cy={y} r={r} fill={direct ? "var(--primary)" : "var(--card)"} stroke="var(--primary)" strokeWidth="1.75" />
              {split ? <path d={`M ${x - r} ${y} A ${r} ${r} 0 0 0 ${x + r} ${y} Z`} fill="var(--primary)" /> : null}
            </g>
          )
        })}
        {hubs.map((h, i) => (
          <circle key={i} cx={h.x} cy={h.y} r="14" fill="var(--primary)" stroke="var(--primary)" strokeWidth="2" />
        ))}
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 290 140" className={className} aria-hidden="true">
      {SAMPLE.map((b, i) => {
        const { x, y } = cell(i)
        const r = model === "wallet" ? 9 : 4 + (b / MAX) * 13
        return <circle key={i} cx={x + 8} cy={y + 12} r={r} fill={i % 3 === 0 ? "var(--primary)" : "var(--card)"} stroke="var(--primary)" strokeWidth="1.75" />
      })}
    </svg>
  )
}
