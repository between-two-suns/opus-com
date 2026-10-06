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
