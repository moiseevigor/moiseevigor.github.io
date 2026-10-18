"""Reconstruct public source cuts and lexical targets with pinned core Lean.

Original mathematical proof modules are not imported. Independent expected packet
metadata is supplied by the request owner. Runtime reconstructions are not
individual quoted kernel certificates or mathematical proof type checks.
"""
import argparse,gzip,hashlib,importlib.util,json,os,re,shutil,sys
from pathlib import Path

BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def source_files():
 return [RESEARCH/'ExportLibrary.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'cut-refinement/Cut.lean',BASE/'Binding.lean',BASE/'NativeBindings.lean',BASE/'NativeCut.lean',BASE/'check.py',Path(__file__),RESEARCH/'build_recursion_examples.py',RESEARCH/'evaluate_goedel.py']
def runtime_source():
 exporter=(RESEARCH/'ExportLibrary.lean').read_text();assert exporter.count('import SE2Conjugate')==1
 exporter=exporter.replace('import SE2Conjugate','').split('syntax "#atlas_library ')[0]+'\nend AtlasLibrary\n'
 levels=(RESEARCH/'LevelTransportControls.lean').read_text().split('def compactGraph')[0].replace(' AtlasOccurrenceTypes','')+'\nend AtlasLevelTransport\n'
 replay=(RESEARCH/'compiled-replay/Replay.lean').read_text().split('def checked')[0]+'\nend AtlasPacketReplay\n'
 cut=(RESEARCH/'cut-refinement/Cut.lean').read_text().replace('import Lean\n','')
 text='\n'.join([exporter,levels,replay,cut,*[(BASE/f).read_text() for f in ['Binding.lean','NativeBindings.lean','NativeCut.lean']]])
 assert all(line.strip()=='import Lean'for line in text.splitlines()if line.strip().startswith('import '))
 return text+'\nset_option maxRecDepth 8192\nset_option maxHeartbeats 10000000\n'

def evidence(report):
 rows=[]
 for row in report['rows']:
  observed={k:v for k,v in row['native'].items()if k!='bindings'}
  rows.append({k:row[k]for k in ['source','packet','nativeOutputSha256','recordSetSha256','genericTheorems']}|{'native':observed,'bindings':row['independent']['bindings'],'externalTargets':row['independent']['externalTargets']})
 return {'format':'ProofAtlasNativeSourceCutEvidence/1','toolchain':'leanprover/lean4:v4.33.1','sourceFiles':report['sourceFiles'],'runtimeSha256':report['runtimeSha256'],'requests':report['requests'],'records':report['records'],'bindings':report['bindings'],'externalTargets':report['externalTargets'],'rows':rows,'scope':report['scope']}

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--requests',type=Path,nargs='+',required=True);p.add_argument('--reserve-gib',type=int,default=30);p.add_argument('--legacy-control-header',action='store_true');p.add_argument('--check-evidence',type=Path);a=p.parse_args();assert a.reserve_gib>=1 and 1<=len(a.requests)<=4096
 folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=a.reserve_gib*1024**3
 lean=a.lean.resolve();assert lean.is_file();env={'PATH':str(lean.parent)+os.pathsep+os.defpath,'LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
 version_resources=run_checked([str(lean),'--version'],folder,'version',env,a.reserve_gib,120);version=(folder/'version.log').read_text().strip();assert 'version 4.33.1,'in version
 files=source_files();hashes={str(f.relative_to(ROOT)):sha(f.read_bytes())for f in files};runtime=runtime_source();rows=[]
 spec=importlib.util.spec_from_file_location('source_cut_independent',BASE/'check.py');checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
 for number,request_path in enumerate(a.requests):
  request_path=request_path.resolve();assert request_path.stat().st_size<=64*1024**2
  independent=checker.run(request_path);request=json.loads(request_path.read_text());packet_path=Path(request['packetFile'])
  with gzip.open(packet_path,'rb')as stream:raw=stream.read(64*1024**2+1)
  assert len(raw)<=64*1024**2 and sha(raw)==request['expected']['indexSha256']
  original_sha=sha(raw);header_adapter=False;packet=json.loads(raw)
  if packet.get('serialization')!='ExprDAG/1':
   assert a.legacy_control_header and request['expected']['name']=='AtlasProjectionControl.hugeProofProjection'
   assert set(packet)=={'children','declaration','expanded','kind','neededScope','payloads','roots'}
   wrapped={'serialization':'ExprDAG/1',**packet};assert {k:v for k,v in wrapped.items()if k!='serialization'}==packet
   raw=json.dumps(wrapped,separators=(',',':')).encode();header_adapter=True
  work=folder/str(number);work.mkdir();source_file=work/'source.json';source_file.write_bytes(raw);request['packetFile']=str(source_file);request.setdefault('rejectedRefinements',[])
  request_file=work/'request.json';request_bytes=json.dumps(request).encode();assert len(request_bytes)<=64*1024**2;request_file.write_bytes(request_bytes);output=work/'native.json'
  text=runtime+'\n#atlas_source_cuts '+json.dumps(str(request_file))+' => '+json.dumps(str(output))+'\n';entry=work/'Native.lean';entry.write_text(text)
  cmd=[str(lean),str(entry)]
  if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*cmd]
  resources=run_checked(cmd,folder,'native-'+str(number),env,a.reserve_gib,120);log=(folder/('native-'+str(number)+'.log')).read_text();assert 'sorryAx'not in log
  theorems={name:sorted(x.strip()for x in axioms.split(',')if x.strip())for name,axioms in re.findall(r"'([^']+)' depends on axioms: \[([^\]]*)\]",log)}
  for name in ['ProofAtlas.SourceCut.Bridge.test_sound','ProofAtlas.SourceCut.Binding.agrees','ProofAtlas.SourceCut.Binding.source_target','ProofAtlas.SourceCut.Binding.refines_target']:
   assert name in theorems and set(theorems[name])<={'propext','Quot.sound'}
  assert output.stat().st_size<=64*1024**2;native=json.loads(output.read_text());assert native['format']=='ProofAtlasNativeSourceCuts/1' and native['records']==independent['records']
  assert len(native['bindings'])==native['records'];observations=[b for record in native['bindings']for b in record];assert sum(b['target']is not None for b in observations)==independent['bindings'];assert sum(b['external']for b in observations)==independent['externalTargets']
  detail={'source':request['expected'],'recordSetSha256':sha(json.dumps(request['records'],sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()),'packet':{'originalSha256':original_sha,'nativeInputSha256':sha(raw),'legacyControlHeaderAdapter':header_adapter},'nativeOutputSha256':sha(output.read_bytes()),'native':native,'independent':independent,'genericTheorems':theorems,'resources':resources};detail_bytes=json.dumps(detail,indent=2).encode();assert len(detail_bytes)<=64*1024**2;(work/'verification.json').write_bytes(detail_bytes);row={k:v for k,v in detail.items()if k!='native'};row['native']={k:v for k,v in native.items()if k!='bindings'};row['observationFile']=str(number)+'/native.json';rows.append(row)
  assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes())for f in files}
  progress=json.dumps({'status':'RUNNING','completed':len(rows),'rows':rows},indent=2);assert len(progress.encode())<=16*1024**2;(folder/'progress.json').write_text(progress+'\n')
  print(json.dumps({'status':'PASS','name':request['expected']['name'],'records':native['records'],'bindings':independent['bindings'],'externalTargets':independent['externalTargets']}),flush=True)
 report={'status':'PASS','format':'ProofAtlasNativeSourceCutVerification/1','compiler':version,'compilerResources':version_resources,'sourceFiles':hashes,'runtimeSha256':sha(runtime.encode()),'requests':len(rows),'records':sum(r['native']['records']for r in rows),'bindings':sum(r['independent']['bindings']for r in rows),'externalTargets':sum(r['independent']['externalTargets']for r in rows),'rows':rows,'scope':'Native expression-indexed source cuts and lexical target checks, with generic agreement/refinement laws. Not individual quoted certificates, mathematical proof typing, verified wire decoding, or renderer/comprehension evidence.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
 if a.check_evidence:
  descriptor=json.loads(a.check_evidence.read_text().split('=',1)[1].strip().rstrip(';'));raw=gzip.decompress((ROOT/descriptor['file'].lstrip('/')).read_bytes());assert sha(raw)==descriptor['sha256'] and len(raw)==descriptor['decodedBytes'];published=json.loads(raw);assert published['positive']==evidence(report)
 print(json.dumps({k:v for k,v in report.items()if k not in ['rows','sourceFiles']}))
if __name__=='__main__':main()
