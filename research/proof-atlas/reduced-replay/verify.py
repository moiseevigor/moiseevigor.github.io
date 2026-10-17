"""Kernel-check every recorded reduced context directly from an authenticated public packet."""
import argparse,gzip,hashlib,json,os,shutil,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import verify_dependencies,sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
FILES=[BASE/'ReducedReplay.lean',BASE/'prepare.cjs',BASE/'verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'context-modules/ExportContextModules.lean']
def runtime():
 exporter=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import Mathlib\nimport Aesop')
 occurrence=(RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
 levels=(RESEARCH/'LevelTransportControls.lean').read_text().split('def compactGraph')[0]+'\nend AtlasLevelTransport\n'
 context=(RESEARCH/'context-modules/ExportContextModules.lean').read_text().replace('import ExportOccurrenceTypes','')
 assert context.count('catch _ => pure true')==1
 context=context.replace('catch _ => pure true','catch ex =>\n    pure ((← ex.toMessageData.toString) == "Reduced context omitted term/type support")')
 return exporter+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'+occurrence+'\n'+levels+'\n'+(RESEARCH/'compiled-replay/Replay.lean').read_text()+'\n'+context+'\n'+(BASE/'ReducedReplay.lean').read_text()
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--dependency-reference',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--name',default='lean_workbook_plus_6206');a=p.parse_args()
 lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler;assert Path('/usr/bin/sandbox-exec').is_file()
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=30*1024**3
 source_hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in FILES};stable=runtime()
 paths,environment=verify_dependencies(a.dependency_reference.resolve());ai=json.loads((ROOT/'public/data/proof-atlas/goedel-sample-manifest.js').read_text().split('=',1)[1].strip().rstrip(';'));assert environment==ai['provenance']['environment']
 summary=json.loads(subprocess.check_output(['node',str(BASE/'prepare.cjs'),str(folder),a.name],cwd=ROOT,text=True));inventory=json.loads((folder/'inventory.json').read_text());record=inventory['record'];descriptor=inventory['sourceContextEvidence'];assert len(inventory['states'])==summary['positiveRoutes']+summary['omissionControls']<=512
 packet=folder/'packet.json';assert sha(packet.read_bytes())==record['indexSha256'];request=folder/'request.json';output=folder/'observations.ndjson';proof=folder/'proof.ndjson';entry=folder/'Reduced.lean'
 entry.write_text(stable+'\n#atlas_packet_replay '+json.dumps(str(folder/'proof-request.json'))+' => '+json.dumps(str(proof))+'\n#atlas_reduced_packet '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
 hashes={f.name:sha(f.read_bytes()) for f in [entry,request,packet,folder/'inventory.json',folder/'proof-request.json']}
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,[folder]+paths)),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
 resources=run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],folder,'native',env,30,120)
 assert environment==verify_dependencies(a.dependency_reference.resolve())[1] and runtime()==stable
 assert source_hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in FILES}
 assert hashes=={f.name:sha(f.read_bytes()) for f in [entry,request,packet,folder/'inventory.json',folder/'proof-request.json']}
 original_raw=gzip.decompress((ROOT/descriptor['file'].lstrip('/')).read_bytes());assert sha(original_raw)==descriptor['sha256'];original=json.loads(original_raw)
 rows=[json.loads(line) for line in output.read_text().splitlines()];assert len(rows)==len(inventory['states']);positive=negative=0
 for row,state in zip(rows,inventory['states']):
  assert row['source']==inventory['source'] and row['nativeDagMatchesPacket'] is True and row['kernelDeclarationTyping']=='PASS' and row['originalTheoremAbsentFromEnvironment'] is True and row['originalModuleAbsentFromEnvironment'] is True
  e=row['entry'];old=next(x for x in original['entries'] if x['state']['route']==state['route']);assert e['state']==state and e['status']=='checked'
  assert all(e[k]==old[k] for k in ['graph','typeRoot','recipe','role','node','actualContextDepth','retainedContextDepth','discardedPrefix'])
  use=e['reducedContext'];assert use['slots']==state['requiredSlots']
  if state['expectReducedFailure']:assert use['status']=='expected-rejection';negative+=1
  else:
   assert use['status']=='checked';positive+=1
   for k in ['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip']:assert use[k]=='PASS'
 assert positive==summary['positiveRoutes'] and negative==summary['omissionControls']
 proof_rows=[json.loads(line) for line in proof.read_text().splitlines()];assert len(proof_rows)==1;baseline=proof_rows[0]
 assert baseline['name']==record['name'] and baseline['indexSha256']==record['indexSha256'] and set(baseline['axioms'])==set(record['axioms']) and 'sorryAx' not in baseline['axioms']
 for k in ['kernelExpectedType','kernelProof','kernelExpectedTypeIsProposition','kernelExpectedTypeConversion']:assert baseline[k]=='PASS'
 for k in ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','wrongProofRejectedByKernel','illTypedBinderRejectedByKernel']:assert baseline[k] is True
 result={'status':'PASS','name':record['name'],'source':inventory['source'],'compiler':compiler,'environment':environment,'imports':['Mathlib','Aesop'],'originalProofModulesImported':False,'privateProofProjectsOrDependenciesBuilt':False,'sourceContextEvidence':descriptor,'positiveRoutes':positive,'omissionControls':negative,'nativeOutputSha256':sha(output.read_bytes()),'baselineProofSha256':sha(proof.read_bytes()),'baselineProof':baseline,'queryInventorySha256':sha(json.dumps(inventory['states'],separators=(',',':'),ensure_ascii=False).encode()),'runtimeSha256':sha(stable.encode()),'producerFiles':source_hashes,'resources':resources}
 (folder/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'status':'PASS','positiveRoutes':positive,'omissionControls':negative,'originalProofModulesImported':False}))
if __name__=='__main__':main()
