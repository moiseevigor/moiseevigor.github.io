"""Audit compiled packets only. Original source projects and logs stay private."""
import collections,gzip,hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
KINDS=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj']
FIELDS={'app':['fn','arg'],'lam':['domain','body'],'forallE':['domain','body'],'letE':['type','value','body'],'mdata':['expr'],'proj':['struct']}
def validate(d):
 assert d['serialization']=='ExprDAG/1'
 n=len(d['kind']);assert n==d['declaration']['uniqueNodes']
 assert all(len(d[k])==n for k in ['children','payloads','expanded','neededScope'])
 weights=[0]*n;expanded=[];needed=[]
 for r in d['roots']:assert 0<=r<n;weights[r]+=1
 for i in range(n-1,-1,-1):
  for c in d['children'][i]:assert 0<=c<i;weights[c]+=weights[i]
 assert all(w>0 for w in weights),'Unreachable serialized nodes'
 counts=collections.Counter();dependencies=collections.defaultdict(list);levels=collections.Counter();metadata=0
 def lv(l,w):
  k=l['kind'];assert k in ['zero','succ','max','imax','param','mvar'];levels[k]+=w
  if k=='succ':lv(l['of'],w)
  if k in ['max','imax']:lv(l['left'],w);lv(l['right'],w)
  if k=='param':assert isinstance(l['name'],str)
  assert k!='mvar','Universe metavariable in closed declaration'
 for i in range(n):
  assert 0<=d['kind'][i]<12
  k=KINDS[d['kind'][i]];v=d['payloads'][i];cs=d['children'][i];w=weights[i];counts[k]+=w
  assert k not in ['fvar','mvar'],'Open reference in closed declaration'
  assert len(cs)==len(FIELDS.get(k,[])),(i,k)
  ex=1+sum(expanded[c]for c in cs);expanded.append(ex);assert str(ex)==d['expanded'][i]
  need=v['index']+1 if k=='bvar' else max([needed[c]-(1 if k in ['lam','forallE']and j==1 or k=='letE'and j==2 else 0)for j,c in enumerate(cs)]+[0])
  needed.append(need);assert need==d['neededScope'][i]
  if k=='const':dependencies[v['name']].append((i,w));[lv(l,w)for l in v['levels']]
  if k=='sort':lv(v['level'],w)
  if k in ['lam','forallE']:assert v['binderInfo']in ['default','implicit','strictImplicit','instImplicit'];assert isinstance(v['binderName'],str)
  if k=='letE':assert isinstance(v['nondep'],bool);assert isinstance(v['declName'],str)
  if k=='proj':assert isinstance(v['typeName'],str)and isinstance(v['index'],int)
  if k=='lit':assert re.match(r'Lean\.Literal\.(natVal|strVal) ',v['repr'])
  if k=='mdata':assert isinstance(v['metadata'],list);metadata+=w*len(v['metadata'])
 assert all(needed[r]==0 for r in d['roots']),'Independent binder-scope audit failed'
 assert str(sum(expanded[r]for r in d['roots']))==d['declaration']['occurrences']
 assert str(expanded[d['roots'][0]])==d['declaration']['typeOccurrences']
 assert d['declaration']['kernelCheck']=='PASS'
 assert set(d['declaration']['axioms'])<={'propext','Classical.choice','Quot.sound'}
 return counts,levels,metadata,dependencies
def verify():
 p=ROOT/'public/data/proof-atlas/library-manifest.js';manifest=json.loads(p.read_text().split('window.PROOF_ATLAS_LIBRARY=')[1].rstrip(';\n'));results=[]
 for e in manifest['editions']:
  assert all(k not in e for k in ['sourceProject','sourceArchive','buildAudit','resourceAudit'])
  counts=collections.Counter();levels=collections.Counter();nodes=0;metadata=0;names=set();gzipbytes=0;metadata_kinds=collections.Counter()
  assert e['counts']['declarations']==len(e['declarations'])
  for r in e['declarations']:
   assert r['name']not in names;names.add(r['name']);assert r['articleAnchor'];assert 'sourceUrl'not in r and 'sourceRange'not in r
   asset=(ROOT/r['file'].lstrip('/')).read_bytes();assert hashlib.sha256(asset).hexdigest()==r['gzipSha256'];raw=gzip.decompress(asset)
   assert hashlib.sha256(raw).hexdigest()==r['sha256']==r['indexSha256'];d=json.loads(raw)
   assert 'sourceRange'not in d['declaration'];assert all(d['declaration'][k]==r[k]for k in d['declaration']if k!='file')
   cs,ls,md,deps=validate(d);counts.update(cs);levels.update(ls);metadata+=md;nodes+=len(d['kind']);gzipbytes+=len(asset)
   assert sorted(deps)==r['references']
   assert {x['name']:x['count']for x in d['dependencies']}=={n:str(sum(w for _,w in uses))for n,uses in deps.items()}
   for i,k in enumerate(d['kind']):
    if k==10:
     for entry in d['payloads'][i]['metadata']:
      metadata_kinds[entry['value']['kind']]+=1
      assert entry['value']['kind']!='ofSyntax','Source Syntax payload requires separate review before publication'
   assert not r['unsafe']and not r['partial']
  assert {k:str(v)for k,v in counts.items()}==e['counts']['constructors'];assert {k:str(v)for k,v in levels.items()}==e['counts']['universeConstructors']
  assert nodes==e['counts']['uniqueNodes']and str(sum(counts.values()))==e['counts']['occurrences'];assert str(metadata)==e['counts']['metadataEntries']
  assert {r['module'].split('.')[-1]for r in e['declarations']}==set(e['modules'])
  results.append({'edition':e['id'],'status':'PASS','modules':len(e['modules']),'declarations':len(names),'sharedNodes':nodes,'expandedOccurrences':str(sum(counts.values())),'compressedBytes':gzipbytes,'metadataKinds':dict(metadata_kinds)})
 # Independent auditor rejection controls.
 d={'serialization':'ExprDAG/1','declaration':{'uniqueNodes':1,'occurrences':'1','typeOccurrences':'1','kernelCheck':'PASS','axioms':[]},'kind':[3],'children':[[]],'payloads':[{'level':{'kind':'zero'}}],'expanded':['1'],'neededScope':[0],'roots':[0]};validate(d);rejected=[]
 for label,mutate in [('missing child',lambda x:x['children'][0].append(0)),('false count',lambda x:x['expanded'].__setitem__(0,'2')),('open binder',lambda x:(x['kind'].__setitem__(0,0),x['payloads'].__setitem__(0,{'index':0}))),('untrusted axiom',lambda x:x['declaration']['axioms'].append('sorryAx'))]:
  bad=json.loads(json.dumps(d));mutate(bad)
  try:validate(bad)
  except (AssertionError,IndexError,KeyError):rejected.append(label)
  else:raise AssertionError('Auditor accepted '+label)
 assert not(ROOT/'public/research/proof-atlas/formal').exists()
 assert not(ROOT/'research/proof-atlas/evidence').exists()
 report={'status':'PASS','publication':'Compiled terms only; no original project source, tactic scripts, archives or extraction logs.','editions':results,'negativeControlsRejected':rejected,'scope':'Hashes, complete ordered expression graphs, lexical closure and payload statistics compared with the extracted inventory. Native kernel-check flags record private extraction; these public audits do not independently reproduce original kernel validity or mathematical article equivalence.'}
 (ROOT/'research/proof-atlas/compiled-term-checks.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':verify()
