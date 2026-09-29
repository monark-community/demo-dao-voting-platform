"use client"

/**
 * State changes applied once a simulated transaction confirms. Each maps to a
 * Governor / ERC20Votes call: castVoteWithReason, delegate, propose, execute,
 * cancel. The UI calls these through useTx().run(summary, apply).
 */

import { randomHash, randomId } from "./ids"
import { getDemo, tickClock, update, updateProposal } from "./store"
import { canVoteDirectly, statusOf, votingPower } from "./tally"
import type { Activity, Category, Choice, DemoState, Proposal, ProposalAction, VotingModel } from "./types"

const H = 3_600_000
const D = 24 * H

function log(s: DemoState, entry: Omit<Activity, "id">): Activity[] {
  return [{ id: randomId("act"), ...entry }, ...s.activity].slice(0, 400)
}

export function castVote(proposalId: string, choice: Choice, reason: string, hash: string) {
  update((s) => {
    const p = s.proposals.find((x) => x.id === proposalId)
    const me = s.wallet.address
    if (!p || p.ballots.some((b) => b.voter === me)) return s
    const weight = votingPower(s.members, me, p.model)
    const at = Date.now()
    const ballot = { voter: me, choice, weight, at, hash, ...(reason.trim() ? { reason: reason.trim() } : {}) }
    return {
      ...s,
      proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, ballots: [...x.ballots, ballot] } : x)),
      activity: log(s, { kind: "voted", at, actor: me, proposalId, choice, weight, hash }),
    }
  })
}

/** Delegate your power to `to`, or take it back with `null`. */
export function setDelegate(to: string | null, hash: string) {
  update((s) => {
    const me = s.wallet.address
    const current = s.members.find((m) => m.address === me)
    if (!current) return s
    const weight = current.balance
    return {
      ...s,
      members: s.members.map((m) => (m.address === me ? { ...m, delegate: to } : m)),
      activity: log(s, {
        kind: to ? "delegated" : "undelegated",
        at: Date.now(),
        actor: me,
        target: to ?? current.delegate ?? undefined,
        weight,
        hash,
      }),
    }
  })
}

export interface ProposalDraft {
  title: string
  summary: string
  body: string[]
  category: Category
  model: VotingModel
  periodDays: number
  quorumPct: number
  thresholdPct: number
  action: ProposalAction
}

export function slugify(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "")
  return base || "proposal"
}

/** Publish a proposal; returns its id. Voting opens immediately (no voting delay in the demo). */
export function createProposal(draft: ProposalDraft, hash: string): string {
  const demo = getDemo()
  let id = slugify(draft.title)
  if (demo?.proposals.some((p) => p.id === id)) id = `${id}-${randomId("p").slice(2, 7)}`
  const now = Date.now()
  update((s) => {
    const proposal: Proposal = {
      id,
      title: draft.title.trim(),
      summary: draft.summary.trim(),
      body: draft.body,
      category: draft.category,
      author: s.wallet.address,
      createdAt: now,
      endsAt: now + draft.periodDays * D,
      model: draft.model,
      quorumPct: draft.quorumPct,
      thresholdPct: draft.thresholdPct,
      action: draft.action,
      ballots: [],
      createHash: hash,
      lean: 0.62,
    }
    return {
      ...s,
      proposals: [proposal, ...s.proposals],
      activity: log(s, { kind: "proposed", at: now, actor: s.wallet.address, proposalId: id, hash }),
    }
  })
  return id
}

/** Demo control: jump the clock to the end of the voting period. */
export function endVotingNow(proposalId: string) {
  const at = Date.now() - 1
  update((s) => {
    const p = s.proposals.find((x) => x.id === proposalId)
    if (!p) return s
    return {
      ...s,
      proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, endsAt: at, fastForwarded: true } : x)),
      activity: log(s, { kind: "closed", at, actor: p.author, proposalId }),
    }
  })
  tickClock()
}

export function executeProposal(proposalId: string, hash: string) {
  update((s) => {
    const p = s.proposals.find((x) => x.id === proposalId)
    if (!p || p.executed) return s
    const at = Date.now()
    let space = s.space
    const a = p.action
    if (a.kind === "transfer") space = { ...space, treasury: { ...space.treasury, [a.token]: Math.max(0, space.treasury[a.token] - a.amount) } }
    if (a.kind === "rule" && a.param === "quorum") space = { ...space, defaultQuorumPct: a.value }
    if (a.kind === "rule" && a.param === "period") space = { ...space, defaultPeriodDays: a.value }
    return {
      ...s,
      space,
      proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, executed: { at, hash } } : x)),
      activity: log(s, { kind: "executed", at, actor: s.wallet.address, proposalId, hash }),
    }
  })
}

export function cancelProposal(proposalId: string, hash: string) {
  const at = Date.now()
  update((s) => ({
    ...s,
    proposals: s.proposals.map((x) => (x.id === proposalId ? { ...x, cancelled: { at, hash, by: s.wallet.address } } : x)),
    activity: log(s, { kind: "cancelled", at, actor: s.wallet.address, proposalId, hash }),
  }))
}

/**
 * Live voters: one member who hasn't voted yet casts a ballot on an open
 * proposal, following that proposal's lean. Stops once about 80% of members
 * have voted, so votes never fill up on their own.
 */
export function simulateLiveVote(): boolean {
  const s = getDemo()
  if (!s || !s.settings.liveVoters || s.wallet.status !== "connected") return false
  const now = Date.now()
  const open = s.proposals.filter((p) => statusOf(p, s.members, now) === "active")
  const candidates = open.flatMap((p) => {
    if (p.ballots.length >= Math.floor(s.members.length * 0.8)) return []
    const voted = new Set(p.ballots.map((b) => b.voter))
    return s.members
      .filter((m) => m.address !== s.wallet.address && !voted.has(m.address) && canVoteDirectly(m, p.model))
      .map((m) => ({ p, m }))
  })
  if (candidates.length === 0) return false
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  if (!pick) return false
  const r = Math.random()
  const choice: Choice = r < pick.p.lean ? "for" : r < pick.p.lean + (1 - pick.p.lean) * 0.8 ? "against" : "abstain"
  const hash = randomHash()
  const weight = votingPower(s.members, pick.m.address, pick.p.model)
  updateProposal(pick.p.id, (p) => ({ ...p, ballots: [...p.ballots, { voter: pick.m.address, choice, weight, at: now, hash }] }))
  update((st) => ({ ...st, activity: log(st, { kind: "voted", at: now, actor: pick.m.address, proposalId: pick.p.id, choice, weight, hash }) }))
  return true
}
