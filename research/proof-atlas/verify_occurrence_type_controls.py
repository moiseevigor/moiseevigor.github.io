"""Independent small native controls; no private environment or original proof sources."""
import json, subprocess, tempfile, sys
from pathlib import Path
base=Path(__file__).parent
lean=sys.argv[1] if len(sys.argv)>1 else 'lean'
core=(base/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')+'\n'+(base/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
defs='''
def AtlasTypedFixture.compose (P Q : Prop) (f : P → Q) (p : P) : Q := f p
def AtlasTypedFixture.shadow (x : Nat) : Nat := let x := Nat.succ x; Nat.succ x
def AtlasTypedFixture.zero : 0 = 0 := Eq.refl 0
def AtlasTypedFixture.dependent (α : Type) (P : α → Prop) (x : α) (h : P x) : P x := h
'''
with tempfile.TemporaryDirectory(prefix='atlas-type-controls-') as tmp:
    folder=Path(tmp);requests=folder/'requests.json';output=folder/'types.json'
    prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [``AtlasTypedFixture.compose, ``AtlasTypedFixture.shadow, ``AtlasTypedFixture.zero, ``AtlasTypedFixture.dependent] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "Missing fixture body"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let declaration := Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]
  let packet := Json.mkObj [("declaration",declaration),("roots",toJson #[t,v]),("kind",toJson s.kind),
   ("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/" ++ name.toString ++ ".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let mut paths := #[AtlasOccurrenceTypes.routeJson 1 #[]]
  if name == ``AtlasTypedFixture.compose then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1,1,1,1])
  if name == ``AtlasTypedFixture.dependent then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1,1,1,1])
  if name == ``AtlasTypedFixture.shadow then paths := paths ++ #[AtlasOccurrenceTypes.routeJson 1 #[1,1],AtlasOccurrenceTypes.routeJson 1 #[1,2]]
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson paths),
   ("source",Json.mkObj [("edition",toJson "native-control"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''
    prepare=prepare.replace('FOLDER',str(folder)).replace('REQUESTS',str(requests))
    entry=folder/'Controls.lean';entry.write_text(core+defs+prepare+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(output))+'\n')
    ok=subprocess.run([lean,str(entry)],capture_output=True,text=True);assert ok.returncode==0,ok.stdout+ok.stderr
    result=json.loads(output.read_text());assert all(e['status']=='checked'for r in result for e in r['entries'])
    compose=next(r for r in result if r['name'].endswith('.compose'))['entries'][-1]
    assert [a['role']for a in compose['arguments']]==['proof'] and len(compose['context'])==4
    shadow=next(r for r in result if r['name'].endswith('.shadow'))['entries']
    assert [len(e['context'])for e in shadow[1:]]==[1,2]
    zero=next(r for r in result if r['name'].endswith('.zero'))['entries'][0]
    assert zero['role']=='proof' and [a['role']for a in zero['arguments']]==['type','value']
    dependent=next(r for r in result if r['name'].endswith('.dependent'))['entries'][-1]
    assert dependent['role']=='proof' and len(dependent['context'])==4 and dependent['typeAbstractionRoundtrip'] is True
    assert all(e['typeAbstractionRoundtrip'] is True for r in result for e in r['entries'])
    query=json.loads(requests.read_text())[0];packet=Path(query['packetFile']);data=json.loads(packet.read_text())
    next(p for p in data['payloads'] if 'binderName'in p)['binderName']='deliberatelyChangedBinder'
    packet.write_text(json.dumps(data));requests.write_text(json.dumps([query]))
    bad=folder/'RejectChangedPacket.lean';bad.write_text(core+defs+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(folder/'bad.json'))+'\n')
    rejected=subprocess.run([lean,str(bad)],capture_output=True,text=True);assert rejected.returncode!=0 and 'Native/published DAG mismatch'in rejected.stdout+rejected.stderr
    print(json.dumps({'status':'PASS','kernelTypedControls':4,'selectedOccurrences':sum(len(r['entries'])for r in result),'proofTypeValueRoles':True,'dependentTypeAbstractionRoundtrip':True,'letValueOutsideOwnBinder':True,'changedPacketRejected':True,'scope':'Small native kernel controls; not independent replay of the private corpus.'}))
