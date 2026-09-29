# GovChain by Monark: site plan

Status: shipped on `develop`. Written before any code, then kept in sync with what shipped (see §12 for decisions taken while building).

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
| Delegation | Lending your voting power to a trusted member (a delegate) who votes with it. You can take it back at any time. |
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
2. **Members who can't follow every vote still count.** Delegate your voting power to someone you trust, and take it back whenever you want.
3. **Decisions actually happen.** A passed proposal carries its own action (a treasury payment, a rule change), executed from the result, with a receipt anyone can check.

## 3. Hero

- **Headline** (7 words): *Every voice counted. Every decision on record.*
  FR: *Chaque voix comptée. Chaque décision consignée.*
- **Subheadline:** *GovChain gives your student association, DAO or co-op one place to propose, vote and act on decisions, with rules everyone can read and results nobody can quietly change.*
  FR: *GovChain réunit en un seul lieu les propositions, les votes et les décisions de votre association étudiante, de votre DAO ou de votre coop, avec des règles lisibles par tous et des résultats que personne ne peut modifier en douce.*
- **Primary CTA:** "Cast a vote in the demo" / « Voter dans la démo » → `/{locale}/app`.
- **Secondary CTA:** "See how a vote works" / « Voir comment se déroule un vote » → `/{locale}/how-it-works`.
- **Visual:** a **live tally card**, built in code: the proposal "Fund the winter hackathon prize pool" with its tally drawn as two answers: a For / Against bar with the threshold marker, and a participation gauge with the quorum marker (abstentions count here). Ballots arrive one by one (small voter chips), the bars grow, the quorum line flips from "Quorum: 6,700 tGOV of 7,670 tGOV" to "Quorum reached", and the outcome line settles on "Passing". It loops calmly. Product UI rather than a photo, because the moment a tally settles *is* the product. The mesh butterfly sits large and cropped behind it (see §8).

## 4. Page map

All routes live under `/{locale}` (`en`, `fr`). `/` and any locale-less path redirect to the visitor's preferred language (fallback English) via `src/proxy.ts`.

| Route | Purpose | Sections, in order |
|-|-|-|
| `/{locale}` | Home: explain the idea in 30 seconds and send people into the demo. | Hero with live tally card · Three outcomes · "Choose how power is counted" (three voting models with mini diagrams, and the "same ballots, different result" example) · The life of a proposal (compact five-step strip) · Who decides with GovChain (3 photo cards) · FAQ · Closing call to action |
| `/{locale}/app` | The interactive demo: the space's proposals. | Connect gate (when disconnected) · Space header (name, members, treasury, participation) · Your voting power card (own, delegated to you, delegated away, role) · Proposals with status tabs (Active, Passed, Closed, All) and search · Recent activity rail |
| `/{locale}/app/proposals/[id]` | One proposal: read it, vote, follow the tally, execute it. | Header (status, category, author, time left) · Tally (bar, quorum marker, threshold, outcome) · Your vote panel · "Same ballots, other rules" comparison · Reasoning · The rules of this vote · Action (execution hook) · Votes cast (list with reasons) · Timeline with receipts |
| `/{locale}/app/new` | Create a proposal (proposers and admins). | Templates · Title, category, reasoning · Action (signal, treasury transfer, rule change) · Rules (voting model, period, quorum, threshold) · Live preview card · Submit |
| `/{locale}/app/delegates` | Delegate your voting power, or take it back. | Your power and current delegate · Delegates (name, pitch, power received, participation rate) · Delegate / undelegate |
| `/{locale}/app/results` | Results tracking and analytics (a documented deliverable). | Summary (proposals, pass rate, average turnout) · Turnout per proposal against quorum (bar chart in SVG) · Outcomes by category · Your voting history |
| `/{locale}/how-it-works` | For students, developers and careful members: the mechanics. Justified because the documentation frames GovChain as a teaching testbed (governance design, on-chain vs off-chain recording, contract logic). | The life of a proposal (diagram) · Quorum vs threshold with a worked example · The three voting models on the same ballots · Delegation · Roles and permissions table · On-chain vs off-chain vote recording · For developers (contract interface and how the demo data layer mirrors it) · Call to action |
| `/{locale}/credits` | Photo, font and icon credits (required by the asset rules). | Photos · Type and icons · Monark brand assets |
| `/{locale}/pricing` | **Internal strategy review only.** Never linked, excluded from the sitemap, `noindex, nofollow`. | "Free, part of Monark" card · What it costs to run · Partner deployments · Reasoning |
| 404 | Friendly not-found with the vertical Monark logo and links home and to the demo. | |

