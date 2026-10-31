'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),F=require('../binder-computation-exchange/model.cjs'),S=require('../binder-support/model.cjs'),M=require('../expr-reference-laws/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/scoped-dag-rewrite/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const freeze=process.argv[2]==='--freeze';
function load(folder,name){return freeze?JSON.parse(fs.readFileSync(folder+'/verification.json')):read(base+name+'.json.gz');}
const controls=load(process.argv[3],'controls'),stress=load(process.argv[4],'stress');
let corpus;
if(freeze){const dir=process.argv[5],verification=JSON.parse(fs.readFileSync(dir+'/verification.json'));corpus={verification,profiles:verification.profiles.map(r=>{const raw=z.gunzipSync(fs.readFileSync(dir+'/'+r.outputFile));assert.equal(sha(raw),r.outputSha256);return JSON.parse(raw);})};}else corpus=read(base+'corpus.json.gz');
const records=[controls,stress,corpus.verification];
function fingerprints(files){for(const[f,h]of Object.entries(files))assert.equal(hash(f),h,f);}
function native(record){assert.equal(record.status,'PASS');fingerprints(record.producerFiles);if(record.observation)assert.equal(sha(Buffer.from(JSON.stringify(record.observation))),record.outputSha256);}
function resources(r){assert.equal(r.exitCode,0);assert.equal(r.stopReason,null);assert(r.maxRssBytes<=8*1024**3&&r.seconds<=121);}
records.forEach(native);resources(controls.resources);resources(stress.resources);
const previous=read('research/proof-atlas/expr-reference-laws/native-check.json.gz'),priorControls=previous.controls;
assert.equal(hash(controls.inventory.file),controls.inventory.sha256);
const report={format:'ProofAtlasScopedDagModel/1',status:'PASS',protectedLaws:3,constructorKinds:12,rawTransforms:0,rawCoefficients:0,metadataRefusals:0,addressDepthRefusals:0,profiles:0,exchangeSteps:0,peakCorpusStates:0,peakCorpusPending:0};
const c=controls.observation;
assert.equal(c.typedProofs,false);assert.equal(c.observations.length,476);
assert.deepEqual(c.protectedLaws.map(l=>l.name),['lift_protected','swap_protected','substitute_protected'].map(n=>'AtlasExprReferencePruning.'+n));
for(const law of c.protectedLaws){assert.equal(law.kernelTyping,'PASS');assert.deepEqual(law.axioms,['propext','Quot.sound']);}
function stats(r){assert(Number.isInteger(r.states)&&r.states>=0&&r.states<=262144);assert(Number.isInteger(r.visits)&&r.visits>0&&r.visits<=1048577);assert(Number.isInteger(r.peakPending)&&r.peakPending>0&&r.peakPending<=4096);}
const expected=Object.entries({lifts:'lift',swaps:'swap',substitutions:'substitute'}).flatMap(([name,op])=>priorControls[name].map(control=>({name,op,control})));
for(const[i,o]of c.observations.entries()){
 const e=expected[i],g=priorControls.graph;assert.equal(o.operation,e.name);assert.deepEqual(o.control,e.control);assert.equal(o.rawEquality,'PASS');stats(o.stats);
 const p=e.control,built=M.transform(g,g.roots[p.sample],e.op,{amount:p.amount||0,cutoff:p.cutoff||0,depth:p.depth||0,...(e.op==='substitute'?{value:g.roots[priorControls.sampleCount+p.value]}:{})});
 assert(F.equal(built,built.roots[0],g,g.roots[p.root]));const counted=S.counter(built).at(built.roots[0]);assert.equal(counted.occurrences,p.size);
 for(let k=0;k<12;k++){assert.equal(counted.free.find(r=>r.index===k)?.count||'0',p.coefficients[k]);report.rawCoefficients++;}report.rawTransforms++;
}
assert.deepEqual(c.metadataRefusals,['wrong-format','wrong-scope','wrong-count','oversized-count','bad-root','cyclic-child']);report.metadataRefusals=c.metadataRefusals.length;assert.equal(c.addressDepthRefusals,2);report.addressDepthRefusals=2;
// Independent construction of the authored source terms and all complete roots.
function builder(){
 const t=F.table(),constant=(name,levels=[])=>t.add(4,{name,nameParts:name.split('.').map(str=>({str})),levels}),nat=constant('Nat'),natFn=t.add(7,{binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},[nat,nat]);
 const variable=index=>t.add(0,{index}),literal=n=>t.add(9,{literalKind:'natVal',repr:'Lean.Literal.natVal '+n,value:String(n)}),app=(f,a)=>t.add(5,{},[f,a]),apps=(f,args)=>args.reduce(app,f),add=(a,b)=>apps(constant('Nat.add'),[a,b]);
 const lambda=(name,parts,domain,body)=>t.add(6,{binderName:name,binderNameParts:parts,binderInfo:'default'},[domain,body]),local=body=>lambda('x',[{str:'x'}],nat,body),pair=(left,right)=>apps(constant('Prod.mk',[{kind:'zero'},{kind:'zero'}]),[nat,natFn,left,right]);
 const close=(body,count)=>{for(let i=0;i<count;i++)body=lambda('input.'+i,[{str:'input'},{num:String(i)}],nat,body);return body;};
 const importRoot=(g,root)=>{const memo=new Map();function copy(n){if(memo.has(n))return memo.get(n);const out=t.add(g.kind[n],g.payloads[n],g.children[n].map(copy));memo.set(n,out);return out;}return copy(root);};
 return{t,constant,nat,natFn,variable,literal,app,apps,add,local,pair,close,importRoot};
}
const regression=c.regressions;
for(const[k,v]of Object.entries({earlyBranch:1,explicitBranch:2,legacyStates:1,fixedStates:2,sameLegacyOutput:true,wrongCacheTyped:true,sameType:true,wrongCacheNonconvertible:true}))assert.equal(regression[k],v,k);
assert.equal(regression.kernelInequalityProof,'PASS');
{
 const b=builder(),fan=b.add(b.variable(0),b.variable(1)),original=b.pair(fan,b.local(fan)),right=M.transform(b.t.g,original,'lift',{amount:1});
 const wrongFan=b.add(b.variable(1),b.variable(2)),wrong=b.pair(wrongFan,b.local(wrongFan));
 const roots=[original,b.close(original,2),b.close(b.importRoot(right,right.roots[0]),3),b.close(wrong,3)],g=regression.graph;
 assert.equal(g.roots.length,4);roots.forEach((r,i)=>assert(F.equal(b.t.g,r,g,g.roots[i]),'independent exact wrong-scope control root '+i));assert(!F.equal(g,g.roots[2],g,g.roots[3]));
}
report.regressions={earlyReturnSkipsCompositeInsertion:true,typedWrongScopeIsNonconvertible:true,kernelInequalityProof:true};
const h=8192n*(2n**64n),o=stress.observation,g=o.graph;
assert.equal(o.leafCount,8192);assert.equal(o.doublings,64);assert.equal(o.provenance,'assistant-authored typed value program; not AI-source evidence');
for(const[k,n]of Object.entries({kernelTyping:4,kernelConversions:3,typedEqualityWitnesses:3,literalInverses:2}))assert.equal(o[k],n,k);
assert.equal(o.expectedFreeUses,String(h));assert.equal(o.expectedLocalUses,String(h));assert.equal(o.expectedOriginalOccurrences,String(16n*h+5n));assert.equal(o.expectedSubstitutedOccurrences,String(20n*h+5n));
assert.equal(g.kind.length,107044);assert.equal(g.roots.length,13);
// Validate every postorder row, payload, expanded count and scope recurrence.
for(let n=0;n<g.kind.length;n++){
 const k=g.kind[n],cs=g.children[n];assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<n));assert.equal(cs.length,(A.fields[A.kinds[k]]||[]).length);A.payloadKey(k,g.payloads[n]);
 assert.equal(g.expanded[n],String(1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n)));
 assert.equal(g.neededScope[n],k===0?g.payloads[n].index+1:Math.max(0,...cs.map((c,s)=>g.neededScope[c]-Number(F.binds(k,s)))));
}
{
 const b=builder();let layer=Array.from({length:8192},(_,i)=>b.add(b.variable(0),b.literal(i)));
 while(layer.length>1)layer=Array.from({length:layer.length/2},(_,i)=>b.add(layer[2*i],layer[2*i+1]));let fan=layer[0];for(let i=0;i<64;i++)fan=b.add(fan,fan);
 const original=b.pair(fan,b.local(fan)),value=b.add(b.variable(0),b.variable(1)),lift=M.transform(b.t.g,original,'lift',{amount:2}),swap=M.transform(b.t.g,original,'swap'),sub=M.transform(b.t.g,original,'substitute',{value});
 const lifted=b.importRoot(lift,lift.roots[0]),swapped=b.importRoot(swap,swap.roots[0]),substituted=b.importRoot(sub,sub.roots[0]);
 const sourceFunction=b.close(original,1),liftFunction=b.close(lifted,3),swapFunction=b.close(swapped,2),subFunction=b.close(substituted,2),zero=b.literal(0),pairType=b.apps(b.constant('Prod',[{kind:'zero'},{kind:'zero'}]),[b.nat,b.natFn]);
 const liftAdapter=b.close(b.apps(liftFunction,[b.variable(0),zero,zero]),1),swapAdapter=b.close(b.apps(swapFunction,[b.variable(0),zero]),1),sourceAtValue=b.close(b.app(sourceFunction,value),2);
 const roots=[original,value,lifted,swapped,substituted,sourceFunction,liftFunction,swapFunction,subFunction,liftAdapter,swapAdapter,sourceAtValue,pairType];
 roots.forEach((r,i)=>assert(F.equal(b.t.g,r,g,g.roots[i]),'independent complete stress root '+i));
 const back=M.transform(swap,swap.roots[0],'swap');assert(F.equal(back,back.roots[0],b.t.g,original));
 const counter=S.counter(g);for(const root of[g.roots[0],g.roots[2],g.roots[3],g.roots[4]])assert.deepEqual(counter.at(root),S.weighted(g,root),'independent weighted scope accounting');
 const originalStats=counter.at(g.roots[0]),subStats=counter.at(g.roots[4]);assert.equal(originalStats.occurrences,String(16n*h+5n));assert.equal(subStats.occurrences,String(20n*h+5n));
 assert.equal(originalStats.localReferences,String(h));assert.deepEqual(originalStats.free,[{index:0,count:String(h)}]);assert.equal(subStats.localReferences,String(h));assert.deepEqual(subStats.free,[{index:0,count:String(h)},{index:1,count:String(h)}]);
}
assert.deepEqual(o.memoStates,[24706,24706,24706,24706]);assert.equal(o.rewriteStats.length,4);for(const s of o.rewriteStats){stats(s);assert.deepEqual(s,{peakPending:239,states:24706,visits:74117});}
report.stress={jointRows:g.kind.length,roots:13,freeUses:String(h),localUses:String(h),sourceOccurrences:String(16n*h+5n),substitutedOccurrences:String(20n*h+5n),rewriteStats:o.rewriteStats,kernelTyping:4,kernelConversions:3,typedEqualityWitnesses:3,literalInverses:2,provenance:o.provenance};
// Exact source owners and routes come from the frozen preceding census.
assert.equal(corpus.profiles.length,29);assert.equal(corpus.verification.independentDependencyRebuild,false);
const inventories=new Map();
function graphOf(p){const f=p.nativeInventory.file;assert.equal(hash(f),p.nativeInventory.sha256);if(!inventories.has(f))inventories.set(f,read(f));const r=inventories.get(f);
 if(r.controls){const c=r.controls.find(c=>c.source.indexSha256===p.source.indexSha256&&c.source.name===p.id);assert(c);return c.observation.result.graph;}
 const profile=r.profiles.find(c=>c.source.indexSha256===p.source.indexSha256),c=profile.cases.find(c=>c.plan.id===p.id);assert(c);return c.native.result.graph;
}
for(const[i,p]of corpus.profiles.entries()){
 const v=corpus.verification.profiles[i],old=previous.profiles[i];resources(v.resources);assert.equal(sha(Buffer.from(JSON.stringify(p))),v.outputSha256);assert.equal(p.originalDeclarationImported,false);
 assert.equal(p.id,old.id);assert.deepEqual(p.source,old.source);assert.equal(p.nativeCaseSha256,old.nativeCaseSha256);assert.deepEqual(p.nativeInventory,old.nativeInventory);
 assert.deepEqual(p.observations.map(o=>o.query),old.observations.observations.map(o=>o.query));assert.equal(p.observations.length,v.queries);
 const g=graphOf(p);for(const o of p.observations){assert.equal(o.recordedAndNative,'PASS');assert.equal(o.stats.length,4);for(const s of o.stats){stats(s);report.peakCorpusStates=Math.max(report.peakCorpusStates,s.states);report.peakCorpusPending=Math.max(report.peakCorpusPending,s.peakPending);}
  const q=o.query,n=A.walk(g,{root:q.beforeRoot,slots:q.path}),expected=A.walk(g,{root:q.afterRoot,slots:q.path}),built=F.exchange(g,n);assert(F.equal(built,built.roots[0],g,expected));report.exchangeSteps++;
 }report.profiles++;
}
assert.equal(report.exchangeSteps,100);
report.files=Object.fromEntries(['check.cjs','../expr-reference-laws/model.cjs','../binder-support/model.cjs','../binder-computation-exchange/model.cjs','../../../public/js/proof-atlas-library-data.js','../expr-reference-laws/native-check.json.gz'].map(n=>path.posix.normalize(base+n)).concat([...inventories.keys()]).map(f=>[f,hash(f)]));
report.scope='Three general protected-subtree laws; finite row/depth evaluator refinement on 476 raw controls, 100 frozen exchanges and one 107044-row authored typed value program. A deliberately wrong row-only cache retains typing but changes kernel meaning. No general evaluator/codec proof, AI stress benchmark or human comprehension claim.';
const output=Buffer.from(JSON.stringify(report,null,2)+'\n');
if(freeze){for(const[name,data]of Object.entries({controls,stress,corpus}))fs.writeFileSync(base+name+'.json.gz',z.gzipSync(Buffer.from(JSON.stringify(data)+'\n')));fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(output));}
else assert(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz')).equals(output));
console.log(JSON.stringify(report));
