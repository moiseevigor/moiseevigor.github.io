"""Fresh raw kernel controls preserve lambda heads that surface elaboration may reduce."""
import argparse, json, subprocess, tempfile, sys
from pathlib import Path
base=Path(__file__).parent
from build_recursion_examples import run_checked
parser=argparse.ArgumentParser();parser.add_argument('lean',nargs='?',default='lean');parser.add_argument('--reserve-gib',type=int,default=30)
args=parser.parse_args();assert args.reserve_gib>=1
lean=args.lean
core=(base/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')+'\n'+(base/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
fixture='''
run_meta do
 let nat := mkConst ``Nat
 let lam := fun n t b => Expr.lam n t b .default
 let app := mkApp
 let z := Expr.bvar 0
 let proof := app (lam `h (mkConst ``True) z) (mkConst ``True.intro)
 let value := app (lam `x nat (app (mkConst ``Nat.succ) z)) (mkNatLit 2)
 let dependent := app (lam `n nat (mkApp2 (mkConst ``Eq.refl [.succ .zero]) nat z)) (mkNatLit 2)
 let capture := lam `z nat (app (lam `x nat (lam `z nat (.bvar 1))) z)
 let duplicate := lam `z nat (app (lam `x nat (mkAppN (mkConst ``Prod.mk [.zero,.zero]) #[nat,nat,z,z])) (app (mkConst ``Nat.succ) z))
 let natFn ← mkArrow nat nat
 let boundArg := lam `z nat (app (lam `f natFn (lam `z nat (app (.bvar 1) z))) (lam `y nat (.bvar 1)))
 let letBody := lam `z nat (app (lam `x nat (.letE `z nat z (.bvar 1) false)) z)
 let dependentDomain := lam `n nat (app (lam `x nat (lam `h (mkAppN (mkConst ``Eq [.succ .zero]) #[nat,z,z]) z)) z)
 let multiple := app (app (lam `x nat (lam `y nat (.bvar 1))) (mkNatLit 2)) (mkNatLit 3)
 for (name,value) in #[(`AtlasBeta.proof,proof),(`AtlasBeta.value,value),(`AtlasBeta.dependent,dependent),(`AtlasBeta.capture,capture),(`AtlasBeta.duplicate,duplicate),(`AtlasBeta.boundArgument,boundArg),(`AtlasBeta.multiple,multiple),(`AtlasBeta.letBody,letBody),(`AtlasBeta.dependentDomain,dependentDomain)] do
  let type ← AtlasOccurrenceTypes.kernelType value
  addDecl (.defnDecl { name, levelParams := [], type, value, hints := .abbrev, safety := .safe })
 match Kernel.isDefEq (← getEnv) (← getLCtx) (mkNatLit 2) (mkNatLit 3) with
 | .ok false => pure ()
 | _ => throwError "Unequal same-type values accepted"
'''
with tempfile.TemporaryDirectory(prefix='atlas-beta-controls-') as tmp:
 folder=Path(tmp);requests=folder/'requests.json';output=folder/'types.json'
 prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [`AtlasBeta.proof,`AtlasBeta.value,`AtlasBeta.dependent,`AtlasBeta.capture,`AtlasBeta.duplicate,`AtlasBeta.boundArgument,`AtlasBeta.multiple,`AtlasBeta.letBody,`AtlasBeta.dependentDomain] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing fixture"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/" ++ name.toString ++ ".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let slots := if name == `AtlasBeta.capture || name == `AtlasBeta.duplicate || name == `AtlasBeta.boundArgument || name == `AtlasBeta.letBody || name == `AtlasBeta.dependentDomain then #[1] else #[]
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson #[AtlasOccurrenceTypes.routeJson 1 slots]),("source",Json.mkObj [("edition",toJson "native-control"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''
 prepare=prepare.replace('FOLDER',str(folder)).replace('REQUESTS',str(requests))
 entry=folder/'Controls.lean';entry.write_text(core+fixture+prepare+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(output))+'\n')
 run_checked([lean,str(entry)],folder,'native',reserve=args.reserve_gib)
 check=subprocess.run(['node',str(base.parent.parent/'scripts/check-proof-atlas-native-beta-models.cjs'),str(requests),str(output)],capture_output=True,text=True);assert check.returncode==0,check.stdout+check.stderr
 print(check.stdout.strip())
 subprocess.run(['node',str(base.parent.parent/'scripts/check-proof-atlas-native-conversions.cjs'),str(requests),str(output)],check=True)
