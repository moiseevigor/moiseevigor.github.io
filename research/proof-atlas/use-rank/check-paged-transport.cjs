// Compare the paged Eq.mp / Eq.mpr reading with compiled proof-root occurrences.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {createHash}=require('node:crypto');
const {gunzipSync}=require('node:zlib');
const atlas=require('../../../public/js/proof-atlas-library-data');
const pages=require('../../../public/js/proof-atlas-source-pages');
const {pagedEqualityRule,pagedTransportChain,pagedTypeDifferences,firstStructuralDifference}=require('../../../public/js/proof-atlas-omitted-references');
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
 const counts={mp:0,mpr:0,forward:0n,reverse:0n,partial:0,joined:0,different:0,capped:0,single:0,several:0,limited:0,identical:0,rootOnly:0,rawLimited:0,folded:0,foldedForward:0,expandedFolded:0n};
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
   if(left.node===right.node){
    counts.folded++;if(forward)counts.foldedForward++;counts.expandedFolded+=visits[id];
    assert.deepEqual(atlas.binding(data,left.route),atlas.binding(data,right.route));
    assert.notDeepEqual(left.route,right.route);
   }
   const diff=await pagedTypeDifferences(cursor,result.from,result.to);
   const expected=[];
   function collect(l,r,path){
    if(l===r)return;
    const a=spine(data,l),b=spine(data,r);
    const differentCall=data.kind[l]===5 && data.kind[r]===5 && a.args.length<=12 && b.args.length<=12 &&
     (a.head!==b.head || a.args.length!==b.args.length);
    if(differentCall || data.kind[l]!==data.kind[r] || atlas.payloadKey(data.kind[l],data.payloads[l])!==atlas.payloadKey(data.kind[r],data.payloads[r])){
     expected.push([l,r,path]);return;
    }
    data.children[l].forEach((child,i)=>collect(child,data.children[r][i],path.concat(i)));
   }
   collect(result.from.node,result.to.node,[]);
   if(expected.length===1 && expected[0][2].length===0)counts.rootOnly++;
   const rawPending=[[result.from.node,result.to.node]];
   let inspected=0,rawDifferences=0;
   while(rawPending.length && inspected<128 && rawDifferences<8){
    const [l,r]=rawPending.pop();
    if(l===r)continue;
    inspected++;
    if(data.kind[l]!==data.kind[r] || atlas.payloadKey(data.kind[l],data.payloads[l])!==atlas.payloadKey(data.kind[r],data.payloads[r])){
     rawDifferences++;continue;
    }
    for(let i=data.children[l].length-1;i>=0;i--){
     if(data.children[l][i]!==data.children[r][i])rawPending.push([data.children[l][i],data.children[r][i]]);
    }
   }
   if(rawPending.length)counts.rawLimited++;

   if(diff.complete)assert.equal(diff.changes.length,expected.length);
   for(const [i,change] of diff.changes.entries()){
    const [l,r,path]=expected[i];
    if(change.context){
     const outer=spine(data,result.from.node);
     const slot=outer.args.findIndex((_,j)=>{
      const arg=sourceInput(data,result.from,j+1);
      return arg.route.slots.every((s,k)=>change.from.route.slots[k]===s);
     });
     assert(slot>=0);
     assert.equal(change.context,'Argument '+(slot+1)+' of '+(data.payloads[outer.head].name??atlas.kinds[data.kind[outer.head]]));
    }
    for(const [at,base,node] of [[change.from,result.from,l],[change.to,result.to,r]]){
     assert.deepEqual(at.route,{root:base.route.root,slots:base.route.slots.concat(path)});
     assert.equal(at.node,node);assert.equal(atlas.walk(data,at.route),node);
    }
   }
   counts[!diff.complete?'limited':expected.length===0?'identical':expected.length===1?'single':'several']++;
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
 // Shared subtrees can have several distinct occurrences under the same context.
 let l=add(0,[],{index:0}),r=add(0,[],{index:1});
 for(let i=0;i<4;i++){
  l=add(5,[add(5,[mp,l]),l]);r=add(5,[add(5,[mp,r]),r]);
 }
 const at=node=>({node,route:{root:0,slots:[]}});
 const many=await pagedTypeDifferences(cursor,at(l),at(r));
 assert.equal(many.complete,false);assert.equal(many.changes.length,8);
 assert.equal(new Set(many.changes.map(c=>c.from.route.slots.join('.'))).size,8);
 for(let i=0;i<129;i++){l=add(10,[l]);r=add(10,[r]);}
 const deep=await pagedTypeDifferences(cursor,at(l),at(r));
 assert.deepEqual(deep,{changes:[],complete:false});
}
(async()=>{
 await checkDisplayLimit();
 const window={};
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
 if(process.argv.includes('--published-identities')){
  require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window});
  const records=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.filter(r=>r.kind==='theorem'&&r.bodyAvailable);
  const counts={'Eq.mp':{rows:0,shared:0,visits:0n,foldable:0n},'Eq.mpr':{rows:0,shared:0,visits:0n,foldable:0n}};
  for(const record of records){
   const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
   assert.equal(createHash('sha256').update(raw).digest('hex'),record.indexSha256);
   const data=atlas.validateIndex(JSON.parse(raw),record),root=data.roots[1];
   const visits=Array(root+1).fill(0n);visits[root]=1n;
   for(let id=root;id>=0;id--){
    if(!visits[id])continue;
    for(const child of data.children[id])visits[child]+=visits[id];
    if(data.kind[id]!==5)continue;
    const {head,args}=spine(data,id),p=data.payloads[head];
    if(data.kind[head]!==4 || !Object.hasOwn(counts,p.name) || args.length!==4)continue;
    assert.deepEqual(p.nameParts,[{str:'Eq'},{str:p.name.slice(3)}]);
    const c=counts[p.name];c.rows++;c.visits+=visits[id];
    if(args[0]===args[1]){c.shared++;c.foldable+=visits[id];}
   }
   assert.equal(visits.reduce((a,b)=>a+b,0n),BigInt(data.expanded[root]));
  }
  console.log('Published theorem bodies:',records.length);console.table(counts);return;
 }
 const items=inventory(),totals={};
 for(const d of window.PROOF_ATLAS_SOURCE_PAGES.records){
  const {record}=items.find(i=>i.edition===d.edition&&i.record.indexSha256===d.indexSha256);
  const c=await check(d,record);
  const s=totals[d.edition]??={packets:0,matching:0,mp:0,mpr:0,forward:0n,reverse:0n,partial:0,joined:0,different:0,capped:0,single:0,several:0,limited:0,identical:0,rootOnly:0,rawLimited:0,folded:0,foldedForward:0,expandedFolded:0n};
  s.packets++;if(c.mp+c.mpr)s.matching++;
  for(const key of Object.keys(c))s[key]+=c[key];
 }
 console.table(totals);
 if(process.argv[2]==='--transport-requests')fs.writeFileSync(process.argv[3],JSON.stringify(requests));
})().catch(e=>{console.error(e);process.exitCode=1;});
