"""Fresh core-only constructor, universe-instance and source/typing separation controls."""
import argparse, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked
B=Path(__file__).parent
p=argparse.ArgumentParser();p.add_argument('lean',nargs='?',default='lean');p.add_argument('--reserve-gib',type=int,default=30);p.add_argument('--expectations',action='store_true');a=p.parse_args();assert a.reserve_gib>=1
compiler=subprocess.check_output([a.lean,'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-constructor-controls-'));fixture=folder/'ConstructorFixture.lean';fixture.write_text((B/'ConstructorControls.lean').read_text()+('\n'+(B/'ExpectationControls.lean').read_text() if a.expectations else ''));env=dict(os.environ,LEAN_PATH=str(folder))
run_checked([a.lean,'-o',str(fixture.with_suffix('.olean')),str(fixture)],folder,'compile',env,a.reserve_gib)
core=(B/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ConstructorFixture')+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
requests=folder/'requests.json';types=folder/'types.json';catalogue_request=folder/'catalogue-request.json';catalogue=folder/'catalogue.json'
prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [``AtlasConstructorControl.conjunction,``AtlasConstructorControl.left,``AtlasConstructorControl.right,``AtlasConstructorControl.witness,``AtlasConstructorControl.reflexive,``AtlasConstructorControl.truth,``AtlasConstructorControl.zero,``AtlasConstructorControl.successor,``AtlasConstructorControl.pair,``AtlasConstructorControl.dependent,``AtlasConstructorControl.empty,``AtlasConstructorControl.indexed,``AtlasConstructorControl.collapse,``AtlasConstructorControl.higher,``AtlasConstructorControl.partialConstructor,``AtlasConstructorControl.Pretend.intro,``AtlasConstructorControl.wrapped,``AtlasConstructorControl.ProofPretend.intro,``AtlasConstructorControl.wrappedProof,``AtlasConstructorControl.sharedScopes] do
  let info ← getConstInfo name
  if let some value := info.value? true then
   let (t,s) := AtlasLibrary.intern info.type {}
   let (v,s) := AtlasLibrary.intern value s
   let file := "FOLDER/" ++ name.toString ++ ".json"
   let declaration := Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]
   let packet := Json.mkObj [("declaration",declaration),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
   liftIO <| IO.FS.writeFile file packet.compress
   let mut paths : Array Json := #[]
   let mut work := #[(0,t,#[]),(1,v,#[])]
   while !work.isEmpty do
    unless paths.size < 4096 do throwError "Small fixture bound"
    let (root,id,slots) := work.back!
    work := work.pop
    paths := paths.push (AtlasOccurrenceTypes.routeJson root slots)
    for j in [:s.children[id]!.size] do work := work.push (root,s.children[id]![j]!,slots.push j)
   requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson paths),("source",Json.mkObj [("edition",toJson "native-constructor-controls"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''.replace('FOLDER',str(folder)).replace('REQUESTS',str(requests))
if a.expectations: prepare=prepare.replace('``AtlasConstructorControl.sharedScopes]', '``AtlasConstructorControl.sharedScopes,``AtlasConstructorControl.nestedDomain,``AtlasConstructorControl.letDomain,``AtlasConstructorControl.localWitness,``AtlasConstructorControl.shadowed,``AtlasConstructorControl.dependentFunction,``AtlasConstructorControl.sharedDependentScopes]')
type_exporter=(B/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
entry=folder/'Types.lean';entry.write_text(core+type_exporter+prepare+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(types))+'\n')
run_checked([a.lean,str(entry)],folder,'types',env,a.reserve_gib)
subprocess.run(['node','scripts/check-proof-atlas-native-constructors.cjs','prepare',str(fixture),str(requests),str(catalogue_request)],check=True)
exporter=(B/'ExportConstructorCatalogue.lean').read_text().replace('import ExportLibrary','')
entry=folder/'Catalogue.lean';entry.write_text(core+exporter+'\n#atlas_constructor_catalogue '+json.dumps(str(catalogue_request))+' => '+json.dumps(str(catalogue))+'\n')
run_checked([a.lean,str(entry)],folder,'catalogue',env,a.reserve_gib)
x=json.loads(catalogue.read_text());x.update(producerSha256=hashlib.sha256((core+exporter).encode()).hexdigest(),requestSha256=hashlib.sha256(catalogue_request.read_bytes()).hexdigest(),environment={'compiler':compiler,'kind':'fresh-core-control/1'},imports=['Lean','ConstructorFixture']);catalogue.write_text(json.dumps(x,separators=(',',':')))
subprocess.run(['node','scripts/check-proof-atlas-native-constructors.cjs','check',str(fixture),str(requests),str(types),str(catalogue)],check=True)

if a.expectations: subprocess.run(['node','scripts/check-proof-atlas-native-expectations.cjs',str(folder)],check=True)
