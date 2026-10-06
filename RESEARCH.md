# RESEARCH — Between Two Suns (Opus build)

_Last updated: 2026-10-06_

## 0. Method and honest limits

- The build sandbox's network egress policy **blocks direct page loads** of reference sites (awwwards.com, aesop.com, byoma.com, theordinary.com, ultraviolette.com, mytopicals.com, shopify.dev, baymard.com and the Shopify storefront itself all return `403 EGRESS_BLOCKED`).
- Research was therefore done via **web search results** (current through Oct 2026) combined with the team's **working knowledge of these sites**. Pattern notes describe each site's long-standing architecture and may not match their latest redesigns. Anything time-sensitive is marked _(verify)_.
- Statistics are only quoted when they come from a primary source (Baymard) via search. Vendor blog statistics such as "sticky ATC lifts conversion X%" are **not** used as evidence, because they could not be traced to a primary study.

## 1. Primary research findings that change the design

| # | Finding | Source | Design consequence |
|---|---|---|---|
| R1 | Horizontal tabs on PDPs: 27% of users overlooked tab content. Vertically collapsed sections: 8%. Collapsed sections perform best on mobile. Pitfalls: inconsistent use, and vague section titles. | [Baymard — avoid horizontal tabs](https://baymard.com/research-articles/avoid-horizontal-tabs) | PDP uses **vertically collapsed sections, consistently**, with descriptive titles ("How to use — AM + PM", not "Details"). No tabs anywhere. |
| R2 | "One long page with sticky TOC" is the other well-performing PDP layout. | Same | Desktop PDP: a sticky buy column, with long-form content in the scrolling column. |
| R3 | Avoid sending users to sub-pages for core product info. | [Baymard — avoid sub-pages](https://baymard.com/research-articles/avoid-using-subpages) | INCI, how-to-use, caution and size all live **on the PDP**, not on linked pages. |
| R4 | Cart abandonment ≈70%. Top reasons (excluding "just browsing"): extra costs 39%, slow delivery 21%, trust/security 19%, forced account creation 19%, complex checkout 18%. | Baymard checkout research (via search) | Show **price including tax** where configured. Say shipping is "calculated at checkout" rather than surprising people. Guest checkout is default (Shopify). Payment icons come only from real config. No account gate. |
| R5 | Egypt: COD is the dominant payment preference (≈45% of value; 55–70% of shoppers prefer it). ~60% of online shoppers are aged 18–34 and mobile-first. | Market reports (IMARC / P&S, via search) _(verify)_ | Mobile is the primary canvas. COD reassurance is a **merchant toggle**, off by default until COD is actually configured (we cannot detect manual payment methods from Liquid). |
| R6 | EDA (Egyptian Drug Authority) cosmetic advertising guideline 2026: advertising must be in **Arabic**, product image/data must be **identical to the notified product**, claims are limited to notified uses, and ad materials go through **PROMAT** with a notification code. | [EDA guidelines for cosmetic advertising 2026](https://edaegypt.gov.eg/media/zctpsbnb/guidelines-for-cosmetic-advertising-materials-en-2026.pdf) | Arabic is a first-class launch locale, not a later add-on. All product copy is taken **verbatim from packaging** (which carries EDA notification numbers). Imagery must match final packs. **Legal must confirm whether the website counts as "advertising material" that needs PROMAT clearance** (see STATUS blockers). |
| R7 | Arabic typography: never apply letter-spacing (it disconnects letterforms). Use a larger optical size (~+10–20%) and more line-height than Latin. Kashida, not word-space, is the justification model. | Arabic typography guides (via search) | `letter-spacing: 0 !important` under `:lang(ar)`. Arabic gets its own type scale. Text is ragged, never justified. |
| R8 | Shopify perf guidance: Section Rendering API for cart/drawer updates; avoid heavy Liquid loops; minimize JS; images via `image_url` with `srcset`/`sizes`. | [shopify.dev performance](https://shopify.dev/docs/storefronts/themes/best-practices/performance) | Cart drawer re-renders via `?sections=`. No jQuery or framework. Each interactive module is a small custom element loaded only where used. |

## 2. Reference study (28 sites)

Grouped by what we learn from each. "Don't copy" notes are as important as "why it works".

### A. Skincare / beauty DTC

1. **Byoma**: barrier-care brand with **pastel, colour-coded packaging**, the closest structural analogue to BTS.
   - Why it works: product colour equals navigation colour; ingredient-first naming; Gen Z tone; bundles framed as "routines".
   - Nav: Shop / Routines / Concerns / Ingredients / About.
   - PDP: ingredient call-outs as tiles, texture shot, "pairs well with".
   - Don't copy: the busy, sticker-heavy collage art direction. It's their signature, and it adds visual noise around the price.
2. **Topicals**: Gen Z, concern-led (hyperpigmentation, eczema).
   - Why: a voice with attitude, shop-by-concern on the first screen, big saturated colour fields.
   - Don't copy: the meme-heavy tone (wrong for a science-credible brand).
3. **The Ordinary / Deciem**: ingredient-led nav (shop by ingredient, concern, format) and a regimen builder.
   - Why: radical transparency, clinical clarity.
   - Don't copy: the pharmacy-grid aesthetic (explicitly off-brief) and the overwhelming SKU density.
4. **Paula's Choice**: deep ingredient dictionary; concern/skin-type quiz; "how to use" with routine-step numbering.
   - Lesson: an ingredient glossary is a trust and SEO asset.
   - Don't copy: its information density.
5. **Ultra Violette** (SPF specialist): makes sunscreen desirable.
   - Why: SPF education reframed as lifestyle; filter types explained plainly; finish/texture called out on every card.
   - Lesson: **sell the texture and finish**, not the number.
   - Don't copy: the stacked promo banners.
6. **Supergoop!**: "SPF every day" positioning; a reapplication message; texture swatches on PDP.
   - Lesson: SPF as a daily habit, not a beach product. Aligns with "not summer skincare".
7. **Rhode**: ultra-minimal, very few SKUs, oversized product photography, almost no copy above the fold.
   - Lesson: with 4 SKUs you can make **every product a hero**.
   - Don't copy: the celebrity-driven reliance on imagery alone; BTS must explain more.
8. **Glossier**: soft, confident tone; reviews woven into the PDP; product-first homepage.
   - Lesson: copy voice can carry the brand.
   - Don't copy: millennial pink, which is now generic.
9. **Aesop**: editorial typography, restraint, long-form "ingredients and use".
   - Lesson: calm, scannable product text blocks with labelled rows (Suited to / Skin feel / Key ingredients).
   - Don't copy: the beige/apothecary palette (explicitly off-brief).
10. **Augustinus Bader**: science credibility devices (technology pages).
    - Don't copy: invented-sounding clinical claims, and luxury gold.
11. **Krave Beauty**: barrier-care education, "less is more" tone, very readable PDP.
    - Lesson: short, honest benefit statements.
12. **Beauty of Joseon**: hanbang heritage told without cliché.
    - Lesson: cultural origin can be **modern**, not costume. Relevant to "Made in Egypt, without pyramids".
13. **Glow Recipe**: colour-as-flavour per product; strong texture video.
    - Lesson: texture media sells skincare.
    - Don't copy: candy-cute styling.
14. **Necessaire**: typographic minimalism; "body as skin" thinking.
    - Lesson: a strict grid plus one bold typeface equals identity.
15. **Starface**: playful, colour-saturated, an iconic single shape (star).
    - Lesson: **one recurring graphic device** builds recognition. For BTS that's the two suns.
16. **Beauty In Stem**: Awwwards Honorable Mention, June 2026 ([Awwwards](https://www.awwwards.com/sites/beauty-in-stem)). Minimal editorial + immersive motion + science storytelling.
    - Lesson: award juries reward **restrained motion tied to a concept**.
17. **Uruoi**: Japanese skincare, Awwwards SOTD _(verify date)_.
    - Lesson: slow, atmospheric storytelling scroll, with the product grid kept conventional.
18. **Soho Skin / Cremeri**: Awwwards galleries.
    - Lesson: product detail pages can be editorial without losing the buy box.

### B. Fashion / luxury / experiential commerce

19. **Jacquemus**: oversized imagery, minimal chrome, playful product staging (surreal scale).
    - Lesson: playful staging.
    - Don't copy: the hidden navigation affordances.
20. **SSENSE**: typographic rigor and an editorial/commerce split.
    - Lesson: **experiment in editorial, stay utilitarian in commerce**. This is our core rule.
21. **Aimé Leon Dore**: lifestyle imagery plus utilitarian product grids.
22. **Gentle Monster**: installation-like brand moments.
    - Lesson: one memorable "exhibit" moment per page.
    - Don't copy: heavy video that breaks performance.
23. **COS / Arket**: clean, fast, excellent mobile filters, honest product data.
24. **Loewe**: craft storytelling, generous whitespace, high-quality product imagery.

### C. Award winners / UX benchmarks / platform

25. **Awwwards e-commerce SOTD 2026: Bucks Sauce (Jul 2026), Outfit (May 2026)** (via search).
    - Common traits of recent winners: one strong concept, bold type, colour fields, micro-interactions that reinforce brand, and fast perceived performance.
26. **Shopify Horizon** (the live theme on this store): modern OS2 baseline with theme blocks.
    - Lesson: merchant-editable blocks are expected. We match that editability.
27. **Shopify Dawn**: performance baseline (minimal JS, custom elements, Section Rendering API for cart).
28. **Baymard** PDP/cart/mobile benchmarks (see §1).

## 3. Cross-reference pattern matrix

| Pattern | Who does it best | Adopt? | How for BTS |
|---|---|---|---|
| Colour = product = navigation | Byoma, Glow Recipe | **Yes, core** | 4 SKU colours are the wayfinding system (step 01–04). |
| Routine step numbering | Paula's Choice, The Ordinary | **Yes** | Products numbered 01 Reset → 04 Defense everywhere, taken from existing Shopify tags. |
| Shop-by-concern on first screen | Topicals | **Yes** | Concern chips under the hero (Oiliness, Dark spots, Dehydration, Sun, Barrier stress). |
| Regimen builder / quiz | The Ordinary, Paula's Choice | **Yes, re-imagined** | "Today's Skin Forecast" (signature 2). Conditions → routine → one-tap add. |
| Texture media | Glow Recipe, Supergoop! | Yes, when supplied | Texture block on PDP; uses metafield/video when available, typographic texture card otherwise. |
| Ingredient glossary | Paula's Choice | Yes | `/pages/ingredients`, built only from INCI-listed ingredients. |
| Sticky mobile ATC | Universal | Yes | Appears after the main ATC leaves the viewport; never covers content; hides when the cart opens. |
| Cart drawer + routine completion | Byoma | Yes | "Complete your routine": shows missing steps only. |
| Reviews | Glossier | **Only with real data** | App-block slot + metafield rating hook. Nothing renders until real data exists. |
| Countdown / scarcity | many | **Never** | Dark pattern, against brief. |
| Horizontal tabs | 29% of sites | **Never** | Baymard R1. |
| Full-screen autoplay video hero | Gentle Monster | No | LCP cost. Brand moment done in CSS instead. |
| WebGL | various SOTDs | No (for now) | Two-suns light effect achieved with CSS gradients and transforms; no GPU-heavy dependency. |

## 4. What we explicitly avoid

- Beige luxury, apothecary amber, botanical leaf illustration, pharmacy grids, "clean beauty" claims.
- Pyramids, desert dunes, hieroglyph motifs, sandy palettes.
- Fake reviews, star ratings, "as seen in", dermatologist quotes, %-results, countdowns, stock warnings.
- Hidden navigation, scroll-jacking, cursor-follow gimmicks, loaders/splash screens.

## Sources

- [Baymard — Avoid horizontal tabs](https://baymard.com/research-articles/avoid-horizontal-tabs)
- [Baymard — Avoid sub-pages](https://baymard.com/research-articles/avoid-using-subpages)
- [Baymard — Product page research](https://baymard.com/product-page)
- [Baymard — Year in review 2025 / 2026 roadmap](https://baymard.com/research-articles/year-in-review-2025-and-2026-roadmap)
- [Shopify — Theme performance best practices](https://shopify.dev/docs/storefronts/themes/best-practices/performance)
- [Shopify — Section Rendering API](https://shopify.dev/docs/storefronts/themes/best-practices/performance/use-section-rendering-api)
- [EDA — Guidelines for cosmetic advertising materials 2026](https://edaegypt.gov.eg/media/zctpsbnb/guidelines-for-cosmetic-advertising-materials-en-2026.pdf)
- [ChemLinked — Egyptian cosmetics regulations](https://cosmetic.chemlinked.com/cosmepedia/egyptian-cosmetics-regulations)
- [Awwwards — Beauty In Stem](https://www.awwwards.com/sites/beauty-in-stem)
- [Awwwards — E-commerce winners](https://www.awwwards.com/websites/winner_category_ecommerce/)
- [IMARC — Egypt e-commerce market](https://imarcgroup.com/egypt-e-commerce-market)
- [P&S — Egypt e-commerce market](https://www.psmarketresearch.com/market-analysis/egypt-e-commerce-market)
