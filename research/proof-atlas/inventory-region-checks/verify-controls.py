"""Fresh kernel and native-port checks for authored hidden-path controls only."""
import argparse,hashlib,importlib.util,json,os,shutil,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent; RESEARCH=BASE.parent; ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def write(p,v):p.write_text(json.dumps(v,separators=(',',':'))+'\n')
def module(name,file):
 s=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
 folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();assert shutil.disk_usage(folder).free>=30*1024**3
 lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('region_dependencies',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve())
 runtime=module('region_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'application-ports/Ports.lean').read_text()
 sources=[BASE/'verify-controls.py',BASE/'Controls.lean',BASE/'prepare-controls.cjs',RESEARCH/'application-ports/Ports.lean',RESEARCH/'application-ports/prepare.cjs',RESEARCH/'construction-composition/prepare.cjs',RESEARCH/'use-sites/verify.py',RESEARCH/'packet-typing/verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean']
 hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in sources};runs=[]
 def run(target,body,phase):
  target.mkdir();entry=target/'Runtime.lean';entry.write_text(runtime+'\n'+body)
  env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
  runs.append({'phase':phase,'runtimeSha256':sha(entry.read_bytes()),'resources':run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],target,phase,env,timeout=120)})
 controls=folder/'controls';controls.mkdir();names=['crossedGroups','longReturn']
 export='''
run_cmd do
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Control body absent"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v]),("declaration",Json.mkObj [("name",toJson name.toString),("kind",toJson "definition"),("kernelCheck",toJson "PASS"),("module",toJson "Runtime"),("rootPaths",toJson #["root.type","root.value"])])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``AtlasInventoryRegionControls.'+n+','+json.dumps(str(controls/(n+'.json')))+')' for n in names))
 run(folder/'export',(BASE/'Controls.lean').read_text()+'\n'+export,'export')
 subprocess.check_call(['node',str(BASE/'prepare-controls.cjs'),str(folder)],cwd=ROOT)
 plan=json.loads((folder/'plan.json').read_bytes());queries=[{'packetFile':str(controls/(n+'.json')),'source':row['source'],'mode':'replay','inputs':row['inputs']} for n,row in zip(names,plan)];write(folder/'requests.json',queries)
 run(folder/'replay','#atlas_application_ports '+json.dumps(str(folder/'requests.json'))+' => '+json.dumps(str(folder/'native.json')),'replay')
 native=json.loads((folder/'native.json').read_bytes());assert len(native)==len(plan)
 for source,row in zip(plan,native):
  assert row['source']==source['source'] and not row['refusals'];assert len(row['entries'])==len(source['inputs']);assert not row['originalDeclarationPresent'] and not row['originalModulePresent'] and not row['privateRiccatiModulesPresent']
  for expected,entry in zip(source['inputs'],row['entries']):
   assert entry['id']==expected['id'];j=entry['junction'];assert j['producer']['anchor']==expected['producer'] and j['producer']['context']==expected['producerContext'];assert j['consumer']['input']==expected['input'] and j['consumer']['slot']==expected['slot'];assert j['definitionHops']==expected['definitionHops'] and j['externalBinder']==expected['externalBinder'] and j['definitionBoundary']==expected['definitionBoundary']
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in sources}
 report={'format':'ProofAtlasInventoryRegionControlsNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'producerFiles':hashes,'runtimeBaseSha256':sha(runtime.encode()),'planSha256':sha((folder/'plan.json').read_bytes()),'nativeOutputSha256':sha((folder/'native.json').read_bytes()),'packets':{n:sha((controls/(n+'.json')).read_bytes()) for n in names},'profiles':len(plan),'calls':sum(len(p['calls']) for p in plan),'ports':sum(len(p['inputs']) for p in plan),'runs':runs,'originalPrivateSourcesRead':False,'scope':'Authored controls, fresh root typing and exact native port observations from packet replay without original declarations. No private project rebuild or general proof of the region quotient.'}
 write(folder/'verification.json',report);print(json.dumps({'status':'PASS','profiles':report['profiles'],'calls':report['calls'],'ports':report['ports']}),flush=True)
if __name__=='__main__':main()
