"""Kernel-check source-use composition; original private source files stay unread."""
import argparse,hashlib,importlib.util,json,os,subprocess,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def write(p,v):p.write_text(json.dumps(v,separators=(',',':'))+'\n')
def module(name,file):
 s=importlib.util.spec_from_file_location(name,file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--riccati-build',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
 paths,recovery=module('composition_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve());runtime=module('composition_runtime',RESEARCH/'packet-typing/verify.py').runtime()+'\n'+(RESEARCH/'equality-transport/EqualityTransport.lean').read_text()+'\n'+(BASE/'Ports.lean').read_text()
 files=[BASE/'verify.py',BASE/'Ports.lean',BASE/'Controls.lean',BASE/'prepare.cjs',RESEARCH/'use-sites/verify.py',RESEARCH/'packet-typing/verify.py',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'equality-transport/EqualityTransport.lean'];hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 def run(target,code,phase,private=False):
  entry=target/'Runtime.lean';body=runtime.replace('import Mathlib\nimport Aesop','import SE2Conjugate.Riccati') if private else runtime;entry.write_text(body+'\n'+code);imports=([a.riccati_build.resolve()]+paths) if private else paths;env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,imports)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,imports),str(lean),str(entry)],target,phase,env,timeout=480);return sha(entry.read_bytes())
 controls=folder/'controls';controls.mkdir();names=['inlineCalls','aliases','weakening','parallel','shared','crossContext','samePorts','nondepValue'];export='''
run_cmd do
 for (name,file) in #[ITEMS] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Fixture body"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("serialization",toJson "ExprDAG/1"),("roots",toJson #[t,v]),("declaration",Json.mkObj [("name",toJson name.toString),("kind",toJson "definition"),("kernelCheck",toJson "PASS"),("module",toJson "Runtime"),("rootPaths",toJson #["root.type","root.value"])])]
  liftIO <| IO.FS.writeFile file (packet.mergeObj (AtlasOccurrenceTypes.graphJson s)).compress
'''.replace('ITEMS',','.join('(``AtlasComposeControls.'+n+','+json.dumps(str(controls/(n+'.json')))+')' for n in names))
 run(controls,(BASE/'Controls.lean').read_text()+'\n'+export,'fixtures')
 descriptors=[];requests=[]
 for name in names:
  file=controls/(name+'.json');raw=file.read_bytes();data=json.loads(raw);record={'name':data['declaration']['name'],'module':'Runtime','kind':'definition','sourceSha256':sha((BASE/'Controls.lean').read_bytes()),'indexSha256':sha(raw),'uniqueNodes':len(data['kind']),'occurrences':str(sum(int(data['expanded'][r]) for r in data['roots']))};routes=[]
  def walk(n,ss):
   if data['kind'][n]==5:
    x=n;count=0
    while data['kind'][x]==5:count+=1;x=data['children'][x][0]
    if data['payloads'][x].get('name') in ['Eq.mp','Eq.mpr'] and count==4 or data['payloads'][x].get('name')=='Eq.rec' and count==6:routes.append({'root':1,'slots':ss})
   for slot,c in enumerate(data['children'][n]):walk(c,ss+[slot])
  walk(data['roots'][1],[]);assert 0<len(routes)<=16
  source={'edition':'construction-composition-controls',**{k:record[k] for k in ['name','indexSha256','sourceSha256']}};descriptors.append({'record':record,'source':source,'routes':routes,'packetFile':str(file)})
  requests.append({'packetFile':str(file),'source':source,'routes':routes})
 write(controls/'requests.json',requests);run(controls,'#atlas_equality_replay '+json.dumps(str(controls/'requests.json'))+' => '+json.dumps(str(controls/'native.json')),'replay');native=json.loads((controls/'native.json').read_bytes());assert len(native)==8
 for d,row in zip(descriptors,native):
  assert len(row['entries'])==len(d['routes']),row['outcomes'];write(controls/(d['record']['name'].split('.')[-1]+'-native.json'),row)
 write(controls/'descriptors.json',descriptors)
 # Build both old and new source-use candidates without rewriting old owners.
 prepare='''const fs=require('fs'),p=require('./research/proof-atlas/construction-composition/prepare.cjs'),crypto=require('crypto'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),folder=process.argv[1],rows=JSON.parse(fs.readFileSync(folder+'/controls/descriptors.json')),extra=[];for(const d of rows){const raw=fs.readFileSync(folder+'/controls/'+d.record.name.split('.').pop()+'-native.json'),r=JSON.parse(raw),data=JSON.parse(fs.readFileSync(d.packetFile));extra.push(p.plan({original:{source:d.source,record:d.record,sha256:sha(raw),file:null,queries:r.entries.map(q=>({route:q.selected.route,core:q.core.route,node:q.selected.node,equalityWitness:q.equalityWitness})),kind:'authored-composition'}},r,data));}const old=p.prepare(folder);fs.writeFileSync(folder+'/plan.json',JSON.stringify({format:'ProofAtlasCompositionPlan/1',rows:old.concat(extra)}));'''
 subprocess.check_call(['node','-e',prepare,str(folder)],cwd=ROOT);plan=json.loads((folder/'plan.json').read_bytes());private=a.riccati_build.resolve();manifest=json.loads((private/'riccati-verification.json').read_text());compiled={}
 for name,row in manifest['sourceModules'].items():
  f=private/Path(*name.split('.')).with_suffix('.olean');assert sha(f.read_bytes())==row['compiledModuleSha256'];compiled[name]=row['compiledModuleSha256']
 reports=[]
 for mode in ['compiled','replay']:
  selected=[x for x in plan['rows'] if (x['source']['edition']=='published-15')==(mode=='compiled')];target=folder/mode;target.mkdir();queries=[]
  for x in selected:
   file=folder/x['record']['name']/'packet.json'
   if x['source']['edition']=='construction-composition-controls':file=controls/(x['record']['name'].split('.')[-1]+'.json')
   assert sha(file.read_bytes())==x['record']['indexSha256'];queries.append({'packetFile':str(file),'source':x['source'],'mode':mode,'inputs':x['inputs']})
  # Wrong alternatives are checked for type/term conversion, but never accepted as source witnesses.
  for request,x in zip(queries,selected):
   tail=x['record']['name'].split('.')[-1]
   if tail in ['parallel','shared']:
    candidate=x['cores'][0]['core'];consumer=next(c for c in x['cores'] if c['core']!=candidate and any(i['knownProducer'] is not None and i['core']==x['cores'].index(c) for i in x['inputs']))
    wrong=next(i for i in request['inputs'] if i['core']==x['cores'].index(consumer) and i['role']=='value');wrong['alternative']=candidate
   elif tail=='crossContext':
    wrong=next(i for i in request['inputs'] if i['core']==1 and i['role']=='value');wrong['alternative']=x['inputs'][0]['producer']
  write(target/'requests.json',queries);runtime_hash=run(target,'#atlas_composition '+json.dumps(str(target/'requests.json'))+' => '+json.dumps(str(target/'native.json')),mode,mode=='compiled');out=json.loads((target/'native.json').read_bytes());assert len(out)==len(queries)
  for x,row in zip(selected,out):
   assert row['source']==x['source'];assert len(row['entries'])==len(x['inputs']),row['refusals'];assert not row['refusals'];assert row['originalDeclarationPresent']==(mode=='compiled');assert row['originalModulePresent']==(mode=='compiled');assert row['privateRiccatiModulesPresent']==(mode=='compiled')
   expected={i['id']:i for i in x['inputs']}
   for entry in row['entries']:
    q=expected[entry['id']];j=entry['junction'];assert j['producer']['anchor']==q['producer'] and j['producer']['context']==q['producerContext'] and j['definitionHops']==q['definitionHops'];assert j['consumer']['input']==q['input'] and j['consumer']['slot']==q['slot'];assert j['externalBinder']==q['externalBinder'] and j['definitionBoundary']==q['definitionBoundary']
   print(json.dumps({'name':x['record']['name'],'inputs':len(row['entries'])}),flush=True)
  reports.append({'mode':mode,'runtimeSha256':runtime_hash,'nativeOutputSha256':sha((target/'native.json').read_bytes()),'profiles':len(selected),'junctions':sum(len(r['entries']) for r in out)})
 assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in files}
 write(folder/'verification.json',{'format':'ProofAtlasConstructionCompositionNative/1','status':'PASS','compiler':compiler,'dependencyRecovery':recovery,'compiledModules':compiled,'producerFiles':hashes,'planSha256':sha((folder/'plan.json').read_bytes()),'controlNativeSha256':sha((controls/'native.json').read_bytes()),'records':reports,'originalPrivateSourcesRead':False,'scope':'Typed application input ports with exact source-use/definition witnesses. Compiled Riccati comparison and packet-only replay have separate environments; no semantic proof compression or comprehension claim.'});print(json.dumps({'status':'PASS','records':reports}),flush=True)
if __name__=='__main__':main()
