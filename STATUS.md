# STATUS — Between Two Suns (Opus build)

_Updated: 2026-10-06_

## Current build state
Full OS 2.0 theme is built and deployed to an **unpublished** staging theme, with store content (metafields, metaobjects, pages, Arabic translations) wired up. QA on the local preview is green. Real-storefront visual verification is still outstanding: the build sandbox cannot reach `*.myshopify.com`.

| | |
|---|---|
| **Staging preview URL** | https://qfj1gi-c9.myshopify.com/?preview_theme_id=167112540418 (store password required; or Online Store → Themes → "BTS Opus — staging" → Preview) |
| Theme | `BTS Opus — staging` · `gid://shopify/OnlineStoreTheme/167112540418` · UNPUBLISHED |
| Live theme | Horizon (MAIN): **untouched** |
| Repo / branch | `between-two-suns/opus-com` · `opus-build` |
| Last commit | see `git log -1 origin/opus-build` (pushed; GitHub access restored) |

## Complete
- Research + strategy: `RESEARCH.md`, `UX_STRATEGY.md`
- Design system (`base.css`), exact brand vectors, subset fonts (EN ≈ 33 KB, AR +31 KB)
- **Signature 1:** "The Space Between" hero (split headline, bottles in the gap, scroll-parting suns; CSS scroll-timeline + JS fallback; reduced-motion safe)
- **Signature 2:** "Today's Skin Forecast" (AM/PM + conditions → ambient light, key steps, "why today" from pack copy, one-tap add of chosen steps)
- Home (layout pass 2: one-row concern chips, 3×2 ingredient grid, feature card when the journal has a single story): hero, forecast ticker, concern finder, routine grid + full-routine bundle, climate conditions, forecast, ingredient spotlight, facts, journal teaser
- PDP (metafield-driven, all 4 products): gallery with studio cutout slide, step tag, pack pill, benefit, price/ATC, facts, claims, texture, 6 collapsed sections (what / ingredients / how / who / INCI / caution + legal), sticky ATC, routine position + complete-the-routine, FAQ, Product + Breadcrumb JSON-LD
- Collection with concern filter; search + predictive search; cart drawer (routine progress + missing-step upsell) + cart page
- **Ingredient glossary:** key ingredients + **every ingredient A–Z (all 55 INCI names)** with function, plain-language role (EN/AR), products, search + per-product filter; every INCI name on PDPs links to its entry
- Story rows (About, Climate) use the real packshots where the story is about a product (editor setting "Visual")
- Pages: routines (forecast + AM/PM routines), ingredient glossary, climate, about, FAQ (FAQPage schema), contact, **/pages/scan** (QR landing, `?p=<handle>` deep link), shipping/returns placeholders, journal + article, 404, password, gift card, customer accounts
- EN + AR locales (natural MSA, gender-neutral), full RTL via logical properties, Arabic typography rules
- Store: 23 `bts.*` metafield defs + values, `bts_ingredient` metaobject (9 key), `bts_inci` metaobject (55, EN + AR), pages, blog, Arabic translations (unpublished language)
- QA tooling: preview harness, Theme Check, 84 flow tests, axe, Lighthouse scripts (see `QA.md`)

