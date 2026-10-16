"""Own native controls for contextual source transport; original projects unused."""
from pathlib import Path
import os,sys,json,hashlib,tempfile,subprocess
BASE=Path(__file__).resolve().parent;REPO=Path(__file__).resolve().parents[3];sys.path.insert(0,str(REPO/'research/proof-atlas'))
from build_recursion_examples import run_checked
LEAN=os.environ.get('ATLAS_LEAN','lean');folder=Path(tempfile.mkdtemp(prefix='atlas-context-controls-'));env=dict(os.environ,LEAN_PATH=str(folder));sha=lambda b:hashlib.sha256(b).hexdigest()
SOURCE='''import Lean
open Lean Elab Command Meta
set_option maxHeartbeats 10000000
namespace AtlasContextControls
structure Param (n : Nat) where
 proof : n = n
structure FunParam (f : Nat → Nat) where
 proof : ∀ x, f x = f x
run_cmd liftTermElabM do
 let nat := mkConst ``Nat
 let param (x : Expr) := mkApp (mkConst ``Param) x
 let project (x : Expr) := Expr.proj ``Param 0 x
 let capture := mkLambda `n .default nat (mkLambda `x .default (param (.bvar 0)) (project (.bvar 0)))
 let closed := mkLambda `x .default (param (mkNatLit 5)) (project (.bvar 0))
 let shadow := mkLambda `n .default nat (mkLambda `x .default (param (.bvar 0)) (mkLambda `n .default nat (project (.bvar 1))))
 let reflexive (x : Expr) := mkApp3 (mkConst ``Eq [Level.succ Level.zero]) nat x x
 let funType := Expr.forallE `y nat (reflexive (.bvar 0)) .default
 let apply := mkLambda `n .default nat (mkLambda `h .default funType (mkApp (.bvar 0) (.bvar 1)))
 let value := mkLambda `n .default nat (.bvar 0)
 let localValue := mkApp2 (mkConst ``Nat.add) (.bvar 0) (mkNatLit 3)
 let localTerm := mkLambda `n .default nat (.letE `alias nat localValue (mkLambda `x .default (param (.bvar 0)) (project (.bvar 0))) false)
 let parameterFunction := mkLambda `k .default nat (.bvar 1)
 let funParam := mkApp (mkConst ``FunParam) parameterFunction
 let functionHeader := mkLambda `n .default nat (mkLambda `s .default funParam (.proj ``FunParam 0 (.bvar 0)))
 let mut layer := (Array.range 32768).map mkNatLit
 while layer.size > 1 do
  let mut next := #[]
  for j in [:layer.size / 2] do
   next := next.push (mkApp2 (mkConst ``Nat.add) layer[j*2]! layer[j*2+1]!)
  layer := next
 let large := mkApp2 (mkConst ``Nat.add) (.bvar 0) layer[0]!
 let largeContext := mkLambda `n .default nat (mkLambda `x .default (param large) (project (.bvar 0)))
 let largeFunction := mkLambda `n .default nat (mkLambda `x .default (param large) (mkLambda `k .default nat (project (.bvar 1))))
 for (name,value) in [(`AtlasContextControls.closed,closed),(`AtlasContextControls.capture,capture),(`AtlasContextControls.shadow,shadow),(`AtlasContextControls.apply,apply),(`AtlasContextControls.value,value),(`AtlasContextControls.localDefinition,localTerm),(`AtlasContextControls.functionHeader,functionHeader),(`AtlasContextControls.largeContext,largeContext),(`AtlasContextControls.largeFunction,largeFunction)] do
  let type ← match Kernel.check (← getEnv) {} value with | .ok t => pure t | .error _ => throwError "Control rejected"
  addDecl (.defnDecl {name,levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
end AtlasContextControls
'''
fixture=folder/'ContextControls.lean';fixture.write_text(SOURCE);compileResult=run_checked([LEAN,'-o',str(fixture.with_suffix('.olean')),str(fixture)],folder,'compile',env,30)
b=REPO/'research/proof-atlas';core=(b/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ContextControls')+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n';types=(b/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','');refs=(b/'ExportSourceReferences.lean').read_text().replace('import ExportOccurrenceTypes','');transport=(BASE/'ExportContextTransport.lean').read_text().replace('import ExportSourceReferences','')
CASES={'closed':[[1]],'capture':[[1,1]],'shadow':[[1,1,1]],'apply':[[1,1]],'value':[[1]],'localDefinition':[[1],[1,2,1]],'functionHeader':[[1,1]],'largeContext':[[1],[1,1]],'largeFunction':[[1],[1,1],[1,1,1]]}
prepare='''
run_cmd do
 for name in [NAMES] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "No body"
  for e in [info.type,value,mkApp (mkLambda `declared .default info.type (.bvar 0)) value] do
   match Kernel.check (← getEnv) {} e with | .ok _ => pure () | .error _ => throwError "Declaration rejected"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  liftIO <| IO.FS.writeFile ("FOLDER/"++name.toString++".json") packet.compress
'''.replace('NAMES',','.join('``AtlasContextControls.'+n for n in CASES)).replace('FOLDER',str(folder))
entry=folder/'Prepare.lean';entry.write_text(core+prepare);prepareResult=run_checked([LEAN,str(entry)],folder,'prepare',env,30)
queries=[]
for n,slots in CASES.items():
 p=folder/('AtlasContextControls.'+n+'.json');queries.append(dict(packetFile=str(p),source=dict(name='AtlasContextControls.'+n,indexSha256=sha(p.read_bytes()),sourceSha256=sha(fixture.read_bytes())),routes=[dict(root=1,slots=s)for s in slots]))
request=folder/'requests.json';request.write_text(json.dumps(queries,separators=(',',':')));output=folder/'transport.json';ordinary=folder/'ordinary.json';entry=folder/'Export.lean';entry.write_text(core+types+refs+transport+'\n#atlas_context_transport '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n#atlas_occurrence_types '+json.dumps(str(request))+' => '+json.dumps(str(ordinary))+'\n')
extractResult=run_checked([LEAN,str(entry)],folder,'extract',env,30)
result=dict(status='EXTRACTED',folder=str(folder),sourceSha256=sha(fixture.read_bytes()),compiledModuleSha256=sha(fixture.with_suffix('.olean').read_bytes()),producerSha256=sha((core+types+refs+transport).encode()),requestSha256=sha(request.read_bytes()),compile=compileResult,prepare=prepareResult,extract=extractResult)
(folder/'native-result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
