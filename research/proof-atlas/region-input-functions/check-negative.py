"""Native malformed-input refusals, separate from well-formed typing failures."""
import argparse,copy,gzip,hashlib,json,os,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent
RESEARCH=BASE.parent
ROOT=RESEARCH.parents[1]
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile

def sha(b):return hashlib.sha256(b).hexdigest()
def main():
    p=argparse.ArgumentParser(description=__doc__)
    for key in ['lean','build','plan','workdir']:p.add_argument('--'+key,type=Path,required=True)
    a=p.parse_args();lean,build,planDir,folder=(getattr(a,k).resolve() for k in ['lean','build','plan','workdir'])
    folder.mkdir(exist_ok=False);(folder/'scratch').mkdir()
    original=json.loads((planDir/'request-2.json').read_bytes())
    internal=next((i,j) for i,c in enumerate(original['records']) for j,v in enumerate(c['ports']) if v['knownProducer'] in original['members'])
    hop=next((i,j) for i,c in enumerate(original['records']) for j,v in enumerate(c['ports']) if v['hops'])
    variants=[]
    def add(name,change,error):
        d=copy.deepcopy(original);change(d);variants.append((name,d,error))
    add('wrong-input-row',lambda d:d['records'][0]['ports'][0]['input'].__setitem__('node',999999),'Source anchor row')
    add('omitted-internal-use',lambda d:d['records'][internal[0]]['ports'][internal[1]].__setitem__('knownProducer',None),'Omitted internal source use')
    add('wrong-let-annotation',lambda d:d['records'][hop[0]]['ports'][hop[1]]['hops'][0].__setitem__('nondep',not original['records'][hop[0]]['ports'][hop[1]]['hops'][0]['nondep']),'Exact original binding owner')
    add('foreign-common-context',lambda d:d['commonContext'][0].__setitem__('slots',[0]),'Common original context directory')
    add('duplicate-order',lambda d:d['order'].__setitem__(1,d['order'][0]),'Region bound/order')
    add('duplicate-member',lambda d:d['records'][1].__setitem__('index',d['records'][0]['index']),'Exact region member/order set')
    add('consumer-before-producer',lambda d:d['order'].reverse(),'Producer is not earlier in topological order')
    add('foreign-declaration-label',lambda d:d['source'].__setitem__('name','Foreign.declaration'),'Original declaration identity mismatch')
    add('source-needs-extra-lambda',lambda d:d.__setitem__('commonContext',d['commonContext'][:-1]),None)
    executable=build/'checker';buildRaw=(build/'build.json').read_bytes();buildReport=json.loads(buildRaw)
    assert sha(executable.read_bytes())==buildReport['executableSha256']
    profile=sandbox_profile(lean,folder,[build,planDir]).replace('(literal '+json.dumps(str(lean))+')','(literal '+json.dumps(str(executable))+')',1)
    env={'PATH':str(lean.parent)+':/usr/bin:/bin','TMPDIR':str(folder/'scratch'),'LEAN_PATH':str(build),'LANG':'en_US.UTF-8'}
    checks=[]
    for name,request,error in variants:
        file=folder/(name+'.json');file.write_text(json.dumps(request)+'\n');output=folder/(name+'-out.json')
        try:
            run_checked(['/usr/bin/sandbox-exec','-p',profile,str(executable),str(lean.parents[1]),str(file),str(output)],folder,name,env,30,120)
        except RuntimeError:
            assert error is not None
        resources=json.loads((folder/(name+'.resources.json')).read_bytes())
        assert resources['stopReason'] is None
        if error:
            assert resources['exitCode']==1 and error in (folder/(name+'.log')).read_text()
            verdict='ORDINARY_INPUT_REFUSAL'
        else:
            assert resources['exitCode']==0
            result=json.loads(output.read_bytes());assert all(c['status']=='UNSUPPORTED_SCOPE' for c in result['cases'])
            verdict='UNSUPPORTED_SCOPE_NOT_KERNEL_REJECTION'
        checks.append({'name':name,'verdict':verdict,'expectedError':error,'resources':resources})
    report={'format':'ProofAtlasRegionInputFunctionRefusals/1','status':'PASS','checks':checks,
        'checkerSha256':sha(Path(__file__).read_bytes()),'nativeSourceSha256':sha((BASE/'Native.lean').read_bytes()),
        'executableSha256':sha(executable.read_bytes()),'scope':'Eight ordinary malformed-input refusals and one well-formed scope-limited probe. Separate from the two well-formed kernel non-conversion cases.'}
    (BASE/'refusals.json.gz').write_bytes(gzip.compress((json.dumps(report,indent=2)+'\n').encode(),mtime=0))
    print(json.dumps({'status':'PASS','ordinaryRefusals':8,'unsupportedScopeProbes':1}))
if __name__=='__main__':main()
