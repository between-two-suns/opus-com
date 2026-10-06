"""Rebuild theme font assets from @fontsource packages (run from tools/ after `npm ci`).
   display  : Antonio variable, instanced to wght 500–700, Latin subset   -> theme/assets/font-display.woff2
   arrows   : Archivo wdth62/wght700, arrows only (↑↓←→)                   -> theme/assets/font-arrows.woff2
   body     : Figtree variable Latin (copied)                              -> theme/assets/font-body.woff2
   arabic   : Alexandria variable Arabic subset (copied)                   -> theme/assets/font-arabic.woff2
   Requires: pip install fonttools brotli
"""
import shutil
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools import subset

FS = 'node_modules/@fontsource-variable'
OUT = '../theme/assets'

def sub(font, unicodes, path, features=('kern', 'liga', 'tnum', 'case')):
    o = subset.Options(); o.flavor = 'woff2'; o.layout_features = list(features); o.name_IDs = ['*']
    s = subset.Subsetter(o); s.populate(unicodes=unicodes); s.subset(font); font.flavor = 'woff2'; font.save(path)

latin = list(range(0x20, 0x7F)) + [0xA0, 0xB7, 0xD7, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0x2190, 0x2191, 0x2192, 0x2193, 0xE9]
f = instancer.instantiateVariableFont(TTFont(f'{FS}/antonio/files/antonio-latin-wght-normal.woff2'), {'wght': (500, 700)})
sub(f, latin, f'{OUT}/font-display.woff2')
a = instancer.instantiateVariableFont(TTFont(f'{FS}/archivo/files/archivo-latin-wdth-normal.woff2'), {'wdth': 62, 'wght': 700})
sub(a, [0x2190, 0x2191, 0x2192, 0x2193], f'{OUT}/font-arrows.woff2', features=())
shutil.copy(f'{FS}/figtree/files/figtree-latin-wght-normal.woff2', f'{OUT}/font-body.woff2')
shutil.copy(f'{FS}/alexandria/files/alexandria-arabic-wght-normal.woff2', f'{OUT}/font-arabic.woff2')
print('fonts rebuilt')
