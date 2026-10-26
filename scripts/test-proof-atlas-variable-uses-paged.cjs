'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert/strict'),repo=path.resolve(__dirname,'..');process.chdir(repo);
const U=require('../public/js/proof-atlas-variable-uses'),I=require('../research/proof-atlas/recorded-variable-uses/index.cjs'),T=require('../public/js/proof-atlas-deep-context'),SP=require('../public/js/proof-atlas-source-pages'),Q=require('../public/js/proof-atlas-construction-pages'),CM=require('../public/js/proof-atlas-cursor-constructions'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/variable-uses-manifest.js','utf8'),{window:h});
const out={status:'RUNNING',profiles:0,uses:0,observations:0,distinctNativeOwners:0,wrongOwnerRefusals:0,peakSourceNodes:0,peakTypeNodes:0,completeArchiveRequests:0,counts:0,unavailableCounts:0};
(async()=>{
 for await(const x of cases()){
  if(x.core)break;
  const inventory=await I.extract(x),d=h.PROOF_ATLAS_VARIABLE_USES.records.find(d=>d.edition===x.edition&&d.indexSha256===x.record.indexSha256);
  const fetcher=async file=>{assert(['/public/data/proof-atlas/source-pages/','/public/data/proof-atlas/type-pages/','/public/data/proof-atlas/construction-pages/','/public/data/proof-atlas/variable-use-pages/'].some(p=>file.startsWith(p)),'Complete archive request: '+file);return new Response(fs.readFileSync(path.join(repo,file.slice(1))));};
  const uses=await U.open(d,inventory.source,{fetcher}),source=await SP.open(x.sd,x.record,{fetcher,pageLimit:1,indexLimit:1}),queries=await Q.open(x.qd,x.record,{fetcher,indexLimit:1,recordLimit:1}),model=CM.open(source,queries);out.profiles++;
  const all=[];for(let root=0;root<x.c.data.roots.length;root++){let cursor=null;do{const part=await uses.query({within:require('../public/js/proof-atlas-packed-routes').encode(root,[]),cursor});all.push(...part.rows);cursor=part.next;}while(cursor);}
  assert.deepEqual(all,inventory.rows);
  for(const row of all){
   const ref={source:inventory.source,use:row},actual=await model.sourcePoint(row.route);assert(U.verifySource(ref,actual.point,inventory.source));out.uses++;
   for(const[i,o]of row.observations.entries()){
    const owner=await queries.lookup(o.owner.route),session=await queries.typeFor(owner,o.field,'kernel');
    try{assert(U.verifyObservation(ref,i,session));await session.cursor.scene(session.observation,source);out.peakTypeNodes=Math.max(out.peakTypeNodes,session.cursor.state().peakCachedNodes);out.observations++;
     const e=x.c.get(o.owner.route),typed=o.field==='recorded'?e:await T.constructionType(e,x.c.data,o.field);assert.equal(session.observation.root,typed.typeData.roots[0]);
     if(e.evidenceSha256!==typed.evidenceSha256){out.distinctNativeOwners++;const changed=structuredClone(ref);changed.use.observations[i].owner.evidenceSha256=e.evidenceSha256;assert.throws(()=>U.verifyObservation(changed,i,session));out.wrongOwnerRefusals++;}
    }finally{session.cursor.dispose();queries.releaseType(session.cursor);}
   }
  }
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule)){const c=uses.supportFor(e.route);assert(c&&c.node===e.node);out.counts++;if(c.status==='unavailable')out.unavailableCounts++;}
  out.peakSourceNodes=Math.max(out.peakSourceNodes,source.state().peakCachedNodes);assert(source.state().peakCachedNodes<=256&&uses.stats().residentPages<=2);uses.dispose();source.dispose();queries.dispose();assert.equal(uses.stats().residentPages,0);
 }
 assert.equal(out.profiles,26);assert.equal(out.uses,152);assert.equal(out.observations,304);assert.equal(out.counts,269);assert.equal(out.unavailableCounts,7);assert(out.distinctNativeOwners>0&&out.wrongOwnerRefusals===out.distinctNativeOwners);out.status='PASS';out.scope='Finite public delivery/source/type-owner correspondence through bounded cursors. Existing judgments are reused; syntax counts do not add typing or semantic-necessity claims.';fs.writeFileSync('/tmp/atlas-variable-uses-paged.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exit(1)});
