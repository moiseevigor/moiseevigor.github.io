"""Pack checked synthetic/core term records; omit raw logs and resource reports."""
from pathlib import Path
import argparse
import gzip
import hashlib
import json

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]


def sha(raw):
    return hashlib.sha256(raw).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workdir',type=Path)
    args = parser.parse_args()
    folder = args.workdir.resolve()
    summary = json.loads((folder/'summary.json').read_text())
    audit = json.loads((folder/'independent-audit.json').read_text())
    raw = (folder/'result.json').read_bytes()
    replay_raw = (folder/'public-replay.json').read_bytes()
    assert summary['status']==audit['status']=='PASS'
    assert sha(raw)==summary['resultSha256']==audit['nativeResultSha256']
    assert sha(replay_raw)==summary['publicReplay']['outputSha256']
    for path, expected in summary['sourceFiles'].items():
        assert sha((ROOT/path).read_bytes())==expected,path
    assert audit['cases']==9 and audit['queries']==27 and audit['cuts']==54
    result = json.loads(raw)
    replay = json.loads(replay_raw)
    evidence = dict(format='ProofAtlasDeepContextTypingEvidence/1',
        producer=dict(toolchain='leanprover/lean4:v4.33.1',compiler=summary['compiler'],
            runtimeSha256=summary['runtimeSha256'],sourceFiles=summary['sourceFiles'],
            packerSha256=sha(Path(__file__).read_bytes())),
        nativeResultSha256=sha(raw),nativeResult=result,
        originalPublicReplay=replay,independentAudit=audit,
        originalMathematicalModulesImported=False,browserTypingAttached=False,
        queryAlgorithmFormallyVerified=False,sourceModuleBytesVerified=False,
        scope='Nine fixed core-only synthetic packets; 27 native contextual judgments. No project/AI corpus typing, live reader attachment or arbitrary-size guarantee.')
    packed = (json.dumps(evidence,sort_keys=True,separators=(',',':'),ensure_ascii=False)+'\n').encode()
    assert len(packed)<=8*1024**2
    digest = sha(packed)
    relative = 'public/data/proof-atlas/deep-typing/'+digest+'.json.gz'
    destination = ROOT/relative
    destination.parent.mkdir(parents=True,exist_ok=True)
    compressed = gzip.compress(packed,mtime=0)
    destination.write_bytes(compressed)
    manifest = dict(format='ProofAtlasDeepContextTypingInventory/1',file='/'+relative,
        sha256=digest,decodedBytes=len(packed),packets=9,queries=27,sourceCuts=54,
        maxQueryDepth=audit['maxDepth'],maxContext=audit['maxContext'],
        browserTypingAttached=False,sourceModuleBytesVerified=False)
    (ROOT/'public/data/proof-atlas/deep-typing-manifest.js').write_text(
        'window.PROOF_ATLAS_DEEP_TYPING='+json.dumps(manifest,sort_keys=True,separators=(',',':'))+';\n')
    print(json.dumps(dict(status='PACKED',file=relative,decodedBytes=len(packed),compressedBytes=len(compressed),
        sha256=digest,blogChanged=False,browserTypingAttached=False)))


if __name__=='__main__':
    main()
