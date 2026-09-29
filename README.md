# GovChain by Monark

GovChain is Monark's governance module: one place for a student association, DAO or co-op to **propose, vote and act on decisions** under rules everyone can read. Each proposal fixes its voting model (one wallet one vote, token-weighted, or token-weighted with delegation), its quorum and threshold, and the action it triggers if it passes (a treasury transfer or a rule change). Members vote with a public reason, delegate their power to someone they trust, and anyone can execute a passed proposal exactly as voted.

This repository is the **demo site**: a marketing page, a "how it works" explainer, and an interactive demo in which you join the fictional *Riverbend Blockchain Society* and vote, delegate, publish and execute proposals. Everything is simulated: no real chain, wallet, tokens or backend.

- Project documentation: https://www.monark.io/en/project/dao-voting-platform
- Site plan (product brief, page map, flows, copy, design decisions): [`docs/site-plan.md`](docs/site-plan.md)
- Asset credits: [`docs/assets.md`](docs/assets.md)
- Screenshots of every page and flow: [`docs/screenshots/`](docs/screenshots/)

> Testnet demo · not financial advice · no real funds.

## Run it locally

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Other scripts:

```bash
pnpm lint           # ESLint (next/core-web-vitals + TypeScript)
pnpm typecheck      # next typegen && tsc --noEmit
pnpm build          # production build; every page prerenders
pnpm start          # serve the production build
pnpm screenshots    # Playwright screenshots into docs/screenshots (needs `pnpm start -p 3138` running)
```

No environment variables are needed. `NEXT_PUBLIC_SITE_URL` optionally overrides the canonical URL (default `https://govchain.monark.io`).

## How the demo simulation works

All demo behaviour lives in a small typed data layer in `src/lib/demo/`, shaped after an OpenZeppelin-style **Governor** contract with an **ERC20Votes** token, so it could be replaced by wagmi/viem calls without touching the UI:

| File | Role |
|-|-|
| `types.ts` | Domain types: space, members, proposals, ballots, actions, activity, wallet and transaction states. |
| `tally.ts` | Pure governance math shared by server pages and the app: voting power per model, delegation, quorum, threshold, outcome, status. |
| `seed.ts` | The seeded space: 20 members, a treasury, four delegates and eight proposals at every stage, with text from the dictionaries so it appears in the visitor's language. |
| `store.ts` | A tiny external store persisted to `localStorage` (every access wrapped in try/catch), the simulated wallet prompt, and a shared clock. |
| `chain.ts` | One transaction's lifecycle: wallet prompt (confirm or reject), pending with a hash for a realistic block time (1.2–2.4 s, or 3–6 s on "slow network"), then confirmed or reverted. |
| `wallet.ts` | Simulated wallet connection (a sign-in message, no fee). |
| `ops.ts` | State changes applied on confirmation: `castVote`, `setDelegate`, `createProposal`, `executeProposal`, `cancelProposal`, plus `endVotingNow` (a demo clock jump) and the simulated live voters. |
| `permissions.ts` | Who can publish or cancel, mirroring the contract's checks so the UI can explain each lock. |
| `examples.ts` | Worked examples for the marketing pages, computed from the seed at build time. |

The **Demo controls** (the "Sepolia testnet" pill in the app bar) switch your role (admin, proposer, voter), turn live voters on or off, slow the network, force the next transaction to fail, and **reset the demo**.

## Project structure

```
src/
  app/
    [locale]/                 en and fr routes (proxy.ts redirects / to the preferred language)
      page.tsx                home
      how-it-works/           mechanics explainer
      app/                    interactive demo: proposals, proposals/[id], new, delegates, results
      credits/                photo, type and brand credits
      pricing/                internal review only: unlinked, noindex, not in the sitemap
      opengraph-image.tsx     per-locale OG image
    sitemap.ts, robots.ts, icon.svg, globals.css (Monark cream / espresso tokens)
  components/
    site/                     standard Monark header (brand, Demo chip), footer, locale and theme switches
    demo/                     app screens and panels
    diagrams/                 tally bars, voting-model dots, lifecycle strip
    home/                     animated hero tally
    ui/                       shadcn/ui and @monark registry components
  i18n/                       typed EN/FR dictionaries (French must satisfy the English shape)
  lib/demo/                   simulated chain, wallet and governance data layer
scripts/screenshots.mjs       Playwright visual check
scripts/wordcount.mjs         words per page (simplification pass); dictcount.mjs: words per dictionary section
docs/                         site plan, simplification pass, assets, screenshots
```

Stack: Next.js 16 (App Router, TypeScript strict), Tailwind CSS v4, shadcn/ui on the [Monark UI registry](https://ui.monark.io), `lucide-react`, `next-themes`, `sonner`.

## Deploying to Vercel

Import the repository in Vercel and deploy with the framework defaults (Next.js, `pnpm install`, `pnpm build`). No `vercel.json` and no environment variables are required; the Node version is pinned in `package.json` (`engines.node: 22.x`).

## Licence and credits

Open source by the Monark community. Photos are from Unsplash (free licence), credited on `/credits` and in `docs/assets.md`. The Monark logo, mesh butterfly and social icons belong to Monark and are used under its brand guidelines.
