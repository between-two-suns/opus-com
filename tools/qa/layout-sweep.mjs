// Layout sweep (DECISIONS 296): with the local preview up, node qa/layout-sweep.mjs
// Every real page, phone 390 + laptop 1440, EN + AR: sideways scroll, buttons whose visible text wraps to 2 lines,
// phone headings over 3 lines, text overflowing its box. Prints only problems; no output = clean.
import { chromium } from 'playwright';
import fs from 'node:fs';
const PAGES=['/','/collections/all','/pages/sets','/products/daily-reset-cleanser','/products/clarity-serum','/products/daily-barrier-moisturizing-cream','/products/daily-defense-sunscreen-spf-50','/products/the-full-ritual','/products/the-core-duo','/products/spf-stock-up','/pages/about','/pages/climate','/pages/ingredients','/pages/faq','/pages/contact','/pages/routines','/pages/skin-check','/pages/scan','/pages/creators','/pages/shipping','/pages/returns','/pages/account','/cart','/search?q=serum','/404','/blogs/journal','/blogs/journal/how-to-layer-a-four-step-routine'];
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
for (const [w,h] of [[390,844],[1440,900]]) for (const loc of ['','/ar']) {
  const ctx=await b.newContext({viewport:{width:w,height:h}}); await ctx.addInitScript(()=>{try{localStorage.setItem('bts:welcome','seen')}catch(e){}});
  const p=await ctx.newPage();
  for (const u of PAGES) {
    try { await p.goto('http://localhost:4321'+(u==='/'&&loc?loc:loc+u),{waitUntil:'networkidle',timeout:30000}); } catch(e) { console.log('ERR',u); continue; }
    await p.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
    const r=await p.evaluate((w)=>{
      const out=[]; const vis=e=>{const s=getComputedStyle(e);const r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0&&!e.closest('[hidden],[aria-hidden=true],dialog:not([open]),.visually-hidden')};
      const nm=e=>(e.tagName.toLowerCase()+'.'+[...e.classList].slice(0,2).join('.')).slice(0,40)+' "'+e.textContent.trim().replace(/\s+/g,' ').slice(0,50)+'"';
      if (document.documentElement.scrollWidth>innerWidth+1) out.push('HSCROLL '+document.documentElement.scrollWidth);
      for (const e of document.querySelectorAll('main .btn, main a.hh-btn, footer .btn')) { if(!vis(e))continue; const tops=[]; const tw=document.createTreeWalker(e,NodeFilter.SHOW_TEXT); let t; while(t=tw.nextNode()){ if(!t.textContent.trim())continue; const pe=t.parentElement; if(pe.closest('.visually-hidden,[hidden],[aria-hidden=true]')||getComputedStyle(pe).display==='none')continue; const rg=document.createRange(); rg.selectNodeContents(t); for(const x of rg.getClientRects()) if(x.width>2) tops.push(Math.round(x.top/6)); } if(new Set(tops).size>1) out.push('BTN2LINES '+nm(e)); }
      if (w<500) for (const e of document.querySelectorAll('main h1, main h2')) { if(!vis(e))continue; const lh=parseFloat(getComputedStyle(e).lineHeight)||parseFloat(getComputedStyle(e).fontSize)*1.2; const n=Math.round(e.getBoundingClientRect().height/lh); if(n>3) out.push('H'+n+'LINES '+nm(e)); }
      for (const e of document.querySelectorAll('main *, header *, footer *')) { if(!vis(e)||e.children.length) continue; const s=getComputedStyle(e); if(s.overflow==='visible' && e.scrollWidth>e.clientWidth+2 && e.clientWidth>0 && s.display!=='inline' && e.textContent.trim()) out.push('OVERFLOW '+nm(e)+' '+e.scrollWidth+'>'+e.clientWidth); }
      return [...new Set(out)].slice(0,12);
    },w);
    if (r.length) console.log(`${w} ${loc||'en'} ${u}\n  `+r.join('\n  '));
  }
  await ctx.close();
}
await b.close();
