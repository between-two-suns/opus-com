# Stack before/after phone shots into one tall review image: python3 tools/copy/before-after.py out.png 'name.png:Label:maxh' ...
import sys
from PIL import Image, ImageDraw, ImageFont
import os
S=os.environ.get('SHOTS','.')  # folder holding copy-before/ and copy-after/ from qa/copy-shots.mjs
F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',20)
f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
out=sys.argv[1]; rows=[x.split(':') for x in sys.argv[2:]]  # name:label:maxh
ims=[]
for name,label,maxh in rows:
    a=Image.open(f'{S}/copy-before/{name}'); b=Image.open(f'{S}/copy-after/{name}'); h=min(max(a.height,b.height),int(maxh))
    c=Image.new('RGB',(a.width+b.width+20,h+40),'white'); d=ImageDraw.Draw(c)
    d.text((8,10),'BEFORE',fill=(130,130,130),font=F); d.text((a.width+28,10),'AFTER',fill=(0,120,80),font=F); d.text((130,12),label,fill=(40,40,60),font=f2)
    c.paste(a.crop((0,0,a.width,min(h,a.height))),(0,40)); c.paste(b.crop((0,0,b.width,min(h,b.height))),(a.width+20,40)); ims.append(c)
W=max(i.width for i in ims); H=sum(i.height for i in ims)+24*len(ims)
C=Image.new('RGB',(W,H),(225,225,228)); y=0
for i in ims: C.paste(i,(0,y)); y+=i.height+24
C.save(out, optimize=True); print(out, C.size)
