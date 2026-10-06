// Local Shopify-compatible preview for the BTS theme (liquidjs).
// Purpose: visual + interaction QA when the real storefront is unreachable from the build sandbox.
// Not a full Shopify emulator — it implements exactly what this theme uses, and logs anything missing.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Liquid, Tag, Drop, Hash } from 'liquidjs';
import sharp from 'sharp';
import zlib from 'node:zlib';
import { productsFor, ingredientsFor, inciFor, PAGES, PAGE_BODY, ARTICLES } from './fixtures.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const THEME = path.join(ROOT, 'theme');
const IMG_DIRS = [path.join(ROOT, '_source/packshots'), path.join(THEME, 'assets')];
const PORT = Number(process.env.PORT || 4321);
const MONEY = 'LE {{amount}}';
const MONEY_CUR = 'LE {{amount}} EGP';
const missing = new Set();

/* ------------------------------------------------------------------ helpers */
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);
const json = (p) => JSON.parse(read(p));
const schemaOf = (src) => {
  const m = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  return m ? JSON.parse(m[1]) : {};
};
const assetVersion = (name) => {
  const p = path.join(THEME, 'assets', name);
  return exists(p) ? crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex').slice(0, 8) : '0';
};
function formatMoney(cents, fmt = MONEY) {
  const v = (Number(cents) || 0) / 100;
  const s = v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fmt.replace(/\{\{\s*amount\s*\}\}/, s).replace(/\{\{\s*amount_no_decimals\s*\}\}/, s.split('.')[0]);
}
const handleize = (s) => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');

/* ------------------------------------------------------------------ drops */
class Metafield extends Drop {
  constructor(value, type) { super(); this.value = value; this.type = type; }
  valueOf() { return Array.isArray(this.value) ? this.value.join(', ') : this.value; }
  toString() { return String(this.valueOf() ?? ''); }
}
class ImageDrop extends Drop {
  constructor(o) { super(); Object.assign(this, o); this.src = `/img/${o.__image}`; this.aspect_ratio = o.width / o.height; }
  valueOf() { return this.src; }
  toString() { return this.src; }
}
class ImageUrl extends Drop {
  constructor(image, width, height) { super(); this.image = image; this.width = width; this.height = height; }
  get url() { return `${this.image.src}?width=${this.width || ''}`; }
  valueOf() { return this.url; }
  toString() { return this.url; }
}
function toMetafields(obj) {
  const out = {};
  for (const [ns, fields] of Object.entries(obj || {})) {
    out[ns] = {};
    for (const [k, v] of Object.entries(fields)) {
      if (v && v.__image) out[ns][k] = new Metafield(new ImageDrop(v), 'file_reference');
      else out[ns][k] = v == null ? null : new Metafield(v, Array.isArray(v) ? 'list' : typeof v);
    }
  }
  return out;
}

