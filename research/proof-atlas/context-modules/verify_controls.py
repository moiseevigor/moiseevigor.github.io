"""Fresh native replay of the finite own compiled-module controls only."""
from pathlib import Path
import argparse,gzip,json,os,subprocess,sys,tempfile
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parent.parent;sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
parser=argparse.ArgumentParser();parser.add_argument('--lean',default='lean');args=parser.parse_args();compiler=subprocess.check_output([args.lean,'--version'],text=True).strip();assert 'version 4.33.1,'in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-native-context-modules-')).resolve();env=dict(os.environ,LEAN_PATH=str(folder));own=(RESEARCH/'context-types/Controls.lean').read_text()
extra='''import Lean
namespace AtlasClosureExtra
universe u
def proofReflContexts (α : Sort u) (x : α) : (x = x) ∧ (x = x) :=
  And.intro (Eq.refl x) ((fun unused : Nat => Eq.refl x) 7)
def proofHypothesisContexts (p : Prop) (h : p) : p ∧ p :=
  And.intro h ((fun unused : Nat => h) 7)
def proofBoundary (p : Prop) : p → p := fun h => h
end AtlasClosureExtra
'''
inventory=json.loads((ROOT/'public/data/proof-atlas/context-modules-manifest.js').read_text().split('=',1)[1].rstrip(';\n'));old=json.loads((ROOT/'public/data/proof-atlas/context-types-manifest.js').read_text().split('=',1)[1].rstrip(';\n'));records={r['name']:r for r in inventory['edition']['declarations']+old['edition']['declarations']};outputs=[];selected=0;negative=0
for module,source_text in [('AtlasClosure.Controls',own),('AtlasClosureExtra.Controls',extra)]:
 source=folder/(module.replace('.','/')+'.lean');source.parent.mkdir();source.write_text(source_text);run_checked([args.lean,'-o',str(source.with_suffix('.olean')),str(source)],folder,module+'-compile',env)
 queries=[]
 for descriptor in inventory['records']:
  record=records[descriptor['name']]
  if record['module']!=module:continue
  data=json.loads(gzip.decompress((ROOT/record['file'].lstrip('/')).read_bytes()));pkg=json.loads(gzip.decompress((ROOT/descriptor['file'].lstrip('/')).read_bytes()));packet=folder/(record['name']+'.json');packet.write_text(json.dumps(data));states=[];support=[]
  for node,kind in enumerate(data['kind']):
   free={data['payloads'][node]['index']}if kind==0 else set()
   for j,child in enumerate(data['children'][node]):
    shift=int(kind in [6,7]and j==1 or kind==8 and j==2);free.update(i-shift for i in support[child]if i>=shift)
   support.append(free)
  for entry in pkg['entries']:
   slots=entry['reducedContext']['slots'];state=dict(entry['state'],requiredSlots=slots,expectReducedFailure=False);states.append(state);selected+=1;depth=len(entry['recipe']);term={depth-1-i for i in support[entry['node']]};missing=[s for s in slots if s not in term]
   if missing:states.append(dict(state,requiredSlots=[s for s in slots if s!=missing[0]],expectReducedFailure=True));negative+=1
  queries.append({'packetFile':str(packet),'source':pkg['source'],'states':states})
 request=folder/(module+'-request.json');request.write_text(json.dumps(queries));output=folder/(module+'-observations.ndjson')
 body=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import '+module)+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'+(RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')+'\n'+(BASE/'ExportContextModules.lean').read_text().replace('import ExportOccurrenceTypes','')+'\n#atlas_closed_context '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n';entry=folder/(module+'-replay.lean');entry.write_text(body);run_checked([args.lean,str(entry)],folder,module+'-queries',env);outputs.append(output)
assert selected==594 and negative>=16
combined=folder/'observations.ndjson';combined.write_bytes(b''.join(p.read_bytes()for p in outputs));subprocess.run(['node','scripts/check-proof-atlas-native-context-modules.cjs',str(combined),'--negative',str(negative)],cwd=ROOT,check=True)
print(json.dumps({'status':'PASS','nativeOwnRoutes':selected,'missingContextEntryRejections':negative,'privateResearchOrMathlibBuilt':False,'scope':'Fresh own synthetic controls only. Original research sources and raw logs are not published.','folder':str(folder)}))
