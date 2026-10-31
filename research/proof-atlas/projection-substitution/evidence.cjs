'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/projection-substitution/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const native=read(base+'verification.json.gz'),model=read(base+'model.json.gz'),production=read(base+'production.json.gz');
for(const record of[native,model,production])assert.equal(record.status,'PASS');
for(const record of[model,production])for(const[f,h]of Object.entries(record.files))assert.equal(hash(f),h,f);
for(const[f,h]of Object.entries(native.producerFiles))assert.equal(hash(f),h,f);
assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),native.controlsSha256);
assert.equal(native.laws.length,4);for(const law of native.laws){assert(law.axioms.every(a=>['propext','Quot.sound'].includes(a)));for(const k of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(law[k],'PASS');}
for(const[k,n]of Object.entries({maps:67,shapes:23,constructors:12,lifts:18492,substitutions:30820,tableRows:654,typedControls:2,typedClosedTerms:8,kernelRecoveryWitnesses:2}))assert.equal(model[k],n,k);
assert.deepEqual(model.tally,{liftSuccess:13548,liftRefusal:4944,substituteApplicableSuccess:22898,substituteApplicableRefusal:2402,replacementUnavailable:5520,unusedReplacementSuccess:3234});
for(const value of Object.values(model.controls))assert.equal(value,true);
assert.equal(production.sourceOverride,false);assert.equal(production.readerNavigation,true);assert.equal(production.audits.length,4);assert.equal(production.checkerSha256,hash(base+'check-production.cjs'));
assert.equal(production.manualHtmlSha256,hash('_site_production/projects/proof-atlas/manual/binder-blocks/index.html'));assert.equal(production.programHtmlSha256,hash('_site_production/projects/proof-atlas/program/index.html'));
for(const audit of production.audits){assert.equal(audit.violations,0);assert.equal(audit.keyboardEquation,true);assert.equal(audit.sha256,hash(base+audit.file));}
const files=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/binder-block-exchange/index.html',...fs.readdirSync(base).filter(n=>/\.(lean|cjs|py|md|gz|png)$/.test(n)&&n!=='evidence.json.gz').sort().map(n=>base+n)].map(f=>[f,hash(f)]));
const report={format:'ProofAtlasProjectionFusionEvidence/1',status:'PASS',laws:native.laws.map(l=>({name:l.name,axioms:l.axioms})),coverage:{constructors:12,lifts:18492,substitutions:30820,typedControls:2},tally:model.tally,
 browser:{sourceOverride:false,audits:4,readerNavigation:true,manualHtmlSha256:production.manualHtmlSha256,programHtmlSha256:production.programHtmlSha256},files,
 scope:'Structural projection/lifting and projection/substitution laws, a depth-zero corollary and an explicit unused-replacement counterexample; finite native and independent graph checks, two closed typed examples. Not general typing preservation, opaque-extern/codec/evaluator refinement, arbitrary graph-region interfaces, semantic compression or comprehension evidence. Not merged or deployed.'};
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')).equals(bytes));else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(bytes,{mtime:0}));console.log(JSON.stringify({status:'PASS',coverage:report.coverage,files:Object.keys(files).length}));
