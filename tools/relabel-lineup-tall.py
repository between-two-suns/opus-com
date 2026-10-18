# portrait version for phones: crop around the line-up and extend the sky upward (smooth, slightly deeper blue)
from PIL import Image
import numpy as np
bg = np.asarray(Image.open('lineup-v5.jpg').convert('RGB')).astype(np.float32) / 255
ly = np.asarray(Image.open('layer.png')).astype(np.float32) / 255
x0, x1 = 430, 1520; W = x1 - x0; Ht = int(W / .46); ext = Ht - bg.shape[0]
crop = bg[:, x0:x1]; lcrop = ly[:, x0:x1]
# sky colour per column at the top, blurred across the row so the palm's soft shadow doesn't stretch upward
top = crop[2:22].mean(0)
k = 301; pad = np.pad(top, ((k // 2, k // 2), (0, 0)), mode='edge')
sm = np.stack([np.convolve(pad[:, c], np.ones(k) / k, 'valid') for c in range(3)], 1)
yy = np.linspace(0, 1, ext)[:, None, None]                                # 0 at the very top, 1 where the photo starts
w = yy ** 7
near = crop[0:1]                                                           # the photo's own top row, column by column
far = sm[None] * np.array([.82, .87, .95])[None, None]                     # smooth, slightly deeper sky above
sky = far * (1 - w) + near * w
rng = np.random.default_rng(3)
sky = sky + rng.normal(0, .004, sky.shape)
tall = np.concatenate([sky, crop], 0)
ltall = np.concatenate([np.zeros((ext, W, 4), np.float32), lcrop], 0)
Image.fromarray((np.clip(tall, 0, 1) * 255).astype(np.uint8)).save('tall.jpg', quality=92)
Image.fromarray((np.clip(ltall, 0, 1) * 255).astype(np.uint8), 'RGBA').save('tall-layer.png')
print(tall.shape)
