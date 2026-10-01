/**
 * The seeded demo space: the Riverbend Blockchain Society, a fictional student
 * association with 20 members, a treasury and eight proposals at every stage
 * of their life. Numbers are deliberate: your 1,250 tGOV tips the hackathon
 * vote over quorum, and can flip the quorum-change vote below its 66% bar.
 * Text comes from the dictionaries, so the examples appear in the visitor's
 * language.
 */

import { seededAddress, seededHash } from "./ids"
import { votingPower } from "./tally"
import type { Activity, Ballot, Category, Choice, DemoState, Member, Proposal, ProposalAction, Role, VotingModel } from "./types"

export const MEMBER_KEYS = [
  "you",
  "amara",
  "julien",
  "priya",
  "kenji",
  "sofia",
  "lea",
  "omar",
  "hannah",
  "mateo",
  "chloe",
  "daniel",
  "mei",
  "noah",
  "ines",
  "lucas",
  "aisha",
  "gabriel",
  "zoe",
  "thomas",
] as const
export type MemberKey = (typeof MEMBER_KEYS)[number]

export const DELEGATE_KEYS = ["amara", "julien", "priya", "kenji"] as const
export type DelegateKey = (typeof DELEGATE_KEYS)[number]

export const PROPOSAL_IDS = [
  "winter-hackathon-prize-pool",
  "code-of-conduct-for-calls",
  "lower-quorum-to-15",
  "food-coop-payments-pilot",
  "demo-day-venue",
  "thursday-community-calls",
  "campus-ambassador-track",
  "treasury-hardware-wallets",
] as const
export type ProposalId = (typeof PROPOSAL_IDS)[number]

export interface SeedProposalCopy {
  title: string
  summary: string
  body: string[]
}

/** The localized text the seed needs; the dictionaries provide it. */
export interface SeedCopy {
  space: string
  names: Record<MemberKey, string>
  titles: Partial<Record<MemberKey, string>>
  pitches: Record<DelegateKey, string>
  payees: { hackathon: string; coop: string; venue: string; hardware: string }
  proposals: Record<ProposalId, SeedProposalCopy>
  reasons: Record<string, string>
}

const BALANCES: Record<MemberKey, number> = {
  you: 1250,
  amara: 4200,
  julien: 3400,
  priya: 3900,
  kenji: 1600,
  sofia: 2400,
  lea: 1800,
  omar: 3100,
  hannah: 900,
  mateo: 650,
  chloe: 1400,
  daniel: 2000,
  mei: 500,
  noah: 300,
  ines: 1100,
  lucas: 750,
  aisha: 450,
  gabriel: 5600,
  zoe: 350,
  thomas: 2700,
}

const ROLES: Partial<Record<MemberKey, Role>> = {
  amara: "admin",
  julien: "proposer",
  priya: "proposer",
  gabriel: "proposer",
  you: "proposer",
}

const DELEGATIONS: Partial<Record<MemberKey, DelegateKey>> = {
  mei: "priya",
  noah: "priya",
  zoe: "kenji",
  aisha: "kenji",
  mateo: "amara",
  lucas: "amara",
  hannah: "julien",
}

export const addressOf = (key: MemberKey) => (key === "you" ? YOU_ADDRESS : seededAddress(`riverbend:${key}`))
export const YOU_ADDRESS = "0x7a3F9c2E41b8D05a6C1e93F4b27d8A60c5E1c19E"
export const TREASURY_ADDRESS = seededAddress("riverbend:treasury")

type SeedBallot = [MemberKey, Choice, string?]

interface SeedProposal {
  id: ProposalId
  category: Category
  author: MemberKey
  model: VotingModel
  quorumPct: number
  thresholdPct: number
  /** Relative to seeding time, in hours. */
  createdH: number
  endsH: number
  executedH?: number
  action: (payees: SeedCopy["payees"]) => ProposalAction
  ballots: SeedBallot[]
  lean: number
}

