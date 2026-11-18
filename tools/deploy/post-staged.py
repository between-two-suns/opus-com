"""POST theme files to Shopify staged-upload targets without saving the whole stagedUploadsCreate response.
Usage: python3 tools/deploy/post-staged.py LIST TARGETS DATE
  LIST    theme-relative paths, one per line, same order as the stagedUploadsCreate inputs
  TARGETS lines "<uuid> <x-goog-signature>" in the same order (from each target's key and signature)
  DATE    the x-goog-date value, e.g. 20261118T112734Z (credential date and +1 day expiry are derived)
The policy is rebuilt byte-for-byte from the known Shopify/GCS template. Prints the themeFilesUpsert "files" JSON."""
import json, base64, subprocess, os, sys, datetime
lst, tgt, D = sys.argv[1:4]
root = os.path.join(os.path.dirname(__file__), '..', '..', 'theme')
dt = datetime.datetime.strptime(D, '%Y%m%dT%H%M%SZ')
C = f'merchant-assets@shopify-tiers.iam.gserviceaccount.com/{D[:8]}/auto/storage/goog4_request'
E = (dt + datetime.timedelta(days=1)).strftime('%Y-%m-%dT%H:%M:%SZ')
B = 'https://shopify-staged-uploads.storage.googleapis.com/'
MIME = {'json': 'application/json', 'css': 'text/css', 'js': 'application/javascript', 'liquid': 'text/plain'}
def pol(ct, key):
    p = {"conditions": [{"Content-Type": ct}, {"success_action_status": "201"}, {"acl": "private"},
         ["content-length-range", 1, 20971520], {"bucket": "shopify-staged-uploads"}, {"key": key},
         {"x-goog-date": D}, {"x-goog-credential": C}, {"x-goog-algorithm": "GOOG4-RSA-SHA256"}], "expiration": E}
    return base64.b64encode(json.dumps(p, separators=(',', ':')).replace('/', '\\/').encode()).decode()
files = open(lst).read().split(); tg = [l.split() for l in open(tgt) if l.strip()]
assert len(files) == len(tg), (len(files), len(tg))
out, bad = [], []
for f, (u, sig) in zip(files, tg):
    ct = MIME[f.rsplit('.', 1)[1]]; key = f'tmp/84281229570/files/{u}/{os.path.basename(f)}'
    a = ['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code}', '-X', 'POST', B]
    for k, v in [('Content-Type', ct), ('success_action_status', '201'), ('acl', 'private'), ('key', key),
                 ('x-goog-date', D), ('x-goog-credential', C), ('x-goog-algorithm', 'GOOG4-RSA-SHA256'),
                 ('x-goog-signature', sig), ('policy', pol(ct, key))]:
        a += ['-F', f'{k}={v}']
    a += ['-F', 'file=@' + os.path.join(root, f)]
    c = subprocess.run(a, capture_output=True, text=True).stdout
    if c != '201': bad.append((f, c))
    out.append({'filename': f, 'body': {'type': 'URL', 'value': B + key}})
print('bad', bad, file=sys.stderr); print(json.dumps(out))
