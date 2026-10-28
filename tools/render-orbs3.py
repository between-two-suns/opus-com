# Render a matte, powdery sphere with dew drops (the two suns). numpy only.
# v3 (DECISIONS 255): no single-pixel pits (they read as black specks), ~45 drops in three sizes, gathered in loose
# clusters like real dew, none small enough to turn into specks. Also writes the PNG uploaded to Files.
import numpy as np, sys
from PIL import Image, ImageFilter
rng = np.random.default_rng(int(sys.argv[3]) if len(sys.argv) > 3 else 7)
N = 1800
side = sys.argv[1]            # 'l' (lit from the right) or 'r' (lit from the left)
out = sys.argv[2]
base = np.array([0.66, 0.81, 0.71]) if side == 'l' else np.array([0.66, 0.75, 0.92])
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
x = (xx + .5) / N * 2 - 1; y = (yy + .5) / N * 2 - 1
r2 = x * x + y * y; inside = r2 < 1
z = np.sqrt(np.clip(1 - r2, 0, 1))

_fy = np.fft.fftfreq(N)[:, None]; _fx = np.fft.rfftfreq(N)[None, :]
def blur(a, s):
    g = np.exp(-2 * (np.pi ** 2) * (s ** 2) * (_fx ** 2 + _fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape).astype(np.float32)

# height field: powdery stone (several octaves) + tiny pits
h = np.zeros((N, N), np.float32)
for s, a in [(1.4, .10), (3.2, .34), (9, .55), (30, .6), (90, .5)]:
    n = blur(rng.standard_normal((N, N)).astype(np.float32), s)
    h += a * n / (n.std() + 1e-6)
h = h * .016
gy, gx = np.gradient(h)
k = 1.0
nx, ny, nz = x - gx * k * N / 60, y - gy * k * N / 60, z + 0
nl = np.sqrt(nx * nx + ny * ny + nz * nz) + 1e-6
nx, ny, nz = nx / nl, ny / nl, nz / nl
L = np.array([0.0, -0.35, 0.94]); L /= np.linalg.norm(L)
diff = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
wrap = np.clip((nx * L[0] + ny * L[1] + nz * L[2] + .35) / 1.35, 0, 1)
H = (L + np.array([0, 0, 1])); H /= np.linalg.norm(H)
spec = np.zeros_like(diff)
# relief as a directional derivative of the height field: the same strength everywhere on the sphere
shade = 1.0 + .5 * (gx * .55 + gy * .65) * (N / 60) * k
rim = np.zeros_like(diff)                # soft edge falloff
col = base[None, None, :] * shade[..., None] + spec[..., None] - rim[..., None] * base[None, None, :] * .5
col = col * .96 + .04 * np.array([1, .98, .95])        # a little warm air
# dew drops
drops = []
def place(n, sizes, centres=None, spread=.0):
    tries = 0
    while n and tries < 4000:
        tries += 1
        if centres is not None:
            c = centres[rng.integers(len(centres))]
            cx, cy = c[0] + rng.normal(0, spread), c[1] + rng.normal(0, spread)
        else:
            rr = rng.uniform(0, .9) ** .5; th = rng.uniform(0, 2 * np.pi); cx, cy = rr * np.cos(th), rr * np.sin(th)
        if cx * cx + cy * cy > .86: continue
        sz = rng.uniform(*sizes)
        # never touching another drop
        if any((cx - d[0]) ** 2 + (cy - d[1]) ** 2 < ((sz + d[2]) * 2.4 / N) ** 2 for d in drops): continue
        drops.append((cx, cy, sz)); n -= 1
# three or four loose clusters, mostly on the upper, lit half
# loose clusters spread round the whole surface (the spheres turn in the hero, so every side gets seen)
cl = [(.55 * np.cos(t), .55 * np.sin(t)) for t in rng.uniform(0, 2 * np.pi, 5)] + [(0, 0)]
place(5, (30, 42), cl, .14)      # large
place(16, (16, 24), cl, .2)      # medium
place(24, (10, 14), cl, .26)     # small, near the others
place(16, (10, 15))              # strays across the surface
drops.sort(key=lambda d: d[2])
dmask = np.zeros((N, N), np.float32)
shadow = np.zeros((N, N), np.float32)
for cx, cy, sz in drops:
    zz = np.sqrt(max(1e-4, 1 - cx * cx - cy * cy))
    px, py = (cx + 1) / 2 * N, (cy + 1) / 2 * N
    # foreshortened along the radial direction near the rim
    rad = np.array([cx, cy]); rl = np.linalg.norm(rad) + 1e-6; rad /= rl
    jit = rng.uniform(.84, 1.0)                           # real drops are never perfect circles
    a, b = sz, sz * max(.35, zz) * jit                   # tangent / radial semi-axes
    R = int(a + 6); x0, x1, y0, y1 = int(px - R), int(px + R), int(py - R), int(py + R)
    if x0 < 0 or y0 < 0 or x1 >= N or y1 >= N: continue
    sx = xx[y0:y1, x0:x1] - px; sy = yy[y0:y1, x0:x1] - py
    u = sx * -rad[1] + sy * rad[0]; v = sx * rad[0] + sy * rad[1]
    d2 = (u / a) ** 2 + (v / b) ** 2
    m = np.clip((1 - d2) * a * .9, 0, 1)
    if m.max() <= 0: continue
    # shadow of the drop, offset away from the light
    ox, oy = -L[0] * sz * .35, -L[1] * sz * .35
    d2s = ((u - (ox * -rad[1] + oy * rad[0])) / a) ** 2 + ((v - (ox * rad[0] + oy * rad[1])) / b) ** 2
    shadow[y0:y1, x0:x1] = np.maximum(shadow[y0:y1, x0:x1], np.clip(1 - d2s, 0, 1) * .55)
    dz = np.sqrt(np.clip(1 - d2, 0, 1))
    # drop normal (dome), lit by the same light: dark rim on the lit side, bright caustic opposite, specular dot
    dnx, dny = (u * -rad[1] + v * rad[0]) / a, (u * rad[1] * 0 + v * rad[1] + u * -rad[0] * 0) / a
    dnx = sx / a; dny = sy / a
    lit = np.clip(dnx * L[0] + dny * L[1], -1, 1)
    body = .86 + .10 * dz
    caustic = np.clip(-lit, 0, 1) ** 2 * dz * .38
    edge = np.clip(1 - dz, 0, 1) ** 2.2 * .30
    hx, hy = px + L[0] * sz * .38, py + L[1] * sz * .38
    hl = np.exp(-(((xx[y0:y1, x0:x1] - hx) ** 2 + (yy[y0:y1, x0:x1] - hy) ** 2) / (2 * (sz * .16 + .6) ** 2))) * .95
    reg = col[y0:y1, x0:x1]
    nd = reg * (body - edge)[..., None] + caustic[..., None] * .9 + hl[..., None]
    col[y0:y1, x0:x1] = reg * (1 - m[..., None]) + nd * m[..., None]
    dmask[y0:y1, x0:x1] = np.maximum(dmask[y0:y1, x0:x1], np.clip(m * (.35 + caustic * 1.5) + hl, 0, 1))
shadow = blur(shadow, 2.2)
col = col * (1 - shadow[..., None] * .22)
col = np.clip(col, 0, 1)
alpha = np.clip((1 - np.sqrt(r2)) * N / 2 * 1.2, 0, 1)
pass
img = np.dstack([np.clip(col, 0, 1), alpha]) * 255
Image.fromarray(img.astype(np.uint8), 'RGBA').save(out, 'WEBP', quality=90, method=6)
Image.fromarray(img.astype(np.uint8), 'RGBA').resize((1500, 1500), Image.LANCZOS).save(out.replace('.webp', '.png'), 'PNG', optimize=True)
mk = np.dstack([np.ones_like(dmask), np.ones_like(dmask), np.ones_like(dmask), dmask * alpha]) * 255
Image.fromarray(mk.astype(np.uint8), 'RGBA').resize((600, 600), Image.LANCZOS).save(out.replace('.webp', '-drops.webp'), 'WEBP', quality=80, method=6)
print(out)
