"""Fresh core-only compositions; query each small source occurrence, not private proofs."""
import argparse, json, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked

BASE = Path(__file__).parent
parser = argparse.ArgumentParser()
parser.add_argument('lean', nargs='?', default='lean')
parser.add_argument('--reserve-gib', type=int, default=30)
args = parser.parse_args()
assert args.reserve_gib >= 1
assert 'version 4.33.1,' in subprocess.check_output([args.lean, '--version'], text=True)
folder = Path(tempfile.mkdtemp(prefix='atlas-judgment-controls-'))
request, lets, output, let_output = [folder / n for n in ['requests.json', 'lets.json', 'types.json', 'let-types.json']]
core = (BASE / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', '')
core += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
core += (BASE / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
core += '\n' + (BASE / 'ExportLetReduction.lean').read_text().replace('import ExportOccurrenceTypes', '')
fixture = '''
class AtlasCompose.ValueBox where
 value : Nat
 property : True
class AtlasCompose.ProofBox : Prop where
 property : True
def AtlasCompose.takeInputs (α : Type) [AtlasCompose.ValueBox] [AtlasCompose.ProofBox] (x : α) (h : True) : True := h
def AtlasCompose.mixed (α : Type) [v : AtlasCompose.ValueBox] [p : AtlasCompose.ProofBox] (x : α) (h : True) : True := @AtlasCompose.takeInputs α v p x h
def AtlasCompose.nestedProof (h : True) : True := @AtlasCompose.takeInputs ((fun (_ : True) => Nat) h) ⟨0, True.intro⟩ ⟨True.intro⟩ 0 h

def AtlasCompose.mp (P Q : Prop) (f : P → Q) (h : P) : Q := f h
def AtlasCompose.dependent (P : Nat → Prop) (h : ∀ n, P n) (n : Nat) : P n := h n
def AtlasCompose.chain (P Q R : Prop) (f : P → Q) (g : Q → R) (h : P) : R := g (f h)
def AtlasCompose.shadow (x : Nat) : Nat → Nat := fun x => x
def AtlasCompose.localProof (P Q : Prop) (f : P → Q) (h : P) : Q := let q : Q := f h; q
def AtlasCompose.localDependent (n : Nat) : Fin (n + 1) := let m := n; ⟨m, Nat.lt_succ_self m⟩
def AtlasCompose.unused (P : Prop) (h : P) : True := True.intro
def AtlasCompose.cases (P Q : Prop) (h : P ∨ Q) : Q ∨ P := Or.casesOn h (fun p => Or.inr p) (fun q => Or.inl q)
def AtlasCompose.recursiveUnused (n : Nat) : n = n := Nat.rec (motive := fun n => n = n) (Eq.refl 0) (fun n ih => Eq.refl (Nat.succ n)) n
'''
prepare = '''
run_cmd do
 let mut requests : Array Json := #[]
 let mut lets : Array Json := #[]
 for name in [``AtlasCompose.mp,``AtlasCompose.dependent,``AtlasCompose.chain,``AtlasCompose.shadow,
   ``AtlasCompose.localProof,``AtlasCompose.localDependent,``AtlasCompose.unused,``AtlasCompose.cases,``AtlasCompose.recursiveUnused,``AtlasCompose.takeInputs,``AtlasCompose.mixed,``AtlasCompose.nestedProof] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing body"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),
   ("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),
   ("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/" ++ name.toString ++ ".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let mut paths : Array Json := #[]
  let mut letPaths : Array Json := #[]
  let mut work := #[(0,t,#[]),(1,v,#[])]
  while !work.isEmpty do
   if paths.size > 4096 then throwError "Small control exceeded bound"
   let (root,id,slots) := work.back!
   work := work.pop
   let route := AtlasOccurrenceTypes.routeJson root slots
   paths := paths.push route
   if s.kind[id]! == 8 then letPaths := letPaths.push route
   for j in [:s.children[id]!.size] do work := work.push (root,s.children[id]![j]!,slots.push j)
  let source := Json.mkObj [("edition",toJson "native-control"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")]
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson paths),("source",source)])
  if !letPaths.isEmpty then lets := lets.push (Json.mkObj [("packetFile",toJson file),("routes",toJson letPaths),("source",source)])
 liftIO <| IO.FS.writeFile "REQUEST" (toJson requests).compress
 liftIO <| IO.FS.writeFile "LETS" (toJson lets).compress
'''.replace('FOLDER', str(folder)).replace('REQUEST', str(request)).replace('LETS', str(lets))
entry = folder / 'Controls.lean'
entry.write_text(core + fixture + prepare + '\n#atlas_occurrence_types ' + json.dumps(str(request)) + ' => ' + json.dumps(str(output)) + '\n#atlas_let_reductions ' + json.dumps(str(lets)) + ' => ' + json.dumps(str(let_output)) + '\n')
run_checked([args.lean, str(entry)], folder, 'native', reserve=args.reserve_gib)
subprocess.run(['node', 'scripts/check-proof-atlas-native-judgment-models.cjs', str(entry), str(request), str(output), str(let_output)], check=True)
