# Simplification pass

Owner feedback: *"Simplify, reduce text quantity, revise flows so that context is only given when necessary. Two top bars on homepage is too busy; demo banners only on demo/app pages."*

Method: the TrustRate pilot (`sites/address-review-system/docs/simplification.md`, §4 checklist). Binding rules: `monark-brand-guidelines.md` §8 "Restraint", §10 and §11. GovChain is Monark-branded, so the header and footer were also brought to the current standard (§2, §10).

How the numbers are measured (both scripts in `scripts/`, run against `pnpm start -p 3138`):

- `node scripts/wordcount.mjs`: words per page, English, 1440px. *Visible* is the `innerText` of `<main>`; *total* also counts closed disclosures and FAQ answers; *chrome* is everything outside `<main>` (header, footer). On `/app` pages the app bar is inside `<main>`, and the counts include seeded data (proposal titles, reasons, delegate pitches, activity).
- `node scripts/dictcount.mjs`: words of copy in `src/i18n/dictionaries/{en,fr}.ts`, per section.

## 1. Before

| Page | Visible in main | Total in main (incl. collapsed) | Chrome |
|-|-:|-:|-:|
| Home | 586 | 738 | 71 |
| How it works | 713 | 713 | 71 |
| Credits | 133 | 133 | 71 |
| 404 | 30 | 30 | 71 |
| App: connect gate | 54 | 54 | 74 |
| App: proposals | 366 | 368 | 76 |
| App: proposal (hackathon) | 417 | 419 | 76 |
| App: new proposal | 218 | 220 | 76 |
| App: delegates | 187 | 189 | 76 |
| App: results | 186 | 188 | 76 |
| **Total** | **2,890** | **3,052** | **738** |

Dictionary copy: **EN 4,119 words** (meta 169 · common 133 · terms 50 · home 736 · how 655 · credits 98 · pricing 175 · app 1,327 · seed 775); **FR 4,578**.

### Inventory

**Shell**
- Header built before the standard: "GovChain · by Monark" pairing (two lines on tablet), links pushed to the right, pill highlight on the active link, no Demo chip; inside `/app` a dashed "Demo · simulated data" badge next to the brand.
- Footer legal band carried "Demo · simulated data" **and** "Testnet demo · not financial advice · no real funds". No "built by Monark" line.

**Home** (hero + 6 sections, 2 dividers)
1. Hero: eyebrow "Governance module · Monark", H1 (7 words), sub (31 words), 2 buttons, "Demo · simulated data" line, live tally card.
2. Outcomes: H2 (9 words) + 30-word intro + 3 items (18–22 words each). All three restated the models, delegation and lifecycle sections.
3. Voting models: eyebrow + H2 + intro + 3 cards (14–20 words + a "best for" chip) + "same ballots" strip with a 35-word sentence.
4. Lifecycle: 5 steps with 10–12-word bodies.
5. Who: eyebrow + H2 + 3 photo cards (model chip + title + 14–20 words).
6. FAQ: 6 questions (two were mechanics: quorum vs threshold, what "execute" does).
7. Closing: H2 + 22-word line + button.

**How it works**: eyebrow, 35-word intro; 7 numbered sections each with a 15–50-word paragraph; long worked example (40 words + 3 steps of 12–20 words); table notes; 30-word takeaway; 50-word delegation paragraph + 3 long points; the full contract mapping always open; CTA with a body line.

**App (`/app/...`)**
- **Two bars** under the header: a strip (network badge, the testnet disclaimer, Demo controls) and the section tabs (+ New proposal).
- Testnet disclaimer repeated in the strip, the composer's transfer fields, the Execute card, the wallet prompt and the footer.
- Connect gate: title, 18-word paragraph, 3 feature bullets, button.
- Proposals: "Space" eyebrow, summaries on every row, role hint paragraph in the power card, 7 activity entries.
- Proposal: comparison panel always open with a 25-word intro; Manage card with two permanent hints; Execute card with an explanation line and the disclaimer; 6 votes shown.
- Composer: 25-word intro, 2 field hints, 3 action hints, the disclaimer; locked page with body + hint.
- Delegates and Results: intro paragraphs; a permanent "applies to…" note; a chart explanation line.
- Demo controls: hints of 8–14 words.
- **Repeated messages**: a toast on every vote (plus a second on reaching quorum), delegation, publish, execute, cancel, "End voting now" and role change, while the panel, card, status or redirect already confirmed each one.

## 2. What changed

No feature or flow was removed. Words, chrome and repetition were.

### Shell (header and footer standard)
- Copied from Splitflow's current `src/components/site/` (commit 8a65052): `brand.tsx` (butterfly 28px + "GovChain", Nunito Sans 800 18px, one line, **no "by Monark"**; aria-label "GovChain, by Monark: home"), `demo-chip.tsx` (primary tint 8% light / 15% dark, primary-ink), `header.tsx` (links left after the brand; Demo chip → EN/FR → 36px theme toggle → primary action), `nav-links.tsx` (muted, active in foreground), `mobile-menu.tsx` (below `lg`: brand + menu; the sheet holds links, chip, EN/FR, theme, action), `theme.tsx`, `locale-switch.tsx`, `footer.tsx`.
- Removed `pairing.tsx` and `app-demo-badge.tsx` (the Demo chip replaces the in-app badge).
- Footer: Monark band opens with "GovChain is built by Monark" / « GovChain est conçu par Monark »; product line 15 → 11 words; legal band keeps "Demo · simulated data" only (testnet line removed).
- Marketing pages: exactly one top bar.

