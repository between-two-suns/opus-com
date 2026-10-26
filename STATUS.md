# STATUS — Between Two Suns (Opus build)

_Updated: 2026-10-26_

## Current build state
Full OS 2.0 theme is built and deployed to an **unpublished** staging theme, with store content (metafields, metaobjects, pages, Arabic translations) wired up. QA on the local preview is green. Real-storefront visual verification is still outstanding: the build sandbox cannot reach `*.myshopify.com`.

| | |
|---|---|
| **Staging preview URL** | https://qfj1gi-c9.myshopify.com/?preview_theme_id=167112540418 (store password required; or Online Store → Themes → "BTS Store — Version 1.1 (fixes, in progress)" → Preview) |
| Theme | `BTS Store — Version 1.1 (fixes, in progress)` (was "BTS Opus — staging") · `gid://shopify/OnlineStoreTheme/167112540418` · UNPUBLISHED |
| Live theme | Horizon (MAIN): **untouched** (store-level: Arabic published 2026-10-18 with owner approval) · `templates/index.json` MD5 `c828067cbc7ea00ac09f4927419385ce` (2026-10-18) |
| Repo / branch | `between-two-suns/opus-com` · `opus-build` |
| Last commit | see `git log -1 origin/opus-build` (pushed; GitHub access restored) |

## Restore points (revert here if needed)
| Date | Shopify theme (unpublished, untouched copy) | Git commit on `opus-build` |
|---|---|---|
| 2026-10-26, **BTS Store — Version 1.0**: the site as audited, before the audit fixes | `BTS Store — Version 1.0` · `gid://shopify/OnlineStoreTheme/167875215618` (248 files, copied from staging) | `099ed58` |
| 2026-10-18, before shipping the orbs hero + routine module | `snapshot 2026-10-18 before orbs ship` · `gid://shopify/OnlineStoreTheme/167562281218` | `1d0f79a` |
| 2026-10-16, v3 rated 7 by owner, before loop 5 | `BTS Opus — snapshot 2026-10-16 (v3, rated 7, before loop 5)` · `gid://shopify/OnlineStoreTheme/167493992706` | `42678d6` |
| 2026-10-16, before the v3 redesign loop | `BTS Opus — snapshot 2026-10-16 (before redesign loop)` · `gid://shopify/OnlineStoreTheme/167484195074` | `8ed2427` |
| 2026-10-15, before photos | `BTS Opus — snapshot 2026-10-15 (before photos)` · `gid://shopify/OnlineStoreTheme/167479836930` | `ee84c34` (product media: `content/store-snapshots/2026-10-15-media-before-photos.json`) |
| 2026-10-12, after pass 2 / before pricing, WELCOME75 card and creators page | `BTS Opus — snapshot (pass 2, before pricing)` · `gid://shopify/OnlineStoreTheme/167347749122` | `e289f09` (store data: `content/store-snapshots/2026-10-12-products-before-pricing.json`) |
| 2026-10-12, after pass 1 / before pass 2 | `BTS Opus — snapshot 2026-10-12 (pass 1, before pass 2)` · `gid://shopify/OnlineStoreTheme/167328219394` | `eed0b31` |
| 2026-10-11, before the award redesign | `BTS Opus — snapshot 2026-10-11 (pre-redesign)` · `gid://shopify/OnlineStoreTheme/167303545090` (MD5-identical to staging at that point) | `5e78baf` |

To revert the site: in Shopify, preview or rename that snapshot theme (or copy its files back to staging); in code, `git checkout 5e78baf -- theme/`. Never published.

