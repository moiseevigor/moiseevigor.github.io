// Build a standalone reader from validated terms and native call observations.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const z = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {open} = require('./model.cjs');
const select = require('./select-branch.js');
const {dependencies,conclusion} = require('./formal-edges.cjs');

function packet(file,hash) {
  const bytes=z.gunzipSync(fs.readFileSync(file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  return JSON.parse(bytes);
}
const examples=[];
for(const item of require('./port-results.json')) {
  const {example,source,nativeOwner}=item;
  const {record}=inventory().find(x=>x.record.indexSha256===source.indexSha256 && x.edition===source.edition);
  const data=atlas.validateIndex(packet('.'+record.indexFile,source.indexSha256),record);
  const native=packet('public/data/proof-atlas/application-ports/'+nativeOwner+'.json.gz',nativeOwner);
  assert.deepEqual(native.source,source);
  const binder=example?.binder ?? {root:1,slots:[]};
  const model=open(data,binder);
  const calls=new Map();
  for(const {id,junction} of native.entries){
    const callId=Number(id.split(':')[0]);
    if(!calls.has(callId))calls.set(callId,[]);
    calls.get(callId).push(junction);
  }
  assert.equal(calls.size,item.calls);
  const addressKey=hit=>hit.route.root+':'+hit.route.slots.join('.')+'#'+hit.node;
  const producers=new Map();
  for(const [id,entries] of calls){
    const anchor=entries[0].consumer.anchor;
    assert.equal(atlas.walk(data,anchor.route),anchor.node);
    assert(!producers.has(addressKey(anchor)));
    producers.set(addressKey(anchor),id);
  }
  const consumers=new Map([...calls.keys()].map(id=>[id,[]]));
  for(const [callId,entries] of calls){
    entries.sort((a,b)=>a.consumer.slot-b.consumer.slot);
    const call=entries[0].consumer.anchor;
    const table=model.branchTable(call.route);
    const ports=[];
    let before=0n;
    for(const [slot,entry] of entries.entries()) {
      assert.equal(entry.consumer.slot,slot);
      assert.deepEqual(entry.consumer.anchor,call);
      const input=entry.consumer.input;
      const hit=model.interval(input.route);
      assert.equal(hit.node,input.node);
      for(let n=1n;n<=hit.count;n++) {
        const found=select(table,before+n);
        const expected=model.select(hit.first+n-1n);
        assert.equal(found.node,expected.node);
        assert.deepEqual(found.slots,expected.route.slots);
        assert.deepEqual(atlas.binding(data,expected.route).route,binder);
      }
      const producerCall=producers.get(addressKey(entry.producer.anchor));
      const origin=producerCall===undefined ? null : {callId:producerCall,anchor:entry.producer.anchor,hops:entry.definitionHops.length};
      if(origin)consumers.get(producerCall).push({callId,slot,hops:origin.hops});
      ports.push({slot,input,origin,formalName:entry.formal?.binderName,dependencies:dependencies(entries[0],entry),role:slot ? entry.producer.role : 'function',offset:String(before),
        count:String(hit.count),text:entry.producer.role==='proof' && slot ? entry.display.inputType : entry.display.inputTerm});
      before+=hit.count;
    }
    assert.equal(String(before),table.total);
    const binderNode=atlas.walk(data,binder);
    examples.push({source,nativeOwner,call,callId,table,ports,consumers:consumers.get(callId),
      binder:{route:binder,node:binderNode},variable:data.payloads[binderNode].binderName,
      resultDependencies:conclusion(entries),rule:entries[0].display.inputTerm,conclusion:entries[0].display.consumerType});
  }
}
const local=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
process.stdout.write(local('inference-template.html.in')
  .replace('/* SELECTOR */',()=>local('select-branch.js'))
  .replace('/* EXAMPLES */',()=>JSON.stringify(examples).replaceAll('<','\\u003c')));
