/**
 * Domain types for the GovChain demo. Everything the UI knows about the space,
 * members, proposals, ballots and transactions goes through these shapes, so
 * the simulated layer in this folder could be replaced by wagmi/viem calls
 * (a Governor + ERC20Votes contract pair) without touching the UI.
 *
 * tGOV balances and treasury amounts are whole numbers (the demo never needs
 * fractions); times are epoch milliseconds.
 */

export type Choice = "for" | "against" | "abstain"

/** How ballots are weighed: one per wallet, by tGOV held, or by tGOV with delegation. */
export type VotingModel = "wallet" | "token" | "delegated"

export type Role = "admin" | "proposer" | "voter"

export type Category = "treasury" | "events" | "community" | "rules" | "technical"

export type TreasuryToken = "tUSDC" | "tETH"

/** What executing a passed proposal does (the execution hook). */
export type ProposalAction =
  | { kind: "none" }
  | { kind: "transfer"; amount: number; token: TreasuryToken; to: string; toLabel: string }
  | { kind: "rule"; param: "quorum" | "period"; value: number }

export interface Member {
  address: string
  name: string
  /** tGOV held. */
  balance: number
  role: Role
  /** Address this member delegated their voting power to, if any. */
  delegate: string | null
  /** Members who stand as delegates have a short pitch. */
  pitch?: string
  /** Short function in the association, e.g. "Treasurer". */
  title?: string
}

export interface Ballot {
  voter: string
  choice: Choice
  /** Weight counted for this proposal's own model, fixed when the ballot is cast. */
  weight: number
  reason?: string
  at: number
  hash: string
}

export type Outcome = "passed" | "defeated" | "noQuorum"

export interface Proposal {
  id: string
  title: string
  summary: string
  /** Reasoning, as paragraphs. */
  body: string[]
  category: Category
  author: string
  createdAt: number
  endsAt: number
  model: VotingModel
  /** Share of total voting power (or of members, for "wallet") that must take part. */
  quorumPct: number
  /** Share of For among For + Against that must be exceeded to pass. */
  thresholdPct: number
  action: ProposalAction
  ballots: Ballot[]
  createHash: string
  executed?: { at: number; hash: string }
  cancelled?: { at: number; hash: string; by: string }
  /** Voting was ended early from the demo controls (simulated clock jump). */
  fastForwarded?: boolean
  /** Probability (0–1) that a simulated live voter chooses For. */
  lean: number
}

export type ActivityKind = "proposed" | "voted" | "delegated" | "undelegated" | "executed" | "cancelled" | "closed"

export interface Activity {
  id: string
  kind: ActivityKind
  at: number
  actor: string
  proposalId?: string
  choice?: Choice
  /** Delegate address, for delegation entries. */
  target?: string
  weight?: number
  hash?: string
}

export interface Space {
  name: string
  /** Treasury balances. */
  treasury: Record<TreasuryToken, number>
  treasuryAddress: string
  defaultQuorumPct: number
  defaultPeriodDays: number
  /** tGOV needed to publish a proposal without the proposer role. */
  proposerMin: number
}

export type WalletStatus = "disconnected" | "connecting" | "connected"

export interface WalletState {
  status: WalletStatus
  address: string
  name: string
  lastError: "rejected" | null
}

export interface DemoSettings {
  slow: boolean
  failNext: boolean
  /** Other members keep voting on open proposals. */
  liveVoters: boolean
}

export interface DemoState {
  version: 1
  seededLocale: "en" | "fr"
  space: Space
  members: Member[]
  proposals: Proposal[]
  activity: Activity[]
  wallet: WalletState
  settings: DemoSettings
}

/** Lifecycle of one simulated transaction, as the UI sees it. */
export type TxPhase = "idle" | "signing" | "pending" | "confirmed" | "failed"
export type TxError = "rejected" | "reverted"

export interface TxState {
  phase: TxPhase
  hash?: string
  error?: TxError
}

export interface TxSummary {
  /** Short title, e.g. "Vote For on …". */
  title: string
  rows?: { label: string; value: string }[]
  /** Transactions that move value show the testnet disclaimer. */
  movesValue: boolean
  /** Off-chain signature (sign-in): no network fee row. */
  noFee?: boolean
}
