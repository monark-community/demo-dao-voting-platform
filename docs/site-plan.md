# GovChain by Monark: site plan

Status: shipped on `develop`. Written before any code, then kept in sync with what shipped (see §12 for decisions taken while building). A simplification pass (less text, context on demand, standard header) followed; see `docs/simplification.md`.

- Product: **GovChain**, Monark's governance module ("a foundational block for on-chain decision-making").
- Authoritative description: https://www.monark.io/en/project/dao-voting-platform
- Branding: **Monark-branded** (`true`). `lovable-migration/monark-brand-guidelines.md` is binding.
- Stack: Next.js 16 (App Router, `src/`, TypeScript strict), pnpm, Tailwind CSS v4, shadcn/ui on the Monark UI registry, `lucide-react`.

---

## 1. Product brief

**Target user.** A member of a Monark community who has to take a decision with other people and wants it to be fair and checkable:

- the executive of a **student blockchain association** or a decentralized student council (budget, events, code of conduct);
- a contributor to an **open-source protocol or DAO** (treasury grants, parameter changes);
- a member of a **co-op or collective** (an art collective, a neighbourhood co-op) voting on shared money and rules;
- **students and developers** learning governance design, the "testbed for new governance models" the documentation describes.

**Core job to be done.** *"When our group has to decide something, let everyone who counts have a say under rules we all agreed on, and make the result, and what happens after it, impossible to fudge."*

**Domain concepts** (each explained in plain words the first time the site uses it):

| Concept | Meaning in GovChain |
|-|-|
| Space | The community's governance home: members, treasury, rules. The demo space is the **Riverbend Blockchain Society**, a fictional student association. |
| Proposal | A decision put to a vote: title, reasoning, category, an optional action, and its rules (voting model, period, quorum, threshold). |
| Voting power | How much one member's vote weighs. Measured in **tGOV**, the space's testnet governance token, or as one vote per wallet. |
| Voting model | How power is counted, chosen per proposal: **one wallet, one vote**; **token-weighted**; **token-weighted with delegation** (the default). |
| Delegation | Lending some or all of your voting power to trusted members (delegates) who vote with it. You can split it across several delegates, keep the rest to vote yourself, and take it back at any time. Power lent to a delegate is never passed on (no chains). |
| Quorum | The minimum participation for a result to count (for example 20% of all voting power). Abstentions count towards quorum. |
| Threshold | The share of *For* among For + Against needed to pass (for example more than 50%, or 66% for rule changes). |
| Voting period | How long the vote stays open (1 to 14 days). |
| Action (execution hook) | What happens automatically if the proposal passes: a **treasury transfer** or a **rule change** (quorum, voting period). A proposal with no action is a **signal vote**. |
| Roles | **Admin** (manages the space, can cancel any proposal), **proposer** (can create proposals), **voter** (can vote and delegate). Permissions are enforced and explained. |
| Receipt | Every vote, delegation, proposal and execution has a transaction hash, time and actor, listed in the proposal's timeline and the space's activity. |

**What the Lovable version got wrong or left out.**

- It was a generic dashboard (white cards, blue and purple accents, a gradient dialog title) with nothing Monark and nothing specific to a community deciding together.
- The dates were frozen in January 2024, so every "active" proposal was in fact over; "days left" was negative and "0 total voters · 0.0% participation" sat at the top.
- Votes were counted as raw vote counts compared with "quorum 25 votes" while the user voted with 1,500 tokens, so a single click blew past every quorum. Quorum and threshold were not distinguished; no abstain.
- One wallet, one vote, token weighting and **delegation**, the heart of the documentation, were absent. So were execution hooks, results tracking and voting history.
- "View details" only showed a toast; no proposal page, no reasoning, no voter list, no timeline.
- Roles were a free dropdown with no explanation of what each permission means; proposals could never close, pass, fail or be executed.
- No wallet, no transaction states (pending, confirmed, failed), English only, no disclaimers, nothing persisted, a banner stuck over the content.

## 2. Value proposition

**GovChain gives Monark communities one place to propose, vote and act on decisions under rules everyone can read, so a student association, DAO or co-op can decide together without trusting whoever counts the hands.**

Supporting benefits, as outcomes:

