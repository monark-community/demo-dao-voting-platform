/**
 * Pure governance math, shared by the server-rendered pages (worked examples)
 * and the client demo. Mirrors what a Governor contract computes on-chain:
 * voting power per model, quorum, threshold and the outcome.
 */

import type { Ballot, Delegation, Member, Outcome, Proposal, VotingModel } from "./types"

/** Total power a quorum is measured against. */
export function totalPower(members: Member[], model: VotingModel): number {
  if (model === "wallet") return members.length
  return members.reduce((sum, m) => sum + m.balance, 0)
}

/** Power delegated to this address by other members. */
export function delegatedTo(members: Member[], address: string): number {
  return members.reduce((sum, m) => sum + amountTo(m.delegations, address), 0)
}

/** What a list of splits lends to one address. */
export function amountTo(delegations: Delegation[], address: string): number {
  return delegations.reduce((sum, d) => (d.to === address ? sum + d.amount : sum), 0)
}

/** Total power a member lent out. */
export function delegatedAway(member: Member): number {
  return member.delegations.reduce((sum, d) => sum + d.amount, 0)
}

/** The member's own power they kept for themselves. */
export function keptPower(member: Member): number {
  return Math.max(0, member.balance - delegatedAway(member))
}

/** How much one member's ballot weighs under a model, given current delegations. */
export function votingPower(members: Member[], address: string, model: VotingModel): number {
  const member = members.find((m) => m.address === address)
  if (!member) return 0
  if (model === "wallet") return 1
  if (model === "token") return member.balance
  return keptPower(member) + delegatedTo(members, address)
}

/**
 * Under the delegation model, a member who lent out all their power can't vote
 * directly; with a partial delegation they vote with what they kept.
 */
export function canVoteDirectly(member: Member, model: VotingModel): boolean {
  return model !== "delegated" || keptPower(member) > 0
}

export interface Tally {
  for: number
  against: number
  abstain: number
  /** For + Against + Abstain: what counts towards quorum. */
  participation: number
  totalPower: number
  quorumNeeded: number
  quorumReached: boolean
  /** For / (For + Against), 0 when nobody took a side. */
  forShare: number
  thresholdPct: number
  /** Would pass if voting closed now. */
  passing: boolean
  ballots: number
}

function build(
  weights: { choice: Ballot["choice"]; weight: number }[],
  total: number,
  quorumPct: number,
  thresholdPct: number
): Tally {
  const sum = { for: 0, against: 0, abstain: 0 }
  for (const w of weights) sum[w.choice] += w.weight
  const participation = sum.for + sum.against + sum.abstain
  const quorumNeeded = Math.ceil((total * quorumPct) / 100)
  const sided = sum.for + sum.against
  const forShare = sided > 0 ? sum.for / sided : 0
  const quorumReached = participation >= quorumNeeded && participation > 0
  const passing = quorumReached && sum.for * 100 > thresholdPct * sided
  return {
    ...sum,
    participation,
    totalPower: total,
    quorumNeeded,
    quorumReached,
    forShare,
    thresholdPct,
    passing,
    ballots: weights.filter((w) => w.weight > 0).length,
  }
}

/** The proposal's own tally, from the weights fixed when each ballot was cast. */
export function tally(p: Proposal, members: Member[]): Tally {
  return build(p.ballots, totalPower(members, p.model), p.quorumPct, p.thresholdPct)
}

/** The same ballots re-weighed under another model ("same ballots, other rules"). */
export function reweigh(p: Proposal, members: Member[], model: VotingModel): Tally {
  if (model === p.model) return tally(p, members)
  const weights = p.ballots.map((b) => ({ choice: b.choice, weight: votingPower(members, b.voter, model) }))
  return build(weights, totalPower(members, model), p.quorumPct, p.thresholdPct)
}

export function outcomeOf(t: Tally): Outcome {
  if (!t.quorumReached) return "noQuorum"
  return t.passing ? "passed" : "defeated"
}

export type ProposalStatus = "active" | "passed" | "defeated" | "noQuorum" | "executed" | "cancelled"

export function statusOf(p: Proposal, members: Member[], now: number): ProposalStatus {
  if (p.cancelled) return "cancelled"
  if (p.executed) return "executed"
  if (now < p.endsAt) return "active"
  return outcomeOf(tally(p, members))
}

/** A passed proposal with an action that hasn't run yet. */
export function awaitingExecution(p: Proposal, members: Member[], now: number): boolean {
  return statusOf(p, members, now) === "passed" && p.action.kind !== "none"
}
