"""Replay the public self-contained catalogue; private project catalogues remain native attestations."""
import argparse, gzip, json, hashlib, subprocess, tempfile
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('lean',nargs='?',default='lean');p.add_argument('--reserve-gib',type=int,default=30);a=p.parse_args()
folder=Path(tempfile.mkdtemp(prefix='atlas-constructor-replay-'));requests=folder/'requests'
subprocess.run(['node','research/proof-atlas/prepare_constructor_catalogues.cjs',str(requests)],check=True,capture_output=True,text=True)
result=subprocess.run(['python3','research/proof-atlas/build_constructor_catalogue.py','--lean',a.lean,'--request',str(requests/'recursion-controls.json'),'--recursion','--reserve-gib',str(a.reserve_gib)],check=True,capture_output=True,text=True)
r=json.loads(result.stdout.strip().splitlines()[-1]);new=json.loads(Path(r['output']).read_text());old=json.loads(gzip.decompress(Path('public/data/proof-atlas/constructors/recursion-controls.json.gz').read_bytes()))
assert {k:v for k,v in new.items() if k!='environment'}=={k:v for k,v in old.items() if k!='environment'},'Native compiled constructor payload changed'
assert new['environment']['kind']==old['environment']['kind'] and new['environment']['fixtureSha256']==old['environment']['fixtureSha256']
print(json.dumps({'status':'PASS','constructorRecords':len(new['constructors']),'nativeInstances':sum(len(c['instances'])for c in new['constructors']),'allCompiledFieldsMatch':True,'producerMatches':new['producerSha256']==old['producerSha256'],'scope':'Replayed self-contained native catalogue. Private source projects are not replayed or published.'}))
