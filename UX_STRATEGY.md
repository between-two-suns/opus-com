# UX STRATEGY — Between Two Suns

_Last updated: 2026-10-06_

## 1. The governing rule

**Experiment in the story. Be obvious in the shop.**
(SSENSE's editorial/commerce split, applied strictly.)

| Zone | Allowed | Not allowed |
|---|---|---|
| Brand moments: home hero, Forecast, Climate page, About | Signature motion, colour fields, giant type, scroll-linked light | Hiding prices or CTAs inside animation |
| Commerce surfaces: cards, PDP buy box, cart, checkout entry | Calm, high-contrast, conventional controls; quick micro-feedback | Novel controls, motion that delays action, low-contrast text |

## 2. Concept: "The space between"

The name sets the layout rule. Two suns are two light sources. Climate is the conditions between them: sun, dust, AC, humidity, heat, pollution, changing environments. Skin lives *in between*, and so do the products.

This concept comes from the brand's own Figma "Ten Studio Pitch" boards. It synthesises Pentagram's *The Space Between* (the product always occupies the protected gap between two fields), Koto's *Today's Skin Forecast*, Ragged Edge's *Whatever today does*, and Mucho's *Routine Grid*.

### Visual language (recognisable with the logo hidden)

1. **Two soft suns.** Two large luminous discs (radial light, no outlines) sit in every brand moment. They are lighting, not a logo redraw. The real two-suns icon is used only as supplied.
2. **The seam.** A vertical (desktop) or horizontal (mobile) gap where product and key message sit. Sections are composed as *field | seam | field*.
3. **Condensed capitals.** Display type echoes the packaging's condensed wordmark proportion (Archivo at narrow width, heavy weight). It's used for headlines only and never imitates the logo itself.
4. **SKU colour as wayfinding.** Mint 01 Reset, blue 02 Clarity, lilac 03 Barrier, peach 04 Defense. Colour always means the product, never decoration.
5. **Daylight white.** A cool, bright white ground (`#F6F7F4`), not beige. Ink is a near-black with a cool cast (`#121318`).
6. **Forecast notation.** `SUN ↑ DUST ↑ AC ↓` style notation as a typographic device. It never shows fake numeric data.

### Tone of voice

Confident, short, optimistic, a little irreverent ("Whatever today does."), and always backed by plain facts from the packaging. Tagline from the pack: **fresh skin. always.**

## 3. The two signature interactions

### Signature 1: "The Space Between" hero (home)

- Two suns sit at the left and right edges (top and bottom on mobile), with the four products standing in the seam.
- As you scroll the hero, the suns drift apart, the seam widens, and the background light moves from warm (sun) to cool (AC). This is the climate moving through a day.
- Built with CSS scroll-driven animations (`animation-timeline: view()`), plus a tiny IntersectionObserver/rAF fallback for Safari < 26.
- Disabled under `prefers-reduced-motion` (static composed state). No WebGL, no video, and the LCP element is the headline text, not an image.
- Commerce safety: the headline, sub-copy and **Shop the routine** CTA render statically and immediately. Nothing depends on the motion.

### Signature 2: "Today's Skin Forecast" (home + /pages/routines)

- An instrument panel. You toggle today's conditions (Sun, City & dust, Humidity, Air-con, Heat), and the time of day defaults from your device clock to AM or PM.
- The ambient light of the section re-tints, a two-suns dial shows AM/PM, and the routine below re-orders emphasis. Each step shows **why today** using only packaging-approved copy.
- PM routine excludes SPF; AM ends with SPF. This follows the label directions.
- One button: **Add today's routine — EGP total** (AJAX multi-add, cart drawer opens). The price is computed live from real variant prices.
- No external weather API and no fabricated humidity numbers. The user states their day. (A real weather integration is a later option, flagged in DECISIONS.)

Everything else is deliberately quiet so these two are remembered.

## 4. Information architecture

```
Header: [Shop ▾] [Routines] [Ingredients] [Climate] [Journal]   LOGO   [Search] [AR/EN] [Account] [Cart (n)]
Shop ▾ (mega panel): 01 Reset · 02 Clarity · 03 Barrier · 04 Defense | Full routine | Shop by concern
Footer: Shop · Learn (Climate, Ingredients, Journal, FAQ) · Help (Shipping, Returns, Contact, /scan) · Legal · Newsletter · Language
```

Routes:

| Route | Template | Notes |
|---|---|---|
| `/` | index.json | hero → concern chips → routine grid → climate story → forecast → ingredients → trust (facts only) → journal → newsletter |
| `/collections/all` | collection.json | Routine-ordered grid, concern filter chips, routine bundle card |
| `/products/*` | product.json (metafield-driven) | One template, four coherent PDPs; colour/step/copy from `bts.*` metafields |
| `/pages/routines` | page.routines.json | Forecast + AM/PM routines + "add full routine" |
| `/pages/ingredients` | page.ingredients.json | Glossary built from INCI lists |
| `/pages/climate` | page.climate.json | Brand philosophy: the eight conditions |
| `/pages/about` | page.about.json | Brand story |
| `/pages/faq` | page.faq.json | Grouped accordions + FAQPage schema |
| `/pages/contact` | page.contact.json | Shopify contact form |
| `/pages/scan` | page.scan.json | QR landing from pack "Discover More": pick your product → how to use → routine |
| `/pages/shipping`, `/pages/returns` | page.json | Merchant content; policies under `/policies/*` |
| `/blogs/journal` | blog.json / article.json | Editorial architecture |
| `/search` | search.json + predictive search | Products, articles, pages |
| `/cart` | cart.json | Full cart page (no-JS fallback + deep link) |
| 404 | 404.json | Routine shortcuts + search |

## 5. PDP hierarchy (mobile order)

1. Gallery (swipe, dots, product on white "studio" tile within a SKU-colour frame).
2. Step chip `STEP 01 · RESET` → **Title** → benefit line (verbatim from the pack).
3. Fact row: size · skin type · AM/PM.
4. **Price** (tax note from shop settings) → quantity → **Add to cart** (full width, ink). Sticky bar after scroll.
5. Pack claims as pills (e.g. Non-stripping · Soap-free · Non-comedogenic).
6. Texture/feel card.
7. Collapsed sections, consistent and descriptive: *What it does* · *Key ingredients* · *How to use — AM + PM* · *Who it's for* · *Full ingredients (INCI)* · *Caution & product info*.
8. "Where it sits in your routine" 01→04 with this step highlighted.
9. Complete the routine (one-tap add of missing steps, sum price).
10. FAQ (product-specific, factual).
11. Reviews slot: renders only when a reviews app or metafield provides real data.

Desktop: two columns. The gallery is sticky on the left and the buy column scrolls on the right. RTL mirrors this.

## 6. Conversion principles applied

- First screen on every PDP answers *what / who / price / add* without scrolling at 390×844.
- One primary action per view. Secondary actions are outlined.
- Cart drawer opens on add, with focus moved into it, `aria-live` announcement, and routine completion upsell (missing steps only).
- Transparent totals: tax inclusion copy comes from `cart.taxes_included`. Shipping is "calculated at checkout" unless the merchant sets a factual note.
- Payment icons: `shop.enabled_payment_types` only. COD, BNPL and wallet copy are merchant toggles, off until configured.
- No account gate. No pop-up on entry. Newsletter is inline (footer + home), with an optional exit-free banner.

## 7. Localisation strategy

- Shopify Markets languages: `en` (default) and `ar` (published when ready). URLs `/ar/...`.
- `<html lang dir>` set from `request.locale`. The whole stylesheet uses logical properties, so the layout mirrors with no duplicated CSS.
- Not mirrored: product images, logos, numerals, media controls' play icon, and the brand's left-to-right SKU order inside the bottle line-up (01→04 stays readable as a sequence; in RTL the sequence flows right-to-left, which Arabic readers expect).
- Mirrored: arrows, chevrons, drawers (cart opens from the inline-end), breadcrumbs, carousels and progress.
- Arabic type: Alexandria (variable), letter-spacing forced to 0, +12% size and +0.15 line-height relative to Latin.
- Theme strings live in `locales/ar.json`, written as natural Gulf/Egyptian-neutral MSA. Product content comes from the pack's own Arabic (how-to-use, description). New Arabic copy is flagged for native review.

## 8. Performance budget

| Asset | Budget |
|---|---|
| Critical CSS (base.css) | ≤ 30 KB raw |
| JS on first load (home) | ≤ 25 KB raw, all `defer`/module |
| Fonts | ≤ 3 files per locale, `font-display: swap`, preloaded display face |
| LCP | Text headline (home), product image with `fetchpriority="high"` (PDP) |
| CLS | All media with width/height; sticky bars are `position: fixed` so they don't shift layout |
| INP | No long tasks; handlers are tiny; motion via compositor-only properties |
