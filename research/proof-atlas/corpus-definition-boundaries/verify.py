"""Fresh real-packet boundary checks, one guarded process/output at a time."""
import argparse,gzip,hashlib,importlib.util,json,os,sys,subprocess
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--support',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();lean=a.lean.resolve();support=a.support.resolve();planRaw=(folder/'plan.json').read_bytes();plan=json.loads(planRaw);assert plan['format']=='ProofAtlasCorpusDefinitionBoundariesPlan/1' and sum(len(p['cases']) for p in plan['profiles'])==11
 assert not (folder/'verification.json').exists() and not (folder/'outputs').exists(),'Use a new native workdir'
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=load('definition_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 private=json.loads((support/'private-modules.json').read_bytes());assert private['inputs']['compiler']==compiler and private['inputs']['dependencyInventorySha256']==recovery['binaryInventorySha256']
 def support_ok():
  assert all(sha((support/'SE2Conjugate'/n).read_bytes())==h for n,h in private['modules'].items())
  assert all(sha((support/'SE2Conjugate'/n).read_bytes())==h for n,h in private['inputs']['sources'].items())
 support_ok()
 files=[BASE/n for n in ['prepare.cjs','Corpus.lean','verify.py']]+[RESEARCH/n for n in ['definition-boundaries/Boundary.lean','binder-block-exchange/Blocks.lean','binder-computation-exchange/Exchange.lean','binder-computation-exchange/Laws.lean','region-result-closures/Laws.lean','region-result-closures/ResultClosures.lean','packet-typing/verify.py','packet-typing/PacketTyping.lean','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','use-sites/verify.py','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 stable=load('definition_runtime',RESEARCH/'packet-typing/verify.py').runtime()
 for name in ['region-result-closures/Laws.lean','region-result-closures/ResultClosures.lean','binder-computation-exchange/Laws.lean','binder-computation-exchange/Exchange.lean','binder-block-exchange/Blocks.lean','definition-boundaries/Boundary.lean']:stable+='\n'+(RESEARCH/name).read_text().replace('import Lean','')
 stable+='\n'+(BASE/'Corpus.lean').read_text()
 (folder/'scratch').mkdir();(folder/'outputs').mkdir();rows=[]
 for pi,profile in enumerate(plan['profiles']):
  isRiccati=profile['source']['name']=='JacobiData.slope_bound_abs'
  if isRiccati:assert profile['source']['sourceSha256']==private['inputs']['sources']['Riccati.lean']
  assert sha(Path(profile['packetFile']).read_bytes())==profile['source']['indexSha256']
  imports=([support] if isRiccati else [])+paths
  env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,[folder]+imports)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
  command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]+imports),str(lean),'-j1','-M6144']
  for ci,case in enumerate(profile['cases']):
   request=Path(case['requestFile']);assert sha(request.read_bytes())==case['requestSha256'];out=folder/'native-output.json';assert not out.exists()
   entry=folder/'NativeCorpusDefinitionBoundary.lean';entry.write_text(('import SE2Conjugate.Riccati\n' if isRiccati else '')+stable+'\n#atlas_corpus_definition_boundary '+json.dumps(str(request))+' => '+json.dumps(str(out))+'\n')
   resource=run_checked(command+[str(entry)],folder,f'native-{pi}-{ci}',env,timeout=120)
   raw=out.read_bytes();data=json.loads(raw);r=data['result'];assert data['source']==profile['source'] and data['id']==case['id'] and data['chosen']==case['chosen']
   assert all(data[k]==isRiccati for k in ['originalDeclarationImported','originalModuleImported','privateModulesImported','originalTypeAndBodyMatch'])
   assert r['closedPacketKernelTyping']=='PASS' and r['literalPromotionInverse']=='PASS' and len(r['selected'])==len(case['chosen'])
   if r['status']=='PASS':
    assert all(r[k]=='PASS' for k in ['functionTyping','declaredGoalInterfaceTyping','declaredGoalTypeConversion','sourceSpecializationTyping','sourceSpecializationConversion','sourceEqualityWitness','literalScheduleCoherence'])
    assert r['namespace']=='corpus-definition-boundary' and r['newInputs']==len(case['chosen'])
   else:assert r['status']=='KERNEL_REJECTED' and r['phase']=='promoted-closed-function'
   assert len(r['graph']['kind'])<=131072,'Native graph row bound'
   dest=folder/'outputs'/f'{pi}-{ci}.json.gz';dest.write_bytes(gzip.compress(raw,mtime=0));assert gzip.decompress(dest.read_bytes())==raw;out.unlink()
   row={'profile':pi,'case':ci,'id':case['id'],'status':r['status'],'outputFile':'outputs/'+dest.name,'outputSha256':sha(raw),'compressedSha256':sha(dest.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'resources':resource,'selected':len(case['chosen']),'nativeRows':len(r['graph']['kind'])};rows.append(row)
   (folder/'progress.json').write_text(json.dumps({'planSha256':sha(planRaw),'producerFiles':producers,'completed':rows},indent=2)+'\n')
   print(json.dumps({'status':r['status'],'name':profile['source']['name'],'id':case['id'],'rows':row['nativeRows']}),flush=True)
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};support_ok();assert (folder/'plan.json').read_bytes()==planRaw
 assert load('definition_cache_final',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())[1]==recovery
 report={'format':'ProofAtlasCorpusDefinitionBoundaryVerification/1','status':'PASS','compiler':compiler,'leanExecutableSha256':sha(lean.read_bytes()),'dependencyRecovery':recovery,'reusedRiccatiSupport':private,'freshPrivateSupportRebuild':False,'originalEnvironmentIdentityVerified':False,'planSha256':sha(planRaw),'baseline':plan['baseline'],'producerFiles':producers,'cases':rows,'scope':'All eleven frozen local-definition boundary plans on two compiled proofs, with native typing/rejection, declared-goal interface checks, exact source specialization and explicit import ownership. No arbitrary graph-region interface, original-environment identity, independent dependency rebuild, semantic compression or comprehension result.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':len(rows),'accepted':sum(r['status']=='PASS' for r in rows)}),flush=True)
if __name__=='__main__':main()