## Version 1.1 (in progress on staging, from 2026-10-26)
- Audit: `BETWEEN TWO SUNS · 10/10 audit` (Claude doc) — scorecard, what repeats, the big moves, conversion, page by page, order of work.
- Round 1 fixes shipped to staging (DECISIONS 209): real set names in build-your-own, no empty reviews line, page headings (skin check, Routines), Creators email-only, Journal link hidden until a story, no Arabic font on English pages.
- Round 2 speed shipped to staging (DECISIONS 210): Home 5.0 → 3.0 s, Ingredients 5.3 → 2.5 s, Sets 3.7 → 2.6 s, Climate 4.3 → 3.5 s, The Full Ritual 2.8 → 1.9 s (strict slow-4G phone test). Still over 2.5 s: Home, Arabic home, Climate, Routines. Options: one sphere on the home hero on phones, a lighter first climate photo, the single-sun Routines hero.
- Day/night decision (doc "BTS · Day and night: what replaces it"); owner's rule: at most one interaction per page. Round 3 shipped to staging (DECISIONS 211): routine finder demo `/pages/routines?view=finder`, press to pour demo `/products/<single>?view=pour`, Home sets as one recommendation, set pages without the Morning/Night switch. Owner (DECISIONS 212): press to pour, one-set Home and the switch-less set page reverted to Version 1.0; finder demo fixed for phones (intro gap to the FAQ tightened, DECISIONS 213; no packs once started on phones, DECISIONS 214; rebuilt as a 3-question, no-dead-end quiz, DECISIONS 215; label-based rules, type first, full-screen app mode, DECISIONS 216; design round + "choose any" Q3 with a prescription-skincare note, DECISIONS 219, 221; **the finder is now the real Routines page, DECISIONS 222**; mini-packs demo at ?mini=1, off by default; ICI to see the rule changes and the prescription-skincare note; the separate Skin check is retired (menu item removed, every quiz link opens the finder, "Why this?" added to the result; DECISIONS 223). Owner's call: unpublish or redirect the old /pages/skin-check.
- Creators (DECISIONS 224, 225): page rebuilt (site title style, tighter spacing, one timeline, idea cards for reviews, routines, close-ups, reels and unboxing, stepped application, pinned Apply bar, new FAQ) and a private creator kit at /pages/creators?view=creator-kit. Offer: free products chosen by skin and channel, 10% follower code, 10% commission, more for creators who keep posting. Owner's call: parcel insert card design, Shopify Collabs, real unit costs.

## Shipped to staging 2026-10-18
- Home hero is now **Orbs** (`hero-orbs`), followed by Four steps. Earlier heroes are still available at `?view=hero|light|sun|system|orbsa`.
- `/pages/routines` opens with the **first sun / second sun** routine module (`hero-routine`); everything below it is unchanged.
- Publishing live is the owner's step in Shopify admin.

## Shipped to staging 2026-10-19
- **Bag redesign** (DECISIONS 160): the bag page has a routine board (missing steps, one-tap add), refined lines, a sticky summary with free delivery, "You save", a tucked-away note, Check out with the total, assurances, and a pinned checkout on phones. The drawer gets the same lines and button, plus "View full bag".
- **Checkout branding** (DECISIONS 161): the brand logo, ivory/white/ink colours and Figtree are **live on the checkout** (owner approved on 2026-10-19). The same settings are also on the draft profile "My Store configuration".
- **Sets** (DECISIONS 162): The Full Ritual is the BTS Pick and is offered on every product page. The Day Ritual is now **The Clear & Protect Trio** (`/products/the-clear-protect-trio`; the old URL redirects).
- **Home sets section** (DECISIONS 163–165): The Full Ritual (morning and night) beside The Night Ritual (evenings). The bag offers the honest switch to The Full Ritual when a three-step set is in it.

