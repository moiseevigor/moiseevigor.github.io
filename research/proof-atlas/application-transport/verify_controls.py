"""Own native application controls. No project or Mathlib compilation."""
from pathlib import Path
import hashlib, json, os, sys, tempfile, shutil, subprocess
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
LEAN=os.environ.get('ATLAS_LEAN') or shutil.which('lean')
assert LEAN, 'Lean 4.33.1 is required'
compiler=subprocess.check_output([LEAN,'--version'],text=True).strip()
assert 'version 4.33.1,' in compiler
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
reuse=Path(sys.argv[1]) if len(sys.argv)>1 else None
folder=reuse or Path(tempfile.mkdtemp(prefix='atlas-application-transport-'))
env=dict(os.environ,LEAN_PATH=str(folder))
source='''import Lean
open Lean Elab Command Meta
universe u
namespace AtlasApplicationControls
def dependent (n : Nat) (f : (a : Nat) → Fin (a+n+1)) (a : Nat) := f a
def implicitId {α : Sort u} (x : α) : α := @id α x
def pair (n : Nat) (h : n=n) : Subtype (fun k : Nat => k=n) := ⟨n,h⟩
def letScope (n : Nat) : Nat := let alias := n+1; (fun a : Nat => alias+a) 2
def ignoreProof (P : Prop) (h : P) : P := (fun (_ : P) => h) h
def functionValue (p : Nat) (f : Nat → Nat) : Nat → Nat := (fun g : Nat → Nat => fun y => g y+p) f
run_cmd liftTermElabM do
 let nat := mkConst ``Nat
 let mut layer := (Array.range 32768).map mkNatLit
 while layer.size > 1 do
  let mut next := #[]
  for j in [:layer.size/2] do
   next := next.push (mkApp2 (mkConst ``Nat.add) layer[j*2]! layer[j*2+1]!)
  layer := next
 let value := mkApp2 (mkConst ``Nat.add) (.bvar 0) layer[0]!
 let proof := mkApp2 (mkConst ``Eq.refl [.succ .zero]) nat value
 let value := mkLambda `n .default nat proof
 let type ← match Kernel.check (← getEnv) {} value with
  | .ok t => pure t | .error _ => throwError "Large application control rejected"
 addDecl (.defnDecl {name:=`AtlasApplicationControls.largeEq,levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
end AtlasApplicationControls
'''
fixture=folder/'ApplicationControls.lean'
if reuse:assert fixture.read_text()==source
else:fixture.write_text(source)
compiled=json.loads((folder/'compile.resources.json').read_text()) if reuse else run_checked([LEAN,'-o',str(fixture.with_suffix('.olean')),str(fixture)],folder,'compile',env,30)
assert compiled['exitCode']==0 and compiled['stopReason']is None
module_hash=sha(fixture.with_suffix('.olean'))
core=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ApplicationControls')+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'
types=(RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
names=['dependent','implicitId','pair','letScope','ignoreProof','functionValue','largeEq']
prepare='''
run_cmd do
 for name in [NAMES] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Body unavailable"
  liftTermElabM fun _ => AtlasOccurrenceTypes.kernelAs value info.type
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  liftIO <| IO.FS.writeFile ("FOLDER/"++name.toString++".json") packet.compress
'''.replace('NAMES',','.join('``AtlasApplicationControls.'+n for n in names)).replace('FOLDER',str(folder))
entry=folder/'Prepare.lean'
if reuse:assert entry.read_text()==core+types+prepare
else:entry.write_text(core+types+prepare)
prepared=json.loads((folder/'prepare.resources.json').read_text()) if reuse else run_checked([LEAN,str(entry)],folder,'prepare',env,30)
assert prepared['exitCode']==0 and prepared['stopReason']is None
queries=[]
for name in names:
    packet=folder/('AtlasApplicationControls.'+name+'.json');data=json.loads(packet.read_text());node=data['roots'][1];slots=[]
    while data['kind'][node]in [6,8]:
        j=1 if data['kind'][node]==6 else 2;node=data['children'][node][j];slots.append(j)
    assert data['kind'][node]==5,(name,data['kind'][node])
    queries.append(dict(packetFile=str(packet),source=dict(name=data['declaration']['name'],indexSha256=sha(packet),sourceSha256=sha(fixture)),routes=[dict(root=1,slots=slots)]))
request=folder/'requests.json';request.write_text(json.dumps(queries,separators=(',',':')))
references=(RESEARCH/'ExportSourceReferences.lean').read_text().replace('import ExportOccurrenceTypes','')
context=(RESEARCH/'context-transport/ExportContextTransport.lean').read_text().replace('import ExportSourceReferences','')
application=(BASE/'ExportApplicationTransport.lean').read_text().replace('import ExportContextTransport','')
body=core+types+references+context+application
def run_or_reuse(filename,program,label,output):
    entry=folder/filename;resource=folder/(label+'.resources.json')
    if reuse and entry.exists() and entry.read_text()==program and (folder/output).exists() and resource.exists():
        prior=json.loads(resource.read_text())
        if prior['exitCode']==0 and prior['stopReason']is None:return prior
    entry.write_text(program)
    return run_checked([LEAN,str(entry)],folder,label,env,30)
extracted=run_or_reuse('ExtractFixed.lean',body+'\n#atlas_application_transport '+json.dumps(str(request))+' => '+json.dumps(str(folder/'applications.json'))+'\n','extract-fixed','applications.json')
small=folder/'small-requests.json';small.write_text(json.dumps(queries[:-1],separators=(',',':')))
independent=run_or_reuse('Independent.lean',core+types+'\n#atlas_occurrence_types '+json.dumps(str(small))+' => '+json.dumps(str(folder/'ordinary.json'))+'\n','independent','ordinary.json')
large=folder/'large-request.json';large.write_text(json.dumps([queries[-1]],separators=(',',':')))
ordinary_large=run_or_reuse('MaterializedBound.lean',core+types+'\n#atlas_occurrence_types '+json.dumps(str(large))+' => '+json.dumps(str(folder/'large-ordinary.json'))+'\n','materialized-bound','large-ordinary.json')
assert json.loads((folder/'large-ordinary.json').read_text())[0]['entries'][0]['status']=='unavailable'
# The ordinary command reports failed queries as unavailable. Invoke the old
# table builder directly to identify the cause without that outer catch.
entry=folder/'MaterializedInternBound.lean'
entry.write_text(core+types+"""
run_cmd liftTermElabM do
 let info ← getConstInfo ``AtlasApplicationControls.largeEq
 let some value := info.value? true | throwError \"Body unavailable\"
 let .lam n t body bi := value | throwError \"Lambda required\"
 withLocalDecl n bi t fun x => do
  let type ← AtlasOccurrenceTypes.kernelType (body.instantiate1 x)
  let _ ← AtlasOccurrenceTypes.internScoped type #[x] {} 8192
  pure ()
""")
try:
    run_checked([LEAN,str(entry)],folder,'materialized-intern-bound',env,30)
    raise AssertionError('Large materialized type unexpectedly fits; recheck control')
except RuntimeError:
    bound=json.loads((folder/'materialized-intern-bound.resources.json').read_text());assert bound['exitCode']==1 and bound['stopReason']is None
    assert 'Type DAG exceeds 8192'in (folder/'materialized-intern-bound.log').read_text()
assert sha(fixture)==hashlib.sha256(source.encode()).hexdigest() and sha(fixture.with_suffix('.olean'))==module_hash
result=dict(status='EXTRACTED_WITH_EXPECTED_MATERIALIZED_BOUND',folder=str(folder),sourceSha256=sha(fixture),compiledModuleSha256=sha(fixture.with_suffix('.olean')),producerSha256=sha(folder/'ExtractFixed.lean'),requestSha256=sha(request),outputSha256=sha(folder/'applications.json'),compile=compiled,prepare=prepared,extract=extracted,independent=independent,materializedEntryStatus='unavailable',materializedBound=bound)
(folder/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

subprocess.run(['node',str(RESEARCH.parent.parent/'scripts/check-proof-atlas-native-application-transport.cjs'),str(folder)],check=True)
