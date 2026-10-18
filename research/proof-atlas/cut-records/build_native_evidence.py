"""Publish deterministic native-check summaries, excluding private logs/resources."""
import argparse,gzip,json
from pathlib import Path
from verify_native import ROOT,BASE,sha,evidence

def negative_evidence(report):
 return {k:report[k]for k in ['status','packets','nativeRejections','sourceFiles','scope']}|{'rows':[{'source':r['source'],'native':r['native']}for r in report['rows']]}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--positive',type=Path,required=True);p.add_argument('--negative',type=Path,required=True);p.add_argument('--check',action='store_true');a=p.parse_args()
 positive=json.loads(a.positive.read_text());negative=json.loads(a.negative.read_text());assert positive['status']==negative['status']=='PASS'
 assert positive['requests']==len(positive['rows'])
 assert positive['records']==sum(r['native']['records']for r in positive['rows'])
 assert positive['bindings']==sum(r['independent']['bindings']for r in positive['rows'])
 assert positive['externalTargets']==sum(r['independent']['externalTargets']for r in positive['rows'])
 for report in [positive,negative]:
  for file,want in report['sourceFiles'].items():assert sha((ROOT/file).read_bytes())==want,file
 data={'format':'ProofAtlasNativeSourceCutChecks/1','sourceModuleBytesVerified':False,'mathematicalProofTypingChecked':False,'individualCutKernelCertificates':False,'browserRendererVerified':False,'positive':evidence(positive),'negative':negative_evidence(negative),'producer':{'kind':'native-source-cut-check-summary/1','builderSha256':sha(Path(__file__).read_bytes())},'scope':'Generic structural/lexical laws plus executed native source-cut checks. Not per-record kernel certificates, mathematical proof typing, verified JSON decoding or visual comprehension.'}
 raw=json.dumps(data,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode();assert len(raw)<=8*1024**2;digest=sha(raw);url='/public/data/proof-atlas/native-source-cuts/'+digest+'.json.gz';out=ROOT/url.lstrip('/');manifest=ROOT/'public/data/proof-atlas/native-source-cuts-manifest.js'
 descriptor={'format':'ProofAtlasNativeSourceCutChecksManifest/1','file':url,'sha256':digest,'decodedBytes':len(raw),'requests':positive['requests'],'records':positive['records'],'bindings':positive['bindings'],'externalTargets':positive['externalTargets'],'nativeNegativeControls':negative['nativeRejections'],'sourceFiles':positive['sourceFiles']};text='window.PROOF_ATLAS_NATIVE_SOURCE_CUT_CHECKS = '+json.dumps(descriptor,sort_keys=True,separators=(',',':'))+';\n'
 if a.check:assert gzip.decompress(out.read_bytes())==raw and manifest.read_text()==text
 else:
  out.parent.mkdir(parents=True,exist_ok=True);out.write_bytes(gzip.compress(raw,mtime=0));manifest.write_text(text)
 print(json.dumps({'status':'PASS','mode':'check'if a.check else 'write','file':url,'sha256':digest,'decodedBytes':len(raw),'records':positive['records'],'bindings':positive['bindings'],'nativeNegativeControls':negative['nativeRejections']}))
if __name__=='__main__':main()
