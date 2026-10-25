/* Freeze immediate application sites from the earlier use-input audit.
   Source routes and lexical binding are independently resolved before a query.
   No type or consumer name is inferred by this planner. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../../..'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-packed-routes'),F=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),unpack=r=>{const b=P.parse(r);return{root:r.root,slots:Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3)};};
function prepare(folder){
 const bytes=fs.readFileSync(path.join(ROOT,'research/proof-atlas/use-inputs/audit.json')),audit=JSON.parse(bytes),inventory=F.inventory(),profiles=[];let requestedUses=0,alreadyDirect=0,nonApplication=0;
 for(const row of audit.rows){
  const item=inventory.find(i=>i.edition===row.edition&&i.record.name===row.name);assert(item,'recorded source inventory');const r=item.record;
  assert.equal(r.indexSha256,row.indexSha256);assert.equal(r.sourceSha256,row.sourceSha256);
  const raw=z.gunzipSync(fs.readFileSync(path.join(ROOT,r.indexFile)));assert.equal(sha(raw),r.indexSha256);const data=A.validateIndex(JSON.parse(raw),r),sites=new Map();
  for(const x of row.results){
   if(x.gap?.relation==='direct-input'){alreadyDirect++;continue;}
   const use=P.resolve(data,x.use.route);assert.equal(use.node,x.use.node);assert.deepEqual(use.binding,x.use.binder);
   const parent=x.nearestSourcePort,route=unpack(parent.route),p=P.resolve(data,parent.route);assert.equal(p.node,parent.node);
   const suffix=unpack(x.use.route);assert.deepEqual(suffix.slots.slice(0,-1),route.slots);assert.equal(suffix.root,route.root);
   if(parent.constructor!=='app'){nonApplication++;continue;}
   assert.equal(data.kind[p.node],5);const s=suffix.slots.at(-1);assert.equal(parent.field,s===0?'fn':'arg');assert.equal(data.children[p.node][s],use.node);assert(route.slots.length<=512);
   const key=route.root+':'+route.slots.join('.');if(!sites.has(key))sites.set(key,{node:p.node,route,uses:[]});
   sites.get(key).uses.push({use:x.use,slot:s,previous:{status:x.status,...(x.gap?{gap:x.gap,head:x.head,query:x.query,stage:x.stage,input:x.input}: {})}});requestedUses++;
  }
  const queries=[...sites.values()];assert(queries.length<=512);if(!queries.length)continue;
  const source={edition:row.edition,name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256};
  profiles.push({source,record:r,sites:queries});
  if(folder){const dir=path.join(folder,row.edition+'-'+r.name.replaceAll(/[^A-Za-z0-9_-]/g,'_'));fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'packet.json'),raw);fs.writeFileSync(path.join(dir,'inventory.json'),JSON.stringify(profiles.at(-1)));}
 }
 const plan={format:'ProofAtlasImmediateUseSites/1',sampleAuditSha256:sha(bytes),profiles:profiles.length,uses:requestedUses,queries:profiles.reduce((s,p)=>s+p.sites.length,0),alreadyDirect,nonApplication,rows:profiles,scope:'Frozen earlier finite use sample. Queries at exact original immediate application parents only; no new native typing is asserted by this plan.'};
 if(folder)fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(plan));return plan;
}
if(require.main===module){const folder=process.argv[2]&&path.resolve(process.argv[2]);if(folder)fs.mkdirSync(folder,{recursive:true});const plan=prepare(folder);console.log(JSON.stringify({...plan,rows:undefined}));}
module.exports={prepare,unpack};
