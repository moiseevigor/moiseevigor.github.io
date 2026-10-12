"""Audit the generated static edition against its source-bound conversion manifest."""
import hashlib
import json
import re
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
manifest=json.loads((ROOT/'research/proof-atlas/distill-article-manifest.json').read_text())
source=ROOT/'public/research/se2/conjugate_times_se2.tex'
assert hashlib.sha256(source.read_bytes()).hexdigest()==manifest['sourceSha256']
class Audit(HTMLParser):
    def __init__(self):super().__init__();self.ids=[];self.links=[];self.images=[];self.math=[];self.level=0;self.inside=None;self.tables=0
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if a.get('id'):self.ids.append(a['id'])
        if tag=='a' and a.get('href','').startswith('#'):self.links.append(a['href'][1:])
        if tag=='img':self.images.append(a)
        if tag=='table':self.tables+=1
        if tag=='span':
            self.level+=1
            if 'math' in a.get('class','').split():self.inside=self.level;self.math.append('')
    def handle_endtag(self,tag):
        if tag=='span':
            if self.inside==self.level:self.inside=None
            self.level-=1
    def handle_data(self,data):
        if self.inside:self.math[-1]+=data
page=ROOT/'projects/proof-atlas/article/index.html'
a=Audit();a.feed(page.read_text())
assert len(a.ids)==len(set(a.ids))
assert not(set(a.links)-set(a.ids))
assert set(manifest['sourceLabels'])<=set(a.ids)
assert set(manifest['passageAnchors'])<=set(a.ids)
assert len(a.images)==manifest['figures']==4
assert a.tables==manifest['tables']==3
for image in a.images:
    assert image.get('alt')
    assert (ROOT/image['src'].lstrip('/')).exists()
def normalize(text):
    text=text.strip()
    if text.startswith((r'\(',r'\[')):text=text[2:-2]
    text=re.sub(r'\\tag\{[^}]+\}','',text)
    return re.sub(r'\s+','',text)
actual=[normalize(m)for m in a.math]
expected=[normalize(m)for m in manifest['mathContent']]
position=0
for formula in expected:
    while position<len(actual) and actual[position]!=formula:position+=1
    assert position<len(actual),f'Missing or altered formula {formula[:100]}'
    position+=1
assert len(expected)==manifest['mathExpressions']==916
assert all('ref-'+k in a.ids for k in ['Sachkov2010Conjugate','DLMF','SE2FirstCaustic','SE2Counts'])
assert 'Lemma 3.3' in page.read_text() and 'Theorem 4.1' in page.read_text()
print(json.dumps({'status':'PASS','preservedMath':len(expected),'figures':4,'tables':3,'internalLinks':len(a.links),'passageTargets':len(manifest['passageAnchors'])}))
