"""General function/argument ports, checked from compiled or replayed terms."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
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
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--riccati-build',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('application_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve());runtime=module('application_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(BASE/'Ports.lean').read_text()
 files=[BASE/'verify.py',BASE/'Ports.lean',BASE/'Controls.lean',BASE/'prepare.cjs',RESEARCH/'construction-composition/prepare.cjs',RESEARCH/'use-sites/verify.py',RESEARCH/'packet-typing/verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',ROOT/'public/js/proof-atlas-library-data.js',ROOT/'public/js/proof-atlas-occurrence-types.js',ROOT/'public/js/proof-atlas-equality-transport.js'];hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 def run(target,code,phase,private=False):
  entry=target/'Runtime.lean';body=runtime.replace('import Mathlib\nimport Aesop','import SE2Conjugate.Riccati') if private else runtime;entry.write_text(body+'\n'+code);imports=([a.riccati_build.resolve()]+paths) if private else paths;env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,imports)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,imports),str(lean),str(entry)],target,phase,env,timeout=600);return sha(entry.read_bytes())
 controls=folder/'controls';controls.mkdir();names=['dependent','functions','instances','partialUse','binding','wide','visibility','aliasType'];export='''
run_cmd do
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Fixture body"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v]),("declaration",Json.mkObj [("name",toJson name.toString),("kind",toJson "definition"),("kernelCheck",toJson "PASS"),("module",toJson "Runtime"),("rootPaths",toJson #["root.type","root.value"])])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``AtlasApplicationPorts.'+n+','+json.dumps(str(controls/(n+'.json')))+')' for n in names))
 run(controls,(BASE/'Controls.lean').read_text()+'\n'+export,'fixtures');descriptors=[]
 for name in names:
  file=controls/(name+'.json');raw=file.read_bytes();data=json.loads(raw);record={'name':data['declaration']['name'],'module':'Runtime','kind':'definition','sourceSha256':sha((BASE/'Controls.lean').read_bytes()),'indexSha256':sha(raw),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))};anchors=[];visits=0
  def walk(n,ss,parent_app_fn=False):
   nonlocal visits
   visits+=1;assert visits<=16384
   if data['kind'][n]==5 and not parent_app_fn:anchors.append({'node':n,'route':{'root':1,'slots':ss}})
   for slot,c in enumerate(data['children'][n]):walk(c,ss+[slot],data['kind'][n]==5 and slot==0)
  walk(data['roots'][1],[]);assert 0<len(anchors)<=128;source={'edition':'application-port-controls',**{k:record[k] for k in ['name','indexSha256','sourceSha256']}};descriptors.append({'source':source,'record':record,'packetFile':str(file),'anchors':anchors})
 write(controls/'descriptors.json',descriptors)
 prepare='''const fs=require('fs'),p=require('./research/proof-atlas/application-ports/prepare.cjs'),folder=process.argv[1],controls=JSON.parse(fs.readFileSync(folder+'/controls/descriptors.json')),rows=p.prepare(folder);for(const d of controls)rows.push(p.plan(d.source,d.record,null,JSON.parse(fs.readFileSync(d.packetFile)),d.anchors,'authored-application'));fs.writeFileSync(folder+'/plan.json',JSON.stringify(rows));''';subprocess.check_call(['node','-e',prepare,str(folder)],cwd=ROOT);plan=json.loads((folder/'plan.json').read_bytes());manifest=json.loads((a.riccati_build/'riccati-verification.json').read_text());compiled={}
 for name,row in manifest['sourceModules'].items():
  f=a.riccati_build/Path(*name.split('.')).with_suffix('.olean');assert sha(f.read_bytes())==row['compiledModuleSha256'];compiled[name]=row['compiledModuleSha256']
 reports=[]
 for mode in ['compiled','replay']:
  selected=[x for x in plan if (x['source']['edition']=='published-15')==(mode=='compiled')];target=folder/mode;target.mkdir();queries=[]
  for x in selected:
   file=folder/x['record']['indexSha256']/'packet.json'
   if x['source']['edition']=='application-port-controls':file=controls/(x['record']['name'].split('.')[-1]+'.json')
   assert sha(file.read_bytes())==x['record']['indexSha256'];queries.append({'packetFile':str(file),'source':x['source'],'mode':mode,'inputs':x['inputs']})
  write(target/'requests.json',queries);runtime_hash=run(target,'#atlas_application_ports '+json.dumps(str(target/'requests.json'))+' => '+json.dumps(str(target/'native.json')),mode,mode=='compiled');out=json.loads((target/'native.json').read_bytes());assert len(out)==len(queries)
  for x,row in zip(selected,out):
   assert row['source']==x['source'];assert len(row['entries'])==len(x['inputs']),row['refusals'];assert not row['refusals'];assert row['originalDeclarationPresent']==(mode=='compiled');assert row['originalModulePresent']==(mode=='compiled');assert row['privateRiccatiModulesPresent']==(mode=='compiled');expected={i['id']:i for i in x['inputs']}
   for entry in row['entries']:
    q=expected[entry['id']];j=entry['junction'];assert j['producer']['anchor']==q['producer'] and j['producer']['context']==q['producerContext'] and j['definitionHops']==q['definitionHops'];assert j['consumer']['input']==q['input'] and j['consumer']['slot']==q['slot'];assert j['externalBinder']==q['externalBinder'] and j['definitionBoundary']==q['definitionBoundary'];assert j['portKind']==('function' if q['slot']==0 else 'argument')
   print(json.dumps({'name':x['record']['name'],'calls':len(x['calls']),'ports':len(row['entries'])}),flush=True)
  reports.append({'mode':mode,'runtimeSha256':runtime_hash,'nativeOutputSha256':sha((target/'native.json').read_bytes()),'profiles':len(selected),'calls':sum(len(x['calls']) for x in selected),'ports':sum(len(r['entries']) for r in out)})
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 write(folder/'verification.json',{'format':'ProofAtlasApplicationPortsVerification/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'compiledModules':compiled,'producerFiles':hashes,'planSha256':sha((folder/'plan.json').read_bytes()),'records':reports,'originalPrivateSourcesRead':False,'scope':'All actual argument slots and the function port at explicitly inventoried applications. Literal head-type dependencies have a separately checked instantiation bridge and explicit prefix boundaries; no tactic reconstruction or premise-necessity claim.'});print(json.dumps({'status':'PASS','records':reports}),flush=True)
if __name__=='__main__':main()
