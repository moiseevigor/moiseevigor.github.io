"""Core-only construction replay; logs/resources stay in the work directory."""
from pathlib import Path
import argparse,gzip,hashlib,importlib.util,json,os,sys
base=Path(__file__).resolve().parent
repo=base.parents[2]
spec=importlib.util.spec_from_file_location('atlas_frozen_deep_runtime',repo/'research/proof-atlas/deep-typing/verify.py')
frozen=importlib.util.module_from_spec(spec);spec.loader.exec_module(frozen)
TOOLCHAIN='leanprover/lean4:v4.33.1'
COMPILER_COMMIT='819816b2e0a3bf405af45ae5c7af2491d8f5bee6'
RUNTIME_SHA='572004714398a6ff2e3639e4477e4a4815cb81c33a924ba057a29529d41bcecc'
sha=lambda raw:hashlib.sha256(raw).hexdigest()
own_files=['Construction.lean','run.py','model.cjs','check.cjs','pack.py']

def source_files():
 return [*(base/name for name in own_files),repo/'research/proof-atlas/deep-typing/verify.py',
  repo/'research/proof-atlas/deep-typing/ContextQuery.lean',repo/'research/proof-atlas/deep-typing/Controls.lean',
  repo/'research/proof-atlas/ExportLibrary.lean',repo/'research/proof-atlas/LevelTransportControls.lean',
  repo/'research/proof-atlas/compiled-replay/Replay.lean',repo/'research/proof-atlas/build_recursion_examples.py',
  repo/'research/proof-atlas/evaluate_goedel.py',repo/'public/data/proof-atlas/deep-typing-manifest.js']

def source_hashes():
 return {str(p.relative_to(repo)):sha(p.read_bytes())for p in source_files()}

def compiled():
 descriptor=json.loads((repo/'public/data/proof-atlas/occurrence-constructions-manifest.js').read_text().split('=',1)[1].rstrip(';\n'))
 with gzip.open(repo/descriptor['file'].lstrip('/'),'rb')as stream:raw=stream.read(8388609)
 assert len(raw)==descriptor['decodedBytes']<=8388608 and sha(raw)==descriptor['sha256']
 return json.loads(raw)

def source_builder():
 graph=dict(serialization='ExprDAG/1',kind=[],children=[],payloads=[],expanded=[],neededScope=[],roots=[])
 seen={}
 def add(kind,children,payload):
  key=json.dumps([kind,children,payload],sort_keys=True,separators=(',',':'))
  if key in seen:return seen[key]
  node=len(graph['kind']);seen[key]=node;graph['kind'].append(kind);graph['children'].append(children);graph['payloads'].append(payload)
  graph['expanded'].append(str(1+sum(int(graph['expanded'][c])for c in children)))
  graph['neededScope'].append(payload['index']+1 if kind==0 else max([0]+[graph['neededScope'][c]-(1 if kind in(6,7)and j==1 else 0)for j,c in enumerate(children)]))
  return node
 def binder(kind,name,domain,body):return add(kind,[domain,body],dict(binderName=name,binderNameParts=[dict(str=name)],binderInfo='default'))
 return graph,add,binder

def dependent_argument_control():
 """Own serialized control: λ A : Type, (λ B : Type, λ x : B, x) A."""
 graph,add,binder=source_builder()
 sort=add(3,[],dict(level=dict(kind='succ',of=dict(kind='zero'))));v0=add(0,[],dict(index=0));v1=add(0,[],dict(index=1))
 expected=binder(7,'A',sort,binder(7,'x',v0,v1))
 function=binder(6,'B',sort,binder(6,'x',v0,v0));application=add(5,[function,v0],{});value=binder(6,'A',sort,application)
 graph['roots']=[expected,value]
 return dict(name='AtlasConstructionControl.dependent_argument',source=graph,requests=[dict(rule='Pi-application',slots=[1])])

