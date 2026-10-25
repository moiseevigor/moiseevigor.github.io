"""Fresh public-packet method checks with original proof modules absent."""
import argparse, hashlib, importlib.util, json, os, subprocess, sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def write(p,value):p.write_text(json.dumps(value,separators=(',',':'))+'\n')
def module(name,file):
    spec=importlib.util.spec_from_file_location(name,file)
    value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean',type=Path,required=True)
    parser.add_argument('--cache',type=Path,required=True)
    parser.add_argument('--workdir',type=Path,required=True)
    args=parser.parse_args();folder=args.workdir.resolve();folder.mkdir(parents=True,exist_ok=False)
    lean=args.lean.resolve();compiler=subprocess.check_output([str(lean),'--version'],text=True).strip()
    assert 'version 4.33.1,' in compiler
    paths,recovery=module('recovered_method_cache',RESEARCH/'use-sites/verify.py').recovered(args.cache.resolve())
    subprocess.check_call(['node',str(BASE/'prepare.cjs'),str(folder)],cwd=ROOT)
    plan_bytes=(folder/'plan.json').read_bytes();plan=json.loads(plan_bytes)
    runtime=module('public_method_runtime',RESEARCH/'packet-typing/verify.py').runtime()
    runtime+='\n'+(RESEARCH/'branch-interfaces/BranchInterfaces.lean').read_text()+'\n'+(BASE/'MethodReplay.lean').read_text()
    producer=[BASE/'verify.py',BASE/'prepare.cjs',BASE/'MethodReplay.lean',RESEARCH/'branch-interfaces/BranchInterfaces.lean',
        RESEARCH/'ExportLibrary.lean',RESEARCH/'ExportOccurrenceTypes.lean',RESEARCH/'LevelTransportControls.lean',
        RESEARCH/'compiled-replay/Replay.lean',RESEARCH/'packet-typing/PacketTyping.lean',RESEARCH/'packet-typing/verify.py']
    producer_hashes={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
    (folder/'scratch').mkdir()
    env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),
        'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')}
    profiles=[];checked=unavailable=methods=0
    for item in plan['rows']:
        record,source=item['record'],item['source'];target=folder/record['name']
        assert sha((target/'packet.json').read_bytes())==record['indexSha256']
        routes=[q['route'] for q in item['queries']]
        write(target/'request.json',{'packetFile':str(target/'packet.json'),'name':record['name'],'module':record['module'],
              'source':source,'routes':routes})
        write(target/'proof-request.json',[{'file':str(target/'packet.json'),**{k:record[k] for k in ['name','module','indexSha256','axioms']}}])
        commands='\n#atlas_packet_replay '+json.dumps(str(target/'proof-request.json'))+' => '+json.dumps(str(target/'proof.ndjson'))
        commands+='\n#atlas_method_replay '+json.dumps(str(target/'request.json'))+' => '+json.dumps(str(target/'native.json'))+'\n'
        entry=target/'Runtime.lean';entry.write_text(runtime+commands)
        run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],target,'native',env,timeout=120)
        proof_bytes=(target/'proof.ndjson').read_bytes();proofs=[json.loads(line) for line in proof_bytes.splitlines()];assert len(proofs)==1
        proof=proofs[0];assert proof['name']==record['name'] and proof['indexSha256']==record['indexSha256']
        assert proof['storedNodes']==record['uniqueNodes'] and set(proof['axioms'])==set(record['axioms']) and 'sorryAx' not in proof['axioms']
        for k in ['kernelExpectedType','kernelProof','kernelExpectedTypeIsProposition','kernelExpectedTypeConversion']:assert proof[k]=='PASS'
        for k in ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','wrongProofRejectedByKernel','illTypedBinderRejectedByKernel']:assert proof[k] is True
        native_bytes=(target/'native.json').read_bytes();native=json.loads(native_bytes)
        assert native['source']==source and native['nativeDagMatchesPacket'] is True and native['nativeDeclarationModule'] is None
        for k in ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','privateRiccatiModulesAbsent']:assert native[k] is True
        assert native['kernelDeclarationTyping']=='PASS'
        assert [q['route'] for q in native['outcomes']]==routes
        outcomes={json.dumps(q['route'],sort_keys=True):q for q in native['outcomes']}
        for query in item['queries']:
            if query['previousStatus']=='checked':assert outcomes[json.dumps(query['route'],sort_keys=True)]['status']=='checked','Previously checked call became unavailable'
        checked+=sum(q['status']=='checked' for q in native['outcomes'])
        unavailable+=sum(q['status']=='unavailable' for q in native['outcomes'])
        methods+=sum(len(q['branches']) for q in native['entries'])
        row={'status':'PASS','source':source,'compiler':compiler,'nativeOutputSha256':sha(native_bytes),
            'runtimeSha256':sha(entry.read_bytes()),'queryInventorySha256':sha(json.dumps(routes,separators=(',',':')).encode()),
            'baselineProofSha256':sha(proof_bytes),'baselineProof':proof,'queries':len(routes),
            'checked':sum(q['status']=='checked' for q in native['outcomes']),'unavailable':sum(q['status']=='unavailable' for q in native['outcomes']),
            'methodInterfaces':sum(len(q['branches']) for q in native['entries']),
            'originalTheoremAbsent':True,'originalModuleAbsent':True,'privateRiccatiModulesAbsent':True}
        write(target/'verification.json',row);profiles.append(row)
        print(json.dumps({k:row[k] for k in ['source','queries','checked','unavailable','methodInterfaces']}),flush=True)
    assert sha((folder/'plan.json').read_bytes())==sha(plan_bytes)
    assert producer_hashes=={str(f.relative_to(ROOT)):sha(f.read_bytes()) for f in producer}
    report={'status':'PASS','format':'ProofAtlasPublicMethodNativeVerification/1','compiler':compiler,
       'dependencyRecovery':recovery,'producerFiles':producer_hashes,'planSha256':sha(plan_bytes),
       'inspectedProfiles':plan['inspectedProfiles'],'replayedProfiles':len(profiles),
       'queries':checked+unavailable,'checked':checked,'unavailable':unavailable,'methodInterfaces':methods,
       'profiles':profiles,'originalProofSourcesRead':False,'originalProofModulesImported':False,
       'privateRiccatiModulesImported':False,'scope':'Fresh closed public-packet proofs and contextual method interfaces. Recorded finite candidates only; no original source compilation or independent Git/rebuild verification.'}
    write(folder/'verification.json',report)
    print(json.dumps({k:report[k] for k in ['status','replayedProfiles','queries','checked','unavailable','methodInterfaces']}),flush=True)

if __name__=='__main__':main()
