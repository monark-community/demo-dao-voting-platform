import type { Dictionary } from "@/i18n"

import { createSeed } from "./seed"
import { outcomeOf, reweigh, totalPower, type Tally } from "./tally"
import type { VotingModel } from "./types"

/** Server-side worked examples computed from the same seed the demo uses, so the numbers always agree. */
export function sameBallotsExample(dict: Dictionary, locale: "en" | "fr") {
  const s = createSeed(dict.seed, locale, Date.UTC(2026, 8, 1))
  const p = s.proposals.find((x) => x.id === "demo-day-venue")
  if (!p) throw new Error("seed is missing demo-day-venue")
  const by = (m: VotingModel): Tally & { outcome: ReturnType<typeof outcomeOf> } => {
    const tl = reweigh(p, s.members, m)
    return { ...tl, outcome: outcomeOf(tl) }
  }
  return {
    ballots: p.ballots.length,
    wallet: by("wallet"),
    token: by("token"),
    delegated: by("delegated"),
    total: totalPower(s.members, "token"),
    quorumNeeded: Math.ceil((totalPower(s.members, "token") * 20) / 100),
  }
}
