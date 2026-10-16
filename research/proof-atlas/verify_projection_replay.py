"""Replay every public synthetic-recursion projection record; no private proof sources."""
import argparse,gzip,json,subprocess,tempfile
from pathlib import Path
B=Path(__file__).parent
p=argparse.ArgumentParser();p.add_argument('lean',nargs='?',default='lean');p.add_argument('--reserve-gib',type=int,default=30);a=p.parse_args()
folder=Path(tempfile.mkdtemp(prefix='atlas-projection-replay-'))
manifest=json.loads(Path('public/data/proof-atlas/projections-manifest.js').read_text().split('=',1)[1].strip().rstrip(';'));descriptors=[d for d in manifest['records'] if d['edition']=='recursion-controls'];requests=[]
script="const f=require('fs'),v=require('vm'),w={};v.runInNewContext(f.readFileSync('public/data/proof-atlas/recursion-examples-manifest.js','utf8'),{window:w});process.stdout.write(JSON.stringify(w.PROOF_ATLAS_RECURSION_EXAMPLES.edition.declarations));"
records=json.loads(subprocess.check_output(['node','-e',script],text=True))
for d in descriptors:
 record=next(r for r in records if r['name']==d['name']);file=folder/(record['indexSha256']+'.json');file.write_bytes(gzip.decompress(Path('.'+record['indexFile']).read_bytes()));requests.append({'packetFile':str(file),'routes':d['routes'],'source':{k:d[k] for k in ['edition','name','module','indexSha256','sourceSha256']}})
request=folder/'requests.json';request.write_text(json.dumps(requests,separators=(',',':')))
run=subprocess.run(['python3',str(B/'run_projection_types.py'),'--lean',a.lean,'--request',str(request),'--recursion','--reserve-gib',str(a.reserve_gib)],text=True,capture_output=True);assert run.returncode==0,run.stderr
output=json.loads(run.stdout.splitlines()[-1])['output']
compare="""const f=require('fs'),z=require('zlib'),a=require('assert/strict'),S=require('./research/proof-atlas/share_type_graphs.cjs');const native=JSON.parse(f.readFileSync(process.argv[1])),ds=JSON.parse(process.argv[2]);let count=0,queries=0;for(const r of native){const d=ds.find(d=>d.name===r.name),old=JSON.parse(z.gunzipSync(f.readFileSync('.'+d.file))),fresh=S.pack(r);a(S.verify(old));a(S.verify(fresh));for(const k of ['format','name','source','nativeDagMatchesPacket','leanVersion','entries','typeGraph','producerSha256','sourceModuleHashVerified'])a.deepEqual(fresh[k],old[k],r.name+' '+k);count+=r.entries.filter(e=>e.projectionJudgment?.status==='checked').length;queries+=r.entries.length;}process.stdout.write(JSON.stringify({status:'PASS',replayedDeclarations:native.length,replayedProjections:count,replayedContextQueries:queries-count,allCompiledFieldsMatch:true,scope:'Self-contained recursion records. Compiler/build digests and private request paths are separately environment-relative; private project proofs are not replayed.'}));"""
subprocess.run(['node','-e',compare,output,json.dumps(descriptors,separators=(',',':'))],check=True)
