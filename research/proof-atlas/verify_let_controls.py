"""Bounded fresh core-only let controls; no private project or Mathlib is required."""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
from build_recursion_examples import run_checked

parser = argparse.ArgumentParser()
parser.add_argument('lean', nargs='?', default='lean')
parser.add_argument('--reserve-gib', type=int, default=30)
args = parser.parse_args()
base = Path(__file__).parent
folder = Path(tempfile.mkdtemp(prefix='atlas-let-controls-'))
request, output = folder / 'requests.json', folder / 'types.json'
core = (base / 'ExportLibrary.lean').read_text().replace('import SE2Conjugate', '')
core += '\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
core += (base / 'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary', '')
core += '\n' + (base / 'ExportLetReduction.lean').read_text().replace('import ExportOccurrenceTypes', '')
core += '\n' + (base / 'LetReductionControls.lean').read_text()
prepare = '''
run_cmd do
 let mut requests : Array Json := #[]
 for name in [`AtlasLet.proof,`AtlasLet.value,`AtlasLet.dependent,`AtlasLet.capture,`AtlasLet.duplicate,`AtlasLet.boundValue,`AtlasLet.beforeValue,`AtlasLet.domain,`AtlasLet.typeLevel,`AtlasLet.unused,`AtlasLet.shadow,`AtlasLet.proofIrrelevance,`AtlasLet.shared,`AtlasLet.projection,`AtlasLet.annotation,`AtlasLet.poly,`AtlasLet.sharedContexts] do
  let info ← getConstInfo name
  let some value := info.value? true | throwError "No fixture body"
  let (t,s) := AtlasLibrary.intern info.type {}
  let (v,s) := AtlasLibrary.intern value s
  let packet := Json.mkObj [("declaration",Json.mkObj [("name",toJson name.toString),("rootPaths",toJson #["root.type","root.value"])]),("roots",toJson #[t,v]),("kind",toJson s.kind),("children",toJson s.children),("payloads",toJson s.payloads),("expanded",toJson (s.expanded.map (toString ·))),("neededScope",toJson s.neededScope)]
  let file := "FOLDER/" ++ name.toString ++ ".json"
  liftIO <| IO.FS.writeFile file packet.compress
  let slots := if name == `AtlasLet.proofIrrelevance || name == `AtlasLet.poly then #[1,1] else if [``AtlasLet.capture,``AtlasLet.duplicate,``AtlasLet.boundValue,``AtlasLet.beforeValue,``AtlasLet.shared].contains name then #[1] else #[]
  let routes := if name == `AtlasLet.sharedContexts then #[AtlasOccurrenceTypes.routeJson 1 #[0,1,1],AtlasOccurrenceTypes.routeJson 1 #[1,0,1,1]] else #[AtlasOccurrenceTypes.routeJson 1 slots]
  requests := requests.push (Json.mkObj [("packetFile",toJson file),("routes",toJson routes),("source",Json.mkObj [("edition",toJson "native-control"),("name",toJson name.toString),("indexSha256",toJson "fixture"),("sourceSha256",toJson "fixture")])])
 liftIO <| IO.FS.writeFile "REQUEST" (toJson requests).compress
'''.replace('FOLDER', str(folder)).replace('REQUEST', str(request))
entry = folder / 'Controls.lean'
entry.write_text(core + prepare + '\n#atlas_let_reductions ' + json.dumps(str(request)) + ' => ' + json.dumps(str(output)) + '\n')
run_checked([args.lean, str(entry)], folder, 'native', reserve=args.reserve_gib)
subprocess.run(['node', 'scripts/check-proof-atlas-native-let-models.cjs', str(request), str(output)], check=True)

subprocess.run(['node', 'scripts/check-proof-atlas-native-conversions.cjs', str(request), str(output)], check=True)
