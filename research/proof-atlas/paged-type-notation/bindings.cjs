'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const A=require('../../../public/js/proof-atlas-library-data');process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/paged-type-notation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),host={};
cp.execFileSync(process.execPath,['research/proof-atlas/type-notation/catalog.cjs','--check'],{stdio:'pipe'});
const environment=read(base+'environment.json.gz');assert.equal(environment.status,'PASS');assert.equal(environment.producerSha256,sha(fs.readFileSync(base+'verify.py')));
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window:host});const catalog=JSON.parse(JSON.stringify(host.PROOF_ATLAS_TYPE_NOTATION));
assert.equal(catalog.leanExecutableSha256,environment.leanExecutableSha256);
const core=read('research/proof-atlas/type-notation/native.json.gz'),registries=[],parents={},sourceFiles={};
for(const name of['region-input-functions','dependent-region-inputs','region-input-adapters']){
 const file='research/proof-atlas/'+name+'/native.json.gz',raw=z.gunzipSync(fs.readFileSync(file)),verification=read('research/proof-atlas/'+name+'/verification.json.gz');
 assert.equal(verification.status,'PASS');assert.equal(sha(raw),verification.nativeSha256);
 assert.equal(verification.leanExecutableSha256||verification.build.leanExecutableSha256,environment.leanExecutableSha256);
 assert.deepEqual(verification.libraries||verification.build.libraries,environment.libraries);
 const mode=name==='dependent-region-inputs'?'core':'full';
 if(mode==='core')assert.equal(verification.coreDataInventorySha256,environment.coreDataInventorySha256);
 else{assert.equal(verification.kernelCacheAttribution,environment.kernelCacheAttribution);assert.equal(verification.privateSupportManifestSha256,environment.privateSupportManifestSha256);}
 parents[file]=sha(raw);
 const sources=JSON.parse(raw).profiles.map(p=>{
  const bytes=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(bytes),p.source.indexSha256);const g=A.validateIndex(JSON.parse(bytes),p.record);sourceFiles[p.record.indexFile]=sha(bytes);
  const context=p.commonContext.map(f=>{const kind=A.kinds[g.kind[f.node]],payload=g.payloads[f.node];assert(['lam','forallE','letE'].includes(kind));return{node:f.node,kind,route:{root:1,slots:f.slots},name:payload.binderName||payload.declName||'_'};});
  return{source:p.source,context};
 });registries.push({nativeInventorySha256:sha(raw),mode,sources});
}
const data={format:'ProofAtlasPagedNotationBindings/1',catalogueObjectSha256:sha(Buffer.from(JSON.stringify(catalog))),catalogueNativeSha256:catalog.nativeSha256,extraNativeSha256:catalog.extraNativeSha256,
 environmentSha256:sha(z.gunzipSync(fs.readFileSync(base+'environment.json.gz'))),coreNames:core.signatures.map(s=>s.name),registries};
const file='public/data/proof-atlas/paged-notation-bindings.js',bytes=Buffer.from('window.PROOF_ATLAS_PAGED_NOTATION_BINDINGS = '+JSON.stringify(data)+';\n');assert(bytes.length<=262144);
const report={format:'ProofAtlasPagedNotationBindingBuild/1',status:'PASS',parents,sourceFiles,catalogueSha256:sha(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js')),manifestSha256:sha(bytes),producerSha256:sha(fs.readFileSync(__filename)),registries:3,sourceAppearances:registries.reduce((n,r)=>n+r.sources.length,0),bytes:bytes.length,
 scope:'Compatibility of recorded signature environments and exact original binder names for three native inventories. The source packet hashes and context addresses are verified. No fresh export of the extra signatures or new typing judgments.'};
if(process.argv.includes('--check')){assert(fs.readFileSync(file).equals(bytes));assert.deepEqual(read(base+'bindings.json.gz'),report);}else{fs.writeFileSync(file,bytes);fs.writeFileSync(base+'bindings.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',registries:3,sourceAppearances:report.sourceAppearances,bytes:bytes.length}));
