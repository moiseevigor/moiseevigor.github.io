"""Compose native lambda/Pi observations using already compiled own controls."""
from pathlib import Path
import json, sys, os, hashlib

BASE = Path(__file__).resolve().parent
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO / 'research/proof-atlas'))
from build_recursion_examples import run_checked

folder = Path(sys.argv[1]).resolve()
queries = json.loads((folder / 'requests.json').read_text())
for query in queries:
    query['routes'] = [dict(root=1, slots=[])] + query['routes']
request = folder / 'introduction-requests.json'
request.write_text(json.dumps(queries, separators=(',', ':')))
output = folder / 'introductions.json'
body = (folder / 'Export.lean').read_text().split('\n#atlas_context_transport ')[0]
producer = (BASE / 'ExportIntroductionTransport.lean').read_text().replace('import ExportContextTransport', '')
entry = folder / 'Introductions.lean'
entry.write_text(body + producer + '\n#atlas_introduction_transport ' + json.dumps(str(request))
                 + ' => ' + json.dumps(str(output)) + '\n')
resources = run_checked(
    [os.environ.get('ATLAS_LEAN','lean'), str(entry)],
    folder, 'introductions', dict(os.environ, LEAN_PATH=str(folder)), 30)
result = dict(status='EXTRACTED', resources=resources,
              producerSha256=hashlib.sha256(entry.read_bytes()).hexdigest(),
              requestSha256=hashlib.sha256(request.read_bytes()).hexdigest(),
              outputSha256=hashlib.sha256(output.read_bytes()).hexdigest())
(folder / 'introduction-native-result.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps(result))