**Header** (standard Monark shell): "GovChain by Monark" pairing → home · links: *Overview*, *How it works*, *Demo* (pill highlight on the active one) · EN/FR switch · theme toggle · primary pill *Launch demo*. Inside `/app` the primary action becomes the `connect-wallet` component and a "Demo · simulated data" badge appears. Mobile: pairing + menu button opening a full-height sheet.

**App sub-navigation** (inside `/app`, pill tabs under the header): *Proposals*, *Delegates*, *Results*, plus the *New proposal* action and *Demo controls*.

**Footer** (three bands): product line + links (Overview, How it works, Demo, Credits) · Monark logo + tagline, links to the project page on monark.io and the GitHub repo, social icons · "© {year} Monark · Open source", "Demo · simulated data", photo credits link.

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

All transactions go through a simulated wallet prompt ("Confirm in your wallet": action summary, estimated network fee, the testnet disclaimer when value moves, *Confirm* / *Reject*), then a pending state with a transaction hash (1.2–2.4 s, 3–6 s with "slow network"), then confirmed or failed. Demo controls can make the next transaction fail on-chain; rejecting in the wallet prompt always produces the "rejected" failure.

1. **Connect a wallet.** `/app` → "Connect demo wallet" → wallet prompt "Sign in to GovChain" (no fee) → *pending* ("Waiting for signature…") → *connected*: header shows the `connect-wallet` chip; the power card shows 1,250 tGOV, proposer role. *Failed*: rejecting shows "You declined the sign-in request. Nothing was shared." with retry.
2. **Vote on an active proposal.** Proposal page → choose *For*, *Against* or *Abstain* → optional reason (280 characters) → *Cast your vote* → wallet prompt (proposal, choice, weight "1,250 tGOV") → *pending*: your ballot shows as a hatched ghost segment on the tally → *confirmed*: the segment fills, the quorum marker and outcome settle (e.g. "Quorum reached · Passing"), your vote appears first in the list with its receipt. *Failed*: "Failed. The transaction failed on the network. Nothing was recorded; you can try again." with *Try again*; the choice and reason stay filled. Already voted: the panel shows your ballot and receipt instead of buttons. Delegated away: "You delegated your power to Amara. Take it back to vote yourself." Other members keep voting live while a proposal is open (toggle in demo controls).
3. **Delegate your voting power.** `/app/delegates` → pick a delegate (pitch, participation, power received) → *Delegate 1,250 tGOV* → wallet prompt → *pending*: a line carries your power to the delegate's card → *confirmed*: their power counts up, your card reads "Delegated to …", vote panels explain why you can't vote directly. *Undelegate* reverses it. Failed as above. Voters can delegate; everyone can undelegate.
4. **Create a proposal with an action.** `/app/new` (proposer or admin; a voter sees a locked page explaining that proposers need 2,000 tGOV or the proposer role, with a link to switch role in demo controls) → template or blank → title, category, reasoning → action: signal / treasury transfer (amount, token, recipient address validated `0x` + 40 hex, capped at the treasury balance) / rule change → rules: model, period, quorum, threshold, with a plain-language preview ("Passes if at least 8,000 tGOV take part and more than 50% of them vote For") → *Submit proposal* → wallet prompt → *pending* ("Publishing your proposal…") → *confirmed*: redirect to the new proposal, voting open. *Failed*: "Publishing failed on the network. Nothing was created." with *Try again*; the form stays filled. Validation errors are listed at the top and inline.
5. **Close, then execute a passed proposal.** On an open proposal, demo controls → *End voting now* (a simulated clock jump) → the result is computed (passed, defeated or quorum not met) and stamped. On a passed proposal with an action → *Execute* → wallet prompt (the transfer or rule change, disclaimer) → *pending* → *confirmed*: status "Executed", treasury or space rules update, receipt in the timeline, results page updated. *Failed*: "Execution reverted. The treasury is unchanged; you can retry." Proposers can *Cancel* their own open proposal (admins any) with the same transaction states.

## 7. Content (EN / FR)

