# Assets

## Photography

All photos are from Unsplash under the free [Unsplash License](https://unsplash.com/license) (none are Unsplash+; each was checked on its photo page and downloaded from `images.unsplash.com`). They were resized to 2,000 px on the long edge, compressed (JPEG quality 78) and are served from `public/images/` with `next/image`. Photographers are credited on `/credits`, linked from the footer.

| File | Unsplash page | Photographer | Profile | Used on |
|-|-|-|-|-|
| `public/images/steps.jpg` | https://unsplash.com/photos/u_Jg3Wv7h4M | Limbo Hu | https://unsplash.com/@limbolize | Home, "Who decides with GovChain": student councils; `/credits` |
| `public/images/table.jpg` | https://unsplash.com/photos/PTRzqc_h1r4 | Redd Francisco | https://unsplash.com/@reddfrancisco | Home, "Who decides with GovChain": protocol and DAO teams; `/credits` |
| `public/images/circle.jpg` | https://unsplash.com/photos/1tAtO-9HYNM | Dorota Trzaska | https://unsplash.com/@dtrzaska1 | Home, "Who decides with GovChain": co-ops and collectives; `/credits` |

## Monark brand assets

From `lovable-migration/brand-refs/` and the [monark-community/website](https://github.com/monark-community/website) repo, used per `monark-brand-guidelines.md`:

| File | Source | Used for |
|-|-|-|
| `public/brand/monark-mark.svg`, `src/app/icon.svg` | brand-refs `logos/svg/standalone/logo-branded-standalone.svg` | Header pairing, favicon, wallet prompt, connect gate, hero card, OG image |
| `public/brand/monark-horizontal-{light,dark}.svg` | website `public/vectors/brand/horizontal/` | Footer Monark band |
| `public/brand/monark-vertical-{light,dark}.svg` | brand-refs `logos/svg/vertical/` | 404 page |
| `public/brand/monark-mesh.svg` | website `public/vectors/decorative/monark-mesh.svg` | Home hero only (once per site) |
| `public/brand/socials/*.svg` | website `public/vectors/socials/` | Footer social links (recoloured to `foreground` through a CSS mask for contrast) |

## Built in code

- Tally bars (result with threshold, participation with quorum) and the pending-ballot hatch: `src/components/diagrams/tally-view.tsx`.
- Voting-model dot diagrams (one wallet one vote, token-weighted, delegation): `src/components/diagrams/model-dots.tsx`.
- Proposal lifecycle strip: `src/components/diagrams/lifecycle.tsx`.
- Delegation line (your power travelling to your delegate): `src/components/demo/delegates-view.tsx`.
- Turnout-per-proposal chart and outcomes by category: `src/components/demo/results-view.tsx`.
- Open Graph image: generated per locale with `next/og` (`src/app/[locale]/opengraph-image.tsx`).
- Flat orange line art only, no gradients or glows. Icons: [Lucide](https://lucide.dev). Type: Nunito Sans via `next/font/google`.
