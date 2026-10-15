"""Build self-contained compiled controls under fixed resource bounds.

Original private projects are not read. Raw compiler output and resource records
remain in the private work directory. Public output contains compiled packets,
native judgments and generation provenance only.
"""
import argparse, collections, gzip, hashlib, json, os, resource, shutil, subprocess, time
from pathlib import Path
from recursion_fixture_source import SOURCE
ROOT=Path(__file__).resolve().parents[2]
BASE=Path(__file__).parent
KINDS=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj']
def sha(b):return hashlib.sha256(b).hexdigest()
def run_checked(cmd,folder,label,env=None,reserve=30,timeout=120):
    log=folder/(label+'.log');start=time.monotonic();peak=0;reason=None
    def limits():resource.setrlimit(resource.RLIMIT_FSIZE,(64*1024**2,64*1024**2))
    with log.open('w') as out:
        p=subprocess.Popen(cmd,cwd=folder,env=env,stdout=out,stderr=subprocess.STDOUT,preexec_fn=limits)
        try:
            while p.poll() is None:
                q=subprocess.run(['ps','-o','rss=','-p',str(p.pid)],capture_output=True,text=True)
                if q.returncode and p.poll() is None:reason='Memory monitor unavailable';break
                rss=int(q.stdout.strip()or 0)*1024;peak=max(peak,rss)
                if rss>8*1024**3:reason='8 GiB memory bound'
                elif shutil.disk_usage(folder).free<reserve*1024**3:reason='Free-space reserve'
                elif time.monotonic()-start>timeout:reason='Time bound'
                if reason:break
                time.sleep(.2)
        finally:
            if p.poll() is None:
                p.terminate()
                try:p.wait(timeout=15)
                except subprocess.TimeoutExpired:p.kill();p.wait(timeout=5)
    result={'exitCode':p.returncode,'stopReason':reason,'maxRssBytes':peak,'seconds':round(time.monotonic()-start,2)}
    (folder/(label+'.resources.json')).write_text(json.dumps(result,indent=2)+'\n')
    if reason or p.returncode:raise RuntimeError(label+' failed; inspect '+str(log))
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--lean',default='lean');parser.add_argument('--workdir',type=Path,required=True);parser.add_argument('--reserve-gib',type=int,default=30)
    args=parser.parse_args();assert args.reserve_gib>=1,'Positive free-space reserve required';folder=args.workdir.resolve();folder.mkdir(parents=True,exist_ok=False)
    compiler=subprocess.check_output([args.lean,'--version'],text=True).strip();assert 'version 4.33.1,'in compiler
    source=folder/'ProofAtlasExamples/Recursion.lean';source.parent.mkdir();source.write_text(SOURCE)
    source_hash=sha(source.read_bytes());assert source_hash==sha(SOURCE.encode())
    env=dict(os.environ,LEAN_PATH=str(folder));module=source.with_suffix('.olean')
    compile_result=run_checked([args.lean,'-o',str(module),str(source)],folder,'compile',reserve=args.reserve_gib)
    module_hash=sha(module.read_bytes())
    exporter=(BASE/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ProofAtlasExamples.Recursion').replace('startsWith "SE2Conjugate."','startsWith "ProofAtlasExamples."')
    exporter+='\nset_option pp.maxSteps 2000\n#atlas_library '+json.dumps(str(folder/'packets'))+'\n'
    entry=folder/'Export.lean';entry.write_text(exporter)
    export_result=run_checked([args.lean,str(entry)],folder,'export',env,args.reserve_gib)
    inventory=json.loads((folder/'packets/inventory.json').read_text());assert len(inventory)>0
    names={r['name']for r in inventory};public=folder/'projection';public.mkdir();records=[];all_counts=collections.Counter();nodes=0
    for original in inventory:
        data=json.loads((folder/'packets'/original['file']).read_text());decl=dict(data['declaration']);decl.pop('sourceRange',None)
        decl['sourceSha256']=source_hash;decl['proofOccurrences']=str(sum(int(data['expanded'][r]) for r in data['roots'][1:]));decl['articleAnchor']=None
        weights=[0]*len(data['kind'])
        for r in data['roots']:weights[r]+=1
        for i in range(len(weights)-1,-1,-1):
            for c in data['children'][i]:weights[c]+=weights[i]
        deps=collections.Counter();counts=collections.Counter()
        for i,k in enumerate(data['kind']):
            counts[KINDS[k]]+=weights[i]
            if k==4:deps[data['payloads'][i]['name']]+=weights[i]
        decl['references']=sorted(deps);data['declaration']=decl;data['dependencies']=[{'name':n,'count':str(c),'local':n in names}for n,c in sorted(deps.items())]
        raw=json.dumps(data,ensure_ascii=False,separators=(',',':')).encode();filename=sha(decl['name'].encode())[:20]+'.json.gz';compressed=gzip.compress(raw,mtime=0)
        (public/filename).write_bytes(compressed)
        record={**decl,'file':'/public/data/proof-atlas/recursion-examples/'+filename,'indexFile':'/public/data/proof-atlas/recursion-examples/'+filename,'sha256':sha(raw),'indexSha256':sha(raw),'gzipSha256':sha(compressed)}
        records.append(record);all_counts.update(counts);nodes+=len(data['kind'])
    edition={'id':'recursion-controls','label':'Controlled recursion examples','modulePrefix':'ProofAtlasExamples.','modules':{'Recursion':{'declarations':len(records)}},'counts':{'modules':1,'declarations':len(records),'theorems':sum(r['kind']=='theorem'for r in records),'bodies':sum(r['bodyAvailable']for r in records),'uniqueNodes':nodes,'constructors':{k:str(v)for k,v in all_counts.items()},'occurrences':str(sum(all_counts.values()))},'declarations':records}
    provenance={'kind':'assistant-authored-synthetic-controls','module':'ProofAtlasExamples.Recursion','sourceSha256':source_hash,'fixtureGeneratorSha256':sha((BASE/'recursion_fixture_source.py').read_bytes()),'compiler':compiler,'scope':'Small assistant-authored formal controls plus deterministic shared-expression amplification. Not an AI theorem-solving benchmark, independently sourced corpus or comprehension study.'}
    (folder/'edition.json').write_text(json.dumps(edition,ensure_ascii=False,separators=(',',':')))
    (folder/'provenance.json').write_text(json.dumps(provenance,indent=2)+'\n')
    environment={'kind':'self-contained-lean/1','compiler':compiler,'module':'ProofAtlasExamples.Recursion','sourceSha256':source_hash,'compiledModuleSha256':module_hash,'imports':['Lean'],'dependencyRevisions':{}}
    # The following native command discovers full recursor cores and their actual
    # source-lambda inputs. The packet must match the native declaration first.
    focus=['nat_self','list_copy_eq','fork_holds','fan_holds','sized_copy_eq','ignored_premise','shared_induction_8','shared_induction_24','shared_induction_64']
    inputs=[]
    for r in records:
        if r['name'] not in ['AtlasExamples.'+n for n in focus]:continue
        packet=public/Path(r['file']).name;raw=gzip.decompress(packet.read_bytes());rawfile=folder/(Path(r['file']).stem+'.json');rawfile.write_bytes(raw)
        inputs.append({'packetFile':str(rawfile),'source':{'edition':edition['id'],'name':r['name'],'indexSha256':r['indexSha256'],'sourceSha256':source_hash}})
    (folder/'query-input.json').write_text(json.dumps(inputs,separators=(',',':')))
    prepare=(BASE/'PrepareRecursionQueries.lean').read_text().replace('import ExportOccurrenceTypes','')
    tools=(BASE/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import ProofAtlasExamples.Recursion')+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+(BASE/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')+'\n'+prepare+'\n'+(BASE/'RecursiveInputOracle.lean').read_text()
    tools+='\n#atlas_recursion_queries '+json.dumps(str(folder/'query-input.json'))+' => '+json.dumps(str(folder/'requests.json'))+'\n#atlas_occurrence_types '+json.dumps(str(folder/'requests.json'))+' => '+json.dumps(str(folder/'native.json'))+'\n'
    tools+='\n#atlas_recursive_oracle '+json.dumps(str(folder/'requests.json'))+' => '+json.dumps(str(folder/'oracle.json'))+'\n'
    query=folder/'Queries.lean';query.write_text(tools)
    query_result=run_checked([args.lean,str(query)],folder,'queries',env,args.reserve_gib)
    assert sha(module.read_bytes())==module_hash and sha(source.read_bytes())==source_hash
    native=json.loads((folder/'native.json').read_text())
    for r in native:r['environment']=environment;r['sourceModuleHashVerified']=True
    (folder/'native.json').write_text(json.dumps(native,separators=(',',':'))+'\n')
    result={'status':'EXTRACTED','declarations':len(records),'selectedDeclarations':len(native),'nativeQueries':sum(len(r['entries'])for r in native),'sourceSha256':source_hash,'compile':compile_result,'export':export_result,'queries':query_result}
    (folder/'result.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if __name__=='__main__':main()
