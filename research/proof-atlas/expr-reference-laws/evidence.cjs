'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/expr-reference-laws/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const native=read(base+'native-check.json.gz'),model=read(base+'model-check.json.gz'),production=read(base+'production-check.json.gz'),compat=read(base+'compatibility.json.gz');
function fingerprints(files){for(const[f,h]of Object.entries(files))assert.equal(hash(f),h,f);}
for(const r of[native.verification,model,production,compat])assert.equal(r.status,'PASS');
fingerprints(native.verification.producerFiles);fingerprints(model.files);fingerprints(production.files);
assert.equal(native.verification.independentDependencyRebuild,false);
assert.equal(native.profiles.length,29);assert.equal(native.verification.profiles.length,29);
const rawHash=o=>sha(Buffer.from(JSON.stringify(o)));
assert.equal(rawHash(native.controls),native.verification.controls.outputSha256);
for(const[i,p]of native.profiles.entries()){
 const v=native.verification.profiles[i];assert.equal(rawHash(p.observations),v.outputSha256);
 assert.equal(v.resources.exitCode,0);assert.equal(v.resources.stopReason,null);
 assert.equal(p.observations.originalDeclarationImported,false);assert.equal(p.observations.exactRoundtrip,'PASS');
}
assert.equal(native.verification.controls.resources.exitCode,0);assert.equal(native.verification.controls.resources.stopReason,null);
assert.equal(native.controls.laws.length,16);
for(const law of native.controls.laws){assert.equal(law.kernelTyping,'PASS');assert.deepEqual(law.axioms,model.axiomsByLaw[law.name]);assert(law.axioms.every(a=>['propext','Classical.choice','Quot.sound'].includes(a)));}
for(const[key,n]of Object.entries({laws:16,profiles:29,exchangeSteps:100,directDomainCoefficients:420,nonzeroSubstitutions:50,wholeBlockSizeChecks:100,completeLocalReconstructions:100,peakMemoStates:962}))assert.equal(model[key],n,key);
assert.deepEqual(model.constructorKinds,Array.from({length:12},(_,i)=>i));assert.equal(model.rawSyntaxTypeRefusal,true);
assert.deepEqual(model.controls,{lifts:204,swaps:68,substitutions:204,coefficients:5712,rawRefusals:3});
assert.equal(native.controls.typedProofs,false);assert.equal(native.controls.sampleCount,17);
const observations=native.profiles.flatMap(p=>p.observations.observations);
assert.equal(observations.length,100);
const maxDomain=Math.max(...observations.flatMap(o=>['domain','newDomain'].map(k=>Number(o.query.counts[k]))));assert.equal(maxDomain,199);
assert.equal(production.sourceOverride,false);assert.equal(production.programLink,true);assert.equal(production.audits.length,4);
assert.equal(hash(base+'check-production.cjs'),production.checkerSha256);
assert.equal(hash('_site_production/projects/proof-atlas/manual/binder-blocks/index.html'),production.productionHtmlSha256);
for(const a of production.audits){assert.equal(a.violations,0);assert.equal(hash(base+a.file),a.sha256);assert(a.metrics.left>=0&&a.metrics.right<=a.width+1);}
for(const f of Object.keys(production.files).filter(f=>f.startsWith(base)))assert(fs.readFileSync(f).equals(fs.readFileSync('_site_production/'+f)),f);
assert.equal(hash(base+'check-compatibility.cjs'),compat.checkerSha256);assert.deepEqual(Object.keys(compat.reports),['authored','exchange','corpus','references']);
for(const[name,item]of Object.entries(compat.reports)){
 assert.equal(item.outputPathsOnly,true);assert.equal(hash(item.originalChecker),item.originalCheckerSha256);assert.equal(hash(item.file),item.sha256);
 const r=read(item.file);assert.equal(r.status,'PASS');assert.equal(r.sourceOverride,false);assert.equal(r.checkerSha256,item.originalCheckerSha256);assert.equal(r.productionHtmlSha256,production.productionHtmlSha256);fingerprints(r.files);
 if(name==='corpus'){assert.equal(r.cases,11);assert.equal(r.componentRoots,88);assert.equal(r.spineSelections,248);assert.equal(r.sourceLinks.length,2);assert.equal(r.wholeArchiveAttempts,0);}
 else if(name==='references'){
  for(const[k,n]of Object.entries({cases:11,frames:248,relations:586,referencePages:746,targetLinks:44,wholeArchiveAttempts:0}))assert.equal(r[k],n,k);
  for(const k of['staleControls','failureRetry','pendingSwitch','keyboard','release'])assert.equal(r[k],true,k);
 }else assert.equal(r.controls,name==='authored'?12:8);
 assert.equal(r.audits.length,4);for(const a of r.audits){assert.equal(a.violations,0);const f=item.images[a.file];assert(f);assert.equal(hash(f.file),f.sha256);assert.equal(f.sha256,a.sha256);}
 for(const f of Object.keys(r.files))assert(fs.readFileSync(f).equals(fs.readFileSync('_site_production/'+f)),f);
}
const files=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/binder-block-exchange/index.html',...fs.readdirSync(base).filter(n=>/\.(cjs|md|css|lean|py|png|gz)$/.test(n)&&n!=='evidence.json.gz').sort().map(n=>base+n)].map(f=>[f,hash(f)]));
const report={format:'ProofAtlasExprReferenceAggregate/1',status:'PASS',laws:{kernelChecked:16,datatype:'Lean.Expr',axiomsByLaw:model.axiomsByLaw},finiteBridge:{profiles:29,exchangeSteps:100,directDomainCoefficients:420,nonzeroSubstitutions:50,wholeBlockReconstructions:100,maxDirectDomainOccurrences:maxDomain,peakLocalMemoStates:962,rawSyntaxSamples:17,constructorKinds:12,transforms:476,coefficients:5712,refusals:3,rawSyntaxTypeRefusal:true},production:{sourceOverride:false,audits:4,compatibilitySuites:4,compatibilityAudits:16,htmlSha256:production.productionHtmlSha256,programLink:true},files,scope:'General structural reference laws on Lean.Expr; finite native and model bridges. No general memoization/codec refinement, typing-preservation theorem, extreme-sharing rewrite result, comprehension, merge or deployment claim. Original proof typing is inherited, not replayed.'};
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')).equals(bytes));else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(bytes));
console.log(JSON.stringify({status:'PASS',laws:16,finiteBridge:report.finiteBridge,production:report.production,files:Object.keys(files).length}));
