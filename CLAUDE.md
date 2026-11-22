# CLAUDE.md — Between Two Suns (read this first)

You are continuing a long-running build. This file is the handover: who the owner is, the rules, where everything lives,
what was done and why, and exactly what to do next. **DECISIONS.md** (numbered log, newest at the bottom) and **STATUS.md**
(current state, restore points, launch checklist) hold the detail; this file tells you how to use them.

**Next DECISIONS entry number: 349.** Add one entry per round of work and keep STATUS.md current.

---

## 1. The project

- **Brand:** BETWEEN TWO SUNS (written "Between Two Suns" in copy). Climate-adapted skincare, made in Egypt by
  Integrated Cosmetics Industries (ICI) for Nuu Group for Cosmetics. Four products, four steps:
  01 Daily Reset Cleanser · 02 Clarity Serum · 03 Daily Barrier Moisturizing Cream · 04 Daily Defense Sunscreen SPF 50+.
  Seven sets: The Full Ritual, The Clear & Protect Trio, The Night Ritual, Clear & Protect Duo, The Core Duo
  (**Cleanser + Clarity Serum**), SPF Stock-Up, Serum Stock-Up.
- **Site:** a custom Shopify OS 2.0 theme in `theme/`, English + Egyptian Arabic (RTL), built and maintained from this repo.
- **Store:** `qfj1gi-c9.myshopify.com`. Password-protected; the storefront password is given at runtime only (env `STORE_PW`),
  never written to the repo or docs.
- **Themes (Shopify ids):**
  - Live theme: **Horizon, 166832668930.** Never touch. Its `templates/index.json` MD5 must stay
    `c828067cbc7ea00ac09f4927419385ce`; check it after every deploy.
  - Staging: **"BTS Store — Version 1.1 (fixes, in progress)", 167112540418.** The current approved site. **Leave it
    untouched now** (it is the fallback for the new copy, see §6).
  - Snapshot: **Version 1.0, 167875215618.** Never edit it, and never change Files it uses (orb-green.png, orb-blue.png).
  - **Version 1.2 (new copy), 168818671874.** Duplicate of 1.1 with the new copy (DECISIONS 298). This is where new
    work goes now.
  - Demo theme from another session: 168509309186 (motion fixes demo, branch `claude/motion-fixes-demo`).
- **Branch:** commit and push to `opus-build` only. No pull requests. Another session also pushes here, so always
  `git pull --rebase origin opus-build` before pushing, and check staging checksums before overwriting a file.
