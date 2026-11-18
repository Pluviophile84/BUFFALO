# BUFFALO ($BUFFALO) — The Fourth Issue

The official pre-launch website for BUFFALO, a Solana token issued on pump.fun.
It is a static Astro site that deploys to Vercel from GitHub with no configuration
beyond connecting the repository.

> The bison has been American money three times. Now it belongs to no nation.

---

## Quick start

Requires Node **22.23.4 or later** (pinned in `.nvmrc` and `package.json#engines`).

```bash
npm i
```

```bash
npm run dev        # http://localhost:4321
```

```bash
npm run build      # → dist/
```

```bash
npm test           # builds both states, runs every check, then Lighthouse CI
```

`npm test` takes about 2½ minutes. It needs Chromium for Playwright; on a machine
without one, run `npx playwright install chromium` first.

Other scripts:

| Script | What it does |
|---|---|
| `npm run assets` | Rebuilds every committed asset from the master and logo pack: layers, fonts, plates, reference renders, guilloche, kit, favicons. Only needed if a source changes. |
| `npm run test:static` | Node-only checks (config guards, CSP output, asset integrity). Fast. |
| `npm run test:browser` | Playwright checks (logo diff, axe, copy lint, visual QA, interactions, fonts, budgets). |
| `npm run lighthouse` | Lighthouse CI with the §9 budgets as assertions. |

---

## Launch procedure

**Only one file changes at launch: `src/config/issue.ts`.**

1. Edit `src/config/issue.ts`:
   - `status: 'live'`
   - `contractAddress: '<the mint address>'`

   The explorer link (`https://solscan.io/token/{address}`) and the acquisition link
   (`https://pump.fun/coin/{address}`) are derived automatically. Override them only
   after a DEX migration (`explorerUrl`, `buyUrl`; the hosts are allowlisted).
2. Add what is verified:
   - `xUrl`, `telegramUrl` (these may go live before the contract; buttons enable
     as soon as a URL is set)
   - `totalSupply`, `mintAuthority`, `freezeAuthority`, `teamAllocation`
   - `issueDate` (optional, ISO `YYYY-MM-DD`)

   Unset facts render as **Pending verification**: never blank, never guessed.
3. Commit and push. Vercel builds and deploys.
   - The build **fails instead of publishing** if anything is wrong: `live`
     without an address, an address that is not base58 or not 32–44 characters,
     a non-`https` URL, a host off the allowlist, or an explorer override that
     doesn't contain the exact address. Read the build log; it lists every problem.
4. Verify, in a clean browser profile:
   - [ ] Open every link on the page: Acquire, Verify on explorer, View on explorer, Official X, Custodian chat.
   - [ ] Match the serial **character by character** against the explorer: hero, Specification and final section. They render from one value, but check.
   - [ ] Check supply, mint authority and freeze authority on-chain against the Specification ledger.
   - [ ] Confirm the X card with the X card validator. The OG image switches from the SPECIMEN variant to `/og/buffalo-fourth-issue.png`, a new filename, so caches refresh.
   - [ ] Publish the same serial from the official X account.

Before launch, the page is incapable of showing a live state: in pre-issue
builds, acquire and explorer controls render as `<a aria-disabled="true">` with
no `href`, copy buttons are disabled, SPECIMEN marks are present, and no
contract-shaped string exists in the HTML. Tests enforce all of this. Test
fixtures can never deploy: the build refuses `BUFFALO_ISSUE_FIXTURE` when
`VERCEL` is set.

---

## Domain setup (Vercel)

1. Vercel → Project → **Settings → Domains** → add `buffalocoin.xyz` and `www.buffalocoin.xyz`.
2. Make the apex canonical: set `www.buffalocoin.xyz` to **redirect (308) to `buffalocoin.xyz`**.
3. At the registrar, create the records Vercel shows on the Domains page. They are typically:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   Vercel may display project-specific values instead. Use exactly what the dashboard shows.

Canonical tags, `og:url`, OG image URLs and the sitemap all use
`https://buffalocoin.xyz`, with no trailing slash. A test fails the suite if any
other host appears in built absolute URLs.

---

## Design rationale

**Engraved Future.** The logo already contains the design system: the past
(engraved bison, bronze rim, greenback field, cream), the present (the Ƀ as a
currency sign) and the future (computed guilloche, the ket-notation ground line).
The site keeps that mapping. Caslon and intaglio textures carry the past;
monospace ledgers carry the present; one living guilloche field and one
iridescent security thread carry the future.

