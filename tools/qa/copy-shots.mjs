// Per-section phone shots for copy before/after (DECISIONS 294): node qa/copy-shots.mjs <outdir>  (PAGES=/,/products/clarity-serum by default)
// Make a before set by checking out the old theme/ (git checkout <commit> -- theme content), restarting the preview, shooting, then restoring.
import { chromium } from 'playwright';
import fs from 'fs';
const O=process.argv[2]; fs.mkdirSync(O,{recursive:true});
const PAGES=(process.env.PAGES||'/,/products/clarity-serum').split(',');
const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {});
for (const loc of ['','/ar']) {
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:Number(process.env.DSF||1)});
  await ctx.addInitScript(()=>{try{localStorage.setItem('bts:welcome','seen')}catch(e){}});
  const p=await ctx.newPage();
  for (const u of PAGES) {
    await p.goto('http://localhost:4321'+(u==='/'&&loc?loc:loc+u),{waitUntil:'networkidle'});
    await p.addStyleTag({content:'*{animation-duration:0s!important;animation-delay:0s!important;transition:none!important} [data-preview-badge],.dock{visibility:hidden!important} .pdp-sticky,.sticky-atc,[class*=sticky-bar]{visibility:hidden!important} [data-reveal],.reveal{opacity:1!important;transform:none!important} .site-header-wrap,.shopify-section-group-header-group{position:static!important}'});
    await p.evaluate(async()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager'); for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} scrollTo(0,0);});
    await p.waitForTimeout(800);
    const secs=await p.evaluate(()=>[...document.querySelectorAll('header .announcement, .shopify-section-group-header-group, main > .shopify-section, footer')].map(s=>{const r=s.getBoundingClientRect();return {id:(s.id||s.className||'x').replace('shopify-section-','').replace(/\s.*/,'').slice(0,40),y:r.top+scrollY,h:r.height};}).filter(s=>s.h>0));
    const slug=u==='/'?'home':u.split('/').pop();
    for (const s of secs) { await p.evaluate(y=>scrollTo(0,Math.max(0,y-120)),s.y); await p.waitForTimeout(1300); await p.screenshot({path:`${O}/${loc?'ar':'en'}-${slug}-${s.id}.png`,clip:{x:0,y:s.y,width:390,height:Math.min(s.h,3000)},fullPage:true}); }
    console.log(loc||'en',slug,secs.map(s=>s.id+':'+Math.round(s.h)).join(' '));
  }
  await ctx.close();
}
await b.close();
