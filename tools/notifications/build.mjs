// Branded order emails (DECISIONS 292). One source → six Shopify notification templates:
//   order confirmation, shipping confirmation, delivered × English (the template) and Arabic (its translation).
// Output: notifications/<email>.<lang>.liquid (paste into Shopify admin, see notifications/README.md)
// and, with --preview, rendered previews with a sample order in tools/notifications/preview/.
// Usage:  node notifications/build.mjs [--preview]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../notifications');

// Brand (theme settings): ink, the four step colours, the light surface.
const C = { ink: '#20233A', muted: '#565A6D', line: '#E6E7EA', paper: '#F4F5F6', s1: '#7DB993', s2: '#89C3C8', s3: '#D7A6DA', s4: '#FFA37B', ok: '#146C43' };

const T = {
  en: {
    dir: 'ltr', align: 'left', font: "Figtree, 'Helvetica Neue', Helvetica, Arial, sans-serif", display: "Antonio, 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif", caps: 'uppercase',
    tagline: 'fresh skin. always.', made: 'Made in Egypt',
    order: 'Order', view: 'View your order', track: 'Track your order', account: 'Your routine and reorders',
    subtotal: 'Subtotal', discount: 'Discount', shipLabel: 'Shipping', free: 'Free', total: 'Total', qty: 'Qty', to: 'Delivering to',
    cod: 'Paying cash on delivery: please have {{ total_price | money }} ready when it arrives.',
    routineH: 'How to start', am: 'Morning', pm: 'Evening',
    amSteps: 'Cleanse → Treat → Moisturize → Protect', pmSteps: 'Cleanse → Treat → Moisturize', spf: 'Sunscreen is the last step, every morning.',
    help: 'Questions? Just reply to this email, or write to {{ shop.email }}.',
    confirmation: { pre: "We've got your order and we're getting it ready.", title: "We've got your order",
      text: "Thanks{% if customer.first_name %}, {{ customer.first_name }}{% endif %}. We're getting your order ready and we'll email you as soon as it ships." },
    shipping: { pre: 'Your order is on its way.', title: 'Your order is on its way', text: 'Your order {{ order_name }} has left us. Track it any time below.' },
    delivered: { pre: "Your order has arrived. Here's how to start.", title: "It's arrived", text: "Your order {{ order_name }} has been delivered. Here's how to start." },
  },
  ar: {
    dir: 'rtl', align: 'right', font: "Alexandria, Tahoma, 'Segoe UI', Arial, sans-serif", display: "Alexandria, Tahoma, 'Segoe UI', Arial, sans-serif", caps: 'none',
    tagline: 'بشرة منتعشة. دائماً.', made: 'صُنع في مصر',
    order: 'طلب', view: 'متابعة الطلب', track: 'تتبّع الشحنة', account: 'روتينك وإعادة الطلب',
    subtotal: 'المجموع الفرعي', discount: 'الخصم', shipLabel: 'الشحن', free: 'مجاني', total: 'الإجمالي', qty: 'الكمية', to: 'التوصيل إلى',
    cod: 'الدفع عند الاستلام: برجاء تجهيز {{ total_price | money }} وقت الاستلام.',
    routineH: 'ترتيب الروتين', am: 'الصبح', pm: 'بالليل',
    amSteps: 'تنظيف ← سيروم ← ترطيب ← حماية', pmSteps: 'تنظيف ← سيروم ← ترطيب', spf: 'واقي الشمس آخر خطوة كل صبح.',
    help: 'عندك سؤال؟ الرد على الإيميل ده يوصلنا مباشرة، أو على {{ shop.email }}.',
    confirmation: { pre: 'استلمنا طلبك وبنجهّزه دلوقتي.', title: 'استلمنا طلبك',
      text: 'شكرًا{% if customer.first_name %} يا {{ customer.first_name }}{% endif %}. بنجهّز طلبك دلوقتي، وهنبعت إيميل أول ما يتشحن.' },
    shipping: { pre: 'طلبك في الطريق.', title: 'طلبك في الطريق', text: 'طلبك {{ order_name }} خرج من عندنا. تقدر تتابعه من هنا في أي وقت.' },
    delivered: { pre: 'طلبك وصل. وده ترتيب الروتين.', title: 'طلبك وصل', text: 'طلبك {{ order_name }} اتسلّم. وده ترتيب الروتين:' },
  },
};

