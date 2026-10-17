/* General Lean laws and finite comparisons with the existing browser closure. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),D=require('../public/js/proof-atlas-dependent-interface'),w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/context-closure-manifest.js','utf8'),{window:w});const descriptor=w.PROOF_ATLAS_CONTEXT_CLOSURE,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(descriptor.format,'ProofAtlasContextClosureDescriptor/1');assert.equal(descriptor.file,'/public/data/proof-atlas/context-closure/'+descriptor.sha256+'.json.gz');const raw=z.gunzipSync(fs.readFileSync('.'+descriptor.file),{maxOutputLength:8*1024**2});assert.equal(sha(raw),descriptor.sha256);assert.equal(raw.length,descriptor.decodedBytes);const data=JSON.parse(raw);
assert.equal(data.format,'ProofAtlasContextClosure/1');assert.equal(data.leanVersion,'4.33.1');assert.deepEqual(data.theorems.map(t=>t.name),['close_preserves','close_minimal','close_bounded','close_closed','close_idempotent','close_union'].map(n=>'ProofAtlas.ContextClosure.'+n));
for(const t of data.theorems){assert(t.axioms.every(a=>['propext','Quot.sound'].includes(a)));for(const key of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(t[key],'PASS');}
const base='research/proof-atlas/',folder=base+'context-closure/',files=[folder+'Closure.lean',folder+'Fixtures.lean',folder+'verify.py',base+'build_recursion_examples.py',base+'evaluate_goedel.py'];assert.deepEqual(Object.keys(data.producer.sourceFiles).sort(),files.sort());for(const [f,h]of Object.entries(data.producer.sourceFiles))assert.equal(sha(fs.readFileSync(f)),h,f);assert.equal(sha(fs.readFileSync(folder+'Closure.lean','utf8')+'\n'+fs.readFileSync(folder+'Fixtures.lean','utf8')),data.producer.runtimeSha256);
const sorted=s=>[...new Set(s)].sort((a,b)=>a-b),slots=(mask,d)=>Array.from({length:d},(_,j)=>j).filter(j=>mask&(1<<j)),toMask=(indices,depth)=>indices.reduce((m,j)=>{assert(j<depth);return m|1n<<BigInt(depth-1-j);},0n).toString(16),indexHash='1'.repeat(64),sourceHash='2'.repeat(64);
let selections=0,pairChecks=0,minimalityChecks=0,extras=0,headerEdges=0,negative=0;
// Independent work-list reachability, not a descending scan or bit-mask closure.
function reachable(c,seeds){const result=new Set(seeds),todo=[...seeds];while(todo.length){const j=todo.pop();for(const k of [...c.domains[j],...(c.values[j]||[])])if(!result.has(k)){result.add(k);todo.push(k);}}return sorted(result);}
function browser(c,term,type=[]){
 const depth=c.depth,ref=j=>({namespace:'abstract-own-fixture',node:j,path:'fixture.'+j,route:{root:0,slots:[j]}}),contexts=c.domains.map((_,slot)=>({slot,sourceBinder:ref(slot),constructor:c.values[slot]===null?'lam':'letE',payload:{binderName:'x'+slot},domain:ref(slot*3),value:c.values[slot]===null?null:ref(slot*3+1)})),source={...ref(depth*3),indexSha256:indexHash,sourceSha256:sourceHash},requests=[source.node],summaries=[];
 const summary=(node,indices,d)=>({node,indexSha256:indexHash,sourceSha256:sourceHash,width:512,mask:toMask(indices,d),unresolved:false});summaries.push(summary(source.node,term,depth));
 for(const cxt of contexts){requests.push(cxt.domain.node);summaries.push(summary(cxt.domain.node,c.domains[cxt.slot],cxt.slot));if(cxt.value){requests.push(cxt.value.node);summaries.push(summary(cxt.value.node,c.values[cxt.slot],cxt.slot));}}
 const plan={format:'ProofAtlasDependentInterfacePlan/1',source,nativeType:{namespace:'abstract-own-fixture',typingClaim:false},universeContext:{minimized:false},depth,contexts,typeMask:toMask(type,depth),requests};
 return{plan,summaries,model:D.complete(plan,summaries)};
}
assert.equal(data.cases.length,76);assert.equal(data.extras.length,6);const byDepth=[0,0,0,0,0];
for(const c of [...data.cases,...data.extras]){
 assert.equal(c.kernelTypingClaim,false);assert.equal(c.domains.length,c.depth);assert.equal(c.values.length,c.depth);for(let j=0;j<c.depth;j++)for(const k of [...c.domains[j],...(c.values[j]||[])])assert(k<j);
 const small=data.cases.includes(c);if(small)byDepth[c.depth]++;
 for(const r of c.rows){const expected=reachable(c,r.seeds);assert.deepEqual(r.retained,expected);const {model}=browser(c,r.seeds);assert.deepEqual(model.retainedSlots,expected);assert.deepEqual(browser(c,expected).model.retainedSlots,expected);assert.equal(model.reducedContextTyping,'not-checked-by-this-operation');assert.equal(model.sharedTyping,'not-derived');
  for(const j of model.retainedSlots)for(const k of [...c.domains[j],...(c.values[j]||[])]){assert(model.retainedSlots.includes(k));headerEdges++;}
  if(small){selections++;for(let mask=0;mask<2**c.depth;mask++){const candidate=new Set(slots(mask,c.depth));if(!r.seeds.every(j=>candidate.has(j))||![...candidate].every(j=>[...c.domains[j],...(c.values[j]||[])].every(k=>candidate.has(k))))continue;assert(expected.every(j=>candidate.has(j)));minimalityChecks++;}}
  else extras++;
 }
 if(small)for(let a=0;a<c.rows.length;a++)for(let b=0;b<c.rows.length;b++){
  const expected=sorted([...c.rows[a].retained,...c.rows[b].retained]);assert.deepEqual(c.rows[a|b].retained,expected);assert.deepEqual(browser(c,c.rows[a].seeds,c.rows[b].seeds).model.retainedSlots,expected);pairChecks++;
 }
}
assert.deepEqual(byDepth,[1,1,2,8,64]);assert.equal(selections,1099);assert.equal(pairChecks,16933);assert.equal(extras,8);
// Why the earlier-header condition and descending order cannot be dropped.
const chain={depth:3,domains:[[],[0],[1]],values:[null,null,null]},native=reachable(chain,[2]),ascending=new Set([2]);for(let j=0;j<3;j++)if(ascending.has(j))for(const k of chain.domains[j])ascending.add(k);assert.deepEqual(native,[0,1,2]);assert.deepEqual(sorted(ascending),[1,2]);
for(const change of [p=>p.summaries[1].mask='1',p=>p.plan.typeMask='8',p=>p.summaries[0].unresolved=true,p=>p.summaries[0].mask=null,p=>p.summaries[1].sourceSha256='0'.repeat(64)]){const p=browser(chain,[2]);change(p);assert.throws(()=>D.complete(p.plan,p.summaries),D.DependentInterfaceError);negative++;}
const report={status:'PASS',generalLeanTheorems:6,orderedGraphs:76,seedSelections:selections,unionCompositionPairs:pairChecks,leastClosedSupersetChecks:minimalityChecks,extraSelections:extras,headerEdgeChecks:headerEdges,negativeControls:negative,ascendingCounterexample:true,largestContext:512,scope:'General theorems concern the explicit ordered dependency-list closure. Finite comparisons use abstract own interfaces, not source Expr or new typing observations. Existing source-support and native module checks remain separate. No proof of the JavaScript implementation, logical necessity or comprehension.'};fs.writeFileSync('/tmp/atlas-context-closure.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
