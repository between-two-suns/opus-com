# Apply a batch of locale changes to theme/locales/en.default.json and ar.json (DECISIONS 294–296).
# The batch file defines U = {'dotted.key': ('English or None', 'Arabic or None')}; None leaves that language alone.
# Usage: python3 tools/copy/apply-locales.py batch.py   (prints 'NEW KEY?' for keys that didn't exist yet)
# usage: python3 apply.py batch.py  (batch defines U = {key: (en or None, ar or None)})
import json,collections,sys,runpy
import os
P=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','theme','locales')+'/'
U=runpy.run_path(sys.argv[1])['U']
for f,i in [('en.default.json',0),('ar.json',1)]:
    d=json.load(open(P+f),object_pairs_hook=collections.OrderedDict)
    n=0
    for k,v in U.items():
        if v[i] is None: continue
        ks=k.split('.'); o=d
        for kk in ks[:-1]: o=o.setdefault(kk,collections.OrderedDict())
        if ks[-1] not in o and not k.startswith(('copy.','collection.','newsletter.','sections.')): print('NEW KEY?',f,k)
        o[ks[-1]]=v[i]; n+=1
    open(P+f,'w').write(json.dumps(d,ensure_ascii=False,indent=2)+'\n'); print(f,n)
