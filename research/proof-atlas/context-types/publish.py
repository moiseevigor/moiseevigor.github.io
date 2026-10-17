"""Project verified compiled context metadata; never publish original AI scripts/logs."""
from pathlib import Path
import argparse,collections,gzip,hashlib,json,shutil
ROOT=Path(__file__).resolve().parents[3]
parser=argparse.ArgumentParser();parser.add_argument('--evidence',type=Path,required=True);args=parser.parse_args();base=args.evidence.resolve()
read=lambda p:json.loads(p.read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
raw=lambda x:json.dumps(x,ensure_ascii=False,separators=(',',':')).encode()
audit=read(base.parent/'proof-atlas-context-closure-verification.json')
assert audit['status']=='LOCAL_CLOSED_CONTEXT_TYPING_TRANSPORT_VERIFIED'and audit['totals']['nativeClosureInstantiationAndTermConversions']==239
for item in audit['artifacts']:
    p=Path(item['path']);assert sha(p.read_bytes())==item['sha256'],p
KINDS=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj']
out=ROOT/'public/data/proof-atlas/context-types';out.mkdir(parents=True,exist_ok=True)
def save(value,sub=''):
    b=raw(value);digest=sha(b);target=out/sub/(digest+'.json.gz');target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(gzip.compress(b,mtime=0));return '/'+str(target.relative_to(ROOT)),digest,len(b)
requests={m:read(base/(m+'-request.json'))for m in ['controls','ai']}
ownNames={q['source']['name']for q in requests['controls']}
records=[];allCounts=collections.Counter();ownNodes=0
for i,q in enumerate(requests['controls']):
    originalBytes=(base/'evidence/native-controls'/('packet-'+str(i)+'.json')).read_bytes();assert sha(originalBytes)==q['source']['indexSha256'];data=json.loads(originalBytes);decl=dict(data['declaration']);decl.pop('sourceRange',None)
    decl['sourceSha256']=q['source']['sourceSha256'];decl['proofOccurrences']=str(sum(int(data['expanded'][r])for r in data['roots'][1:]));decl['articleAnchor']=None
    weights=[0]*len(data['kind'])
    for r in data['roots']:weights[r]+=1
    for node in range(len(weights)-1,-1,-1):
        for child in data['children'][node]:weights[child]+=weights[node]
    deps=collections.Counter();counts=collections.Counter()
    for node,kind in enumerate(data['kind']):
        counts[KINDS[kind]]+=weights[node]
        if kind==4:deps[data['payloads'][node]['name']]+=weights[node]
    decl['references']=sorted(deps);data['declaration']=decl;data['dependencies']=[{'name':n,'count':str(c),'local':n in ownNames}for n,c in sorted(deps.items())]
    file,digest,size=save(data,'controls');record={**decl,'file':file,'indexFile':file,'sha256':digest,'indexSha256':digest,'origin':{'kind':'assistant-authored-synthetic-controls','scope':'Twelve own closed-context typing controls; not a theorem-solving benchmark.'}}
    records.append(record);allCounts.update(counts);ownNodes+=len(data['kind'])
recordMap={r['name']:r for r in records}
# The AI packet is already public and must remain byte-identical.
for q in requests['ai']:
    data=json.loads(Path(q['packetFile']).read_bytes());recordMap[q['source']['name']]=q['record'];assert sha(Path(q['packetFile']).read_bytes())==q['source']['indexSha256']
descriptors=[];checkDescriptors=[]
for mode in ['controls','ai']:
    native=read(base/('native-'+mode+'.json'));source=base/'evidence'/('native-'+mode);nativeBytes=(source/'observations.ndjson').read_bytes();assert sha(nativeBytes)==native['outputSha256'];rows=[json.loads(line)for line in nativeBytes.splitlines()];assert native['unavailable']==0
    independent=read(base/('independent-'+mode+'.json'));indBytes=(base/'evidence'/('independent-'+mode)/'independent.json').read_bytes();assert sha(indBytes)==independent['outputSha256'];indPackages={p['source']['name']:p for p in json.loads(indBytes)}
    for q in requests[mode]:
        record=recordMap[q['source']['name']];entries=[r['entry']for r in rows if r['source']==q['source']];assert len(entries)==len(q['states'])
        module=native['modules'][q['module']];env={'kind':'existing-compiled-context-types/1','compiler':native['compiler'],'module':q['module'],**module,**native['environment']};env['kind']='existing-compiled-context-types/1'
        projectedSource={**q['source'],'indexSha256':record['indexSha256']}
        pkg={'format':'ProofAtlasContextTypePackage/1','source':projectedSource,'nativePacketSha256':q['source']['indexSha256'],'nativeDagMatchesPacket':True,'kernelDeclarationTyping':'PASS','leanVersion':'4.33.1','producerSha256':native['producerSha256'],'requestSha256':native['requestSha256'],'nativeOutputSha256':native['outputSha256'],'environment':env,'entries':entries}
        file,digest,size=save(pkg);classes=len({e['state']['state']for e in entries});conversions=sum(e['selectedTargetTransport']['status']=='kernel-compared-at-selected-target'for e in entries)
        descriptors.append({**projectedSource,'file':file,'sha256':digest,'decodedBytes':size,'checked':len(entries),'classes':classes,'conversions':conversions,'producerSha256':native['producerSha256'],'requestSha256':native['requestSha256'],'nativeOutputSha256':native['outputSha256'],'nativePacketSha256':q['source']['indexSha256'],'compiledModuleSha256':module['compiledModuleSha256'],'environmentSha256':sha(raw(env)),'routes':[e['state']['route']for e in entries]})
        p=indPackages[q['source']['name']];checks={'format':'ProofAtlasContextTypeChecks/1','source':projectedSource,'independentNativeOutputSha256':independent['outputSha256'],'entries':[{'route':e['route'],'typeGraph':e.get('typeGraph',p.get('typeGraph')),'typeRoot':e['typeRoot'],'role':e['role']}for e in p['entries']]};file,digest,size=save(checks,'checks');checkDescriptors.append({**projectedSource,'file':file,'sha256':digest,'decodedBytes':size,'checked':len(checks['entries'])})
setup=read(base/'setup.json')
edition={'id':'closed-context-controls','label':'Closed-context typing controls','modulePrefix':'AtlasClosure.','modules':{'Controls':{'declarations':len(records)}},'counts':{'modules':1,'declarations':len(records),'theorems':sum(r['kind']=='theorem'for r in records),'bodies':sum(r['bodyAvailable']for r in records),'uniqueNodes':ownNodes,'constructors':{k:str(v)for k,v in allCounts.items()},'occurrences':str(sum(allCounts.values()))},'declarations':records}
inventory={'format':'ProofAtlasContextTypeInventory/1','coverage':'Finite native checks for every occurrence in twelve own controls and 149 selected occurrences in one AI-attributed proof. Other matching routes use explicitly derived typing; other context classes remain unsupported.','edition':edition,'provenance':{'kind':'assistant-authored-synthetic-controls','sourceSha256':setup['sourceSha256'],'compiledModuleSha256':setup['compiledModuleSha256'],'source':'/research/proof-atlas/context-types/Controls.lean'},'records':descriptors,'checks':checkDescriptors,'totals':audit['totals']}
(ROOT/'public/data/proof-atlas/context-types-manifest.js').write_text('window.PROOF_ATLAS_CONTEXT_TYPES='+raw(inventory).decode()+';\n')
shutil.copy2(str(base/'Controls.lean'),str(Path(__file__).parent/'Controls.lean'));shutil.copy2(str(base/'Closure.lean'),str(Path(__file__).parent/'ExportClosedContext.lean'))
print(json.dumps({'status':'PUBLISHED_COMPILED_PROJECTION','packages':len(descriptors),'checks':len(checkDescriptors),'controls':len(records),'nativeObservations':sum(d['checked']for d in descriptors),'contextClasses':sum(d['classes']for d in descriptors),'nativeTransportComparisons':sum(d['conversions']for d in descriptors)}))
