/* Altered, rehashed transports are synthetic controls, not native counterexamples. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const Q=require('../public/js/proof-atlas-construction-pages'),SP=require('../public/js/proof-atlas-source-pages'),F=require('../public/js/proof-atlas-cursor-context-frame'),P=require('../public/js/proof-atlas-packed-routes'),h={};
for(const name of ['library-manifest','goedel-sample-manifest','source-pages-manifest','construction-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const {library}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,{records:[]},null,h.PROOF_ATLAS_AI_SAMPLE),clone=v=>JSON.parse(JSON.stringify(v)),raw=f=>JSON.parse(z.gunzipSync(fs.readFileSync('.'+f))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const record=library.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiData.slope_bound_abs'),sd=h.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.indexSha256===record.indexSha256),qd=h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(d=>d.indexSha256===record.indexSha256),manifest=raw(qd.file),base=qd.file.slice(0,qd.file.lastIndexOf('/')+1),fetchFile=async f=>new Response(fs.readFileSync('.'+f));
 const original=await Q.open(qd,record,{fetcher:fetchFile}),parent=await original.lookup(P.encode(1,[])),child=await original.lookup(parent.construction.premises.at(-1).route);original.dispose();assert(parent.construction.rule==='Pi-introduction'&&child.construction.rule==='Pi-introduction');
 function fixture(change=()=>{},includeChild=true){
  const files=new Map(),values=[clone(parent),...(includeChild?[clone(child)]:[])],m=clone(manifest),desc=clone(qd);
  const put=(suffix,value)=>{const bytes=Buffer.from(JSON.stringify(value)),sha256=sha(bytes),file=base+sha256+suffix;files.set(file,z.gzipSync(bytes));return{file,sha256,bytes:bytes.length};};
  change(values);const rows=values.map(v=>({key:Q.key(v.typed.route),route:v.typed.route,record:put('.record.gz',v)})).sort((a,b)=>a.key<b.key?-1:1),index=put('.index.gz',{format:'ProofAtlasConstructionIndex/1',level:0,rows});
  m.entries=desc.entries=m.constructions=desc.constructions=values.length;m.index={...index,level:0,count:rows.length,min:rows[0].key,max:rows.at(-1).key};Object.assign(desc,put('.manifest.gz',m));
  return{desc,fetcher:async f=>new Response(files.get(f)||fs.readFileSync('.'+f))};
 }
 let refusals=0,withheldJoins=0,missingBoundaries=0;const reject=async fn=>{await assert.rejects(fn);refusals++;};
 async function audit(f,check){const q=await Q.open(f.desc,record,{fetcher:f.fetcher,indexLimit:1,recordLimit:1}),s=await SP.open(sd,record,{fetcher:f.fetcher,pageLimit:1});try{await check(F.open(s,q),q,s);}finally{q.dispose();s.dispose();}}
 for(const change of [v=>v[1].construction.entry.typeFingerprint='0'.repeat(64),v=>{v[1].typed.role=v[1].construction.entry.role='value';}]){
  await audit(fixture(change),async model=>{const frame=await model.create(parent.typed.route);assert.equal(frame.members.length,1);assert.equal(frame.stop,'different-recorded-interface');assert.equal(frame.continuation.compatible,false);assert.deepEqual(model.resolve(frame,frame.continuation.address),child.typed.route);assert.equal(BigInt(frame.stats.retained)+BigInt(frame.stats.hidden),BigInt(frame.stats.represented));withheldJoins++;});
 }
 await audit(fixture(()=>{},false),async model=>{const frame=await model.create(parent.typed.route);assert.equal(frame.stop,'no-construction-record');assert.equal(frame.continuation.availableRule,null);assert.deepEqual(model.resolve(frame,frame.continuation.address),child.typed.route);missingBoundaries++;});
 await audit(fixture(),async model=>{const frame=await model.create(parent.typed.route,{maxMembers:1});assert.equal(frame.stop,'member-budget');assert.equal(frame.continuation.compatible,true);});
 for(const change of [v=>{v[0].typed.node++;v[0].construction.entry.node++;},v=>v[0].construction.premises[0].node++,v=>v[0].construction.premises[1].node++])await audit(fixture(change),model=>reject(()=>model.create(parent.typed.route)));
 // Disposal during a native record load cannot publish a frame or refill caches.
 const f=fixture();let release,hit;const gate=new Promise(r=>release=r),started=new Promise(r=>hit=r),q=await Q.open(f.desc,record,{recordLimit:1,indexLimit:1,fetcher:async file=>{if(file.endsWith('.record.gz')){hit();await gate;}return f.fetcher(file);}}),s=await SP.open(sd,record,{fetcher:f.fetcher,pageLimit:1}),model=F.open(s,q),pending=model.create(parent.typed.route);
 await started;q.dispose();release();await reject(()=>pending);assert.equal(q.state().recordPages,0);assert.equal(q.state().indexPages,0);s.dispose();
 const report={status:'PASS',refusals,sourceInterfaceRefusals:3,syntheticWithheldJoins:withheldJoins,explicitMissingBoundaries:missingBoundaries,memberBudgetInterfacePreserved:true,disposedPendingFrameRefused:true,scope:'Altered rehashed transport controls and source-field comparisons; not new native judgments or mathematical counterexamples.'};
 fs.writeFileSync('/tmp/atlas-cursor-context-frame-controls.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack);process.exit(1);});
