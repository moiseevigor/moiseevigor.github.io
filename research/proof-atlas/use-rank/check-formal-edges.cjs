'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {dependencies,conclusion}=require('./formal-edges.cjs');
function checkPaths(head,edges){
  for(const witness of edges){
    const graph=head.graph, scope=[];
    let node=head.roots[witness.root];
    for(const [i,field] of witness.slots.entries()){
      const kind=graph.kind[node];
      if(((kind===6 || kind===7) && field===1) || (kind===8 && field===2)){
        scope.push(witness.slots.slice(0,i));
      }
      node=graph.children[node][field];
    }
    assert.equal(node,witness.node);
    assert.equal(graph.kind[node],0);
    const target=scope.at(-1-graph.payloads[node].index);
    assert.deepEqual(target,Array(witness.slot-1).fill(1));
  }
}

// Independent bottom-up free-index sets give an oracle for absent edges as well.
function resultSlots(head,arity){
  const g=head.graph;
  let node=head.roots.inputType;
  for(let i=0;i<arity;i++)node=g.children[node][1];
  const free=[];
  for(let n=0;n<=node;n++){
    const kind=g.kind[n], indices=new Set();
    if(kind===0)indices.add(g.payloads[n].index);
    g.children[n].forEach((child,field)=>{
      const shift=Number(([6,7].includes(kind) && field===1) || (kind===8 && field===2));
      for(const index of free[child])if(index>=shift)indices.add(index-shift);
    });
    free.push(indices);
  }
  return [...free[node]].filter(i=>i<arity).map(i=>arity-i).sort((a,b)=>a-b);
}
const records=[];
for(const item of require('./port-results.json')){
  const bytes=z.gunzipSync(fs.readFileSync('public/data/proof-atlas/application-ports/'+item.nativeOwner+'.json.gz'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.nativeOwner);
  const packet=JSON.parse(bytes),calls=new Map();
  assert.deepEqual(packet.source,item.source);
  for(const {id,junction} of packet.entries){
    const [call,slot]=id.split(':').map(Number);
    if(!calls.has(call))calls.set(call,[]);
    calls.get(call)[slot]=junction;
  }
  const result={name:item.source.name,nativeOwner:item.nativeOwner,calls:calls.size,available:0,empty:0,unavailable:0,edges:0,conclusions:0,resultEdges:0,proofResultEdges:0};
  for(const ports of calls.values()){
    const resultRefs=conclusion(ports);
    if(resultRefs){
      checkPaths(ports[0],resultRefs);
      assert.deepEqual(resultRefs.map(e=>e.slot),resultSlots(ports[0],ports.length-1));
      result.conclusions++;
      result.resultEdges+=resultRefs.length;
      result.proofResultEdges+=resultRefs.filter(e=>ports[e.slot].producer.role==='proof').length;
    }
    for(const port of ports.slice(1)){
      const edges=dependencies(ports[0],port);
      if(edges===null){result.unavailable++;continue;}
      checkPaths(ports[0],edges);
      result.available++;result.edges+=edges.length;
      if(!edges.length)result.empty++;
    }
  }
  records.push(result);
}
const window={};
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window});
const controls=[];
for(const [name,slots] of [['AtlasTransportControls.proofDependent',[3,5,6]],['AtlasApplicationPorts.partialUse',[1,3]]]){
  const d=window.PROOF_ATLAS_NETWORK_STREAMING.records.find(x=>x.source.name===name);
  const bytes=z.gunzipSync(fs.readFileSync('.'+d.owner.file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),d.owner.sha256);
  const ports=JSON.parse(bytes).entries.map(e=>e.junction).sort((a,b)=>a.consumer.slot-b.consumer.slot);
  const edges=conclusion(ports);
  checkPaths(ports[0],edges);
  assert.deepEqual(edges.map(e=>e.slot),slots);
  assert.deepEqual(resultSlots(ports[0],ports.length-1),slots);
  controls.push({name,owner:d.owner.sha256,result:ports[0].display.consumerType,inputs:edges.map(e=>({...e,role:ports[e.slot].producer.role}))});
}
console.log(JSON.stringify({records,controls},null,2));
