/* Fork of frontier-functions/model.cjs at 82e0c7572.
   Constructor rules are unchanged; syntax-key memoization follows stored nodes. */
/* Independent de Bruijn construction; no evaluation or type inference. */
'use strict';
const assert=require('assert/strict'),crypto=require('crypto'),A=require('../../../public/js/proof-atlas-library-data'),M=require('../region-output-composition/model.cjs');
const {table,compact}=require('../method-context/catalogue.cjs');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
function keys(g,shift=0,cutoff=0){
 const plainMemo=new Map(),memo=new Map();
 function plain(n){if(plainMemo.has(n))return plainMemo.get(n);assert(plainMemo.size<131072);const h=hash([g.kind[n],g.payloads[n],g.children[n].map(plain)]);plainMemo.set(n,h);return h;}
 function key(n,d=0){
  // Literal syntax is independent of binder depth. Closed-to-this-cutoff
  // subgraphs are also unaffected by shifting; scope ownership is separate.
  if(shift===0||g.neededScope[n]<=d+cutoff)return plain(n);
  const tag=n+':'+d;if(memo.has(tag))return memo.get(tag);assert(memo.size<262144);
  const k=g.kind[n],p=k===0&&g.payloads[n].index>=d+cutoff?{index:g.payloads[n].index+shift}:g.payloads[n],h=hash([k,p,g.children[n].map((c,s)=>key(c,d+Number(binds(k,s))))]);memo.set(tag,h);return h;
 }return key;
}
function importNode(t,g,shift=0,cutoff=0){const memo=new Map();function read(n,d=0){const tag=n+':'+d;if(memo.has(tag))return memo.get(tag);assert(t.g.kind.length<131072);const k=g.kind[n],p=k===0&&g.payloads[n].index>=d+cutoff?{index:g.payloads[n].index+shift}:g.payloads[n],v=t.add(k,p,g.children[n].map((c,s)=>read(c,d+(binds(k,s)?1:0))));memo.set(tag,v);return v;}return read;}
const equalRoot=(g,n,h,m)=>keys(g)(n)===keys(h)(m);
function validate(g,c){
 assert(c.holes.length>0&&c.holes.length<=64);const at=a=>{let n=g.roots[a.route.root];for(const s of a.route.slots){assert(Number.isInteger(s)&&s>=0&&s<g.children[n].length);n=g.children[n][s];}assert.equal(n,a.node);};
 const prefix=c.prefixRoute.slots;assert.equal(prefix.length<=512,true);
 let root=g.roots[c.prefixRoute.root];for(const s of prefix)root=g.children[root][s];
 assert.deepEqual(M.context(g,{node:root,route:c.prefixRoute}),c.context);
 const routes=c.holes.map(h=>{at(h.anchor);assert.equal(h.anchor.route.root,c.prefixRoute.root);assert.deepEqual(h.anchor.route.slots.slice(0,prefix.length),prefix);assert.deepEqual(M.context(g,h.anchor),h.context);return h.anchor.route.slots.slice(prefix.length);});
 for(let i=0;i<routes.length;i++)for(let j=0;j<i;j++){const a=routes[i],b=routes[j];assert(!(JSON.stringify(a.slice(0,b.length))===JSON.stringify(b)||JSON.stringify(b.slice(0,a.length))===JSON.stringify(a)),'overlapping source frontier');}
 return{root,routes};
}
function type(t,original,previous,index,generalize=true){
 const g=original,exact=keys(g),old=new Map(),memo=new Map();
 function visit(n,d=0){const tag=n+':'+d;if(memo.has(tag))return memo.get(tag);assert(memo.size<262144);let matched=-1;
  if(generalize){if(!old.has(d))old.set(d,previous.map(h=>keys(h,d)(h.roots[0])));matched=old.get(d).findIndex(k=>k===exact(n));}
  let value;if(matched>=0)value=t.add(0,{index:d+index-1-matched});
  else{const k=g.kind[n],p=k===0&&g.payloads[n].index>=d?{index:g.payloads[n].index+index}:g.payloads[n];value=t.add(k,p,g.children[n].map((ch,s)=>visit(ch,d+(binds(k,s)?1:0))));}
  memo.set(tag,value);return value;
 }return visit(g.roots[1]);
}
function construct(g,c,holes){
 const out={holes};
 const {root,routes}=validate(g,c),count=c.holes.length,shared=c.context.length,t=table();assert.equal(out.holes.length,count);let work=0;
 for(let i=0;i<count;i++){
  const h=out.holes[i];assert.deepEqual(h.source,c.holes[i]);assert.deepEqual(h.context,c.holes[i].context);
  const expected=M.close(g,{anchor:c.holes[i].anchor,context:c.holes[i].context},shared,h.originalType);
  for(let k=0;k<2;k++)assert(equalRoot(expected,expected.roots[k],h.original,h.original.roots[k]),'original source closure');
  assert.deepEqual(h.letSlots,c.holes[i].context.slice(shared).map(f=>f.kind==='letE'));
 }
 const untouched=new Map();
 function copy(node,path=[],depth=0){
  assert(++work<=65536&&path.length<=512);const hit=routes.findIndex(r=>JSON.stringify(r)===JSON.stringify(path));
  if(hit>=0){let value=t.add(0,{index:depth+count-1-hit});const suffix=c.holes[hit].context.slice(shared);assert.equal(suffix.length,depth);for(let j=0;j<suffix.length;j++)if(suffix[j].kind!=='letE')value=t.add(5,{},[value,t.add(0,{index:depth-1-j})]);return value;}
  if(!routes.some(r=>r.length>path.length&&JSON.stringify(r.slice(0,path.length))===JSON.stringify(path))){if(!untouched.has(depth))untouched.set(depth,importNode(t,g,count,depth));return untouched.get(depth)(node);}
  const k=g.kind[node];return t.add(k,g.payloads[node],g.children[node].map((ch,s)=>copy(ch,[...path,s],depth+(binds(k,s)?1:0))));
 }
 let body=copy(root),domains=[];
 for(let i=0;i<count;i++){const d=type(t,out.holes[i].original,out.holes.slice(0,i).map(h=>h.original),i,c.generalizeTypes);domains.push(d);}
 for(let i=count-1;i>=0;i--)body=t.add(6,{binderName:'input'+i,binderNameParts:[{str:'input'+i}],binderInfo:'default'},[domains[i],body]);
 return{graph:compact(t.g,[body]),table:t.g,domains,work};
}
function reconstruct(g,c,out){
 assert.equal(out.namespace,'source-frontier-function');assert.deepEqual(out.context,c.context);
 const built=construct(g,c,out.holes),{graph:result,table,domains,work}=built;
 for(let i=0;i<domains.length;i++)assert(equalRoot(table,domains[i],out.parameterTypes[i],out.parameterTypes[i].roots[0]),'dependent parameter domain');
 assert(equalRoot(result,result.roots[0],out.graph,out.graph.roots[0]),'complete function term');
 let typeNode=out.graph.roots[1];for(let i=0;i<domains.length;i++){assert.equal(out.graph.kind[typeNode],7);assert(equalRoot(table,domains[i],out.graph,out.graph.children[typeNode][0]),'function telescope domain');typeNode=out.graph.children[typeNode][1];}
 assert(equalRoot(g,validate(g,c).root,out.sourceGraph,out.sourceGraph.roots[0]),'selected source root');
 return{graph:result,domains:domains.length,work,rows:result.kind.length};
}
module.exports={validate,reconstruct,construct,equalRoot,keys};