**Palette.** Every canonical colour is sampled from the master SVG. Derived
colours exist only for legibility, and every text pair meets WCAG 2.2 AA.
Bronze is the only colour allowed to draw the eye.

**Caslon.** The Dunlap broadside, the first printing of the Declaration of
Independence (1776), was set in Caslon type cast in London. American
independence was announced in type from abroad. The bison now leaves its origin
the same way.

**The frameless Fourth Issue.** Issues I–III sit in engraved frames with
registration marks and a microtext border: bounded. Issue IV has no frame. It
bleeds to the edge of the viewport, and when it scrolls into view a frame draws
and then dissolves. The border is removed.

**Read from afar, it is a line.** Rules, borders and the security thread resolve
into microtext up close, as the logo's ground line does.

---

## Decisions and deviations

Each is deliberate and tested. Where the brief could not be met literally, the
reason is stated.

1. **Ƀ (U+0243) and ⟩ (U+27E9) are in none of the fonts.** I checked every
   fontsource subset of Libre Caslon and JetBrains Mono. Per the brief's
   fallback, both are inline SVG glyphs:
   - Ƀ uses the master's own currency-sign path, sized to cap height.
   - ⟩ is drawn to JetBrains Mono's metrics (the extent and stem of `|`).

   The real character sits in a visually hidden span for assistive tech and
   copy/paste. Tests assert no font ever draws either code point, and that every
   rendered character is inside the font subsets.
2. **The coin is layered from extracted layers** in the master's coordinate
   system. Its locked geometry lives in a final `emblem` cascade layer, so no
   section rule can move a layer. The guilloche layers (coin and field) are drawn
   with `<use>` from external SVGs: vector at any size, cached once, and never
   mistaken for the LCP image (CSS masks and `<img>` both were).
3. **The strike plays from first paint via CSS.** That means no flash and no
   render-blocking script. "Once per session" works by finishing the animation
   on later views (`sessionStorage`). Without JS, a `<noscript>` stylesheet
   renders the coin complete. Reduced motion shows it complete at once.
4. **Text never sits on the guilloche.** The hero copy sits on a solid "clear
   field" that runs to the viewport edge, so the line field terminates in one
   clean edge, like the blank panel of a banknote.
5. **Mobile hero.** The DOM order is H1 first, and CSS shows the coin first.
   The coin is `min(78vw, 42vh, 560px)`, which is exactly 78vw on phones and
   smaller on tablets, so the H1 lands in the first viewport.
   - Below 1024px, two of the three security-thread windows fit (one above the
     coin, one below it). All three show on desktop.
   - On phones the SPECIMEN stamp sits under the coin, left of the thread:
     beside the coin, never over it.
6. **Microtext card borders are four SVG text strips**, not one `textPath`. The
   cards are fluid, and a `textPath` rectangle would need JS to size it.
7. **The LCP element is the preloaded hero bison**, not the H1. At both mobile
   and desktop widths the engraved bison is larger on screen than either H1 line.
   Both are painted at first paint (the H1 is never transparent, clipped or
   masked; tested), the bison is preloaded with `fetchpriority="high"`, and LCP
   is about 1.6 s in Lighthouse mobile.
8. **Below-the-fold dark sections use `content-visibility: auto`.** Their fonts,
   masks and fields load as they approach. Paper sections are excluded, because
   tools that hit-test skipped content read their text against the dark root.
   Transitions are declared on interactive states only, so nothing animates when
   a section first renders.
9. **CSP check.** The JSON-LD block is a non-executable data block and is the
   only `<script>` without `src`. Everything else is external; there is no
   inline style and no handler.
10. **Typography.** The brief's straight apostrophes are set as typographic
    apostrophes (’). The copy test normalises them. **No typos were found in
    §5; no copy was changed.**
11. **Structural strings not in §5** (neutral, and covered by the banned-word
    test): "Skip to content", "Menu"/"Close", the screen-reader-only "Status:"
    and "Serial copied.", the `/disclaimer` headings ("NOTICE", "Disclaimer",
    "Image credits", "Sources") with credit field labels, kit tile names and
    format lines, and the scroller label "I — IV".