Tone: the guidelines' voice. Open and practical, "you" and "your community", Web3 terms explained on first use, no hype. One butterfly-flavoured line at most (the closing band).

The shipped copy lives in `src/i18n/dictionaries/en.ts` and `fr.ts` (typed: French must satisfy the English shape). Draft copy for the main sections:

### Home

| Slot | English | Français |
|-|-|-|
| Eyebrow | Governance module · Monark | Module de gouvernance · Monark |
| H1 | Every voice counted. Every decision on record. | Chaque voix comptée. Chaque décision consignée. |
| Sub | GovChain gives your student association, DAO or co-op one place to propose, vote and act on decisions, with rules everyone can read and results nobody can quietly change. | GovChain réunit en un seul lieu les propositions, les votes et les décisions de votre association étudiante, de votre DAO ou de votre coop, avec des règles lisibles par tous et des résultats que personne ne peut modifier en douce. |
| CTAs | Cast a vote in the demo · See how a vote works | Voter dans la démo · Voir comment se déroule un vote |
| Outcomes H2 | Decide together without counting hands in a group chat | Décider ensemble, sans compter les mains dans un groupe de discussion |
| Outcome 1 | **Rules first, votes second.** Quorum, threshold and what happens if it passes are set before the vote opens, and can't move mid-vote. | **Les règles d'abord, le vote ensuite.** Quorum, seuil et conséquences sont fixés avant l'ouverture du vote, et ne bougent plus ensuite. |
| Outcome 2 | **Busy members still count.** Lend your voting power to someone you trust, and take it back whenever you like. | **Les membres occupés comptent aussi.** Confiez votre pouvoir de vote à une personne de confiance, et reprenez-le quand vous voulez. |
| Outcome 3 | **Decisions actually happen.** A passed proposal carries its own action, a payment or a rule change, executed with a public receipt. | **Les décisions se concrétisent.** Une proposition adoptée porte sa propre action, un paiement ou un changement de règle, exécutée avec un reçu public. |
| Models H2 | Choose how power is counted | Choisissez comment le pouvoir se compte |
| Models intro | Each proposal says how votes are weighed. Pick the rule that fits the decision. | Chaque proposition précise comment les voix sont pesées. Choisissez la règle adaptée à la décision. |
| Model: wallet | **One wallet, one vote.** Every member weighs the same. Best for community questions like a code of conduct. | **Un portefeuille, une voix.** Chaque membre pèse autant. Idéal pour les questions de communauté, comme un code de conduite. |
| Model: token | **Token-weighted.** Votes weigh by tGOV held, the space's governance token. Best when stakes follow contribution. | **Pondéré par jetons.** Les voix pèsent selon les tGOV détenus, le jeton de gouvernance de l'espace. Idéal quand l'enjeu suit la contribution. |
| Model: delegated | **With delegation.** Token-weighted, and members can lend their power to a delegate. Best for regular treasury decisions. | **Avec délégation.** Pondéré par jetons, et chacun peut confier son pouvoir à un délégué. Idéal pour les décisions de trésorerie courantes. |
| Same ballots | The demo-day venue vote had 20 ballots. Weighed by tokens it passed, 72% For. Counted one wallet, one vote, it would have failed 9 to 11. (Numbers are computed from the seed at build time.) | Le vote sur la salle du demo day a réuni 20 bulletins. Pondéré par jetons, il est adopté avec 72 % de « pour ». À un portefeuille, une voix, il aurait échoué à 9 contre 11. |
| Lifecycle H2 | The life of a proposal | La vie d'une proposition |
| Steps | Propose · Vote · Reach quorum · Result · Execute | Proposer · Voter · Atteindre le quorum · Résultat · Exécuter |
| Who H2 | Built for groups that decide together | Pensé pour les groupes qui décident ensemble |
| Student councils | A budget, an event, a code of conduct: every member votes, and the result is there for next year's executive. | Un budget, un événement, un code de conduite : chaque membre vote, et le résultat reste pour l'exécutif de l'an prochain. |
| Protocol and DAO teams | Grants and parameter changes pass by token weight, with delegates for the day-to-day. | Subventions et changements de paramètres passent au poids des jetons, avec des délégués pour le quotidien. |
| Co-ops and collectives | Shared money moves only when members say so, and the payment goes out the moment they do. | L'argent commun ne bouge que si les membres le décident, et le paiement part dès qu'ils l'ont fait. |
| Closing | Your community has a decision to make. Try it in the demo. / Launch the demo | Votre communauté a une décision à prendre. Essayez-la dans la démo. / Lancer la démo |

