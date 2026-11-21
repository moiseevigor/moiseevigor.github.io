'use strict';
const fs=require('node:fs'), z=require('node:zlib'), crypto=require('node:crypto'), assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {arithmeticInference,equalityChain,rewriteSequence,formulaTransport}=require('../../../public/js/proof-atlas-arithmetic');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');

function scan(d){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d), root=g.roots[1];
 assert(Number.isInteger(root));
 const examples=[],premises={},chains=[],arithmetic=[];let nested=0,transitive=0;const lengths={};
 const visited=new Set(), stack=[{node:root,parent:null}];
 const counts={mp:0,mpr:0,left:0,right:0,reverseLeft:0,reverseRight:0}, operators={};
 while(stack.length){
  const item=stack.pop(),node=item.node;
  if(visited.has(node))continue;
  visited.add(node);
  const call=spine(g,node),name=g.payloads[call.head]?.name;
  if(name==='Eq.trans' && call.args.length===6){
   const slots=[];
   for(let p=item;p.parent;p=p.parent)slots.push(p.slot);
   const route={root:1,slots:slots.reverse()},chain=equalityChain(g,{node,route});
   assert(chain);
   [chain.start,chain.middle,chain.end,chain.first,chain.second].forEach((site,i)=>{
    assert.equal(A.walk(g,site.route),call.args[i+1]);
    assert.deepEqual(site.route.slots,route.slots.concat(Array(4-i).fill(0),1));
   });
   transitive++;
  }
  if(call.args.length===4 && (name==='Eq.mp'||name==='Eq.mpr')){
   counts[name==='Eq.mp'?'mp':'mpr']++;
   const slots=[];
   for(let p=item;p.parent;p=p.parent)slots.push(p.slot);
   const route={root:1,slots:slots.reverse()},t=formulaTransport(g,{node,route});
   if(t?.change){
    const producer=spine(g,t.premise.node);
    const head=g.payloads[producer.head]?.name||'kind '+g.kind[producer.head];
    premises[head]=(premises[head]||0)+1;
    const inference=arithmeticInference(g,t.premise);
    if(inference){
     const sites=[...inference.terms,...inference.proofs];
     assert.equal(inference.name,head);
     const partial={node:g.children[t.premise.node][0],route:{root:1,slots:t.premise.route.slots.concat(0)}};
     assert.equal(arithmeticInference(g,partial),null);
     sites.forEach((s,i)=>{
      assert.equal(A.walk(g,s.route),producer.args.at(i-sites.length));
      assert.deepEqual(s.route.slots,t.premise.route.slots.concat(Array(sites.length-i-1).fill(0),1));
     });
     arithmetic.push({proof:d.name,at:{node,route},premise:t.premise,sites:[...inference.proofs,...inference.terms],labels:inference.premises,conclusion:inference.conclusion});
    }
    const chain=equalityChain(g,t.premise,t.before);
    if(chain){
     assert.equal(head,'Eq.trans');
     assert.deepEqual(producer.args.slice(0,4),[t.before.parameters[0].node,t.before.left.site.node,chain.middle.node,t.before.right.site.node]);
     const sites=[chain.start,chain.middle,chain.end,chain.first,chain.second];
     sites.forEach((s,i)=>{
      assert.equal(A.walk(g,s.route),producer.args[i+1]);
      assert.deepEqual(s.route.slots,t.premise.route.slots.concat(Array(4-i).fill(0),1));
     });
     assert.equal(equalityChain(g,t.premise,{...t.before,right:{site:{node:-1}}}),null);
     chains.push({proof:d.name,at:{node,route},premise:t.premise,sites});
    }
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
    assert.deepEqual(before.args.map((x,i)=>i===index?after.args[index]:x),after.args);
    assert.notEqual(before.args[index],after.args[index]);
    let a=before.args[index],b=after.args[index];
    for(const slot of c.path){
     assert.equal(g.kind[a],5);assert.equal(g.kind[b],5);
     assert.equal(g.children[a][1-slot],g.children[b][1-slot]);
     a=g.children[a][slot];b=g.children[b][slot];
    }
    assert.equal(a,eq.args[first]);assert.equal(b,eq.args[last]);
    assert.deepEqual(c.from.route.slots,t.before[c.side].site.route.slots.concat(c.path));
    assert.deepEqual(c.to.route.slots,t.after[c.side].site.route.slots.concat(c.path));
    if(c.path.length){
     nested++;
     if(d.name==='JacobiData.slope_bound_abs'){
      const parent=g.children[t.after[c.side].site.node];
      const fixed=1-c.path[0],children=g.children.slice();
      const differentLeaf=g.children.findIndex((row,i)=>row.length===0 && i!==parent[fixed]);
      assert(differentLeaf>=0);
      const changed=parent.slice();changed[fixed]=differentLeaf;
      children[t.after[c.side].site.node]=changed;
      const damaged=formulaTransport({...g,children},{node,route});
      assert(!damaged?.change);
     }
    }
    for(const [site,expected] of [[t.before.site,source],[t.after.site,target],[c.from,eq.args[first]],[c.to,eq.args[last]],[c.context,eq.args[4]],[c.certificate,eq.args[5]]]){
     assert.equal(site.node,expected);assert.equal(A.walk(g,site.route),expected);
     assert.deepEqual(site.route.slots.slice(0,slots.length),slots);
    }
    assert.equal(A.walk(g,c.witness.route),wrapped?wrapper.args[1]:call.args[2]);
    const steps=rewriteSequence(g,{node,route},t);
    assert.deepEqual(steps.at(-1).at,{node,route});assert(steps.length<=8);
    lengths[steps.length]=(lengths[steps.length]||0)+1;
    for(let i=1;i<steps.length;i++){
     const prev=steps[i-1],next=steps[i];
     const prevCall=spine(g,prev.at.node),nextCall=spine(g,next.at.node);
     assert.equal(nextCall.args[3],prev.at.node);
     assert.deepEqual(prev.at.route.slots,next.at.route.slots.concat(1));
     const output=prevCall.args[g.payloads[prevCall.head].name==='Eq.mp'?1:0];
     const input=nextCall.args[g.payloads[nextCall.head].name==='Eq.mp'?0:1];
     assert.equal(output,input);
    }
    if(d.name==='JacobiData.slope_bound_abs')examples.push({sequence:steps.length>1?[steps[0].term.before.site,steps[0].term.premise,...steps.flatMap(s=>[s.term.after.site,s.at])]:[],route,path:c.path,side:c.side,reverse,node,links:[t.before.site,t.after.site,c.from,c.to,c.certificate,c.context]});
    counts[reverse?(c.side==='left'?'reverseLeft':'reverseRight'):c.side]++;
    const operator=g.payloads[before.head].name;
    operators[operator]=(operators[operator]||0)+1;
   }
  }
  g.children[node].forEach((child,slot)=>stack.push({node:child,parent:item,slot}));
 }
 return {counts,operators,examples,nested,lengths,premises,chains,arithmetic,transitive};
}

