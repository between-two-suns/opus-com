# QA — Between Two Suns (Opus build)

_Last run: 2026-10-06, after home layout pass 2 (redeployed to staging, MD5-verified). Environment: local preview harness (`tools/preview`, brotli on), Chromium 1194 via Playwright._

> **Important limit:** the build sandbox cannot load `*.myshopify.com` (egress policy). All rendered-UI QA below ran on the local Shopify-compatible preview using the same theme files. Real-storefront verification on the staging theme is still outstanding (STATUS → blockers).

## How to re-run
```bash
cd tools && npm ci            # first time
./preview/start.sh             # http://localhost:4321  (EN) / /ar (AR)
node qa/theme-check.mjs        # Shopify Theme Check (same engine as `shopify theme check`)
node qa/flows.js               # 84 interaction tests (EN/AR × 390/1440)
node qa/a11y.js                # axe-core WCAG 2.2 AA + best-practice on 15 routes × 2 locales × 2 viewports
node qa/shots.js / /products/clarity-serum --vp=390,1440 --loc=en,ar [--full]   # screenshots + console + overflow
CHROME_PATH=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome|head -1) npx lighthouse http://localhost:4321/ --only-categories=performance,accessibility,best-practices,seo
```

## Results

| Check | Result |
|---|---|
| Shopify Theme Check | **0 offenses** (errors 0, warnings 0) |
| Interaction tests | **84 / 84 pass**: PDP add → drawer → qty → upsell → remove → Esc, focus management, sticky ATC, forecast AM/PM + conditions + total + add, full-routine bundle, predictive search, mobile menu, mega menu, concern filter, language round-trip |
| axe-core (WCAG 2.2 AA + best practice) | **0 violations** on 60 page scans (15 routes × EN/AR × 390/1440) |
| Console errors | 0 on all routes (only the intentional 404 test page logs its 404 status) |
| Horizontal overflow | 0 px on every route, EN + AR, 375/390/1440 |
| Missing translations | 0 (EN/AR key parity verified by script) |

### Lighthouse (mobile emulation, simulated slow 4G, brotli like Shopify CDN)

| Route | Perf | A11y | Best pr. | SEO | LCP | TBT | CLS | Weight |
|---|---|---|---|---|---|---|---|---|
| `/` | 98 | 100 | 100 | 100 | 2.0 s | 50 ms | 0 | 284 KB |
| `/ar` | 98 | 100 | 100 | 100 | 2.1 s | 0 ms | 0.004 | 284 KB |
| `/collections/all` | 98 | 100 | 100 | 100 | 2.3 s | 0 ms | 0 | 231 KB |
| `/products/clarity-serum` | 99 | 100 | 100 | 100 | 2.1 s | 0 ms | 0 | 253 KB |
| `/pages/routines` | 99 | 100 | 100 | 100 | 1.8 s | 0 ms | 0 | 143 KB |

Expect Shopify TTFB and `content_for_header` scripts (analytics, Shop Pay) to cost roughly 2–6 points on the real store.

## Bugs found and fixed during QA
| # | Bug | Fix |
|---|---|---|
| 1 | Hero overflowed the fold on desktop; CTAs hidden | Viewport-height-aware type and bottle sizing |
| 2 | Bottle step labels collided with headline | Removed; product name shown as hover/focus tooltip |
| 3 | Card/drawer cutouts rendered cropped (percentage heights in aspect-ratio boxes) | Absolute `inset` + `object-fit: contain` |
| 4 | `.reveal` hid content when the scroll timeline hadn't run | Reveal is now transform-only; content is never hidden |
| 5 | Forecast crashed: `this.title` collided with `HTMLElement.title` | Renamed to `routineTitle` |
| 6 | Forecast re-ordered steps visually (broke routine order + a11y sequence) | Key steps highlighted instead |
| 7 | Escape didn't close search when the field had text | Explicit Escape handler |
| 8 | Cart badge emptied after drawer re-render (count read after DOM move) | Read count before swap |
| 9 | Cart page could be overwritten by drawer re-render | Selector scoped to `#CartDrawer` |
| 10 | `aria-pressed` on links (concern filter) | `aria-current` |
| 11 | Heading-order skip on journal cards | `heading_tag` param |
| 12 | Mobile PDP: price/ATC below the fold | Square→6:5 gallery, dots overlaid, buy box before facts |
| 13 | Forecast time toggle overflowed at 390 px | Dial hidden ≤480 px |
| 14 | LTR fragments ("200 mL") mis-aligned in RTL grids | `.u-ltr { justify-self: start }` |
| 15 | Internal "CONFIRM" note in a customer-facing legal line | Moved to `legal_note` field |
| 16 | Desktop home: concern chips wrapped to a second row; ingredient grid left a 4+2 orphan row; a single journal story sat in a third-width tile | Narrow title column + right-aligned 48 px chips; 3-column ingredient grid ≥990 px; `journal__grid--n1` feature card (EN + AR verified) |
| 17 | Preview harness (not theme): brotli wrapper assigned `res._headers`, which Node maps to its internal header store, wiping the cart `Set-Cookie`, so every cart change hit an empty cart | Renamed to private fields; flows back to 84/84 |
| 18 | FAQ section on Climate/Contact pages had no layout (rules lived in `product.css`, which content pages don't load); heading collided with its subline | FAQ rules moved to `base.css` |
| 19 | Product cards: "Add to bag" buttons at uneven heights when titles/benefits wrapped (notably Arabic) | Card body is a flex column with price row pushed to the bottom; all product grids stretch cards (verified: equal button tops on home, climate, collection, EN/AR, 390/1440) |
| 20 | Glossary covered only 9 key ingredients; 46 INCI names had no explanation | Full A–Z dictionary (55), PDP INCI names deep-link to entries; verified: filter (Clarity Serum → 15), deep link lands below header/filter at 390 and 1440, EN + AR; mobile filter made non-sticky after it hid the target row |
| 21 | Arabic desktop hero: headline rendered at 168 px (generic `:lang(ar) .t-display-xl` outranked `.hero__line`), pushing the CTAs ~145 px below the fold at 1440×900; desktop product-stage height rule was dead (overridden by a later base rule) | Hero lines use the fold-aware `--hero-font` in AR; stage height folded into the base rule. Measured CTA bottoms EN/AR: 854/900 (1440×900), 784/800 (1280×800), 990/1080 (1920×1080), 684/844 (390×844) |
| 22 | Arabic page-hero headings (scan, collection, about): dots and descenders overlapped the subtitle | AR display leading 1.18 → 1.32, extra 0.14em under AR page-hero headings |
| 23 | Cleanser INCI on site said "Disodium Lauryl Sulfosuccinate"; current label says "Sodium Lauryl Sulfosuccinate" | Fixed in content, Shopify metafield, dictionary entry (handle + AR) |
| 24 | WebGL hero cost 820 ms TBT under software GL (Lighthouse 77) | Skip software renderers, idle start, 30 fps touch cap → TBT 0, perf 99 |
| 25 | Decorative footer line failed contrast audit | Rendered from a pseudo-element (aria-hidden, not text content) → Lighthouse a11y 100 |

## Not yet verified
- Real Shopify rendering of staging theme `167112540418` (sandbox can't reach the storefront).
- Arabic on the real store (language is unpublished; preview via Theme editor → language selector).
- iOS Safari (no WebKit binary in sandbox; Chromium mobile emulation only). Scroll-driven CSS falls back to `hero.js` on Safari < 26.
- Screen-reader pass with VoiceOver/TalkBack (axe + keyboard flows only so far).
- Shopify checkout (Shopify-hosted; depends on payment/shipping config).
