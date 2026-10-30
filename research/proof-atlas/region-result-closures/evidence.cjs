'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha}=require('../method-context/catalogue.cjs'),base='research/proof-atlas/region-result-closures/';
const load=n=>JSON.parse(z.gunzipSync(fs.readFileSync(base+n+'.json.gz')));
const modelResult=JSON.parse(cp.execFileSync(process.execPath,[base+'check.cjs','--check'],{encoding:'utf8',maxBuffer:8388608}));assert.equal(modelResult.status,'PASS');
const publicResult=JSON.parse(cp.execFileSync(process.execPath,[base+'check-public.cjs','--check'],{encoding:'utf8'}));assert.equal(publicResult.status,'PASS');
const unchangedApplication=JSON.parse(cp.execFileSync(process.execPath,['research/proof-atlas/method-conversion-view/evidence.cjs','--check'],{encoding:'utf8'}));assert.equal(unchangedApplication.status,'PASS');
const native=load('native-check'),model=load('model-check'),publicRun=load('public-verification'),publicCheck=load('public-check'),figure=load('figure-check'),presentation=load('presentation-check');
assert.equal(native.verification.runScope,'all');assert.equal(native.verification.originalPrivateSourcesRead,true);
assert.equal(native.verification.originalEnvironmentIdentityVerified,false);
for(const [key,value] of Object.entries({profiles:5,groups:6,ports:24,uniqueSourceCalls:23,lambdaSlots:27,letSlots:15,nativeWrongTypeRefusals:24,metadataRefusals:30,resultBindingRefusals:24,compositionChecks:24,nontrivialCompositions:14}))assert.equal(model[key],value,key);
assert.equal(publicRun.runScope,'public');assert.equal(publicRun.originalPrivateSourcesRead,false);assert.equal(publicRun.privateRiccatiSourceModules,null);assert.equal(publicRun.ports,14);assert.equal(publicCheck.outputsMatchCompleteRun,true);
for(const [file,hash] of Object.entries(model.files))assert.equal(sha(fs.readFileSync(file)),hash,file);
assert.equal(figure.status,'PASS');assert.equal(figure.nativeBundleSha256,sha(fs.readFileSync(base+'native-check.json.gz')));assert.equal(figure.generatorSha256,sha(fs.readFileSync(base+'figure.cjs')));
assert.equal(figure.svgSha256,sha(fs.readFileSync(base+'output-tuples.svg')));assert.equal(presentation.status,'PASS');assert.equal(presentation.svgSha256,figure.svgSha256);assert.equal(presentation.pngSha256,sha(fs.readFileSync(base+'output-tuples.png')));assert.equal(presentation.checkerSha256,sha(fs.readFileSync(base+'render-figure.cjs')));assert.deepEqual(presentation.clippedLabels,[]);assert.deepEqual(presentation.accessibilityViolations,[]);
const predecessor='38aff86f5e645e80056d87ae488091f677195bb7';
const originalFiles=['public/data/proof-atlas/library-manifest.js','public/js/proof-atlas-library-data.js','research/proof-atlas/method-context/catalogue.cjs','research/proof-atlas/method-conversion-view/evidence.json.gz',...native.profiles.filter(p=>p.originalNativeOwner).flatMap(p=>[p.record.indexFile.slice(1),p.originalNativeOwner.file.slice(1)])];
const inputs=[...new Set(originalFiles)].map(file=>{const bytes=fs.readFileSync(file);assert(bytes.equals(cp.execFileSync('git',['show',predecessor+':'+file],{maxBuffer:67108864})),file);return{file,sha256:sha(bytes)};});
const files=fs.readdirSync(base).filter(n=>n!=='evidence.json.gz').sort().map(n=>{const file=base+n;assert(fs.statSync(file).isFile(),file);return{file,sha256:sha(fs.readFileSync(file))};});
const result={format:'ProofAtlasCommonPrefixOutputTuplesEvidence/1',status:'PASS',predecessor,
  counts:{profiles:model.profiles,collections:model.groups,portAppearances:model.ports,uniqueSourceCalls:model.uniqueSourceCalls,twoStageChecks:model.compositionChecks,nontrivialStages:model.nontrivialCompositions,nativeWrongTypeRejections:24,metadataRejections:54,publicNativePorts:14},
  laws:native.profiles[0].output.laws,sourceSizes:model.sourceSizes,sharedClosureCases:model.sharedClosureCases,
  checkingEnvironment:native.verification.dependencyRecovery,originalEnvironmentIdentityVerified:false,
  unchangedApplication,inputs,files,
  scope:'Fresh common-prefix output-tuple typing and structural wrapper composition. Five source packets, six selected collections, exact source reopening and projection/instantiation checks; a separate fourteen-port public-only native replay agrees. No independent boundary-input function, arbitrary quotient substitution theorem, interactive reader change, comprehension result, blog update, merge or deployment.'};
const bytes=Buffer.from(JSON.stringify(result,null,2)+'\n');
if(process.argv.includes('--check'))assert.deepEqual(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')),bytes);else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(bytes));
console.log(JSON.stringify({status:'PASS',counts:result.counts,sha256:sha(bytes)}));
