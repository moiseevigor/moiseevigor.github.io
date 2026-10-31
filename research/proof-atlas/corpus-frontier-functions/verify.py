"""Native real-packet frontier functions, one bounded process and output at a time."""
import argparse,gzip,hashlib,importlib.util,json,os,sys,subprocess
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def load(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--support',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();lean=a.lean.resolve();support=a.support.resolve();planRaw=(folder/'plan.json').read_bytes();plan=json.loads(planRaw);assert plan['format']=='ProofAtlasCorpusFrontierPlan/1'
 assert not (folder/'verification.json').exists(),'Use a new evidence directory'
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=load('corpus_frontier_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 private=json.loads((support/'private-modules.json').read_bytes());assert private['inputs']['compiler']==compiler and private['inputs']['dependencyInventorySha256']==recovery['binaryInventorySha256']
 def support_ok():
  assert all(sha((support/'SE2Conjugate'/n).read_bytes())==h for n,h in private['modules'].items())
  assert all(sha((support/'SE2Conjugate'/n).read_bytes())==h for n,h in private['inputs']['sources'].items())
 support_ok()
 files=[BASE/n for n in ['prepare.cjs','Joint.lean','Corpus.lean','verify.py']]+[RESEARCH/n for n in ['frontier-functions/Frontier.lean','frontier-functions/model.cjs','region-result-closures/ResultClosures.lean','region-result-closures/Laws.lean','packet-typing/verify.py','packet-typing/PacketTyping.lean','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','use-sites/verify.py','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 stable=load('corpus_frontier_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'region-result-closures/Laws.lean').read_text().replace('import Lean','')+'\n'+(RESEARCH/'region-result-closures/ResultClosures.lean').read_text()+'\n'+(RESEARCH/'frontier-functions/Frontier.lean').read_text()+'\n'+(BASE/'Joint.lean').read_text()+'\n'+(BASE/'Corpus.lean').read_text()
 (folder/'scratch').mkdir();(folder/'outputs').mkdir();rows=[]
 for pi,profile in enumerate(plan['profiles']):
  isRiccati=profile['source']['name']=='JacobiData.slope_bound_abs'
  if isRiccati:assert profile['source']['sourceSha256']==private['inputs']['sources']['Riccati.lean']
  assert sha(Path(profile['packetFile']).read_bytes())==profile['source']['indexSha256']
  imports=([support] if isRiccati else [])+paths
  env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,[folder]+imports)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
  command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]+imports),str(lean),'-j1','-M6144']
  for ci,case in enumerate(profile['cases']):
   request=Path(case['requestFile']);assert sha(request.read_bytes())==case['requestSha256']
   out=folder/'native-output.json';assert not out.exists();entry=folder/'NativeCorpusFrontier.lean'
   entry.write_text(('import SE2Conjugate.Riccati\n' if isRiccati else '')+stable+'\n#atlas_corpus_frontier '+json.dumps(str(request))+' => '+json.dumps(str(out))+'\n')
   resource=run_checked(command+[str(entry)],folder,f'native-{pi}-{ci}',env,timeout=120)
   raw=out.read_bytes();data=json.loads(raw);c=data['case']
   assert data['source']==profile['source'] and data['closedPacketKernelTyping']=='PASS'
   assert all(data[k]==isRiccati for k in ['originalDeclarationImported','originalModuleImported','privateRiccatiModulesImported','recompiledOriginalTypeAndBodyMatch'])
   assert c['id']==case['case']['id'] and c['status']=='PASS' and c['namespace']=='source-frontier-function' and c['context']==[]
   assert all(c[k]=='PASS' for k in ['functionTyping','declaredGoalFunctionTyping','declaredGoalTypeConversion','sourceInstantiationTyping','sourceInstantiationConversion','sourceEqualityWitness','literalHoleReopening','literalParameterTypeRecovery'])
   assert c['storage']=='joint-scoped-components/1' and len(c['graph']['kind'])<=131072
   file=folder/'outputs'/f'{pi}-{ci}.json.gz';staged=file.with_suffix('.staged');staged.write_bytes(gzip.compress(raw,mtime=0));assert gzip.decompress(staged.read_bytes())==raw;staged.rename(file)
   out.unlink() # Keep one raw native output at a time.
   rows.append({'profile':pi,'case':ci,'id':c['id'],'outputFile':'outputs/'+file.name,'outputSha256':sha(raw),'compressedSha256':sha(file.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'resources':resource,'holes':len(c['holes']),'storedJointRows':len(c['graph']['kind'])})
   print(json.dumps({'status':'PASS','id':c['id'],'holes':len(c['holes']),'rows':len(c['graph']['kind'])}),flush=True)
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};support_ok()
 assert (folder/'plan.json').read_bytes()==planRaw
 # Re-hash the authentic recovered binary inventory after all native processes.
 assert load('corpus_frontier_cache_final',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())[1]==recovery
 report={'format':'ProofAtlasCorpusFrontierVerification/1','status':'PASS','compiler':compiler,'leanExecutableSha256':sha(lean.read_bytes()),'dependencyRecovery':recovery,'reusedRiccatiSupport':private,'freshPrivateSupportRebuild':False,'originalEnvironmentIdentityVerified':False,'planSha256':sha(planRaw),'baselineSha256':plan['baselineSha256'],'producerFiles':producers,'cases':rows,'scope':'Whole-root source-frontier functions over selected recorded Riccati/AI fragments. No arbitrary graph-region interface, original-environment identity, independent dependency rebuild, semantic compression or comprehension result.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':len(rows)}),flush=True)
if __name__=='__main__':main()