1. **Everyone knows the rules before the vote starts.** Quorum, threshold, voting model and what happens if it passes are fixed on the proposal, and nobody can change them mid-vote.
2. **Members who can't follow every vote still count.** Delegate some or all of your voting power to people you trust, and take it back whenever you want.
3. **Decisions actually happen.** A passed proposal carries its own action (a treasury payment, a rule change), executed from the result, with a receipt anyone can check.

## 3. Hero

- **Headline** (7 words): *Every voice counted. Every decision on record.*
  FR: *Chaque voix comptée. Chaque décision consignée.*
- **Subheadline** (12 words): *Propose, vote and act together, under rules nobody can quietly change.*
  FR: *Proposez, votez et agissez ensemble, selon des règles que personne ne modifie en douce.*
- No eyebrow, no demo line under the buttons (the header's Demo chip and the footer carry it).
- **Primary CTA:** "Cast a vote in the demo" / « Voter dans la démo » → `/{locale}/app`.
- **Secondary CTA:** "How a vote works" / « Comment se déroule un vote » → `/{locale}/how-it-works`.
- **Visual:** a **live tally card**, built in code: the proposal "Fund the winter hackathon prize pool" with its tally drawn as two answers: a For / Against bar with the threshold marker, and a participation gauge with the quorum marker (abstentions count here). Ballots arrive one by one (small voter chips), the bars grow, the quorum line flips from "Quorum: 6,700 tGOV of 7,670 tGOV" to "Quorum reached", and the outcome line settles on "Passing". It loops calmly. Product UI rather than a photo, because the moment a tally settles *is* the product. The mesh butterfly sits large and cropped behind it (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) via `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: explain the idea in 30 seconds and send people into the demo. | Hero with live tally card · "Choose how power is counted" (three voting models with mini diagrams, and the "same ballots, different result" strip) · The life of a proposal (five step titles, link to the mechanics) · Built for groups that decide together (3 photo cards) · FAQ (4 questions) · Closing call to action (heading + button) |
| `/{locale}/app` | The interactive demo: the space's proposals. | Connect gate (when disconnected: title, one line, button) · Space header (name, members, treasury, participation) · Your voting power card (own, delegated to you, delegated away, role with an info popover) · Proposals with status tabs (Active, Passed, Closed, All) and search; rows show title, tally and deadline (the summary is on the proposal page) · Recent activity rail (4 entries) |
| `/{locale}/app/proposals/[id]` | One proposal: read it, vote, follow the tally, execute it. | Header (status, category, author, time left) · Tally (bar, quorum marker, threshold, outcome) · Your vote panel · "Same ballots, other rules" comparison (collapsed disclosure) · Reasoning · The rules of this vote · Action (execution hook) · Votes cast (3 at a time, "Show all") · Timeline with receipts |
| `/{locale}/app/new` | Create a proposal (proposers and admins). | Templates · Title, category, reasoning (hints as placeholders) · Action (signal, treasury transfer, rule change; what each does is in an info popover) · Rules (voting model, period, quorum, threshold) · Live preview card · Submit, with the one note "Once published, the text and rules can't change." |
| `/{locale}/app/delegates` | Split your voting power across delegates, or take it back. | Title with an info popover (tokens stay put, take it back anytime) · Your power: the fan-out diagram (one line per delegate, as thick as their share, plus a dashed line for what you keep), "938 tGOV lent · 312 tGOV kept", an info popover on how splits work on-chain, and *Sign the new split* / *Discard changes* while editing or *Take back all my power* · Delegates (name, pitch, power received, participation rate) each with a *Your share* control: amount field, slider, 25% / 50% / Max presets, *Remove*, and "You lend X tGOV" |
| `/{locale}/app/results` | Results tracking and analytics (a documented deliverable). | Summary (proposals, pass rate, average turnout) · Turnout per proposal against quorum (bar chart in SVG) · Outcomes by category · Your voting history |
| `/{locale}/how-it-works` | For students, developers and careful members: the mechanics. Justified because the documentation frames GovChain as a teaching testbed (governance design, on-chain vs off-chain recording, contract logic). | One-line intro · The life of a proposal (diagram) · Quorum vs threshold with a worked example · The three voting models on the same ballots · Delegation · Roles and permissions table · On-chain vs off-chain vote recording · For developers (one line; the contract calls behind a "Show the contract calls" disclosure) · Call to action (heading + button) |
| `/{locale}/credits` | Photo, font and icon credits (required by the asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | "Free, part of Monark" card · What it costs to run · Partner deployments · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo and links home and to the demo. | |

**Header** (standard Monark shell, guidelines §2 and §10, copied from Splitflow's `src/components/site/`): butterfly mark 28px + "GovChain" (Nunito Sans 800, 18px) on one line, no "by Monark" · links left after the brand: *Overview*, *How it works*, *Demo* (muted, the active one in foreground) · right: Demo chip (primary tint 8% light / 15% dark, primary-ink text) → EN/FR pill → 36px theme toggle → primary action *Launch demo*. Inside `/app` the primary action becomes the `connect-wallet` component. Below `lg`: brand + menu button only; the sheet holds the links, the Demo chip, EN/FR, the theme toggle and the action. Marketing pages have exactly one top bar.

**App bar** (inside `/app`, one compact bar under the header): *Proposals*, *Delegates*, *Results* on the left · one pill "● Sepolia testnet | Demo controls" that opens the demo controls · *New proposal*. On phones the pill is icon-only and *New proposal* moves next to the Proposals heading, so the three sections fit at 390px. No testnet strip: the testnet line is only in the wallet prompt.

**Footer** (three bands): product line (≤ 12 words) + links (Overview, How it works, Demo, Credits) · "GovChain is built by Monark" / « GovChain est conçu par Monark », Monark logo + tagline, links to the project page on monark.io and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", photo credits link.

## 5. Feature highlights

| Feature | User benefit | Where it appears | Proven by flow |
|-|-|-|-|
| Live tally with quorum and threshold | You see at a glance whether a proposal would pass right now, and why | Home hero; proposal page | Flow 2 |
| Three voting models, per proposal | The group picks the rule that fits the decision, and can see how another rule would have changed it | Home "how power is counted"; `/how-it-works`; composer; proposal comparison | Flows 2, 4 |
| Delegation | Busy members still count, through someone they trust | Home; `/how-it-works`; `/app/delegates` | Flow 3 |
| Proposals with actions (execution hooks) | A passed decision is carried out as voted, not re-interpreted later | Composer; proposal page; `/how-it-works` | Flows 4, 5 |
| Roles and permissions | Clear, enforced rights: who can propose, cancel, vote | App (role in the power card, explained locks); `/how-it-works` | Flow 4 |
| Results and history | Participation and outcomes are visible over time, so the group can adapt its rules | `/app/results`; proposal timeline | Flow 5 |

## 6. Key flows

All transactions go through a simulated wallet prompt ("Confirm in your wallet": action summary, estimated network fee, the testnet disclaimer when value moves (the only place it appears), *Confirm* / *Reject*), then a pending state with a transaction hash (1.2–2.4 s, 3–6 s with "slow network"), then confirmed or failed. Demo controls can make the next transaction fail on-chain; rejecting in the wallet prompt always produces the "rejected" failure.

1. **Connect a wallet.** `/app` → "Connect demo wallet" → wallet prompt "Sign in to GovChain" (no fee) → *pending* ("Waiting for signature…") → *connected*: header shows the `connect-wallet` chip; the power card shows 1,250 tGOV, proposer role. *Failed*: rejecting shows "You declined the sign-in request. Nothing was shared." with retry.
2. **Vote on an active proposal.** Proposal page → choose *For*, *Against* or *Abstain* → optional reason (280 characters) → *Cast your vote* → wallet prompt (proposal, choice, weight "1,250 tGOV") → *pending*: your ballot shows as a hatched ghost segment on the tally → *confirmed*: the segment fills, the quorum marker and outcome settle (e.g. "Quorum reached · Passing"), your vote appears first in the list with its receipt. *Failed*: "Failed. The transaction failed on the network. Nothing was recorded." with *Try again*; the choice and reason stay filled. Already voted: the panel shows your ballot and receipt instead of buttons (no toast). Delegated away: "You delegated your power to Amara." + *Manage delegation*. Other members keep voting live while a proposal is open (toggle in demo controls).
3. **Split your voting power.** `/app/delegates` → on a delegate's card, set *Your share* (amount, slider, or 25% / 50% / Max); the diagram previews the split with a "Preview: not signed yet" tag and a running "lent · kept" line → *Sign the new split* → wallet prompt (one row per delegate and "Kept for yourself") → *pending* → *confirmed*: delegates' power counts up, their cards read "Your delegate" and "You lend X tGOV". On proposals using delegation you vote with what you kept (the panel says how much is with your delegates); if you lent everything, the panel explains why you can't vote directly. *Take back all my power* reverses it. Failed as above. Saved demo state from before splits (one `delegate`) migrates to a single full-balance split.
4. **Create a proposal with an action.** `/app/new` (proposer or admin; a voter sees a locked page: "Publishing needs the proposer role", "Or 2,000 tGOV. Switch role in Demo controls.", *Back to proposals*) → template or blank → title, category, reasoning → action: signal / treasury transfer (amount, token, recipient address validated `0x` + 40 hex, capped at the treasury balance) / rule change → rules: model, period, quorum, threshold, with a plain-language preview ("Passes if at least 8,000 tGOV take part and more than 50% of them vote For") → *Submit proposal* → wallet prompt → *pending* ("Publishing your proposal…") → *confirmed*: redirect to the new proposal, voting open (no toast). *Failed*: "Publishing failed on the network. Nothing was created." with *Try again*; the form stays filled. Validation errors are listed at the top and inline.
5. **Close, then execute a passed proposal.** On an open proposal, the *Manage* card → *End voting now* (an info popover says it is demo-only) (a simulated clock jump) → the result is computed (passed, defeated or quorum not met) and stamped. On a passed proposal with an action → *Execute* → wallet prompt (the transfer or rule change, disclaimer) → *pending* → *confirmed*: status "Executed", treasury or space rules update, receipt in the timeline, results page updated. *Failed*: "Execution reverted. The treasury is unchanged; you can retry." Proposers can *Cancel* their own open proposal (admins any) with the same transaction states.

## 7. Content (EN / FR)

Tone: the guidelines' voice. Open and practical, "you" and "your community", Web3 terms explained on first use, no hype. One butterfly-flavoured line at most (the closing band).

The shipped copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts` (typed: French must satisfy the English shape). Draft copy for the main sections:

### Home

| Slot | English | Français |
|-|-|-|
| H1 | Every voice counted. Every decision on record. | Chaque voix comptée. Chaque décision consignée. |
| Sub | Propose, vote and act together, under rules nobody can quietly change. | Proposez, votez et agissez ensemble, selon des règles que personne ne modifie en douce. |
| CTAs | Cast a vote in the demo · How a vote works | Voter dans la démo · Comment se déroule un vote |
| Models H2 | Choose how power is counted | Choisissez comment le pouvoir se compte |
| Model: wallet | **One wallet, one vote.** Every member weighs the same. | **Un portefeuille, une voix.** Chaque membre pèse autant. |
| Model: token | **Token-weighted.** Ballots weigh by tGOV held. | **Pondéré par jetons.** Les bulletins pèsent selon les tGOV détenus. |
| Model: delegated | **With delegation.** Lend some or all of your power to delegates, take it back anytime. | **Avec délégation.** Confiez tout ou partie de votre pouvoir, reprenez-le quand vous voulez. |
| Same ballots | The demo-day venue vote, counted two ways. (Two bars computed from the seed: passes by tokens, fails 9 to 11 by wallets.) | Le vote sur la salle du demo day, compté de deux façons. |
| Lifecycle H2 | The life of a proposal | La vie d'une proposition |
| Steps | Propose · Vote · Reach quorum · Result · Execute | Proposer · Voter · Atteindre le quorum · Résultat · Exécuter |
| Who H2 | Built for groups that decide together | Pensé pour les groupes qui décident ensemble |
| Student councils | Budgets, events and rules, on record for next year. | Budgets, événements et règles, consignés pour l'an prochain. |
| Protocol and DAO teams | Grants and parameters by token weight, with delegates. | Subventions et paramètres au poids des jetons, avec délégués. |
| Co-ops and collectives | Shared money moves only when members say so. | L'argent commun ne bouge que si les membres le décident. |
| Closing | Your community has a decision to make. / Launch the demo | Votre communauté a une décision à prendre. / Lancer la démo |

**FAQ** (the only FAQ on the site; quorum vs threshold and "what does execute do" live on `/how-it-works`)

1. *Is this a real vote?* No. It's a testnet demo: no real tokens, and nothing leaves your browser. / *Est-ce un vrai vote ?* Non. C'est une démo sur testnet : aucun vrai jeton, et rien ne quitte votre navigateur.
2. *If I delegate, do I lose my tokens?* No. You lend your voting power, not your tokens, and can take it back anytime. / *Si je délègue, est-ce que je perds mes jetons ?* Non. Vous confiez votre pouvoir de vote, pas vos jetons, et vous pouvez le reprendre.
3. *Can a vote be changed after it's cast?* No. Ballots are final, which is what makes the tally trustworthy. / *Peut-on modifier un vote déjà exprimé ?* Non. Les bulletins sont définitifs : c'est ce qui rend le décompte fiable.
4. *Who can create a proposal?* Members with the proposer role, or anyone holding 2,000 tGOV. / *Qui peut créer une proposition ?* Les membres ayant le rôle de proposant, ou quiconque détient 2 000 tGOV.

### App: key strings

| Slot | English | Français |
|-|-|-|
| Connect gate | Connect a demo wallet. Nothing is signed for real. | Connectez un portefeuille de démo. Rien n'est signé pour de vrai. |
| Power card | Your voting power · Your own tGOV · Delegated to you · Role | Votre pouvoir de vote · Vos tGOV · Délégués à vous · Rôle |
| Tabs | Active · Passed · Closed · All | En cours · Adoptées · Terminées · Toutes |
| Empty list | No proposals here yet. + *New proposal* | Aucune proposition ici pour l'instant. + *Nouvelle proposition* |
| No search match | No proposal matches "{query}". + *Clear search* | Aucune proposition ne correspond à « {query} ». + *Effacer la recherche* |
| Outcome lines | Passing · Not passing · Quorum not reached yet · Passed · Defeated · Quorum not met · Executed · Cancelled | En voie d'adoption · En voie de rejet · Quorum pas encore atteint · Adoptée · Rejetée · Quorum non atteint · Exécutée · Annulée |
| Vote panel | Cast your vote · For · Against · Abstain · Add a reason (optional) | Votez · Pour · Contre · Abstention · Ajoutez une raison (facultatif) |
| Delegated away (all) | You lent all your power to {names}. + *Manage delegation* | Vous avez confié tout votre pouvoir à {names}. + *Gérer la délégation* |
| Delegated in part | You vote with the {kept} tGOV you kept; {lent} tGOV is with your delegates. | Vous votez avec les {kept} tGOV que vous avez gardés ; {lent} tGOV sont chez vos délégués. |
| Wallet prompt | Confirm in your wallet · Estimated network fee · Confirm · Reject | Confirmez dans votre portefeuille · Frais de réseau estimés · Confirmer · Refuser |
| Disclaimer (wallet prompt only, when value moves) | Testnet demo · not financial advice · no real funds | Démo sur testnet · ceci n'est pas un conseil financier · aucun fonds réel |
| Pending | Waiting for the network… | En attente du réseau… |
| Transaction failed | The transaction failed on the network. Nothing was recorded. + *Try again* | La transaction a échoué sur le réseau. Rien n'a été enregistré. + *Réessayer* |
| Rejected | You rejected the request. Nothing was sent. | Vous avez refusé la demande. Rien n'a été envoyé. |
| Execution failed | Execution reverted. The treasury is unchanged; you can retry. | L'exécution a échoué. Le trésor est inchangé ; vous pouvez réessayer. |
| Locked composer | Publishing needs the proposer role / Or 2,000 tGOV. Switch role in Demo controls. | Publier demande le rôle de proposant / Ou 2 000 tGOV. Changez de rôle dans les réglages de la démo. |
| Unknown proposal | We couldn't find this proposal. It may have been removed by a demo reset. | Proposition introuvable. Elle a peut-être disparu lors d'une réinitialisation. |
| Storage error | Your browser blocked storage: the demo will forget changes. | Votre navigateur bloque le stockage : la démo oubliera vos changements. |

The complete list (form validation, demo controls, results, how-it-works and credits copy) is in the dictionaries.

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by the guidelines: cream / espresso tokens derived from `#f88d10` with `--surface-tint: 1` (the §3 token block pasted over the `theme.json` base theme), Nunito Sans 400/600/700/800, pill actions, 1rem cards, borders rather than shadows, flat orange only.

- **Layout and rhythm.** The home page alternates a wide statement band with a dense band: hero (copy left, live tally card right on desktop; stacked on mobile) → voting models (three cards with mini dot diagrams, then the "same ballots" strip) → lifecycle strip → photo cards → FAQ (single column, 68ch) → closing band. The branded section divider appears once (before the lifecycle). The app is a working tool: two columns on desktop (proposals + power/activity rail; on a proposal, content + sticky vote panel), single column on mobile with the vote panel right under the tally.
- **Tally colours.** For = `primary` orange fill, Against = `foreground` at reduced strength (espresso or cream ink), a pending ballot = hatched ghost (an SVG mask pattern, not a gradient); participation is a thin ink gauge with the quorum marker, abstentions included. Outcomes use muted green / amber / red, always with a text label. Orange stays the accent: one primary action per view.
- **Hero visual.** The live tally card (see §3).
- **Mesh butterfly.** Used once, on the home hero, large and cropped off the right edge at low opacity behind the tally card, flat orange lines. Nowhere else.
- **Illustrations.** Only the mesh butterfly is reused. The site draws its own flat orange line art in code: the three voting-model dot diagrams, the proposal lifecycle, the quorum/threshold gauge and the delegation lines. No gradients, no glows.
- **Photography direction.** Warm, natural-light photos of real groups deciding together: students on stone steps, a small team around a wooden table, a community assembly in a circle outdoors. Same warm grade on cream and espresso. Used only in the "who it's for" section, each paired with a short line of copy.
- **Signature moments.**
  1. **The tally settles.** Your ballot enters the bar as a hatched ghost while pending, fills on confirmation, the quorum marker flips to "Quorum reached" and the outcome line settles. Hero and proposal page.
  2. **Same ballots, other rules.** On a proposal, switching the comparison between voting models re-weighs the same ballots and the bar re-settles, showing how the rule changes the result.
  3. **Power moves.** Adjusting a share previews the split live: lines fan out from you to each delegate, as thick as their share, with a dashed line for what you keep. Signing settles them and the delegates' power counts up; taking it back collapses the fan to the dashed line.
- Motion: 150–250 ms ease-out for state changes (the hero loop and bar re-weighing are slower, explanatory); everything honours `prefers-reduced-motion` (final state rendered directly).

## 9. Assets

| Asset | Purpose | Placement |
|-|-|-|
| `public/images/steps.jpg` (Unsplash, Limbo Hu) | Student council use case | Home "who it's for", `/credits` |
| `public/images/table.jpg` (Unsplash, Redd Francisco) | Protocol / DAO team use case | Home "who it's for", `/credits` |
| `public/images/circle.jpg` (Unsplash, Dorota Trzaska) | Co-op / collective assembly use case | Home "who it's for", `/credits` |
| `public/brand/*` Monark logos (standalone, horizontal light/dark, vertical light/dark) | Header pairing, footer, 404, favicon, wallet prompt | Shell |
| `public/brand/monark-mesh.svg` | Home hero decoration | Home hero only |
| `public/brand/socials/*.svg` | Footer social icons | Footer |
| Open Graph image | Generated with `next/og` per locale | Metadata |

Icons: Lucide only. Diagrams built in JSX/SVG: tally bar, voting-model dots, lifecycle, quorum gauge, delegation lines, turnout chart. Full credits in `docs/assets.md` and on `/credits`.

## 10. Pricing strategy

GovChain is **free, included in the Monark bundle**. Reasons: it is the governance module Monark's own community runs on, and a decision tool only works if every member can use it without a paywall; charging per vote or per member would push communities towards fewer, less inclusive votes. It is open source. On a real network the only cost is gas (the transaction fee) for proposing, voting and executing, and off-chain signed votes can remove even that for members. Partners that need a supported deployment (their own chain, onboarding, a contract review) go through Monark's partnership programme, not a price list.

A designed `/{locale}/pricing` page exists **for internal review only**: not linked anywhere, excluded from `sitemap.xml`, `robots: { index: false, follow: false }`. No other page mentions prices.

## 11. Out of scope

- Real wallets, chains, signing or tokens (no wagmi/viem; `src/lib/demo/` is shaped so they could be swapped in).
- Multiple spaces, space creation, and member onboarding (minting tGOV); the demo has one seeded space.
- Editing a proposal after it is published (ballots must be cast on fixed text); authors cancel and resubmit instead.
- Timelocks, vetoes, quadratic or ranked-choice voting, private (ZK) ballots and snapshot-block semantics (the demo weighs ballots with current delegations): not simulated.
- Partial delegation's contracts: a standard ERC20Votes token delegates a whole balance to one address, so splits need a sub-delegation proxy per delegate (Uniswap's Franchiser pattern) or a governor counting fractional votes (Flexible Voting). The demo simulates the proxy route as one transaction; how-it-works and an info popover say so.
- Off-chain signed votes are explained, not simulated: every demo vote is a simulated on-chain transaction.
- Discussion threads and notifications; a vote reason is the only free text.
- A `/brand` page, a blog, or any backend.

