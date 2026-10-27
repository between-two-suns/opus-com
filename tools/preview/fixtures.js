// Fixtures for the local preview, generated from content/products.json (approved pack copy).
// Prices mirror Shopify (Pricing & Offers spec, applied 2026-10-12).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const content = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/products.json'), 'utf8'));

export const SAMPLE_PRICES = { 1: 39900, 2: 49900, 3: 44900, 4: 49900 }; // cents, = Shopify list prices
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
      tags: [TAGS[s], s === 4 ? 'AM' : 'AM + PM', 'BTS Launch', 'singles'],
      description: 'Development product record for the BETWEEN TWO SUNS storefront. Final approved ecommerce copy will replace this before launch.',
      price: SAMPLE_PRICES[s],
      variantId: VIDS[s],
      sku: ['', 'BTS-CLN-200', 'BTS-SRM-030', 'BTS-MST-050', 'BTS-SPF-050'][s],
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

const inci = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/inci.json'), 'utf8'));
export function inciFor(locale) {
  const L = locale === 'ar' ? 'ar' : 'en';
  return inci.entries.map((e) => ({
    handle: e.handle, inci: e.inci, name: e.name[L] || e.name.en, group: e.group,
    description: e.description[L] || e.description.en, products: e.products, key: e.key_ingredient,
  }));
}

export const PAGES = {
  sets: { en: 'Sets', ar: 'المجموعات' },
  routines: { en: 'Routines', ar: 'الروتينات' },
  ingredients: { en: 'Ingredient glossary', ar: 'دليل المكوّنات' },
  climate: { en: 'Climate-adapted skincare', ar: 'عناية بالبشرة متكيّفة مع المناخ' },
  about: { en: 'About Between Two Suns', ar: 'عن Between Two Suns' },
  faq: { en: 'FAQ', ar: 'الأسئلة الشائعة' },
  contact: { en: 'Contact', ar: 'تواصل معنا' },
  creators: { en: 'Creators', ar: 'صنّاع المحتوى' },
  scan: { en: 'Scan your pack', ar: 'امسح عبوتك' },
  shipping: { en: 'Shipping', ar: 'الشحن' },
  returns: { en: 'Returns', ar: 'الاسترجاع' },
  'skin-check': { en: 'Skin check', ar: 'فحص البشرة' },
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
  // The first journal story, written for the launch (content/journal/how-to-layer-a-four-step-routine.json, DECISIONS 245)
  {
    handle: 'how-to-layer-a-four-step-routine',
    title: {"en": "How to layer a four-step routine", "ar": "كيف ترتّب روتيناً من أربع خطوات"},
    excerpt: {"en": "Cleanser, serum, moisturizer, SPF: the order is printed on the bottles. Here is how to follow it, morning and night.", "ar": "غسول، سيروم، مرطب، واقي شمس: الترتيب مكتوب على العبوات. إليك كيف تتبعه صباحاً ومساءً."},
    body: {"en": "<p>Every Between Two Suns pack ends by telling you what comes next. The cleanser says <em>follow with serum</em>. The serum says <em>follow with moisturizer</em>. The moisturizer says <em>follow with sunscreen in the morning</em>. The sunscreen calls itself the last step. Read them in a row and you have the whole routine, no chart needed.</p><h2>Morning: four steps</h2><ol><li><strong>Reset: Daily Reset Cleanser</strong>Apply 1–2 pumps to wet skin. Gently massage over the face, then rinse.</li><li><strong>Clarity: Clarity Serum</strong>A few drops on cleansed face and neck. Gently smooth until absorbed.</li><li><strong>Barrier: Daily Barrier Moisturizing Cream</strong>1–2 pumps on clean, dry skin, after the serum.</li><li><strong>Defense: Daily Defense Sunscreen SPF 50+</strong>Apply evenly to face and neck as the last step in your routine. Reapply every 2 hours.</li></ol><h2>Evening: the same first three</h2><p>Cleanser, serum, moisturizer, in that order. Sunscreen is a morning step, so the evening routine ends with the cream.</p><h2>Why the order matters</h2><p>The order isn’t decoration. Each pack names the step that follows it, so the four bottles line up the same way every day, and sunscreen, the step that faces the day, is always last.</p><h2>Starting with fewer steps</h2><p>You don’t have to begin with all four. Two easy starts: cleanser and serum (The Core Duo), or serum and sunscreen (Clear &amp; Protect Duo). Add the rest when you’re ready; the order stays the same. Whatever you start with, finish every morning with sunscreen.</p><p class=\"article__note\"><strong>Good to know:</strong> for external use only. Avoid contact with eyes.</p><p>Not sure which steps you need? <a href=\"/pages/routines\">Find your routine in 30 seconds</a>.</p>", "ar": "<p>كل عبوة من Between Two Suns تنتهي بإخبارك بالخطوة التالية. الغسول يقول <em>يُستخدم قبل السيروم</em>. والسيروم يقول <em>ثم يوضع المرطب</em>. والمرطب يقول <em>يُستخدم قبل واقي الشمس في الصباح</em>. وواقي الشمس يقدّم نفسه كآخر خطوة. اقرأها بالترتيب وستجد الروتين كاملاً، من دون أي جدول.</p><h2>الصباح: أربع خطوات</h2><ol><li><strong>تنظيف: غسول ديلي ريست</strong>يوضع 1–2 ضغطة على بشرة مبللة. يُوزّع بلطف على الوجه ثم يُشطف جيداً.</li><li><strong>صفاء: سيروم كلاريتي</strong>قطرات قليلة على الوجه والرقبة بعد تنظيف البشرة. يُوزّع بلطف حتى يمتص.</li><li><strong>حاجز: كريم ديلي باريير المرطّب</strong>يوضع 1–2 ضغطة على بشرة نظيفة وجافة، بعد السيروم.</li><li><strong>حماية: واقي الشمس ديلي ديفنس SPF 50+‎</strong>يوضع بالتساوي على الوجه والرقبة كآخر خطوة في الروتين. يُعاد وضعه كل ساعتين.</li></ol><h2>المساء: الخطوات الثلاث الأولى نفسها</h2><p>غسول، ثم سيروم، ثم مرطب، بهذا الترتيب. واقي الشمس خطوة صباحية، لذلك ينتهي روتين المساء عند الكريم.</p><h2>لماذا يهم الترتيب</h2><p>الترتيب ليس تفصيلاً. كل عبوة تذكر الخطوة التي تليها، فتصطف العبوات الأربع بالطريقة نفسها كل يوم، ويبقى واقي الشمس، خطوة مواجهة النهار، دائماً في النهاية.</p><h2>البداية بخطوات أقل</h2><p>لست مضطراً إلى البدء بالخطوات الأربع. بدايتان سهلتان: الغسول والسيروم (الثنائي الأساسي)، أو السيروم وواقي الشمس (ثنائي الصفاء والحماية). أضف الباقي عندما تكون مستعداً، فالترتيب لا يتغير. ومهما بدأت به، اختم كل صباح بواقي الشمس.</p><p class=\"article__note\"><strong>للعلم:</strong> للاستعمال الخارجي فقط. يُتجنّب ملامسة العينين.</p><p>لست متأكداً من الخطوات التي تحتاجها؟ <a href=\"/ar/pages/routines\">اعثر على روتينك في 30 ثانية</a>.</p>"},
    published_at: '2026-10-27T09:00:00Z',
    image: 'bts-daily-reset-cleanser-routine-scene.jpg',
  },
];