12. **Icons.**
    - The maskable 512 icon is the pack's padded file. Android crops maskable
      icons; an edge-to-edge one would lose the rim.
    - `apple-touch-icon` is the pack file, whose corners are `#16170F`, not
      `--vault`.
    - Favicons (SVG, ICO, 16/32 PNG) are the Ƀ in cream on vault, generated
      because the pack's are the full emblem.
13. **Kit 2048 emblem.** It isn't in the pack, so it is rendered from the master.
    The pack README notes the embedded bison raster stays fully sharp only up to
    about 1218 px. At 2048 it is interpolated. The 512 and 1024 exports are pack
    files.
14. **Historical images** are covered in `ASSET-SOURCES.md`. Only the gold coin
    was below 2× its plate width; it was upgraded to the Commons
    *2006 American Buffalo Proof Reverse* (PD-USGov-money). Read the caveat
    there: the Commons source field is a third-party site, and usmint.gov
    refuses automated requests.
15. **Lighthouse is measured locally** with Vercel's serving semantics:
    HTTP/2 + TLS, brotli, cleanUrls, the exact `vercel.json` headers, and
    Lantern's simulated mobile throttling. Plain HTTP/1.1 without compression
    scores much lower. Re-check on the deployed URL.
16. **No rule under the hero coin.** The engraved rule that sat under the coin
    (`<EngravedRule lines={4} class="hero__ground">` in `Hero.astro`, with its
    `.hero__ground` styles and the 4-line rule variant, used nowhere else) is
    removed; it had no meaning outside the logo. It had no strike step of its
    own. The space it took (16 px gap + 13 px rule) is kept as the coin's bottom
    margin, so nothing else moves: coin, stamp and H1 are at the same positions
    as before at every width (tested). The only ground line in the hero is the
    one inside the emblem (`#ground`, with the ket microtext), untouched.
17. **The hero coin is centred in its own column.** On two-column layouts
    (≥ 1024 px) the coin was centred in grid track 7–12. That track is not the
    open area to the right of the text block: it starts a column gap (24 px)
    after the text block's edge and ends at the page margin, and above 1416 px
    short of the space beside the max-width container. Meanwhile the field and
    the dark ground run on to the hero's edge, so the coin read as left of centre
    (at 1440: 87 px of field on its left, 123 px on its right; at 1920: 68 px and
    344 px).
    - The coin's column now spans that open area exactly, from the text block's
      edge to the hero's right edge. It is measured with the hero as a size
      container (`100cqw`), so scrollbars never skew it.
    - The coin keeps its size and vertical position.
    - The security thread, the guilloche field, the vignette and the SPECIMEN
      stamp all centre on, or align to, the coin, so they move with it.
    - Single-column layouts are unchanged.
18. **Opening and closing the menu never moves the page.**
    - **Root cause:** closing the menu returned focus to the toggle with a plain
      `focus()`. The toggle sits in the sticky nav, inside `html`'s 88 px
      `scroll-padding-top` band, so the browser treated it as obscured and
      scrolled the page about half a viewport on every close: −4,260 px after 10
      toggles at 390×844. Opening also removed a classic scrollbar, so the page
      reflowed 15 px wider and back (layout shift 0.32 at 1440×900).
    - **Scroll lock:** `overflow: hidden` on `<html>` only, with
      `scrollbar-gutter: stable` on `<html>` globally. There is no
      `position: fixed` body and no `scrollTo`.
    - **Focus:** every focus call in the menu (open, focus trap, and the return
      to the toggle) uses `preventScroll`.
    - **Nav clearance:** the 88 px clearance under the sticky nav moved from
      `scroll-padding-top` on `<html>` to `scroll-margin-top` on the content's
      targets. Anchor jumps land at exactly the same place (88 px), and Tabbing
      onto the toggle no longer scrolls the page.
    - The focus trap, Esc to close, the inert background and focus return are
      unchanged. The nav is 65 px tall, open or closed.
    - At ≥ 1100 px the toggle is hidden (the nav links show), so the 1440×900
      test drives the same open/close code through the buttons themselves.

### TODO-ASSET

- None blocking. *Optional:* replace
  `assets/historical/2006_American_Buffalo_Proof_Reverse-1280px.jpg` with the
  U.S. Mint's own file if you want first-party provenance, then run
  `npm run assets`.

### Known placeholders

`seriesYear: 2026` (shown as SERIES 2026; confirm before launch), `xUrl`,
`telegramUrl`, `issueDate`, and the four on-chain facts. All live in
`src/config/issue.ts`.

---

