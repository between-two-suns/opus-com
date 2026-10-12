/* WELCOME75 card: shows once per visitor after a real pause (15s on the page, or half-way down it),
   never over an open bag/menu and never while someone is typing. It does not take focus unless the
   visitor just submitted it. After sign-up it shows the shared code, with copy and apply-to-bag. */
const KEY = 'bts:welcome';
const store = {
  get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
  set(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* private mode: show again next visit, that's fine */ } },
};

class WelcomeOffer extends HTMLElement {
  connectedCallback() {
    this.card = this.querySelector('.welcome__card');
    this.querySelectorAll('[data-welcome-close]').forEach((b) => b.addEventListener('click', () => this.close()));
    this.addEventListener('keydown', (e) => { if (e.key === 'Escape') { e.stopPropagation(); this.close(); } });
    this.querySelector('[data-welcome-copy]')?.addEventListener('click', (e) => this.copy(e.currentTarget));
    this.querySelector('[data-welcome-apply]')?.addEventListener('click', (e) => this.apply(e.currentTarget));

    const success = this.querySelector('[data-welcome-success]');
    const error = this.querySelector('[data-welcome-error]');
    // Shopify marks every newsletter form on the page as posted, so a footer sign-up also reveals the code here.
    if (success) { store.set('done'); this.open(); this.querySelector('#WelcomeTitle')?.focus({ preventScroll: true }); return; }
    if (error) { this.open(); error.focus({ preventScroll: true }); return; }
    if (store.get()) return;
    this.arm();
  }

  arm() {
    const t0 = performance.now();
    const fire = () => { cleanup(); this.tryShow(); };
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && scrollY / max > 0.5 && performance.now() - t0 > 5000) fire();
    };
    const timer = setTimeout(fire, 15000);
    const cleanup = () => { clearTimeout(timer); removeEventListener('scroll', onScroll); };
    addEventListener('scroll', onScroll, { passive: true });
  }

  busy() {
    const a = document.activeElement;
    const typing = a && a.matches?.('input, textarea, select, [contenteditable="true"]');
    const overlay = document.querySelector('dialog[open]');
    return typing || !!overlay;
  }

  tryShow() {
    if (store.get()) return;
    if (this.busy()) { setTimeout(() => this.tryShow(), 8000); return; }
    store.set('seen');
    this.open();
  }

  open() {
    this.hidden = false;
    requestAnimationFrame(() => this.classList.add('is-in'));
  }

  close() {
    const hadFocus = this.contains(document.activeElement);
    this.classList.remove('is-in');
    const done = () => { this.hidden = true; };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) done();
    else setTimeout(done, 320);
    if (!store.get()) store.set('seen');
    if (hadFocus) document.getElementById('main')?.focus({ preventScroll: true });
  }

  flip(btn) {
    btn.querySelector('[data-label-default]')?.setAttribute('hidden', '');
    btn.querySelector('[data-label-done]')?.removeAttribute('hidden');
  }

  say(msg) { const s = this.querySelector('[data-welcome-status]'); if (s) s.textContent = msg; }

  async copy(btn) {
    const code = this.dataset.code;
    try { await navigator.clipboard.writeText(code); }
    catch (e) {
      const el = this.querySelector('[data-welcome-code]');
      const r = document.createRange(); r.selectNodeContents(el);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
    }
    this.flip(btn);
    this.say(btn.querySelector('[data-label-done]')?.textContent || '');
  }

  async apply(btn) {
    const root = window.Shopify?.routes?.root || '/';
    btn.classList.add('is-loading');
    try {
      await fetch(`${root}discount/${encodeURIComponent(this.dataset.code)}`, { credentials: 'same-origin' });
      this.flip(btn);
      btn.disabled = true;
      this.say(btn.querySelector('[data-label-done]')?.textContent || '');
    } catch (e) { /* the code is still shown to copy */ }
    btn.classList.remove('is-loading');
  }
}
if (!customElements.get('welcome-offer')) customElements.define('welcome-offer', WelcomeOffer);
