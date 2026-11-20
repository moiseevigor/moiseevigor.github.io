// Exhaustive occurrence oracle for the finite domains displayed by the reader.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const examples=JSON.parse(html.match(/^const examples=(.*);$/m)[1]);
const results=[];
for(const {edition,record} of inventory()){
  const calls=examples.filter(c=>c.source.indexSha256===record.indexSha256 && c.source.edition===edition);
  if(!calls.length)continue;
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=atlas.validateIndex(JSON.parse(bytes),record);
  for(const call of calls)for(const p of call.ports.filter(p=>p.binding)){
    const b=p.binding,domain=b.domain,seen=new Map();
    const paired=b.anchor.route.slots.every(k=>k===1) && b.anchor.route.slots.concat(1).every((_,i)=>{
      const slots=b.anchor.route.slots.slice(0,i);
      const statement=atlas.walk(data,{root:0,slots}),proof=atlas.walk(data,{root:1,slots});
      return data.kind[statement]===7 && data.kind[proof]===6 && data.children[statement][0]===data.children[proof][0];
    });
    assert.deepEqual(b.statement,paired?{node:domain.node,route:{root:0,slots:domain.route.slots}}:null);
    let visited=0,internal=0;
    const path=[...domain.route.slots];
    function visit(node){
      assert(++visited<=50000);
      if(data.kind[node]===0){
        const route={root:domain.route.root,slots:[...path]},binder=atlas.binding(data,route);
        if(binder.route.slots.length>=domain.route.slots.length){internal++;return;}
        const key=JSON.stringify(binder.route);
        if(!seen.has(key))seen.set(key,{count:0,use:{node,route}});
        seen.get(key).count++;
      }
      data.children[node].forEach((child,k)=>{path.push(k);visit(child);path.pop();});
    }
    visit(domain.node);
    assert.equal(b.references.length,seen.size);
    for(const r of b.references){
      const witness=seen.get(JSON.stringify(r.binder.route));
      assert.deepEqual(r.use,witness.use);
      assert.equal(r.count,String(witness.count));
    }
    results.push({packet:record.indexSha256,call:call.callId,slot:p.slot,paired,domain,visited,internal,
      outerReferences:[...seen.values()].reduce((n,r)=>n+r.count,0)});
  }
}
console.log(JSON.stringify(results,null,2));
