'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {dependencies}=require('./formal-edges.cjs');
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
  const result={name:item.source.name,nativeOwner:item.nativeOwner,calls:calls.size,available:0,empty:0,unavailable:0,edges:0};
  for(const ports of calls.values()){
    for(const port of ports.slice(1)){
      const edges=dependencies(ports[0],port);
      if(edges===null){result.unavailable++;continue;}
      for(const witness of edges){
        const head=ports[0], graph=head.graph, scope=[];
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
      result.available++;result.edges+=edges.length;
      if(!edges.length)result.empty++;
    }
  }
  records.push(result);
}
console.log(JSON.stringify(records,null,2));
