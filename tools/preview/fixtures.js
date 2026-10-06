// Fixtures for the local preview, generated from content/products.json (approved pack copy).
// PREVIEW-ONLY: prices are SAMPLE values so cart/total flows can be exercised. Real prices live in Shopify.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/products.json'), 'utf8'));

export const SAMPLE_PRICES = { 1: 45000, 2: 65000, 3: 55000, 4: 60000 }; // cents — SAMPLE ONLY
const PHOTO = { 1: 'render-cleanser.webp', 2: 'render-serum.webp', 3: 'render-moisturizer.webp', 4: 'render-spf.webp' };
const CUT = { 1: 'cut-cleanser.png', 2: 'cut-serum.png', 3: 'cut-moisturizer.png', 4: 'cut-spf.png' };
const TAGS = { 1: '01 Reset', 2: '02 Clarity', 3: '03 Barrier', 4: '04 Defense' };
const TYPES = { 1: 'Cleanser', 2: 'Serum', 3: 'Moisturizer', 4: 'Sunscreen' };
const IDS = { 1: 10328888049922, 2: 10328890212610, 3: 10328890343682, 4: 10328890507522 };
const VIDS = { 1: 50557240017154, 2: 50557242999042, 3: 50557243130114, 4: 50557243293954 };

export function productsFor(locale) {
  const L = locale === 'ar' ? 'ar' : 'en';
  const pick = (o) => (o && typeof o === 'object' ? o[L] ?? o.en : o);
  return content.products.map((p) => {
    const s = p.step;
    const mf = {
      step: s,
      step_label: pick(p.step_label),
      benefit: pick(p.benefit),
      hero_ingredients: pick(p.hero_ingredients),
      skin_type: p.skin_type ? pick(p.skin_type) : null,
      size: p.size,
      when_to_use: pick(p.when),
      badges: p.badges.map(pick),
      features: p.features.map(pick),
      texture: pick(p.texture),
      description: pick(p.description),
      how_to_use: pick(p.how_to_use),
      inci: p.inci,
      caution: pick(p.caution),
      legal: p.legal,
      concerns: p.concerns,
      key_ingredients: p.key_ingredients,
      cutout: { __image: CUT[s], width: 446, height: 1400, alt: '' },
    };
    for (const [k, v] of Object.entries(p.forecast_reasons || {})) mf[`forecast_${k}`] = pick(v);
    return {
      id: IDS[s],
      handle: p.handle,
      title: pick(p.title),
      vendor: 'BETWEEN TWO SUNS',
      type: TYPES[s],
      tags: [TAGS[s], s === 4 ? 'AM' : 'AM + PM', 'BTS Launch'],
      description: 'Development product record for the BETWEEN TWO SUNS storefront. Final approved ecommerce copy will replace this before launch.',
      price: SAMPLE_PRICES[s],
      variantId: VIDS[s],
      sku: ['', 'BTS-RESET-200', 'BTS-CLARITY-30', 'BTS-BARRIER-50', 'BTS-DEFENSE-50'][s],
      photo: { __image: PHOTO[s], width: 1024, height: 1536, alt: pick(p.title) },
      metafields: { bts: mf },
    };
  });
}

export function ingredientsFor(locale) {
  const L = locale === 'ar' ? 'ar' : 'en';
  return content.ingredients.map((i) => ({
    id: i.id,
    name: i.name[L] || i.name.en,
    inci: i.inci,
    role: i.role[L] || i.role.en,
    products: i.in,
  }));
}

export const PAGES = {
  routines: { en: 'Routines', ar: 'الروتينات' },
  ingredients: { en: 'Ingredient glossary', ar: 'دليل المكوّنات' },
  climate: { en: 'Climate-adapted skincare', ar: 'عناية بالبشرة متكيّفة مع المناخ' },
  about: { en: 'About Between Two Suns', ar: 'عن Between Two Suns' },
  faq: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  contact: { en: 'Contact', ar: 'تواصل معنا' },
  scan: { en: 'Scan your pack', ar: 'امسح عبوتك' },
  shipping: { en: 'Shipping', ar: 'الشحن' },
  returns: { en: 'Returns', ar: 'الاسترجاع' },
};

export const PAGE_BODY = {
  shipping: {
    en: '<p><strong>To be confirmed before launch.</strong> Delivery areas, carriers, timings and fees will be published here once fulfilment is configured. Shipping cost is always shown at checkout before you pay.</p>',
    ar: '<p><strong>سيتم التأكيد قبل الإطلاق.</strong> سننشر هنا مناطق التوصيل وشركات الشحن والمواعيد والرسوم فور إعداد خدمات التوصيل. تظهر تكلفة الشحن دائماً عند إتمام الطلب قبل الدفع.</p>',
  },
  returns: {
    en: '<p><strong>To be confirmed before launch.</strong> Our returns and refunds policy will be published here and in the store policies.</p>',
    ar: '<p><strong>سيتم التأكيد قبل الإطلاق.</strong> سننشر سياسة الاسترجاع والاسترداد هنا وفي سياسات المتجر.</p>',
  },
};

export const ARTICLES = [
  {
    handle: 'how-to-layer-a-four-step-routine',
    title: { en: 'How to layer a four-step routine', ar: 'كيف ترتّب روتيناً من أربع خطوات' },
    excerpt: {
      en: 'Cleanser, serum, moisturizer, SPF — the order on the bottles, and why it matters.',
      ar: 'غسول، سيروم، مرطب، واقي شمس — الترتيب المكتوب على العبوات، ولماذا يهم.',
    },
    body: {
      en: '<p>Every Between Two Suns pack tells you what comes next. The cleanser says <em>follow with serum</em>. The serum says <em>follow with moisturizer</em>. The moisturizer says <em>follow with sunscreen in the morning</em>. The sunscreen says <em>last step, every morning</em>.</p><h2>Morning</h2><ol><li>Daily Reset Cleanser — 1–2 pumps on wet skin, massage, rinse.</li><li>Clarity Serum — a few drops on face and neck.</li><li>Daily Barrier Moisturizing Cream — 1–2 pumps.</li><li>Daily Defense Sunscreen SPF 50 — apply evenly to face and neck. Reapply every 2 hours.</li></ol><h2>Evening</h2><p>The same first three steps. SPF is a morning step.</p>',
      ar: '<p>كل عبوة من Between Two Suns تخبرك بالخطوة التالية. الغسول يقول <em>يُستخدم قبل السيروم</em>. والسيروم يقول <em>ثم يوضع المرطب</em>. والمرطب يقول <em>يُستخدم قبل واقي الشمس في الصباح</em>. وواقي الشمس يقول <em>آخر خطوة في الروتين كل صباح</em>.</p><h2>الصباح</h2><ol><li>غسول ديلي ريست — ضغطة أو ضغطتان على بشرة مبللة، ثم التدليك والشطف.</li><li>سيروم كلاريتي — قطرات قليلة على الوجه والرقبة.</li><li>كريم ديلي باريير المرطّب — ضغطة أو ضغطتان.</li><li>واقي الشمس ديلي ديفنس SPF 50 — يوضع بالتساوي على الوجه والرقبة، ويُعاد كل ساعتين.</li></ol><h2>المساء</h2><p>الخطوات الثلاث الأولى نفسها. واقي الشمس خطوة صباحية.</p>',
    },
    published_at: '2026-10-01T09:00:00Z',
    image: null,
  },
];
