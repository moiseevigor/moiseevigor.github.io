"""Independent small scope/universe controls; no original projects or Mathlib."""
from pathlib import Path
import json, sys, os, hashlib, tempfile

BASE = Path(__file__).resolve().parent
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'research/proof-atlas'))
from build_recursion_examples import run_checked

LEAN = os.environ.get('ATLAS_LEAN','lean')
folder = Path(tempfile.mkdtemp(prefix='atlas-introduction-scopes-'))
env = dict(os.environ, LEAN_PATH=str(folder))
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
source = '''import Lean
open Lean Elab Command Meta
universe u v
namespace AtlasIntroductionScopes
structure Param (n : Nat) where
 proof : n = n
structure FunParam (f : Nat → Nat) where
 proof : ∀ k, f k = f k
def polyIdentity {α : Sort u} (x : α) : α := x
def strictIdentity ⦃α : Sort u⦄ (x : α) : α := x
def dependent {α : Sort u} (β : α → Sort v) (f : (a : α) → β a) (a : α) : β a := f a
def instanceValue {α : Type u} [inst : Inhabited α] : α := inst.default
def forallIdentity (P : Nat → Prop) (h : ∀ n, P n) : ∀ n, P n := fun n => h n
def betaHeader {α : Sort u} (x : α) : α := (fun y : α => y) x
def letFunction (n : Nat) : Nat → Nat := let alias := n + 1; fun a => alias + a
def letDependent (n : Nat) := let alias := n; fun x : Param alias => x.proof
def functionHeader (n : Nat) (s : FunParam (fun _ => n)) := s.proof
def shadow (n : Nat) (s : Param n) : Nat → n = n := fun n => s.proof
run_cmd liftTermElabM do
 for count in [64,65] do
  let mut value := Expr.proj ``Param 0 (.bvar 0)
  for j in [:count-1] do
   value := mkLambda (Name.str .anonymous s!"same{j}") .default
    (mkApp (mkConst ``Param) (.bvar (count-2-j))) value
  value := mkLambda `n .default (mkConst ``Nat) value
  let type ← match Kernel.check (← getEnv) {} value with
   | .ok t => pure t | .error _ => throwError "Deep control rejected"
  addDecl (.defnDecl {name:=Name.str `AtlasIntroductionScopes s!"deep{count}",levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
end AtlasIntroductionScopes
'''
fixture = folder / 'ScopeControls.lean'
fixture.write_text(source)
compiled = run_checked([LEAN, '-o', str(fixture.with_suffix('.olean')), str(fixture)], folder, 'compile', env, 30)
names = ['polyIdentity','strictIdentity','dependent','instanceValue','forallIdentity','betaHeader',
         'letFunction','letDependent','functionHeader','shadow','deep64','deep65']
research = REPO / 'research/proof-atlas'
core = (research / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ScopeControls') + '\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'
prepare = '''
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
'''.replace('NAMES',','.join('``AtlasIntroductionScopes.'+n for n in names)).replace('FOLDER',str(folder))
entry = folder / 'Prepare.lean'
entry.write_text(core + prepare)
prepared = run_checked([LEAN, str(entry)], folder, 'prepare', env, 30)
queries = []
for name in names:
    file = folder / ('AtlasIntroductionScopes.'+name+'.json')
    data = json.loads(file.read_text())
    routes, pending = [], [(data['roots'][1],[])]
    while pending:
        node, slots = pending.pop()
        if not slots or data['kind'][node] == 6:
            routes.append(dict(root=1, slots=slots))
        pending.extend((child,slots+[j]) for j,child in enumerate(data['children'][node]))
    assert len(routes) <= 512
    queries.append(dict(packetFile=str(file),source=dict(name=data['declaration']['name'],
        indexSha256=sha(file),sourceSha256=sha(fixture)),routes=routes))
request = folder / 'requests.json'
request.write_text(json.dumps(queries[:-1],separators=(',',':')))
types = (research / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
refs = (research / 'ExportSourceReferences.lean').read_text().replace('import ExportOccurrenceTypes','')
ctx = (BASE / 'ExportContextTransport.lean').read_text().replace('import ExportSourceReferences','')
intro = (BASE / 'ExportIntroductionTransport.lean').read_text().replace('import ExportContextTransport','')
body = core + types + refs + ctx + intro
entry = folder / 'Extract.lean'
entry.write_text(body + '\n#atlas_introduction_transport '+json.dumps(str(request))+' => '+json.dumps(str(folder/'introductions.json'))
    + '\n#atlas_occurrence_types '+json.dumps(str(request))+' => '+json.dumps(str(folder/'ordinary.json'))+'\n')
extracted = run_checked([LEAN,str(entry)],folder,'extract',env,30)
request65 = folder / 'bound-request.json'
request65.write_text(json.dumps([{**queries[-1],'routes':[dict(root=1,slots=[])]}],separators=(',',':')))
entry = folder / 'Bound.lean'
entry.write_text(body + '\n#atlas_introduction_transport '+json.dumps(str(request65))+' => '+json.dumps(str(folder/'bound.json'))+'\n')
try:
    run_checked([LEAN,str(entry)],folder,'bound',env,30)
    raise AssertionError('65-entry prefix accepted past the declared cap')
except RuntimeError:
    bound = json.loads((folder/'bound.resources.json').read_text())
    assert bound['exitCode']==1 and bound['stopReason'] is None
    assert 'error: Introduction prefix bound' in (folder/'bound.log').read_text()
# Nat is a kernel inductive declaration with a type and no value body. A
# complete valid type packet must not acquire a declaration-body attestation.
no_body_packet = folder / 'no-body-packet.json'
no_body_packet.write_text(json.dumps(dict(declaration=dict(name='Nat',rootPaths=['root.type']),
    roots=[0],kind=[3],children=[[]],payloads=[dict(level=dict(kind='succ',of=dict(kind='zero')))],
    expanded=['1'],neededScope=[0]),separators=(',',':')))
no_body_request = folder / 'no-body-request.json'
no_body_request.write_text(json.dumps([dict(packetFile=str(no_body_packet),
    source=dict(name='Nat',indexSha256=sha(no_body_packet),sourceSha256=sha(fixture)),
    routes=[dict(root=0,slots=[])])],separators=(',',':')))
entry = folder / 'NoBody.lean'
entry.write_text(body + '\n#atlas_introduction_transport '+json.dumps(str(no_body_request))
    +' => '+json.dumps(str(folder/'no-body-output.json'))+'\n')
try:
    run_checked([LEAN,str(entry)],folder,'no-body',env,30)
    raise AssertionError('A declaration without a body acquired body-typing evidence')
except RuntimeError:
    no_body = json.loads((folder/'no-body.resources.json').read_text())
    assert no_body['exitCode']==1 and no_body['stopReason'] is None
    assert 'error: Introduction source declaration has no body' in (folder/'no-body.log').read_text()
result=dict(status='EXTRACTED_WITH_EXPECTED_PREFIX_BOUND',folder=str(folder),sourceSha256=sha(fixture),
    compiledModuleSha256=sha(fixture.with_suffix('.olean')),producerSha256=hashlib.sha256(body.encode()).hexdigest(),
    requestSha256=sha(request),compile=compiled,prepare=prepared,extract=extracted,
    prefix65=dict(status='EXPECTED_BOUND',resources=bound,requestSha256=sha(request65)),
    declarationWithoutBody=dict(status='EXPECTED_REJECTION',resources=no_body,requestSha256=sha(no_body_request)))
(folder/'native-result.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
