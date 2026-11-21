// Compare the paged Eq.mp / Eq.mpr reading with compiled proof-root occurrences.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {gunzipSync}=require('node:zlib');
const atlas=require('../../../public/js/proof-atlas-library-data');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {pagedEqualityRule}=require('../../../public/js/proof-atlas-omitted-references');
const {sourceInput}=require('../../../public/js/proof-atlas-application-ports');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');

async function check(descriptor,record){
 const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(raw).digest('hex'),descriptor.indexSha256);
 const data=atlas.validateIndex(JSON.parse(raw),record),root=data.roots[1];
 const visits=Array(root+1).fill(0n),parents=new Map();
 visits[root]=1n;
 const counts={mp:0,mpr:0,forward:0n,reverse:0n,partial:0};
 const cursor=await pages.open(descriptor,record,{pageLimit:1,indexLimit:1,fetcher:async file=>{
  assert(file.startsWith(descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1)));
  return new Response(fs.readFileSync('.'+file));
 }});
 try{
  for(let id=root;id>=0;id--){
   if(!visits[id])continue;
   for(const [slot,child] of data.children[id].entries()){
    visits[child]+=visits[id];
    if(!parents.has(child))parents.set(child,[id,slot]);
   }
   if(data.kind[id]!==5)continue;
   const {head,args}=spine(data,id),name=data.payloads[head].name;
   if(data.kind[head]!==4 || !['Eq.mp','Eq.mpr'].includes(name) || args.length!==4)continue;
   const slots=[];
   for(let at=id;at!==root;){
    const [parent,slot]=parents.get(at);
    slots.push(slot);at=parent;
   }
   const call={node:id,route:{root:1,slots:slots.reverse()}};
   const result=await pagedEqualityRule(cursor,call.route);
   const [left,right,equality,term]=[1,2,3,4].map(slot=>sourceInput(data,call,slot));
   const forward=name==='Eq.mp';
   assert.deepEqual(result,{rule:name,left,right,equality,term,from:forward?left:right,to:forward?right:left});
   counts[forward?'mp':'mpr']++;
   counts[forward?'forward':'reverse']+=visits[id];
   // Drop the transported term; the remaining three-argument prefix cannot be shown as transport.
   assert.equal(await pagedEqualityRule(cursor,{root:1,slots:call.route.slots.concat(0)}),null);
   counts.partial++;
  }
  assert.equal(visits.reduce((a,b)=>a+b,0n),BigInt(data.expanded[root]));
  assert(cursor.state().peakCachedNodes<=256);
  return counts;
 }finally{cursor.dispose();}
}
(async()=>{
 const window={};
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
 const items=inventory(),totals={};
 for(const d of window.PROOF_ATLAS_SOURCE_PAGES.records){
  const {record}=items.find(i=>i.edition===d.edition&&i.record.indexSha256===d.indexSha256);
  const c=await check(d,record);
  const s=totals[d.edition]??={packets:0,matching:0,mp:0,mpr:0,forward:0n,reverse:0n,partial:0};
  s.packets++;if(c.mp+c.mpr)s.matching++;
  for(const key of Object.keys(c))s[key]+=c[key];
 }
 console.table(totals);
})().catch(e=>{console.error(e);process.exitCode=1;});
