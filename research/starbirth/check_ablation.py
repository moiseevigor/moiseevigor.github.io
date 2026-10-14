"""Verify the diagnostic and preserve the failed primary gates."""
import csv,hashlib,json,sys,re,xml.etree.ElementTree as ET
from pathlib import Path
B=Path(__file__).resolve().parents[2];P=B/'public/data/starbirth/ablation';inventory=list(csv.DictReader((P/'source-inventory.csv').open()));assert len(inventory)==18
for row in inventory:
 data=(P/row['public_file']).read_bytes();assert len(data)==int(row['bytes']) and hashlib.sha256(data).hexdigest()==row['sha256']
s=json.loads((P/'summary.json').read_text());c=json.loads((P/'checkpoint.json').read_text());assert c['independent_verification_passed'] and not c['rankings_promoted'] and not c['physical_validation'] and not c['full_goal_achieved'];assert (s['requested'],s['proxy_positive'],s['proxy_negative'],s['unknown'])==(19328,27,235,19066)
assert len(s['methods'])==16 and s['temporal_positive']==0 and tuple(s['results'][n]['recovered_positive'] for n in ('embedding','nonlinear','availability'))==(14,15,7)
if len(sys.argv)>1:
 site=Path(sys.argv[1]);url='astrophysics/2026/10/14/hidden-protostars-ablation/';page=(site/url/'index.html').read_text()
 for term in ['16','0.990/0.954','0.998/0.973','7/27','19,066','0.877 to 0.973','two training positives','0.524','0.530','5/27','7/27','333-of-800','0/3','No new star or birth is confirmed','mixed/inconclusive','post-read correction','a173e8ab187a11ea58b4e67f2c7293450b71cd52']:assert term in page,term
 assert len(re.findall(r'<td(?:\s[^>]*)?>',page))>=64
 program=(site/'astrophysics/2026/10/11/hidden-protostars-research-program/index.html').read_text();assert url in program and 'sbf-expand' in program and '#flag-repair' in program
 assert url not in (site/'index.html').read_text()
 atom=ET.fromstring((site/'atom.xml').read_text());ns={'a':'http://www.w3.org/2005/Atom'}
 for entry in atom.findall('a:entry',ns):
  assert not any(link.get('href','').rstrip('/').endswith(url.rstrip('/')) for link in entry.findall('a:link',ns))
 for row in inventory:
  rel=Path('public/data/starbirth/ablation')/row['public_file'];assert (site/rel).read_bytes()==(B/rel).read_bytes()
 for name in ['README.md','source-inventory.csv']:assert (site/'public/data/starbirth/ablation'/name).read_bytes()==(P/name).read_bytes()
print('PASS: all 16 ablations and 18 exact source exports; no promoted model; unlisted progress article; preserved failed gates and formation explorer.')