- **Commit footer** (every commit; never put a model name in commits or repo files):
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: <this session's URL>
  ```

## 2. Hard rules (owner's words; never break)

- "DO NOT PUBLISH TO THE LIVE STORE." Develop only on unpublished themes. Publishing is the owner's step.
- "DO NOT ALTER LIVE PAYMENTS, SHIPPING, TAXES, DOMAIN SETTINGS, CUSTOMER DATA, ORDERS, OR EXISTING PRODUCTION THEMES."
- "DO NOT INSTALL PAID APPS WITHOUT explicit owner approval."
- "Do not recreate, redraw, approximate, replace or 'improve' the logo." "Never redesign bottle geometry, labels,
  typography, logos or packaging."
- "Do not invent efficacy claims… reviews… star ratings… awards… scarcity… stock levels… shipping promises."
  No dark patterns, no fake countdowns, no manufactured urgency, no fake payment methods in the UI.
- No WhatsApp, no public phone number. No pregnancy-safe or irritation-free claims. ICI approves claims.
- Percentages: only what's on the pack, **except** "5% Niacinamide + 3% Tranexamic Acid" for Clarity Serum, which the
  owner approved on 2026-11-17 (DECISIONS 294).

## 3. How the owner works (follow this)

- Wants honest, award-level advice: give real scores and say what's average. Plain words, short answers, no jargon.
- **Show before changing anything approved:** demo locally or on a demo theme, with before/after phone shots, then
  staging after a yes. Design matters a lot: always check phone first, both languages.
- At most one interaction per page. Owner is not technical: give exact click paths for anything they must do in admin.
- Doesn't want to waste credits or time: read this file, DECISIONS (tail) and STATUS, then act.

## 4. The copy system (DECISIONS 294–296)

- **Source of truth: `content/copy-master.md`** — the owner's "Brand voice, copy strategy & bilingual website copy
  master" with the owner's decisions and fixes at the top and a rollout table. Edit copy there first, then in locales.
- **Voice:** benefit-led and outcome-led, professional, for Egyptian and regional Gen Z and millennial women.
  Framework: Recognize → Desire → Explain → Reassure → Act. Customer tension: "I want to take care of my skin, but I
  don't want another complicated routine." Every selling headline = a benefit, a tension she recognizes, or a brand idea.
  Headlines to keep as anchors: "Your skin needs moisture. Not the extra weight." · "Sun protection without the sunscreen
  feeling." · "Clean skin. Not that tight, stripped feeling." · "Less to figure out. More to feel good about."
  Hero concept: "Made for the space between." Story: "From the first sun to the second." Tagline: "fresh skin. always."
- **Arabic:** Egyptian Arabic written for women, **feminine singular** everywhere (ضيفي، اختاري، اكتشفي), polished, not
  slangy, not fusha, never a literal translation. **Latin digits and ج.م** (e.g. "1,699 ج.م"), "السلة" (not الحقيبة),
  "تواصلي معانا" (never "كلّمينا"; there's no phone), "سيروم كلاريتي" spelling.
- **Step labels:** EN Cleanse · Treat · Moisturize · Protect; AR تنظيف · عناية · ترطيب · حماية (prose may say عناية
  مركّزة). Brand words Reset · Clarity · Barrier · Defense appear only in graphics (the big word behind the pack,
  `product.stage_word`).
- **Rules from the master:** don't repeat the climate list (sun, traffic, heat, AC) everywhere: only the climate block and
  the Climate page; pollution stays context, never an efficacy claim; "routine" in copy, "Ritual" only in set names; one
  primary goal per page; transactional copy stays plain.
- **Where copy lives in the theme:**
  - `theme/locales/en.default.json` and `theme/locales/ar.json` (≈1,300 keys each; ≈1,000 are used by real pages, the
    rest belong to old demo sections).
  - Product page heads: `copy.products.<handle>.headline / .lead / .ingredients` via `snippets/pdp-copy-head.liquid`.
  - Product directions in the site's voice: `copy.products.<handle>.how / .when` via `snippets/bts-text.liquid`
    (falls back to the product's pack metafields). Product records in Shopify and `content/products.json` keep the
    pack wording on purpose, so Version 1.1 is unaffected.
  - Home routine stage lines: `sections.routine.lines.1–4`; home climate lines: `sections.climate_switch.lines.*`;
    set card lines: `bundles.desc.<handle>`; step names: `product.step_name.s1–s4`.
- **Tools:** `python3 tools/copy/apply-locales.py batch.py` (batch defines `U = {'key': (en_or_None, ar_or_None)}`);
  `node tools/qa/copy-shots.mjs <dir>` for per-section phone shots; `python3 tools/copy/before-after.py` to stack them.
- **Arabic gotchas learned:** percentages in Arabic need Unicode isolates or "3%" shows as "%3"
  (`⁦3%⁩`); a missing translation returns "translation missing…" (guard with `contains 'ranslation missing'`);
  locale values are HTML-escaped unless the key ends in `_html`; long Arabic display lines need their own phone size
  (e.g. hero `:lang(ar) .hh-title`).

## 5. Build, preview and QA

- Local preview: `cd tools && node preview/server.js` → http://localhost:4321 (and `/ar/...`). Restart it after changing
  `content/products.json` (fixtures load at start). Playwright's Chromium is at `/opt/pw-browsers/chromium`.
- QA (all must pass before any deploy), from `tools/`:
  - `node qa/theme-check.mjs` → TOTAL 0
  - `timeout 590 node qa/flows.js` → 408/408
  - `node qa/spacing.mjs` and `LOC=/ar node qa/spacing.mjs` → 186/186 each
  - `node qa/finish.mjs` → 0 failures (names too close to pictures, text under 12px, cut shadows, text near card edges)
  - `node qa/layout-sweep.mjs` → no output (sideways scroll, wrapped buttons, long phone headings, overflow)
- The Shopify connector's `theme_screenshot` / `theme_bash` read a stale cached copy of the theme: never use them to
  verify a fresh upload (DECISIONS 304). Use Admin API checksums/bodies, the local preview, or STORE_PW + a real fetch.
- Screenshots: reveal animations can leave headings half-drawn in shots; scroll with the mouse wheel and wait before
  shooting (see `qa/copy-shots.mjs`). Hide `.dock` and `[data-preview-badge]` in review shots.
- Design tokens are in `theme/assets/base.css :root` (`--fs-*`, `--sp-*`, `--stack` 14px, `--section-y`). The global
  `ul[role='list']` reset beats component padding, so target `[role='list']` selectors.

## 6. Current state (2026-11-17) and what to do next

**Done and pushed (DECISIONS 294–296):** the whole theme is rewritten in the new voice (EN + feminine Egyptian Arabic),
the six owner-approved line swaps are in, layout is checked, all QA passes. Review images: `review/copy-demo/`.
**Not deployed anywhere yet.** Restore point: commit `e50a3b8` (the site before any of this copy work).

**Owner's instruction:** keep Version 1.1 as it is and put the new text on a **new** unpublished theme.

### Step 1 — create Version 1.2 — DONE (DECISIONS 298): theme 168818671874, files verified. Owner to review.
- Best: duplicate 167112540418 so admin-made settings come along. If the API has no duplicate mutation, ask the owner to
  do it in admin (Online Store → Themes → Version 1.1 → ⋯ → Duplicate), then rename it to
  **"BTS Store — Version 1.2 (new copy)"** and give you its id. Do not use `themeCreate` from the repo zip unless the
  owner agrees: `config/settings_data.json` in the repo may lag the admin settings.
- Then upload only the changed files to the **new** theme id (never 167112540418):
  `git diff --name-only e50a3b8..HEAD -- theme/` → locales first (`locales/en.default.json`, `locales/ar.json`), then
  `snippets/bts-text.liquid`, `snippets/pdp-copy-head.liquid`, then the sections (bundles-feature, climate-switch,
  day-line, editorial-band, footer, hero-orbs, ingredient-benefits, ingredient-heroes, main-collection,
  main-product-v2, pdp-howto, scan-landing, set-day, set-inside), the assets (home.css, pages.css, pdp-v2.css), and
  last `templates/index.json` (home FAQ now has 4 questions: start_where, all_four, order, climate; the story band
  links to About).
- Deploy flow: see STATUS.md "Deploy procedure" and `tools/deploy/upload.py` (stagedUploadsCreate → upload →
  themeFilesUpsert with URL bodies → job { done } → compare checksumMd5 with local md5). themeFilesDelete is blocked.
- Verify on the new theme's preview link (phone, EN and AR), then send the owner the link. Check live index MD5.

### Step 2 — store-side copy — DONE (DECISIONS 300–302)
- **Arabic order emails:** regenerate with `node tools/notifications/build.mjs` (already done; files in
  `notifications/*.ar.liquid`) and re-register the Arabic translations with `translationsRegister` (resource =
  EmailTemplate, locale `ar`, keys `title` / `body_html`, with the current `translatableContentDigest`). EmailTemplate ids:
  43466785026 order confirmation, 43466850562 shipping confirmation, 43467899138 shipping "Delivered"
  (43466981634 local-delivery stays Shopify's default). English bodies are edited by the owner in admin; Shopify's email
  editor rejects invalid CSS (a 5-value padding caused "Server error").
- **Page titles** in Arabic (e.g. Contact "تواصل معنا" → "تواصلي معانا"): Page translations, key `title`.
- **SEO titles and descriptions:** master Part VIII in `content/copy-master.md` (home, shop all, 4 products, sets,
  finder, climate, ingredients, about, FAQ, contact), EN on the resource + AR translations (`meta_title`,
  `meta_description`).
- **Serum Arabic step label:** `bts.step_label` Arabic "سيروم" → "عناية" (one word; it also shows on Version 1.1 because
  it is product data; mention this to the owner before changing it).
- **Ingredient glossary (55 entries, metaobjects):** Arabic descriptions are still formal; rewrite in the same voice
  (third person is fine, keep facts identical). Source copy also in `content/inci.json`.

### Step 3 — owner tasks (remind, don't do)
- Native read-aloud: 3–5 Egyptian women aged 20–35 read home + one product page aloud in Arabic on their phones; rewrite
  anything that makes them pause. Real reviews come after production.
- ICI: confirm claims (claims sheet in the copy audit doc), "lasts about" figures, shipping/returns policy text,
  founder quote, cash-order refund method. Upload the new email logo (156px) in admin.

### Before launch (from STATUS.md; keep the list there current)
Delete in admin: assets/climate-live.js, templates/product.demo.json, sections/pdp-break.liquid, assets/pdp-demo.css,
assets/demo.css, assets/demo.js, snippets/demo-set-stage.liquid, assets/white-demo.css. Remove the "Scan your pack ★"
footer link. Turn `preview_payments` off. Delete the Judge.me test reviews. Turn off Creators stand-ins. Checkout to
white (owner approval pending).

### Parked by the owner
Arabic display font (Reem Kufi recommended). Limited font-size consolidation. Award case study (later).

## 7. Other useful references

- **Copy audit doc** (Claude Doc, owner-facing): "BTS · Site copy audit (EN + AR)",
  https://claude.ai/artifact/M5GnBfC1rFY1eRXfLv1hUF — glossary, ICI claims sheet, launch checklist. Its proposed lines
  are superseded by `content/copy-master.md`.
- `content/products.json` = approved pack copy (record of what's printed); `content/inci.json` = ingredient library;
  `content/policies/` = legal text (don't rewrite legal policies without the owner).
- `notifications/README.md` = how the branded order emails are installed.
- If a connector says "needs you to sign in again" although claude.ai shows it Connected, the saved sign-in expired:
  the owner disconnects and reconnects it at claude.ai/customize/connectors, then starts a new session (sessions read
  connectors at start).
