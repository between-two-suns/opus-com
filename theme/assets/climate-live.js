/* Live conditions for the climate switch (DECISIONS 288, demo).
   On with the section setting or ?live in the address. Fetches today's UV, top temperature, humidity and dust for the
   chosen city from Open-Meteo (from the visitor's browser, no key, no location permission), writes one line of facts,
   and selects the day's main condition so the steps and the add button already match the day. Nothing shows until real
   numbers arrive; if a request fails the block stays the manual switch it always was. */
const CACHE_MIN = 30;
const KEY_CITY = 'bts:city';
const store = {
  get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
  set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) { /* private mode: fine */ } },
};

// Which condition leads today: each scored 0 → ~1 on plain thresholds (no skin claims, just the weather).
const pick = ({ uv, tmax, rh, dust, pm10 }) => {
  const score = {
    sun: uv / 10,
    city: Math.max(dust / 150, pm10 / 180),
    humidity: (rh - 45) / 35,
    heat: (tmax - 29) / 9,
    ac: ((tmax - 27) / 12) * 0.85, // hot days are air-conditioned days indoors
  };
  return Object.entries(score).sort((a, b) => b[1] - a[1])[0][0];
};
const dustLevel = (pm10) => (pm10 < 50 ? 0 : pm10 < 100 ? 1 : pm10 < 250 ? 2 : 3);

async function conditions(lat, lon) {
  const ck = `bts:wx:${lat},${lon}`;
  const hit = store.get(ck, sessionStorage);
  if (hit) { const c = JSON.parse(hit); if (Date.now() - c.at < CACHE_MIN * 60e3) return c.v; }
  const q = `latitude=${lat}&longitude=${lon}&timezone=Africa%2FCairo`;
  const [wx, air] = await Promise.all([
    fetch(`https://api.open-meteo.com/v1/forecast?${q}&current=temperature_2m,relative_humidity_2m&daily=uv_index_max,temperature_2m_max&forecast_days=1`).then((r) => r.json()),
    fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=pm10,dust`).then((r) => r.json()),
  ]);
  if (wx.error || air.error || !wx.current || !wx.daily) throw new Error('weather unavailable');
  const v = {
    temp: Math.round(wx.current.temperature_2m), rh: Math.round(wx.current.relative_humidity_2m),
    uv: Math.round(wx.daily.uv_index_max[0]), tmax: wx.daily.temperature_2m_max[0],
    dust: air.current?.dust ?? 0, pm10: air.current?.pm10 ?? 0,
  };
  store.set(ck, JSON.stringify({ at: Date.now(), v }), sessionStorage);
  return v;
}

async function init(live) {
  if (live.dataset.ready) return;
  live.dataset.ready = '1';
  if (!('on' in live.dataset) && !/[?&]live\b/.test(location.search)) return;
  await customElements.whenDefined('climate-switch');
  const cs = live.closest('climate-switch');
  const select = live.querySelector('[data-city]');
  const facts = live.querySelector('[data-facts]');
  const levels = (live.dataset.sLevels || '').split('|');
  // Liquid filled the placeholder with __V__. Numbers (with their %) are isolated left-to-right, so Arabic shows "30%", not "%30".
  const fill = (t, v) => { t = t || ''; return t.includes('__V__%') ? t.replace('__V__%', `\u2066${v}%\u2069`) : t.replace('__V__', /^\d/.test(String(v)) ? `\u2066${v}\u2069` : v); };
  const saved = store.get(KEY_CITY);
  if (saved && [...select.options].some((o) => o.value === saved)) select.value = saved;

  const nameEl = live.querySelector('[data-city-name]');
  const run = async () => {
    const [lat, lon] = select.value.split(',');
    if (nameEl) nameEl.textContent = select.selectedOptions[0]?.textContent || '';
    live.setAttribute('aria-busy', 'true');
    try {
      const v = await conditions(lat, lon);
      facts.textContent = [
        `\u2066${v.temp}°\u2069`,
        fill(live.dataset.sUv, v.uv),
        fill(live.dataset.sHum, v.rh),
        fill(live.dataset.sDust, levels[dustLevel(v.pm10)] || ''),
      ].join(' · ');
      const c = pick(v);
      cs.querySelectorAll('.cs__today').forEach((t) => { t.hidden = t.closest('.cs__opt')?.dataset.c !== c; });
      cs.set?.(c);
      live.hidden = false;
    } catch (e) {
      live.hidden = true; // the switch keeps working by hand
    } finally {
      live.removeAttribute('aria-busy');
    }
  };
  select.addEventListener('change', () => { store.set(KEY_CITY, select.value); run(); });
  run();
}

document.querySelectorAll('[data-live]').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('[data-live]').forEach(init));