const SEED_PROPOSALS: SeedProposal[] = [
  {
    id: "winter-hackathon-prize-pool",
    category: "treasury",
    author: "kenji",
    model: "delegated",
    quorumPct: 20,
    thresholdPct: 50,
    createdH: -77,
    endsH: 53,
    action: (p) => ({ kind: "transfer", amount: 4000, token: "tUSDC", to: seededAddress("riverbend:hackathon-multisig"), toLabel: p.hackathon }),
    ballots: [
      ["kenji", "for", "hackathonKenji"],
      ["lea", "against", "hackathonLea"],
      ["chloe", "for", "hackathonChloe"],
      ["ines", "abstain", "hackathonInes"],
    ],
    lean: 0.7,
  },
  {
    id: "code-of-conduct-for-calls",
    category: "community",
    author: "amara",
    model: "wallet",
    quorumPct: 30,
    thresholdPct: 50,
    createdH: -30,
    endsH: 98,
    action: () => ({ kind: "none" }),
    ballots: [
      ["amara", "for", "conductAmara"],
      ["lea", "for"],
      ["mei", "for"],
      ["noah", "against", "conductNoah"],
    ],
    lean: 0.75,
  },
  {
    id: "lower-quorum-to-15",
    category: "rules",
    author: "julien",
    model: "token",
    quorumPct: 20,
    thresholdPct: 66,
    createdH: -150,
    endsH: 18,
    action: () => ({ kind: "rule", param: "quorum", value: 15 }),
    ballots: [
      ["julien", "for", "quorumJulien"],
      ["omar", "against", "quorumOmar"],
      ["priya", "for", "quorumPriya"],
      ["daniel", "for"],
      ["hannah", "against"],
    ],
    lean: 0.5,
  },
  {
    id: "food-coop-payments-pilot",
    category: "treasury",
    author: "amara",
    model: "delegated",
    quorumPct: 20,
    thresholdPct: 50,
    createdH: -190,
    endsH: -22,
    action: (p) => ({ kind: "transfer", amount: 1500, token: "tUSDC", to: seededAddress("riverbend:food-coop"), toLabel: p.coop }),
    ballots: [
      ["amara", "for", "coopAmara"],
      ["julien", "for"],
      ["gabriel", "against", "coopGabriel"],
      ["thomas", "for"],
    ],
    lean: 0.6,
  },
  {
    id: "demo-day-venue",
    category: "events",
    author: "gabriel",
    model: "token",
    quorumPct: 20,
    thresholdPct: 50,
    createdH: -460,
    endsH: -300,
    executedH: -290,
    action: (p) => ({ kind: "transfer", amount: 2200, token: "tUSDC", to: seededAddress("riverbend:venue"), toLabel: p.venue }),
    ballots: [
      ["gabriel", "for", "venueGabriel"],
      ["amara", "for"],
      ["priya", "for"],
      ["julien", "for"],
      ["omar", "for"],
      ["thomas", "for"],
      ["daniel", "for"],
      ["you", "for"],
      ["kenji", "for"],
      ["sofia", "against", "venueSofia"],
      ["lea", "against"],
      ["hannah", "against"],
      ["mateo", "against"],
      ["chloe", "against"],
      ["mei", "against"],
      ["noah", "against"],
      ["ines", "against"],
      ["lucas", "against"],
      ["aisha", "against"],
      ["zoe", "against"],
    ],
    lean: 0.5,
  },
  {
    id: "thursday-community-calls",
    category: "community",
    author: "kenji",
    model: "wallet",
    quorumPct: 30,
    thresholdPct: 50,
    createdH: -560,
    endsH: -390,
    action: () => ({ kind: "none" }),
    ballots: [
      ["kenji", "for"],
      ["zoe", "for"],
      ["aisha", "for"],
      ["mateo", "for"],
      ["amara", "against", "thursdayAmara"],
      ["lea", "against"],
      ["sofia", "against"],
      ["chloe", "against"],
      ["daniel", "against"],
      ["ines", "against"],
      ["omar", "against"],
    ],
    lean: 0.4,
  },
  {
    id: "campus-ambassador-track",
    category: "community",
    author: "priya",
    model: "delegated",
    quorumPct: 20,
    thresholdPct: 50,
    createdH: -700,
    endsH: -530,
    action: () => ({ kind: "none" }),
    ballots: [
      ["priya", "for", "campusPriya"],
      ["sofia", "for"],
    ],
    lean: 0.8,
  },
  {
    id: "treasury-hardware-wallets",
    category: "technical",
    author: "julien",
    model: "delegated",
    quorumPct: 20,
    thresholdPct: 50,
    createdH: -1000,
    endsH: -840,
    executedH: -835,
    action: (p) => ({ kind: "transfer", amount: 180, token: "tUSDC", to: seededAddress("riverbend:hardware"), toLabel: p.hardware }),
    ballots: [
      ["amara", "for"],
      ["julien", "for", "hardwareJulien"],
      ["priya", "for"],
      ["omar", "against"],
    ],
    lean: 0.8,
  },
]