## Test results (last run)

`npm test` → **130/130 Playwright checks passed; Lighthouse CI assertions passed.**

| Check | Result |
|---|---|
| Logo diff: hero (strike finished / reduced motion), Card IV, the Mark, rendered in place at 1000 px vs resvg master | 0.396% / 0.384% / 0.384% / 0.384% differing pixels (limit 0.5%) |
| Layer geometry in place, every coin, at 375 / 768 / 1440 | every layer within 0.75 px of the master's transforms |
| Kit emblem PNG 512 / 1024 / 2048 vs master | 0.416% / 0.000% / 0.000% |
| OG emblem region, both states · X header · wallpapers | 0.000% · under 0.5% each |
| Edge-to-edge (alpha bbox = canvas ± 1 px) | all 7 emblem PNGs pass |
| `frame.svg` (SVGO, precision 0.1) vs master `#frame` | under 0.1% |
| axe-core (WCAG 2.2 AA + best practice): `/`, `/disclaimer`, `/404` × 375/1440 × both states × motion on/off | 0 violations (24 runs) |
| Copy lint | 171 §5 strings present verbatim per state; banned list clean; no other-state copy shipped |
| Visual QA at 320 · 375 · 414 · 768 · 1024 · 1280 · 1440 · 1920 | no horizontal overflow; no overlapping hero text; no text on the coin; H1 in the first viewport; screenshots in `tests/screenshots/` |
| Config guards | live without contract fails; bad explorer fails; fixture on Vercel fails; derived URLs exact |
| Hero coin centring at 375 · 768 · 1024 · 1280 · 1440 · 1920, gutter reserved and not | coin centre = column centre (±1 px); two columns: column = text block edge → hero edge, coin clear of the text block; thread, field, vignette centred on the coin; stamp placement kept |
| Hero coin size and vertical position vs the first version; rule removed | identical (±0.5 px) at all six widths; no rule in the hero; emblem `#ground` present |
| Menu: 10 open/close toggles × top / middle / near the bottom × 1440×900, 390×844, 900×900 (classic scrollbars) | scrollY unchanged after every toggle (difference 0); layout shift 0; nav height constant; focus returned |
| Menu by keyboard (390, 900): focus the nav, Tab to the toggle, Enter, Tab and Shift+Tab inside, Esc | page never moves; focus trapped; background inert; focus back on the toggle |

**Lighthouse (mobile, median of 3):**

