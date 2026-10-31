'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data');
process.chdir(path.resolve(__dirname,'../../..'));
const folder=path.resolve(process.argv[2]),sha=b=>crypto.createHash('sha256').update(b).digest('hex');fs.mkdirSync(folder);
const names=['binder-block-exchange','definition-boundaries','corpus-definition-boundaries'],profiles=[];let total=0,maxDomain=0,maxResult=0;
for(const name of names){const input='research/proof-atlas/'+name+'/native-check.json.gz',bytes=fs.readFileSync(input),bundle=JSON.parse(z.gunzipSync(bytes));assert.equal(bundle.verification.status,'PASS');const rows=name==='corpus-definition-boundaries'?bundle.profiles.flatMap((p,pi)=>p.cases.map((c,ci)=>({source:p.source,id:c.plan.id,result:c.native.result,nativeCaseSha256:bundle.verification.cases.find(v=>v.profile===pi&&v.case===ci).outputSha256}))):bundle.controls.map(c=>({source:c.source,id:c.source.name,result:c.observation.result,nativeCaseSha256:sha(Buffer.from(JSON.stringify(c.observation)))}));
 for(const p of rows){if(p.result.status!=='PASS')continue;const r=p.result,g=r.graph,schedules=name==='binder-block-exchange'?r.schedules:r.steps?['outermost','deepest'].map(name=>({name,steps:r.steps.filter(s=>s.schedule===name)})):[];const queries=[];
  for(const schedule of schedules)for(const[ordinal,s]of schedule.steps.entries()){
   const before=A.walk(g,{root:s.beforeRoot,slots:s.path}),after=A.walk(g,{root:s.afterRoot,slots:s.path});assert.equal(g.kind[before],8);const[a,value,lambda]=g.children[before];assert.equal(g.kind[lambda],6);const[domain,body]=g.children[lambda];assert.equal(g.kind[after],6);const[newDomain,letNode]=g.children[after];assert.equal(g.kind[letNode],8);const[newA,newValue,newBody]=g.children[letNode];
   assert(BigInt(g.expanded[domain])<=65536n&&BigInt(g.expanded[newDomain])<=65536n,'Direct domain reference-evaluation bound');
   maxDomain=Math.max(maxDomain,Number(g.expanded[domain]));maxResult=Math.max(maxResult,Number(g.expanded[newDomain]));
   queries.push({schedule:schedule.name,ordinal,path:s.path,beforeRoot:s.beforeRoot,afterRoot:s.afterRoot,depth:s.path.length,nodes:{before,after,a,value,domain,body,newDomain,newA,newValue,newBody},counts:{domain:g.expanded[domain],newDomain:g.expanded[newDomain],value:g.expanded[value],body:g.expanded[body],before:g.expanded[before],after:g.expanded[after]}});total++;
  }
  // Include no-exchange profiles in the census, without fabricating a query.
  const graphFile=path.join(folder,'graph-'+profiles.length+'.json');fs.writeFileSync(graphFile,JSON.stringify(g));
  const request={format:'ProofAtlasExprReferenceRequest/1',source:p.source,id:p.id,nativeInventory:{file:input,sha256:sha(bytes)},nativeCaseSha256:p.nativeCaseSha256,graphFile,queries};
  const requestFile=path.join(folder,'request-'+profiles.length+'.json'),raw=Buffer.from(JSON.stringify(request));fs.writeFileSync(requestFile,raw);profiles.push({...request,requestFile,requestSha256:sha(raw),graphSha256:sha(fs.readFileSync(graphFile))});
 }
}
assert.equal(total,100);assert.equal(profiles.length,29);const plan={format:'ProofAtlasExprReferencePlan/1',profiles,queries:total,maxDomainOccurrences:maxDomain,maxComputedDomainOccurrences:maxResult};fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(plan,null,2)+'\n');console.log(JSON.stringify({profiles:profiles.length,queries:total,maxDomain,maxResult}));
