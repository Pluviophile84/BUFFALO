# BUFFALO ($BUFFALO) — The Fourth Issue

The official pre-launch website for BUFFALO, a Solana token issued on pump.fun.
It is a static Astro site that deploys to Vercel from GitHub with no configuration
beyond connecting the repository.

> Paper. Nickel. Gold. Blockchain. An American monetary symbol, carried into its next form.

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
| `npm run verify-mint` | Checks the configured mint on Solana mainnet: owner, mint type, supply and authorities against the published facts. Required at launch (see below). Needs network access. |

---

## Launch procedure

**Only one file changes at launch: `src/config/issue.ts`.** Follow these steps in
order. Do not skip one because the one before passed.

1. **Set the config.** Edit `src/config/issue.ts`:
   - `status: 'live'`
   - `contractAddress: '<the mint address>'`

   The explorer link (`https://solscan.io/token/{mint}`) and the acquisition link
   (`https://pump.fun/coin/{mint}`) are derived from the mint automatically.
   Override them only after a DEX migration, and only with a defined route, the
   mint exactly in place of `{mint}`:
   - `explorerUrl`: `https://solscan.io/token/{mint}`,
     `https://explorer.solana.com/address/{mint}`,
     `https://solana.fm/address/{mint}` or `https://birdeye.so/token/{mint}`
     (optionally `?chain=solana`). Pair and pool pages are not explorer links.
   - `buyUrl`: `https://pump.fun/coin/{mint}`, `https://jup.ag/swap/SOL-{mint}`
     or `https://raydium.io/swap/?…outputMint={mint}`.

   Add what is verified:
   - `xUrl`, `telegramUrl`. These may go live before the contract: buttons enable
     as soon as a URL is set. In the live state an unset channel is hidden, and
     with neither set the page says "No official chat channel has been
     published."
   - `totalSupply`, `mintAuthority`, `freezeAuthority`, `teamAllocation`. Write
     an authority as `Revoked` or as its exact address.
   - `issueDate` (optional, `YYYY-MM-DD`, a real calendar date).

   Unset facts render as **Pending verification**: never blank, never guessed.
2. **Run `npm run verify-mint`. It must pass.** It asks Solana mainnet
   (`getAccountInfo`, jsonParsed) about `contractAddress`:
   - the account must be owned by the SPL Token or Token-2022 program, and must
     be a mint;
   - it prints the decimals, the supply, the mint authority and the freeze
     authority;
   - it fails if `totalSupply`, `mintAuthority` or `freezeAuthority`, when set,
     differ from the chain.

   It is deliberately not part of the Vercel build, so an RPC hiccup cannot block
   a deploy. Set `SOLANA_RPC_URL` to use another endpoint.
3. **Commit and push.** Vercel builds the deployment. The build **fails instead of
   publishing** if anything is wrong, and the build log lists every problem:
   - `live` without an address;
   - an address that is not base58, not 32–44 characters, or does not decode to
     exactly 32 bytes;
   - a non-`https` URL, or a social link off its allowlist;
   - an explorer or buy override that is not one of the defined routes for this
     exact mint;
   - an `issueDate` that is not a real `YYYY-MM-DD` date.
4. **Check the Vercel preview in a clean browser profile** (no extensions, no
   saved sessions):
   - [ ] Open every link on the page: the hero's buy and verify actions, Verify on
     explorer, View on explorer, Official X, Custodian chat (where set).
   - [ ] Confirm the X card with the X card validator. The OG image switches from
     the SPECIMEN variant to `/og/buffalo-fourth-issue.png`, a new filename, so
     caches refresh.
   - [ ] If you pushed a branch, promote the preview (or merge it) only once these
     checks pass, then repeat them on the production URL.
5. **Verify the mint character by character on the explorer:** the hero, the
   Specification and the final section each against the explorer page. They
   render from one value, but check every character, not just the first and last
   four.
