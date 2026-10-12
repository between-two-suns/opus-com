# DECISIONS — Between Two Suns (Opus build)

Each entry: decision · why · reversibility. Newest last.

## Architecture
1. **Native Shopify OS 2.0 theme, no headless.** Merchant-editable, cheapest to run, fastest TTFB on Shopify's CDN. Fully reversible.
2. **Theme lives in `/theme`, tooling in `/tools`, content source in `/content`.** Keeps docs and QA out of the theme upload. When connecting Shopify's GitHub integration, point it at a branch containing only `/theme` contents (or use the zip deploy in STATUS).
3. **No JS framework.** Small custom elements: `theme.js` (core), `hero.js`, `forecast.js`, `product.js`. Every feature has a no-JS fallback (forms post to `/cart/add`; drawers are links).
4. **Native `<dialog>`** for menu, search and cart drawers: built-in focus trap, Esc and inert background.
5. **Section Rendering API** for the cart drawer (`sections: 'cart-drawer'`). Only `#CartDrawer [data-cart-root]` is swapped, so the dialog state survives.
6. **Product content in `bts.*` metafields + `bts_ingredient` metaobjects**, not hard-coded. One `product.json` template serves all four PDPs; colour/step derive from `bts.step` and fall back to the existing `01 Reset … 04 Defense` tags.
7. **Bilingual fallback pattern for editable copy.** Section text settings are blank by default. Blank renders built-in EN/AR locale copy, so Arabic works with zero merchant setup. Typed text overrides it and is translated through Translate & Adapt.
8. **Local preview harness (`tools/preview`).** The build sandbox cannot reach the storefront. A liquidjs renderer with Shopify tags/filters, section groups, Section Rendering, an AJAX cart and predictive search makes real visual QA possible. Fixtures come from `content/products.json`. **Prices in the harness are SAMPLE values (labelled on screen).**

## Brand & design
9. **Concept: "The space between".** Synthesised from the brand's own Figma "Ten Studio Pitch" boards (Pentagram / Koto / Ragged Edge / Mucho). Two signature interactions only:
   - (a) the split-headline hero with scroll-parting suns;
   - (b) Today's Skin Forecast.
10. **Logo/icon are the exact Figma vectors.** Figma MCP hit its plan limit after 2 calls, so the SVGs were retrieved from the store's own development theme assets and verified against Figma metadata (frame IDs 136:5 / 136:2, path count and bounding boxes, byte size ±1). The theme copies only change `fill` to `currentColor` and remove a no-op full-canvas `clipPath` (duplicate-ID fix). Path data is identical (script-verified). Originals are in `_source/brand/`.
11. **Display face: Antonio 700** (subset, 11 KB), plus a tiny Archivo arrows-only face (↑↓) on the same family via `unicode-range`. A specimen against the wordmark showed Archivo's narrowest width was too wide; League Gothic matched proportion but was too light; Antonio's weight and rounded terminals echo the pack without imitating the logo. **Body: Figtree.** **Arabic: Alexandria** (31 KB, variable). If the brand licenses its packaging fonts, swap the files in `assets/` and keep the family names.
12. **SKU colours from Figma packaging hex** (`#7DB993`, `#89C3C8`, `#D7A6DA`, `#FFA37B`) are theme settings. White-on-pastel (packaging style) fails WCAG for web text, so UI text on SKU colour is always ink; white type stays on product imagery only.
13. **Daylight white `#F6F7F4` + ink `#121318`.** No beige, no desert, no botanical motifs.
14. **Pills from the packaging** (outlined ingredient pill, solid skin-type pill) became the UI chip/badge language.

## Commerce / CRO
15. **PDP = vertically collapsed sections, never tabs** (Baymard: 27% vs 8% content overlooked). Descriptive section titles with hints.
16. **Mobile PDP order: title → benefit → price/ATC → facts.** Price and ATC sit above the fold at 375×844. A sticky add-to-bag bar appears after the buy box scrolls away and hides when the footer or a dialog is visible.
17. **Bundles = plain sum.** "Add the full routine" adds all four with an honest summed price. No invented discount; a bundle discount is a business decision (Shopify automatic discounts can be added later without theme changes).
18. **Forecast never fabricates weather data.** The visitor states their conditions. "Why today" lines are pack copy; three are bts-draft phrasings flagged for confirmation (see `content/products.json` notes). Key steps are highlighted, not re-ordered, because routine order must stay cleanse → SPF.
19. **0.00 price = "Price coming soon" + disabled ATC** (setting `zero_price_coming_soon`, default on). This prevents free checkouts on staging while prices are unset.
20. **Payment icons only from `shop.enabled_payment_types`.** COD copy is a merchant toggle (off) because manual payment methods can't be detected in Liquid.
21. **No reviews, ratings, endorsements, scarcity or countdowns.** The review slot (`@app` block, `reviews.rating` metafield in JSON-LD) only activates with real data.

