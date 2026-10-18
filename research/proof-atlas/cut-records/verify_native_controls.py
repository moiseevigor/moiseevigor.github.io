"""Native-only rejection controls for lexical and structural cut fields.

Positive source packets are independently hash checked. Altered records bypass
Python validation so a rejection must come from the native component itself.
"""
import argparse,copy,gzip,importlib.util,json,os,sys
from pathlib import Path
from verify_native import BASE,ROOT,runtime_source,sha,source_files,run_checked,sandbox_profile

def variants(request):
 records=request['records'];base=next(r for r in records if r['external'] and any(e.get('binding',{}).get('target') for e in r['entries']))
 variable=next(i for i,e in enumerate(base['entries'])if e.get('binding',{}).get('target'));nonvariable=next(i for i,e in enumerate(base['entries'])if e['tag']=='node' and 'binding'not in e)
 rows=[]
 def add(name,change):
  value=copy.deepcopy(base);change(value);rows.append({'name':name,'record':value})
 add('source-debruijn-index',lambda r:r['entries'][variable]['binding'].update(index=999999))
 add('source-debruijn-bool',lambda r:r['entries'][variable]['binding'].update(index=True))
 add('missing-bound-target',lambda r:r['entries'][variable]['binding'].update(target=None))
 add('internal-target-index',lambda r:r['entries'][variable]['binding'].update(target={'entry':999999}))
 add('external-target-index',lambda r:r['entries'][variable]['binding'].update(target={'external':999999}))
 add('ambiguous-target-namespace',lambda r:r['entries'][variable]['binding'].update(target={'entry':0,'external':0}))
 add('empty-target-reference',lambda r:r['entries'][variable]['binding'].update(target={}))
 add('target-reference-bool',lambda r:r['entries'][variable]['binding'].update(target={'external':True}))
 add('external-node',lambda r:r['external'][0].update(node=999999))
 add('external-kind',lambda r:r['external'][0].update(kind='app'))
 add('external-route',lambda r:r['external'][0]['route'].update(slots=[2]*3))
 add('external-table-missing',lambda r:r['external'].pop())
 add('external-table-extra',lambda r:r['external'].append(copy.deepcopy(r['external'][0])))
 add('bound-statistics',lambda r:r['stats'].update(boundVariables=999999))
 add('variable-statistics',lambda r:r['stats'].update(variables=999999))
 add('binding-on-other-constructor',lambda r:r['entries'][nonvariable].update(binding={'index':0,'target':None}))
 add('retained-statistics',lambda r:r['stats'].update(retained='0'))
 add('entry-source-node',lambda r:r['entries'][0].update(node=999999))
 add('entry-source-route',lambda r:r['entries'][0].update(slots=[2]))
 add('entry-source-constructor',lambda r:r['entries'][0].update(constructor='other'))
 add('entry-child-arity',lambda r:r['entries'][0].update(children=[]))
 # Every controlled packet has a valid internal body binder and an outside header binder.
 # Both references name genuine binders; swapping them tests lexical scope, not bounds.
 shared=[i for i,e in enumerate(base['entries'])if e.get('binding',{}).get('target')]
 if len(shared)>=2:
  a,b=next((a,b)for a in shared for b in shared if base['entries'][a]['binding']['target']!=base['entries'][b]['binding']['target'])
  add('wrong-existing-binder',lambda r:r['entries'][a]['binding'].update(target=copy.deepcopy(base['entries'][b]['binding']['target'])))
 return base,rows

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);p.add_argument('--requests',type=Path,nargs='+',required=True);p.add_argument('--reserve-gib',type=int,default=30);a=p.parse_args();assert 1<=len(a.requests)<=64 and a.reserve_gib>=1
 folder=a.workdir.resolve();folder.mkdir(parents=True,exist_ok=False);(folder/'scratch').mkdir();lean=a.lean.resolve();env={'PATH':str(lean.parent)+os.pathsep+os.defpath,'LEAN_PATH':str(folder),'TMPDIR':str(folder/'scratch'),'LANG':'en_US.UTF-8'}
 spec=importlib.util.spec_from_file_location('source_cut_independent',BASE/'check.py');checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
 files=source_files()+[BASE/'NativeRejects.lean',Path(__file__)];hashes={str(f.relative_to(ROOT)):sha(f.read_bytes())for f in files};runtime=runtime_source()+'\n'+(BASE/'NativeRejects.lean').read_text();rows=[]
 for index,file in enumerate(a.requests):
  checker.run(file);request=json.loads(file.read_text());base,controls=variants(request);work=folder/str(index);work.mkdir()
  with gzip.open(request['packetFile'],'rb')as f:raw=f.read(64*1024**2+1)
  assert len(raw)<=64*1024**2 and sha(raw)==request['expected']['indexSha256'];packet=work/'source.json';packet.write_bytes(raw);input_file=work/'request.json';input_file.write_text(json.dumps({'packetFile':str(packet),'positive':base,'controls':controls}));output=work/'negative.json';entry=work/'Native.lean';entry.write_text(runtime+'\n#atlas_source_cut_rejects '+json.dumps(str(input_file))+' => '+json.dumps(str(output))+'\n')
  cmd=[str(lean),str(entry)]
  if sys.platform=='darwin':cmd=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*cmd]
  resources=run_checked(cmd,folder,'native-'+str(index),env,a.reserve_gib,120);assert 'sorryAx'not in (folder/('native-'+str(index)+'.log')).read_text();native=json.loads(output.read_text());assert native['status']=='PASS' and len(native['rejected'])==len(controls)
  rows.append({'source':request['expected'],'native':native,'resources':resources});assert hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes())for f in files}
 result={'status':'PASS','packets':len(rows),'nativeRejections':sum(len(r['native']['rejected'])for r in rows),'sourceFiles':hashes,'rows':rows,'scope':'Native structural/lexical rejection controls, with valid positives checked first. Ownership, complete schema and source identities remain separately checked by Python; no mathematical proof typing claim.'};(folder/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k not in ['rows','sourceFiles']}))
if __name__=='__main__':main()