6. **Publish the same mint from the official X account.**

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
monospace ledgers carry the present; the logo's own guilloche, enlarged into a
field around the coin, and one iridescent security thread carry the future.

**Palette.** Every canonical colour is sampled from the master SVG. Derived
colours exist only for legibility, and every text pair meets WCAG 2.2 AA.
Bronze is the only colour allowed to draw the eye.

**Caslon.** The Dunlap broadside, the first printing of the Declaration of
Independence (1776), was set in Caslon type cast in London. American
independence was announced in type from abroad. The bison now leaves its origin
the same way.

**The Fourth Issue, in the same series.** All four issues sit in the same
engraved frame, with registration marks and a microtext border: paper, nickel,
gold and the chain read as one continuous series, the next chapter of the same
history rather than a break from it (Refinement Batch 2).

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
    §5.** The copy was revised in Refinement Batch 2 (decision 22).
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

19. **The SPECIMEN · PRE-ISSUE stamp fits its box on phones.**
    - **Cause:** below 1024 px the stamp is capped at half the column minus
      16 px, to stay left of the security thread. But it was a single
      `white-space: nowrap` line of 15.2 em (20 monospaced characters at
      0.6 em, plus 0.16 em letter-spacing) with 28 px of padding and border.
      That is wider than the cap on every phone, so the text ran out of the box
      on the right: 14 px at 320, 6 px at 390. The 12/10 px padding also only
      approximated the trailing letter-spacing.
    - **Fix:** below 480 px, where one line cannot fit beside the thread at any
      font size above the stamp's 8 px floor, it sets in two lines,
      SPECIMEN / PRE-ISSUE, in the same box style. The box hugs its content, the
      lines are centred, and the left padding carries the trailing
      letter-spacing, so left and right spacing are equal (within 0.02 px).
    - From 480 px up, the one-line stamp is the original text node, rendered
      pixel-identical to before.
