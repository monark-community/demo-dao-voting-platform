import type { Member, Proposal, Role, Space } from "./types"

/** Mirrors the contract's checks, so the UI can explain every lock. */
export function canPublish(member: Member | undefined, space: Space): boolean {
  if (!member) return false
  return member.role === "admin" || member.role === "proposer" || member.balance >= space.proposerMin
}

export function canCancel(member: Member | undefined, proposal: Proposal): boolean {
  if (!member) return false
  return member.role === "admin" || proposal.author === member.address
}

export const ROLES: Role[] = ["admin", "proposer", "voter"]
