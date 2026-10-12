"""Independent audit of all numbered statements, source header hashes and check evidence."""
import hashlib,json,re
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[2]
raw=(ROOT/'public/data/proof-atlas/article-coverage.js').read_text()
data=json.loads(raw.split('window.PROOF_ATLAS_ARTICLE_COVERAGE=')[1].rstrip(';\n'))
assert data==json.loads((ROOT/'research/proof-atlas/article-coverage-audit.json').read_text())
source=(ROOT/'public/research/se2/conjugate_times_se2.tex').read_text()
assert hashlib.sha256(source.encode()).hexdigest()==data['articleSha256']
log=(ROOT/'research/proof-atlas/article-coverage-lean-check.log').read_text()
assert hashlib.sha256(log.encode()).hexdigest()==data['checkLogSha256']
assert 'error:'not in log and 'sorryAx'not in log
assert len(data['modules'])==15 and all(m['build']=='PASS'for m in data['modules'].values())
assert data['researchRevision']=='5c304fd9957eafc781969703b4bcc75abe0c0201'
class Targets(HTMLParser):
 def __init__(self):super().__init__();self.ids=[]
 def handle_starttag(self,tag,attrs):
  if'id'in dict(attrs):self.ids.append(dict(attrs)['id'])
targets=Targets();targets.feed((ROOT/'projects/proof-atlas/article/index.html').read_text())
found=[];section=counter=0
for e in re.finditer(r'\\section(\*)?\{[^}]+\}|\\begin\{(lemma|theorem|remark)\}(?:\[[^\]]*\])?',source):
 if e[0].startswith(r'\section'):
  if not e[1]:section+=1;counter=0
  continue
 counter+=1;end=source.index(r'\end{'+e[2]+'}',e.end());full=source[e.start():end+len(r'\end{'+e[2]+'}')]
 label=re.search(r'\\label\{([^}]+)\}',source[e.end():end]);anchor=label[1]if label else'remark-late-folds'
 found.append((f'{section}.{counter}',anchor,hashlib.sha256(full.encode()).hexdigest()))
assert len(found)==len(data['statements'])==9
for r,(number,anchor,digest)in zip(data['statements'],found):
 assert (r['number'],r['htmlAnchor'],r['excerptSha256'])==(number,anchor,digest)
 assert anchor in targets.ids and r['status']in ['partial','not-formalized']
 assert r['missing'],'A partial/unformalized statement must explain its missing clauses'
 a,b=r['sourceLines'];assert source.splitlines()[a-1].startswith(r'\begin{')
names={d['name']for d in data['declarations']}
assert len(names)==len(data['declarations'])==39
for d in data['declarations']:
 assert d['sourceSha256']==data['modules'][d['module']]['sourceSha256']
 assert all(l['number']==d['lines'][0]['number']+i for i,l in enumerate(d['lines']))
 assert hashlib.sha256('\n'.join(l['text']for l in d['lines']).encode()).hexdigest()==d['sha256']
 assert d['kernelCheck']=='PASS'and d['termGraph']is False
 match=re.search("'"+re.escape(d['name'])+r"' depends on axioms: \[([^\]]*)\]",log);assert match
 assert [a.strip()for a in match[1].split(',')if a.strip()]==d['axioms']
 assert set(d['axioms'])<={'propext','Classical.choice','Quot.sound'}
 assert d['checkedType']in log
for r in data['statements']:
 assert {d['name']for d in r['declarations']}<=names
 assert bool(r['declarations'])or r['id']=='crossing'or r['status']=='not-formalized'
lookup={r['number']:r for r in data['statements']}
assert lookup['3.4']['status']=='partial'and lookup['4.1']['status']=='partial'
assert all(lookup[n]['status']=='not-formalized'for n in ['4.2','5.1','5.2','5.3'])
assert 'hfin' in next(d['checkedType']for d in data['declarations']if d['name']=='JacobiFull.exact_first_time')
assert 'hL' in next(d['checkedType']for d in data['declarations']if d['name']=='JacobiFull.two_per_cell_of_ne')
print(json.dumps({'status':'PASS','numberedStatements':9,'partial':5,'notFormalized':4,'modulesRebuilt':15,'checkedDeclarations':39,'statementSourceLines':sum(len(d['lines'])for d in data['declarations'])}))
