"""Private reproducible source-reference experiment; no project rebuild or publication."""
import argparse, hashlib, json, os, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked

BASE = Path(__file__).parent
ROOT = BASE.resolve().parents[1]
sha = lambda b: hashlib.sha256(b).hexdigest()

LARGE = '''
namespace AtlasReferenceControl
structure Dep where
 value : Nat
 proof : value = value
 function : (x : Nat) → value = value
run_cmd liftTermElabM do
 let nat := mkConst ``Nat
 let mut layer := (Array.range 32768).map mkNatLit
 while layer.size > 1 do
  let mut next := #[]
  for j in [:layer.size / 2] do
   next := next.push (mkApp2 (mkConst ``Nat.add) layer[j*2]! layer[j*2+1]!)
  layer := next
 let huge := layer[0]!
 let base := mkApp2 (mkConst ``AtlasProjectionControl.Base.mk [Level.zero]) nat huge
 let eq := mkApp3 (mkConst ``Eq [Level.succ Level.zero]) nat huge huge
 let refl := mkApp2 (mkConst ``Eq.refl [Level.succ Level.zero]) nat huge
 let funType := Expr.forallE `x nat eq .default
 let funValue := mkLambda `x .default nat refl
 let dependent := mkApp3 (mkConst ``Dep.mk) huge refl funValue
 for (name,t,v) in [(`AtlasReferenceControl.largeIndependent,nat,.proj ``AtlasProjectionControl.Base 0 base),
    (`AtlasReferenceControl.largeDependent,eq,.proj ``Dep 1 dependent),
    (`AtlasReferenceControl.largeFunction,funType,.proj ``Dep 2 dependent)] do
  addDecl (.defnDecl {name,levelParams:=[],type:=Expr.forallE `n nat t .default,value:=mkLambda `n .default nat v,hints:=.abbrev,safety:=.safe})
 let openValue := mkApp2 (mkConst ``Nat.add) (.bvar 0) huge
 let openRefl := mkApp2 (mkConst ``Eq.refl [Level.succ Level.zero]) nat openValue
 let openEq := mkApp3 (mkConst ``Eq [Level.succ Level.zero]) nat openValue openValue
 let openFunction := mkLambda `x .default nat (openRefl.liftLooseBVars 0 1)
 let openOperand := mkApp3 (mkConst ``Dep.mk) openValue openRefl openFunction
 let openType := Expr.forallE `x nat (openEq.liftLooseBVars 0 1) .default
 addDecl (.defnDecl {name:=`AtlasReferenceControl.largeOpenFunction,levelParams:=[],type:=Expr.forallE `n nat openType .default,value:=mkLambda `n .default nat (.proj ``Dep 2 openOperand),hints:=.abbrev,safety:=.safe})
end AtlasReferenceControl
'''

PREPARE = '''
run_cmd do
 let names := [``AtlasProjectionControl.Pack.α,``AtlasProjectionControl.Pack.value,``AtlasProjectionControl.Pack.proof,
  ``AtlasProjectionControl.Base.value,``AtlasProjectionControl.Child.toBase,``AtlasProjectionControl.Child.count,
  ``AtlasProjectionControl.Nested.inner,``AtlasProjectionControl.FunBox.function,``AtlasProjectionControl.shared,
  ``AtlasProjectionControl.localDefinition,``AtlasProjectionControl.annotated,``AtlasProjectionControl.proofField,
  ``AtlasProjectionControl.unregistered,``AtlasProjectionControl.hugeProjection,``AtlasProjectionControl.hugeProofProjection,
  ``AtlasReferenceControl.largeIndependent,``AtlasReferenceControl.largeDependent,``AtlasReferenceControl.largeFunction,``AtlasReferenceControl.largeOpenFunction]
 let mut requests : Array Json := #[]
 for name in names do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "No fixture value"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),
   ("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),
   ("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/"++name.toString++".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let mut work := #[(0,t,#[]),(1,v,#[])]
  let mut hasProjection : Array Bool := #[]
  for id in [:s.kind.size] do
   hasProjection := hasProjection.push (s.kind[id]! == 11 || s.children[id]!.any fun c => hasProjection[c]!)
  let mut routes : Array Json := #[]
  let mut visits := 0
  while !work.isEmpty do
   visits := visits+1
   unless visits <= 10000 do throwError "Bounded fixture traversal"
   let (root,id,slots) := work.back!
   work := work.pop
   if !hasProjection[id]! then continue
   if s.kind[id]! == 11 then
    routes := routes.push (Json.mkObj [("root",toJson root),("slots",toJson slots)])
    continue
   if name.toString.startsWith "AtlasReferenceControl.large" && slots.size >= 2 then continue
   for j in [:s.children[id]!.size] do work := work.push (root,s.children[id]![j]!,slots.push j)
  unless !routes.isEmpty do throwError "Missing native projection"
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson routes)])
 liftIO <| IO.FS.writeFile "REQUESTS" (toJson requests).compress
'''

