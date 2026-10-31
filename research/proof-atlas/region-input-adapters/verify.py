"""Check every preceding region with explicit adapters at incompatible inputs."""
import argparse, gzip, hashlib, importlib.util, json, os, shutil, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def write(p,d):p.write_text(json.dumps(d,indent=2)+'\n')

def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ['lean','build','plan','runtime','support','workdir']:p.add_argument('--'+key,type=Path,required=True)
    p.add_argument('--publish',action='store_true')
    a=p.parse_args();lean,build,planDir,runtime,support,folder=(getattr(a,k).resolve() for k in ['lean','build','plan','runtime','support','workdir'])
    folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
    assert shutil.disk_usage(folder).free>=30*1024**3
    spec=importlib.util.spec_from_file_location('region_input_build',BASE/'build.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    buildReport=json.loads((build/'build.json').read_bytes())
    assert buildReport['status']=='PASS' and buildReport['runtimeSha256']==sha(module.runtime().encode())
    assert buildReport['executableSha256']==sha((build/'checker').read_bytes())
    assert buildReport['leanExecutableSha256']==sha(lean.read_bytes())
    recoveryRaw=(runtime/'recovery.json').read_bytes();recovery=json.loads(recoveryRaw)
    assert recovery['status']=='PASS' and recovery['executableIrRestored'] is False and len(recovery['files'])==26070
    privateRaw=(support/'private-modules.json').read_bytes();private=json.loads(privateRaw)
    def binaries():
        for name,digest in buildReport['libraries'].items():
            assert sha((lean.parents[1]/'lib/lean'/name).read_bytes())==digest
        for row in recovery['files']:
            file=runtime/'artifacts'/row['file'];assert file.stat().st_size==row['bytes'] and sha(file.read_bytes())==row['sha256']
        for name,digest in private['modules'].items():assert sha((support/'SE2Conjugate'/name).read_bytes())==digest
    binaries()
    planRaw=(planDir/'plan.json').read_bytes();plan=json.loads(planRaw)
    assert plan['format']=='ProofAtlasRegionInputAdapterPlan/1' and len(plan['profiles'])==10
    sourceFiles=[BASE/'prepare.cjs',BASE/'Native.lean',BASE/'build.py',Path(__file__),RESEARCH/'region-native-types/KernelQueries.lean',RESEARCH/'region-native-types/recover.py',RESEARCH/'packet-typing/verify.py',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'build_recursion_examples.py',RESEARCH/'evaluate_goedel.py']
    fingerprints={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in sourceFiles}
    paths=[Path(v) for v in (runtime/'lean-env-path.txt').read_text().strip().split(os.pathsep)]
    env={'PATH':str(lean.parent)+':/usr/bin:/bin','TMPDIR':str(folder/'scratch'),'LEAN_PATH':os.pathsep.join(map(str,[build,*paths,support])),'LANG':'en_US.UTF-8'}
    executable=build/'checker';profile=sandbox_profile(lean,folder,[build,planDir,runtime,support,*paths]).replace('(literal '+json.dumps(str(lean))+')','(literal '+json.dumps(str(executable))+')',1)
    profiles=[];resources=[]
    for i,entry in enumerate(plan['profiles']):
        assert sha(Path(entry['requestFile']).read_bytes())==entry['requestSha256']
        raw=Path(entry['packetFile']).read_bytes();assert sha(raw)==entry['source']['indexSha256']
        original=ROOT/entry['record']['indexFile'].lstrip('/');assert gzip.decompress(original.read_bytes())==raw
        output=folder/('native-'+str(i)+'.json')
        resource=run_checked(['/usr/bin/sandbox-exec','-p',profile,str(executable),str(lean.parents[1]),entry['requestFile'],str(output)],folder,'native-'+str(i),env,30,120)
        resultRaw=output.read_bytes();assert len(resultRaw)<=64*1024**2
        result=json.loads(resultRaw);assert result['source']==entry['source'] and result['closedOriginalTyping']=='PASS'
        assert [c['policy'] for c in result['cases']]==entry['policies']
        for c in result['cases']:
            assert c['adapterRule']=='explicit-function/1'
            assert c['status'] in ['PASS','KERNEL_REJECTED','UNSUPPORTED_SCOPE','UNSUPPORTED_TYPE_FORM']
            if c['status']=='PASS':
                assert all(c[k]=='PASS' for k in ['kernelClosedTyping','kernelSpecialization','kernelEqualityWitness'])
                assert c['originalResultPortals']==len(entry['members'])
                assert len(c['graph']['kind'])<=131072
            elif c['status']=='KERNEL_REJECTED':
                assert c['kernelInputTypeNonconversion']=='PASS'
        profiles.append({k:v for k,v in entry.items() if k not in ['packetFile','requestFile','requestSha256']}|{'native':result})
        resources.append(resource)
        write(folder/'progress.json',{'completed':i+1,'total':10})
        print(json.dumps({'source':entry['source']['name'],'cases':[{k:c[k] for k in ['policy','status','phase','call','slot','independentInputs','boundaryInputs','adapterInputs','keptContextSlots'] if k in c} for c in result['cases']]}),flush=True)
    binaries()
    for file,digest in plan['parents'].items(): assert sha(gzip.decompress((ROOT/file).read_bytes()))==digest
    assert fingerprints=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in sourceFiles}
    assert planRaw==(planDir/'plan.json').read_bytes() and buildReport['runtimeSha256']==sha(module.runtime().encode())
    data={'format':'ProofAtlasRegionInputAdapters/1','profiles':profiles}
    raw=(json.dumps(data,separators=(',',':'),ensure_ascii=False)+'\n').encode()
    report={'format':'ProofAtlasRegionInputAdapterVerification/1','status':'PASS','profiles':10,'candidates':30,
        'passed':sum(c['status']=='PASS' for p in profiles for c in p['native']['cases']),
        'kernelRejected':sum(c['status']=='KERNEL_REJECTED' for p in profiles for c in p['native']['cases']),
        'unsupported':sum(c['status'].startswith('UNSUPPORTED') for p in profiles for c in p['native']['cases']),
        'adapterInputs':sum(c.get('adapterInputs',0) for p in profiles for c in p['native']['cases']),
        'parents':plan['parents'],
        'producerFiles':fingerprints,'nativeSha256':sha(raw),'build':buildReport,'resources':resources,
        'kernelRecoverySha256':sha(recoveryRaw),'kernelCacheAttribution':recovery['attribution'],
        'allKernelDataHashesVerified':True,'privateSupportManifestSha256':sha(privateRaw),
        'originalPrivateSourcesRead':False,'originalPrivateSourcesPublished':False,'independentDependencyRebuild':False,
        'scope':'Thirty predetermined region/policy candidates, including all three earlier strict conversion failures. Additional adapter functions are conditional inputs; identity specialization must recover every original source result. Not existence of arbitrary adapters, unrestricted graph regions, general preservation or comprehension evidence.'}
    if a.publish:
        (BASE/'native.json.gz').write_bytes(gzip.compress(raw,mtime=0))
        (BASE/'verification.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(),mtime=0))
    write(folder/'verification.json',report)
    print(json.dumps({k:report[k] for k in ['status','candidates','passed','kernelRejected','unsupported','adapterInputs']}))
if __name__=='__main__':main()
