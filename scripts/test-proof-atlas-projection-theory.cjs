/* Finite comparison of the lazy JS model with the separately proved Lean function. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const P=require('../public/js/proof-atlas-context-projection'),w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/projection-theory-manifest.js','utf8'),{window:w});
const descriptor=w.PROOF_ATLAS_PROJECTION_THEORY,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const fields=['kind','payloads','children','expanded','neededScope'];
const binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
const raw=z.gunzipSync(fs.readFileSync('.'+descriptor.file));
assert.equal(descriptor.file,'/public/data/proof-atlas/projection-theory/'+descriptor.sha256+'.json.gz');
assert(raw.length<=8*1024**2);assert.equal(sha(raw),descriptor.sha256);assert.equal(raw.length,descriptor.decodedBytes);
const evidence=JSON.parse(raw);
assert.equal(evidence.format,'ProofAtlasProjectionTheory/1');assert.equal(evidence.leanVersion,'4.33.1');
const theoremNames=['project_roundtrip','project_occurrences','selected_context_roundtrip','project_compose','project_injective','liftN_below','liftN_above'];
assert.deepEqual(evidence.theorems.map(t=>t.name),theoremNames.map(n=>'ProofAtlas.Projection.'+n));
for(const t of evidence.theorems){assert(t.axioms.every(a=>['propext','Quot.sound'].includes(a)));for(const k of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(t[k],'PASS');}
const prefix='research/proof-atlas/';
const producerFiles=['context-projection/Projection.lean','context-projection/Fixtures.lean','context-projection/verify.py','ExportLibrary.lean'].map(f=>prefix+f);
assert.deepEqual(Object.keys(evidence.producer.sourceFiles).sort(),producerFiles.sort());
for(const [f,h]of Object.entries(evidence.producer.sourceFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
const core=fs.readFileSync(prefix+'ExportLibrary.lean','utf8').replace('import SE2Conjugate','');
const theory=fs.readFileSync(prefix+'context-projection/Projection.lean','utf8').replace('import Lean\n','');
assert.equal(sha(core+'\n'+theory+'\n'+fs.readFileSync(prefix+'context-projection/Fixtures.lean','utf8')),evidence.producer.runtimeSha256);
assert.equal(sha(fs.readFileSync(prefix+'context-projection/verify.py')),evidence.producer.driverSha256);

function support(g){
 let bits=0n;const todo=[{id:g.roots[0],cutoff:0}],seen=new Set();
 while(todo.length){const {id,cutoff}=todo.pop(),key=id+':'+cutoff;if(seen.has(key))continue;seen.add(key);assert(seen.size<4096);
  if(g.kind[id]===0){const i=g.payloads[id].index;if(i>=cutoff)bits|=1n<<BigInt(i-cutoff);}
  for(const [j,c]of g.children[id].entries())todo.push({id:c,cutoff:cutoff+(binds(g.kind[id],j)?1:0)});
 }
 return bits.toString(16);
}
const dummy={kind:[3],children:[[]],payloads:[{level:{kind:'zero'}}],expanded:['1'],neededScope:[0]};
let peakTuples=0,peakStates=0,peakBytes=0;
function project(source,depth,kept){
 const model=P.create(source,dummy);
 try{
  const root=model.root('source',source.roots[0],depth,kept,support(source)),out={roots:[root],...Object.fromEntries(fields.map(f=>[f,[]]))},todo=[root],seen=new Set();
  while(todo.length){const id=todo.pop();if(seen.has(id))continue;seen.add(id);assert(seen.size<=4096);for(const f of fields)out[f][id]=model.graph[f][id];todo.push(...out.children[id]);}
  model.seal();for(const id of seen)for(const f of fields)assert.deepEqual(model.graph[f][id],out[f][id]);
  const state=model.state();assert(state.sealed);peakTuples=Math.max(peakTuples,state.preparedSourceTuples);peakStates=Math.max(peakStates,state.virtualStates);peakBytes=Math.max(peakBytes,state.preparedSourceDecodedBytes);
  return {data:out,reference:model.reference};
 }catch(error){
  assert(error instanceof P.ContextProjectionError);
  assert(/omitted required ambient slot|escaped support/.test(error.message),error.message);
  return null;
 }
}

function same(actual,expected){
 if(!expected){assert.equal(actual,null);return;}
 assert(actual);const g=actual.data,pairs=[[g.roots[0],expected.roots[0]]],seen=new Set();
 while(pairs.length){const [i,j]=pairs.pop(),key=i+':'+j;if(seen.has(key))continue;seen.add(key);
  for(const f of ['kind','payloads','expanded','neededScope'])assert.deepEqual(g[f][i],expected[f][j],f+' at '+key);
  assert.equal(g.children[i].length,expected.children[j].length);
  for(let k=0;k<g.children[i].length;k++)pairs.push([g.children[i][k],expected.children[j][k]]);
 }
}

let primarySuccess=0,primaryRejected=0,compositionSelections=0,compositionSuccess=0,ambientVariables=0,internalVariables=0,changedIndices=0;
const kinds=new Set();
assert.equal(evidence.rows.length,713);
for(const row of evidence.rows){
 assert.equal(row.kernelTypingClaim,false);row.source.kind.forEach(k=>kinds.add(k));
 const actual=project(row.source,row.depth,row.keptSlots);same(actual,row.projected);
 if(!row.projected){primaryRejected++;assert.equal(row.second.length,0);continue;}
 primarySuccess++;
 const g=actual.data,keptIndices=[...row.keptSlots].reverse().map(s=>row.depth-1-s),todo=[{source:row.source.roots[0],target:g.roots[0],cutoff:0}];let visits=0;
 while(todo.length){const at=todo.pop();assert(++visits<4096);const k=row.source.kind[at.source],ref=actual.reference(at.target);
  assert.equal(ref.node,at.source);assert.equal(ref.cutoff,at.cutoff);assert.equal(ref.originalDepth,row.depth);assert.deepEqual(ref.retainedSlots,row.keptSlots);
  if(k===0){const before=row.source.payloads[at.source].index,after=g.payloads[at.target].index;
   if(before<at.cutoff){assert.equal(after,before);internalVariables++;}
   else{assert(after>=at.cutoff);assert.equal(keptIndices[after-at.cutoff],before-at.cutoff);ambientVariables++;if(after!==before)changedIndices++;}
  }
  for(const [j,c]of row.source.children[at.source].entries())todo.push({source:c,target:g.children[at.target][j],cutoff:at.cutoff+(binds(k,j)?1:0)});
 }
 assert.equal(row.second.length,2**row.keptSlots.length);
 for(const next of row.second){
  const twice=project(actual.data,row.keptSlots.length,next.keptSlots),combined=next.keptSlots.map(i=>row.keptSlots[i]),direct=project(row.source,row.depth,combined);
  same(twice,next.projected);same(direct,next.projected);compositionSelections++;if(next.projected)compositionSuccess++;
 }
}
assert.deepEqual([...kinds].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
assert(primarySuccess>0&&primaryRejected>0&&ambientVariables>0&&internalVariables>0&&changedIndices>0&&compositionSuccess>0);
// Invalid context maps remain unavailable, independently of whether a term needs them.
const literal=evidence.rows.find(r=>r.label==='natural-literal').source;
let rejectedMaps=0;
for(const [depth,kept]of [[2,[0,0]],[2,[1,0]],[2,[-1]],[2,[2]]]){assert.throws(()=>P.create(literal,dummy).root('source',literal.roots[0],depth,kept,'0'),P.ContextProjectionError);rejectedMaps++;}
const report={status:'PASS',generalLeanTheorems:7,primaryRows:evidence.rows.length,primarySuccess,primaryRejected,compositionSelections,compositionSuccess,ambientVariableChecks:ambientVariables,internalVariableChecks:internalVariables,changedIndices,rejectedMaps,peakPreparedTuples:peakTuples,peakPreparedBytes:peakBytes,peakVirtualStates:peakStates,constructorKinds:12,scope:'General proofs concern the explicit Lean Expr function. This is a finite comparison with the bounded lazy JavaScript projection, not a proof of that implementation, metadata interpretation or typing preservation.'};
fs.writeFileSync('/tmp/atlas-projection-theory.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
