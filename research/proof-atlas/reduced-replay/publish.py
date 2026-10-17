"""Freeze compact reduced-context attestations; no raw logs, original scripts or closed graphs."""
import argparse,collections,gzip,hashlib,json
from pathlib import Path
BASE=Path(__file__).resolve().parent;ROOT=BASE.parents[2]
def sha(b):return hashlib.sha256(b).hexdigest()
def encode(x):return json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--verification',type=Path,required=True);p.add_argument('--publish',action='store_true');a=p.parse_args();folder=a.verification.resolve().parent;native=json.loads(a.verification.read_text());ind=json.loads((folder/'independent.json').read_text());inventory=json.loads((folder/'inventory.json').read_text());assert native['status']==ind['status']=='PASS'
 raw=(folder/'observations.ndjson').read_bytes();assert sha(raw)==native['nativeOutputSha256']==ind['nativeOutputSha256'];assert sha((folder/'proof.ndjson').read_bytes())==native['baselineProofSha256']
 for f,h in {**native['producerFiles'],**ind['checkerFiles']}.items():assert sha((ROOT/f).read_bytes())==h,f
 expected={json.dumps(r['route'],sort_keys=True):r for r in ind['rows']};entries=[]
 for row in map(json.loads,raw.splitlines()):
  e=row['entry'];assert row['source']==native['source'] and row['originalTheoremAbsentFromEnvironment'] is True and row['originalModuleAbsentFromEnvironment'] is True
  if e['state']['expectReducedFailure']:assert e['reducedContext']['status']=='expected-rejection';continue
  r=expected[json.dumps(e['state']['route'],sort_keys=True)];module=e['reducedContext']['module'];assert module['id']==r['moduleId'] and e['role']==r['role']
  if module['status']=='first-checked-module':
   module.pop('moduleGraph');module.pop('moduleTermRoot');module.pop('moduleTypeRoot');module.update(closedRepresentation='ordered-source-projection-recipe/1',nativeTermShapeSha256=r['termSha256'],nativeExpectedTypeShapeSha256=r['typeSha256'],nativeTermOccurrences=r['termOccurrences'],nativeExpectedTypeOccurrences=r['typeOccurrences'],fingerprintMethod='expr-constructor-payload-ordered-children-count-scope/1')
  e['reducedContext'].pop('rawTypeGraph');e['reducedContext'].pop('rawTypeRoot');e['state']={k:v for k,v in e['state'].items() if k not in ['requiredSlots','expectReducedFailure']};entries.append(e)
 assert len(entries)==native['positiveRoutes']==149
 stats={k:ind[k] for k in ['nativeReducedContexts','omissionControls','modules','instantiations','properReductions','roles','properRoles','reuseRoles','offlineNodeLimit','publicMaterializedNodeLimitUnchanged']}
 source_evidence=native['sourceContextEvidence'];source_ref={k:source_evidence[k] for k in ['file','sha256','decodedBytes','checked','compiledModuleSha256']}
 pkg={'format':'ProofAtlasReducedReplayEvidence/1','source':native['source'],'leanVersion':'4.33.1','environment':{'kind':'public-packet-reduced-context/1','imports':native['imports'],**native['environment'],'originalProofModulesImported':False,'privateProofProjectsOrDependenciesBuilt':False},'sourceContextEvidence':source_ref,'baselineProof':native['baselineProof'],'baselineProofSha256':native['baselineProofSha256'],'nativeOutputSha256':native['nativeOutputSha256'],'queryInventorySha256':native['queryInventorySha256'],'producer':{'runtimeSha256':native['runtimeSha256'],'sourceFiles':native['producerFiles'],'checkerFiles':ind['checkerFiles'],'publisherSha256':sha(Path(__file__).read_bytes())},'statistics':stats,'entries':entries,'scope':'Every route in the frozen 149-observation inventory of one publisher-attributed AI proof. Native term/type closures, conversions and instantiations; original proof module absent. Recorded source-module hash belongs to earlier input evidence and is not reverified here. No new typing for unrecorded descendants, cross-declaration reuse, logical necessity, whole-proof compression or comprehension claim.'}
 b=encode(pkg);assert len(b)<=8*1024**2 and b'/Users/' not in b and b'/tmp/' not in b and b'moduleGraph' not in b;digest=sha(b);d={'format':'ProofAtlasReducedReplayDescriptor/1','file':'/public/data/proof-atlas/reduced-replay/'+digest+'.json.gz','sha256':digest,'decodedBytes':len(b),'source':native['source'],**stats};target=ROOT/d['file'].lstrip('/');manifest=ROOT/'public/data/proof-atlas/reduced-replay-manifest.js'
 if a.publish:
  target.parent.mkdir(exist_ok=True)
  if target.exists():assert gzip.decompress(target.read_bytes())==b
  else:target.write_bytes(gzip.compress(b,mtime=0))
  manifest.write_text('window.PROOF_ATLAS_REDUCED_REPLAY='+encode(d).decode()+';\n')
 else:
  assert json.loads(manifest.read_text().split('=',1)[1].strip().rstrip(';'))==d
  assert gzip.decompress(target.read_bytes())==b
 print(json.dumps({'status':'PASS','mode':'publish' if a.publish else 'check','descriptor':d,'originalProofScriptsOrLogsPublished':False}))
if __name__=='__main__':main()
