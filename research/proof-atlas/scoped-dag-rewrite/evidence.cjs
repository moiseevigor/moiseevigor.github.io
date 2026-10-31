'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/scoped-dag-rewrite/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const controls=read(base+'controls.json.gz'),stress=read(base+'stress.json.gz'),corpus=read(base+'corpus.json.gz'),model=read(base+'model-check.json.gz'),production=read(base+'production-check.json.gz');
function fingerprints(files){for(const[f,h]of Object.entries(files))assert.equal(hash(f),h,f);}
for(const r of[controls,stress,corpus.verification,model,production])assert.equal(r.status,'PASS');
for(const r of[controls,stress,corpus.verification]){fingerprints(r.producerFiles);assert.equal(r.compiler,stress.compiler);assert.equal(r.leanExecutableSha256,stress.leanExecutableSha256);}
fingerprints(model.files);fingerprints(production.files);
for(const r of[controls,stress]){assert.equal(sha(Buffer.from(JSON.stringify(r.observation))),r.outputSha256);assert.equal(r.resources.exitCode,0);assert.equal(r.resources.stopReason,null);}
const original=read('research/proof-atlas/expr-reference-laws/native-check.json.gz');assert.deepEqual(stress.observation.laws,original.controls.laws);
for(const[i,p]of corpus.profiles.entries()){const r=corpus.verification.profiles[i];assert.equal(sha(Buffer.from(JSON.stringify(p))),r.outputSha256);assert.equal(r.resources.exitCode,0);assert.equal(r.resources.stopReason,null);assert.equal(p.originalDeclarationImported,false);}
assert.equal(controls.observation.protectedLaws.length,3);for(const l of controls.observation.protectedLaws){assert.equal(l.kernelTyping,'PASS');assert.deepEqual(l.axioms,['propext','Quot.sound']);}
for(const[k,n]of Object.entries({protectedLaws:3,constructorKinds:12,rawTransforms:476,rawCoefficients:5712,metadataRefusals:6,addressDepthRefusals:2,profiles:29,exchangeSteps:100,peakCorpusStates:24313,peakCorpusPending:195}))assert.equal(model[k],n,k);
assert.equal(model.stress.jointRows,107044);assert.equal(model.stress.roots,13);assert.equal(model.stress.sourceOccurrences,'2417851639229258349412357');assert.equal(model.stress.substitutedOccurrences,'3022314549036572936765445');
assert.equal(model.regressions.earlyReturnSkipsCompositeInsertion,true);assert.equal(model.regressions.typedWrongScopeIsNonconvertible,true);
assert.equal(model.regressions.kernelInequalityProof,true);assert.equal(controls.observation.regressions.kernelInequalityProof,'PASS');
const small=controls.observation.regressions.graph,walk=(root,slots)=>slots.reduce((n,s)=>small.children[n][s],small.roots[root]);
assert.equal(walk(1,[1,1,0,1]),walk(1,[1,1,1,1]));for(const root of[1,2,3])assert.equal(small.neededScope[small.roots[root]],0);
assert.equal(production.sourceOverride,false);assert.equal(production.audits.length,4);assert.equal(hash(base+'check-production.cjs'),production.checkerSha256);assert.equal(hash('_site_production/projects/proof-atlas/program/index.html'),production.programHtmlSha256);
for(const a of production.audits){assert.equal(a.violations,0);assert.equal(a.keyboard,true);assert.equal(hash(base+a.file),a.sha256);}
for(const f of Object.keys(production.files).filter(f=>f.startsWith(base)))assert(fs.readFileSync(f).equals(fs.readFileSync('_site_production/'+f)),f);
const inherited=production.readerEvidence;assert.equal(hash(inherited.file),inherited.sha256);assert.equal(hash('_site_production/projects/proof-atlas/manual/binder-blocks/index.html'),inherited.manualHtmlSha256);assert.deepEqual(Object.keys(inherited.suites),['authored','exchange','corpus','references']);
for(const r of Object.values(inherited.suites)){assert.equal(hash(r.file),r.sha256);fingerprints(r.files);for(const[f,h]of Object.entries(r.files))assert.equal(hash('_site_production/'+f),h);}
const compat=read(inherited.file);assert.equal(compat.status,'PASS');assert.equal(hash(base+'check-compatibility.cjs'),compat.checkerSha256);
for(const[name,item]of Object.entries(compat.reports)){
 assert.equal(item.outputPathsOnly,true);assert.equal(hash(item.originalChecker),item.originalCheckerSha256);assert.equal(hash(item.file),item.sha256);
 const r=read(item.file);assert.equal(r.status,'PASS');assert.equal(r.sourceOverride,false);assert.equal(r.checkerSha256,item.originalCheckerSha256);assert.equal(r.productionHtmlSha256,inherited.manualHtmlSha256);assert.equal(r.audits.length,4);fingerprints(r.files);
 if(name==='corpus'){assert.equal(r.cases,11);assert.equal(r.componentRoots,88);assert.equal(r.spineSelections,248);assert.equal(r.sourceLinks.length,2);assert.equal(r.wholeArchiveAttempts,0);}
 else if(name==='references'){
  for(const[k,n]of Object.entries({cases:11,frames:248,relations:586,referencePages:746,targetLinks:44,wholeArchiveAttempts:0}))assert.equal(r[k],n,k);
  for(const k of['staleControls','failureRetry','pendingSwitch','keyboard','release'])assert.equal(r[k],true,k);
 }else assert.equal(r.controls,name==='authored'?12:8);
 for(const a of r.audits){assert.equal(a.violations,0);const f=item.images[a.file];assert(f);assert.equal(hash(f.file),f.sha256);assert.equal(f.sha256,a.sha256);}
}
const files=Object.fromEntries(['docs/proof-atlas-research-program.md',...fs.readdirSync(base).filter(n=>/\.(cjs|md|lean|py|png|gz)$/.test(n)&&n!=='evidence.json.gz').sort().map(n=>base+n)].map(f=>[f,hash(f)]));
const report={format:'ProofAtlasScopedDagAggregate/1',status:'PASS',protectedLaws:controls.observation.protectedLaws,model:{rawTransforms:476,rawCoefficients:5712,profiles:29,exchangeSteps:100,metadataRefusals:6,addressDepthRefusals:2,peakCorpusStates:24313,peakCorpusPending:195,regressions:model.regressions,stress:model.stress},production:{audits:4,sourceOverride:false,programHtmlSha256:production.programHtmlSha256,freshReaderSuites:4,manualHtmlSha256:inherited.manualHtmlSha256},files,scope:'Native and independent-model checks of an explicit row/depth evaluator, plus three general structural protection laws. Original proof typing is inherited; the massive sharing control is authored, not an AI proof. No general evaluator proof, human-comprehension, merge or deployment claim.'};
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')).equals(bytes));else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(bytes));
console.log(JSON.stringify({status:'PASS',protectedLaws:3,rawTransforms:476,exchangeSteps:100,stress:model.stress,production:report.production,files:Object.keys(files).length}));
