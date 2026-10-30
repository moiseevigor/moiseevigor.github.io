"""Fresh contextual port conversions using public compiled packets only."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 plan_bytes=(folder/'plan.json').read_bytes();plan=json.loads(plan_bytes);assert plan['format']=='ProofAtlasMethodConversionPlan/1' and len(plan['profiles'])==3
 paths,recovery=module('port_recovery',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 stable=module('port_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(BASE/'StrictBeta.lean').read_text()+'\n'+(BASE/'PortConversion.lean').read_text()
 files=[BASE/'prepare.cjs',BASE/'verify.py',BASE/'StrictBeta.lean',BASE/'PortConversion.lean',RESEARCH/'packet-typing/verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'use-sites/verify.py',RESEARCH/'build_recursion_examples.py']
 producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};(folder/'scratch').mkdir(exist_ok=True)
 env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
 profiles=[];checked_inputs={}
 for row in plan['profiles']:
  i=row['ordinal'];request=Path(row['requestFile']);assert sha(request.read_bytes())==row['requestSha256'];assert sha((folder/f'packet-{i}.json').read_bytes())==row['packetSha256']
  checked_inputs[request]=row['requestSha256'];checked_inputs[folder/f'packet-{i}.json']=row['packetSha256']
  output=folder/f'output-{i}.json';output.unlink(missing_ok=True);entry=folder/'NativePorts.lean';entry.write_text(stable+'\n#atlas_port_conversions '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
  command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)]
  run_checked(command,folder,'native-'+str(i),env,timeout=120)
  data=json.loads(output.read_bytes());assert data['status']=='PASS' and data['originalDeclarationKernelTyping']=='PASS';assert data['source']['name']==row['name'] and data['source']['indexSha256']==row['packetSha256'];assert data['originalNativeOwner']==row['descriptor']['sha256'];assert all(data[k] for k in ['originalTheoremAbsent','originalModuleAbsent','privateResearchModulesAbsent'])
  ports=sum(len(q['ports']) for q in data['queries']);assert ports==row['ports']
  for q in data['queries']:
   for port in q['ports']:
    assert port['contextLength']==port['originalContextLength']+port['computedInputs'];assert len(port['prefixChecks'])==port['computedInputs'];assert all(x['kernelDomainConversion']=='PASS' and x['termAtExpectedDomain']=='PASS' for x in port['prefixChecks'])
    for key in ['expectedIsType','computedIsType','kernelTypeConversion','kernelTermAtExpectedType']:assert port['checks'][key]=='PASS'
    assert port['checks']['exactContextRoundtrip'] is True and port['checks']['wrongTypeRejected'] is True
  profiles.append({'source':data['source'],'outputSha256':sha(output.read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'ports':ports,'originalNativeOwner':row['descriptor']['sha256']});print(json.dumps({'status':'PASS','profile':row['name'],'ports':ports}),flush=True)
 assert all(sha(file.read_bytes())==digest for file,digest in checked_inputs.items());assert sha((folder/'plan.json').read_bytes())==sha(plan_bytes);assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 report={'format':'ProofAtlasMethodPortNativeVerification/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'originalEnvironmentIdentityVerified':False,'producerFiles':producers,'planSha256':sha(plan_bytes),'profiles':profiles,'ports':sum(r['ports'] for r in profiles),'originalProofSourcesRead':False,'originalProofModulesImported':False,'scope':'Fresh kernel checking of exact displayed method-port types and their actual body terms in reconstructed original/computed contexts. Public compiled packets only; cache-attributed dependency environment, no independent source rebuild or original dependency-inventory identity claim.'}
 (folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'status':'PASS','profiles':len(profiles),'ports':report['ports']}),flush=True)
if __name__=='__main__':main()
