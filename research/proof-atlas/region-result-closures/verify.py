"""Fresh common-prefix output typing. Original Riccati source stays private."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--snapshot',type=Path);p.add_argument('--scope',choices=['all','public'],default='all');a=p.parse_args()
 if a.scope=='all' and a.snapshot is None:p.error('--snapshot is required for the Riccati entries')
 if a.scope=='public' and a.snapshot is not None:p.error('Public replay does not accept a private snapshot')
 folder=a.workdir.resolve();lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 plan_bytes=(folder/'plan.json').read_bytes();plan=json.loads(plan_bytes);assert plan['format']=='ProofAtlasRegionResultClosuresPlan/1' and len(plan['profiles'])==5
 (folder/'verification.json').unlink(missing_ok=True)
 paths,recovery=module('closure_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 source_files={}
 if a.scope=='all':
  source_files={a.snapshot.resolve()/'SE2Conjugate'/(name+'.lean'):None for name in ['Jacobi','Identities','Riccati']}
  source_files={file:sha(file.read_bytes()) for file in source_files};assert source_files[a.snapshot.resolve()/'SE2Conjugate/Riccati.lean']==plan['profiles'][0]['source']['sourceSha256']
 else:assert not (folder/'SE2Conjugate').exists() and not (folder/'private-modules.json').exists(),'Use a fresh public-only workdir'
 files=[BASE/n for n in ['Controls.lean','prepare-controls.py','prepare.cjs','Laws.lean','ResultClosures.lean','verify.py']]+[RESEARCH/n for n in ['packet-typing/verify.py','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','use-sites/verify.py','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 (folder/'scratch').mkdir(exist_ok=True)
 if a.scope=='all':(folder/'SE2Conjugate').mkdir(exist_ok=True)
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,[folder]+paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]+paths),str(lean)]
 stamp_file=folder/'private-modules.json';stamp=json.loads(stamp_file.read_bytes()) if stamp_file.exists() else None
 inputs={'compiler':compiler,'dependencyInventorySha256':recovery['binaryInventorySha256'],'sources':{file.name:digest for file,digest in source_files.items()}}
 if a.scope=='public':
  assert stamp is None
 elif stamp:
  assert stamp['inputs']==inputs
  assert all(sha((folder/'SE2Conjugate'/file).read_bytes())==digest for file,digest in stamp['modules'].items())
  assert all(sha((folder/'SE2Conjugate'/file).read_bytes())==digest for file,digest in inputs['sources'].items())
 else:
  modules={}
  for original,digest in source_files.items():
   dest=folder/'SE2Conjugate'/original.name
   if dest.exists():assert sha(dest.read_bytes())==digest
   else:
    raw=original.read_bytes();assert sha(raw)==digest;dest.write_bytes(raw)
   out=dest.with_suffix('.olean');assert not out.exists(),'Incomplete earlier compile: use a fresh workdir'
   run_checked(command+['-o',str(out),str(dest)],folder,'compile-'+original.stem,env,timeout=120)
   modules[out.name]=sha(out.read_bytes())
  stamp={'inputs':inputs,'modules':modules};stamp_file.write_text(json.dumps(stamp,indent=2)+'\n')
 stable=module('closure_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(BASE/'Laws.lean').read_text().replace('import Lean','')+'\n'+(BASE/'ResultClosures.lean').read_text()
 rows=[];checked={}
 for i,row in enumerate(plan['profiles']):
  if a.scope=='public' and i==0:continue
  request=Path(row['requestFile']);packet=Path(row['packetFile']);assert sha(request.read_bytes())==row['requestSha256'];assert sha(packet.read_bytes())==row['source']['indexSha256']
  checked[request]=row['requestSha256'];checked[packet]=row['source']['indexSha256']
  output=folder/f'output-{i}.json';output.unlink(missing_ok=True)
  entry=folder/'NativeResultClosures.lean';header='import SE2Conjugate.Riccati\n' if i==0 else ''
  entry.write_text(header+stable+'\n#atlas_result_closures '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
  run_checked(command+[str(entry)],folder,f'native-{i}',env,timeout=120)
  data=json.loads(output.read_bytes());assert data['status']=='PASS' and data['source']==row['source'];assert all(data[k]==(i==0) for k in ['originalDeclarationImported','originalModuleImported','privateRiccatiModulesImported','recompiledOriginalTypeAndBodyMatch']);assert data['closedPacketKernelTyping']=='PASS';assert len(data['groups'])==len(row['groups'])
  assert len(data['laws'])==3 and all(law['kernelTyping']=='PASS' and law['axioms']==([] if i==0 else ['propext']) for i,law in enumerate(data['laws']))
  ports=0
  for group,expected in zip(data['groups'],row['groups']):
   assert group['id']==expected['id'] and group['commonContext']==expected['commonContext'];assert group['tupleTyping']=='PASS' and group['isIndependentBoundaryFunction'] is False;assert len(group['ports'])==len(expected['calls'])
   for port in group['ports']:
    assert all(port['port']['composition'][k]=='PASS' for k in ['termStructuralEquality','typeStructuralEquality','intermediatePrefixTyping','targetPrefixTyping']);assert port['port']['literalReopening']=='PASS' and port['port']['suffixSupportClosed']=='PASS'
    assert all(port['checks'][k]=='PASS' for k in ['projectionTyping','projectionConversion','instantiationTyping','instantiationConversion']);assert port['checks']['wrongTypeRejected'] is True;ports+=1
  rows.append({'source':row['source'],'groups':len(data['groups']),'ports':ports,'outputSha256':sha(output.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'originalDeclarationImported':i==0});print(json.dumps({'status':'PASS','name':row['source']['name'],'ports':ports}),flush=True)
 assert sha((folder/'plan.json').read_bytes())==sha(plan_bytes);assert all(sha(f.read_bytes())==v for f,v in checked.items());assert all(sha(f.read_bytes())==v for f,v in source_files.items());assert all(sha((folder/'SE2Conjugate'/name).read_bytes())==v for name,v in inputs['sources'].items());assert all(sha((folder/'SE2Conjugate'/name).read_bytes())==v for name,v in (stamp['modules'] if stamp else {}).items());assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 report={'format':'ProofAtlasRegionResultClosuresNativeVerification/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':producers,'privateRiccatiSourceModules':stamp,'originalEnvironmentIdentityVerified':False,'runScope':a.scope,'originalPrivateSourcesRead':a.scope=='all','planSha256':sha(plan_bytes),'profiles':rows,'groups':sum(r['groups'] for r in rows),'ports':sum(r['ports'] for r in rows),'scope':'Fresh kernel typing of common-prefix result closures and their PProd tuple; projected/instantiated ports recover original terms by recorded conversion, with a separate literal source reopening check. All-mode Riccati support is rebuilt from pinned private source, which is not published; public mode excludes those entries and reads no private source. Other original theorem/modules are absent. No independent boundary-input function, quotient substitution theorem, premise necessity or comprehension result.'}
 assert report['groups']==(6 if a.scope=='all' else 4) and report['ports']==(24 if a.scope=='all' else 14)
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','groups':report['groups'],'ports':report['ports']}),flush=True)
if __name__=='__main__':main()
