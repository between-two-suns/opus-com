"""Make built-in theme text editable in the Shopify editor without changing the default look.
For each (section, locale key, setting id, label, type): every `{{ 'KEY' | t }}` in the section body becomes
"setting if filled, else the built-in translation", and a matching setting is added to the schema (if missing).
Usage: python3 tools/editor/editable.py   (edits theme/sections in place; idempotent)."""
import json, re, sys, os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'theme')
INFO = "Leave empty to keep the built-in English and Arabic text."
NOTE = ("Every text box starts empty and shows the site's built-in English and Arabic text. Type to replace it, "
        "then add the Arabic in Translate & Adapt (free Shopify app), or Arabic visitors will see your English.")

def load(name):
    p = os.path.join(ROOT, 'sections', name + '.liquid'); src = open(p).read()
    m = re.search(r'({%-?\s*schema\s*-?%})(.*?)({%-?\s*endschema\s*-?%})', src, re.S)
    return p, src, m, json.loads(m.group(2))

def save(p, src, m, schema):
    body = src[:m.start()] + m.group(1) + '\n' + json.dumps(schema, ensure_ascii=False, indent=2) + '\n' + m.group(3) + src[m.end():]
    open(p, 'w').write(body)

def apply(name, fields, header='Text', relabel=None, note=True):
    p, src, m, s = load(name)
    body = src[:m.start()]
    sets = s.setdefault('settings', [])
    ids = {x.get('id') for x in sets}
    if note and not any(x.get('type') == 'paragraph' and x.get('content') == NOTE for x in sets):
        sets.insert(0, {'type': 'paragraph', 'content': NOTE})
    added = []
    for f in fields:
        key, sid, label, typ = f[0], f[1], f[2], (f[3] if len(f) > 3 else 'text')
        info = f[4] if len(f) > 4 else INFO
        if key:
            pat = re.compile(r"\{\{\s*'" + re.escape(key) + r"'\s*\|\s*t\s*\}\}")
            rep = ("{% if section.settings." + sid + " != blank %}{{ section.settings." + sid +
                   " }}{% else %}{{ '" + key + "' | t }}{% endif %}")
            body, n = pat.subn(rep, body)
            if n == 0 and sid not in ids: print(f'  ! {name}: {key} not found as plain output', file=sys.stderr)
        if sid not in ids:
            st = {'type': typ, 'id': sid, 'label': label}
            if info: st['info'] = info
            added.append(st); ids.add(sid)
    if added:
        sets.append({'type': 'header', 'content': header}); sets.extend(added)
    for x in sets:
        if relabel and x.get('id') in relabel:
            x['label'] = relabel[x['id']][0]
            if len(relabel[x['id']]) > 1: x['info'] = relabel[x['id']][1]
    src2 = body + src[m.start():]
    m2 = re.search(r'({%-?\s*schema\s*-?%})(.*?)({%-?\s*endschema\s*-?%})', src2, re.S)
    save(p, src2, m2, s)
    print(name, 'added', [a['id'] for a in added])
