"""Package the finite compiled construction controls, without operational logs."""
from pathlib import Path
import argparse
import gzip
import hashlib
import json

BASE=Path(__file__).resolve().parent
ROOT=BASE.parents[2]
sha=lambda raw:hashlib.sha256(raw).hexdigest()
encode=lambda value:(json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False)+'\n').encode()

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('workdir',type=Path)
 parser.add_argument('--check',action='store_true')
 args=parser.parse_args();folder=args.workdir.resolve()
 summary=json.loads((folder/'summary.json').read_text())
 audit=json.loads((folder/'independent-audit.json').read_text())
 input_raw=(folder/'input.json').read_bytes();native_raw=(folder/'result.json').read_bytes()
 assert summary['status']==audit['status']=='PASS' and summary['inputsUnchangedDuringReplay']
 assert sha(input_raw)==summary['inputSha256'] and sha(native_raw)==summary['resultSha256']==audit['nativeResultSha256']
 assert audit['cases']==8 and audit['nativeObservations']==12
 assert audit['compactConstructionCuts']==audit['queryRelativeCuts']==108
 assert audit['sourceFrontiersPartitionExactly'] and audit['relativeReferencesRecoverExactSource']
 assert audit['consumerModelSha256']==sha((BASE/'model.cjs').read_bytes())
 assert audit['consumerAuditSha256']==sha((BASE/'check.cjs').read_bytes())
 for relative,digest in summary['sourceFiles'].items():assert sha((ROOT/relative).read_bytes())==digest,relative
 keys=['toolchain','compilerCommit','sourceFiles','inputsUnchangedDuringReplay','originalEvidenceSha256',
  'inputSha256','resultSha256','prototypeSha256','sourceGeneratorSha256','ownControlSourceGraphSha256',
  'deepDependentSourceGraphSha256','frozenRuntimeSha256','cases','observations','nativeRejections']
 evidence=dict(format='ProofAtlasOccurrenceConstructionEvidence/1',
  producer={k:summary[k]for k in keys},inputJson=input_raw.decode(),nativeJson=native_raw.decode(),
  independentAudit=audit,originalMathematicalModulesImported=False,sourceModuleBytesVerified=False,
  queryAlgorithmFormallyVerified=False,browserIntegrated=False,
  scope='Eight fixed core-only source packets; twelve recorded Pi introductions/applications. Exact finite source/context correspondence; no project/AI construction coverage, semantic compression or comprehension measurement.')
 raw=encode(evidence);assert len(raw)<=8388608
 digest=sha(raw);relative='public/data/proof-atlas/occurrence-constructions/'+digest+'.json.gz'
 compressed=gzip.compress(raw,mtime=0)
 descriptor=dict(format='ProofAtlasOccurrenceConstructionInventory/1',file='/'+relative,sha256=digest,
  decodedBytes=len(raw),packets=8,observations=12,sourceCuts=108,
  maxQueryDepth=audit['maxQueryRouteDepth'],maxPremiseDepth=audit['maxPremiseRouteDepth'],
  maxQueryContext=audit['maxQueryContext'],maxPremiseContext=audit['maxPremiseContext'],
  browserIntegrated=False,sourceModuleBytesVerified=False)
 manifest=ROOT/'public/data/proof-atlas/occurrence-constructions-manifest.js'
 manifest_raw=b'window.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS='+encode(descriptor).rstrip(b'\n')+b';\n'
 destination=ROOT/relative
 if args.check:
  assert manifest.read_bytes()==manifest_raw,'Compiled inventory differs'
  assert gzip.decompress(destination.read_bytes())==raw,'Compiled evidence differs'
 else:
  destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(compressed);manifest.write_bytes(manifest_raw)
 print(json.dumps(dict(status='MATCH'if args.check else'PACKED',sha256=digest,decodedBytes=len(raw),
  compressedBytes=len(compressed),blogChanged=False,browserIntegrated=False)))

if __name__=='__main__':main()
