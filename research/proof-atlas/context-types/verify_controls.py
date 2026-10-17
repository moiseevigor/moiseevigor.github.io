"""Fresh, self-contained native replay of all 484 own-control source routes."""
from pathlib import Path
import argparse,gzip,hashlib,json,os,subprocess,sys,tempfile
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parent.parent
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
parser=argparse.ArgumentParser();parser.add_argument('--lean',default='lean');args=parser.parse_args()
compiler=subprocess.check_output([args.lean,'--version'],text=True).strip();assert 'version 4.33.1,'in compiler
folder=Path(tempfile.mkdtemp(prefix='atlas-native-context-controls-')).resolve();source=folder/'AtlasClosure/Controls.lean';source.parent.mkdir();source.write_bytes((BASE/'Controls.lean').read_bytes());env=dict(os.environ,LEAN_PATH=str(folder));run_checked([args.lean,'-o',str(source.with_suffix('.olean')),str(source)],folder,'compile',env)
text=(ROOT/'public/data/proof-atlas/context-types-manifest.js').read_text();inventory=json.loads(text.split('=',1)[1].rstrip(';\n'));records={r['name']:r for r in inventory['edition']['declarations']};requests=[]
for d in inventory['records']:
    if d['edition']!='closed-context-controls':continue
    pkg=json.loads(gzip.decompress((ROOT/d['file'].lstrip('/')).read_bytes()));r=records[d['name']];packet=gzip.decompress((ROOT/r['file'].lstrip('/')).read_bytes());assert hashlib.sha256(packet).hexdigest()==d['indexSha256'];target=folder/(d['name']+'.json');target.write_bytes(packet);requests.append({'packetFile':str(target),'source':pkg['source'],'states':[e['state']for e in pkg['entries']]})
request=folder/'request.json';request.write_text(json.dumps(requests,separators=(',',':')));output=folder/'observations.ndjson'
body=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import AtlasClosure.Controls')+'\nset_option maxHeartbeats 10000000\nset_option maxRecDepth 8192\n'+(RESEARCH/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')+'\n'+(BASE/'ExportClosedContext.lean').read_text().replace('import ExportOccurrenceTypes','')+'\n#atlas_closed_context '+json.dumps(str(request))+' => '+json.dumps(str(output))+'\n'
entry=folder/'Replay.lean';entry.write_text(body);run_checked([args.lean,str(entry)],folder,'queries',env)
subprocess.run(['node','scripts/check-proof-atlas-native-context-types.cjs',str(output)],cwd=ROOT,check=True)
print(json.dumps({'status':'PASS','selected':sum(len(q['states'])for q in requests),'scope':'Fresh own controls only; no AI source or Mathlib rebuilt.','folder':str(folder)}))
