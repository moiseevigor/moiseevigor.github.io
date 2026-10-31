'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),M=require('./model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),clone=x=>JSON.parse(JSON.stringify(x));
const freeze=process.argv[2]==='--freeze',raw=freeze?fs.readFileSync(path.join(process.argv[3],'native-check.json')):z.gunzipSync(fs.readFileSync(base+'native-check.json.gz')),native=JSON.parse(raw);
assert.equal(native.status,'PASS');for(const [f,digest]of Object.entries(native.producerFiles))assert.equal(sha(fs.readFileSync(f)),digest,f);
const report={format:'ProofAtlasFrontierFunctionModel/1',status:'RUNNING',profiles:0,accepted:0,kernelRejected:0,rejectedFunctionReconstructions:0,rejectedParameterDomains:0,sourceHoles:0,parameterDomains:0,refusals:0,proofPermutationRefused:false,sharedOccurrencesPreserved:false,maxFunctionRows:0,maxTrieVisits:0};
for(const p of native.profiles){report.profiles++;assert.equal(p.source.indexSha256,sha(Buffer.from(JSON.stringify(p.packet))));
 for(let i=0;i<p.cases.length;i++){
  const c=p.cases[i],out=p.output.cases[i];assert.equal(c.id,out.id);assert.equal(c.expected,out.status);M.validate(p.packet,c);
  if(out.status==='KERNEL_REJECTED'){
   assert.equal(out.phase,'candidate-body');assert.deepEqual(out.context,c.context);const failed=M.construct(p.packet,c,out.holes);assert(M.equalRoot(failed.graph,failed.graph.roots[0],out.rejectedFunctionGraph,out.rejectedFunctionGraph.roots[0]));
   for(let j=0;j<failed.domains.length;j++)assert(M.equalRoot(failed.table,failed.domains[j],out.parameterTypes[j],out.parameterTypes[j].roots[0]));
   report.kernelRejected++;report.rejectedFunctionReconstructions++;report.rejectedParameterDomains+=failed.domains.length;continue;
  }
  const result=M.reconstruct(p.packet,c,out);report.accepted++;report.sourceHoles+=out.holes.length;report.parameterDomains+=result.domains;report.maxFunctionRows=Math.max(report.maxFunctionRows,result.rows);report.maxTrieVisits=Math.max(report.maxTrieVisits,result.work);
  function refuse(mutate){const bad=clone(c),changed=clone(out);mutate(bad,changed);assert.throws(()=>M.reconstruct(p.packet,bad,changed));report.refusals++;}
  refuse(b=>b.holes[0].anchor.node++);
  refuse(b=>b.context.pop());
  refuse((b,o)=>{o.holes[0].original.payloads[o.holes[0].original.roots[0]]={wrong:'source'};});
  if(c.holes.length>1){refuse(b=>b.holes[1]=clone(b.holes[0]));refuse(b=>b.holes.reverse());}
  if(out.proofPermutationControl){const control=out.proofPermutationControl;assert.equal(control.typingAndConversion,'PASS');assert.equal(control.literalBodyDifferent,true);refuse((b,o)=>o.graph=control.wrongGraph);refuse((b,o)=>o.namespace='source-expression');refuse((b,o)=>o.context.pop());report.proofPermutationRefused=true;}
  if(c.id==='siblings:distinct-scopes'){
   assert.equal(c.holes[0].anchor.node,c.holes[1].anchor.node);
   assert.notDeepEqual(c.holes[0].context,c.holes[1].context);
   assert(M.equalRoot(out.holes[0].original,out.holes[0].original.roots[0],out.holes[1].original,out.holes[1].original.roots[0]));
   assert.equal(out.holes.length,2);report.sharedOccurrencesPreserved=true;
  }
 }
}
assert.equal(report.profiles,9);assert.equal(report.accepted,8);assert.equal(report.kernelRejected,3);assert.equal(report.proofPermutationRefused,true);assert.equal(report.sharedOccurrencesPreserved,true);
assert.equal(native.nativeRefusals.length,3);
report.status='PASS';report.nativeEvidenceSha256=sha(raw);report.files=Object.fromEntries(['model.cjs','check.cjs'].map(f=>[base+f,sha(fs.readFileSync(base+f))]));report.scope='Independent source closure, whole function-term and dependent parameter-domain reconstruction on finite authored controls. Result types and convertibility are native kernel evidence, not JavaScript inference. No Riccati/AI native frontier coverage yet.';
if(freeze)fs.writeFileSync(base+'native-check.json.gz',z.gzipSync(raw));
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(freeze)fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(bytes));
else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz'))),report,'stored model report');
console.log(JSON.stringify(report));
