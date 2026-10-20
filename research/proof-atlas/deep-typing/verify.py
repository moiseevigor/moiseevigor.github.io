"""Core-only contextual typing at original source positions, with finite controls.

No private source project is imported. Compiler logs and resource observations
remain in the supplied work directory. The output is not a portable certificate.
"""
from pathlib import Path
import argparse
import gzip
import hashlib
import json
import os
import sys

BASE = Path(__file__).resolve().parent
TOOLS = BASE.parent
ROOT = TOOLS.parents[1]
PUBLIC_DEEP = ROOT/'public/data/proof-atlas/large-source-cuts/deep-f93ce9af1c8cae7c9a7bf7e11defb873dfbb8ca19772dd5fb112c5a27b22d32a.json.gz'
sys.path.insert(0,str(TOOLS))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def sources():
    return [BASE/'ContextQuery.lean',BASE/'Controls.lean',Path(__file__).resolve(),BASE/'pack.py',
            TOOLS/'ExportLibrary.lean',TOOLS/'LevelTransportControls.lean',
            TOOLS/'compiled-replay/Replay.lean',TOOLS/'build_recursion_examples.py',
            TOOLS/'evaluate_goedel.py',ROOT/'scripts/test-proof-atlas-deep-typing.cjs',PUBLIC_DEEP]


