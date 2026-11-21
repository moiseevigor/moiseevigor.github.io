// Inspect every occurrence of a fully applied Not.intro in the sampled proof bodies.
'use strict';
const assert=require('node:assert/strict');
const union=require('../recorded-union.cjs');
const packed=require('../../../public/js/proof-atlas-packed-routes');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {contraryClosure}=require('./explicit-premise-outline.cjs');

async function census(item) {
  const graph=(await union.open(item)).case.data, root=graph.roots[1];
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
