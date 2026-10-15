"""Fresh direct, dependent, recursive and eta-wrapper recursor controls."""
import json, subprocess, tempfile, sys
from pathlib import Path
base=Path(__file__).parent
lean=sys.argv[1] if len(sys.argv)>1 else 'lean'
core=(base/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')+'\n'+(base/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
fixture='''
def AtlasCases.either (a b : Prop) (h : a ∨ b) : b ∨ a := Or.casesOn h (fun h => Or.inr h) (fun h => Or.inl h)
def AtlasCases.pair (a b : Prop) (h : a ∧ b) : b ∧ a := And.casesOn h (fun left right => And.intro right left)
def AtlasCases.witness (α : Type) (P : α → Prop) (h : ∃ x, P x) : ∃ x, P x := Exists.casesOn h (fun w h => Exists.intro w h)
def AtlasCases.natural (n : Nat) : Nat := Nat.rec 0 (fun n ih => Nat.succ ih) n
def AtlasCases.dependent (n : Nat) : n = n := Nat.rec (motive := fun n => n = n) (Eq.refl 0) (fun n ih => Eq.refl (Nat.succ n)) n
def AtlasCases.indexed (α : Type) (x y : α) (h : x = y) : y = x := @Eq.rec α x (fun y _ => y = x) (Eq.refl x) y h
def AtlasCases.returnsFunction (n : Nat) : Nat → Nat := Nat.rec (motive := fun _ => Nat → Nat) (fun x => x) (fun n ih x => ih x) n
def AtlasCases.trailing (n x : Nat) : Nat := (Nat.rec (motive := fun _ => Nat → Nat) (fun x => x) (fun n ih x => ih x) n) x
def AtlasCases.trailingType (n x : Nat) : Prop := (Nat.rec (motive := fun _ => Nat → Prop) (fun x => True) (fun n ih x => ih x) n) x
def AtlasCases.empty (P : Prop) (h : False) : P := @False.rec (fun _ => P) h
def AtlasCases.sort (n : Nat) : Type := Nat.rec (motive := fun _ => Type) Nat (fun n previous => previous) n
def AtlasCases.nonForwardingTarget (a b P : Prop) (h : a ∧ b) (intro : b → a → P) : P := And.rec (motive := fun _ => P) (fun l r => intro r l) h
def AtlasCases.nonForwarding (a b P : Prop) (h : a ∧ b) (intro : b → a → P) : P := AtlasCases.nonForwardingTarget a b P h intro
run_meta do
 let info ← getConstInfo ``AtlasCases.natural
 let some (.lam _ _ body _) := info.value? true | throwError "Missing natural body"
 let value := body.appFn!
 let type ← AtlasOccurrenceTypes.kernelType value
 addDecl (.defnDecl {name:=`AtlasCases.partial,levelParams:=[],type,value,hints:=.abbrev,safety:=.safe})
 for name in [`AtlasCases.proofLeft,`AtlasCases.proofRight] do
  addDecl (.axiomDecl {name,levelParams:=[],type:=mkConst ``True,isUnsafe:=false})
 let .ok true := Kernel.isDefEq (← getEnv) (← getLCtx) (mkConst `AtlasCases.proofLeft) (mkConst `AtlasCases.proofRight)
  | throwError "Proof irrelevance control failed"
'''
with tempfile.TemporaryDirectory(prefix='atlas-case-controls-') as tmp:
 folder=Path(tmp);requests=folder/'requests.json';output=folder/'types.json'
 prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [``AtlasCases.either,``AtlasCases.pair,``AtlasCases.witness,``AtlasCases.natural,``AtlasCases.dependent,``AtlasCases.indexed,``AtlasCases.returnsFunction,``AtlasCases.trailing,``AtlasCases.sort,``AtlasCases.empty,``AtlasCases.trailingType,``AtlasCases.nonForwarding,``AtlasCases.partial] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing fixture"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/" ++ name.toString ++ ".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let mut body := value
  let mut slots : Array Nat := #[]
  while body.isLambda do
   body := body.bindingBody!; slots := slots.push 1
  let args := body.getAppArgs
  let mut paths := #[AtlasOccurrenceTypes.routeJson 1 slots]
  for j in [:args.size] do
   let mut sourceSlots := slots
   for _ in [:args.size-1-j] do sourceSlots := sourceSlots.push 0
   sourceSlots := sourceSlots.push 1
   let mut arg := args[j]!
   while arg.isLambda do
    paths := paths.push (AtlasOccurrenceTypes.routeJson 1 sourceSlots)
    arg := arg.bindingBody!; sourceSlots := sourceSlots.push 1
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson paths),("source",Json.mkObj [("edition",toJson "native-control"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''
 prepare=prepare.replace('FOLDER',str(folder)).replace('REQUESTS',str(requests))
 entry=folder/'Controls.lean';entry.write_text(core+fixture+prepare+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(output))+'\n')
 run=subprocess.run([lean,str(entry)],capture_output=True,text=True);assert run.returncode==0,run.stdout+run.stderr
 check=subprocess.run(['node',str(base.parent.parent/'scripts/check-proof-atlas-native-elimination-models.cjs'),str(requests),str(output)],capture_output=True,text=True);assert check.returncode==0,check.stdout+check.stderr
 print(check.stdout.strip())