**FAQ**

1. *Is this a real vote?* No. This is a testnet demo with simulated data: no real tokens, no real wallet, nothing leaves your browser. / *Est-ce un vrai vote ?* Non. C'est une démo sur testnet avec des données simulées : aucun vrai jeton, aucun vrai portefeuille, rien ne quitte votre navigateur.
2. *What is quorum, and how is it different from the threshold?* Quorum is how many must take part for the result to count. The threshold is how many of those must say For. A proposal can win 90% of votes and still fail if too few people voted. / *Quelle différence entre quorum et seuil ?* Le quorum, c'est la participation minimale pour que le résultat compte. Le seuil, c'est la part de « pour » nécessaire parmi les votants. Une proposition peut récolter 90 % de « pour » et échouer faute de participation.
3. *If I delegate, do I lose my tokens?* No. Delegation lends your voting power, not your tokens. You keep them, and you can take the power back at any time. / *Si je délègue, est-ce que je perds mes jetons ?* Non. Vous confiez votre pouvoir de vote, pas vos jetons. Vous les gardez, et vous pouvez reprendre ce pouvoir à tout moment.
4. *Can a vote be changed after it's cast?* No. Ballots are final, which is what makes the tally trustworthy. Think it through, and add a reason others can read. / *Peut-on modifier un vote déjà exprimé ?* Non. Les bulletins sont définitifs, c'est ce qui rend le décompte fiable. Prenez le temps d'y penser, et ajoutez une raison que les autres pourront lire.
5. *Who can create a proposal?* Members with the proposer role, or anyone holding at least 2,000 tGOV. Admins can also cancel a proposal before it closes. / *Qui peut créer une proposition ?* Les membres ayant le rôle de proposant, ou quiconque détient au moins 2 000 tGOV. Les admins peuvent aussi annuler une proposition avant sa clôture.
6. *What does "execute" do?* If a passed proposal has an action, a treasury payment or a rule change, executing it carries that action out exactly as voted. / *Que fait « exécuter » ?* Si une proposition adoptée comporte une action, un paiement du trésor ou un changement de règle, l'exécution l'applique exactement comme votée.

### App: key strings

| Slot | English | Français |
|-|-|-|
| Connect gate | Connect a demo wallet to join the Riverbend Blockchain Society's votes. Nothing is signed for real. | Connectez un portefeuille de démo pour participer aux votes de la Riverbend Blockchain Society. Rien n'est signé pour de vrai. |
| Power card | Your voting power · Your own tGOV · Delegated to you · Role | Votre pouvoir de vote · Vos tGOV · Délégués à vous · Rôle |
| Tabs | Active · Passed · Closed · All | En cours · Adoptées · Terminées · Toutes |
| Empty list | No proposals here yet. Start one, or reset the demo to bring back the examples. | Aucune proposition ici pour l'instant. Lancez-en une, ou réinitialisez la démo pour retrouver les exemples. |
| No search match | No proposal matches "{query}". Try another word or clear the search. | Aucune proposition ne correspond à « {query} ». Essayez un autre mot ou effacez la recherche. |
| Outcome lines | Passing · Not passing · Quorum not reached yet · Passed · Defeated · Quorum not met · Executed · Cancelled | En voie d'adoption · En voie de rejet · Quorum pas encore atteint · Adoptée · Rejetée · Quorum non atteint · Exécutée · Annulée |
| Vote panel | Cast your vote · For · Against · Abstain · Add a reason (optional) | Votez · Pour · Contre · Abstention · Ajoutez une raison (facultatif) |
| Delegated away | You delegated your power to {name}. Take it back to vote yourself. | Vous avez confié votre pouvoir à {name}. Reprenez-le pour voter vous-même. |
| Wallet prompt | Confirm in your wallet · Estimated network fee · Confirm · Reject | Confirmez dans votre portefeuille · Frais de réseau estimés · Confirmer · Refuser |
| Disclaimer | Testnet demo · not financial advice · no real funds | Démo sur testnet · ceci n'est pas un conseil financier · aucun fonds réel |
| Pending | Waiting for the network… | En attente du réseau… |
| Transaction failed | The transaction failed on the network. Nothing was recorded; you can try again. | La transaction a échoué sur le réseau. Rien n'a été enregistré ; vous pouvez réessayer. |
| Rejected | You rejected the request in your wallet. Nothing was sent. | Vous avez refusé la demande dans votre portefeuille. Rien n'a été envoyé. |
| Execution failed | Execution reverted. The treasury is unchanged; you can retry. | L'exécution a échoué. Le trésor est inchangé ; vous pouvez réessayer. |
| Locked composer | Creating a proposal needs the proposer role or 2,000 tGOV. You're a voter right now. | Créer une proposition demande le rôle de proposant ou 2 000 tGOV. Vous êtes votant pour l'instant. |
| Unknown proposal | We couldn't find this proposal. It may have been removed when the demo was reset. | Proposition introuvable. Elle a peut-être disparu lors de la réinitialisation de la démo. |
| Storage error | Your browser blocked local storage, so the demo will forget changes when you leave. | Votre navigateur bloque le stockage local : la démo oubliera vos changements à la fermeture. |

