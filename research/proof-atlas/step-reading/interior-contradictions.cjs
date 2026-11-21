// Inspect every occurrence of a fully applied Not.intro in the sampled proof bodies.
'use strict';
const assert=require('node:assert/strict');
const union=require('../recorded-union.cjs');
const packed=require('../../../public/js/proof-atlas-packed-routes');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {contraryClosure}=require('./explicit-premise-outline.cjs');

const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');

// Resolve every external variable used by a small shared body at its actual occurrence.
function externalBindings(profile,body) {
  const graph=profile.data;
  const owners=new Map();
  const prefix=body.route.slots, address=prefix.slice();
  function walk(node,depth) {
    if(graph.kind[node]===0 && graph.payloads[node].index>=depth){
      const index=graph.payloads[node].index-depth;
      const use=packed.encode(body.route.root,address), resolved=packed.resolve(graph,use);
      assert.equal(resolved.node,node);
      assert(resolved.binding && resolved.binding.route.depth<prefix.length);
      const previous=owners.get(index);
      if(previous){
        assert.deepEqual(previous.owner,resolved.binding);
        previous.count++;
      }else owners.set(index,{index,owner:resolved.binding,name:graph.payloads[resolved.binding.node].binderName??graph.payloads[resolved.binding.node].declName,
        recordedUseType:profile.get(use)?.typeText??null,
        count:1,firstUse:use});
    }
    for(const [slot,child] of graph.children[node].entries()){
      address.push(slot);
      const k=graph.kind[node], binds=(k===6 || k===7) && slot===1 || k===8 && slot===2;
      walk(child,depth+Number(binds));
      address.pop();
    }
  }
  if(BigInt(graph.expanded[body.node])>100000n)return {status:'size limit'};
  walk(body.node,0);
  for(let index=0;index<graph.neededScope[body.node];index++){
    const count=countReferences(graph,body.node,index);
    assert.equal(count.status,'counted');
    assert.equal(BigInt(count.occurrences),BigInt(owners.get(index)?.count??0));
  }
  return {status:'counted',body,bindings:[...owners.values()].sort((a,b)=>a.index-b.index)};
}

async function census(item) {
  const profile=(await union.open(item)).case, graph=profile.data, root=graph.roots[1];
  const selected=new Set(), below=[];
  for(let node=0;node<=root;node++){
    const {head,args}=spine(graph,node);
    if(args.length===2 && graph.kind[head]===4 && graph.payloads[head].name==='Not.intro') selected.add(node);
    below[node]=graph.children[node].reduce((sum,child)=>sum+below[child],BigInt(selected.has(node)));
  }
  const rows=new Set(), matches=new Set(), examples=[];
  function visit(node,slots){
    if(!below[node])return;
    if(selected.has(node)){
      rows.add(node);
      const route=packed.encode(1,slots), closure=contraryClosure(graph,route,node);
      let trace=null;
      if(closure){
        matches.add(node);
        trace={uses:closure.uses,limited:closure.limited,meetings:closure.meetings,
          target:closure.transportTarget.map(s=>({node:s.node,literal:s.numeral?.value??null})),
          reached:closure.witnesses.filter(w=>w.reachedTransport).length,
          paths:closure.witnesses.map(w=>w.steps.length)};
        if(closure.uses==='0')trace.external=externalBindings(profile,closure.close);
      }
      examples.push({node,route,trace});
    }
    for(const [slot,child] of graph.children[node].entries())
      if(below[child])visit(child,slots.concat(slot));
  }
  visit(root,[]);
  assert.equal(BigInt(examples.length),below[root]);
  return {proof:item.record.name,indexSha256:item.record.indexSha256,rows:rows.size,matchedRows:matches.size,examples};
}
(async()=>{
  const reports=[];
  for(const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331'))reports.push(await census(item));
  console.log(JSON.stringify(reports,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
