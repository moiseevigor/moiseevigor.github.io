"""Fresh native projection controls against every source occurrence."""
import argparse, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked
B=Path(__file__).parent
p=argparse.ArgumentParser();p.add_argument('lean',nargs='?',default='lean');p.add_argument('--reserve-gib',type=int,default=30);a=p.parse_args();assert a.reserve_gib>=1
compiler=subprocess.check_output([a.lean,'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-projection-controls-'));fixture=folder/'ProjectionFixture.lean';fixture.write_text((B/'ProjectionControls.lean').read_text());env=dict(os.environ,LEAN_PATH=str(folder))
run_checked([a.lean,'-o',str(fixture.with_suffix('.olean')),str(fixture)],folder,'compile',env,a.reserve_gib)
core=(B/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ProjectionFixture')+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
requests=folder/'requests.json';types=folder/'types.json';catalogue_request=folder/'catalogue-request.json';catalogue=folder/'catalogue.json'
prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [``AtlasProjectionControl.Pack.α,``AtlasProjectionControl.Pack.value,``AtlasProjectionControl.Pack.proof,``AtlasProjectionControl.Base.value,``AtlasProjectionControl.Child.toBase,``AtlasProjectionControl.Child.count,``AtlasProjectionControl.Nested.inner,``AtlasProjectionControl.FunBox.function,``AtlasProjectionControl.namedWrapper,``AtlasProjectionControl.shared,``AtlasProjectionControl.localDefinition,``AtlasProjectionControl.annotated,``AtlasProjectionControl.proofField,``AtlasProjectionControl.unregistered,``AtlasProjectionControl.hugeProjection,``AtlasProjectionControl.hugeProofProjection] do
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
    if name == ``AtlasProjectionControl.hugeProjection || name == ``AtlasProjectionControl.hugeProofProjection then
     if root == 0 || slots.size == 0 || slots == #[1] || slots == #[1,0] then
      paths := paths.push (AtlasOccurrenceTypes.routeJson root slots)
     if root == 1 && slots.size < 2 then
      for j in [:s.children[id]!.size] do work := work.push (root,s.children[id]![j]!,slots.push j)
     continue
    paths := paths.push (AtlasOccurrenceTypes.routeJson root slots)
    for j in [:s.children[id]!.size] do work := work.push (root,s.children[id]![j]!,slots.push j)
   requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson paths),("source",Json.mkObj [("edition",toJson "projection-controls"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''.replace('FOLDER',str(folder)).replace('REQUESTS',str(requests))
type_exporter=(B/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
entry=folder/'Types.lean';entry.write_text(core+type_exporter+prepare+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(types))+'\n')
run_checked([a.lean,str(entry)],folder,'types',env,a.reserve_gib)
environment={'kind':'fresh-projection-control/1','module':'ProjectionFixture','compiler':compiler,'sourceSha256':hashlib.sha256(fixture.read_bytes()).hexdigest(),'compiledModuleSha256':hashlib.sha256(fixture.with_suffix('.olean').read_bytes()).hexdigest(),'imports':['Lean'],'dependencyRevisions':{}}
records=json.loads(types.read_text())
for r in records:r.update(environment=environment,sourceModuleHashVerified=True,producerSha256=hashlib.sha256((core+type_exporter).encode()).hexdigest(),requestSha256=hashlib.sha256(requests.read_bytes()).hexdigest())
types.write_text(json.dumps(records,separators=(',',':')))
subprocess.run(['node','scripts/check-proof-atlas-native-projections.cjs',str(fixture),str(requests),str(types)],check=True)