def runtime():
    exporter = (TOOLS/'ExportLibrary.lean').read_text()
    assert exporter.count('import SE2Conjugate') == 1
    exporter = exporter.replace('import SE2Conjugate','').split('syntax "#atlas_library ')[0]+'\nend AtlasLibrary\n'
    levels = (TOOLS/'LevelTransportControls.lean').read_text().split('def compactGraph')[0]
    levels = levels.replace(' AtlasOccurrenceTypes','')+'\nend AtlasLevelTransport\n'
    decoder = (TOOLS/'compiled-replay/Replay.lean').read_text().split('def checked')[0]+'\nend AtlasPacketReplay\n'
    query = (BASE/'ContextQuery.lean').read_text().replace('import Lean\n','')
    text = '\n'.join([exporter,levels,decoder,query,(BASE/'Controls.lean').read_text()])
    assert all(line.strip()=='import Lean' for line in text.splitlines() if line.strip().startswith('import '))
    return text+'\nset_option maxRecDepth 65536\nset_option maxHeartbeats 10000000\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--lean',type=Path,required=True)
    parser.add_argument('--workdir',type=Path,required=True)
    parser.add_argument('--depth',type=int,default=10000)
    parser.add_argument('--reserve-gib',type=int,default=30)
    parser.add_argument('--compare',action='store_true',help='Compare freshly emitted terms/judgments with the compiled artifact')
    args = parser.parse_args()
    assert 1 <= args.depth <= 20000 and args.reserve_gib >= 1
    folder = args.workdir.resolve()
    folder.mkdir(parents=True,exist_ok=False)
    (folder/'scratch').mkdir()
    lean = args.lean.resolve()
    assert lean.is_file()
    env = dict(PATH=str(lean.parent)+os.pathsep+os.defpath,LEAN_PATH=str(folder),
               TMPDIR=str(folder/'scratch'),LANG='en_US.UTF-8')
    run_checked([str(lean),'--version'],folder,'version',env,args.reserve_gib,120)
    compiler = (folder/'version.log').read_text().strip()
    assert 'version 4.33.1,' in compiler
    hashes = {str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in sources()}
    text = runtime()
    entry = folder/'Controls.lean'
    entry.write_text(text+'#atlas_deep_packets '+str(args.depth)+' => '+json.dumps(str(folder/'result.json'))+'\n')
    command = [str(lean),'-s','65536',str(entry)]
    if sys.platform=='darwin':
        command = ['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*command]
    resources = run_checked(command,folder,'native',env,args.reserve_gib,120)
    raw = (folder/'result.json').read_bytes()
    assert len(raw) <= 64*1024**2
    result = json.loads(raw)
    assert result['status']=='PASS' and result['format']=='ProofAtlasDeepNativeTypingPackets/1'
    assert len(result['cases'])==8 and sum(len(c['queries']) for c in result['cases'])==24
    assert len(result['negativeControls'])==8 and all(n['rejected'] for n in result['negativeControls'])
    # Check the already-public deep source control as an additional native replay.
    # Its original `not-claimed` producer metadata and original bytes stay fixed.
    with gzip.open(PUBLIC_DEEP,'rb') as stream:
        public_raw = stream.read(64*1024**2+1)
    assert len(public_raw) <= 64*1024**2
    public_sha = 'f93ce9af1c8cae7c9a7bf7e11defb873dfbb8ca19772dd5fb112c5a27b22d32a'
    assert sha(public_raw)==public_sha
    public_packet = json.loads(public_raw)
    assert public_packet['declaration']['kernelCheck']=='not-claimed'
    assert len(public_packet['kind'])==10005
    input_file = folder/'public-source.json'
    input_file.write_bytes(public_raw)
    routes = [[],[1],[1]+[1]*10000]
    request_file = folder/'public-queries.json'
    request_file.write_text(json.dumps(routes,separators=(',',':')))
    output_file = folder/'public-replay.json'
    public_entry = folder/'PublicReplay.lean'
    public_entry.write_text(text+'#atlas_context_packet '+json.dumps(str(input_file))+' with '+
        json.dumps(str(request_file))+' => '+json.dumps(str(output_file))+'\n')
    public_command = [str(lean),'-s','65536',str(public_entry)]
    if sys.platform=='darwin':
        public_command = ['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[]),*public_command]
    public_resources = run_checked(public_command,folder,'public-native',env,args.reserve_gib,120)
    replay = json.loads(output_file.read_text())
    assert replay['status']=='PASS' and replay['originalProducerClaimUnchanged'] is True
    assert replay['originalDeclaration']==public_packet['declaration']
    row = replay['record']
    assert len(row['queries'])==3 and row['queries'][-1]['slots']==routes[-1]
    for key in ('kind','children','payloads','expanded','neededScope','roots'):
        assert row['source'][key]==public_packet[key]
    replay.update(inputPacketSha256=public_sha,inputPacketFile=str(PUBLIC_DEEP.relative_to(ROOT)))
    output_file.write_text(json.dumps(replay,separators=(',',':'))+'\n')
    if args.compare:
        manifest = (ROOT/'public/data/proof-atlas/deep-typing-manifest.js').read_text()
        descriptor = json.loads(manifest.split('=',1)[1].rstrip(';\n'))
        with gzip.open(ROOT/descriptor['file'].lstrip('/'),'rb') as stream:
            compiled_raw = stream.read(8*1024**2+1)
        assert len(compiled_raw)==descriptor['decodedBytes'] and sha(compiled_raw)==descriptor['sha256']
        compiled = json.loads(compiled_raw)
        assert result==compiled['nativeResult'] and sha(raw)==compiled['nativeResultSha256']
        assert replay==compiled['originalPublicReplay']
        assert hashes==compiled['producer']['sourceFiles']
    assert hashes=={str(p.relative_to(ROOT)):sha(p.read_bytes()) for p in sources()}
    summary = dict(status='PASS',format='ProofAtlasDeepNativeTypingVerification/1',compiler=compiler,
        sourceFiles=hashes,runtimeSha256=sha(text.encode()),resultSha256=sha(raw),
        cases=8,queries=24,negativeControls=8,successorDepth=args.depth,resources=resources,
        publicReplay=dict(status='PASS',packetSha256=public_sha,queries=3,
            outputSha256=sha(output_file.read_bytes()),resources=public_resources,
            originalProducerClaimUnchanged=True),
        originalMathematicalModulesImported=False,browserTypingAttached=False,
        freshNativeMatchesCompiledArtifact=True if args.compare else None,
        scope=result['scope'])
    (folder/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps({k:v for k,v in summary.items() if k!='sourceFiles'}))


if __name__=='__main__':
    main()
