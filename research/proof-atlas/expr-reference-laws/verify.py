"""Core-only replay of raw compiled graphs against proved Expr reference functions."""
import argparse,gzip,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def runtime():
 spec=importlib.util.spec_from_file_location('expr_reference_runtime',RESEARCH/'packet-typing/verify.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
 return m.runtime().replace('import Mathlib\nimport Aesop','import Lean')+'\n'+(BASE/'Reference.lean').read_text().replace('import Lean','')+'\n'+(BASE/'Bridge.lean').read_text()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 lean=a.lean.resolve();folder=a.workdir.resolve();raw=(folder/'plan.json').read_bytes();plan=json.loads(raw)
 assert plan['format']=='ProofAtlasExprReferencePlan/1' and len(plan['profiles'])==29 and plan['queries']==100
 assert not (folder/'verification.json').exists() and not (folder/'outputs').exists(),'Use a fresh prepared workdir'
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 files=[BASE/n for n in ['Reference.lean','Bridge.lean','Controls.lean','prepare.cjs','verify.py']]+[RESEARCH/n for n in ['packet-typing/verify.py','packet-typing/PacketTyping.lean','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};executable=sha(lean.read_bytes());stable=runtime()
 (folder/'scratch').mkdir();(folder/'outputs').mkdir()
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M4096']
 controlsEntry=folder/'Controls.lean';controlsOutput=folder/'controls.json'
 controlsEntry.write_text(stable+'\n'+(BASE/'Controls.lean').read_text()+'\n#atlas_expr_reference_controls '+json.dumps(str(controlsOutput))+'\n')
 controlsResources=run_checked(command+[str(controlsEntry)],folder,'controls',env,timeout=120)
 controlsRaw=controlsOutput.read_bytes();controls=json.loads(controlsRaw)
 assert controls['sampleCount']==17 and controls['valueCount']==3 and controls['typedProofs'] is False
 assert [len(controls[k]) for k in ['lifts','swaps','substitutions']]==[204,68,204]
 assert sorted(set(controls['graph']['kind']))==list(range(12))
 assert controls['rawEqualityRefusals']==2 and controls['depthRefusals']==1
 controlsArchive=folder/'outputs/controls.json.gz';controlsArchive.write_bytes(gzip.compress(controlsRaw,mtime=0));controlsOutput.unlink()
 controlsRecord={'outputFile':'outputs/controls.json.gz','outputSha256':sha(controlsRaw),'runtimeSha256':sha(controlsEntry.read_bytes()),'resources':controlsResources}
 rows=[]
 for i,profile in enumerate(plan['profiles']):
  assert sha(Path(profile['requestFile']).read_bytes())==profile['requestSha256'];assert sha(Path(profile['graphFile']).read_bytes())==profile['graphSha256']
  prior=ROOT/profile['nativeInventory']['file'];assert sha(prior.read_bytes())==profile['nativeInventory']['sha256']
  entry=folder/'Check.lean';output=folder/'native-output.json';assert not output.exists()
  entry.write_text(stable+'\n#atlas_expr_reference '+json.dumps(profile['requestFile'])+' => '+json.dumps(str(output))+'\n')
  resource=run_checked(command+[str(entry)],folder,'native-'+str(i),env,timeout=120)
  content=output.read_bytes();data=json.loads(content)
  assert data['id']==profile['id'] and data['source']==profile['source'] and data['nativeCaseSha256']==profile['nativeCaseSha256'] and data['nativeInventory']==profile['nativeInventory']
  assert data['exactRoundtrip']=='PASS' and data['originalDeclarationImported'] is False
  assert len(data['laws'])==16 and all(l['kernelTyping']=='PASS' and 'sorryAx' not in l['axioms'] for l in data['laws'])
  assert [r['query'] for r in data['observations']]==profile['queries']
  assert all(all(r[k]=='PASS' for k in ['referenceDomain','nativeInstantiate','memoizedPrimitives','completeRecordedBlock']) for r in data['observations'])
  dest=folder/'outputs'/f'{i}.json.gz';dest.write_bytes(gzip.compress(content,mtime=0));assert gzip.decompress(dest.read_bytes())==content;output.unlink()
  row={'profile':i,'source':profile['source'],'id':profile['id'],'nativeCaseSha256':profile['nativeCaseSha256'],'outputFile':'outputs/'+dest.name,'outputSha256':sha(content),'runtimeSha256':sha(entry.read_bytes()),'queries':len(data['observations']),'resources':resource};rows.append(row)
  (folder/'progress.json').write_text(json.dumps({'completed':rows,'planSha256':sha(raw)},indent=2)+'\n')
  print(json.dumps({'status':'PASS','profile':i,'id':profile['id'],'queries':len(data['observations'])}),flush=True)
 assert sum(r['queries'] for r in rows)==100
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};assert sha(lean.read_bytes())==executable;assert (folder/'plan.json').read_bytes()==raw
 report={'format':'ProofAtlasExprReferenceVerification/1','status':'PASS','compiler':compiler,'leanExecutableSha256':executable,'producerFiles':producers,'planSha256':sha(raw),'profiles':rows,'controls':controlsRecord,'environment':'Lean core only. Original compiled Exprs treated as raw data; no original proof typing replay, private modules or Mathlib imported.','independentDependencyRebuild':False,'scope':'Sixteen general theorems about structural functions on Lean.Expr; finite direct/memoized/native implementation bridges across all 100 frozen exchange steps. No general proof of the memoized serializer or opaque native primitives, typing preservation or semantic interpretation.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','profiles':29,'queries':100}),flush=True)
if __name__=='__main__':main()
