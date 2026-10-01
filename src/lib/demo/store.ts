"use client"

import { useSyncExternalStore } from "react"

import { createSeed, type SeedCopy } from "./seed"
import type { DemoSettings, DemoState, Proposal, TxSummary, WalletState } from "./types"

/**
 * The demo's single source of truth: a tiny external store persisted to
 * localStorage (every access in try/catch). Swapping to a real chain means
 * replacing this module and chain.ts; the UI only uses the hooks and actions.
 */

const STORAGE_KEY = "govchain-demo-v1"

let state: DemoState | null = null
let storageOk = true
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function persist() {
  if (!state) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    storageOk = true
  } catch {
    storageOk = false
  }
}

function load(): DemoState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.version !== 1 || !Array.isArray(parsed.proposals) || !Array.isArray(parsed.members)) return null
    // A reload never resumes a half-finished connection.
    if (parsed.wallet.status === "connecting") parsed.wallet.status = "disconnected"
    return parsed
  } catch {
    storageOk = false
    return null
  }
}

/** Load saved state, or seed the examples in the visitor's language. Idempotent. */
export function initDemo(copy: SeedCopy, locale: "en" | "fr") {
  if (state) return
  state = load() ?? createSeed(copy, locale)
  persist()
  emit()
}

export function resetDemo(copy: SeedCopy, locale: "en" | "fr") {
  const connected = state?.wallet.status === "connected"
  state = createSeed(copy, locale)
  if (connected) state.wallet.status = "connected"
  persist()
  emit()
}

export function update(fn: (s: DemoState) => DemoState) {
  if (!state) return
  state = fn(state)
  persist()
  emit()
}

export function updateProposal(id: string, fn: (p: Proposal) => Proposal) {
  update((s) => ({ ...s, proposals: s.proposals.map((x) => (x.id === id ? fn(x) : x)) }))
}

export function setWallet(patch: Partial<WalletState>) {
  update((s) => ({ ...s, wallet: { ...s.wallet, ...patch } }))
}

export function setSettings(patch: Partial<DemoSettings>) {
  update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
}

export function getDemo() {
  return state
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Current demo state, or null until it has loaded on the client. */
export function useDemo(): DemoState | null {
  return useSyncExternalStore(subscribe, () => state, () => null)
}

export function useStorageOk(): boolean {
  return useSyncExternalStore(subscribe, () => storageOk, () => true)
}

/* ---------------------------------------------------------------------------
 * Simulated wallet prompt: a promise resolved by the WalletPrompt dialog.
 * ------------------------------------------------------------------------ */

export interface PromptRequest {
  summary: TxSummary
  resolve: (approved: boolean) => void
}

let prompt: PromptRequest | null = null
const promptListeners = new Set<() => void>()

export function requestSignature(summary: TxSummary): Promise<boolean> {
  return new Promise((resolve) => {
    prompt?.resolve(false)
    prompt = {
      summary,
      resolve: (ok) => {
        prompt = null
        for (const l of promptListeners) l()
        resolve(ok)
      },
    }
    for (const l of promptListeners) l()
  })
}

export function usePrompt(): PromptRequest | null {
  return useSyncExternalStore(
    (l) => {
      promptListeners.add(l)
      return () => promptListeners.delete(l)
    },
    () => prompt,
    () => null
  )
}

/* ---------------------------------------------------------------------------
 * A shared clock, so open votes close on screen when their time is up.
 * ------------------------------------------------------------------------ */

let now = 0
const clockListeners = new Set<() => void>()
let clockTimer: ReturnType<typeof setInterval> | null = null

function subscribeClock(listener: () => void) {
  clockListeners.add(listener)
  if (!clockTimer) {
    now = Date.now()
    clockTimer = setInterval(() => {
      now = Date.now()
      for (const l of clockListeners) l()
    }, 15_000)
  }
  return () => {
    clockListeners.delete(listener)
    if (clockListeners.size === 0 && clockTimer) {
      clearInterval(clockTimer)
      clockTimer = null
    }
  }
}

/** Refresh the clock right away (after a simulated clock jump). */
export function tickClock() {
  now = Date.now()
  for (const l of clockListeners) l()
}

/** Current time, refreshed every 15 s; 0 during server rendering. */
export function useNow(): number {
  return useSyncExternalStore(
    subscribeClock,
    () => {
      if (!now) now = Date.now()
      return now
    },
    () => 0
  )
}
