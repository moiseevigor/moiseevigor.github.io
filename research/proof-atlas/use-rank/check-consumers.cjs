// Compare the standalone reader with the stored reverse-use pages.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Q=require('../../../public/js/proof-atlas-network-stream-pages');
const window={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window});
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const examples=JSON.parse(html.match(/^const examples=(.*);$/m)[1]);
global.fetch=async file=>new Response(fs.readFileSync('.'+file));
async function run(){
 let links=0,empty=0,shared=0;
 for(const example of examples){
  const d=window.PROOF_ATLAS_NETWORK_STREAMING.records.find(d=>d.owner?.sha256===example.nativeOwner);
  assert.equal(d.source.indexSha256,example.source.indexSha256);
  const s=await Q.open(d,{focus:example.callId});
  try{
   const all=[];
   let offset=0;
   do{
    const page=await s.uses(example.callId,offset);
    assert.deepEqual(page.producer.route,example.call.route);assert.equal(page.producer.node,example.call.node);
    for(const e of page.rows){
     const consumer=examples.find(x=>x.nativeOwner===example.nativeOwner && x.callId===e.to);
     const hit=consumer.ports[e.slot].input;
     assert.deepEqual(hit.route,e.input.route);assert.equal(hit.node,e.input.node);
     all.push({callId:e.to,slot:e.slot,hops:e.hops});
    }
    offset+=page.rows.length;
    if(offset===page.total)break;
    assert(page.rows.length);
   }while(true);
   assert.deepEqual(all,example.consumers);
   if(example.source.name==='lean_workbook_4274' && example.callId===2){
     assert.deepEqual(all,[{callId:0,slot:4,hops:1},{callId:1,slot:4,hops:1}]);
     const uses=all.map(u=>examples.find(x=>x.nativeOwner===example.nativeOwner && x.callId===u.callId));
     assert.equal(uses[0].rule,uses[1].rule);
     assert.equal(uses[0].conclusion,uses[1].conclusion);
     assert.equal(uses[0].ports[4].input.node,uses[1].ports[4].input.node);
     assert.notDeepEqual(uses[0].ports[4].input.route,uses[1].ports[4].input.route);
   }
   links+=all.length;if(!all.length)empty++;if(all.length>1)shared++;
  }finally{s.dispose();}
 }
 console.log(JSON.stringify({calls:examples.length,links,empty,shared}));
}
run().catch(error=>{console.error(error);process.exitCode=1;});
