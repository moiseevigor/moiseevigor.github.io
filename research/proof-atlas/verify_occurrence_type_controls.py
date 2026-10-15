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
def AtlasTypedFixture.dependentApp (f : (n : Nat) → Fin (n + 1)) (n : Nat) : Fin (n + 1) := f n
def AtlasTypedFixture.shadowLambda (x : Nat) : Nat → Nat := fun x => x
def AtlasTypedFixture.reflexive (n : Nat) : n = n := Eq.refl n
def AtlasTypedFixture.recursorBody (P : Prop) (p : P) : True → P := fun h => @True.rec (fun _ => P) p h
def AtlasTypedFixture.Alias := Nat
def AtlasTypedFixture.convertApp (f : AtlasTypedFixture.Alias → Nat) (x : Nat) : Nat := f x
def AtlasTypedFixture.residual (f : Nat → Nat → Nat) (x : Nat) : Nat → Nat := f x
run_meta do
 for bad in [Expr.lam `bad (mkNatLit 0) (.bvar 0) .default,
   Expr.letE `bad (mkConst ``Nat) (mkConst ``True.intro) (.bvar 0) false] do
  let (_,shared) := AtlasLibrary.intern bad {}
  let slot := if bad.isLambda then 1 else 2
  let accepted ← observing? (AtlasOccurrenceTypes.atRoute bad [slot] #[] #[] shared 0 #[] "root.value")
  unless accepted.isNone do throwError "Invalid surrounding context was accepted"
 let invalidConversion ← observing? (AtlasOccurrenceTypes.kernelAs (mkConst ``True.intro) (mkConst ``Nat))
 unless invalidConversion.isNone do throwError "Invalid typed-identity conversion was accepted"
'''
with tempfile.TemporaryDirectory(prefix='atlas-type-controls-') as tmp:
    folder=Path(tmp);requests=folder/'requests.json';output=folder/'types.json'
    prepare='''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [``AtlasTypedFixture.compose, ``AtlasTypedFixture.shadow, ``AtlasTypedFixture.zero, ``AtlasTypedFixture.dependent,
   ``AtlasTypedFixture.dependentApp, ``AtlasTypedFixture.convertApp, ``AtlasTypedFixture.residual, ``AtlasTypedFixture.shadowLambda, ``AtlasTypedFixture.reflexive, ``AtlasTypedFixture.recursorBody] do
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
  if name == ``AtlasTypedFixture.recursorBody then paths := paths ++ #[AtlasOccurrenceTypes.routeJson 1 #[1,1],AtlasOccurrenceTypes.routeJson 1 #[1,1,1]]
  if name == ``AtlasTypedFixture.reflexive then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1])
  if name == ``AtlasTypedFixture.shadowLambda then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1])
  if name == ``AtlasTypedFixture.compose then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1,1,1,1])
  if name == ``AtlasTypedFixture.dependent then paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1,1,1,1])
  if name == ``AtlasTypedFixture.shadow then paths := paths ++ #[AtlasOccurrenceTypes.routeJson 1 #[1,1],AtlasOccurrenceTypes.routeJson 1 #[1,2]]
  if name == ``AtlasTypedFixture.dependentApp || name == ``AtlasTypedFixture.convertApp || name == ``AtlasTypedFixture.residual then
   paths := paths.push (AtlasOccurrenceTypes.routeJson 1 #[1,1])
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
    applications=[e for r in result for e in r['entries'] if e['arguments']]
    assert all(e['applicationJudgment']['status']=='checked'for e in applications)
    for e in applications:
        trace=e['applicationJudgment'];assert trace['finalTypeStructuralMatch'] is True
        assert len(trace['stages'])==len(e['arguments']) and trace['stages'][-1]['afterRoot']==e['typeRoot']
        assert all(s[k]=='PASS'for s in trace['stages'] for k in ['kernelFunctionConversion','kernelDomainConversion','kernelResultConversion'])
    dep=next(r for r in result if r['name'].endswith('.dependentApp'))['entries'][-1]['applicationJudgment']['stages'][0]
    assert dep['bodyUsesBinder'] is True
    converted=next(r for r in result if r['name'].endswith('.convertApp'))['entries'][-1]['applicationJudgment']['stages'][0]
    assert converted['actualRoot']!=converted['domainRoot']
    residual=next(r for r in result if r['name'].endswith('.residual'))['entries'][-1]
    assert residual['typeGraph']['kind'][residual['typeRoot']]==7
    lambdas=[e for r in result for e in r['entries'] if 'lambdaJudgment'in e]
    assert lambdas and all(e['lambdaJudgment']['status']=='checked'for e in lambdas)
    for e in lambdas:
        t=e['lambdaJudgment'];g=e['typeGraph']
        assert t['domainBeforeBinder'] and t['bodyContextExtended'] and t['expectedBodyStructuralMatch']
        assert len(t['body']['context'])==len(e['context'])+1 and t['body']['context'][-1]['route']==e['route']
        assert t['body']['expectedRoot']==g['children'][t['piRoot']][1] and g['kind'][t['domain']['sortRoot']]==3
        assert all(t[k]=='PASS'for k in ['kernelDomainSort','kernelBinderConversion','kernelBodyConversion','kernelFunctionConversion'])
    models=subprocess.run(['node',str(base.parent.parent/'scripts/check-proof-atlas-native-application-models.cjs'),str(entry),str(requests),str(output)],capture_output=True,text=True)
    assert models.returncode==0,models.stdout+models.stderr
    print(models.stdout.strip())
    lambda_models=subprocess.run(['node',str(base.parent.parent/'scripts/check-proof-atlas-native-lambda-models.cjs'),str(entry),str(requests),str(output)],capture_output=True,text=True)
    assert lambda_models.returncode==0,lambda_models.stdout+lambda_models.stderr
    print(lambda_models.stdout.strip())
    query=json.loads(requests.read_text())[0];packet=Path(query['packetFile']);data=json.loads(packet.read_text())
    next(p for p in data['payloads'] if 'binderName'in p)['binderName']='deliberatelyChangedBinder'
    packet.write_text(json.dumps(data));requests.write_text(json.dumps([query]))
    bad=folder/'RejectChangedPacket.lean';bad.write_text(core+defs+'\n#atlas_occurrence_types '+json.dumps(str(requests))+' => '+json.dumps(str(folder/'bad.json'))+'\n')
    rejected=subprocess.run([lean,str(bad)],capture_output=True,text=True);assert rejected.returncode!=0 and 'Native/published DAG mismatch'in rejected.stdout+rejected.stderr
    print(json.dumps({'status':'PASS','kernelTypedControls':10,'selectedOccurrences':sum(len(r['entries'])for r in result),'proofTypeValueRoles':True,'dependentTypeAbstractionRoundtrip':True,'letValueOutsideOwnBinder':True,'invalidContextsRejected':2,'changedPacketRejected':True,'applicationTraces':len(applications),'lambdaTraces':len(lambdas),'dependentSubstitution':True,'definitionallyEqualDistinctDomains':True,'residualFunctionType':True,'invalidTypedConversionRejected':True,'scope':'Small native kernel controls; not independent replay of the private corpus.'}))