The complete list (form validation, demo controls, results, how-it-works and credits copy) is in the dictionaries.

## 8. Aesthetics (within the Monark guidelines)

Colour, type, logo, header and footer are fixed by the guidelines: cream / espresso tokens derived from `#f88d10` with `--surface-tint: 1` (the §3 token block pasted over the `theme.json` base theme), Nunito Sans 400/600/700/800, pill actions, 1rem cards, borders rather than shadows, flat orange only.

- **Layout and rhythm.** The home page alternates a wide statement band with a dense band: hero (copy left, live tally card right on desktop; stacked on mobile) → outcomes (three columns, outline icons top-left) → voting models (three cards with mini dot diagrams, then the "same ballots" strip) → lifecycle strip → photo cards → FAQ (single column, 68ch) → closing band. The branded section divider appears twice. The app is a working tool: two columns on desktop (proposals + power/activity rail; on a proposal, content + sticky vote panel), single column on mobile with the vote panel right under the tally.
- **Tally colours.** For = `primary` orange fill, Against = `foreground` at reduced strength (espresso or cream ink), a pending ballot = hatched ghost (an SVG mask pattern, not a gradient); participation is a thin ink gauge with the quorum marker, abstentions included. Outcomes use muted green / amber / red, always with a text label. Orange stays the accent: one primary action per view.
- **Hero visual.** The live tally card (see §3).
- **Mesh butterfly.** Used once, on the home hero, large and cropped off the right edge at low opacity behind the tally card, flat orange lines. Nowhere else.
- **Illustrations.** Only the mesh butterfly is reused. The site draws its own flat orange line art in code: the three voting-model dot diagrams, the proposal lifecycle, the quorum/threshold gauge and the delegation lines. No gradients, no glows.
- **Photography direction.** Warm, natural-light photos of real groups deciding together: students on stone steps, a small team around a wooden table, a community assembly in a circle outdoors. Same warm grade on cream and espresso. Used only in the "who it's for" section, each paired with a line of copy and the voting model that group would use.
- **Signature moments.**
  1. **The tally settles.** Your ballot enters the bar as a hatched ghost while pending, fills on confirmation, the quorum marker flips to "Quorum reached" and the outcome line settles. Hero and proposal page.
  2. **Same ballots, other rules.** On a proposal, switching the comparison between voting models re-weighs the same ballots and the bar re-settles, showing how the rule changes the result.
  3. **Power moves.** Delegating draws a line from your card to your delegate's, and their power counts up; undelegating draws it back.
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
- **Toasts** sit top-right below the header, network strip and section tabs on desktop (196 px), and full width over the network strip on phones, so they never cover the tally or panel they report on.
- **Dependencies beyond the stack:** `next-themes` (theme without a flash), `sonner` (toasts), `react-jazzicon` (required by the registry `wallet`), `radix-ui` (shadcn primitives); `playwright` as a dev dependency for `pnpm screenshots`. No recharts: the turnout chart and tallies are drawn in code.
- **Screenshots** live in `docs/screenshots/`: every page and each flow state at 390 and 1440 px, light and dark, in English; home, connect, proposals, a vote and the composer in French.