/* ------------------------------------------------------------------ data per request */
function buildData(locale, cart) {
  const prefix = locale === 'ar' ? '/ar' : '';
  const raw = productsFor(locale);
  const products = raw.map((p) => {
    const variant = {
      id: p.variantId, title: 'Default Title', price: p.price, compare_at_price: null, available: true,
      sku: p.sku, inventory_management: null, options: ['Default Title'], option1: 'Default Title',
      url: `${prefix}/products/${p.handle}?variant=${p.variantId}`, featured_media: null,
    };
    const photo = new ImageDrop(p.photo);
    const media = [{ id: p.id * 10, media_type: 'image', alt: p.photo.alt, preview_image: photo, aspect_ratio: photo.aspect_ratio, ...photo, src: photo.src, position: 1 }];
    media[0].valueOf = () => photo.src;
    const prod = {
      ...p,
      url: `${prefix}/products/${p.handle}`,
      variants: [variant], selected_or_first_available_variant: variant, first_available_variant: variant, selected_variant: null,
      has_only_default_variant: true, available: true, price: p.price, price_min: p.price, price_max: p.price, compare_at_price: null,
      options: ['Title'], options_with_values: [{ name: 'Title', values: ['Default Title'], position: 1 }],
      featured_media: media[0], featured_image: photo, images: [photo], media,
      metafields: toMetafields(p.metafields),
      content: p.description, collections: [],
      requires_selling_plan: false, selling_plan_groups: [], gift_card: false,
    };
    variant.product = prod;
    return prod;
  });
  const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
  const byVariant = Object.fromEntries(products.map((p) => [p.variantId, p]));

  // metafield list.product_reference / metaobject references
  const ingredients = ingredientsFor(locale).map((i) => ({
    name: new Metafield(i.name), inci: new Metafield(i.inci), role: new Metafield(i.role),
    products: new Metafield(i.products.map((h) => byHandle[h]).filter(Boolean)), handle: i.id, id: i.id,
  }));
  const ingById = Object.fromEntries(ingredients.map((i) => [i.id, i]));
  // bts_inci: one metaobject per INCI name (content/inci.json)
  const inci = inciFor(locale).map((e) => ({
    handle: e.handle, id: e.handle, system: { handle: e.handle },
    inci: new Metafield(e.inci), name: new Metafield(e.name), group: new Metafield(e.group), description: new Metafield(e.description),
    products: new Metafield(e.products.map((h) => byHandle[h]).filter(Boolean)), key_ingredient: new Metafield(e.key ? ingById[e.key] : null),
  }));
  for (const p of products) {
    const keys = p.metafields.bts.key_ingredients?.value || [];
    p.metafields.bts.key_ingredients = new Metafield(keys.map((k) => ingById[k]).filter(Boolean), 'list.metaobject_reference');
  }

  const all = { id: 1, handle: 'all', title: locale === 'ar' ? 'كل المنتجات' : 'Shop all', url: `${prefix}/collections/all`, products, all_products_count: products.length, products_count: products.length, description: '', image: null, filters: [], sort_options: [], default_sort_by: 'manual', sort_by: '' };
  const collections = { all };

  const pages = Object.fromEntries(Object.entries(PAGES).map(([h, t]) => [h, {
    id: h, handle: h, title: t[locale] || t.en, url: `${prefix}/pages/${h}`,
    content: PAGE_BODY[h]?.[locale] || PAGE_BODY[h]?.en || '', template_suffix: h,
  }]));

  const articles = ARTICLES.map((a, i) => ({
    id: i + 1, handle: a.handle, title: a.title[locale] || a.title.en, excerpt: a.excerpt[locale] || a.excerpt.en,
    content: a.body[locale] || a.body.en, published_at: a.published_at, created_at: a.published_at, image: a.image,
    url: `${prefix}/blogs/journal/${a.handle}`, author: 'Between Two Suns', tags: ['Routine'], comments_enabled: false,
  }));
  const journal = { id: 1, handle: 'journal', title: locale === 'ar' ? 'المجلة' : 'Journal', url: `${prefix}/blogs/journal`, articles, articles_count: articles.length, all_tags: ['Routine'] };

  // cart
  const items = cart.lines.map((l, idx) => {
    const p = byVariant[l.id];
    return {
      id: l.id, key: `${l.id}:k`, quantity: l.quantity, product: p, variant: p.variants[0], title: p.title,
      price: p.price, final_price: p.price, line_price: p.price * l.quantity, final_line_price: p.price * l.quantity, original_line_price: p.price * l.quantity,
      url: p.url, image: p.featured_image, url_to_remove: `${prefix}/cart/change?line=${idx + 1}&quantity=0`,
      line_level_discount_allocations: [], properties: {}, variant_id: l.id, product_id: p.id, sku: p.sku, vendor: p.vendor,
    };
  });
  const cartObj = {
    items, item_count: items.reduce((a, i) => a + i.quantity, 0), total_price: items.reduce((a, i) => a + i.final_line_price, 0),
    items_subtotal_price: items.reduce((a, i) => a + i.final_line_price, 0), original_total_price: items.reduce((a, i) => a + i.final_line_price, 0),
    taxes_included: true, currency: { iso_code: 'EGP' }, cart_level_discount_applications: [], note: '', requires_shipping: true,
  };

  const languages = [
    { iso_code: 'en', name: 'English', endonym_name: 'English', primary: true, root_url: '/' },
    { iso_code: 'ar', name: 'Arabic', endonym_name: 'العربية', primary: false, root_url: '/ar' },
  ];
  const language = languages.find((l) => l.iso_code === locale);
  const routes = {
    root_url: prefix || '/', cart_url: `${prefix}/cart`, cart_add_url: `${prefix}/cart/add`, cart_change_url: `${prefix}/cart/change`,
    cart_update_url: `${prefix}/cart/update`, search_url: `${prefix}/search`, predictive_search_url: `${prefix}/search/suggest`,
    all_products_collection_url: `${prefix}/collections/all`, collections_url: `${prefix}/collections`, account_url: `${prefix}/account`,
    account_login_url: `${prefix}/account/login`, account_register_url: `${prefix}/account/register`, account_logout_url: `${prefix}/account/logout`,
    product_recommendations_url: `${prefix}/recommendations/products`,
  };

  return {
    products, byHandle, byVariant, collections, pages, journal, cartObj, routes, language, languages,
    ingredients, inci,
  };
}

/* ------------------------------------------------------------------ liquid engine */
const engine = new Liquid({
  root: [path.join(THEME, 'snippets')],
  partials: [path.join(THEME, 'snippets')],
  extname: '.liquid',
  jsTruthy: false,
  strictFilters: false,
  strictVariables: false,
  ownPropertyOnly: false,
  dynamicPartials: true,
  cache: false,
});