### Home (hero + 6 sections → hero + 5)
- Hero: removed the eyebrow and the demo line; sub 31 → 12 words; secondary CTA "See how a vote works" → "How a vote works".
- **Removed "Outcomes"**: each item restated a later section (rules first → lifecycle, busy members → delegation model, decisions happen → Execute step).
- Voting models: no eyebrow or intro; card lines 14–20 → 5–10 words; "best for" chips removed; "same ballots" sentence 35 → 7 words (the two bars carry the numbers).
- Lifecycle: step titles only, with the "The full mechanics" link.
- Who: no eyebrow, no model chips, lines 14–20 → 8–9 words.
- FAQ: 6 → 4 questions, answers 12–15 words. Quorum vs threshold and "what execute does" are `/how-it-works` content. This is the only FAQ.
- Closing: heading + button. One divider instead of two.

### How it works
- No eyebrow; intro 35 → 11 words.
- Section lines cut to one short line or removed (lifecycle, records); lifecycle states 10–14 → 6–9 words; worked example one line + 3 steps of 8–10 words; model notes removed; takeaway 30 → 11 words; delegation 50 → 11 words + 3 points of 7–8 words; records cards 25–30 → 11–15 words.
- For developers: one line; the contract calls sit behind a "Show the contract calls" disclosure.
- CTA: heading + button.

### App (`/app/...`)
- **One bar instead of two.** The strip is gone. The section tabs, one pill "● Sepolia testnet | Demo controls" (opens the controls; icon-only on phones) and *New proposal* share one bar. On phones *New proposal* moves next to the Proposals heading so the three sections fit at 390px (checked in EN and FR).
- **Testnet line once per transaction**: only in the wallet prompt (value-moving transactions). Removed from the strip, the composer, the Execute card and the footer.
- Connect gate: feature bullets removed; line 18 → 9 words.
- Proposals: no "Space" eyebrow; rows drop the summary (it is on the proposal page); activity 7 → 4 entries; role permissions moved into an info popover in the power card.
- Proposal: "Same ballots, other rules" is a collapsed disclosure; Execute card loses its explanation line and disclaimer; "End voting now" hint in an info popover; cancel hint only in the confirmation step; votes shown 3 at a time with "Show all".
- Composer: intro removed; title and reasoning hints became placeholders; the three action hints moved into one info popover; one note kept at the commit step: "Once published, the text and rules can't change."; locked page one line + *Back to proposals*.
- Delegates: intro and the "applies to…" note merged into an info popover next to the title. Results: intro and chart explanation removed (the legend stays); empty history = one line + link to Proposals.
- Demo controls: hints 8–14 → 3–5 words; reset confirmation 11 → 8 words.
- **One message, once**: no toast for vote, quorum, delegation, publish, execute, cancel, "End voting now" or role change; each is confirmed in place. Only "Demo reset" still toasts.
- Empty and error states: one line + the next action ("No proposals here yet." + *New proposal*; "No proposal matches "{q}"." + *Clear search*; "Nothing yet."; "No votes yet.").
- New shared component: `src/components/ui/info-tip.tsx` (copied from Splitflow).

French was rewritten to the same brevity in `src/i18n/dictionaries/fr.ts` (same keys; unused keys removed from both).

## 3. After

| Page | Visible before | Visible after | Change | Total before | Total after | Chrome before | Chrome after |
|-|-:|-:|-:|-:|-:|-:|-:|
| Home | 586 | 256 | −56% | 738 | 305 | 71 | 63 |
| How it works | 713 | 361 | −49% | 713 | 395 | 71 | 63 |
| Credits | 133 | 73 | −45% | 133 | 73 | 71 | 63 |
| 404 | 30 | 20 | −33% | 30 | 20 | 71 | 63 |
| App: connect gate | 54 | 20 | −63% | 54 | 20 | 74 | 63 |
| App: proposals | 366 | 263 | −28% | 368 | 265 | 76 | 65 |
| App: proposal (hackathon) | 417 | 304 | −27% | 419 | 365 | 76 | 65 |
| App: new proposal | 218 | 149 | −32% | 220 | 149 | 76 | 65 |
| App: delegates | 187 | 140 | −25% | 189 | 140 | 76 | 65 |
| App: results | 186 | 144 | −23% | 188 | 144 | 76 | 65 |
| **Total** | **2,890** | **1,730** | **−40%** | **3,052** | **1,876** | **738** | **640** |

Marketing pages alone (home, how it works, credits, 404): 1,462 → 710 visible words (−51%). Most remaining app words are seeded data (proposal titles and tallies, vote reasons, delegate pitches, activity).

Dictionary copy: **EN 4,119 → 3,003 words (−27%)**, FR 4,578 → 3,373 (−26%). Per section (EN): meta 169 → 163 · common 133 → 125 · home 736 → 306 · how 655 → 337 · credits 98 → 56 · app 1,327 → 1,015 · terms 50 and seed 775 unchanged · pricing 175 (internal, unlinked page, left as is).

### Screenshots

- Before: `docs/screenshots/before/en-1440-light-page-home.png`, `docs/screenshots/before/en-1440-light-flow2-proposal.png`.
- After: `docs/screenshots/en-1440-light-page-home.png`, `docs/screenshots/en-1440-light-flow2-proposal.png`, and every other page and flow step in `docs/screenshots/` (EN 390/1440 light/dark, FR 390/1440 light). File names are unchanged, so the project image was not re-rendered.
