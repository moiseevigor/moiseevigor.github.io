// Compare the paged Eq.mp / Eq.mpr reading with compiled proof-root occurrences.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {gunzipSync}=require('node:zlib');
const atlas=require('../../../public/js/proof-atlas-library-data');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {pagedEqualityRule,pagedTransportChain,firstStructuralDifference}=require('../../../public/js/proof-atlas-omitted-references');
const {sourceInput}=require('../../../public/js/proof-atlas-application-ports');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');

const requests=[];
async function check(descriptor,record){
 const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(raw).digest('hex'),descriptor.indexSha256);
 const data=atlas.validateIndex(JSON.parse(raw),record),root=data.roots[1];
 const visits=Array(root+1).fill(0n),parents=new Map();
 visits[root]=1n;
 const counts={mp:0,mpr:0,forward:0n,reverse:0n,partial:0,joined:0,different:0,capped:0};
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
   const chain=await pagedTransportChain(cursor,result);
   let current=call,boundary=null;
   for(let i=0;i<8;i++){
    const s=spine(data,current.node),direction=data.payloads[s.head].name;
    const step=chain.steps[i];
    assert.equal(step.rule,direction);
    assert.deepEqual(step.equality,sourceInput(data,current,3));
    assert.deepEqual(step.from,sourceInput(data,current,direction==='Eq.mp'?1:2));
    assert.deepEqual(step.to,sourceInput(data,current,direction==='Eq.mp'?2:1));
    const next=sourceInput(data,current,4);
    if(i===7){boundary={kind:'display limit',term:next};counts.capped++;break;}
    const nested=spine(data,next.node),op=data.payloads[nested.head].name;
    if(!['Eq.mp','Eq.mpr'].includes(op)||nested.args.length!==4){
     assert.equal(chain.steps.length,i+1);break;
    }
    const inner=sourceInput(data,next,op==='Eq.mp'?2:1);
    if(inner.node!==step.from.node){
     boundary={kind:'different rows',inner,outer:step.from};
     if(i===0){
      counts.different++;
      if(record.name==='JacobiData.slope_bound_abs'){
       requests.push({name:record.name,indexSha256:record.indexSha256,edition:descriptor.edition,
        sourceSha256:record.sourceSha256,call,outer:step.from,nested:inner,field:'transport input'});
       const diff=firstStructuralDifference(data,inner.node,step.from.node);
       assert.equal(diff.status,'constructor');
       const heads=[diff.left,diff.right].map(row=>data.payloads[spine(data,row).head].name);
       assert.deepEqual(heads.sort(),['Real.instMonoid','Semiring.toMonoid']);
      }
     }
     assert.equal(chain.steps.length,i+1);break;
    }
    if(i===0)counts.joined++;
    current=next;
   }
   assert.deepEqual(chain.boundary,boundary);
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
async function checkDisplayLimit(){
 const data={roots:[],kind:[],children:[],payloads:[]};
 function add(kind,children,payload={}){
  data.children.push(children);data.payloads.push(payload);return data.kind.push(kind)-1;
 }
 const mp=add(4,[],{name:'Eq.mp',nameParts:[{str:'Eq'},{str:'mp'}]});
 const a=add(4,[],{name:'A'}),b=add(4,[],{name:'B'}),h=add(4,[],{name:'h'});
 let term=add(4,[],{name:'t'});
 for(let i=0;i<10;i++){
  let fn=mp;
  for(const arg of [i%2?b:a,i%2?a:b,h,term])fn=add(5,[fn,arg]);
  term=fn;
 }
 data.roots=[term];
 const cursor={data,run:fn=>fn(),resolveRoute:route=>{
  const node=atlas.walk(data,route);return {node,kind:data.kind[node]};
 }};
 const outer=await pagedEqualityRule(cursor,{root:0,slots:[]});
 const chain=await pagedTransportChain(cursor,outer);
 assert.equal(chain.steps.length,8);
 assert.deepEqual(chain.boundary.term.route,{root:0,slots:Array(8).fill(1)});
 const next=await pagedEqualityRule(cursor,chain.boundary.term.route);
 const rest=await pagedTransportChain(cursor,next);
 assert.equal(rest.steps.length,2);
 assert.equal(rest.boundary,null);
}
(async()=>{
 await checkDisplayLimit();
 const window={};
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
 const items=inventory(),totals={};
 for(const d of window.PROOF_ATLAS_SOURCE_PAGES.records){
  const {record}=items.find(i=>i.edition===d.edition&&i.record.indexSha256===d.indexSha256);
  const c=await check(d,record);
  const s=totals[d.edition]??={packets:0,matching:0,mp:0,mpr:0,forward:0n,reverse:0n,partial:0,joined:0,different:0,capped:0};
  s.packets++;if(c.mp+c.mpr)s.matching++;
  for(const key of Object.keys(c))s[key]+=c[key];
 }
 console.table(totals);
 if(process.argv[2]==='--transport-requests')fs.writeFileSync(process.argv[3],JSON.stringify(requests));
})().catch(e=>{console.error(e);process.exitCode=1;});