def deep_dependent_context_control(depth=10000):
 """The last domain denotes A; the same bvar node in its body denotes x₁."""
 graph,add,binder=source_builder();sort=add(3,[],dict(level=dict(kind='succ',of=dict(kind='zero'))))
 variables=[add(0,[],dict(index=i))for i in range(depth+1)]
 expected=variables[depth]
 for i in reversed(range(depth)):
  expected=binder(7,'x',variables[i],expected)
 expected=binder(7,'A',sort,expected)
 value=variables[depth-1]
 for i in reversed(range(depth)):
  value=binder(6,'x',variables[i],value)
 value=binder(6,'A',sort,value);graph['roots']=[expected,value]
 return dict(name='AtlasConstructionControl.deep_dependent_context',source=graph,requests=[dict(rule='Pi-introduction',slots=[1]*depth)])

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--workdir',type=Path,required=True);parser.add_argument('--lean',type=Path,required=True);parser.add_argument('--reserve-gib',type=int,default=30);parser.add_argument('--compare',action='store_true');args=parser.parse_args();assert args.reserve_gib>=1
 folder=args.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
 (folder/'producer').mkdir()
 before=source_hashes()
 for name in own_files:(folder/'producer'/name).write_bytes((base/name).read_bytes())
 d=json.loads((repo/'public/data/proof-atlas/deep-typing-manifest.js').read_text().split('=',1)[1].rstrip(';\n'))
 previous_file=repo/d['file'].lstrip('/');previous_sha=sha(previous_file.read_bytes())
 with gzip.open(previous_file,'rb')as stream:raw=stream.read(8388609)
 assert len(raw)==d['decodedBytes']<=8388608 and sha(raw)==d['sha256']
 evidence=json.loads(raw);cases={c['name']:c for c in evidence['nativeResult']['cases']};cases[evidence['originalPublicReplay']['record']['name']]=evidence['originalPublicReplay']['record']
 requests={
 'deep-reflexivity':[('Pi-introduction',[]),('Pi-application',[1]),('Pi-application',[1,0]),('Pi-application',[1,1]+[1]*9999)],
 'deep-shadowed-context':[('Pi-introduction',[1]*9999)],
 'dependent-domain':[('Pi-introduction',[]),('Pi-introduction',[1])],
 'shadowed-shared-variable':[('Pi-application',[1,1])],
 'let-value-before-binder':[('Pi-introduction',[])],
 }
 replay=evidence['originalPublicReplay']['record']['name'];requests[replay]=[('Pi-introduction',[])]
 rows=[]
 for name,queries in requests.items():
  rows.append(dict(name=name,source=cases[name]['source'],requests=[dict(rule=rule,slots=slots)for rule,slots in queries]))
 own=dependent_argument_control();rows.append(own)
 deep=deep_dependent_context_control();rows.append(deep)
 input=folder/'input.json';input_raw=(json.dumps(rows,separators=(',',':'))+'\n').encode();input.write_bytes(input_raw)
 lean=args.lean.resolve();assert lean.is_file()
 runtime=frozen.runtime();assert sha(runtime.encode())==RUNTIME_SHA
 code=(base/'Construction.lean').read_text();output=folder/'result.json'
 entry=folder/'Run.lean';entry_raw=(runtime+'\n'+code+'\n#atlas_construction_packets '+json.dumps(str(input))+' => '+json.dumps(str(output))+'\n').encode();entry.write_bytes(entry_raw)
 env=dict(PATH=str(lean.parent)+os.pathsep+os.defpath,LEAN_PATH=str(folder),TMPDIR=str(folder/'scratch'),LANG='en_US.UTF-8')
 frozen.run_checked([str(lean),'--version'],folder,'version',env,args.reserve_gib,120)
 compiler=(folder/'version.log').read_text().strip()
 assert 'version 4.33.1,' in compiler and COMPILER_COMMIT in compiler
 command=[str(lean),'-s','65536',str(entry)]
 if sys.platform=='darwin':command=['/usr/bin/sandbox-exec','-p',frozen.sandbox_profile(lean,folder,[]),*command]
 resources=frozen.run_checked(command,folder,'native',env,args.reserve_gib,120)
 r=json.loads(output.read_text());assert r['status']=='PASS';assert len(r['cases'])==len(rows)
 assert sum(len(c['observations'])for c in r['cases'])==12
 assert len(r['negativeControls'])==5 and all(c['rejected']for c in r['negativeControls'])
 assert source_hashes()==before,'Producer sources changed during native replay'
 assert input.read_bytes()==input_raw and entry.read_bytes()==entry_raw,'Native inputs changed during replay'
 assert sha(previous_file.read_bytes())==previous_sha,'Original compiled input changed during replay'
 summary=dict(status='PASS',toolchain=TOOLCHAIN,compilerCommit=COMPILER_COMMIT,compiler=compiler,sourceFiles=before,inputsUnchangedDuringReplay=True,originalEvidenceSha256=d['sha256'],inputSha256=sha(input_raw),resultSha256=sha(output.read_bytes()),prototypeSha256=sha(code.encode()),sourceGeneratorSha256=sha(Path(__file__).read_bytes()),ownControlSourceGraphSha256=sha(json.dumps(own['source'],sort_keys=True,separators=(',',':')).encode()),deepDependentSourceGraphSha256=sha(json.dumps(deep['source'],sort_keys=True,separators=(',',':')).encode()),frozenRuntimeSha256=sha(runtime.encode()),cases=len(rows),observations=12,nativeRejections=5,resources=resources,originalMathematicalModulesImported=False,sourceModuleBytesVerified=False,queryAlgorithmFormallyVerified=False,scope='Finite core-only native observation experiment; no browser integration, arbitrary-corpus construction coverage or formally verified consumer.')
 if args.compare:
  stored=compiled()
  assert stored['inputJson'].encode()==input_raw and stored['nativeJson'].encode()==output.read_bytes(),'Fresh native data differ from frozen evidence'
  assert stored['producer']['sourceFiles']==before,'Producer source inventory differs'
  summary['freshNativeMatchesCompiledArtifact']=True
 (folder/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
if __name__=='__main__':main()
