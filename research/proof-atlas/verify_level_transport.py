"""Bounded production serializer and independent native Level decoding checks."""
import argparse, gzip, hashlib, json, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked
parser=argparse.ArgumentParser()
parser.add_argument('lean',nargs='?',default='lean')
parser.add_argument('--reserve-gib',type=int,default=30)
parser.add_argument('--publish',action='store_true')
args=parser.parse_args();assert args.reserve_gib>=1
base=Path(__file__).parent
folder=Path(tempfile.mkdtemp(prefix='atlas-level-transport-'))
output=folder/'transport.json'
core=(base/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')
core+='\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'
core+=(base/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
stable=core+'\n'+(base/'LevelTransportControls.lean').read_text()
entry=folder/'Transport.lean';entry.write_text(stable.replace('TRANSPORT_OUTPUT',str(output)))
resources=run_checked([args.lean,str(entry)],folder,'native',reserve=args.reserve_gib)
x=json.loads(output.read_text());assert x['leanVersion']=='4.33.1'
x['sourceSha256']=hashlib.sha256(stable.encode()).hexdigest()
x['referenceFixtureSha256']=hashlib.sha256(gzip.decompress((base.parents[1]/'public/data/proof-atlas/universe-controls.json.gz').read_bytes())).hexdigest()
raw=json.dumps(x,separators=(',',':'),ensure_ascii=False).encode()
output.write_bytes(raw)
subprocess.run(['node','scripts/check-proof-atlas-native-level-transport.cjs',str(output)],check=True)
target=base.parents[1]/'public/data/proof-atlas/level-transport-controls.json.gz'
if args.publish:
 target.write_bytes(gzip.compress(raw,mtime=0))
 descriptor={'format':x['format'],'file':'/public/data/proof-atlas/level-transport-controls.json.gz','sha256':hashlib.sha256(raw).hexdigest(),'decodedBytes':len(raw),'sourceSha256':x['sourceSha256'],'leanVersion':x['leanVersion']}
 (target.parent/'level-transport-controls-manifest.js').write_text('window.PROOF_ATLAS_LEVEL_TRANSPORT_CONTROLS = '+json.dumps(descriptor,separators=(',',':'))+';\n')
else:
 assert json.loads(gzip.decompress(target.read_bytes()))==x,'Native transport fixture changed; regenerate deliberately.'
print(json.dumps({'status':'EXTRACTED','file':str(output),'sourceSha256':x['sourceSha256'],'resources':resources}))