for(const edition of [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition]){
 const rows=edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable);
 const totals={mp:0,mpr:0,left:0,right:0,reverseLeft:0,reverseRight:0},operators={};
 const lengths={},premises={},chains=[],arithmetic=[];let transitive=0;
 let matchedProofs=0,nested=0,riccati,examples;
 for(const d of rows){
  const result=scan(d);nested+=result.nested;transitive+=result.transitive;chains.push(...result.chains);arithmetic.push(...result.arithmetic);
  for(const [k,n] of Object.entries(result.premises))premises[k]=(premises[k]||0)+n;
  for(const [k,n] of Object.entries(result.lengths))lengths[k]=(lengths[k]||0)+n;
  for(const [k,n] of Object.entries(result.counts))totals[k]+=n;
  for(const [k,n] of Object.entries(result.operators))operators[k]=(operators[k]||0)+n;
  if(result.counts.left+result.counts.right+result.counts.reverseLeft+result.counts.reverseRight)matchedProofs++;
  if(d.name==='JacobiData.slope_bound_abs'){riccati=result.counts;examples=result.examples;}
 }

 if(edition===window.PROOF_ATLAS_AI_SAMPLE.edition){
  assert.equal(arithmetic.length,46);
  assert.equal(new Set(arithmetic.map(x=>x.proof)).size,15);
 }
 if(edition!==window.PROOF_ATLAS_AI_SAMPLE.edition)assert.deepEqual(riccati,{mp:7,mpr:27,left:7,right:0,reverseLeft:2,reverseRight:4});
 console.log(JSON.stringify({edition:edition.id,theorems:rows.length,totals,matchedProofs,nested,lengths,operators,riccati,examples,premises,transitive,joined:chains.length,arithmeticInputs:arithmetic.length,aiArithmetic:edition===window.PROOF_ATLAS_AI_SAMPLE.edition?arithmetic:undefined,aiChains:edition===window.PROOF_ATLAS_AI_SAMPLE.edition?chains:undefined}));
}
