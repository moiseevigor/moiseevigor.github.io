/* Reuse recorded signatures only after comparing the complete data inventory. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-pages/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const nativeFile='research/proof-atlas/source-template-inputs/native.json.gz',verificationFile='research/proof-atlas/source-template-inputs/verification.json.gz';
const native=read(nativeFile),verification=read(verificationFile),environmentFile='research/proof-atlas/paged-type-notation/environment.json.gz',environment=read(environmentFile);
const write=process.argv.includes('--write'),recoveryAt=process.argv.indexOf('--recovery'),input=base+'constant-data.json.gz';
if(recoveryAt>=0){assert(write,'--recovery requires --write');const bytes=fs.readFileSync(process.argv[recoveryAt+1]);assert.equal(sha(bytes),verification.kernelRecoverySha256);fs.writeFileSync(input,z.gzipSync(bytes,{mtime:0}));}
const raw=z.gunzipSync(fs.readFileSync(input)),recovery=JSON.parse(raw);
assert(raw.length<=8388608);assert.equal(sha(raw),verification.kernelRecoverySha256);
assert.equal(recovery.status,'PASS');assert.equal(recovery.executableIrRestored,false);assert.equal(recovery.independentRebuild,false);
const allowed=['format','status','referenceSha256','indexSha256','attribution','independentRebuild','facets','files','retainedBytes','minimumFreeBytes','reserveBytes','executableIrRestored'];
assert(Object.keys(recovery).every(key=>allowed.includes(key)),'unexpected recovery metadata');assert.equal(recovery.files.length,26070);
for(const row of recovery.files){assert(/^[\x20-\x7e]+$/.test(row.file)&&!path.isAbsolute(row.file)&&!row.file.split('/').includes('..')&&/\.olean(?:\.private|\.server)?$/.test(row.file),'constant-data relative filename');assert(/^[a-f0-9]{64}$/.test(row.sha256));assert(Number.isSafeInteger(row.bytes)&&row.bytes>0);}
const rows=recovery.files.map(row=>[row.file,row.sha256,row.bytes]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0),constantDataSha256=sha(Buffer.from(JSON.stringify(rows)));
assert.equal(new Set(rows.map(row=>row[0])).size,rows.length);
assert.equal(environment.status,'PASS');assert.equal(verification.status,'PASS');
assert(environment.constantDataComparisons.every(row=>row.constantDataSha256===constantDataSha256&&row.files===26070),'recorded constant-data mismatch');
assert.equal(verification.kernelCacheAttribution,environment.kernelCacheAttribution);assert.equal(recovery.attribution,environment.kernelCacheAttribution);
assert.equal(verification.privateSupportManifestSha256,environment.privateSupportManifestSha256);
assert.equal(verification.build.leanExecutableSha256,environment.leanExecutableSha256);assert.deepEqual(verification.build.libraries,environment.libraries);
const host={};for(const file of ['public/data/proof-atlas/type-notation-catalog.js','public/data/proof-atlas/paged-notation-bindings.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:host});
const original=JSON.parse(JSON.stringify(host.PROOF_ATLAS_PAGED_NOTATION_BINDINGS)),catalog=JSON.parse(JSON.stringify(host.PROOF_ATLAS_TYPE_NOTATION));
assert.equal(original.environmentSha256,sha(z.gunzipSync(fs.readFileSync(environmentFile))));assert.equal(original.catalogueObjectSha256,sha(Buffer.from(JSON.stringify(catalog))));
const sourceFiles={},sources=native.profiles.map(profile=>{
 const bytes=z.gunzipSync(fs.readFileSync('.'+profile.record.indexFile));assert.equal(sha(bytes),profile.source.indexSha256);sourceFiles[profile.record.indexFile]=sha(bytes);
 const g=A.validateIndex(JSON.parse(bytes),profile.record);
 return{source:profile.source,context:profile.commonContext.map(frame=>{const kind=A.kinds[g.kind[frame.node]],payload=g.payloads[frame.node];assert(['lam','forallE','letE'].includes(kind));return{node:frame.node,kind,route:{root:1,slots:frame.slots},name:payload.binderName||payload.declName||'_'};})};
});
const compatibility={format:'ProofAtlasSourceTemplateNotationEnvironment/1',status:'PASS',nativeInventorySha256:sha(z.gunzipSync(fs.readFileSync(nativeFile))),nativeVerificationSha256:sha(z.gunzipSync(fs.readFileSync(verificationFile))),
 recoverySha256:sha(raw),constantDataSha256,constantDataFiles:26070,catalogueEnvironmentSha256:original.environmentSha256,producerSha256:sha(fs.readFileSync(__filename)),sourceFiles,
 scope:'Equality of complete recorded dependency-data inventories, compiler/library identities and original source contexts. No constant-data files are restored or rehashed, no extra signature is freshly exported, and no dependency rebuild or new typing judgment is claimed.'};
const data={...original,registries:[{nativeInventorySha256:compatibility.nativeInventorySha256,mode:'full',sources}],compatibilitySha256:sha(Buffer.from(JSON.stringify(compatibility)))};
const file='public/data/proof-atlas/source-template-notation-bindings.js',bytes=Buffer.from('window.PROOF_ATLAS_SOURCE_TEMPLATE_NOTATION_BINDINGS = '+JSON.stringify(data)+';\n');assert(bytes.length<=262144);
if(write){fs.writeFileSync(file,bytes);fs.writeFileSync(base+'notation-environment.json.gz',z.gzipSync(Buffer.from(JSON.stringify(compatibility,null,2)+'\n'),{mtime:0}));}
else{assert(fs.readFileSync(file).equals(bytes));assert.deepEqual(read(base+'notation-environment.json.gz'),compatibility);}
console.log(JSON.stringify({status:'PASS',sourceProfiles:sources.length,constantDataFiles:26070,constantDataSha256,registryBytes:bytes.length}));