const bar = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr>${[C.s1, C.s2, C.s3, C.s4].map((c) => `<td height="6" style="height:6px;line-height:6px;font-size:0;background:${c}">&nbsp;</td>`).join('')}</tr></table>`;
const button = (t, href, label) => `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0 0"><tr><td style="border-radius:999px;background:${C.ink}"><a href="${href}" style="display:inline-block;padding:15px 28px;font-family:${t.font};font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a></td></tr></table>`;
const dot = (c) => `<span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${c};vertical-align:middle"></span>`;

const routine = (t, strong) => `
<tr><td style="padding:${strong ? '8px' : '32px'} 24px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:${C.paper};border-radius:18px"><tr><td style="padding:22px 24px">
    <p style="margin:0 0 14px;font-family:${t.font};font-size:12px;font-weight:700;letter-spacing:${t.caps === 'none' ? '0' : '.14em'};text-transform:${t.caps};color:${C.muted}">${t.routineH}</p>
    <p style="margin:0 0 6px;font-family:${t.font};font-size:16px;line-height:1.5;color:${C.ink}">${dot(C.s1)} ${dot(C.s2)} ${dot(C.s3)} ${dot(C.s4)}&nbsp;&nbsp;<strong>${t.am}:</strong> ${t.amSteps}</p>
    <p style="margin:0 0 12px;font-family:${t.font};font-size:16px;line-height:1.5;color:${C.ink}">${dot(C.s1)} ${dot(C.s2)} ${dot(C.s3)} <span style="display:inline-block;width:10px"></span>&nbsp;&nbsp;<strong>${t.pm}:</strong> ${t.pmSteps}</p>
    <p style="margin:0;font-family:${t.font};font-size:14px;line-height:1.5;color:${C.muted}">${t.spf}</p>
  </td></tr></table>
</td></tr>`;

// Line items: order confirmation loops the order's lines; shipping/delivered loop what was in this fulfillment.
const items = (t, kind) => {
  const loop = kind === 'confirmation' ? '{% for line in subtotal_line_items %}' : '{% for f in fulfillment.fulfillment_line_items %}{% assign line = f.line_item %}{% assign qty = f.quantity %}';
  const qty = kind === 'confirmation' ? '{{ line.quantity }}' : '{{ qty }}';
  const price = kind === 'confirmation' ? `<td valign="middle" style="padding:12px 0;font-family:${t.font};font-size:15px;font-weight:700;color:${C.ink};text-align:${t.dir === 'rtl' ? 'left' : 'right'};white-space:nowrap">{{ line.final_line_price | money }}</td>` : '';
  return `
<tr><td style="padding:28px 24px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${loop}
    <tr style="border-bottom:1px solid ${C.line}">
      <td width="64" valign="middle" style="padding:12px 0;width:64px">{% if line.image %}<img src="{{ line.image | img_url: 'compact_cropped' }}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:12px;background:${C.paper};object-fit:cover">{% endif %}</td>
      <td valign="middle" style="padding:12px ${t.dir === 'rtl' ? '0 12px 0 12px' : '12px 0 12px 12px'};font-family:${t.font};font-size:15px;line-height:1.4;color:${C.ink}"><strong>{{ line.title }}</strong><br><span style="font-size:13px;color:${C.muted}">${t.qty}: ${qty}</span></td>
      ${price}
    </tr>
    {% endfor %}
  </table>
</td></tr>`;
};

const row = (t, label, value, bold) => `<tr><td style="padding:4px 0;font-family:${t.font};font-size:${bold ? 17 : 15}px;${bold ? 'font-weight:800;' : ''}color:${bold ? C.ink : C.muted}">${label}</td><td style="padding:4px 0;font-family:${t.font};font-size:${bold ? 17 : 15}px;font-weight:${bold ? 800 : 600};color:${C.ink};text-align:${t.dir === 'rtl' ? 'left' : 'right'};white-space:nowrap">${value}</td></tr>`;
const totals = (t) => `
<tr><td style="padding:16px 24px 0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    ${row(t, t.subtotal, '{{ subtotal_price | money }}')}
    {% if total_discounts > 0 %}${row(t, t.discount, `<span style="color:${C.ok}">−{{ total_discounts | money }}</span>`)}{% endif %}
    ${row(t, t.shipLabel, `{% if shipping_price == 0 %}<span style="color:${C.ok}">${t.free}</span>{% else %}{{ shipping_price | money }}{% endif %}`)}
    <tr><td colspan="2" style="padding-top:8px;border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr>
    ${row(t, t.total, '{{ total_price | money }}', true)}
  </table>
</td></tr>`;