## Content & compliance
22. **All product copy is verbatim from Figma v5 FINAL labels** (EN and AR). New web copy is marked `bts-draft` in `content/products.json`.
23. **Serum/SPF "EDA notification no." omitted on web** because the v5 labels don't print it. Cleanser (COSMTOL26130966) and moisturizer (COSMTOL26129668) show theirs.
24. **Arabic product names are transliterations + descriptor** (e.g. «غسول ديلي ريست»), pending native/brand review.
25. **Gender-neutral Arabic** (passive / imperative-neutral forms), MSA register.

## Shopify store changes (all additive, reversible)
26. Created unpublished theme **"BTS Opus — staging"** (`167112540418`) via staged-upload `themeCreate`. Live **Horizon**, **BTS-Development** and **Between Two Suns V12 Review** themes untouched.
27. Created the `bts_ingredient` metaobject definition and 9 entries, plus 23 `bts.*` product metafield definitions and values (EN), with Arabic translations registered.
28. **Activated the 4 products and published them to Online Store.** The storefront is password-protected, so nothing is public. Required so the staging preview can render products. Revert: set status to Draft.
29. Enabled **Arabic as an unpublished** store language; registered translations for product titles, metafields, metaobjects and pages.
30. Created pages `routines, ingredients, climate, about, faq, scan, shipping, returns` (with template suffixes) and blog `journal`. Shipping/returns bodies say "To be confirmed before launch" — no invented policy.
31. **Did not change** product titles, descriptions, prices, images, menus, payments, shipping, taxes, domains, or customers.
32. **Incremental staging deploys use `themeFilesUpsert` on `167112540418` only, verified by MD5** against the repo. Avoids creating extra themes; MAIN writes are impossible through this path.
33. **Complete INCI dictionary (all 55 ingredients), not just key ingredients.** Every INCI name across the four packs (from `content/products.json`, Figma v5 FINAL labels) is a `bts_inci` metaobject: INCI, common name, function group (EU CosIng categories, labels in theme locales), a functional description (what it does *in the formula*, never a skin-efficacy claim; bts-draft), products and a link to its key-ingredient entry. Source and generator: `content/inci.json` ← `tools/content/build-inci.py` (asserts the dictionary covers exactly the pack INCI lists). Reversible: delete the definition.
34. **Metaobject handle = INCI name `| handleize`.** The theme links every name in a PDP's INCI list straight to `/pages/ingredients#inci-<handle>` with no lookup, and the glossary's "as printed" lists link the same way. Adding a product only needs its new INCI names added to the dictionary.
35. **Store change:** created the `bts_inci` metaobject definition (storefront read, translatable), 55 entries, and Arabic translations (name + description) on the unpublished Arabic locale.
36. **Story rows show real packshots by default where the story is about a product** (routine → all four, transparency → serum, not-just-summer → SPF, light textures → cream); abstract stories keep the number tile. Merchant setting "Visual" overrides; an uploaded image always wins. Uses the existing pack renders only; no new or altered packaging imagery.
37. **Current label designs (owner, 2026-10-06) are the source of truth over the earlier Figma v5 read.** Applied: cleanser INCI "Sodium Lauryl Sulfosuccinate" (was Disodium), SPF product title "Daily Defense Sunscreen SPF 50+" (Shopify title + AR translation updated), serum feature icons removed (none on the label). Cleanser EDA number kept pending owner confirmation (label shows it blank).
38. **WebGL light field in the hero, as progressive decoration.** Starts after load in idle time; skipped for reduced motion, Save-Data, missing WebGL and software renderers (SwiftShader/llvmpipe), so devices without a GPU never pay for it; 0.6× render scale, paused off-screen/hidden, 30 fps on touch. LCP stays the headline text. Lighthouse mobile 99.
39. **Cross-document View Transitions** for product morphs (tapped bottle → PDP studio cutout, shared name `pack-hero`) and a 260 ms page cross-fade; disabled for reduced motion; no JS framework, no effect on browsers without support.
40. **Printed label band on PDPs** using the owner's label artwork, as a reading companion; all its text is also on the page as real text. Merchant toggle; flagged in STATUS because the artwork contains the serum typo.
41. **Bundles = curated sets + mix & match, not fixed-price bundle products.** Sets add the real individual products (multi-item `/cart/add`), so inventory, translations and analytics stay per product and no bundle app is needed. Price shown = sum of real prices; a saving shows only when the matching tier is set, and the tier must mirror a real Shopify automatic discount, so the shown price equals the checkout price. Supersedes #17's "plain sum only" (plain sum remains the default while tiers are 0).
42. **Offer settings default to off (0 / blank).** Tier %, free-delivery threshold and WhatsApp number each hide their UI entirely when unset. No invented savings, thresholds or contact channels on staging.
43. **Routine Builder as the third signature interaction.** A shelf of four slots between the two suns: choosing a step lands its bottle and fills the light; total, next-saving nudge and CTA update live and are announced to screen readers; buttons use `aria-pressed`; presets for the four common routines. Works without the animation (reduced motion) and adds via the same `product-form` as the rest of the theme.
44. **Free-delivery and tier progress live in the cart (drawer + page), not as a site-wide bar.** They motivate at the point of decision without adding banner noise or layout shift to every page.
45. **WhatsApp chat as an optional floating button** (common, trusted channel in Egypt); prefilled neutral message; no third-party script.
46. **Micro-interactions limited to fine pointers and motion-allowed users:** tilt, magnetic CTAs; feedback states ("✓ Added", badge bump) for everyone, without motion when reduced.
47. **Store change:** created page **Sets** (`/pages/sets`, template `page.sets`, id 161643168002) with Arabic title translation. Reversible: delete the page.
48. **Restore point before every major redesign.** 2026-10-11: duplicated staging to unpublished theme `167303545090` ("BTS Opus — snapshot 2026-10-11 (pre-redesign)") and recorded commit `5e78baf`. Additive and reversible (delete the copy when no longer needed). Git tags can't be pushed from this environment (only `opus-build` is writable), so restore points are recorded as commit hashes.
49. **Night ink, not black.** Ink #20233A (a soft night blue) replaces #121318; no flat black surfaces remain (announcement = pack-colour gradient, footer = dusk gradient, climate block = light lab). Text contrast stays ≥ 14:1.
50. **Primary buttons carry the two suns** (warm low-left, cool high-right glow inside the night-ink pill, swelling on hover): brand-specific, still the highest-contrast element on every screen.
51. **Home routine = pinned "one day, four steps" stage** (replaces the 4-card grid on home; the grid section stays for other pages). Scroll maps to the sun's arc with a rest on each step so each product holds the centre long enough to read and buy; dots and keyboard focus jump to steps; pinned layout applies from first paint (CSS keyed on `.js` + motion preference) so there's no layout shift; reduced motion/no-JS = plain list.
52. **Climate lab replaces the black climate section** everywhere it's used: the condition at the viewport centre (or hovered) sets the stage's weather. The stage is aria-hidden decoration; all words are in the list as real text. No autoplay (so no pause control needed).
53. **Time-of-day tones:** sections declare `data-tone`; the page background drifts to the tone of the section at the centre of the screen (IntersectionObserver, 1.1 s ease). PDPs use `sku` (the product colour).
54. **Sunlight cursor** (fine pointer + motion only): a soft warm light that sits under content (z-index -1, so it never reduces text contrast) and a small "View" label over products. The native cursor is kept.
55. **PDP stage language matches home:** step word huge behind the pack, sun on the routine arc at the step's position (01 sunrise side → 04 sunset side), product-coloured page, frosted buy box.
56. **Routine stage driven by the scroll timeline.** One registered property (`--pos`) animated by `animation-timeline: view()` with rest plateaus per step; every piece derives its offset in CSS (`max()` for distance, `sin/cos` for the sun). Browsers without scroll timelines get an eased JS value. JS only syncs active state and, on `scrollend`, glides to the nearer product (no CSS scroll-snap: avoids re-snap jumps when layout changes).
57. **App dock on < 990 px** (Shop, Routine → /pages/sets, brand mark → Home, Search, Bag). Header search/bag hide on mobile (they live in the dock); language switch moves into the mobile header. The mark "breathes apart" on Home.
58. **Buy bar takes the dock's place on product pages** whenever the main Add button is not fully visible (above, below, or behind the dock). One bottom bar at a time.
59. **Add-to-bag sequence:** bottle flies from the visible image (card, stage, buy-bar thumbnail) to the visible bag, the brand mark's two arcs close around it, then the bag opens. Adds made inside the bag never fly or reopen it (decided at tap time). Reduced motion: no flight.
60. **Bag = bottom sheet on phones** with swipeable "Complete your routine" cards (missing steps, deep product-colour add buttons). Focus is kept inside the bag across re-renders.
61. **Warm ivory base (#F5F1EA) + deep product-colour buttons** (`oklch(from var(--sku) .47 calc(c*1.3) h)`, colour-mix fallback): hue stays recognisable, white text ≥ 4.5:1.
62. **PDP stage:** routine tabs, step word in strong product colour, tilted pack, generated background texture per step (SVG, abstract, no product depicted; replace with photography later), **label callouts** = the pack's own benefit words (no new claims; the visible benefit paragraph becomes screen-reader-only to avoid duplication), **Made for** chips from the forecast mapping (bts-draft, same as decision 18).
63. **Climate, not overkill:** home uses a compact 5-icon switch (sun, city & dust, humidity, air-con, heat) that changes the stage's light and offers "Add these N steps" at the real summed price; the long lab moves to /pages/climate only.
64. **Facts band = true numbers only** (4 steps, 55 INCI names across the packs, SPF 50+, made in Egypt shown with the mark); the 55 is a section setting.
65. **Brand mark used as a system element** (never redrawn; the supplied SVG, recoloured via CSS): dock Home, hero arcs, bag animation, button loading state, announcement separator, facts band.
66. **Store change:** duplicated staging to unpublished theme `167328219394` as the pass-2 restore point.
