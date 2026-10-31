"""Fresh core-only native frontier functions; no private projects or mathlib cache."""
import argparse,copy,gzip,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(raw):return hashlib.sha256(raw).hexdigest()
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 lean=a.lean.resolve();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 names=['Controls.lean','Frontier.lean','prepare.cjs','verify.py']
 files=[BASE/n for n in names]+[RESEARCH/n for n in ['ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','packet-typing/verify.py','region-result-closures/ResultClosures.lean','region-result-closures/Laws.lean','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M2048']
 (folder/'FrontierControls.lean').write_bytes((BASE/'Controls.lean').read_bytes())
 resources=[run_checked(command+['-o',str(folder/'FrontierControls.olean'),str(folder/'FrontierControls.lean')],folder,'controls',env)]
 moduleHash=sha((folder/'FrontierControls.olean').read_bytes())
 exporter=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import FrontierControls').replace('startsWith "SE2Conjugate."','startsWith "FrontierControls"')
 (folder/'Export.lean').write_text(exporter+'\n#atlas_library '+json.dumps(str(folder/'packets'))+'\n')
 resources.append(run_checked(command+[str(folder/'Export.lean')],folder,'export',env))
 subprocess.run(['node',str(BASE/'prepare.cjs'),str(folder)],cwd=ROOT,check=True)
 planRaw=(folder/'plan.json').read_bytes();plan=json.loads(planRaw)
 spec=importlib.util.spec_from_file_location('frontier_runtime',RESEARCH/'packet-typing/verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 # All declarations in this iteration use Lean's own Init/Lean environment.
 stable=module.runtime().replace('import Mathlib\nimport Aesop','')+'\n'+(RESEARCH/'region-result-closures/Laws.lean').read_text().replace('import Lean','')+'\n'+(RESEARCH/'region-result-closures/ResultClosures.lean').read_text()+'\n'+(BASE/'Frontier.lean').read_text()
 profiles=[]
 for i,row in enumerate(plan['profiles']):
  request=Path(row['requestFile']);packet=Path(row['packetFile']);assert sha(request.read_bytes())==row['requestSha256'] and sha(packet.read_bytes())==row['source']['indexSha256']
  output=folder/f'output-{i}.json';entry=folder/'NativeFrontier.lean'
  entry.write_text(stable+'\n#atlas_frontier_functions '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
  resource=run_checked(command+[str(entry)],folder,'native-'+str(i),env)
  data=json.loads(output.read_bytes());assert data['source']==row['source'] and data['closedPacketKernelTyping']=='PASS' and data['originalDeclarationImported'] is False
  assert [c['status'] for c in data['cases']]==[c['expected'] for c in row['cases']]
  for c in data['cases']:
   if c['status']=='PASS':
    assert all(c[k]=='PASS' for k in ['functionTyping','sourceInstantiationTyping','sourceInstantiationConversion','sourceEqualityWitness','literalHoleReopening','literalParameterTypeRecovery'])
    assert len(c['graph']['kind'])<=131072
   else:assert c['phase']=='candidate-body' and len(c['rejectedFunctionGraph']['kind'])<=131072 and len(c['holes'])==c['parameters']
  profiles.append({'source':row['source'],'cases':row['cases'],'packet':json.loads(packet.read_bytes()),'output':data,'outputSha256':sha(output.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'resources':resource})
  print(json.dumps({'name':row['source']['name'],'statuses':[c['status'] for c in data['cases']]}),flush=True)
 refusals=[]
 for name in ['wrong-source-node','foreign-same-depth-context','overlap']:
  row=next(p for p in plan['profiles'] if p['source']['name'].endswith('siblings'))
  request=json.loads(Path(row['requestFile']).read_bytes());request['cases']=request['cases'][:1];c=request['cases'][0]
  if name=='wrong-source-node':c['holes'][0]['anchor']['node']+=1
  elif name=='foreign-same-depth-context':c['holes'][1]['context']=copy.deepcopy(c['holes'][0]['context'])
  else:c['holes'][1]=copy.deepcopy(c['holes'][0])
  expected='Overlapping frontier occurrences' if name=='overlap' else 'Exact frontier source/context mismatch'
  bad=folder/('bad-'+name+'.json');bad.write_text(json.dumps(request));out=folder/('bad-output-'+name+'.json');entry=folder/'Negative.lean'
  entry.write_text(stable+'\n#atlas_frontier_functions '+json.dumps(str(bad))+' => '+json.dumps(str(out))+'\n')
  try:run_checked(command+[str(entry)],folder,'negative-'+name,env)
  except RuntimeError:
   resource=json.loads((folder/('negative-'+name+'.resources.json')).read_bytes());log=(folder/('negative-'+name+'.log')).read_text()
   assert resource['exitCode']==1 and resource['stopReason'] is None and expected in log and not out.exists()
  else:raise AssertionError('Damaged frontier accepted')
  refusals.append({'name':name,'status':'REJECTED','reason':expected})
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 assert sha((folder/'plan.json').read_bytes())==sha(planRaw)
 assert sha((folder/'FrontierControls.olean').read_bytes())==moduleHash
 assert sha((folder/'FrontierControls.lean').read_bytes())==producers[str((BASE/'Controls.lean').relative_to(ROOT))]
 report={'format':'ProofAtlasFrontierNativeEvidence/1','status':'PASS','compiler':compiler,'leanExecutableSha256':sha(lean.read_bytes()),'compiledControlsModuleSha256':moduleHash,'exportRuntimeSha256':sha((folder/'Export.lean').read_bytes()),'producerFiles':producers,'environment':'Lean core only; no private modules, original declarations or Mathlib imported','originalExtractionEnvironmentIdentityVerified':False,'profiles':profiles,'resources':resources,'nativeRefusals':refusals,'scope':'Finite source-frontier functions with ordered dependent parameter types, literal source-hole reopening and native recovery. No arbitrary quotient substitution or measured comprehension.'}
 (folder/'native-check.json').write_text(json.dumps(report,ensure_ascii=False,separators=(',',':'))+'\n')
 print(json.dumps({'status':'PASS','profiles':len(profiles),'cases':sum(len(p['output']['cases']) for p in profiles)}))
if __name__=='__main__':main()
