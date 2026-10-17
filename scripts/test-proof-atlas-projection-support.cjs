/* Compare complete native free-index sets with bounded scope summaries. Not a typing check. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const I=require('../public/js/proof-atlas-scope-interfaces'),P=require('../public/js/proof-atlas-context-projection'),w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/projection-support-manifest.js','utf8'),{window:w});
const d=w.PROOF_ATLAS_PROJECTION_SUPPORT,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=z.gunzipSync(fs.readFileSync('.'+d.file));assert(raw.length<=8*1024**2);assert.equal(raw.length,d.decodedBytes);assert.equal(sha(raw),d.sha256);
assert.equal(d.file,'/public/data/proof-atlas/projection-support/'+d.sha256+'.json.gz');
const data=JSON.parse(raw),base='research/proof-atlas/',folder=base+'context-projection/';
assert.equal(data.format,'ProofAtlasProjectionSupport/1');assert.equal(data.leanVersion,'4.33.1');
assert.deepEqual(data.theorems.map(t=>t.name),['project_supported','needed_bound','needed_zero_iff','maximum_is_not_support'].map(n=>'ProofAtlas.Projection.'+n));
for(const t of data.theorems){assert(t.axioms.every(a=>['propext','Quot.sound','Classical.choice'].includes(a)));for(const k of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(t[k],'PASS');}
const files=[base+'ExportLibrary.lean',...['Projection.lean','Fixtures.lean','Support.lean','SupportFixtures.lean','verify_support.py','verify.py'].map(f=>folder+f)];
assert.deepEqual(Object.keys(data.producer.sourceFiles).sort(),files.sort());
for(const [f,h]of Object.entries(data.producer.sourceFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
const read=f=>fs.readFileSync(f,'utf8');
const runtime=read(base+'ExportLibrary.lean').replace('import SE2Conjugate','')+'\n'+read(folder+'Projection.lean').replace('import Lean\n','')+'\n'+read(folder+'Support.lean')+'\n'+read(folder+'Fixtures.lean')+'\n'+read(folder+'SupportFixtures.lean');
assert.equal(sha(runtime),data.producer.runtimeSha256);assert.equal(sha(read(folder+'verify_support.py')),data.producer.driverSha256);
const mask=indices=>indices.reduce((a,i)=>a|1n<<BigInt(i),0n).toString(16);
const dummy={kind:[3],children:[[]],payloads:[{level:{kind:'zero'}}],expanded:['1'],neededScope:[0]};
let sourceNodes=0,summaryChecks=0,withheld=0,unresolvedChecks=0,selections=0,accepted=0,rejected=0;
const kinds=new Set();
function auditSource(source){
 const {graph,nodes}=source;assert.equal(nodes.length,graph.kind.length);sourceNodes+=nodes.length;graph.kind.forEach(k=>kinds.add(k));
 for(const [i,n]of nodes.entries()){
  assert.equal(n.node,i);assert.equal(n.needed,graph.neededScope[i]);assert.deepEqual(n.support,[...new Set(n.support)].sort((a,b)=>a-b));
  assert.equal(n.needed,n.support.length?Math.max(...n.support)+1:0);
  assert.equal(n.needed===0,n.support.length===0);
 }
 for(const width of [1,2,4,512]){
  const computed=I.compute(graph,width);assert.equal(computed.rows.length,nodes.length);
  for(const n of nodes){const [actual,unresolved]=computed.rows[n.node];assert.equal(unresolved,n.unresolvedTermIds);unresolvedChecks++;
   if(actual===null){withheld++;assert(n.needed>0);}else{assert.equal(actual,mask(n.support));summaryChecks++;}
   if(n.needed===0)assert.equal(actual,'0','Closed free-index region must have empty support, even with unavailable child summaries');
   if(n.needed>width)assert.equal(actual,null);
  }
 }
}
assert.equal(data.cases.length,115);assert.equal(data.extras.length,5);
for(const c of data.cases){assert.equal(c.kernelTypingClaim,false);auditSource(c.source);
 const root=c.source.graph.roots[0],uses=c.source.nodes[root].support;
 assert.equal(c.source.nodes[root].needed<=c.depth,uses.every(i=>i<c.depth));
 for(const s of c.selections){selections++;
  const covered=uses.every(i=>i<c.depth&&s.keptSlots.includes(c.depth-1-i));assert.equal(covered,s.defined);
  const model=P.create(c.source.graph,dummy);
  if(s.defined){model.root('source',root,c.depth,s.keptSlots,mask(uses));accepted++;}
  else{assert.throws(()=>model.root('source',root,c.depth,s.keptSlots,mask(uses)),e=>e instanceof P.ContextProjectionError&&/omitted required ambient slot|escaped support/.test(e.message));rejected++;}
 }
}
for(const c of data.extras){assert.equal(c.kernelTypingClaim,false);auditSource(c.source);}
assert.deepEqual([...kinds].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
// This is a counterexample to maximum-only validation, not a valid authenticated input.
const outer=data.extras.find(c=>c.label==='single-outer').source,extra=data.extras.find(c=>c.label==='same-maximum-extra-inner').source;
const outerRoot=outer.graph.roots[0],extraRoot=extra.graph.roots[0];
assert.equal(outer.nodes[outerRoot].needed,3);assert.equal(extra.nodes[extraRoot].needed,3);
assert.deepEqual(outer.nodes[outerRoot].support,[2]);assert.deepEqual(extra.nodes[extraRoot].support,[0,2]);
const correct=I.compute(extra.graph,512).rows[extraRoot][0];assert.equal(correct,'5');
assert.throws(()=>P.create(extra.graph,dummy).root('source',extraRoot,3,[0],correct),P.ContextProjectionError);
const forged=P.create(extra.graph,dummy),forgedRoot=forged.root('source',extraRoot,3,[0],'4');
assert.equal(forged.graph.neededScope[forgedRoot],1,'A matching maximum alone can pass the coarse root check');
assert.throws(()=>{const todo=[forgedRoot],seen=new Set();while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);void forged.graph.payloads[id];todo.push(...forged.graph.children[id]);}},e=>e instanceof P.ContextProjectionError&&/omitted required ambient slot/.test(e.message));
const deep=data.extras.find(c=>c.label==='closed-beyond-width').source,deepSummary=I.compute(deep.graph,4);
assert.equal(deep.nodes[deep.graph.roots[0]].needed,0);assert.equal(deepSummary.rows[deep.graph.roots[0]][0],'0');assert(deepSummary.rows.some(r=>r[0]===null));
assert.equal(selections,713);assert.equal(accepted,421);assert.equal(rejected,292);
const report={status:'PASS',generalLeanTheorems:4,sourceCases:115,extraCases:5,sourceNodes,availableSummaryChecks:summaryChecks,withheldSummaries:withheld,unresolvedTermChecks:unresolvedChecks,retainedSelections:selections,accepted,rejected,maximumOnlyCounterexample:true,correctMaskRejectsBeforeExpansion:true,forgedMaskFailsOnExpansion:true,zeroShortcutWithUnavailableChildren:true,constructorKinds:12,scope:'The laws concern free de Bruijn indices in the specified Lean Expr function. Finite checks compare the existing scope producer and projection guard. Authenticated exact summaries and validated source fields remain preconditions; no typing or kernel-closure claim.'};
fs.writeFileSync('/tmp/atlas-projection-support.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