const cod = (t, kind) => kind === 'confirmation'
  ? `{% assign bts_cod = false %}{% for tr in transactions %}{% assign g = tr.gateway | downcase %}{% if g contains 'cash' %}{% assign bts_cod = true %}{% endif %}{% endfor %}
{% if bts_cod %}<tr><td style="padding:16px 24px 0"><p style="margin:0;padding:14px 18px;border-radius:14px;background:#FFF1E8;font-family:${t.font};font-size:15px;line-height:1.5;color:${C.ink}">${t.cod}</p></td></tr>{% endif %}`
  : `{% if financial_status == 'pending' %}<tr><td style="padding:16px 24px 0"><p style="margin:0;padding:14px 18px;border-radius:14px;background:#FFF1E8;font-family:${t.font};font-size:15px;line-height:1.5;color:${C.ink}">${t.cod}</p></td></tr>{% endif %}`;

// each address line keeps its own direction (an English street in an Arabic email, or the reverse)
const address = (t) => `{% if shipping_address %}<tr><td style="padding:24px 24px 0;font-family:${t.font};font-size:14px;line-height:1.55;color:${C.muted}"><strong style="color:${C.ink}">${t.to}</strong><br><span dir="auto">{{ shipping_address.name }}</span><br><span dir="auto">{{ shipping_address.address1 }}{% if shipping_address.address2 != blank %}, {{ shipping_address.address2 }}{% endif %}</span><br><span dir="auto">{{ shipping_address.city }}{% if shipping_address.province != blank %}, {{ shipping_address.province }}{% endif %}</span></td></tr>{% endif %}`;

function email(kind, lang) {
  const t = T[lang]; const k = t[kind];
  const cta = kind === 'confirmation' ? button(t, '{{ order_status_url }}', t.view)
    : kind === 'shipping' ? `{% if fulfillment.tracking_urls.size > 0 %}${button(t, '{{ fulfillment.tracking_urls.first }}', t.track)}{% else %}${button(t, '{{ order_status_url }}', t.track)}{% endif %}`
    : button(t, '{{ shop.url }}/pages/account', t.account);
  const body = kind === 'delivered'
    ? routine(t, true) + items(t, kind)
    : items(t, kind) + (kind === 'confirmation' ? totals(t) : '') + cod(t, kind) + (kind === 'confirmation' ? address(t) : '') + routine(t, false);
  return `{%- comment -%} Between Two Suns · ${kind} · ${lang === 'en' ? 'English (the template)' : 'Arabic (paste as the Arabic translation)'} · generated by tools/notifications/build.mjs (DECISIONS 292): edit there, not here. {%- endcomment -%}
<!doctype html>
<html lang="${lang}" dir="${t.dir}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=Figtree:wght@400;700;800&family=Alexandria:wght@400;700;800&display=swap" rel="stylesheet">
<title>${k.title}</title>
<style>@media (max-width:620px){ .bts-wrap{width:100%!important} .bts-title{font-size:44px!important} }</style>
</head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${k.pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#ffffff"><tr><td align="center" style="padding:0">
<table role="presentation" class="bts-wrap" width="600" cellpadding="0" cellspacing="0" dir="${t.dir}" style="border-collapse:collapse;width:600px;max-width:600px;text-align:${t.align}">
<tr><td>${bar}</td></tr>
<tr><td align="center" style="padding:36px 24px 8px">{% if shop.email_logo_url %}<img src="{{ shop.email_logo_url }}" width="{{ shop.email_logo_width | default: 120 }}" alt="{{ shop.name }}" style="display:block;height:auto;border:0">{% else %}<span style="font-family:${T.en.display};font-size:28px;font-weight:800;letter-spacing:.02em;line-height:.9;color:${C.ink};text-transform:uppercase">Between<br>Two Suns</span>{% endif %}</td></tr>
<tr><td class="bts-pad" style="padding:28px 24px 0">
  <h1 class="bts-title" style="margin:0;font-family:${t.display};font-size:${t.dir === 'rtl' ? 40 : 54}px;line-height:${t.dir === 'rtl' ? '1.3' : '.95'};font-weight:${t.dir === 'rtl' ? 800 : 700};letter-spacing:0;text-transform:${t.caps};color:${C.ink}">${k.title}</h1>
  <p style="margin:16px 0 0;font-family:${t.font};font-size:17px;line-height:1.55;color:${C.ink}">${k.text}</p>
  ${kind !== 'confirmation' ? '' : `<p style="margin:12px 0 0;font-family:${t.font};font-size:14px;color:${C.muted}">${t.order} {{ order_name }}</p>`}
  ${cta}
</td></tr>
${body}
<tr><td style="padding:32px 24px 0;font-family:${t.font};font-size:14px;line-height:1.6;color:${C.muted}">${t.help}</td></tr>
<tr><td style="padding:32px 24px 40px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid ${C.line}"><tr><td style="padding-top:20px;font-family:${t.font};font-size:13px;line-height:1.6;color:${C.muted}"><strong style="color:${C.ink}">${t.tagline}</strong><br>Between Two Suns · ${t.made}</td></tr></table></td></tr>
<tr><td>${bar}</td></tr>
</table>
</td></tr></table>
</body>
</html>
`;
}

