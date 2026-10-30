"""Fresh kernel checks for finite scope/product regrouping adapters.

Original Riccati support binaries may be reused only with their recorded hashes;
original private sources and logs are not published. Public mode excludes them.
"""
import argparse,copy,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--support',type=Path);p.add_argument('--scope',choices=['all','public'],default='all');a=p.parse_args()
 if a.scope=='all' and a.support is None:p.error('All-mode requires the previously checked Riccati support folder')
 if a.scope=='public' and a.support is not None:p.error('Public mode excludes private support')
 folder=a.workdir.resolve();lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 planRaw=(folder/'plan.json').read_bytes();plan=json.loads(planRaw);assert plan['format']=='ProofAtlasScopeOutputCompositionPlan/1'
 (folder/'verification.json').unlink(missing_ok=True)
 paths,recovery=module('composition_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 private=None
 if a.support:
  support=a.support.resolve();private=json.loads((support/'private-modules.json').read_bytes())
  for name,digest in private['modules'].items():assert sha((support/'SE2Conjugate'/name).read_bytes())==digest
  for name,digest in private['inputs']['sources'].items():assert sha((support/'SE2Conjugate'/name).read_bytes())==digest
  assert private['inputs']['compiler']==compiler and private['inputs']['dependencyInventorySha256']==recovery['binaryInventorySha256']
  assert private['inputs']['sources']['Riccati.lean']==plan['profiles'][0]['source']['sourceSha256']
  paths=[support]+paths
 files=[BASE/n for n in ['Laws.lean','Composition.lean','Controls.lean','prepare-controls.py','prepare.cjs','verify.py']]+[RESEARCH/n for n in ['region-result-closures/Laws.lean','region-result-closures/ResultClosures.lean','packet-typing/verify.py','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','use-sites/verify.py','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 stable=module('composition_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'region-result-closures/Laws.lean').read_text().replace('import Lean','')+'\n'+(RESEARCH/'region-result-closures/ResultClosures.lean').read_text()+'\n'+(BASE/'Laws.lean').read_text().replace('import Lean','')+'\n'+(BASE/'Composition.lean').read_text()
 (folder/'scratch').mkdir(exist_ok=True)
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,[folder]+paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]+paths),str(lean),'-j1','-M6144']
 rows=[];checked={}
 for i,row in enumerate(plan['profiles']):
  if a.scope=='public' and i==0:continue
  request=Path(row['requestFile']);packet=Path(row['packetFile']);assert sha(request.read_bytes())==row['requestSha256'];assert sha(packet.read_bytes())==row['source']['indexSha256'];checked[request]=row['requestSha256'];checked[packet]=row['source']['indexSha256']
  output=folder/f'output-{i}.json';output.unlink(missing_ok=True)
  entry=folder/'NativeComposition.lean';entry.write_text(('import SE2Conjugate.Riccati\n' if i==0 else '')+stable+'\n#atlas_output_composition '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
  resources=run_checked(command+[str(entry)],folder,'native-'+str(i),env,timeout=120)
  data=json.loads(output.read_bytes());assert data['status']=='PASS' and data['source']==row['source'] and all(data[k]==(i==0) for k in ['originalDeclarationImported','originalModuleImported','privateRiccatiModulesImported']) and data['closedPacketKernelTyping']=='PASS'
  assert len(data['groups'])==len(row['groups']) and len(data['laws'])==4 and all(l['kernelTyping']=='PASS' and l['axioms']==[] for l in data['laws'])
  for case,expected in zip(data['groups'],row['groups']):
   assert case['id']==expected['id'];assert case['partition']==[g['positions'] for g in expected['subgroups']];assert case['sourceCommonContext']==expected['commonContext'];assert case['subgroupContexts']==[g['commonContext'] for g in expected['subgroups']]
   assert all(case[k]=='PASS' for k in ['flattenTyping','gatherTyping','sourceFlatRecovery','sourceHierarchicalRecovery','arbitraryFlatRoundTrip','arbitraryHierarchicalRoundTrip']);assert case['isIndependentBoundaryFunction'] is False
  rows.append({'source':row['source'],'cases':len(data['groups']),'ports':sum(len(g['calls']) for g in row['groups']),'outputSha256':sha(output.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'resources':resources});print(json.dumps({'status':'PASS','name':row['source']['name'],'cases':len(data['groups'])}),flush=True)
 # Expected native rejections must have an ordinary elaboration error, not
 # a resource stop, process failure or missing file.
 refusals=[];sourceRequest=json.loads(Path(plan['profiles'][-1]['requestFile']).read_bytes())
 for name in ['duplicate-position','foreign-source-binding','wrong-context-prefix']:
  bad=copy.deepcopy(sourceRequest);bad['groups']=bad['groups'][:1];sub=bad['groups'][0]['subgroups'][0]
  if name=='duplicate-position':sub['positions'][1]=sub['positions'][0]
  elif name=='foreign-source-binding':sub['calls'][0]['anchor']['node']+=1
  else:sub['commonContext']=sub['commonContext'][:-1]
  reason='Group exact common prefix' if name=='wrong-context-prefix' else 'Subgroup changed original source binding'
  badFile=folder/('negative-'+name+'.json');badFile.write_text(json.dumps(bad));output=folder/('negative-output-'+name+'.json');output.unlink(missing_ok=True)
  entry=folder/'NegativeComposition.lean';entry.write_text(stable+'\n#atlas_output_composition '+json.dumps(str(badFile))+' => '+json.dumps(str(output))+'\n')
  try:run_checked(command+[str(entry)],folder,'negative-'+name,env,timeout=120)
  except RuntimeError:
   resources=json.loads((folder/('negative-'+name+'.resources.json')).read_bytes());log=(folder/('negative-'+name+'.log')).read_text();assert resources['exitCode']==1 and resources['stopReason'] is None and reason in log and not output.exists()
  else:raise AssertionError('Damaged source binding accepted')
  refusals.append({'case':name,'status':'REJECTED','reason':reason})
 assert sha((folder/'plan.json').read_bytes())==sha(planRaw);assert all(sha(f.read_bytes())==v for f,v in checked.items());assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 if a.support:
  assert all(sha((support/'SE2Conjugate'/f).read_bytes())==d for f,d in private['modules'].items());assert all(sha((support/'SE2Conjugate'/f).read_bytes())==d for f,d in private['inputs']['sources'].items())
 report={'format':'ProofAtlasScopeOutputCompositionVerification/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':producers,'reusedRiccatiSupport':private,'freshPrivateSupportRebuild':False,'originalEnvironmentIdentityVerified':False,'runScope':a.scope,'planSha256':sha(planRaw),'baselineSha256':plan['baselineSha256'],'profiles':rows,'nativeRefusals':refusals,'cases':sum(r['cases'] for r in rows),'portAppearances':sum(r['ports'] for r in rows),'scope':'Fresh typed adapters between hierarchical and flat output collections, with arbitrary-input round trips at exact source contexts. No independent boundary-input function, general quotient substitution, semantic compression or comprehension result.'}
 assert report['cases']==(27 if a.scope=='all' else 21);assert report['portAppearances']==(93 if a.scope=='all' else 63)
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','cases':report['cases'],'ports':report['portAppearances']}),flush=True)
if __name__=='__main__':main()
