"""Fresh bounded native Level DAG and semantics controls; no project imports."""
import argparse, gzip, hashlib, json, subprocess, tempfile
from pathlib import Path
from build_recursion_examples import run_checked
parser=argparse.ArgumentParser()
parser.add_argument('lean',nargs='?',default='lean')
parser.add_argument('--reserve-gib',type=int,default=30)
parser.add_argument('--publish',action='store_true')
args=parser.parse_args();assert args.reserve_gib>=1
base=Path(__file__).parent
folder=Path(tempfile.mkdtemp(prefix='atlas-universe-controls-'))
output=folder/'levels.json'
core=(base/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','')
source=core+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+(base/'UniverseControls.lean').read_text().replace('UNIVERSE_OUTPUT',str(output))
entry=folder/'Controls.lean';entry.write_text(source)
run_checked([args.lean,str(entry)],folder,'native',reserve=args.reserve_gib)
x=json.loads(output.read_text());assert x['leanVersion']=='4.33.1'
# Stable source identity does not include the private temporary output path.
stable=core+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+(base/'UniverseControls.lean').read_text()
x['sourceSha256']=hashlib.sha256(stable.encode()).hexdigest()
x['imports']=['Lean']
raw=json.dumps(x,separators=(',',':'),ensure_ascii=False).encode()
output.write_bytes(raw)
subprocess.run(['node','scripts/check-proof-atlas-native-universes.cjs',str(output)],check=True)
if args.publish:
 target=base.parents[1]/'public/data/proof-atlas/universe-controls.json.gz'
 target.write_bytes(gzip.compress(raw,mtime=0))
 descriptor={'format':x['format'],'file':'/public/data/proof-atlas/universe-controls.json.gz','sha256':hashlib.sha256(raw).hexdigest(),'decodedBytes':len(raw),'sourceSha256':x['sourceSha256'],'leanVersion':x['leanVersion']}
 (target.parent/'universe-controls-manifest.js').write_text('window.PROOF_ATLAS_UNIVERSE_CONTROLS = '+json.dumps(descriptor,separators=(',',':'))+';\n')
else:
 committed=gzip.decompress((base.parents[1]/'public/data/proof-atlas/universe-controls.json.gz').read_bytes())
 # Preserve the original producer identity; compare every compiled field on replay.
 old=json.loads(committed)
 manifest=json.loads((base.parents[1]/'public/data/proof-atlas/universe-controls-manifest.js').read_text().split('=',1)[1].strip().removesuffix(';'))
 assert hashlib.sha256(committed).hexdigest()==manifest['sha256'] and old['sourceSha256']==manifest['sourceSha256'],'Original native control provenance changed'
 assert {k:v for k,v in old.items() if k!='sourceSha256'}=={k:v for k,v in x.items() if k!='sourceSha256'},'Native universe controls changed; regenerate deliberately.'
 print(json.dumps({'status':'PASS','publishedProducerSha256':old['sourceSha256'],'replayProducerSha256':x['sourceSha256'],'compiledControlPayloadMatches':True}))

