'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data'),M=require('./model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/boundary-constraints/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),copy=x=>JSON.parse(JSON.stringify(x));
const native=read(base+'native.json.gz'),verification=read(base+'verification.json.gz'),controls=read(base+'controls.json.gz'),controlVerification=read(base+'control-verification.json.gz');
for(const[file,report]of[[base+'native.json.gz',verification],[base+'controls.json.gz',controlVerification]]){
 assert.equal(report.status,'PASS');assert.equal(sha(z.gunzipSync(fs.readFileSync(file))),report.nativeSha256);
 for(const[f,h]of Object.entries(report.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
}
const parents=new Map();for(const[file,h]of Object.entries(verification.parents)){
 const raw=z.gunzipSync(fs.readFileSync(file));assert.equal(sha(raw),h);for(const p of JSON.parse(raw).profiles)parents.set(p.source.indexSha256,p);
}
function graph(g){
 const n=g.kind.length;assert(n>0&&n<=131072);for(const field of['children','payloads','expanded','neededScope'])assert.equal(g[field].length,n);
 for(let id=0;id<n;id++){
  const k=g.kind[id],cs=g.children[id];assert(Number.isInteger(k)&&k>=0&&k<12);assert.equal(cs.length,(A.fields[A.kinds[k]]||[]).length);assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<id));
  assert.equal(1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n),BigInt(g.expanded[id]));
  const needed=k===0?g.payloads[id].index+1:Math.max(0,...cs.map((c,s)=>g.neededScope[c]-Number((k===6||k===7)&&s===1||k===8&&s===2)));assert.equal(needed,g.neededScope[id]);
 }
 assert(g.roots.every(r=>Number.isInteger(r)&&r>=0&&r<n));
}
const files=[base+'check.cjs',base+'model.cjs',base+'native.json.gz',base+'verification.json.gz',base+'controls.json.gz',base+'control-verification.json.gz','research/proof-atlas/method-context/catalogue.cjs','public/js/proof-atlas-library-data.js',...Object.keys(verification.parents),...native.profiles.map(p=>p.record.indexFile.slice(1))],fingerprints=()=>Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))])),initial=fingerprints();
const report={format:'ProofAtlasBoundaryConstraintModel/1',status:'RUNNING',profiles:0,candidates:0,accepted:0,rejected:0,unchangedFunctions:0,newlyAccepted:0,acceptedDerivedInputs:0,partialDerivedInputs:0,peakRows:0,refusals:0,cases:[],files:{}};
function allGraphs(c){if(c.graph)graph(c.graph);if(c.detail)graph(c.detail);for(const b of c.bindings)graph(b.graph);for(const r of c.constraints)graph(r.graph);}
for(const p of native.profiles){
 const parent=parents.get(p.source.indexSha256);assert(parent);for(const key of['source','record','members','order','records','commonContext','graphCheck'])assert.deepEqual(p[key],parent[key]);
 const bytes=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(bytes),p.source.indexSha256);const source=A.validateIndex(JSON.parse(bytes),p.record);
 for(const c of p.native.cases){
  const baseline=parent.native.cases.find(b=>b.policy===c.policy);assert(['PASS','KERNEL_REJECTED'].includes(c.status));assert.equal(c.constraintRule,'earlier-input-equations/1');allGraphs(c);
  const result=M.audit(source,p,c);report.candidates++;report[c.status==='PASS'?'accepted':'rejected']++;report.peakRows=Math.max(report.peakRows,result.rows);
  if(c.status==='PASS'){
   report.acceptedDerivedInputs+=result.derived;
   if(baseline.status==='PASS'){assert.deepEqual(c.graph,baseline.graph,'Earlier complete function graph changed');assert.equal(c.derivedInputs,0);report.unchangedFunctions++;}
   else{assert.equal(baseline.status,'KERNEL_REJECTED');assert(c.derivedInputs>0);report.newlyAccepted++;}
  }else{assert.equal(p.source.name,'JacobiData.slope_bound_abs');assert.equal(c.call,25);assert.equal(c.slot,4);assert.equal(c.kernelInputTypeNonconversion,'PASS');report.partialDerivedInputs+=result.derived;}
  report.cases.push({source:p.source.name,policy:c.policy,baseline:baseline.status,...result});
  if(c.constraints.length){
   for(const mutate of[
    d=>d.constraints[0].binding++,d=>d.constraints[0].contextLength++,d=>d.constraints[0].sourcePort.slot++,
    d=>d.constraints[0].graph.roots[0]=d.constraints[0].graph.roots[3],d=>d.constraints[0].graph.roots[1]=d.constraints[0].graph.roots[4],
    d=>d.constraints[0].graph.roots[5]=d.constraints[0].graph.roots[6],d=>d.constraints[0].kernelSourceSpecialization='UNKNOWN',
    d=>d.constraints[0].rootContexts[0]='original',d=>d.bindings[d.constraints[0].binding].port.constraint=99,
    d=>d.constraints.pop()
   ]){const bad=copy(c);mutate(bad);assert.throws(()=>M.audit(source,p,bad));report.refusals++;}
  }
 }
 report.profiles++;
}
assert.equal(report.profiles,10);assert.equal(report.candidates,30);assert.equal(report.accepted,29);assert.equal(report.rejected,1);assert.equal(report.unchangedFunctions,27);assert.equal(report.newlyAccepted,2);assert.equal(report.acceptedDerivedInputs,5);assert.equal(report.partialDerivedInputs,3);assert.equal(report.refusals,30);
assert.equal(controls.status,'PASS');assert.equal(controls.namespace,'authored-boundary-controls');assert.equal(controls.records.length,9);assert.equal(controls.records.filter(r=>r.accepted).length,2);for(const c of controls.records)if(c.graph)graph(c.graph);
const family=controls.records.find(r=>r.name==='constant-family-source-mismatch');assert(family.sameOriginalApplication&&family.differentSourceFunctions);assert.equal(family.refusal.reason,'source-specialization-refused');
const fg=family.graph,zero=fg.children[fg.roots[3]][1];assert.equal(fg.neededScope[zero],0);
function application(id){const args=[];while(fg.kind[id]===5){args.unshift(fg.children[id][1]);id=fg.children[id][0];}return{head:id,args};}
const numeral=application(zero);assert.equal(fg.payloads[numeral.head].name,'OfNat.ofNat');assert.equal(numeral.args.length,3);assert.equal(fg.payloads[numeral.args[0]].name,'Nat');assert.equal(fg.kind[numeral.args[1]],9);assert.equal(fg.payloads[numeral.args[1]].value,'0');const instance=application(numeral.args[2]);assert.equal(fg.payloads[instance.head].name,'instOfNatNat');assert.deepEqual(instance.args,[numeral.args[1]]);
for(const[i,root]of fg.roots.slice(3).entries()){assert.equal(fg.kind[root],5);assert.equal(fg.children[root][0],fg.roots[i]);assert.equal(fg.children[root][1],zero);}
function tree(id,substitute=false,depth=0){const k=fg.kind[id],p=fg.payloads[id];if(substitute&&k===0){if(p.index===depth)return tree(zero);if(p.index>depth)return[k,{index:p.index-1},[]];}return[k,p,fg.children[id].map((c,s)=>tree(c,substitute,depth+Number((k===6||k===7)&&s===1||k===8&&s===2)))];}
assert.notDeepEqual(tree(fg.roots[0]),tree(fg.roots[1]));assert.equal(fg.kind[fg.roots[0]],6);assert.equal(fg.kind[fg.roots[1]],6);
assert.deepEqual(tree(fg.children[fg.roots[0]][1],true),tree(fg.children[fg.roots[1]][1],true),'Independent one-step beta equality at the source argument');
report.files=fingerprints();assert.deepEqual(report.files,initial);report.status='PASS';report.scope='Independent complete constructor reconstruction, derived-input scope/source specialization and equality-witness syntax, source ledger and unchanged baseline graphs. Native domains, kernel conversions and assignment choices remain observations, not independent JS type inference. Thirty fixed candidates; one higher-order failure remains.';
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz')).equals(bytes));else fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(bytes,{mtime:0}));console.log(JSON.stringify({...report,cases:undefined,files:undefined}));
