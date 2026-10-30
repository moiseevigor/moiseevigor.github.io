"""Require explicit kernel conversion results; errors never count as negatives."""
import argparse,gzip,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=BASE.parents[2]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--lean',type=Path,required=True);parser.add_argument('--cache',type=Path,required=True);parser.add_argument('--workdir',type=Path,required=True);parser.add_argument('--support',type=Path,required=True);a=parser.parse_args();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve()
 compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 raw=gzip.decompress((BASE/'native-check.json.gz').read_bytes());package=json.loads(raw);assert package['verification']['status']=='PASS'
 paths,recovery=module('strict_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve());support=a.support.resolve();stamp=json.loads((support/'private-modules.json').read_bytes());assert stamp==package['verification']['reusedRiccatiSupport'];assert all(sha((support/'SE2Conjugate'/f).read_bytes())==h for f,h in stamp['modules'].items())
 stable=module('strict_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'region-result-closures/Laws.lean').read_text().replace('import Lean','')+'\n'+(RESEARCH/'region-result-closures/ResultClosures.lean').read_text()+'\n'+(BASE/'StrictComparison.lean').read_text()
 files=[BASE/'StrictComparison.lean',BASE/'strict-compare.py']+[RESEARCH/f for f in ['packet-typing/verify.py','ExportLibrary.lean','ExportOccurrenceTypes.lean','LevelTransportControls.lean','compiled-replay/Replay.lean','packet-typing/PacketTyping.lean','region-result-closures/Laws.lean','region-result-closures/ResultClosures.lean','use-sites/verify.py','build_recursion_examples.py','evaluate_goedel.py']];producers={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};requests=[];inputs={}
 for i,p in enumerate(package['profiles']):
  packet=gzip.decompress((ROOT/p['record']['indexFile'].lstrip('/')).read_bytes());assert sha(packet)==p['source']['indexSha256'];packetFile=folder/('packet-'+str(i)+'.json');packetFile.write_bytes(packet);inputs[packetFile]=sha(packet)
  requests.append({'source':p['source'],'packetFile':str(packetFile),'cases':[{'id':g['id'],'context':g['sourceCommonContext'],'prefix':p['groups'][j]['prefixRoute'],'flat':g['flat'],'hierarchical':g['hierarchical'],'expectedConvertible':g['typeConvertible']} for j,g in enumerate(p['output']['groups'])]})
 rows=[]
 for name,selected in [('riccati',requests[:1]),('public',requests[1:])]:
  request=folder/(name+'-request.json');request.write_text(json.dumps(selected));inputs[request]=sha(request.read_bytes());output=folder/(name+'-output.json');entry=folder/(name+'-entry.lean');entry.write_text(('import SE2Conjugate.Riccati\n' if name=='riccati' else '')+stable+'\n#atlas_output_comparison '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n')
  activePaths=[folder]+([support] if name=='riccati' else [])+paths;env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,activePaths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};command=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,activePaths),str(lean),'-j1','-M6144',str(entry)];resources=run_checked(command,folder,name,env,timeout=120);result=json.loads(output.read_bytes());assert result['status']=='PASS'
  for p in result['profiles']:assert p['originalDeclarationImported']==p['privateRiccatiModulesImported']==(name=='riccati')
  for p in result['profiles']:
   for r in p['rows']:assert r['comparisonStatus']=='ok'
  rows.extend(result['profiles']);print(json.dumps({'status':'PASS','scope':name,'comparisons':sum(len(p['rows']) for p in result['profiles'])}),flush=True)
 assert all(sha(p.read_bytes())==h for p,h in inputs.items());assert producers=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files};assert sha(gzip.decompress((BASE/'native-check.json.gz').read_bytes()))==sha(raw)
 compared=[r for p in rows for r in p['rows']];assert len(compared)==27 and sum(not r['convertible'] for r in compared)==7
 report={'format':'ProofAtlasStrictOutputTypeComparison/1','status':'PASS','compiler':compiler,'nativeEvidenceSha256':sha(raw),'dependencyRecovery':recovery,'originalEnvironmentIdentityVerified':False,'comparisons':27,'explicitNonConversion':7,'kernelErrors':0,'profiles':rows,'producerFiles':producers,'scope':'Fresh explicit .ok kernel type-conversion results at exact original source prefixes; errors are fatal. Public comparisons use no private Riccati support path. No original private proof scripts are published.'}
 (BASE/'strict-comparison.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(),mtime=0));print(json.dumps({'status':'PASS','comparisons':27,'explicitNonConversion':7,'kernelErrors':0}))
if __name__=='__main__':main()
