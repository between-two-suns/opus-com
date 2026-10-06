"""Transparent cutout from a white-background packshot: edge flood-fill of near-white + neutral floor shadow (never repaints the pack).
Usage: python3 tools/assets/cutout.py in.webp out.png"""
import sys, numpy as np
from PIL import Image, ImageFilter
from collections import deque
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
a = np.asarray(im).astype(np.int16)
h, w, _ = a.shape
d = 255*3 - a.sum(axis=2)
mx = a.max(axis=2); mn = a.min(axis=2)
sat = (mx-mn)
T = 14
bg = np.zeros((h,w), bool)
def ok(y,x):
    if d[y,x] <= T: return True
    # shadow band: lower part of the image, neutral grey, fairly bright
    return y > h*0.80 and sat[y,x] < 14 and mn[y,x] > 150
q = deque()
for x in range(w):
    for y in (0, h-1):
        if ok(y,x): bg[y,x]=True; q.append((y,x))
for y in range(h):
    for x in (0, w-1):
        if ok(y,x) and not bg[y,x]: bg[y,x]=True; q.append((y,x))
while q:
    y,x = q.popleft()
    for ny,nx in ((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
        if 0<=ny<h and 0<=nx<w and not bg[ny,nx] and ok(ny,nx):
            bg[ny,nx]=True; q.append((ny,nx))
alpha = np.where(bg, 0, 255).astype(np.uint8)
am = Image.fromarray(alpha).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.7))
out = im.convert('RGBA'); out.putalpha(am)
bbox = am.point(lambda v: 255 if v>8 else 0).getbbox()
out = out.crop(bbox)
out.save(dst)
print(dst, out.size)