| URL | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` pre-issue | 100 | 100 | 100 | 100 | 1.58 s | 0 | 19 ms |
| `/` live fixture | 100 | 100 | 100 | 100 | 1.58 s | 0 | 0 ms |
| `/disclaimer` | 100 | 100 | 100 | 100 | 0.80 s | 0 | 0 ms |

TBT varies run to run (0–42 ms here, 0–17 ms for the first version measured
alongside). In both, the only long tasks are the initial document parse and
layout around first paint, counted or not depending on where FCP lands.

INP cannot be measured in the lab. TBT is the lab proxy, and the only long work
on the page is the canvas (fine pointers only, 0.6 ms per frame median).

**Bundle sizes:**

| Asset | Size | Budget |
|---|---|---|
| JS, all chunks | 4.3 KB gz (2.6 main + 1.8 lazy canvas) | 30 KB |
| CSS | 9.4 KB gz | 35 KB |
| Fonts | 91 KB woff2 (5 faces, subset) | 140 KB |
| Hero assets, mobile 1x | 87 KB (bison 480 AVIF 34 KB, ground WebP 31 KB, guilloche SVG 22 KB) | 220 KB |
| HTML `/` | 11.8 KB gz | — |
| Third-party requests | 0 | 0 |

---

## Asset inventory

### Logo pack (received)

`BUFFALO_Logo_Pack.zip`, 39 files. Files marked ✓ are copied into
`assets/logo-pack/` and used.

| Folder | Files |
|---|---|
| `01_Master` | `BUFFALO_Master.svg` (2.27 MB, viewBox `40 40 920 920`) ✓ → `assets/source/BUFFALO_Master_EdgeToEdge.svg`, byte-identical. The pack README also lists `_Source_Original.svg` and `_Print-Vector.pdf`; neither was in the zip. |
| `02_Transparent_PNG` | `BUFFALO_Transparent_16/32/64/128/256/512/1024.png`; 512 ✓ and 1024 ✓ go to the kit |
| `03_Token_and_Listings` | CoinGecko-CMC 200, DEX icon 512, Launchpad 512, Token metadata 1024, Wallet icon 256 |
| `04_Social_Avatars` | Avatar full-bleed (dark corners) 1024 JPG, full-bleed transparent 1024, Discord 512, Telegram 640, X profile 400 |
| `05_Web_and_Favicon` | `favicon.ico`, favicon 16/32/48, `apple-touch-icon.png` ✓, android-chrome 192 ✓ / 512 ✓, maskable 512 ✓, Website-Logo 1024 PNG/WebP, 512 WebP, `site.webmanifest`, `head-snippet.html` |
| `06_Print` | Send-to-Printer 10 cm PDF, Print-Max-Sharp 1218 PNG |
| `07_Solid_Backgrounds` | On-Black / On-Dark-Brand / On-White 1024, JPG and PNG |

### Generated (committed)

| Path | Source | Size |
|---|---|---|
| `public/brand/frame.svg` | master `#frame`, SVGO precision 0.1, fills exact | 208 KB (21 KB br) |
| `public/brand/guilloche.svg` | frame line work only, `<g id="guilloche">` | 208 KB (21 KB br) |
| `public/brand/b-symbol{,-ink,-bronze}.svg` | master Ƀ, transform baked, tight viewBox `286.638 250 426.724 500` | 0.9 KB each |
| `public/brand/bison.png` | `#bison-raster`, byte-identical | 1.27 MB, 1023×721 |
| `public/brand/bison-{480,768,1023}.{avif,webp}` | from `bison.png`; never above native width | AVIF 34 / 80 / 113 KB |
| `public/brand/ground.{png,webp}` | `#ground-raster` (PNG byte-identical; WebP lossless) | 39 / 31 KB, 882×52 |
| `public/brand/manifest.json` | dimensions, sizes, SHA-256 of every layer | — |
| `src/assets/fonts/*.woff2` | fontsource, subset + metric-matched fallbacks (`src/styles/fonts.css`) | 16–21 KB each |
| `src/assets/history/*` | historical plates, 3 widths each, AVIF + WebP | see `ASSET-SOURCES.md` |
| `src/assets/generated/guilloche-{hero,final}.svg` | seeded generator `src/lib/guilloche.mjs` | 62 / 31 KB (6 / 4 KB br) |
| `src/assets/generated/land.svg` | `world-atlas` land-110m, Equal Earth | 57 KB (17 KB br) |
| `public/kit/buffalo-emblem-{512,1024,2048}.png` | pack / pack / master render | 246 KB / 844 KB / 2.6 MB |
| `public/kit/buffalo-b-{cream,ink,bronze}.{svg,png}` | extracted Ƀ (PNG 854×1000) | 1 KB / 22 KB |
| `public/kit/buffalo-x-header-1500x500.png` | vault + guilloche + whole emblem | 464 KB |
| `public/kit/buffalo-wallpaper-{phone-1290x2796,desktop-2560x1440}.png` | same | 1.2 / 1.5 MB |
| `public/favicon.{svg,ico}`, `favicon-{16,32}x….png` | Ƀ in cream on vault | 1–2 KB |
| `public/og/buffalo-fourth-issue[-specimen].png` | **generated at build**, by state | ≈ 408 KB, 1200×630 |
| `tests/fixtures/master-{1000,2000}.png` | resvg render of the untouched master | reference for every diff |

---

## Repository map

```
src/config/issue.ts          ← the only file edited at launch
src/lib/validate-issue.mjs   validation + derivation (shared by build, OG script and tests)
src/lib/issue-state.ts       build-time state; importing it validates the config
src/lib/guilloche.mjs        deterministic guilloche (build SVG + runtime canvas)
src/lib/map.mjs              borderless map (land geometry only)
src/content/copy.ts          final copy (§5), paired by state
src/components/ · src/sections/ · src/layouts/ · src/pages/
src/scripts/                 vanilla TS islands: strike, nav, reveal, copy-serial, mark, guilloche-canvas
src/styles/                  @layer reset, tokens, base, components, sections, utilities, emblem
scripts/                     extract-layers, build-fonts, build-historical, reference-render,
                             build-generated, build-kit, build-og
tests/static/ · tests/browser/ · tests/lighthouse.mjs · lighthouserc.cjs
```

Facts and sources used in the copy are listed in §6 of the brief and on `/disclaimer`.