def main():
    p = argparse.ArgumentParser()
    p.add_argument('lean', nargs='?', default='lean')
    p.add_argument('--reserve-gib', type=int, default=30)
    p.add_argument('--workdir', type=Path)
    a = p.parse_args()
    assert a.reserve_gib >= 1
    compiler = subprocess.check_output([a.lean, '--version'], text=True).strip()
    assert 'version 4.33.1,' in compiler
    folder = a.workdir.resolve() if a.workdir else Path(tempfile.mkdtemp(prefix='atlas-source-references-'))
    if a.workdir:
        folder.mkdir(parents=True, exist_ok=False)
    fixture = folder/'ReferenceFixture.lean'
    fixture.write_text((BASE/'ProjectionControls.lean').read_text()+LARGE)
    env = dict(os.environ, LEAN_PATH=str(folder))
    compile_result = run_checked([a.lean, '-o', str(fixture.with_suffix('.olean')), str(fixture)], folder, 'compile', env, a.reserve_gib)
    source_sha, module_sha = sha(fixture.read_bytes()), sha(fixture.with_suffix('.olean').read_bytes())
    core = (BASE/'ExportLibrary.lean').read_text().replace('import SE2Conjugate', 'import ReferenceFixture')+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'
    request = folder/'requests.json'
    prepare = folder/'Prepare.lean'
    prepare.write_text(core+PREPARE.replace('FOLDER', str(folder)).replace('REQUESTS', str(request)))
    prep_result = run_checked([a.lean, str(prepare)], folder, 'prepare', env, a.reserve_gib)
    queries = json.loads(request.read_text())
    for q in queries:
        data = json.loads(Path(q['packetFile']).read_bytes())
        q['source'] = dict(edition='source-reference-controls', name=data['declaration']['name'], indexSha256=sha(Path(q['packetFile']).read_bytes()), sourceSha256=source_sha)
    request.write_text(json.dumps(queries, separators=(',', ':')))
    small_request = folder/'small-requests.json'
    small_request.write_text(json.dumps([q for q in queries if not q['source']['name'].startswith('AtlasReferenceControl.large')], separators=(',', ':')))
    output = folder/'references.json'
    ordinary = folder/'ordinary.json'
    occurrence = (BASE/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
    extractor = (BASE/'ExportSourceReferences.lean').read_text().replace('import ExportOccurrenceTypes', '')
    tool = folder/'References.lean'
    tool.write_text(core+occurrence+extractor+'\n#atlas_source_references '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n#atlas_occurrence_types '+json.dumps(str(small_request))+' => '+json.dumps(str(ordinary))+'\n')
    extraction_result = run_checked([a.lean, str(tool)], folder, 'references', env, a.reserve_gib)
    # The adapter must never acquire evidence from a merely similar source DAG.
    bad_query = json.loads(json.dumps(queries[:1]))
    bad_packet = json.loads(Path(bad_query[0]['packetFile']).read_bytes())
    bad_packet['payloads'][0]['corruptionControl'] = True
    tampered_packet = folder/'tampered-packet.json'
    tampered_packet.write_text(json.dumps(bad_packet, separators=(',', ':')))
    bad_query[0]['packetFile'] = str(tampered_packet)
    tampered_request = folder/'tampered-requests.json'
    tampered_request.write_text(json.dumps(bad_query, separators=(',', ':')))
    tampered_tool = folder/'Tampered.lean'
    rejected_output = folder/'must-not-exist.json'
    tampered_tool.write_text(core+occurrence+extractor+'\n#atlas_source_references '+json.dumps(str(tampered_request))+' => '+json.dumps(str(rejected_output))+'\n')
    try:
        run_checked([a.lean, str(tampered_tool)], folder, 'tampered', env, a.reserve_gib)
    except RuntimeError:
        rejection = json.loads((folder/'tampered.resources.json').read_text())
        assert rejection['stopReason'] is None and rejection['exitCode'] != 0
        assert 'Native/source DAG differs: payloads' in (folder/'tampered.log').read_text()
        assert not rejected_output.exists()
    else:
        raise AssertionError('Changed packet acquired native source-reference evidence')
    assert sha(fixture.read_bytes()) == source_sha and sha(fixture.with_suffix('.olean').read_bytes()) == module_sha
    native = json.loads(output.read_text())
    for case in native:
        case.update(environment=dict(kind='fresh-source-reference-control/1', compiler=compiler, sourceSha256=source_sha, compiledModuleSha256=module_sha), producerSha256=sha((core+occurrence+extractor).encode()), requestSha256=sha(request.read_bytes()))
    output.write_text(json.dumps(native, separators=(',', ':')))
    subprocess.run(['node', 'scripts/check-proof-atlas-source-references.cjs', str(request), str(output), str(ordinary)], cwd=ROOT, check=True)
    result = dict(status='PASS', folder=str(folder), sourceSha256=source_sha, compiledModuleSha256=module_sha, producerSha256=sha((core+occurrence+extractor).encode()), requestSha256=sha(request.read_bytes()), changedPacketRejected=True, compile=compile_result, prepare=prep_result, extraction=extraction_result)
    (folder/'result.json').write_text(json.dumps(result, indent=2)+'\n')
    print(json.dumps(result))

if __name__ == '__main__':
    main()