// The seven fixed-price bundles, as created in Shopify (productBundleCreate, 2026-10-12).
export const BUNDLES = [
  { id: 10408389181698, variantId: 50722896281858, handle: 'the-clear-protect-trio', title: 'The Clear & Protect Trio', price: 134900, compare: 139700, sku: 'BTS-SET-DAY', tags: ['bundle', 'rituals'] },
  { id: 10408389083394, variantId: 50722896019714, handle: 'the-full-ritual', title: 'The Full Ritual', price: 169900, compare: 184600, sku: 'BTS-SET-FULL', tags: ['bundle', 'rituals'] },
  { id: 10408389247234, variantId: 50722896347394, handle: 'clear-protect-duo', title: 'Clear & Protect Duo', price: 94900, compare: 99800, sku: 'BTS-SET-CLEAR', tags: ['bundle', 'duos'] },
  { id: 10408389214466, variantId: 50722896314626, handle: 'the-night-ritual', title: 'The Night Ritual', price: 129900, compare: 134700, sku: 'BTS-SET-NIGHT', tags: ['bundle', 'rituals'] },
  { id: 10408389312770, variantId: 50722896412930, handle: 'the-core-duo', title: 'The Core Duo', price: 84900, compare: 89800, sku: 'BTS-SET-CORE', tags: ['bundle', 'duos'] },
  { id: 10408389345538, variantId: 50722896445698, handle: 'spf-stock-up', title: 'SPF Stock-Up', price: 89900, compare: 99800, sku: 'BTS-SET-SPF2', tags: ['bundle', 'stock-up'] },
  { id: 10408389378306, variantId: 50722896478466, handle: 'serum-stock-up', title: 'Serum Stock-Up', price: 89900, compare: 99800, sku: 'BTS-SET-SRM2', tags: ['bundle', 'stock-up'] },
];
