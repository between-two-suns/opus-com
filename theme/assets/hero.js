/* Signature 1 · The Space Between.
   1. Scroll parting: browsers with CSS scroll-driven animations do this in CSS (home.css);
      elsewhere we drive one custom property (--p) with rAF while the hero is visible.
   2. Light field: a small WebGL shader that turns the two CSS suns into living light
      (slow drift, heat haze, grain, tint toward a product's colour on hover).
      Progressive: starts after load, only with motion allowed, falls back to the CSS suns. */

const FRAG = `
precision mediump float;
uniform vec2 r;uniform float t,p,d,ta;uniform vec2 m;uniform vec3 tc;
float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 q){float v=0.,a=.5;for(int k=0;k<4;k++){v+=a*n(q);q*=2.03;a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/r;float as=r.x/r.y;vec2 q=vec2(uv.x*as,uv.y);
  vec2 w=vec2(fbm(q*1.7+t*.035),fbm(q*1.7-t*.03+7.3))-.5;q+=w*.16;
  float R=max(as,1.)*.9;
  vec2 a=vec2(.5*as-d*(.46*as+p*.2*as),1.05+p*.14)+vec2(sin(t*.07),cos(t*.05))*.035+m*.05;
  vec2 b=vec2(.5*as+d*(.46*as+p*.2*as),-.08-p*.12)+vec2(cos(t*.06),sin(t*.08))*.035-m*.05;
  float sa=smoothstep(R,0.,length(q-a)),sb=smoothstep(R*.92,0.,length(q-b));
  vec3 col=mix(vec3(.965,.969,.957),vec3(1.,.96,.925),uv.y*.7);
  col=mix(col,mix(vec3(1.,.71,.56),vec3(1.,.89,.81),sa*sa),pow(sa,1.5)*.96);
  col=mix(col,mix(vec3(.62,.82,.84),vec3(.87,.94,.95),sb*sb),pow(sb,1.5)*.9);
  col=mix(col,mix(col,tc,.42),ta*pow(sb,1.1)+ta*.25*pow(sa,2.));
  col+=(h(gl_FragCoord.xy+fract(t*7.))-.5)*.03;
  gl_FragColor=vec4(col,1.);
}`;
const VERT = 'attribute vec2 v;void main(){gl_Position=vec4(v,0.,1.);}';

class SpaceBetween extends HTMLElement {
  connectedCallback() {
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!this.classList.contains('hero--motion') || this.reduce.matches) return;
    if (!CSS.supports('animation-timeline: scroll()')) this.scrollFallback();
    const start = () => ('requestIdleCallback' in window ? requestIdleCallback(() => this.lightField(), { timeout: 1500 }) : setTimeout(() => this.lightField(), 300));
    if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
  }

  scrollFallback() {
    let ticking = false;
    let visible = true;
    const update = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9)));
      this.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) onScroll(); }).observe(this);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  lightField() {
    if (navigator.connection?.saveData) return;
    const host = this.querySelector('.suns');
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__field';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
    if (!gl || !host) return;
    // No GPU, no light field: software rasterisers would spend the main thread on decoration.
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return;

    const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const fs = shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'v');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(['r', 't', 'p', 'd', 'ta', 'm', 'tc'].map((k) => [k, gl.getUniformLocation(prog, k)]));
    gl.uniform1f(u.d, document.documentElement.dir === 'rtl' ? -1 : 1);

    // Render below CSS resolution: the field is soft by nature, so 0.6× is invisible and cheap.
    const resize = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.6;
      canvas.width = Math.max(2, Math.round(host.clientWidth * scale));
      canvas.height = Math.max(2, Math.round(host.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(u.r, canvas.width, canvas.height);
    };
    new ResizeObserver(resize).observe(host);
    resize();

    // Pointer drift (fine pointers only) and product tint, both eased in the loop.
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    if (window.matchMedia('(pointer: fine)').matches) {
      this.addEventListener('pointermove', (e) => {
        const b = this.getBoundingClientRect();
        ptr.tx = (e.clientX - b.left) / b.width - 0.5;
        ptr.ty = 0.5 - (e.clientY - b.top) / b.height;
      });
    }
    const tint = { amt: 0, target: 0, rgb: [1, 1, 1] };
    const toRgb = (css) => { const c = document.createElement('canvas').getContext('2d'); c.fillStyle = css; c.fillRect(0, 0, 1, 1); return [...c.getImageData(0, 0, 1, 1).data].slice(0, 3).map((v) => v / 255); };
    this.querySelectorAll('.hero__product-link').forEach((link) => {
      const on = () => { tint.rgb = toRgb(getComputedStyle(link.closest('[data-step]')).getPropertyValue('--sku').trim() || '#fff'); tint.target = 1; };
      const off = () => { tint.target = 0; };
      link.addEventListener('pointerenter', on); link.addEventListener('focus', on);
      link.addEventListener('pointerleave', off); link.addEventListener('blur', off);
    });

    let visible = true;
    let raf = 0;
    let shown = false;
    let last = 0;
    const minFrame = window.matchMedia('(pointer: coarse)').matches ? 1000 / 30 : 0; // touch devices: 30 fps
    const t0 = performance.now();
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last < minFrame) { raf = requestAnimationFrame(frame); return; }
      last = now;
      ptr.x += (ptr.tx - ptr.x) * 0.04; ptr.y += (ptr.ty - ptr.y) * 0.04;
      tint.amt += (tint.target - tint.amt) * 0.06;
      gl.uniform1f(u.t, (now - t0) / 1000);
      gl.uniform1f(u.p, Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.9))));
      gl.uniform2f(u.m, ptr.x, ptr.y);
      gl.uniform1f(u.ta, tint.amt);
      gl.uniform3f(u.tc, ...tint.rgb);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!shown) { shown = true; host.appendChild(canvas); requestAnimationFrame(() => canvas.classList.add('is-on')); }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); }).observe(this);
    document.addEventListener('visibilitychange', kick);
    this.reduce.addEventListener('change', () => { if (this.reduce.matches) { visible = false; canvas.remove(); } });
    canvas.addEventListener('webglcontextlost', () => { visible = false; canvas.remove(); });
    kick();
  }
}
if (!customElements.get('space-between')) customElements.define('space-between', SpaceBetween);
