"""Core-only typed exchange checks, using public authored control packets."""
import argparse,hashlib,importlib.util,json,subprocess,sys
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
 files=[BASE/n for n in ['Controls.lean','Laws.lean','Exchange.lean','prepare.cjs','verify.py']]+[RESEARCH/n for n in ['ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','packet-typing/verify.py','region-result-closures/ResultClosures.lean','region-result-closures/Laws.lean','build_recursion_examples.py','evaluate_goedel.py']]
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M2048']
 (folder/'ExchangeControls.lean').write_bytes((BASE/'Controls.lean').read_bytes())
 resources=[run_checked(command+['-o',str(folder/'ExchangeControls.olean'),str(folder/'ExchangeControls.lean')],folder,'controls',env)]
 exporter=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ExchangeControls').replace('startsWith "SE2Conjugate."','startsWith "ExchangeControls"')
 (folder/'Export.lean').write_text(exporter+'\n#atlas_library '+json.dumps(str(folder/'packets'))+'\n')
 resources.append(run_checked(command+[str(folder/'Export.lean')],folder,'export',env))
 subprocess.run(['node',str(BASE/'prepare.cjs'),str(folder)],cwd=ROOT,check=True)
 plan=json.loads((folder/'plan.json').read_bytes())
 for row in plan['profiles']:
  assert sha(Path(row['packetFile']).read_bytes())==row['source']['indexSha256']
  assert row['source']['sourceSha256']==producers[str((BASE/'Controls.lean').relative_to(ROOT))]
 spec=importlib.util.spec_from_file_location('exchange_runtime',RESEARCH/'packet-typing/verify.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 runtime=module.runtime().replace('import Mathlib\nimport Aesop','')+'\n'+(RESEARCH/'region-result-closures/Laws.lean').read_text().replace('import Lean','')+'\n'+(RESEARCH/'region-result-closures/ResultClosures.lean').read_text()+'\n'+(BASE/'Laws.lean').read_text().replace('import Lean','')+'\n'+(BASE/'Exchange.lean').read_text()
 entry=folder/'Native.lean';entry.write_text(runtime+'\n#atlas_binder_exchange '+json.dumps(str(folder/'plan.json'))+' => '+json.dumps(str(folder/'output.json'))+'\n')
 resources.append(run_checked(command+[str(entry)],folder,'native',env))
 output=json.loads((folder/'output.json').read_bytes());assert len(output['profiles'])==11
 for p in output['profiles']:
  assert p['closedPacketTyping']=='PASS' and p['originalDeclarationImported'] is False
  for k in ['status','termTyping','originalTypeAssignment','typeConversion','termConversion','equalityWitness','literalInverse','closedTyping']:assert p['result'][k]=='PASS'
 refusals=[]
 for kind in ['source-node','source-context','source-name']:
  import copy
  bad=copy.deepcopy(plan);bad['profiles']=bad['profiles'][:1];row=bad['profiles'][0]
  if kind=='source-node':row['anchor']['node']+=1
  elif kind=='source-context':row['context'][0]['node']+=1
  else:row['source']['name']='AtlasExchangeControls.foreign'
  expected='Exchange declaration identity mismatch' if kind=='source-name' else 'Exact exchange source/context mismatch'
  request=folder/('bad-'+kind+'.json');request.write_text(json.dumps(bad));out=folder/('bad-'+kind+'-output.json');entryBad=folder/'Negative.lean'
  entryBad.write_text(runtime+'\n#atlas_binder_exchange '+json.dumps(str(request))+' => '+json.dumps(str(out))+'\n')
  try:run_checked(command+[str(entryBad)],folder,'negative-'+kind,env)
  except RuntimeError:
   resource=json.loads((folder/('negative-'+kind+'.resources.json')).read_bytes())
   assert resource['exitCode']==1 and resource['stopReason'] is None and expected in (folder/('negative-'+kind+'.log')).read_text() and not out.exists()
  else:raise AssertionError('Malformed source accepted')
  refusals.append({'kind':kind,'status':'REJECTED','reason':expected})
 assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 report={'format':'ProofAtlasBinderExchangeVerification/1','status':'PASS','compiler':compiler,'leanExecutableSha256':sha(lean.read_bytes()),'controlModuleSha256':sha((folder/'ExchangeControls.olean').read_bytes()),'controlSourceSha256':sha((folder/'ExchangeControls.lean').read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'outputSha256':sha((folder/'output.json').read_bytes()),'planSha256':sha((folder/'plan.json').read_bytes()),'producerFiles':producers,'resources':resources,'nativeRefusals':refusals,'environment':'Lean core only; no Mathlib, private modules or original control declarations imported during replay','scope':'Typed let/lambda exchange on eleven authored compiled declarations and two general typed laws. Finite Expr-transformer bridge; no arbitrary-region compiler or measured comprehension.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','profiles':11,'laws':len(output['laws'])}))
if __name__=='__main__':main()
