'use strict';
const fs=require('node:fs'), z=require('node:zlib'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {formulaTransport}=require('../../../public/js/proof-atlas-arithmetic');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');

function scan(d){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d), root=g.roots[1];
 assert(Number.isInteger(root));
 const examples=[];
 const visited=new Set(), stack=[{node:root,parent:null}];
 const counts={mp:0,mpr:0,left:0,right:0,reverseLeft:0,reverseRight:0}, operators={};
 while(stack.length){
  const item=stack.pop(),node=item.node;
  if(visited.has(node))continue;
  visited.add(node);
  const call=spine(g,node),name=g.payloads[call.head]?.name;
  if(call.args.length===4 && (name==='Eq.mp'||name==='Eq.mpr')){
   counts[name==='Eq.mp'?'mp':'mpr']++;
   const slots=[];
   for(let p=item;p.parent;p=p.parent)slots.push(p.slot);
   const route={root:1,slots:slots.reverse()},t=formulaTransport(g,{node,route});
   if(t?.change){
    const c=t.change;
    const reverse=name==='Eq.mpr';
    assert.equal(t.reverse,reverse);
    const [source,target]=reverse?[call.args[1],call.args[0]]:call.args;
    const first=reverse?3:2,last=reverse?2:3;
    const before=spine(g,source),after=spine(g,target);
    const wrapper=spine(g,call.args[2]);
    const wrapped=g.payloads[wrapper.head]?.name==='id';
    const eq=wrapped?spine(g,wrapper.args[1]):wrapper;
    if(wrapped)assert.deepEqual(spine(g,wrapper.args[0]).args.slice(1),call.args.slice(0,2));
    assert.equal(g.payloads[eq.head].name,'congrArg');
    assert.equal(before.head,after.head);
    const index=before.args.length-(c.side==='left'?2:1);
    assert.deepEqual(before.args.map((x,i)=>i===index?eq.args[last]:x),after.args);
    assert.notEqual(before.args[index],after.args[index]);
    assert.equal(before.args[index],eq.args[first]);
    for(const [site,expected] of [[t.before.site,source],[t.after.site,target],[c.from,eq.args[first]],[c.to,eq.args[last]],[c.context,eq.args[4]],[c.certificate,eq.args[5]]]){
     assert.equal(site.node,expected);assert.equal(A.walk(g,site.route),expected);
     assert.deepEqual(site.route.slots.slice(0,slots.length),slots);
    }
    assert.equal(A.walk(g,c.witness.route),wrapped?wrapper.args[1]:call.args[2]);
    if(d.name==='JacobiData.slope_bound_abs')examples.push({route,side:c.side,reverse,node,links:[t.before.site,t.after.site,c.from,c.to,c.certificate,c.context]});
    counts[reverse?(c.side==='left'?'reverseLeft':'reverseRight'):c.side]++;
    const operator=g.payloads[before.head].name;
    operators[operator]=(operators[operator]||0)+1;
   }
  }
  g.children[node].forEach((child,slot)=>stack.push({node:child,parent:item,slot}));
 }
 return {counts,operators,examples};
}

for(const edition of window.PROOF_ATLAS_LIBRARY.editions){
 const rows=edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable);
 const totals={mp:0,mpr:0,left:0,right:0,reverseLeft:0,reverseRight:0},operators={};
 let matchedProofs=0,riccati,examples;
 for(const d of rows){
  const result=scan(d);
  for(const [k,n] of Object.entries(result.counts))totals[k]+=n;
  for(const [k,n] of Object.entries(result.operators))operators[k]=(operators[k]||0)+n;
  if(result.counts.left+result.counts.right+result.counts.reverseLeft+result.counts.reverseRight)matchedProofs++;
  if(d.name==='JacobiData.slope_bound_abs'){riccati=result.counts;examples=result.examples;}
 }
 assert.deepEqual(riccati,{mp:7,mpr:27,left:4,right:0,reverseLeft:2,reverseRight:0});
 console.log(JSON.stringify({edition:edition.id,theorems:rows.length,totals,matchedProofs,operators,riccati,examples}));
}
