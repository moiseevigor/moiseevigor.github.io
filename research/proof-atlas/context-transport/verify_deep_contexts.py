"""Native tail records under deep contexts; the 64-introduction cap is unchanged."""
from pathlib import Path
import hashlib, json, os, sys, tempfile

BASE = Path(__file__).resolve().parent
RESEARCH = BASE.parent
sys.path.insert(0, str(RESEARCH))
from build_recursion_examples import run_checked

LEAN = os.environ.get('ATLAS_LEAN', 'lean')
folder = Path(tempfile.mkdtemp(prefix='atlas-deep-contexts-'))
env = dict(os.environ, LEAN_PATH=str(folder))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
source = '''import Lean
open Lean Elab Command Meta
namespace AtlasDeepContexts
structure Param (n : Nat) where
 proof : n = n
run_cmd liftTermElabM do
 for count in [129,193] do
  let mut value := Expr.proj ``Param 0 (.bvar 0)
  for j in [:count-1] do
   value := mkLambda (Name.str .anonymous s!"same{j}") .default
    (mkApp (mkConst ``Param) (.bvar (count-2-j))) value
  value := mkLambda `n .default (mkConst ``Nat) value
  let type ← match Kernel.check (← getEnv) {} value with
   | .ok t => pure t | .error _ => throwError "Deep control rejected"
  addDecl (.defnDecl {name:=Name.str `AtlasDeepContexts s!"deep{count}",levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
end AtlasDeepContexts
'''
fixture = folder/'DeepContexts.lean'
fixture.write_text(source)
compiled = run_checked([LEAN,'-o',str(fixture.with_suffix('.olean')),str(fixture)],folder,'compile',env,30)
# Check written declaration types independently of selected occurrence queries.
prepare = '''
run_cmd do
 for name in [``AtlasDeepContexts.deep129, ``AtlasDeepContexts.deep193] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "No body"
  for e in [info.type,value,mkApp (mkLambda `declared .default info.type (.bvar 0)) value] do
   match Kernel.check (← getEnv) {} e with | .ok _ => pure () | .error _ => throwError "Declaration rejected"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  liftIO <| IO.FS.writeFile ("FOLDER/"++name.toString++".json") packet.compress
'''.replace('FOLDER',str(folder))
core = (RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import DeepContexts')+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'
entry = folder/'Prepare.lean'
entry.write_text(core+prepare)
prepared = run_checked([LEAN,str(entry)],folder,'prepare',env,30)
queries=[]
for count in [129,193]:
    packet=folder/f'AtlasDeepContexts.deep{count}.json'
    queries.append(dict(packetFile=str(packet),source=dict(name=f'AtlasDeepContexts.deep{count}',indexSha256=sha(packet),sourceSha256=sha(fixture)),routes=[dict(root=1,slots=[1]*n) for n in [count-1,count]]))
request=folder/'requests.json'
request.write_text(json.dumps(queries,separators=(',',':')))
body=core
for filename,import_line in [('ExportOccurrenceTypes.lean','import ExportLibrary'),('ExportSourceReferences.lean','import ExportOccurrenceTypes'),('context-transport/ExportContextTransport.lean','import ExportSourceReferences'),('context-transport/ExportIntroductionTransport.lean','import ExportContextTransport')]:
    body+=(RESEARCH/filename).read_text().replace(import_line,'')
entry=folder/'Extract.lean'
entry.write_text(body+'\n#atlas_introduction_transport '+json.dumps(str(request))+' => '+json.dumps(str(folder/'introductions.json'))+'\n#atlas_occurrence_types '+json.dumps(str(request))+' => '+json.dumps(str(folder/'ordinary.json'))+'\n')
extracted=run_checked([LEAN,str(entry)],folder,'extract',env,30)
result=dict(status='EXTRACTED',folder=str(folder),sourceSha256=sha(fixture),compiledModuleSha256=sha(fixture.with_suffix('.olean')),producerSha256=sha(entry),requestSha256=sha(request),outputSha256=sha(folder/'introductions.json'),compile=compiled,prepare=prepared,extract=extracted)
(folder/'native-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