## 12. Implementation notes and decisions taken while building

- **Theme.** `theme-2026.json` is not published, so `https://ui.monark.io/r/theme.json` was installed and the guidelines' §3 token block pasted over it in `src/app/globals.css`, plus muted `--success` / `--warning` status colours (always with a text label). `--surface-tint: 1`.
- **Registry components.** `wallet`, `token-amount`, `network-badge` and `tx-status` came from the `@monark` registry through the shadcn CLI. `connect-wallet` fails in the CLI (its bare `wallet` dependency doesn't resolve), so its source was copied verbatim from the registry JSON. They were restyled to pills and given localizable labels; `token-amount` shows numbers in Nunito Sans with tabular figures instead of monospace (the guidelines reserve monospace for addresses, hashes and code). The shadcn style is `radix-nova`, matching the rest of the Monark family.
- **Proposer threshold is 2,000 tGOV**, not 1,000 as first drafted: the demo wallet holds 1,250 tGOV, so a 1,000 threshold would have made the "voter can't publish" lock impossible to show.
- **Tally as two bars.** A single For / Against / Abstain bar made quorum and threshold impossible to read at once; shipping two answers (result bar with threshold, participation gauge with quorum) matches the "two different questions" story on `/how-it-works`.
- **Worked examples are computed.** The home "same ballots" strip and the `/how-it-works` model table are computed at build time from the same seed the demo uses (`src/lib/demo/examples.ts`), so the copy can't drift from the data (72% For by tokens, 9 to 11 by wallets).
- **"End voting now"** lives in the proposal's *Manage* card, labelled "Demo only", rather than in the global demo controls, because it acts on one proposal.
- **Live voters.** While connected, a simulated member casts a ballot on an open proposal every 7–13 s (up to 80% turnout), following each proposal's lean. It can be switched off in demo controls; the screenshot script turns it off for determinism.
- **Toasts** are almost gone: every transaction is confirmed in place (vote panel, delegation card, redirect to the new proposal, "Executed" status), so only "Demo reset" and the wallet's "Address copied" still toast. They sit top-right below the header and the app bar on desktop (136 px), full width over the app bar on phones.
- **Context on demand.** `src/components/ui/info-tip.tsx` (Radix Popover behind an info icon, works on touch) holds the "why" that used to be paragraphs: role permissions, delegation rules, what each proposal action does, "End voting now" being demo-only. The "Same ballots, other rules" comparison is a collapsed disclosure.
- **Dependencies beyond the stack:** `next-themes` (theme without a flash), `sonner` (toasts), `react-jazzicon` (required by the registry `wallet`), `radix-ui` (shadcn primitives); `playwright` as a dev dependency for `pnpm screenshots`. No recharts: the turnout chart and tallies are drawn in code.
- **Screenshots** live in `docs/screenshots/`: every page and each flow state at 390 and 1440 px, light and dark, in English; home, connect, proposals, a vote and the composer in French.