const H = 3_600_000

export function createSeed(copy: SeedCopy, locale: "en" | "fr", now = Date.now()): DemoState {
  const members: Member[] = MEMBER_KEYS.map((key) => {
    const delegate = DELEGATIONS[key]
    return {
      address: addressOf(key),
      name: copy.names[key],
      balance: BALANCES[key],
      role: ROLES[key] ?? "voter",
      delegate: delegate ? addressOf(delegate) : null,
      ...(copy.titles[key] ? { title: copy.titles[key] } : {}),
      ...((DELEGATE_KEYS as readonly string[]).includes(key) ? { pitch: copy.pitches[key as DelegateKey] } : {}),
    }
  })

  const activity: Activity[] = []
  const proposals: Proposal[] = SEED_PROPOSALS.map((sp) => {
    const text = copy.proposals[sp.id]
    const createdAt = now + sp.createdH * H
    const endsAt = now + sp.endsH * H
    const span = Math.min(endsAt, now) - createdAt
    const ballots: Ballot[] = sp.ballots.map(([key, choice, reasonKey], i) => {
      const at = Math.round(createdAt + (span * (i + 1)) / (sp.ballots.length + 1.5))
      const voter = addressOf(key)
      return {
        voter,
        choice,
        weight: votingPower(members, voter, sp.model),
        ...(reasonKey && copy.reasons[reasonKey] ? { reason: copy.reasons[reasonKey] } : {}),
        at,
        hash: seededHash(`${sp.id}:vote:${key}`),
      }
    })
    const author = addressOf(sp.author)
    const createHash = seededHash(`${sp.id}:create`)
    activity.push({ id: `${sp.id}:proposed`, kind: "proposed", at: createdAt, actor: author, proposalId: sp.id, hash: createHash })
    for (const b of ballots)
      activity.push({ id: `${sp.id}:vote:${b.voter}`, kind: "voted", at: b.at, actor: b.voter, proposalId: sp.id, choice: b.choice, weight: b.weight, hash: b.hash })
    if (endsAt < now) activity.push({ id: `${sp.id}:closed`, kind: "closed", at: endsAt, actor: author, proposalId: sp.id })
    const executed = sp.executedH !== undefined ? { at: now + sp.executedH * H, hash: seededHash(`${sp.id}:execute`) } : undefined
    if (executed) activity.push({ id: `${sp.id}:executed`, kind: "executed", at: executed.at, actor: addressOf("amara"), proposalId: sp.id, hash: executed.hash })

    return {
      id: sp.id,
      title: text.title,
      summary: text.summary,
      body: text.body,
      category: sp.category,
      author,
      createdAt,
      endsAt,
      model: sp.model,
      quorumPct: sp.quorumPct,
      thresholdPct: sp.thresholdPct,
      action: sp.action(copy.payees),
      ballots,
      createHash,
      ...(executed ? { executed } : {}),
      lean: sp.lean,
    }
  })

  Object.entries(DELEGATIONS).forEach(([from, to], i) => {
    activity.push({
      id: `delegation:${from}`,
      kind: "delegated",
      at: now - (1100 - i * 37) * H,
      actor: addressOf(from as MemberKey),
      target: addressOf(to),
      weight: BALANCES[from as MemberKey],
      hash: seededHash(`delegation:${from}`),
    })
  })
  activity.sort((a, b) => b.at - a.at)

  return {
    version: 1,
    seededLocale: locale,
    space: {
      name: copy.space,
      treasury: { tUSDC: 18_400, tETH: 4 },
      treasuryAddress: TREASURY_ADDRESS,
      defaultQuorumPct: 20,
      defaultPeriodDays: 7,
      proposerMin: 2000,
    },
    members,
    proposals,
    activity,
    wallet: { status: "disconnected", address: YOU_ADDRESS, name: copy.names.you, lastError: null },
    settings: { slow: false, failNext: false, liveVoters: true },
  }
}