// Arabic: order numbers and amounts stay left-to-right inside the Arabic text ("#1042", "−EGP 75", not "1042#", "EGP 75−")
const isolate = (html) => html.replace(/\{\{ order_name \}\}/g, '<span dir="ltr">{{ order_name }}</span>').replace(/(−?\{\{ [a-z_.]+ \| money \}\})/g, '<span dir="ltr">$1</span>');
fs.mkdirSync(OUT, { recursive: true });
const NAMES = { confirmation: 'order-confirmation', shipping: 'shipping-confirmation', delivered: 'delivered' };
for (const kind of Object.keys(NAMES)) for (const lang of ['en', 'ar']) fs.writeFileSync(path.join(OUT, `${NAMES[kind]}.${lang}.liquid`), lang === 'ar' ? isolate(email(kind, lang)) : email(kind, lang));
console.log('wrote', fs.readdirSync(OUT).filter((f) => f.endsWith('.liquid')).length, 'templates to', OUT);

// --preview: render each template with a sample order (Liquid + Shopify's notification filters, stubbed)
if (process.argv.includes('--preview')) {
  const { Liquid } = await import('liquidjs');
  const engine = new Liquid();
  engine.registerFilter('money', (v) => `EGP ${(Number(v) / 100).toLocaleString('en-US')}`);
  engine.registerFilter('img_url', (img) => img);
  const PV = path.join(HERE, 'preview'); fs.mkdirSync(PV, { recursive: true });
  // sample photos come from the local preview server (node preview/server.js)
  const IMG = process.env.IMG_BASE || 'http://localhost:4321/img';
  const lines = [
    { title: 'The Full Ritual', quantity: 1, final_line_price: 169900, image: `${IMG}/bts-the-full-ritual.jpg?width=160` },
    { title: 'Clarity Serum', quantity: 1, final_line_price: 49900, image: `${IMG}/bts-clarity-serum-studio.jpg?width=160` },
  ];
  const data = {
    shop: { name: 'Between Two Suns', email: 'hello@betweentwosuns.co', url: 'https://betweentwosuns.co', email_logo_url: process.env.LOGO || '' },
    customer: { first_name: 'Nour' }, order_name: '#1042', order_status_url: '#',
    subtotal_line_items: lines, subtotal_price: 219800, total_discounts: 7500, shipping_price: 0, total_price: 212300,
    transactions: [{ gateway: 'Cash on Delivery (COD)' }], financial_status: 'pending',
    shipping_address: { name: 'Nour Hassan', address1: '12 Street 90', address2: 'Apartment 4', city: 'New Cairo', province: 'Cairo' },
    fulfillment: { fulfillment_line_items: lines.map((l) => ({ line_item: l, quantity: l.quantity })), tracking_urls: ['#'] },
  };
  for (const f of fs.readdirSync(OUT).filter((x) => x.endsWith('.liquid'))) {
    const html = await engine.parseAndRender(fs.readFileSync(path.join(OUT, f), 'utf8'), data);
    fs.writeFileSync(path.join(PV, f.replace('.liquid', '.html')), html);
  }
  console.log('previews in', PV);
}
