"""Export the frozen missing-name inventory against the matching core Lean installation."""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile

base = Path(__file__).resolve().parent
notation = base.parent / 'type-notation'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--lean', type=Path, required=True)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
spec = importlib.util.spec_from_file_location('notation_driver', notation / 'verify.py')
driver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(driver)
lean = args.lean.resolve()
compiler = subprocess.check_output([str(lean), '--version'], text=True).strip()
catalog_file = base.parents[2] / 'public/data/proof-atlas/type-notation-catalog.js'
catalog = json.loads(catalog_file.read_text().split('=', 1)[1].strip().rstrip(';'))
assert compiler == catalog['compiler']
assert hashlib.sha256(lean.read_bytes()).hexdigest() == catalog['leanExecutableSha256']
names = json.loads((base / 'core-signature-requests.json').read_text())
assert names == sorted(set(names))
# The six-argument transport prefix occurs inside a ten-argument case body.
names = sorted(set(names) | {'Eq.ndrec'})
# Reuse the native serializer and the existing kernel-checked binder extraction.
exporter = (notation / 'Export.lean').read_text()
start = exporter.index('      let info ← getConstInfo name')
end = exporter.index('    let mut controls', start)
extract = exporter[start:end]
with tempfile.TemporaryDirectory(prefix='atlas-core-signatures-') as work:
    tmp = Path(work)
    output = tmp / 'core.json'
    entry = tmp / 'Extract.lean'
    entry.write_text(driver.runtime() + """
open Lean Elab Command AtlasLibrary in
run_cmd do
    let mut signatures := #[]
    let requested : List String := """ + json.dumps(names, ensure_ascii=False) + """
    for text in requested do
      let name := text.toName
      unless (← getEnv).contains name do continue
""" + extract + """
    liftIO <| IO.FS.writeFile """ + json.dumps(str(output)) + """ (toJson signatures).compress
""")
    subprocess.run([str(lean), '-j1', '-M4096', str(entry)], cwd=tmp, check=True, timeout=120,
                   env={**os.environ, 'LEAN_PATH': str(tmp)})
    entries = json.loads(output.read_bytes())
assert len({e['name'] for e in entries}) == len(entries)
for e in entries:
    assert e['name'] in names and e['kernelSignature'] == 'PASS'
    encoded = json.dumps([e['nameParts'], e['levelParams'], e['graph']], ensure_ascii=False, separators=(',', ':'))
    e['signatureSha256'] = hashlib.sha256(encoded.encode()).hexdigest()
data = {'compiler':compiler, 'leanExecutableSha256':catalog['leanExecutableSha256'], 'entries':entries}
text = 'window.PROOF_ATLAS_CORE_SIGNATURES = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
target = catalog_file.with_name('branch-core-signatures.js')
if args.check:
    assert target.read_text() == text
else:
    target.write_text(text)
print(f'{len(entries)} of {len(names)} requested declarations found and checked')
