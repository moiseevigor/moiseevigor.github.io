// Compare selected substitution links with a complete, hash-checked source oracle.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const P=require('../../../public/js/proof-atlas-source-pages');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {sourceInput}=require('../../../public/js/proof-atlas-application-ports');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const window={};
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
async function check(d){
 const {record}=inventory().find(i=>i.edition===d.edition && i.record.name===d.name);
 const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const data=A.validateIndex(JSON.parse(raw),record),routes=A.routes(data);
 let chosen;
 const calls=[];
 for(let row=0;row<data.kind.length;row++){
  if(data.kind[row]!==5)continue;
  const {head,args}=spine(data,row);
  if(data.payloads[head].name!=='congrArg'||args.length!==6)continue;
  const route=routes.route(row);
  if(route.root!==1)continue;
  calls.push({node:row,route});
  if(data.kind[args[4]]===5 && (!chosen || route.slots.length>chosen.route.slots.length))chosen={node:row,route};
 }
 if(!chosen){console.log(d.name,'no eligible substitution on canonical proof routes');return false;}
 const fetcher=async file=>{
  assert(file.startsWith(d.file.slice(0,d.file.lastIndexOf('/')+1)));
  return new Response(fs.readFileSync('.'+file));
 };
 const fn=sourceInput(data,chosen,5);
 const fixed=spine(data,fn.node);
 const anchors=[chosen,...[3,4,5,6].map(slot=>sourceInput(data,chosen,slot)),
  ...Array.from({length:fixed.args.length+1},(_,s)=>sourceInput(data,fn,s))];
 const cursor=await P.open(d,record,{pageLimit:1,indexLimit:1,fetcher});
 try{
  for(const {node,route} of anchors){
   assert.deepEqual(await cursor.resolveRoute(route),{node,path:A.path(data,route),kind:data.kind[node]});
  }
  const state=cursor.state();
  assert(state.peakCachedNodes<=256 && state.indexPages===1);
  await assert.rejects(cursor.resolveRoute({root:1,slots:[99]}),/occurrence field/);
  await assert.rejects(cursor.resolveRoute({root:-1,slots:[]}),/occurrence route/);
  const stopped=AbortSignal.abort();
  await assert.rejects(cursor.resolveRoute(chosen.route,{signal:stopped}),{name:'AbortError'});
  console.log(d.name,{stored:d.nodes,row:chosen.node,depth:chosen.route.slots.length,anchors:anchors.length,
   peakSourceRows:state.peakCachedNodes,pageLoads:state.pageLoads});
 }finally{cursor.dispose();}
 const local=await P.open(d,record,{pageLimit:1,indexLimit:1,fetcher});
 try{
  const {pagedSubstitution}=require('../../../public/js/proof-atlas-omitted-references');
  const result=await pagedSubstitution(local,chosen.route);
  assert.deepEqual([result.left,result.right,result.fn,result.premise,result.fixed.prefix,...result.fixed.args],anchors.slice(1));
  const state=local.state();
  assert(state.peakCachedNodes<=256 && state.indexPages===1);
  console.log('Derived from the call route:',state.pageLoads,'source page loads');
  assert.equal(await pagedSubstitution(local,result.fixed.prefix.route),null);
  assert.equal(await pagedSubstitution(local,result.fn.route),null);
  const forms=new Map();
  for(const at of calls){
   const view=await pagedSubstitution(local,at.route);
   const expected=[3,4,5,6].map(slot=>sourceInput(data,at,slot));
   assert.deepEqual([view.left,view.right,view.fn,view.premise],expected);
   const fn=expected[2],args=spine(data,fn.node).args;
   const visible=Math.min(6,args.length);
   const prefixRoute={root:fn.route.root,slots:fn.route.slots.concat(Array(visible).fill(0))};
   assert.deepEqual(view.fixed.prefix,{node:A.walk(data,prefixRoute),route:prefixRoute});
   assert.deepEqual(view.fixed.args,args.slice(args.length-visible).map((_,i)=>sourceInput(data,fn,args.length-visible+i+1)));
   const kind=A.kinds[data.kind[fn.node]];
   forms.set(kind,(forms.get(kind)??0)+1);
  }
  assert(local.state().peakCachedNodes<=256);
  console.log('Distinct calls on canonical proof routes:',calls.length,Object.fromEntries(forms));
 }finally{local.dispose();}
 const ordinary=await P.open(d,record,{fetcher});
 try{
  assert.equal(await ordinary.run(()=>A.walk(ordinary.data,chosen.route)),chosen.node);
  console.log('Previous lookup, default cache:',ordinary.state().peakCachedPages,'source pages');
 }finally{ordinary.dispose();}
 const baseline=await P.open(d,record,{pageLimit:1,indexLimit:1,fetcher});
 try{
  await assert.rejects(baseline.run(()=>A.walk(baseline.data,chosen.route)),/retry limit/);
 }finally{baseline.dispose();}
 return true;
}
(async()=>{
 const sorted=window.PROOF_ATLAS_SOURCE_PAGES.records.slice().sort((a,b)=>b.nodes-a.nodes);
 let checked=0;
 for(const d of sorted.slice(0,3))if(await check(d))checked++;
 assert(checked>=2,'expected substitutions in at least two large source packets');
})().catch(e=>{console.error(e);process.exitCode=1;});
