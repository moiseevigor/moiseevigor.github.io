/* Compare fresh immediate-input judgments with the frozen earlier sample.
   The oracle reconstructs source ports and checks the native six-root record;
   matching a stored node or a pretty type alone is never sufficient. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),P=require('../public/js/proof-atlas-packed-routes'),I=require('../public/js/proof-atlas-use-inputs'),T=require('../public/js/proof-atlas-occurrence-types'),S=require('../public/js/proof-atlas-source-pages'),N=require('../public/js/proof-atlas-native-pages'),F=require('./proof-atlas-judgment-fixtures.cjs'),prepare=require('../research/proof-atlas/use-sites/prepare.cjs').prepare,pack=require('../research/proof-atlas/share_type_graphs.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=(file,hash)=>{const b=z.gunzipSync(fs.readFileSync('.'+file));if(hash)assert.equal(sha(b),hash);return JSON.parse(b);},key=r=>r.root+':'+r.slots.join('.'),unpack=r=>{const b=P.parse(r);return{root:r.root,slots:Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3)};};
const prior=JSON.parse(fs.readFileSync('research/proof-atlas/use-inputs/audit.json')),native=JSON.parse(fs.readFileSync('research/proof-atlas/use-sites/native-verification.json')),w={};
for(const file of ['use-site-types-manifest.js','use-site-query-pages-manifest.js','source-pages-manifest.js','native-query-pages-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file,'utf8'),{window:w});
let assertions=0,negativeControls=0,largest=0,largestDirect=0;const rows=[],riccati=[];
function direct(scene,data,evidence,descriptor,use){
 assert.equal(scene.status,'found');assert.equal(scene.gap.depth,0);assert.equal(scene.gap.relation,'direct-input');assert.deepEqual(scene[scene.input].route,use.route);assert.equal(scene[scene.input].node,use.node);assert.deepEqual(P.resolve(data,use.route).binding,scene.use.binder);
 const q=unpack(scene.query.route),e=evidence.entries.find(e=>key(e.route)===key(q));assert(e);assert.equal(e.status,'checked');assert.equal(e.applicationJudgment.status,'checked');assert.equal(scene.query.evidenceSha256,descriptor.sha256);
 // Reconstruct the whole application spine using original child links.
 const spine=[];let node=A.walk(data,q),route=q;while(data.kind[node]===5){spine.push({node,route});node=data.children[node][0];route={root:q.root,slots:[...route.slots,0]};}spine.reverse();
 const step=spine[scene.stage-1],s=e.applicationJudgment.stages[scene.stage-1],operand=scene.input==='function'?0:1;assert(step);assert.equal(scene.result.node,step.node);assert.deepEqual(unpack(scene.result.route),step.route);assert.equal(data.children[step.node][operand],use.node);assert.deepEqual({...step.route,slots:[...step.route.slots,operand]},unpack(use.route));
 for(const [port,field]of [['function','beforeRoot'],['argument','actualRoot'],['result','afterRoot']])assert.equal(scene[port].typeRoot,s[field]);assert.equal(scene.function.piRoot,s.piRoot);assert.equal(scene.argument.domainRoot,s.domainRoot);assert.equal(scene.result.substitutedRoot,s.substitutedRoot);
 for(const part of ['function','domain','result'])assert.equal(scene.conversions[part],'PASS');assert.equal(scene.argument.role,e.arguments[scene.stage-1].role);assert.equal(scene.function.role,s.functionRole);assert.equal(scene.result.role,s.resultRole);assert.equal(scene.nativeContextDepth,e.context.length);assert.equal(scene.use.contextDepth,e.context.length);
 assert.equal(scene.gap.intermediateTyping,'not-inferred');assert.equal(scene.corridor.boundary?.depth||scene.gap.depth,0);assert.equal(scene.head.node,node);assert.equal(scene.head.label,data.kind[node]===4?data.payloads[node].name:'Source e'+node);assert.equal(scene.binder.info,s.binderInfo);assert.equal(scene.binder.bodyUsesBinder,s.bodyUsesBinder);
 largestDirect=Math.max(largestDirect,Buffer.byteLength(JSON.stringify(scene)));assert(largestDirect<=I.limits.bytes);assertions++;
}
(async()=>{
 const fetch=global.fetch,requests=[];global.fetch=async f=>{requests.push(f);return new Response(fs.readFileSync('.'+f));};const plan=prepare(),frozenPlan=fs.readFileSync('research/proof-atlas/use-sites/plan.json');assert.equal(sha(frozenPlan),native.planSha256);assert(frozenPlan.equals(Buffer.from(JSON.stringify(plan))));
 try{for(const item of F.inventory()){
  const r=item.record,old=prior.rows.find(p=>p.edition===item.edition&&p.indexSha256===r.indexSha256),d=w.PROOF_ATLAS_USE_SITE_TYPES.records.find(d=>d.edition===item.edition&&d.name===r.name),data=A.validateIndex(read(r.indexFile,r.indexSha256),r),providers=[];
  for(const p of item.descriptors)providers.push(await p.api.open(p.descriptor,data,r));let evidence;
  if(d){evidence=read(d.file,d.sha256);assert(pack.verify(evidence));providers.push(T.provider(evidence,data,r,d));const check=native.checks.find(v=>v.source.edition===item.edition&&v.source.indexSha256===r.indexSha256);assert(check);assert.equal(check.nativeOutputSha256,evidence.queryPolicy.nativeOutputSha256);assert.equal(check.applicationTraces,evidence.entries.length);}
  const full=I.open(data,r,providers),sd=w.PROOF_ATLAS_SOURCE_PAGES.records.find(p=>p.edition===item.edition&&p.name===r.name),nd=w.PROOF_ATLAS_NATIVE_PAGES.records.find(p=>p.edition===item.edition&&p.name===r.name),ud=w.PROOF_ATLAS_USE_SITE_PAGES.records.find(p=>p.edition===item.edition&&p.name===r.name);
  requests.length=0;let wholeSourceRequests=0;const cursor=await S.open(sd,r,{pageLimit:16,indexLimit:2,fetcher:async f=>{if(f===r.indexFile)wholeSourceRequests++;return new Response(fs.readFileSync('.'+f));}}),pagedNative=await N.open(nd,cursor.data,r,{queryLimit:1,byteLimit:2097152,indexLimit:8,expectedDescriptors:cursor.manifest.descriptors,useSiteQueryDescriptor:ud}),paged=I.paged(cursor,pagedNative),results=[];
  if(d)assert.equal(pagedNative.state().useSiteSupplement.failure,null);
  for(const previous of old.results){
   const use=previous.use,one=await I.find(full,use),two=await I.find(paged,use);assert.deepEqual(two,one);assert.notEqual(one.status,'unavailable',one.reason);if(one.status==='found'){largest=Math.max(largest,Buffer.byteLength(JSON.stringify(one)));assert(largest<=I.limits.bytes);}assertions++;
   const site=d&&evidence.entries.find(e=>key(e.route)===key(unpack(previous.nearestSourcePort.route))),newDirect=Boolean(site);
   if(newDirect){direct(one,data,evidence,d,use);direct(two,data,evidence,d,use);}else{assert.equal(one.status,previous.status);if(one.status==='found'){assert.equal(one.gap.depth,previous.gap.depth);assert.equal(one.head.label,previous.head.label);}}
   results.push({use,status:one.status,previousStatus:previous.status,previousGap:previous.gap?.depth??null,newDirect,...(one.status==='found'?{head:one.head,stage:one.stage,input:one.input,gap:one.gap,role:one[one.input].role,query:one.query}:{})});
   if(item.edition==='published-15'&&r.name==='JacobiData.slope_bound_abs'&&use.binder.node===3246&&use.binder.route.root===1)riccati.push(one);
  }
  assert.equal(wholeSourceRequests,0);assert(!requests.some(f=>[...item.descriptors.map(p=>p.descriptor.file),d?.file].includes(f)),'paged consumer fetched complete native evidence');assert(cursor.state().peakCachedNodes<=4096);assert(pagedNative.state().peakQueries<=1&&pagedNative.state().peakBytes<=2097152);
  if(d){
   for(const mutate of [e=>e.source.indexSha256='f'.repeat(64),e=>e.environment.dependencyRecovery.originalGitCheckoutsVerified=true,e=>e.environment.dependencyRecovery.allBinaryHashesVerified=false,e=>e.entries[0].node++,e=>e.entries[0].context.pop()]){const corrupt=structuredClone(evidence);mutate(corrupt);assert.throws(()=>T.validate(corrupt,data,r));negativeControls++;}
  }
  if(item.edition==='published-15'&&r.name==='JacobiData.slope_bound_abs'){
   // A rejected supplement keeps the earlier source gap; it cannot manufacture
   // a direct typed edge. Exercise the optional transport boundary separately
   // from the native-evidence validation controls above.
   const target=old.results.find(x=>x.use.node===167&&x.use.binder.node===3246);
   for(const mutate of [d=>d.sourceSha256='f'.repeat(64),d=>d.nativeEvidence.sha256='f'.repeat(64),d=>d.nativeEvidence.name='wrong']){
    const broken=structuredClone(ud);mutate(broken);const n=await N.open(nd,cursor.data,r,{queryLimit:1,byteLimit:2097152,indexLimit:8,useSiteQueryDescriptor:broken});assert(!n.providers.useSites);assert(n.state().useSiteSupplement.failure);const o=I.paged(cursor,n),s=await I.find(o,target.use);assert.equal(s.status,'found');assert.equal(s.head.label,'Or.casesOn');assert.equal(s.gap.depth,2);I.dispose(o);n.dispose();negativeControls++;
   }
  }
  rows.push({edition:item.edition,name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256,uses:results.length,nativeQueries:d?.queried||0,nativeRecording:d?evidence.environment.kind:null,sourceCache:cursor.state(),nativeCache:pagedNative.state(),results});I.dispose(full);I.dispose(paged);cursor.dispose();pagedNative.dispose();
 }}finally{global.fetch=fetch;}
 riccati.sort((a,b)=>{const x=unpack(a.use.route),y=unpack(b.use.route);for(let i=0;i<Math.min(x.slots.length,y.slots.length);i++)if(x.slots[i]!==y.slots[i])return x.slots[i]-y.slots[i];return x.slots.length-y.slots.length;});assert.equal(native.profiles,22);assert.equal(rows.length,35);assert.equal(riccati.length,3);assert.deepEqual(riccati.map(s=>[s.head.label,s.stage,s.gap.depth]),[['mul_pos',7,0],['JacobiData.T1_T2_same_sign',5,0],['abs_of_pos',6,0]]);
 const results=rows.flatMap(r=>r.results),report={format:'ProofAtlasImmediateUseAudit/1',status:'PASS',checkerSha256:sha(fs.readFileSync(__filename)),planSha256:native.planSha256,nativeVerificationSha256:sha(fs.readFileSync('research/proof-atlas/use-sites/native-verification.json')),profiles:rows.length,nativeProfiles:native.profiles,nativeQueries:native.queries,uses:results.length,previousDirect:prior.directInputs,direct:results.filter(r=>r.gap?.depth===0).length,insideInputs:results.filter(r=>r.gap?.depth>0).length,notRecorded:results.filter(r=>r.status==='not-recorded').length,newDirect:results.filter(r=>r.newDirect).length,recoveredMissing:results.filter(r=>r.previousStatus==='not-recorded'&&r.status==='found').length,independentChecks:assertions,negativeControls,largestSceneBytes:largest,largestNewDirectSceneBytes:largestDirect,riccati,rows,scope:'Frozen 469-use sample in 35 profiles. New native application-parent queries cover two Riccati snapshots and twenty released AI-attributed profiles. Complete and paged consumers agree. No all-use, semantic necessity or comprehension claim. Recovered dependency binaries are hash-verified with cache-attributed revisions, not an independent rebuild.'};
 if(process.env.ATLAS_USE_SITE_CHECK_REPORT==='1')assert.deepEqual(JSON.parse(fs.readFileSync('research/proof-atlas/use-sites/audit.json')),JSON.parse(JSON.stringify(report)));
 if(process.env.ATLAS_USE_SITE_REPORT)fs.writeFileSync(process.env.ATLAS_USE_SITE_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined,riccati:riccati.map(s=>({head:s.head.label,stage:s.stage,gap:s.gap.depth}))}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
