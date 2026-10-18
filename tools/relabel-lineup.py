# Put the current packs (studio cut-outs, current labels and logo) into the sunlit line-up photo, relit to match it.
from PIL import Image, ImageFilter
import numpy as np
P = '/home/user/opus-com/_source/photos/'
photo = Image.open('orig.jpg').convert('RGB')
K = photo.size[0] / 1400
ph = np.asarray(photo).astype(np.float32) / 255
out = ph.copy()
layer = np.zeros((ph.shape[0], ph.shape[1], 4), np.float32)
# erase the old packs first: the sky and the blurred stone behind them are smooth across each row, so each row is
# rebuilt between the pixels just outside the old pack (the base, where the packs meet the ledge, is left as it is)
for (x0, x1, y0, y1) in [(346, 546, 100, 650), (590, 707, 318, 655), (754, 890, 276, 655), (942, 1075, 278, 655)]:
    X0, X1, Y0, Y1 = int(x0 * K), int(x1 * K), int(y0 * K), int(y1 * K)
    l = out[Y0:Y1, X0 - 4:X0].mean(1); r = out[Y0:Y1, X1:X1 + 4].mean(1)
    t = np.linspace(0, 1, X1 - X0)[None, :, None]
    fill = l[:, None, :] * (1 - t) + r[:, None, :] * t
    # feather the bottom edge into the untouched base
    fy = np.clip((Y1 - np.arange(Y0, Y1)) / (14 * K), 0, 1)[:, None, None]
    orig = out[Y0:Y1, X0:X1]
    # only the old pack itself is replaced: pixels that clearly differ from the rebuilt background, grown by a few px
    diff = np.abs(orig - fill).max(-1)
    m = (diff > .07).astype(np.float32)
    for _ in range(int(5 * K)):
        m = np.maximum.reduce([m, np.roll(m, 1, 0), np.roll(m, -1, 0), np.roll(m, 1, 1), np.roll(m, -1, 1)])
    m = m[..., None] * fy
    grain = np.random.default_rng(5).normal(0, .006, fill.shape).astype(np.float32)
    out[Y0:Y1, X0:X1] = (fill + grain) * m + orig * (1 - m)
# (handle, photo top, photo bottom, photo body-centre x, photo body x-range, colour test, studio body centre x, studio alpha top/bottom)
packs = [
    ('daily-reset-cleanser', 108, 668, 464.5, (393, 536), 'g', 706.5, 99, 1990),
    ('clarity-serum', 327, 672, 648, (597, 700), 'c', 699, 102, 1988),
    ('daily-barrier-moisturizing-cream', 283, 673, 821.5, (760, 883), 'p', 699.5, 125, 1970),
    ('daily-defense-sunscreen-spf-50', 285, 674, 1008.5, (948, 1069), 'o', 699, 108, 1968),
]
def colour_mask(a, t):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return {'g': (g > r + .12) & (g > b + .08), 'c': (b > r + .25) & (g > r + .12), 'p': (r > g + .1) & (b > g + .1), 'o': (r > g + .16) & (r > b + .27)}[t]
for h, top, bot, cx, (bx0, bx1), t, scx, at, ab in packs:
    top, bot, cx = top * K, bot * K, cx * K
    cut = Image.open(P + f'bts-{h}-front.png').convert('RGBA')
    s = (bot - top) / (ab - at)
    W, H = cut.size
    cs = cut.resize((round(W * s), round(H * s)), Image.LANCZOS)
    c = np.asarray(cs).astype(np.float32) / 255
    ox = round(cx - scx * s); oy = round(top - at * s)
    hh, ww = c.shape[:2]
    y0, x0 = max(0, oy), max(0, ox); y1, x1 = min(ph.shape[0], oy + hh), min(ph.shape[1], ox + ww)
    cc = c[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    rgb, al = cc[..., :3].copy(), cc[..., 3:4]
    # lighting transfer: per-column, per-channel ratio of the photo body to the studio body (medians ignore the label text)
    pb = ph[y0:y1, x0:x1]
    pm = colour_mask(pb, t); sm = colour_mask(rgb, t) & (al[..., 0] > .9)
    ratio = np.ones((x1 - x0, 3), np.float32)
    valid = np.zeros(x1 - x0, bool)
    for xi in range(x1 - x0):
        a, b = pm[:, xi], sm[:, xi]
        if a.sum() > 35 and b.sum() > 35:
            ratio[xi] = np.median(pb[a, xi], 0) / np.maximum(np.median(rgb[b, xi], 0), .02); valid[xi] = True
    if valid.any():
        xs = np.arange(x1 - x0)
        for ch in range(3):
            ratio[:, ch] = np.interp(xs, xs[valid], ratio[valid, ch])
        k = np.ones(13) / 13
        ratio = np.stack([np.convolve(np.pad(ratio[:, ch], 6, mode='edge'), k, 'valid') for ch in range(3)], 1)
    ratio = np.clip(ratio, .55, 1.6)
    # vertical: the photo bottles get a little darker toward the base (bounce from the stone keeps it warm)
    vy = np.linspace(1.03, .97, y1 - y0)[:, None, None]
    # coloured plastic takes the full per-channel transfer; whites and clear parts (caps, label text) only the light
    lum = np.clip(ratio.mean(1, keepdims=True), .82, 1.12)
    neutral_ratio = lum * np.array([1.0, .985, .955], np.float32)[None, :]      # the photo's sun is a touch warm
    satur = (rgb.max(-1, keepdims=True) - rgb.min(-1, keepdims=True))
    wcol = np.clip((satur - .10) / .25, 0, 1)
    rr = ratio[None, :, :] * wcol + neutral_ratio[None, :, :] * (1 - wcol)
    lit = np.clip(rgb * rr * vy, 0, 1)
    region = out[y0:y1, x0:x1]
    out[y0:y1, x0:x1] = region * (1 - al) + lit * al
    L0 = layer[y0:y1, x0:x1]
    layer[y0:y1, x0:x1, :3] = L0[..., :3] * (1 - al) + lit * al
    layer[y0:y1, x0:x1, 3:] = np.maximum(L0[..., 3:], al)
    print(h, 'scale', round(s, 4), 'at', x0, y0, 'ratio range', ratio.min(0).round(2), ratio.max(0).round(2))
Image.fromarray((np.clip(layer, 0, 1) * 255).astype(np.uint8), 'RGBA').save('/tmp/claude-0/-home-user-opus-com/6160f103-b744-5163-8b61-f70a8cd999b3/scratchpad/relabel/layer.png')
Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8)).save('/tmp/claude-0/-home-user-opus-com/6160f103-b744-5163-8b61-f70a8cd999b3/scratchpad/relabel/lineup-v5.jpg', quality=93)