// Shopify-only tags --------------------------------------------------------
engine.registerTag('schema', class extends Tag {
  constructor(t, rem, liquid) { super(t, rem, liquid); this.tpls = []; const stream = liquid.parser.parseStream(rem); stream.on('tag:endschema', () => stream.stop()).on('template', () => {}).on('end', () => { throw new Error('schema not closed'); }); stream.start(); }
  *render() { return ''; }
});
for (const name of ['stylesheet', 'javascript']) {
  engine.registerTag(name, class extends Tag {
    constructor(t, rem, liquid) { super(t, rem, liquid); const stream = liquid.parser.parseStream(rem); stream.on(`tag:end${name}`, () => stream.stop()).on('template', () => {}).on('end', () => { throw new Error(`${name} not closed`); }); stream.start(); }
    *render() { return ''; }
  });
}
engine.registerTag('style', class extends Tag {
  constructor(t, rem, liquid) { super(t, rem, liquid); this.tpls = []; const stream = liquid.parser.parseStream(rem); stream.on('tag:endstyle', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('style not closed'); }); stream.start(); }
  *render(ctx, emitter) { emitter.write('<style data-shopify>'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); emitter.write('</style>'); }
});
engine.registerTag('layout', class extends Tag { constructor(t, r, l) { super(t, r, l); this.value = t.args.trim(); } *render(ctx) { ctx.environments.__layout = this.value.replace(/['"]/g, ''); return ''; } });

const FORM_ACTIONS = { customer: '/contact#', contact: '/contact#', localization: '/localization', customer_login: '/account/login', create_customer: '/account', recover_customer_password: '/account/recover', storefront_password: '/password', product: '/cart/add', customer_address: '/account/addresses', reset_customer_password: '/account/reset', activate_customer_password: '/account/activate', new_comment: '/blogs/comments' };
engine.registerTag('form', class extends Tag {
  constructor(t, rem, liquid) {
    super(t, rem, liquid);
    const m = t.args.match(/^\s*['"]([^'"]+)['"]\s*(?:,\s*([^,:]+?)(?=\s*,|\s*$))?\s*(?:,(.*))?$/s);
    this.type = m ? m[1] : 'form';
    this.hashStr = m && m[3] ? m[3] : (m && m[2] && m[2].includes(':') ? m[2] : '');
    this.hash = new Hash(this.hashStr);
    this.tpls = [];
    const stream = liquid.parser.parseStream(rem);
    stream.on('tag:endform', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('form not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    const attrs = yield this.hash.render(ctx);
    const prefix = ctx.getSync(['request', 'locale', 'root_url']) === '/ar' ? '/ar' : '';
    let action = FORM_ACTIONS[this.type] || '/';
    if (action.endsWith('#')) action += attrs.id || '';
    action = prefix + action;
    const extra = Object.entries(attrs).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
    emitter.write(`<form method="post" action="${action}" accept-charset="UTF-8" ${extra}><input type="hidden" name="form_type" value="${this.type}"><input type="hidden" name="utf8" value="✓">`);
    ctx.push({ form: { posted_successfully: false, errors: null, id: attrs.id } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
    emitter.write('</form>');
  }
});
engine.registerTag('paginate', class extends Tag {
  constructor(t, rem, liquid) {
    super(t, rem, liquid);
    this.tpls = [];
    const stream = liquid.parser.parseStream(rem);
    stream.on('tag:endpaginate', () => stream.stop()).on('template', (tpl) => this.tpls.push(tpl)).on('end', () => { throw new Error('paginate not closed'); });
    stream.start();
  }
  *render(ctx, emitter) {
    ctx.push({ paginate: { current_page: 1, pages: 1, items: 4, page_size: 24, previous: null, next: null, parts: [] } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  }
});

// Section rendering --------------------------------------------------------
function sectionFile(type) { return path.join(THEME, 'sections', `${type}.liquid`); }
function resolveSetting(def, value, data) {
  if (value === undefined || value === null || value === '') {
    if (def && def.default !== undefined) value = def.default; else return def && ['checkbox'].includes(def.type) ? false : (def && def.type === 'range' ? def.default : null);
  }
  if (!def) return value;
  switch (def.type) {
    case 'collection': return data.collections[value] || null;
    case 'product': return data.byHandle[value] || null;
    case 'blog': return value === 'journal' ? data.journal : null;
    case 'link_list': return null; // store has no custom menus; theme uses bilingual fallbacks
    case 'product_list': return (value || []).map((h) => data.byHandle[h]).filter(Boolean);
    case 'url': return value.startsWith('/') && data.prefix ? data.prefix + value : value;
    default: return value;
  }
}
function buildSection(id, cfg, data) {
  const src = read(sectionFile(cfg.type));
  const schema = schemaOf(src);
  const settings = {};
  for (const def of schema.settings || []) if (def.id) settings[def.id] = resolveSetting(def, cfg.settings?.[def.id], data);
  const blocks = (cfg.block_order || Object.keys(cfg.blocks || {})).map((bid) => {
    const b = cfg.blocks[bid];
    const bdef = (schema.blocks || []).find((x) => x.type === b.type) || { settings: [] };
    const bs = {};
    for (const def of bdef.settings || []) if (def.id) bs[def.id] = resolveSetting(def, b.settings?.[def.id], data);
    return { id: bid, type: b.type, settings: bs, shopify_attributes: '' };
  });
  return { src, schema, section: { id, settings, blocks, block_order: blocks.map((b) => b.id), index: cfg.__index, location: cfg.__location } };
}
async function renderSection(id, cfg, ctxData, data, wrap = true) {
  const { src, schema, section } = buildSection(id, cfg, data);
  const html = await engine.parseAndRender(src.replace(/\.posted_successfully\?/g, '.posted_successfully'), { section }, { globals: ctxData });
  if (!wrap) return html;
  const tag = schema.tag || 'div';
  return `<${tag} id="shopify-section-${id}" class="shopify-section${schema.class ? ' ' + schema.class : ''}">${html}</${tag}>`;
}

// Filters ------------------------------------------------------------------
let currentLocale = 'en';
const locales = { en: json(path.join(THEME, 'locales/en.default.json')), ar: exists(path.join(THEME, 'locales/ar.json')) ? json(path.join(THEME, 'locales/ar.json')) : {} };
function reloadLocales() { locales.en = json(path.join(THEME, 'locales/en.default.json')); if (exists(path.join(THEME, 'locales/ar.json'))) locales.ar = json(path.join(THEME, 'locales/ar.json')); }
function lookup(obj, key) { return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), obj); }
const kv = (args) => Object.fromEntries(args.filter(Array.isArray));

engine.registerFilter('t', function (key, ...args) {
  const vars = kv(args);
  let v = lookup(locales[currentLocale], key);
  if (v === undefined) v = lookup(locales.en, key);
  if (v === undefined) { missing.add(`${currentLocale}:${key}`); return `translation missing: ${key}`; }
  if (typeof v === 'object' && vars.count !== undefined) {
    const n = Number(vars.count);
    v = (n === 0 && v.zero) || (n === 1 && v.one) || (n === 2 && v.two) || v.other || v.many || v.few || '';
  }
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
});
engine.registerFilter('asset_url', (name) => `/assets/${name}?v=${assetVersion(name)}`);
engine.registerFilter('asset_img_url', (name) => `/assets/${name}`);
engine.registerFilter('inline_asset_content', (name) => { const p = path.join(THEME, 'assets', name); return exists(p) ? read(p) : ''; });
engine.registerFilter('stylesheet_tag', (url) => `<link href="${url}" rel="stylesheet" type="text/css" media="all">`);
engine.registerFilter('script_tag', (url) => `<script src="${url}" type="text/javascript"></script>`);
engine.registerFilter('preload_tag', (url, ...args) => { const o = kv(args); return `<link href="${url}" rel="preload"${Object.entries(o).map(([k, v]) => ` ${k}="${v}"`).join('')}>`; });
engine.registerFilter('payment_button', () => '');
engine.registerFilter('money', (c) => formatMoney(c));
engine.registerFilter('money_with_currency', (c) => formatMoney(c, MONEY_CUR));
engine.registerFilter('money_without_currency', (c) => ((Number(c) || 0) / 100).toFixed(2));
engine.registerFilter('money_without_trailing_zeros', (c) => formatMoney(c).replace(/\.00$/, ''));
engine.registerFilter('json', (v) => JSON.stringify(v instanceof Drop ? v.valueOf() : v ?? null).replace(/<\//g, '<\\/'));
engine.registerFilter('handle', handleize);
engine.registerFilter('handleize', handleize);
engine.registerFilter('url_encode', (s) => encodeURIComponent(String(s ?? '')));
engine.registerFilter('url_escape', (s) => encodeURI(String(s ?? '')));
engine.registerFilter('image_url', function (img, ...args) {
  const o = kv(args);
  if (!img) return '';
  if (img instanceof Metafield) img = img.value;
  if (img && img.preview_image) img = img.preview_image;
  if (!(img instanceof ImageDrop)) return String(img);
  return new ImageUrl(img, o.width, o.height);
});
engine.registerFilter('image_tag', function (u, ...args) {
  const o = kv(args);
  if (!(u instanceof ImageUrl)) return '';
  const img = u.image;
  const w = Number(u.width) || img.width;
  const h = Math.round(w / img.aspect_ratio);
  const widths = String(o.widths || '').split(',').map((x) => x.trim()).filter(Boolean);
  const srcset = widths.length ? ` srcset="${widths.map((x) => `${img.src}?width=${x} ${x}w`).join(', ')}"` : '';
  const attrs = { alt: o.alt ?? img.alt ?? '', loading: o.loading, class: o.class, sizes: o.sizes, fetchpriority: o.fetchpriority, id: o.id };
  const extra = Object.entries(attrs).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
  return `<img src="${u.url}"${srcset} width="${w}" height="${h}" ${extra}>`;
});
engine.registerFilter('img_url', (img) => (img && img.src) || '');
engine.registerFilter('placeholder_svg_tag', (name, cls) => `<svg class="${cls || ''}" viewBox="0 0 525 525" xmlns="http://www.w3.org/2000/svg"><rect width="525" height="525"/></svg>`);
engine.registerFilter('payment_type_svg_tag', (t) => `<svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-label="${t}"><rect width="38" height="24" rx="3" fill="#fff"/></svg>`);
engine.registerFilter('time_tag', (d, ...args) => { const dt = new Date(d); return `<time datetime="${dt.toISOString()}">${dt.toLocaleDateString(currentLocale === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time>`; });
engine.registerFilter('link_to', (text, url) => `<a href="${url}">${text}</a>`);
engine.registerFilter('within', (url) => url);
engine.registerFilter('default_errors', () => '');
engine.registerFilter('format_address', () => '');
engine.registerFilter('highlight', (s) => s);
engine.registerFilter('metafield_tag', (m) => String(m ?? ''));
engine.registerFilter('metafield_text', (m) => String(m ?? ''));
engine.registerFilter('structured_data', () => '{}');
engine.registerFilter('newline_to_br', (s) => String(s ?? '').replace(/\n/g, '<br>\n'));
engine.registerFilter('color_to_rgb', (s) => s);
engine.registerFilter('camelize', (s) => String(s).replace(/[-_](\w)/g, (_, c) => c.toUpperCase()));
engine.registerFilter('pluralize', (n, a, b) => (Number(n) === 1 ? a : b));

/* ------------------------------------------------------------------ page rendering */
function globalsFor(locale, data, extra = {}) {
  const settingsData = json(path.join(THEME, 'config/settings_data.json')).current;
  const schema = json(path.join(THEME, 'config/settings_schema.json'));
  const settings = {};
  for (const group of schema) for (const def of group.settings || []) if (def.id) settings[def.id] = resolveSetting(def, settingsData[def.id], data);
  data.prefix = locale === 'ar' ? '/ar' : '';
  return {
    settings,
    shop: {
      name: 'Between Two Suns', description: 'Climate-adapted skincare.', url: `http://localhost:${PORT}`, secure_url: `http://localhost:${PORT}`,
      money_format: MONEY, money_with_currency_format: MONEY_CUR, currency: 'EGP', enabled_payment_types: [], customer_accounts_enabled: true,
      policies: [
        { title: locale === 'ar' ? 'سياسة الاسترداد' : 'Refund policy', url: `${data.prefix}/policies/refund-policy` },
        { title: locale === 'ar' ? 'سياسة الخصوصية' : 'Privacy policy', url: `${data.prefix}/policies/privacy-policy` },
        { title: locale === 'ar' ? 'شروط الخدمة' : 'Terms of service', url: `${data.prefix}/policies/terms-of-service` },
        { title: locale === 'ar' ? 'سياسة الشحن' : 'Shipping policy', url: `${data.prefix}/policies/shipping-policy` },
      ],
      metaobjects: { bts_ingredient: { values: data.ingredients }, bts_inci: { values: data.inci } },
    },
    routes: data.routes,
    localization: { language: data.language, available_languages: data.languages, country: { iso_code: 'EG', name: 'Egypt', currency: { iso_code: 'EGP', symbol: 'LE' } }, available_countries: [] },
    cart: data.cartObj,
    collections: data.collections,
    all_products: data.byHandle,
    pages: data.pages,
    blogs: { journal: data.journal },
    linklists: {},
    customer: null,
    content_for_header: '',
    powered_by_link: '',
    canonical_url: `http://localhost:${PORT}${data.prefix}${extra.path === '/' && data.prefix ? '' : (extra.path || '/')}`,
    page_title: extra.page_title || 'Between Two Suns',
    page_description: extra.page_description || 'Climate-adapted skincare. Made for sun, pollution, changing environments & everyday skin.',
    request: {
      locale: { iso_code: locale, root_url: data.prefix || '/', primary: locale === 'en', endonym_name: data.language.endonym_name, name: data.language.name },
      page_type: extra.page_type || 'index', path: extra.path || '/', design_mode: false, origin: `http://localhost:${PORT}`, host: `localhost:${PORT}`, visual_preview_mode: false,
    },
    template: { name: extra.page_type || 'index', suffix: extra.suffix || null, directory: null },
    current_page: 1,
    ...extra.objects,
  };
}

async function renderTemplate(locale, data, route) {
  currentLocale = locale;
  reloadLocales();
  const g = globalsFor(locale, data, route);
  const tname = route.suffix ? `${route.page_type}.${route.suffix}` : route.page_type;
  let tfile = path.join(THEME, 'templates', `${tname}.json`);
  if (!exists(tfile)) tfile = path.join(THEME, 'templates', `${route.page_type}.json`);
  let content = '';
  let layout = 'theme';
  if (exists(tfile)) {
    const t = json(tfile);
    if (t.layout === false) layout = null; else if (t.layout) layout = t.layout;
    let i = 0;
    for (const key of t.order) {
      const cfg = t.sections[key];
      if (cfg.disabled) continue;
      cfg.__index = ++i;
      cfg.__location = 'template';
      content += await renderSection(`template--${key}`, cfg, g, data);
    }
  } else {
    const lf = path.join(THEME, 'templates', `${route.page_type}.liquid`);
    content = await engine.parseAndRender(read(lf), {}, { globals: g });
  }
  if (!layout) return content;
  return await renderLayout(layout, g, data, content);
}

async function renderGroups(name, g, data) {
  const file = path.join(THEME, 'sections', `${name}.json`);
  if (!exists(file)) return '';
  const grp = json(file);
  let out = '';
  for (const key of grp.order) {
    const cfg = grp.sections[key];
    cfg.__location = name;
    out += (await renderSection(`sections--${name}__${key}`, cfg, g, data)).replace('class="shopify-section', `class="shopify-section shopify-section-group-${name}`);
  }
  return out;
}

async function renderLayout(layout, g, data, content) {
  let src = read(path.join(THEME, 'layout', `${layout}.liquid`));
  // Pre-render section groups + static sections, then substitute tags
  const groups = {};
  for (const m of src.matchAll(/\{%-?\s*sections\s+'([^']+)'\s*-?%\}/g)) groups[m[1]] = await renderGroups(m[1], g, data);
  const statics = {};
  for (const m of src.matchAll(/\{%-?\s*section\s+'([^']+)'\s*-?%\}/g)) statics[m[1]] = await renderSection(m[1], { type: m[1], settings: {} }, g, data);
  src = src.replace(/\{%-?\s*sections\s+'([^']+)'\s*-?%\}/g, (_, n) => `{{ __groups['${n}'] }}`);
  src = src.replace(/\{%-?\s*section\s+'([^']+)'\s*-?%\}/g, (_, n) => `{{ __statics['${n}'] }}`);
  let html = await engine.parseAndRender(src, { __groups: groups, __statics: statics }, { globals: { ...g, content_for_layout: content } });
  html = html.replace('</body>', `<div style="position:fixed;inset-inline-start:8px;inset-block-end:8px;z-index:9999;font:600 10px/1 system-ui;background:#121318;color:#fff;padding:6px 8px;border-radius:6px;opacity:.7;pointer-events:none" data-preview-badge>LOCAL PREVIEW · SAMPLE PRICES</div></body>`);
  return html;
}

/* ------------------------------------------------------------------ cart session */
const carts = new Map();
function getCart(req, res) {
  const m = (req.headers.cookie || '').match(/bts_cart=([a-z0-9]+)/);
  let id = m && m[1];
  if (!id || !carts.has(id)) { id = crypto.randomBytes(8).toString('hex'); carts.set(id, { lines: [] }); res.setHeader('Set-Cookie', `bts_cart=${id}; Path=/; SameSite=Lax`); }
  return carts.get(id);
}
function cartJson(data) {
  const c = data.cartObj;
  return {
    token: 'preview', item_count: c.item_count, total_price: c.total_price, items_subtotal_price: c.items_subtotal_price, currency: 'EGP',
    items: c.items.map((i) => ({ id: i.id, variant_id: i.id, key: i.key, quantity: i.quantity, title: i.title, product_title: i.product.title, price: i.price, line_price: i.line_price, final_line_price: i.final_line_price, url: i.url, handle: i.product.handle })),
  };
}
async function sectionsPayload(names, locale, data, pathName) {
  const g = globalsFor(locale, data, { path: pathName });
  const out = {};
  for (const n of names.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (exists(sectionFile(n))) out[n] = await renderSection(n, { type: n, settings: {} }, g, data);
  }
  return out;
}

/* ------------------------------------------------------------------ router */
function route(pathname, data, query) {
  if (pathname === '/') return { page_type: 'index', path: '/', page_title: 'Between Two Suns — Climate-adapted skincare' };
  let m;
  if ((m = pathname.match(/^\/products\/([^/]+)$/))) {
    const product = data.byHandle[m[1]];
    if (!product) return null;
    return { page_type: 'product', path: pathname, page_title: product.title, page_description: product.metafields.bts.benefit?.value, objects: { product } };
  }
  if ((m = pathname.match(/^\/collections\/([^/]+)$/))) {
    const collection = data.collections[m[1]];
    if (!collection) return null;
    return { page_type: 'collection', path: pathname, page_title: collection.title, objects: { collection } };
  }
  if (pathname === '/collections') return { page_type: 'list-collections', path: pathname, page_title: 'Collections' };
  if ((m = pathname.match(/^\/pages\/([^/]+)$/))) {
    const page = data.pages[m[1]];
    if (!page) return null;
    const suffix = exists(path.join(THEME, 'templates', `page.${m[1]}.json`)) ? m[1] : null;
    return { page_type: 'page', suffix, path: pathname, page_title: page.title, objects: { page } };
  }
  if (pathname === '/blogs/journal') return { page_type: 'blog', path: pathname, page_title: data.journal.title, objects: { blog: data.journal } };
  if ((m = pathname.match(/^\/blogs\/journal\/([^/]+)$/))) {
    const article = data.journal.articles.find((a) => a.handle === m[1]);
    if (!article) return null;
    return { page_type: 'article', path: pathname, page_title: article.title, objects: { article, blog: data.journal } };
  }
  if (pathname === '/cart') return { page_type: 'cart', path: pathname, page_title: 'Cart' };
  if (pathname === '/search') {
    const q = (query.get('q') || '').trim();
    const ql = q.toLowerCase();
    const results = q ? data.products.filter((p) => [p.title, p.metafields.bts.benefit?.value, p.metafields.bts.inci?.value, p.metafields.bts.description?.value, p.type].join(' ').toLowerCase().includes(ql)) : [];
    return { page_type: 'search', path: pathname, page_title: 'Search', objects: { search: { performed: !!q, terms: q, results, results_count: results.length, types: ['product'] } } };
  }
  if (pathname === '/password') return { page_type: 'password', path: pathname, page_title: 'Opening soon' };
  if (pathname === '/account/login') return { page_type: 'customers/login', path: pathname, page_title: 'Log in' };
  if (pathname === '/account/register') return { page_type: 'customers/register', path: pathname, page_title: 'Create account' };
  if (pathname === '/account') return { page_type: 'customers/login', path: pathname, page_title: 'Log in' };
  if ((m = pathname.match(/^\/policies\/([^/]+)$/))) return { page_type: 'page', path: pathname, page_title: m[1], objects: { page: { title: m[1].replace(/-/g, ' '), content: '<p>Shopify renders store policies from Settings → Policies.</p>', handle: m[1] } } };
  return null;
}

const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg' };
const imgCache = new Map();

async function readBody(req) {
  return new Promise((resolve) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => resolve(b)); });
}
function parseForm(body) {
  const p = new URLSearchParams(body);
  const items = [];
  const ids = p.getAll('items[][id]');
  if (ids.length) { const q = p.getAll('items[][quantity]'); ids.forEach((id, i) => items.push({ id: Number(id), quantity: Number(q[i] || 1) })); }
  else if (p.get('id')) items.push({ id: Number(p.get('id')), quantity: Number(p.get('quantity') || 1) });
  return { p, items };
}
function addItems(cart, items, data) {
  for (const it of items) {
    if (!data.byVariant[it.id]) { const e = new Error('Cannot find variant'); e.status = 404; throw e; }
    const line = cart.lines.find((l) => l.id === it.id);
    if (line) line.quantity += it.quantity; else cart.lines.push({ id: it.id, quantity: it.quantity });
  }
}

const server = http.createServer(async (req, res) => {
  // Mirror Shopify CDN behaviour: brotli-compress text responses.
  const origWriteHead = res.writeHead.bind(res);
  const origEnd = res.end.bind(res);
  let ctype = '';
  res.writeHead = (code, headers = {}) => { ctype = headers['Content-Type'] || ''; res._btsCode = code; res._btsHeaders = headers; return res; };
  res.end = (body) => {
    const accepts = /\bbr\b/.test(req.headers['accept-encoding'] || '');
    if (body && accepts && /text|javascript|json|svg/.test(ctype)) {
      const buf = zlib.brotliCompressSync(Buffer.from(body), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 9 } });
      origWriteHead(res._btsCode || 200, { ...res._btsHeaders, 'Content-Encoding': 'br', Vary: 'Accept-Encoding' });
      return origEnd(buf);
    }
    origWriteHead(res._btsCode || 200, res._btsHeaders || {});
    return origEnd(body);
  };
  try {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let pathname = decodeURIComponent(url.pathname);
    let locale = 'en';
    if (pathname === '/ar' || pathname.startsWith('/ar/')) { locale = 'ar'; pathname = pathname.slice(3) || '/'; }

    if (pathname.startsWith('/assets/')) {
      const f = path.join(THEME, 'assets', path.basename(pathname));
      if (!exists(f)) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      return res.end(fs.readFileSync(f));
    }
    if (pathname.startsWith('/img/')) {
      const name = path.basename(pathname);
      const w = Number(url.searchParams.get('width')) || 0;
      const key = `${name}@${w}`;
      if (!imgCache.has(key)) {
        const src = IMG_DIRS.map((d) => path.join(d, name)).find(exists);
        if (!src) { res.writeHead(404); return res.end(); }
        let pipe = sharp(src);
        if (w) pipe = pipe.resize({ width: w, withoutEnlargement: true });
        imgCache.set(key, await pipe.webp({ quality: 82 }).toBuffer());
      }
      res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=3600' });
      return res.end(imgCache.get(key));
    }

    const cart = getCart(req, res);
    let data = buildData(locale, cart);

    // ---- Cart AJAX API
    if (req.method === 'POST' && (pathname === '/cart/add.js' || pathname === '/cart/change.js' || pathname === '/cart/update.js')) {
      const body = JSON.parse((await readBody(req)) || '{}');
      try {
        if (pathname === '/cart/add.js') addItems(cart, body.items || [{ id: body.id, quantity: body.quantity || 1 }], data);
        if (pathname === '/cart/change.js') {
          const idx = Number(body.line) - 1;
          if (cart.lines[idx]) { if (Number(body.quantity) <= 0) cart.lines.splice(idx, 1); else cart.lines[idx].quantity = Number(body.quantity); }
        }
      } catch (e) {
        res.writeHead(e.status || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ status: e.status || 422, message: 'Cart error', description: e.message }));
      }
      data = buildData(locale, cart);
      const payload = cartJson(data);
      if (body.sections) payload.sections = await sectionsPayload(body.sections, locale, data, body.sections_url || '/');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(payload));
    }
    if (pathname === '/cart.js') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(cartJson(data))); }
    if (req.method === 'POST' && pathname === '/cart/add') {
      const { items } = parseForm(await readBody(req));
      addItems(cart, items, data);
      res.writeHead(302, { Location: `${locale === 'ar' ? '/ar' : ''}/cart` });
      return res.end();
    }
    if (pathname === '/cart/change') {
      const idx = Number(url.searchParams.get('line')) - 1;
      const q = Number(url.searchParams.get('quantity'));
      if (cart.lines[idx]) { if (q <= 0) cart.lines.splice(idx, 1); else cart.lines[idx].quantity = q; }
      res.writeHead(302, { Location: `${locale === 'ar' ? '/ar' : ''}/cart` });
      return res.end();
    }
    if (req.method === 'POST' && pathname === '/cart') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end('<!doctype html><title>Checkout</title><p style="font:16px system-ui;padding:40px">Shopify-hosted checkout would open here.</p>');
    }
    if (req.method === 'POST' && pathname === '/localization') {
      const { p } = parseForm(await readBody(req));
      const lang = p.get('language_code');
      let ret = p.get('return_to') || '/';
      ret = ret.replace(/^\/ar(?=\/|$)/, '') || '/';
      res.writeHead(302, { Location: lang === 'ar' ? `/ar${ret === '/' ? '' : ret}` : ret });
      return res.end();
    }
    if (req.method === 'POST' && pathname === '/contact') {
      res.writeHead(302, { Location: `${req.headers.referer || '/'}?customer_posted=true` });
      return res.end();
    }

    // ---- Predictive search
    if (pathname === '/search/suggest') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const products = data.products.filter((p) => [p.title, p.metafields.bts.benefit?.value, p.metafields.bts.inci?.value, p.type].join(' ').toLowerCase().includes(q));
      const pages = Object.values(data.pages).filter((p) => p.title.toLowerCase().includes(q));
      const articles = data.journal.articles.filter((a) => a.title.toLowerCase().includes(q));
      currentLocale = locale;
      const g = globalsFor(locale, data, { path: '/search' });
      g.predictive_search = { performed: true, terms: url.searchParams.get('q'), resources: { products, pages, articles, collections: [], queries: [] } };
      const html = await renderSection('predictive-search', { type: 'predictive-search', settings: {} }, g, data);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // ---- Section Rendering API on any page
    const r = route(pathname, data, url.searchParams);
    if (url.searchParams.get('sections') || url.searchParams.get('section_id')) {
      currentLocale = locale;
      const names = url.searchParams.get('sections') || url.searchParams.get('section_id');
      const payload = await sectionsPayload(names, locale, data, pathname);
      if (url.searchParams.get('section_id')) { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return res.end(Object.values(payload)[0] || ''); }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(payload));
    }

    if (!r) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(await renderTemplate(locale, data, { page_type: '404', path: pathname, page_title: 'Not found' }));
    }
    const html = await renderTemplate(locale, data, r);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(err && err.stack || err));
  }
});

server.listen(PORT, () => console.log(`BTS preview on http://localhost:${PORT}`));
process.on('SIGINT', () => { if (missing.size) console.log('Missing translations:', [...missing]); process.exit(0); });
setInterval(() => { if (missing.size) { console.log('Missing translations:', [...missing].join(', ')); missing.clear(); } }, 5000);