## Shipped to staging 2026-10-20
- Judge.me reviews: product and set pages (badge hidden at 0, widget empty state in brand), home carousel appears only once real reviews exist (DECISIONS 167). Owner: enable gifted-review disclosure and Arabic in Judge.me.
- Delivery fees, remote fees and estimates are theme settings feeding the FAQ; COD answer appears only when COD is switched on; ICI-pending FAQs are hidden until answered; unverified claim badges are held (DECISIONS 169). Owner: set Shopify shipping rates to match.
- Skin check live on staging at `/pages/skin-check`, in the menu and linked from sets and product pages (DECISIONS 172); ICI sign-off still needed before public launch; sensitive-skin and pregnancy FAQs answered; claims switch per product (DECISIONS 171). Morning-to-night concept dropped by owner (demo stays unlinked).
- Shipping and Returns pages hold the owner's policies in English and Arabic (DECISIONS 177–178). Night Ritual photo leads its product page; favicon PNGs added. Contact hours, legal name/address in footer, offer bar wording as approved, PayPal icon hidden. Shopify shipping rates (flat EGP 118, international EGP 980) still don't match the site: owner to change.
- **New product and set page design live on staging for all 11 products and sets** (DECISIONS 181–190). Payment badge design preview is ON for testing (owner, DECISIONS 188); **switch `preview_payments` off in templates/product.json before launch.** Speed (iPhone, slow 4G): product main photo 2.0 s, set first photo 2.7 s. Analytics events ready (bts_*), waiting for GA4/Meta. Leftover staging templates product.v2.json / product.set2.json can be deleted in admin.
- Language switch is a direct link to `/ar/…` (works on preview share links, DECISIONS 176). Repo and staging match file for file.
- Morning-to-night demo at `/?view=day` for owner review; home unchanged (DECISIONS 168). Vanity photos need label-correct versions before any live use.

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
- **Bundles & offers (2026-10-06):** five curated sets (Full Routine, Evening, Oil-Control Duo, Day Shield Duo, Everyday Starter) on home + new **/pages/sets** ("Sets" in header/footer); **Build-your-routine** builder (tap bottles onto a shelf between the suns; live total, next-saving nudge, one-tap add); cart drawer/page **mix & match tier steps** + **free-delivery progress**; optional **WhatsApp chat** button. All offers are theme settings (Theme settings → Offers) that are **0/blank = hidden** and must mirror a real Shopify discount/shipping rate
- **Redesign pass 1 (2026-10-11, after owner feedback "not award level, blacks too rough"):** soft night-ink (#20233A) replaces near-black everywhere; primary buttons carry two suns (warm/cool glow that swells on hover); pastel announcement bar; **pinned "one day, four steps" routine stage** on home (sun travels its arc, each bottle takes the centre in its colour, add from the stage, dots + keyboard jump); **climate lab** replaces the black climate block (8 conditions set the weather on a sticky stage: glare, smog, dust, droplets, heat haze, air-con airflow, split); **time-of-day page tones** (page colour drifts dawn → day → aqua → lilac → sand as you scroll); **dusk footer** with two setting suns; **sunlight cursor** + "View" label (desktop); **product-coloured PDPs** (page takes the product colour, step word + sun on the routine arc behind the pack, frosted buy box, tilt); set cards tinted with their steps' colours
- **Pass 2 (2026-10-12, owner feedback: "flawless, smoother, mobile-first app feel, sticky buy, recommendations, more of our icon, climate not overkill"):**
  - Routine stage rebuilt on the browser scroll timeline (no JS lag) with a rest on each product and a gentle settle when you stop between two; no blur; dock-aware on mobile
  - **App dock** on phones/tablets: Shop · Routine · brand mark (Home) · Search · Bag; on product pages it hands its place to a **buy bar in the product's deep colour** whenever the main Add button is out of view
  - **Add to bag:** the bottle flies into the bag, the brand mark's two arcs close around it, then the bag opens; on phones the bag is a **bottom sheet** with swipeable **"Complete your routine"** cards
  - **Product pages:** 01–04 routine tabs, the step word huge in product colour, tilted pack on a generated texture (foam / droplets / cream / sand; no product in it), **label callouts** drawn from the pack's own benefit words, **"Made for"** climate chips (forecast mapping)
  - **Home:** hero framed by the brand mark's arcs (parting on scroll); **compact climate switch** (5 icons → stage weather, lifts the steps that matter, "Add these N steps" at real summed prices) replaces the long climate lab (lab stays on /pages/climate); **facts band** with real numbers (04 · 55 · 50+ · mark)
  - **Warm ivory** base (#F5F1EA), deep product-colour buttons (same hue, fixed lightness for ≥ 4.5:1), brand mark in loading states and the announcement bar
- **Micro-interactions:** 3D tilt on product/set media (fine pointers), magnetic primary CTAs, "✓ Added" button state, cart badge bump; all off for reduced motion and touch
- **Pricing & offers (2026-10-12, owner's Pricing & Offers spec):** real prices + SKUs on the 4 singles; **7 Shopify-native bundles** (Full / Day / Night Ritual, Clear & Protect Duo, Core Duo, SPF and Serum Stock-Up) with compare-at = singles total; collections singles/duos/rituals/stock-up; **WELCOME75** discount. Theme: EGP format ("EGP 1,349" / "1,349 ج.م"), bundle cards everywhere (home, Sets, collections, routines, bundle product pages with a packs stage), Day Ritual offer on every single product page + Stock-Up on serum/SPF, pickers add the matching bundle, bag upgrade duo → Day Ritual when it unlocks free delivery, quantity limits 5/3, free-delivery line in the announcement bar, **WELCOME75 sign-up card** (shared code revealed after sign-up)
- **Creators page** `/pages/creators` ("Show us your weather"): phone-frame reels of the real bottles in sun / AC / dust / humidity, honest offer (routine; personal 10% code; commission or paid collabs agreed one-to-one; credited features with permission), how it works, content ideas, rules, application form, creator FAQ. EN + AR; footer link
- **Photos (2026-10-15):** owner's approved images on the site: product galleries (front, in use, texture, angle, back, in hand), card hover, climate switch scenes, routine portraits on product pages, About/Climate story photos, creators reels, bundle images (Full / Night / Core). See DECISIONS 82–86 for the asset triage (what's used, what to stop, what to fix)
- **Redesign v3 (2026-10-16, deployed to staging):** flat, colour-true system; mint footer; floating pill nav; colour-block hero with shoppable panels; pack-colour add-to-bag buttons and buy bar; add-to-bag moment; set pages that explain contents, order and saving; product-specific FAQ; shop = products then sets; sets page with photo-tile builder; climate page as "A day between two suns"; benefit-first ingredients. See DECISIONS 87–102
- **Loop 5 (2026-10-16):** owner review fixes (see DECISIONS 104–122): full-screen colour-band hero, set pictures without pack templates, ingredients benefit-first, FAQ hub + per-page FAQs, new contact, account and bag designs, mega menu fixed. Checked at 390 / 768 / 1024 / 1440 in EN and AR
- **Hero preview (2026-10-17, staging only at `/?view=hero`):** "Hand-off": the four steps in front of the headline; scrolling, the cleanser glides into the unchanged "Four steps" section as it rises. Live home hero unchanged until the owner approves. See DECISIONS 133
- **)( system preview (2026-10-17, staging only at `/?view=system`):** the hand-off hero, "Four steps", then "A day between two suns": photos framed by the mark, the mark as the transition between chapters and as the progress marker. See DECISIONS 134
- **Two suns hero preview (2026-10-17, staging only at `/?view=light`):** the hand-off lit by two suns, with two coloured shadows per pack that follow the pointer, a sunrise entrance, then the same hand-off. See DECISIONS 135
- **Hero options (2026-10-18, staging only):** `/?view=orbs` (hand-off framed by two tactile spheres that slide out on scroll) and `/?view=sun` (the real-sun line-up photo with current labels put back in; headline in the sky behind the packs). See DECISIONS 136–138
- **Orbs chosen and polished (2026-10-18, staging only at `/?view=orbs`; first version at `/?view=orbsa`):** header-height fix, smoother load, rolling spheres with fixed light, dew glint, bounce light on the packs, pointer depth, ordered landing; short-phone spacing fix in Four steps. See DECISIONS 139–140
- **Orbs smoothness pass (2026-10-18):** lean hand-off engine (measure on layout change, transforms only per frame), overlapping hand-over, less idle motion, no blend modes. See DECISIONS 141
- **Real-store check (2026-10-16):** 22 routes × 390/1440 and 16 routes × 390/768/1024/1440 on the staging theme: no Liquid errors, missing translations, overflow or JS errors (after the fixes in DECISIONS 123–125)
- QA tooling: preview harness, Theme Check, 272 flow tests, axe, Lighthouse scripts (see `QA.md`)

## Shipped to staging 2026-10-25
- **About page** (DECISIONS 193–203), now the staging About template at `/pages/about` (was a demo at `?view=about2`): the name as time (today's sun to tomorrow's), the routine on one counter (morning/night), made in Egypt, a founder note slot (hidden until written), "What we won't do" (lilac), "Until the next sun". Round 2 (DECISIONS 194): the home page's sage and periwinkle spheres as the two suns, an arc with one counting clock instead of the hour ruler, brand-colour sky. Round 3 (DECISIONS 195): title rise, dawn glow, rolling clock, shorter scroll, packs on the routine cards, Climate link, About meta description + share card, iPhone LCP 1.6 s EN / 2.4 s AR, CLS 0. Owner approved and asked to deploy (DECISIONS 203); parked for later: founder note, ICI photos. Owner inputs that would lift it further: founder story, founder/team photo, real ICI photos, what the `)(` mark means, launch year.

## Incomplete / outstanding
- Owner setup for the pricing spec (see checklist below): taxes, shipping rates, payments, COD limit, inventory counts
- Photo fixes from the triage (A04/C03/C08 minarets, P05 ingredient name, P08 SPF 50 vs 50+); optional Day Ritual and Clear & Protect scene images; no video yet
- Native Arabic review; legal/EDA review of web claims (PROMAT)
- Navigation menus are the theme's built-in bilingual fallbacks (no Shopify menus created, intentionally)
- Journal has no published articles (a factual draft exists only in preview fixtures)
- Reviews app not installed (slot ready)

## Known issues
- Shopify's existing transparent renders have wide transparent padding, so bottles render slightly smaller in cards than in the local preview.
- iOS Safari not tested on device; hero falls back to JS on Safari < 26.
- `/account/login` is Shopify-hosted (new customer accounts); the branded login card only shows with classic accounts.
- `/pages/contact` existed before this build (template suffix `contact`): it now uses this theme's contact template.

## Current scores (honest, see rubric in brief)
| Area | Score | Why not higher |
|---|---|---|
| Brand fidelity | 8.7 | Copy + INCI now re-checked against the current label designs; packshot renders still show older labels ("Daily Face", "Niacinimide + Zinc PCA") |
| Visual originality | 9.1 | Brand-mark arcs, product-coloured stages, callouts, climate switch, dock mark — ownable system; content pages still plainer |
| Art direction | 8.0 | Coherent sun/day language end to end; still no photography, texture or film (the biggest remaining gap) |
| Typography | 8.5 | Strong EN/AR system; Antonio is a stand-in for the pack face |
| Layout / composition | 8.3 | Hero, forecast, label band strong; collection and content pages simpler |
| Motion / interaction | 9.1 | Light field, pinned day stage, climate lab weather, tones, cursor light, morphs, builder; all reduced-motion safe, Lighthouse 99 |
| Mobile design | 9.1 | App dock, buy bar hand-over, bottom-sheet bag, swipe routine cards; real-device check outstanding |
| Product discovery | 8.8 | Concerns, routine grid, forecast, full 55-ingredient dictionary linked from every PDP, search |
| PDP conversion | 9.2 | Real prices, Day Ritual + Stock-Up offers on every PDP, buy always one tap away; no reviews or texture photography yet |
| Cart / conversion UX | 9.3 | Bundles everywhere, pickers add the matching bundle, duo → ritual upgrade, free-delivery line, WELCOME75 card; checkout depends on owner setup |
| English experience | 8.6 | — |
| Arabic / RTL experience | 8.4 | Complete, mirrored, hero fits the fold, display leading tuned; needs native review + real-store check |
| Performance | 9.2 | Lab 99 mobile with the shader (skipped on software GL); unverified on Shopify |
| Accessibility | 9.2 | axe 0, Lighthouse 100, keyboard flows; no screen-reader device pass yet |
| Technical quality | 8.8 | Theme Check 0, 238 flow tests, checksum-verified deploys; harness ≠ real Shopify |
| Merchant maintainability | 8.5 | Metafields, blocks, bilingual fallbacks, editor labels |
| **Overall award potential** | **8.8** | Interaction + system award-grade; real photography/film and current-label packshots are the remaining gap; collection/content pages next |
| **Overall commercial effectiveness** | **9.0** | Real prices + bundles + welcome offer + creator funnel live on staging; payments/shipping/inventory setup and reviews still needed |

## Pricing (applied 2026-10-12)
Applied from the owner's Pricing & Offers PDF (sizes: SPF and moisturizer in gm; competitor per-ml comparisons skipped, per owner). See DECISIONS 67–81 for every store change and how to undo it.

## Owner checklist (manual, "we can get to the manual stuff later")
| Area | What to set | Why it matters on the site |
|---|---|---|
| Taxes | Prices include 14% VAT (Settings → Taxes: "Include tax in prices") | Prices shown are tax-inclusive |
| Shipping | Standard EGP 100 below EGP 1,200, free from EGP 1,200 (and any express rate) | "Ships free", the announcement line and the bag upgrade use the theme settings `free_shipping_threshold` 1,200 / `delivery_fee` 100: change both together |
| Payments | Paymob (cards/wallets) + Cash on Delivery | Only configured methods appear (theme never fakes icons) |
| COD limit + "Pay online for priority dispatch" | Needs a checkout rule (Shopify Plus / Functions app) | Not shown on site until it exists |
| Inventory | Enter counts, then turn on "Track quantity" for the 4 singles (bundles follow) | Sold-out states and bundle availability |
| Barcodes / weights | Per product | Shipping rates and labels |
| Creator codes | One `[NAME]10` discount per accepted creator (10%, excludes Stock-Up if wanted) | The creators page promises a personal code |
| Welcome email | Shopify Email/Flow welcome message repeating WELCOME75 | Code is shown on site; email is a backup |
| Abandoned checkout | Settings → Notifications | Recovery |
| Contact email | Settings → Notifications → staff "Contact customer" goes to the right inbox | Creator applications arrive there |

## Next five actions
0. Owner checklist above (taxes, shipping, payments, inventory), then a real test order with WELCOME75 and a bundle.
1. Verify the staging theme on the real store (owner opens preview; or allow `qfj1gi-c9.myshopify.com` in the environment network policy so I can screenshot it) and fix any Shopify-vs-harness differences.
2. Replace packshots with final v5-label renders; commission texture swatches and application/lifestyle imagery; add texture media to PDP gallery.
3. Set real prices; configure payments (Paymob/COD) and shipping (Bosta/ShipBlu); then turn on COD/shipping notes in theme settings.
4. Native Arabic + regulatory review of `content/products.json` `bts-draft` lines, forecast reasons and the 55 ingredient descriptions in `content/inci.json`; PROMAT submission if required.
5. Craft pass: hero scroll choreography, PDP gallery texture slide, story imagery, journal launch articles.

## Blockers (need the owner)
- **Storefront unreachable from sandbox** (network policy). Fix: add `qfj1gi-c9.myshopify.com` and `cdn.shopify.com` to the environment's allowed domains (cloud environment → Edit → Network access).
- **Figma MCP plan limit** (Starter). Upgrade or provide a Figma token for further exports (fonts/specs/packshots).
- **Business inputs:** payment methods, shipping partners/rates, return policy, final packshots, social links, WhatsApp number, creator compensation once decided.
- **Label art on PDPs** (new "Product label" section) shows the current label designs as supplied, including the serum pill typo "Niacinimide" and blank EDA lines. Replace the artwork or turn the section off before launch if the print files change.
- **Cleanser EDA number:** current label design leaves it blank; the site still shows COSMTOL26130966 from the v5 file. Confirm which is right.
- **Packaging/label conflicts to confirm before print:** serum pack front reads "Niacinimide" (typo); older render says "Niacinimide + Zinc PCA" / "Prevents breakouts" vs v5 "Niacinamide + Tranexamic Acid"; SPF named "Daily Face" (render) vs "Daily Defense … SPF 50+" (v5) vs "SPF 50" (Shopify); serum/SPF labels lack EDA numbers; serum skin type not stated; moisturizer AR text "للحماية البشرة" grammar.

## Deploy procedure (repeatable)
1. `cd theme && zip -qr ../bts-opus.zip assets config layout locales sections snippets templates`
2. Admin GraphQL `stagedUploadsCreate` (resource `FILE`, `application/zip`) → POST the zip to the returned target.
3. Either `themeCreate(source: resourceUrl, role: UNPUBLISHED)` for a fresh theme, or `themeFilesUpsert` on theme `167112540418` for updates. **Never publish without owner approval.**
4. Large files: `stagedUploadsCreate` (FILE, `text/css` etc.) → POST the file → `themeFilesUpsert` with body `{type: URL, value: resourceUrl}` (processed async; the mutation returns an empty list).
5. Verify: query `theme.files(filenames: …) { checksumMd5 }` and compare with local `md5sum`; it must match byte for byte. JSON templates and `settings_data.json` get Shopify's header comment on save, so compare those by content.
6. Upsert sections/snippets **before** templates that reference new sections or block types and wait for that job to finish; a template sent in a parallel batch is rejected silently (empty result, no userError).
