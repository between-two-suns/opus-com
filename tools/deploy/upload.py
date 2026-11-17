# Upload theme files to Shopify staged targets, then print the themeFilesUpsert "files" JSON.
# 1. Put the theme-relative paths to deploy, one per line, in a list file (e.g. assets/home.css).
# 2. Run Admin GraphQL stagedUploadsCreate with one input per file, IN THE SAME ORDER:
#      { resource: FILE, filename: "<basename>", mimeType: "<text/css|application/json|text/plain|application/javascript>",
#        httpMethod: POST, fileSize: "<exact bytes from `wc -c`>" }
#    and save the whole JSON response to a file.
# 3. python3 tools/deploy/upload.py <list-file> <staged-response.json>   → prints "bad []" then the files JSON.
# 4. themeFilesUpsert(themeId: "gid://shopify/OnlineStoreTheme/<id>", files: <that JSON>) → returns a job; query job { done }.
# 5. Verify: theme(id) { files(filenames: [...]) { nodes { filename checksumMd5 } } } against `md5sum theme/<path>`.
# Order rule: upload locales before sections that use new keys; sections/snippets before templates that reference them.
import json, os, subprocess, sys
lst, resp = sys.argv[1], sys.argv[2]
raw = open(resp).read()
data = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])
t = (data.get('data') or data)['stagedUploadsCreate']['stagedTargets']
fs = open(lst).read().split()
assert len(fs) == len(t), (len(fs), len(t))
root = os.environ.get('ROOT', os.path.join(os.path.dirname(__file__), '..', '..', 'theme'))
out, bad = [], []
for f, tg in zip(fs, t):
    assert tg['resourceUrl'].endswith('/' + f.split('/')[-1]), (f, tg['resourceUrl'])
    args = ['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', tg['url']]
    for p in tg['parameters']: args += ['-F', f"{p['name']}={p['value']}"]
    args += ['-F', 'file=@' + os.path.join(root, f)]
    code = subprocess.run(args, capture_output=True, text=True).stdout
    if code not in ('201', '204', '200'): bad.append((f, code))
    out.append({'filename': f, 'body': {'type': 'URL', 'value': tg['resourceUrl']}})
print('bad', bad)
print(json.dumps(out))
