# Asset sources

Every image on the site, where it came from, its license statement, and its
original dimensions. Mirrored on [/disclaimer](https://buffalocoin.xyz/disclaimer).

## The emblem (locked)

| File | Origin |
|---|---|
| `assets/source/BUFFALO_Master_EdgeToEdge.svg` | Owner's master emblem (logo pack `01_Master/BUFFALO_Master.svg`, byte-identical, SHA-256 `a328fba5…50a5bdd3`). viewBox `40 40 920 920`. Never shipped to the browser. |
| `public/brand/*` | Extracted from the master by `scripts/extract-layers.mjs`: extraction, placement and scaling only. `bison.png` and `ground.png` are byte-identical to the embedded rasters. Hashes in `public/brand/manifest.json`. |
| `public/kit/buffalo-emblem-512.png`, `-1024.png` | Logo pack `02_Transparent_PNG` (preferred over generation). |
| `public/kit/buffalo-emblem-2048.png` | Not in the pack; rendered from the master with resvg. |
| `public/apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png` | Logo pack `05_Web_and_Favicon`. |

## Historical plates

All three are U.S. Government works (currency and U.S. Mint imagery) in the
public domain. No recoloring, aging or retouching. The coin photographs are cut
out onto their plates with a lossless circular alpha mask; RGB pixels are copied
byte for byte (`scripts/build-historical.mjs`).

### Issue I — 1901 United States Note, $10 ("Bison Note")

- **File used:** `assets/historical/bison-note-1901.webp` — the vetted baseline from the previous site, 960 × 411 px.
- **Source:** Wikimedia Commons, [File:US $10 1901.jpg](https://commons.wikimedia.org/wiki/File:US_$10_1901.jpg) (original 1967 × 843 px).
- **License statement:** Public domain (United States currency; U.S. Government work).
- **Why no upgrade:** the plate renders at ≤ 320 CSS px, so the baseline already exceeds 2× its largest rendered width.
- **Caveat:** the Commons file page credits a coin-shop scan as its source. The image is a faithful reproduction of a two-dimensional public-domain work, and the brief names this exact Commons file as an approved source.

### Issue II — Buffalo nickel, reverse (James Earle Fraser, 1913)

- **File used:** `assets/historical/buffalo-nickel-optimized.webp` — the vetted baseline from the previous site, 900 × 900 px.
- **Source:** United States Mint ([usmint.gov — Nickel](https://www.usmint.gov/learn/coins-and-medals/circulating-coins/nickel)).
- **License statement:** Public domain (U.S. Mint image, U.S. Government work).
- **Why no upgrade:** the coin renders at ≤ 300 CSS px, so 900 px is ≥ 2×.

### Issue III — American Buffalo gold coin, 2006 proof, reverse (upgraded)

- **File used:** `assets/historical/2006_American_Buffalo_Proof_Reverse-1280px.jpg`, 1280 × 1280 px (SHA-256 `69b31f66…7f432dd`).
- **Source:** Wikimedia Commons, [File:2006 American Buffalo Proof Reverse.jpg](https://commons.wikimedia.org/wiki/File:2006_American_Buffalo_Proof_Reverse.jpg). Original 2000 × 2000 px; the standard 1280 px Commons rendition was fetched, as Wikimedia asks automated clients to do.
- **License statement (verbatim from the file page):** "Like all US Mint images, this image is in the public domain as a work of the US government." License template: PD-USGov-money. Author field: "US government". EXIF date 2006-06-13, consistent with the Mint's launch imagery for the coin.
- **Why upgraded:** the baseline `gold-buffalo-optimized.webp` (500 × 500) is below 2× the plate's rendered width on tablet and mobile.
- **Caveat, stated plainly:** the Commons `Source` field points to a third-party numismatic website (bank25.ru), not to usmint.gov. The file page explicitly asserts U.S.-Government-work public-domain status, which satisfies the brief's sourcing rule. However, usmint.gov refuses automated requests from this build environment (HTTP 403), so the original could not be fetched directly from the Mint. If you prefer strict first-party provenance, replace this file with the Mint's own image and run `npm run assets`. If the file is removed, the build falls back to the baseline automatically.
- **Composition change:** the baseline showed a 2026 coin's obverse and reverse overlapping. The upgrade shows the 2006 reverse alone (Fraser's bison). It matches the card's caption ("introduced 2006") and puts the bison, the subject of the section, in front.

The baseline `gold-buffalo-optimized.webp` (500 × 500, RGBA) remains in `assets/historical/` as the fallback.

## Map

`world-atlas` `land-110m.json` (Natural Earth, public domain), land geometry
only, with no country objects in the dataset. Equal Earth projection via `d3-geo`.

## Fonts

Libre Caslon Display, Libre Caslon Text and JetBrains Mono, SIL Open Font
License 1.1, via `@fontsource`. Subset by `scripts/build-fonts.mjs` and self-hosted.

## Not used

Nothing from dealers, grading services, auction houses or stock libraries. No
generated or AI-synthesized currency or coin imagery. Nothing from the obsolete
flat-vector emblem or `$BUFF` assets.
