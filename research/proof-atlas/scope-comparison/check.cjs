'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const C=require('./model.cjs'),A=require('../../../public/js/proof-atlas-library-data'),E=require('../../../public/js/proof-atlas-equality-transport'),S=require('../network-streaming/pack.cjs');
const K=require('./certificate.cjs');
const copy=x=>JSON.parse(JSON.stringify(x)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
function graph(){return{kind:[],payloads:[],children:[],expanded:[],neededScope:[]};}
function add(g,kind,payload,children=[]){const n=g.kind.length;g.kind.push(kind);g.payloads.push(payload);g.children.push(children);g.expanded.push((1n+children.reduce((sum,id)=>sum+BigInt(g.expanded[id]),0n)).toString());g.neededScope.push(kind===0?payload.index+1:Math.max(0,...children.map((id,slot)=>g.neededScope[id]-(((kind===6||kind===7)&&slot===1||kind===8&&slot===2)?1:0))));return n;}
function annotated(g){const out=graph();for(let row=0;row<g.kind.length;row++)add(out,g.kind[row],copy(g.payloads[row]),[...g.children[row]]);return out;}
function checkWitness(left,leftRoot,right,rightRoot,shift,result){
 assert.equal(result.witness?.status,'located');let i=leftRoot,j=rightRoot,depth=0;
 for(const slot of result.witness.slots){const kind=left.kind[i];assert.equal(kind,right.kind[j]);if((kind===6||kind===7)&&slot===1||kind===8&&slot===2)depth++;i=left.children[i][slot];j=right.children[j][slot];}
 assert.equal(i,result.leftNode);assert.equal(j,result.rightNode);assert.equal(depth,result.witness.binders);assert.equal(left.kind[i],0);assert.equal(right.kind[j],0);assert.notEqual(left.payloads[i].index+(left.payloads[i].index>=depth?shift:0),right.payloads[j].index);
}
// Independent path/depth fingerprint, used only where its state budget fits.
function fingerprint(g,root,shift=0){
 const memo=new Map(),stack=[[root,0,false]],key=(id,depth)=>id+':'+(shift?depth:0);
 while(stack.length){const [id,depth,finish]=stack.pop(),tag=key(id,depth);if(memo.has(tag))continue;
  const kind=g.kind[id],cs=g.children[id],depthAt=slot=>depth+((kind===6||kind===7)&&slot===1||kind===8&&slot===2?1:0);
  if(!finish){stack.push([id,depth,true]);for(let slot=0;slot<cs.length;slot++)if(!memo.has(key(cs[slot],depthAt(slot))))stack.push([cs[slot],depthAt(slot),false]);}
  else{const payload=copy(g.payloads[id]);if(kind===0&&payload.index>=depth)payload.index+=shift;
   memo.set(tag,sha(Buffer.from(JSON.stringify([kind,canonical(payload),cs.map((child,slot)=>memo.get(key(child,depthAt(slot))))]))));assert(memo.size<=262144,'oracle state limit');}
 }return memo.get(key(root,0));
}
// Separate row/depth producer. Closed subexpressions use their original copy.
function liftGraph(source,root,amount){
 const target=graph(),memo=new Map();
 function visit(id,cutoff){
  cutoff=Math.min(cutoff,source.neededScope[id]);const tag=id+':'+cutoff;if(memo.has(tag))return memo.get(tag);
  const kind=source.kind[id],p=copy(source.payloads[id]);if(kind===0&&p.index>=cutoff)p.index+=amount;
  const cs=source.children[id].map((child,slot)=>visit(child,cutoff+((kind===6||kind===7)&&slot===1||kind===8&&slot===2?1:0)));
  const result=add(target,kind,p,cs);memo.set(tag,result);return result;
 }return{g:target,root:visit(root,0)};
}
const report={format:'ProofAtlasScopeComparisonExperiment/1',status:'RUNNING',nativeProfiles:0,nativeInputs:0,contextExtensions:0,peakNativePairs:0,randomPositive:0,randomNegative:0,certificatesChecked:0,certificateRows:0,adversarial:[],scale:[],cases:[]};
function certified(left,leftRoot,right,rightRoot,shift){
 const result=C.compare(left,leftRoot,right,rightRoot,shift,{includeCertificate:true});assert.equal(result.status,'same');
 K.check(left,leftRoot,right,rightRoot,shift,result.certificate);report.certificatesChecked++;report.certificateRows+=result.certificate.rows.length;
 const digest=sha(Buffer.from(JSON.stringify(result.certificate)));delete result.certificate;return{...result,certificateSha256:digest};
}
const host={};for(const name of ['network-streaming-manifest','application-region-controls-manifest','inventory-region-controls-manifest','premise-source-controls-manifest','rule-support-controls-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:host});
const records=[...host.PROOF_ATLAS_NETWORK_STREAMING.records,...host.PROOF_ATLAS_APPLICATION_REGION_CONTROLS.records,...host.PROOF_ATLAS_INVENTORY_REGION_CONTROLS.records,...host.PROOF_ATLAS_PREMISE_SOURCE_CONTROLS.records,...host.PROOF_ATLAS_RULE_SUPPORT_CONTROLS.records];
for(const record of records.filter(record=>record.mode==='native')){
 const native=S.read(record.owner);report.nativeProfiles++;
 for(const entry of native.entries){const j=entry.junction,g=j.graph,shift=j.consumer.context.length-j.producer.context.length;
  const result=certified(g,j.roots.producerType,g,j.roots.producerTypeInConsumer,shift);
  assert.equal(result.status,'same');assert.equal(j.checks.literalTypeWeakening,true);assert(E.equal(g,j.roots.producerType,g,j.roots.producerTypeInConsumer,shift));
  assert.equal(fingerprint(g,j.roots.producerType,shift),fingerprint(g,j.roots.producerTypeInConsumer));
  report.nativeInputs++;if(shift)report.contextExtensions++;report.peakNativePairs=Math.max(report.peakNativePairs,result.pairs);
  report.cases.push({owner:record.owner.sha256,source:record.source,input:entry.id,producerContext:j.producer.context.length,consumerContext:j.consumer.context.length,result});
 }
}
assert.equal(report.nativeProfiles,42);assert.equal(report.nativeInputs,877);assert.equal(report.contextExtensions,37);

// Deterministic small graphs, with every selected root and listed shift.
let seed=0x51c0ffee;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
const payload=kind=>({0:{index:random(4)},1:{id:'f'},2:{id:'m'},3:{level:{kind:'zero'}},4:{name:'P',levels:[]},5:{},6:{binderName:'x',binderInfo:'default'},7:{binderName:'x',binderInfo:'implicit'},8:{declName:'x',nondep:false},9:{literalKind:'natVal',value:'7'},10:{metadata:[{key:'scope-control',value:{kind:'ofBool',value:true}}]},11:{typeName:'Product',index:0}}[kind]);
const kinds=new Set();
for(let example=0;example<256;example++){
 const source=graph();add(source,0,{index:random(4)});
 for(let row=1;row<16;row++){const kind=random(12),arity=(A.fields[A.kinds[kind]]||[]).length;kinds.add(kind);add(source,kind,payload(kind),Array.from({length:arity},()=>random(row)));}
 for(let root=0;root<source.kind.length;root++)for(const shift of [0,1,3]){
  const lifted=liftGraph(source,root,shift),correct=certified(source,root,lifted.g,lifted.root,shift);assert.equal(correct.status,'same');assert.equal(fingerprint(source,root,shift),fingerprint(lifted.g,lifted.root));report.randomPositive++;
  const bad=copy(lifted.g),leaf=bad.kind.findIndex(k=>k===0);
  if(leaf>=0){bad.payloads[leaf].index++;const target=annotated(bad),expected=fingerprint(source,root,shift)===fingerprint(target,lifted.root),result=C.compare(source,root,target,lifted.root,shift);assert.equal(result.status,expected?'same':'different');if(!expected){checkWitness(source,root,target,lifted.root,shift,result);report.randomNegative++;}}
 }
}
assert.deepEqual([...kinds].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));report.syntaxConstructorKinds=[...kinds].sort((a,b)=>a-b);

function refusal(name,source,root,target,targetRoot,shift){target=annotated(target);const result=C.compare(source,root,target,targetRoot,shift);assert.equal(result.status,'different');assert.equal(fingerprint(source,root,shift)===fingerprint(target,targetRoot),false);checkWitness(source,root,target,targetRoot,shift,result);report.adversarial.push({name,result});return result;}
// One shared variable is external on one path and local on another.
{
 const g=graph(),v=add(g,0,{index:0}),type=add(g,4,{name:'P',levels:[]}),lam=add(g,6,{binderName:'x',binderInfo:'default'},[type,v]),root=add(g,5,{},[v,lam]);
 for(const [name,index]of [['shift-every-use',1],['shift-no-use',0]]){const bad=copy(g);bad.payloads[v].index=index;refusal(name,g,root,bad,root,1);}
 const exact=liftGraph(g,root,1);assert.equal(C.compare(g,root,exact.g,exact.root,1).status,'same');
 // Lambda domains and let values precede the binder; only bodies extend it.
 for(const kind of [6,7,8]){const source=graph(),b=add(source,0,{index:0}),r=add(source,kind,payload(kind),kind===8?[b,b,b]:[b,b]),target=liftGraph(source,r,2);assert.equal(C.compare(source,r,target.g,target.root,2).status,'same');
  const wrong=copy(target.g),slot=kind===8?1:0;wrong.children[target.root][slot]=wrong.children[target.root][kind===8?2:1];const result=refusal('binder-acquires-own-'+(kind===8?'value':'domain')+'-'+kind,source,r,wrong,target.root,2);assert.equal(result.witness.slots[0],slot);}
}
// Large DAGs are syntax data, not asserted to be well-typed proofs.
for(const index of [null,0,512]){
 const source=graph();let root=index===null?add(source,4,{name:'P',levels:[]}):add(source,0,{index});const type=add(source,4,{name:'T',levels:[]});
 for(let layer=0;layer<512;layer++){const body=add(source,6,{binderName:'x',binderInfo:'default'},[type,root]);root=add(source,5,{},[root,body]);}
 // At most 512 local binders occur on any path. For index 512 every
 // reference stays external, so this target is an independent uniform lift.
 let shifted;
 if(index===512){const g=graph();for(let row=0;row<source.kind.length;row++){const p=copy(source.payloads[row]);if(source.kind[row]===0)p.index++;add(g,source.kind[row],p,[...source.children[row]]);}shifted={g,root};}
 else shifted=liftGraph(source,root,1);
 const result=certified(source,root,shifted.g,shifted.root,1);assert.equal(result.status,'same');assert(result.pairs<=source.kind.length*2);if(index===512)assert(result.maximumLocalDepth<=index);
 assert.throws(()=>E.equal(source,root,shifted.g,shifted.root,1),/comparison work bound/);
 assert.equal(C.compare(source,root,shifted.g,shifted.root,1,{pairLimit:8}).status,'unavailable');
 report.scale.push({leaf:index===null?'closed-constant':'bvar '+index,sourceRows:source.kind.length,targetRows:shifted.g.kind.length,expandedOccurrences:source.expanded[root],result,legacyResult:'work-budget-exceeded',mathematicalTyping:'not-asserted'});
}
const small=graph();add(small,0,{index:0});for(const shift of [-1,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>C.compare(small,0,small,0,shift));for(const pairLimit of [0,NaN,262145])assert.throws(()=>C.compare(small,0,small,0,0,{pairLimit}));
const cyclic=copy(small);cyclic.kind[0]=5;cyclic.payloads[0]={};cyclic.children[0]=[0,0];assert.throws(()=>C.compare(cyclic,0,cyclic,0),/postorder child/);report.invalidInputsRefused=8;
{
 const source=graph(),v=add(source,0,{index:0}),type=add(source,4,{name:'P',levels:[]}),root=add(source,6,{binderName:'x',binderInfo:'default'},[type,v]),target=liftGraph(source,root,1);
 const cert=C.compare(source,root,target.g,target.root,1,{includeCertificate:true}).certificate;K.check(source,root,target.g,target.root,1,cert);
 const changes=[c=>c.rows[c.root].minimum=1,c=>c.rows[c.root].children.reverse(),c=>c.rows.find(r=>source.kind[r.left]===0).minimum=0,c=>c.rows.push(copy(c.rows[0]))];
 for(const change of changes){const bad=copy(cert);change(bad);assert.throws(()=>K.check(source,root,target.g,target.root,1,bad));}report.damagedCertificatesRefused=changes.length;
 const permutation=[2,0,4],values=[0,1,2].map(depth=>permutation[2-depth]+depth);
 assert.equal(new Set(permutation).size,permutation.length);assert.deepEqual(values,[4,1,4]);
 report.reorderedContextCounterexample={injectiveMap:permutation,sourceIndex:2,depths:[0,1,2],targetIndices:values,endpointsMatch:4,interiorMatches:false,withinUniformShiftRule:false};
}
report.witnessBoundaries=[];
for(const depth of [512,513]){
 const source=graph();let root=add(source,0,{index:depth});const type=add(source,4,{name:'P',levels:[]});
 for(let index=0;index<depth;index++)root=add(source,6,{binderName:'x',binderInfo:'default'},[type,root]);
 // The leaf remains external at exactly this depth; unchanged indices fail.
 const result=C.compare(source,root,source,root,1);assert.equal(result.status,'different');
 if(depth===512)checkWitness(source,root,source,root,1,result);
 else{assert.equal(result.witness.status,'unavailable');assert.equal(result.witness.reason,'selection-path-bound');assert.equal(result.witness.pathLength,513);assert(!Object.hasOwn(result.witness,'slots'));}
 report.witnessBoundaries.push({depth,result});
}
report.files=Object.fromEntries(['research/proof-atlas/scope-comparison/model.cjs','research/proof-atlas/scope-comparison/certificate.cjs','research/proof-atlas/scope-comparison/check.cjs','public/js/proof-atlas-library-data.js','public/js/proof-atlas-equality-transport.js'].map(file=>[file,sha(fs.readFileSync(file))]));
report.status='PASS';report.scope='Finite agreement with recorded native weakens and an independent depth-sensitive structural oracle. Every positive comparison also passes a separate local certificate gate. General Expr certificate laws are checked separately; no general JavaScript/JSON refinement, new mathematical typing or comprehension claim.';
assert(process.argv[2],'temporary report filename required');fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,cases:undefined,files:undefined}));
