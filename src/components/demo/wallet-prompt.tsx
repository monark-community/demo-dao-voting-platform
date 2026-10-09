"use client"

import { useMemo } from "react"

import { MonarkMark } from "@/components/ui/site-brand"
import { WalletPrompt as MonarkWalletPrompt } from "@/components/ui/wallet-prompt"
import { estimateFee } from "@/lib/demo/chain"
import { useDemo, usePrompt } from "@/lib/demo/store"

import { useAppCopy } from "./app-provider"

/** The simulated wallet's confirmation sheet, fed by the demo store. Closing it counts as a rejection. */
export function WalletPrompt() {
  const prompt = usePrompt()
  const demo = useDemo()
  const { app, disclaimer, locale } = useAppCopy()
  const p = app.prompt
  // A fresh fee estimate per request.
  const fee = useMemo(() => (prompt ? estimateFee() : ""), [prompt])
  const feeText = fee ? `${Number(fee).toLocaleString(locale === "fr" ? "fr-CA" : "en-CA", { maximumFractionDigits: 5 })} tETH` : ""
  const movesValue = !!prompt?.summary.movesValue

  return (
    <MonarkWalletPrompt
      open={!!prompt}
      onConfirm={() => prompt?.resolve(true)}
      onReject={() => prompt?.resolve(false)}
      title={prompt?.summary.title ?? p.title}
      description={p.title}
      site={
        <>
          <MonarkMark />
          {p.site}
        </>
      }
      account={demo ? { name: demo.wallet.name, address: demo.wallet.address } : undefined}
      rows={prompt?.summary.rows}
      network={app.network}
      networkLabel={p.network}
      fee={prompt?.summary.noFee ? undefined : feeText}
      feeLabel={p.fee}
      disclaimer={movesValue ? disclaimer : p.simulated}
      warning={movesValue}
      confirmLabel={p.confirm}
      rejectLabel={p.reject}
      closeLabel={app.close}
    />
  )
}
