"""Project checked own-control term data. Original research scripts/logs stay private."""
from pathlib import Path
import argparse,collections,gzip,hashlib,json,subprocess
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser();parser.add_argument('--evidence-root',type=Path,required=True);parser.add_argument('--lean',required=True);args=parser.parse_args();base=args.evidence_root.resolve()
sha=lambda b:hashlib.sha256(b).hexdigest()
read=lambda p:json.loads(p.read_text())
raw=lambda o:json.dumps(o,ensure_ascii=False,separators=(',',':')).encode()
compiler=subprocess.check_output([args.lean,'--version'],text=True).strip();assert 'version 4.33.1,' in compiler
old=json.loads((ROOT/'public/data/proof-atlas/context-types-manifest.js').read_text().split('=',1)[1].rstrip(';\n'))
old_records={r['name']:r for r in old['edition']['declarations']}
for name in ['proof-atlas-context-module-reconstruction.json','proof-atlas-extra-context-module-checks.json']:
 assert read(base/name)['status']=='PASS'
target=ROOT/'public/data/proof-atlas/context-modules';target.mkdir(parents=True,exist_ok=True)
def save(value,sub=''):
 b=raw(value);assert b'/Users/' not in b and b'/tmp/' not in b
 assert len(b)<=8*1024**2
 digest=sha(b);file=target/sub/(digest+'.json.gz');file.parent.mkdir(exist_ok=True);file.write_bytes(gzip.compress(b,mtime=0));return '/'+file.relative_to(ROOT).as_posix(),digest,len(b)
extra=read(base/'extra-context-native/records.json');new_records={}
for r in extra:
 packet=read(base/'extra-context-native/packets'/r['file']);assert sha((base/'extra-context-native/packets'/r['file']).read_bytes())==r['indexSha256']
 decl=dict(packet['declaration']);decl.pop('sourceRange',None);decl.update(sourceSha256=r['sourceSha256'],proofOccurrences=str(sum(int(packet['expanded'][i])for i in packet['roots'][1:])),articleAnchor=None,references=sorted({p['name']for k,p in zip(packet['kind'],packet['payloads'])if k==4}))
 packet['declaration']=decl;file,digest,size=save(packet,'controls')
 new_records[r['name']]={**decl,'file':file,'indexFile':file,'sha256':digest,'indexSha256':digest,'origin':{'kind':'assistant-authored-synthetic-controls','scope':'Three own proof controls for dependent context modules; not an AI theorem-solving benchmark.'}}
records={**old_records,**new_records};descriptors=[];total=collections.Counter()
for mode,folder,resultfile,outputfile in [('original',base/'reduced-source-context-native',base/'proof-atlas-reduced-context-native-experiment.json','observations.ndjson'),('extra',base/'extra-context-native',base/'extra-context-native/result.json','reduced-observations.ndjson')]:
 result=read(resultfile);assert result['status']=='PASS';output=(folder/outputfile).read_bytes();assert sha(output)==result['nativeOutputSha256'];rows=[json.loads(line)for line in output.splitlines()];by_name=collections.defaultdict(list)
 for row in rows:
  e=row['entry'];assert e['status']=='checked'
  if e['state'].get('expectReducedFailure'):continue
  by_name[row['source']['name']].append(row)
 module='AtlasClosure.Controls'if mode=='original'else 'AtlasClosureExtra.Controls'
 modulefile=folder/('AtlasClosure/Controls.olean'if mode=='original'else 'AtlasClosureExtra/Controls.olean');sourcefile=modulefile.with_suffix('.lean');modulehash=sha(modulefile.read_bytes());sourcehash=sha(sourcefile.read_bytes())
 for name,items in sorted(by_name.items()):
  r=records[name];source=items[0]['source'];assert source['sourceSha256']==sourcehash==r['sourceSha256'];assert all(x['source']==source for x in items)
  entries=[];modules=0;instantiations=0
  for row in items:
   e=row['entry'];e['state']={k:v for k,v in e['state'].items()if k not in ['requiredSlots','expectReducedFailure']};use=e['reducedContext'];assert use['status']=='checked'
   for k in ['closedTermTyping','closedTypeTyping','closedExpectedConversion','appliedClosureTyping','instantiatedTermConversion','sourceTypeRoundtrip']:assert use[k]=='PASS'
   if use['module']['status']=='first-checked-module':modules+=1
   else:
    assert use['module']['status']=='checked-instantiation'and use['module']['kernelInstantiationTyping']==use['module']['kernelInstantiationConversion']=='PASS';instantiations+=1
   entries.append(e)
  edition='closed-context-controls'if mode=='original'else 'context-module-controls'
  projected={'edition':edition,'name':name,'indexSha256':r['indexSha256'],'sourceSha256':r['sourceSha256']}
  pkg={'format':'ProofAtlasContextModulePackage/1','source':projected,'nativePacketSha256':source['indexSha256'],'nativeDagMatchesPacket':True,'kernelDeclarationTyping':'PASS','leanVersion':'4.33.1','producerSha256':result['producerSha256'],'requestSha256':result['requestSha256'],'nativeOutputSha256':result['nativeOutputSha256'],'environment':{'compiler':compiler,'module':module,'compiledModuleSha256':modulehash,'sourceSha256':sourcehash},'entries':entries}
  file,digest,size=save(pkg);descriptors.append({**projected,'file':file,'sha256':digest,'decodedBytes':size,'checked':len(entries),'modules':modules,'instantiations':instantiations,'producerSha256':pkg['producerSha256'],'requestSha256':pkg['requestSha256'],'nativeOutputSha256':pkg['nativeOutputSha256'],'compiledModuleSha256':modulehash,'nativePacketSha256':pkg['nativePacketSha256'],'routes':[e['state']['route']for e in entries]});total.update(checked=len(entries),modules=modules,instantiations=instantiations)
assert total=={'checked':594,'modules':313,'instantiations':281}
edition={'id':'context-module-controls','label':'Dependent proof module controls','modulePrefix':'AtlasClosureExtra.','modules':{'Controls':{'declarations':3}},'counts':{'modules':1,'declarations':3,'theorems':0,'bodies':3,'uniqueNodes':sum(r['uniqueNodes']for r in new_records.values()),'occurrences':str(sum(int(r['occurrences'])for r in new_records.values()))},'declarations':list(new_records.values())}
inventory={'format':'ProofAtlasContextModuleInventory/1','coverage':'594 exact own synthetic observations only; no AI module typing, new descendant typing, cross-declaration reuse or universe renaming. Original source occurrences and actual arguments remain separate.','edition':edition,'records':descriptors,'totals':dict(total)}
(ROOT/'public/data/proof-atlas/context-modules-manifest.js').write_text('window.PROOF_ATLAS_CONTEXT_MODULES='+raw(inventory).decode()+';\n');print(json.dumps({'status':'PROJECTED_COMPILED_CONTROLS','packages':len(descriptors),'newSourcePackets':len(new_records),'totals':dict(total)}))
