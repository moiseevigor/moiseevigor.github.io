'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),repo=path.resolve(__dirname,'..');process.chdir(repo);
const I=require('../research/proof-atlas/recorded-variable-uses/index.cjs'),R=require('../research/proof-atlas/recorded-variable-uses/source-cuts.cjs'),U=require('../public/js/proof-atlas-variable-uses'),W=require('../public/js/proof-atlas-occurrence-window'),P=require('../public/js/proof-atlas-packed-routes'),T=require('../public/js/proof-atlas-deep-context'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
const out={status:'RUNNING',profiles:0,cuts:0,batches:0,references:0,retainedUses:0,hiddenUses:0,retainedBinders:0,internalBinders:0,externalBinders:0,seenUses:0,outsideMixedUses:0,refusals:0};
(async()=>{
 let sample;
 for await(const x of cases()){
  out.profiles++;const inventory=await I.extract(x),built=I.produce(inventory),index=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>built.files.get(sha)),seen=new Set(),starts=x.c.entries.filter(e=>['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule));
  out.outsideMixedUses+=inventory.rows.filter(r=>!starts.some(e=>I.prefix(e.route,r.route))).length;
  const roots=Array.from({length:x.c.data.roots.length},(_,i)=>P.encode(i,[])),focus=new Map(inventory.rows.flatMap(r=>[[I.key(r.route),r.route],[I.key(r.binder.route),r.binder.route]]));
  for(const route of [...roots,...focus.values()])for(const options of [{maxNodes:1,maxDepth:0},{maxNodes:7,maxDepth:2},{maxNodes:13,maxDepth:3}]){
   const scene=W.create(x.c.data,x.record,route,options),before=JSON.stringify(scene);out.cuts++;let cursor=null;
   do{const part=await index.query({within:route,cursor}),actual=index.sourceReferences(scene,part),expected=R.references(scene,part.rows,x.c.data);out.batches++;
    assert.equal(actual.format,'ProofAtlasSourceUseOverlay/1');assert.deepEqual(actual.sourcePartition,scene.stats);assert.equal(actual.countContribution,'0');assert.equal(actual.references.length,expected.length);
    for(const[i,ref]of actual.references.entries()){
     for(const key of ['kind','region','target','useVisibility','sourceUseId','existingBindingEdge'])assert.deepEqual(ref[key],expected[i][key]);assert.deepEqual(ref.use,part.rows[i]);assert.equal(ref.countContribution,'0');seen.add(I.key(ref.use.route));out.references++;
     out[ref.useVisibility==='retained-source-use'?'retainedUses':'hiddenUses']++;out[ref.kind==='retained-binder'?'retainedBinders':ref.kind==='internal-to-hidden-region'?'internalBinders':'externalBinders']++;
     if(ref.existingBindingEdge)assert(scene.links.some(e=>e.from===ref.existingBindingEdge.from&&e.to===ref.existingBindingEdge.to&&e.relation===ref.existingBindingEdge.relation));
    }
    assert.equal(JSON.stringify(scene),before);cursor=part.next;
   }while(cursor);
  }
  assert.deepEqual(seen,new Set(inventory.rows.map(r=>I.key(r.route))));out.seenUses+=seen.size;index.dispose();if(!sample&&inventory.rows.length)sample={x,inventory,built};
 }
 const{x,inventory,built}=sample,provider=await U.openIndex(built.manifestBytes,built.manifestSha256,inventory.source,async sha=>built.files.get(sha)),row=inventory.rows[0],scene=W.create(x.c.data,x.record,row.route,{maxNodes:1,maxDepth:0}),result=await provider.query({within:row.route});assert(result.rows.length);
 for(const mutate of [s=>s.source.indexSha256='0'.repeat(64),s=>s.typing='checked',s=>s.namespace='kernel-rule',s=>s.nodes[0].kind='const',s=>s.nodes[0].binding.node++,s=>s.stats.retained=String(BigInt(s.stats.retained)+1n),s=>s.links=[],s=>s.links[0].relation='logical-implication']){const changed=structuredClone(scene);mutate(changed);assert.throws(()=>provider.sourceReferences(changed,result));out.refusals++;}
 assert.throws(()=>provider.sourceReferences(scene,structuredClone(result)));out.refusals++;provider.dispose();assert.throws(()=>provider.sourceReferences(scene,result));out.refusals++;
 assert.equal(out.profiles,51);assert.equal(out.cuts,1209);assert.equal(out.references,13923);assert.equal(out.seenUses,170);assert.equal(out.outsideMixedUses,28);assert(out.retainedUses>0&&out.hiddenUses>0&&out.retainedBinders>0&&out.internalBinders>0&&out.externalBinders>0);out.status='PASS';out.scope='Finite sparse-use attachments to ordinary original source cuts. Existing lexical edges are reused for retained uses; hidden references add zero source occurrences. Source forall binders gain no invented proof-introduction judgment. No browser or general preservation claim.';
 fs.writeFileSync('/tmp/atlas-source-variable-uses.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exit(1)});