## Incomplete / outstanding
- Real-store visual QA of the staging theme (sandbox can't reach the storefront)
- Prices are 0.00 in Shopify (theme shows "Price coming soon")
- Final packshots matching v5 FINAL labels; no lifestyle/texture photography or video yet
- Native Arabic review; legal/EDA review of web claims (PROMAT)
- Navigation menus are the theme's built-in bilingual fallbacks (no Shopify menus created, intentionally)
- Journal has no published articles (a factual draft exists only in preview fixtures)
- Reviews app not installed (slot ready)

## Known issues
- Shopify's existing transparent renders have wide transparent padding, so bottles render slightly smaller in cards than in the local preview.
- iOS Safari not tested on device; hero falls back to JS on Safari < 26.
- `/pages/contact` existed before this build (template suffix `contact`): it now uses this theme's contact template.

## Current scores (honest, see rubric in brief)
| Area | Score | Why not higher |
|---|---|---|
| Brand fidelity | 8.7 | Copy + INCI now re-checked against the current label designs; packshot renders still show older labels ("Daily Face", "Niacinimide + Zinc PCA") |
| Visual originality | 8.3 | Light-field hero, label band and morph transitions are distinctive; mid-page sections still conventional |
| Art direction | 7.6 | Packshots + light field carry it; no photography, texture or film yet (the single biggest gap) |
| Typography | 8.5 | Strong EN/AR system; Antonio is a stand-in for the pack face |
| Layout / composition | 8.3 | Hero, forecast, label band strong; collection and content pages simpler |
| Motion / interaction | 8.5 | WebGL light field (drift, haze, grain, scroll parting, SKU tint), card→PDP morph, heading reveals; all reduced-motion safe |
| Mobile design | 8.6 | First-screen buy box, swipeable label, no overflow |
| Product discovery | 8.8 | Concerns, routine grid, forecast, full 55-ingredient dictionary linked from every PDP, search |
| PDP conversion | 8.3 | Printed label band added; still no real prices, reviews or texture media |
| Cart / conversion UX | 8.5 | Fast drawer, routine upsell, honest totals; checkout config pending |
| English experience | 8.6 | — |
| Arabic / RTL experience | 8.4 | Complete, mirrored, hero fits the fold, display leading tuned; needs native review + real-store check |
| Performance | 9.2 | Lab 99 mobile with the shader (skipped on software GL); unverified on Shopify |
| Accessibility | 9.2 | axe 0, Lighthouse 100, keyboard flows; no screen-reader device pass yet |
| Technical quality | 8.7 | Theme Check 0, 84 flow tests, MD5-verified deploys; harness ≠ real Shopify |
| Merchant maintainability | 8.5 | Metafields, blocks, bilingual fallbacks, editor labels |
| **Overall award potential** | **7.8** | Craft is close; art-direction assets (photo/film/texture, current-label packshots) are what separate this from SOTD |
| **Overall commercial effectiveness** | **7.6** | Blocked on real prices (sheet not readable yet), payments/shipping config, reviews |

## Pricing
Owner shared a Google Sheet with pricing. Not yet applied: the Google Drive connector in this session has no file-read permission and docs.google.com is blocked by the sandbox network policy. Fix: reconnect Google Drive with read access, add `docs.google.com` to allowed domains, or paste the prices.

## Next five actions
0. Apply real prices from the owner's sheet (blocked, see Pricing).
1. Verify the staging theme on the real store (owner opens preview; or allow `qfj1gi-c9.myshopify.com` in the environment network policy so I can screenshot it) and fix any Shopify-vs-harness differences.
2. Replace packshots with final v5-label renders; commission texture swatches and application/lifestyle imagery; add texture media to PDP gallery.
3. Set real prices; configure payments (Paymob/COD) and shipping (Bosta/ShipBlu); then turn on COD/shipping notes in theme settings.
4. Native Arabic + regulatory review of `content/products.json` `bts-draft` lines, forecast reasons and the 55 ingredient descriptions in `content/inci.json`; PROMAT submission if required.
5. Craft pass: hero scroll choreography, PDP gallery texture slide, story imagery, journal launch articles.

## Blockers (need the owner)
- **Storefront unreachable from sandbox** (network policy). Fix: add `qfj1gi-c9.myshopify.com` and `cdn.shopify.com` to the environment's allowed domains (cloud environment → Edit → Network access).
- **Figma MCP plan limit** (Starter). Upgrade or provide a Figma token for further exports (fonts/specs/packshots).
- **Business inputs:** prices, payment methods, shipping partners/rates, return policy, final packshots, social links.
- **Label art on PDPs** (new "Product label" section) shows the current label designs as supplied, including the serum pill typo "Niacinimide" and blank EDA lines. Replace the artwork or turn the section off before launch if the print files change.
- **Cleanser EDA number:** current label design leaves it blank; the site still shows COSMTOL26130966 from the v5 file. Confirm which is right.
- **Packaging/label conflicts to confirm before print:** serum pack front reads "Niacinimide" (typo); older render says "Niacinimide + Zinc PCA" / "Prevents breakouts" vs v5 "Niacinamide + Tranexamic Acid"; SPF named "Daily Face" (render) vs "Daily Defense … SPF 50+" (v5) vs "SPF 50" (Shopify); serum/SPF labels lack EDA numbers; serum skin type not stated; moisturizer AR text "للحماية البشرة" grammar.

## Deploy procedure (repeatable)
1. `cd theme && zip -qr ../bts-opus.zip assets config layout locales sections snippets templates`
2. Admin GraphQL `stagedUploadsCreate` (resource `FILE`, `application/zip`) → POST the zip to the returned target.
3. Either `themeCreate(source: resourceUrl, role: UNPUBLISHED)` for a fresh theme, or `themeFilesUpsert` on theme `167112540418` for updates. **Never publish without owner approval.**
4. Large files: `stagedUploadsCreate` (FILE, `text/css` etc.) → POST the file → `themeFilesUpsert` with body `{type: URL, value: resourceUrl}` (processed async; the mutation returns an empty list).
5. Verify: query `theme.files(filenames: …) { checksumMd5 }` and compare with local `md5sum`; it must match byte for byte.