20. **The Statement seal's Ƀ is centred in its ring.**
    - **Cause:** the Ƀ was already the extracted vector with a tight viewBox,
      but it sat inside the inline glyph wrapper used in running text: an
      inline-block span on the text baseline, 23 px tall (the label's line box:
      the 18 px glyph plus the font's descent). The ring centred that span, so
      the Ƀ rode 2.5 px above the ring's centre.
    - **Fix:** the seal now draws the Ƀ from the extracted vector (the path and
      tight viewBox of `public/brand/b-symbol.svg`) as its own block, so the
      ring centres its bounding box, as the master logo centres it. The Ƀ is
      18 px tall in a 40 px ring, as before; it is centred within 0.01 px at
      375, 768, 1440 and 1920.
21. **The guilloche field shows the logo's own guilloche.** The lines are the
    master's 162 frame guilloche paths (`<g id="frame">` → `<g stroke="#5E634A"
    stroke-width="1.1">`; no rim, ring or field circles). They replace the
    generated rings in the unchanged mechanism: the same component, the static
    SVG (no JS, reduced motion, touch) and the canvas (fine pointers). Every
    other value was kept:

    | Parameter | Current value | Now |
    |---|---|---|
    | Component, renderers | `GuillocheField.astro`: static SVG by `<use>`; canvas on fine pointers without reduced motion, hiding the SVG once drawn | kept |
    | Stroke | `#5E634A`, 0.75 CSS px, non-scaling | kept (canvas: `lineWidth` 0.75 CSS px) |
    | Box and position | ±4.93R, centred on the anchor (coin; final field wrap) | kept |
    | Coverage | lines from 1.07R to 4.4R | kept: the logo's disc scaled so its edge is at 4.4R, clipped clear inside 1.07R |
    | Fade / mask | none (the outer edge lies beyond the visible area) | kept: none; the disc edge falls where the outermost ring was |
    | z-order | field 0 (thread 1, coin 2, copy 3) | kept |
    | Reveal | none on the field (the strike reveals the coin's own layer) | kept |
    | Breakpoints, touch, reduced motion | static SVG on touch and under reduced motion; canvas on fine pointers | kept |
    | Motion | canvas phase drift (90 s) and pointer bend, computed from the ring equations | static: these recompute the generated equations and cannot apply to fixed paths; no new effect |
    | Final section | every 2nd ring of its own seed | all 162 paths (a subset would alter the logo's pattern); opacity calibrated |
    | Opacity | per ring 0.35–0.60 (mean 0.475) | one value per breakpoint and renderer (below) |
    | OG image, Custodian Kit | same field, path stroke-opacity 0.75× / 0.9× the ring's | same placement and stroke; opacity calibrated per file |

    - **Opacity, the only adjustment.** It was calibrated by measuring the mean
      linear luminance of the guilloche area (coin, thread, stamp, nav and the
      text block excluded) against captures of the generated field taken
      before the swap (`tests/fixtures/guilloche-reference/`). Values:

      | Where | Opacity | Mean luminance vs reference |
      |---|---|---|
      | Final section, static SVG, below 1024 px | 0.71 | +1.2% at 390×844 (+0.3% at 768) |
      | Final section, static SVG, 1024 px and up | 0.67 | +0.3% at 1440×900, +0.4% at 1920 |
      | Final section, canvas | 0.66 | +0.1% at 1440×900, +0.3% at 1920 |
      | OG image | 0.946 | line light within 0.4% |
      | X header | 0.954 | within 0.4% |
      | Phone wallpaper | 0.954 | within 0.9% |
      | Desktop wallpaper | 0.994 | within 0.7% |
      | **Hero, all breakpoints** | **1.0 (maximum)** | **−13.2% at 390×844, −8.7% at 1440×900 (static), −8.3% (canvas)** |

    - **Deviation: the hero is darker than the reference.** At the logo's line
      density (the disc scaled to 4.4R spaces its lines 15–25 px apart at
      1440, where the 96 rings were about 9 px apart), even full opacity gives
      only 65–68% of the old field's line light. That is −8% to −13% in mean
      luminance, outside ±5%, and opacity cannot go higher.
      - What would close the gap (measured, not applied): a 1 px stroke instead
        of 0.75 px. With it, opacity 1.0 at 390 (+1.3%), about 0.85 at
        1440 static (−0.7%) and about 0.95 for the canvas would land within
        ±5%.
      - The rasters (OG, kit) already draw at ≥ 1 px, so opacity alone matched
        them.
    - **Deviation: path data encoding, not geometry.** The master writes each
      point absolutely in hundredths
      (`M 901.57,639.56 L 900.38,638.50 …`: 519 KB, 198 KB gz). The field
      file writes the same points as exact hundredth steps
      (`M901.57 639.56l-1.19-1.06…`: 298 KB, 44 KB gz). Every one of the
      32,484 points decodes identically (tested). Shipped verbatim, the strings
      would have taken hero assets past the 220 KB budget.
    - **Performance.** The field's path data (44 KB gz) loads after the page
      has loaded: `scripts/field.ts` sets the `<use>` href on `load`, and the
      canvas fetches the same cached file. Without JS, a `<noscript>` copy
      references it at once.
      - Loaded with the page, it cost about 150 ms of Lighthouse LCP (bandwidth
        shared with the bison). Deferred, LCP is unchanged (1.58–1.60 s).
      - The visible consequence: on a slow connection the field appears once
        the page has loaded, during the strike, rather than with first paint.
      - The canvas draws once per layout: 31 ms at DPR 2 in this container's
        software renderer, against 0.6 ms on every frame before. No layout
        shift.
    - The generator (`src/lib/guilloche.mjs`, `.d.mts`) and its output
      (`src/assets/generated/guilloche-{hero,final}.svg`) are deleted. JS:
      4.43 KB → 3.73 KB gz (main 2.63 → 2.70 KB, adding `field.ts`; lazy canvas
      1.80 → 1.03 KB).

22. **Refinement Batch 2 (revised): the narrative is a transition.** Paper →
    nickel → gold → blockchain, each issue described by its material. All copy
    lives in `src/content/copy.ts`, and every string was replaced exactly as
    given. The site never says the bison was on American money "three times":
    the 1901 note, the 1913 nickel and the 2006 gold coin are presented as
    landmarks, and a lint test (`copy.spec.ts`, `output.spec.ts`) rejects the
    phrase in visible text, accessible names and the meta tags.
    - **Borderless theme:** it keeps one place, IV · The Release, which is
      unchanged apart from a wit line after its body. A lint test checks that
      "jurisdiction", "borders", "borderless" and "no nation" appear nowhere
      else in visible text or accessible names; the disclaimer, microtext and
      aria-hidden decoration are exempt.
    - **Hero:** the H1 is "Paper. Nickel. Gold. Blockchain.", the first three
      words in `--cream-2` and "Blockchain." in `--cream`, at the same display
      size. The sub follows. The body paragraph and the serial note are gone.
      The serial module keeps its label, value, Copy and overprint. The buttons
      and the stamp are unchanged.
      - **One screen (≥ 1024 px):** the hero is pulled up under the sticky nav
        (`--nav-h`, 65 px) and spans `max(720px, 100svh)`. Its content area is
        everything below the nav, and the text block and the coin are each
        centred in it.
      - The text block's vertical padding scales with the viewport height:
        48 px at 900 px tall, none at 768. On viewports up to 820 px tall, the
        gaps below the sub and the buttons tighten. This keeps the copy inside
        the hero at 1366×768.
      - `hero-center.spec.ts` asserts this at 1366×768, 1440×900 and
        1920×1080, with and without a scrollbar gutter: the hero height is
        within 0.5 px of the viewport height (or 720), and the coin and text
        centres are within 4 px of the content area's centre. Measured, all
        three are exact to the pixel.
      - Below 1024 px nothing changed except the removed text.
      - *Trade-off:* the nav is translucent (`--nav-bg`, 88 % opacity), so at
        scroll 0 the top of the hero's dark ground shows faintly through it.
    - **Mint address:** the serial is named as what it is. The serial module's
      label is `SERIAL · MINT ADDRESS` everywhere. The ledger row is "Serial
      (mint address)". The copy buttons are named "Copy mint address", and the
      counterfeit notice and Card IV caption speak of the mint address. The
      copy-confirmation status ("Serial copied.") is unchanged, because the
      batch does not list it.
    - **Wit lines:** Caslon Text italic at the body size (18 px, never
      smaller), in `--bronze-text` on dark sections and `--bronze-ink` on
      paper, 14 px clear above. They appear on:
      - Card I ("The first financial migration.") and Card IV ("No vault
        required.");
      - Release, after the body;
      - Specification, after the rule cards;
      - Acquisition, after the pre-issue/live note;
      - Custodians, after the Code;
      - the footer, before "You are responsible for the laws that apply where
        you live."
    - **Standalone lines** (`Interlude.astro`):
      - Line A ("Some memecoins begin with invented lore. BUFFALO arrived with
        archives.") sits between I and II.
      - Line B ("Not a dog. Not a frog.") sits between III and IV, with "Not a
        dog." in `--cream-2` and "Not a frog." in `--cream`. Each part is
        unbreakable, so a narrow screen breaks the line only between them.
      - Each line is a full-width band on vault between two engraved section
        rules, padded `clamp(72px, 9vw, 144px)`.
      - The type is Caslon Display at `--t-h2`, centred, at most 22ch, inked in
        like the Statement's lines (static under reduced motion).
    - **The Mark:** annotations 5 and 6 carry the new copy. A mono label,
      `DECODE THE GROUND LINE`, sits above the decoder line inside its button,
      so the whole block is the target and hover, focus or tap still decodes.
      The label is part of the button's accessible name, which keeps the
      visible label in the name (WCAG 2.5.3).
    - **Card IV:** it has the same engraved double frame, registration marks
      and microtext border as Cards I–III, and its coin sits on the same dark
      plate as the nickel and the gold. The edge-to-edge bleed, the wider
      fourth column and the frame-dissolve animation are removed.
    - **Meta and OG:**
      - The title is "BUFFALO ($BUFFALO) · Paper. Nickel. Gold. Blockchain.".
        The description is the new one. og:title and twitter:title equal the
        title, and og:description and twitter:description equal the
        description.
      - The OG image's headline is "Paper. Nickel. Gold. Blockchain." in the
        hero's two tones, at 74 px. That is the largest size that keeps
        "Paper. Nickel. Gold." inside the text panel, clear of the emblem.
      - Both state variants are regenerated.
    - **Name lint:** the lint that keeps "Buffalo Coin/Token" from being used
      as a name now also exempts the ticker. The live counterfeit notice reads
      "the official $BUFFALO token", as given.
    - **Unchanged:** the footer's bottom line, which the batch does not list.
      Batch 3 replaced it (decision 24).

23. **The Character watermark is whole and centred.** The bison layer behind
    III · Character used to be anchored to the section's bottom-right corner
    (`right: 3vw; bottom: -14%`) at `min(1240px, 112vw)` wide, and the
    section's `overflow: hidden` cut off whatever fell outside.
    - On phones the tall, stacked section put most of the bison below its
      bottom edge, and part of it past the left edge. At 384×832 only 33% of
      it was inside.
    - At 1920×1080 it sat 282 px right of centre, was upscaled past its
      native 1023 px, and lost 17% at the bottom.

    Now its box is the section's middle 90% × 80%, set up as a size
    container. The image is the largest that fits that box, capped at its
    native 1023 px and never upscaled. It is centred on both axes, and no
    offset, transform, mask or clipping remains. The opacity (7%) and the
    z-order are unchanged.

    `character-mark.spec.ts` checks seven sizes, from 360×800 to 1920×1080.
    At each one the image must be fully inside the section, centred within
    8 px, at most 1023 px wide and undistorted. Screenshots are in
    `docs/fix-character/`.

24. **Refinement Batch 3: final fixes and launch hardening.** Each part is its
    own commit, and `npm test` passes after each one.
    - **Part 1, footer:** the bottom line is now "Paper. Nickel. Gold.
      Blockchain.". The copy lint checks that "Now, everywhere" appears on no
      page (`/`, `/disclaimer`, `/404`, both states).
    - **Part 2, The Release and Character:**
      - The Release's H2 is "From American money to Solana." and its body is
        the new text.
      - The ledger ("No treasury. / No border. / No jurisdiction.") is
        removed, along with its markup, its styles (`.release__ledger`,
        `.release__hair` and the `.hair` line rule) and its ink and hairline
        reveals.
      - The label, the migration wit, the map and its caption stay.
      - Without the ledger the wit is the copy's last line. The gap from it to
        the map is still 64 px, the gap the ledger used to leave. The section's
        top and bottom padding stay equal: 96/96 px at 384 wide, 192/192 px at
        1920.
      - Character's intro and the Resilience text carry the new copy.
      - The copy test checks the new Release copy in both states, and that
        the ledger is gone.
    - **Part 3, launch validation** (`src/lib/validate-issue.mjs`):
      - **The mint is a real Solana public key.** The character and length
        check comes first. Then a small local base58 decoder must produce
        exactly 32 bytes.
        - The old live test fixture, `TestFixtureMint7pQ…Npump` (44
          characters), failed this check: a 44-character key starting with
          "T" decodes to 33 bytes.
        - The fixture is now `TestFixtureMintpQ2rS9vWxYz3aBcDeFgHjKmNpump`
          (43 characters, 32 bytes). Its short form is still `TestFi…mNpump`.
      - **Explorer and buy overrides must be a defined route**
        (`EXPLORER_ROUTES`, `BUY_ROUTES`). The host must match exactly, with no
        port. The mint must be the exact path segment, or Raydium's single
        `outputMint`.
        - No other query or fragment is allowed, except birdeye's
          `?chain=solana` and the other Raydium parameters.
        - So `?cluster=devnet` fails, and so do referral parameters. The mint
          in a query, a fragment or a longer segment fails, and so do pair and
          pool pages.
        - The error names every accepted route and says how to extend the list.
      - **Channels in the live state:** an unset channel has no button. With
        neither set, Custodians shows "No official chat channel has been
        published." The pre-issue state is unchanged.
      - **Strict `issueDate`:** `YYYY-MM-DD` and a real calendar date, so
        `2026-02-30` fails.
      - **One config source:** `src/lib/load-issue.mjs` resolves the config
        file and runs it through `deriveIssue()`. The fixture rules (fixtures
        only from `tests/fixtures/issue/`, never on Vercel) are the same
        everywhere. It is used by:
        - `astro.config.mjs`, for the site URL, which was previously read with
          a regex over the TypeScript source;
        - the OG build;
        - `verify-mint`.

        A fixture with another `siteUrl` builds with that URL in the
        canonical, the OG tags and the sitemap.
      - **Stable ids:** `Action.astro` no longer counts instances in a
        process-global map, so ids no longer depend on render order. A disabled
        action with helper text takes its id from the caller (`hero-acquire`,
        `spec-verify`, …), and the build throws if one is missing.
      - **`npm run verify-mint`** (`scripts/verify-mint.mjs`): the checks live
        in `scripts/lib/mint-check.mjs`, tested against recorded responses.
        - `--mint <address>` checks another mint as a smoke test, without
          comparing the config's facts.
        - The script runs with Node's `--use-env-proxy`, so it also works
          behind an HTTPS proxy.
    - **Part 4, copy fallback:** when the clipboard is denied or missing, the
      Copy buttons in the hero and the final section used to do nothing. Their
      address sits outside the button's parent. The Specification did select
      its address, but showed nothing.
      - All three blocks now carry `data-serial-scope`. The button finds its
        address with `closest('[data-serial-scope]')` and selects it.
      - The button reads "Selected — copy manually". It may wrap to two lines
        within its 44 px, so the block's height does not change.
      - The live region announces "Clipboard unavailable. The mint address is
        selected; copy it manually."
      - After 3 s the button is restored and the selection stays.
      - Tests cover all three places with the clipboard denied (`writeText`
        rejects) and unavailable (no Clipboard API), and the granted path
        ("Copied") in each.
    - **Part 5, hero actions and the mobile first screen:**
      - **Pre-issue:** the disabled "Issue pending" button and its helper are
        gone. The one action is "Read the provenance" (primary, `#provenance`).
        The mobile menu has no CTA. The serial module's Copy stays disabled
        until issue, as it was: the serial module is unchanged.
      - **Live:** the primary is "Buy on pump.fun" → `buyUrl`. On another buy
        route (Jupiter, Raydium) it reads "Buy $BUFFALO". The secondary is
        "Verify mint address" → `explorerUrl`. The menu CTA repeats the
        primary.
      - **First screen (< 1024 px):**
        - Spacing first. Below the coin, 141 px became 72 px: the stamp now sits
          12 px under the coin, the lower thread window 6 px under it, and the
          copy follows.
        - Then the coin: 78vw → 74vw.
        - On phones up to 760 px tall, the coin goes to 64vw, its floor. The
          space above it shrinks from 64 px to 24 px, and the upper thread
          window is left out, because it needs 62 px there. The thread and the
          lower window stay.
        - Desktop is unchanged.

        Positions (top–bottom, px):

        | | before | after |
        |---|---|---|
        | 384×832 H1 | 603.5–754.0 | 519.2–669.7 |
        | 384×832 sub | 770.0–822.0 | 685.7–737.7 |
        | 384×832 primary | 854.0–906.0 | 769.7–821.7 |
        | 384×832 coin width | 299.5 | 284.2 |
        | 375×667 H1 | 584.1–733.3 | 435.0–584.2 |
        | 375×667 sub | 749.3–801.3 | 600.2–652.2 |
        | 375×667 coin width | 280.1 | 240.0 (64vw) |

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

`npm test` → **203/203 Playwright checks passed; Lighthouse CI assertions passed.**

| Check | Result |
|---|---|
| Logo diff: hero (strike finished / reduced motion), Card IV, the Mark, rendered in place at 1000 px vs resvg master | 0.396% / 0.384% / 0.384% / 0.384% differing pixels (limit 0.5%) |
| Layer geometry in place, every coin, at 375 / 768 / 1440 | every layer within 0.75 px of the master's transforms |
| Kit emblem PNG 512 / 1024 / 2048 vs master | 0.416% / 0.000% / 0.000% |
| OG emblem region, both states · X header · wallpapers | 0.000% · under 0.5% each |
| Edge-to-edge (alpha bbox = canvas ± 1 px) | all 7 emblem PNGs pass |
| `frame.svg` (SVGO, precision 0.1) vs master `#frame` | under 0.1% |
| axe-core (WCAG 2.2 AA + best practice): `/`, `/disclaimer`, `/404` × 375/1440 × both states × motion on/off | 0 violations (24 runs) |
| Copy lint | 178 copy strings (§5 as revised in Refinement Batch 2) present verbatim per state; banned list clean; no other-state copy shipped; no borderless wording outside IV · The Release and the disclaimer |
| Visual QA at 320 · 375 · 414 · 768 · 1024 · 1280 · 1440 · 1920 | no horizontal overflow; no overlapping hero text; no text on the coin; H1 in the first viewport; screenshots in `tests/screenshots/` |
| Config guards | live without contract fails; bad explorer fails; fixture on Vercel fails; derived URLs exact |
| Hero coin centring at 375 · 768 · 1024 · 1280 · 1440 · 1920, gutter reserved and not | coin centre = column centre (±1 px); two columns: column = text block edge → hero edge, coin clear of the text block; thread, field, vignette centred on the coin; stamp placement kept |
| SPECIMEN stamp at 320 · 360 · 375 · 390 · 414 · 430 | text inside its box; left/right spacing equal (≤ 0.02 px); two lines, clear of the thread; one line, unchanged, at 768 and 1440 |
| Statement seal at 375 · 768 · 1440 · 1920 | the Ƀ's bounding-box centre is the ring's centre within 0.01 px; the extracted vector, tight viewBox; 18 px Ƀ, 40 px ring |
| Guilloche field | 162 paths, every one of 32,484 points identical to the master; box ±4.93R, disc edge 4.4R, clear inside 1.07R; canvas static on fine pointers, none on touch or reduced motion; final section within ±5% of the reference luminance, hero at full opacity |
| Hero coin size and vertical position vs the first version; rule removed | identical (±0.5 px) at all six widths; no rule in the hero; emblem `#ground` present |
| Menu: 10 open/close toggles × top / middle / near the bottom × 1440×900, 390×844, 900×900 (classic scrollbars) | scrollY unchanged after every toggle (difference 0); layout shift 0; nav height constant; focus returned |
| Menu by keyboard (390, 900): focus the nav, Tab to the toggle, Enter, Tab and Shift+Tab inside, Esc | page never moves; focus trapped; background inert; focus back on the toggle |

**Lighthouse (mobile, median over 9 loads per URL):**

| URL | Perf | A11y | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` pre-issue | 100 | 100 | 100 | 100 | 1.60 s | 0 | 0 ms |
| `/` live fixture | 100 | 100 | 100 | 100 | 1.59 s | 0 | 0 ms |
| `/disclaimer` | 100 | 100 | 100 | 100 | 0.80 s | 0 | 0 ms |

With the logo guilloche field (decision 21), every load scored 100 in all four
categories, with LCP 1.58–1.60 s, CLS 0 and TBT 0–41 ms per load (24 loads of
`/` across two runs).

Measured alongside the first version, alternating, 18 loads of `/` each:

| Version | Performance | LCP | Outlier (both) | TBT per load |
|---|---|---|---|---|
| First version | 100 in every load | 1.58–1.61 s | 1.89 s in 3 of 18 | 0–57 ms |
| These fixes | 100 in every load | 1.58–1.59 s | 1.89 s in 3 of 18 | 0–64 ms |

The outlier is Lantern's simulation: the observed timings of those loads match
the others. In both versions the only long tasks are the initial document parse
and layout around first paint, counted or not depending on where FCP lands.
Note that the summary table printed by `tests/lighthouse.mjs` shows one load per
URL, chosen by performance score; with every load at 100 that can be an outlier.
The CI assertions use the median run.

INP cannot be measured in the lab. TBT is the lab proxy. The guilloche canvas
(fine pointers only) draws once per layout, with no animation loop.

**Bundle sizes:**

| Asset | Size | Budget |
|---|---|---|
| JS, all chunks | 3.7 KB gz (2.7 main + 1.0 lazy canvas) | 30 KB |
| CSS | 9.6 KB gz | 35 KB |
| Fonts | 91 KB woff2 (5 faces, subset) | 140 KB |
| Hero assets, mobile 1x | 131 KB (bison 480 AVIF 34 KB, ground WebP 31 KB, coin guilloche 22 KB, field guilloche 46 KB, loaded after `load`) | 220 KB |
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
| `src/assets/generated/guilloche-field.svg` | the master's 162 frame guilloche paths, every point exact (hundredth steps), stroke #5E634A 0.75 px non-scaling | 298 KB (44 KB gz) |
| `src/assets/generated/land.svg` | `world-atlas` land-110m, Equal Earth | 57 KB (17 KB br) |
| `public/kit/buffalo-emblem-{512,1024,2048}.png` | pack / pack / master render | 246 KB / 844 KB / 2.6 MB |
| `public/kit/buffalo-b-{cream,ink,bronze}.{svg,png}` | extracted Ƀ (PNG 854×1000) | 1 KB / 22 KB |
| `public/kit/buffalo-x-header-1500x500.png` | vault + the logo's guilloche field + whole emblem | 225 KB |
| `public/kit/buffalo-wallpaper-{phone-1290x2796,desktop-2560x1440}.png` | same | 690 / 687 KB |
| `public/favicon.{svg,ico}`, `favicon-{16,32}x….png` | Ƀ in cream on vault | 1–2 KB |
| `public/og/buffalo-fourth-issue[-specimen].png` | **generated at build**, by state | ≈ 288 KB, 1200×630 |
| `tests/fixtures/master-{1000,2000}.png` | resvg render of the untouched master | reference for every diff |

---

## Repository map

```
src/config/issue.ts          ← the only file edited at launch
src/lib/validate-issue.mjs   validation + derivation (shared by build, OG script and tests)
src/lib/issue-state.ts       build-time state; importing it validates the config
src/lib/map.mjs              borderless map (land geometry only)
src/content/copy.ts          final copy (§5, revised in Refinement Batch 2), paired by state
src/components/ · src/sections/ · src/layouts/ · src/pages/
src/scripts/                 vanilla TS islands: strike, nav, reveal, copy-serial, mark, field, guilloche-canvas
src/styles/                  @layer reset, tokens, base, components, sections, utilities, emblem
scripts/                     extract-layers, build-fonts, build-historical, reference-render,
                             build-generated, build-kit, build-og
tests/static/ · tests/browser/ · tests/lighthouse.mjs · lighthouserc.cjs
```

Facts and sources used in the copy are listed in §6 of the brief and on `/disclaimer`.
