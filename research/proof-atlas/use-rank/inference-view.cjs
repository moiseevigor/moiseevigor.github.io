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
const declaredDomain=require('./declared-domain.cjs');
const inputHead = require('../step-reading/input-head.cjs');
const lexicalInputs=require('./lexical-inputs.cjs');
const definitionPath=require('./definition-path.cjs');
const {validateSourcePort}=require('../../../public/js/proof-atlas-application-ports');
const {dependencies,conclusion} = require('./formal-edges.cjs');

function packet(file,hash) {
  const bytes=z.gunzipSync(fs.readFileSync(file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  return JSON.parse(bytes);
}
const examples=[],flows={},groupBindings={},typeContexts={},finalApplications={};
for(const item of require('./port-results.json')) {
  const {example,source,nativeOwner}=item;
  const {record,descriptors}=inventory().find(x=>x.record.indexSha256===source.indexSha256 && x.edition===source.edition);
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
      validateSourcePort(entry,data,{anchor:call,arguments:entries.length-1},slot);
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
      const binderAddress=entry.externalBinder;
      const binding=binderAddress ? {anchor:binderAddress,name:data.payloads[binderAddress.node].binderName,...declaredDomain(data,binderAddress)} : null;
      const resolution=definitionPath(data,entry);
      ports.push({slot,input,head:slot ? inputHead(data,input) : null,origin,binding,resolution,formalName:entry.formal?.binderName,dependencies:dependencies(entries[0],entry),role:slot ? entry.producer.role : 'function',offset:String(before),
        count:String(hit.count),text:entry.producer.role==='proof' && slot ? entry.display.inputType : entry.display.inputTerm});
      before+=hit.count;
    }
    assert.equal(String(before),table.total);
    const binderNode=atlas.walk(data,binder);
    examples.push({source,nativeOwner,call,callId,table,ports,consumers:consumers.get(callId),
      binder:{route:binder,node:binderNode},variable:data.payloads[binderNode].binderName,
      resultDependencies:conclusion(entries),rule:entries[0].display.inputTerm,conclusion:entries[0].display.consumerType});
  }
  const descriptor=descriptors.find(d=>d.kind==='primary').descriptor;
  assert.equal(descriptor.indexSha256,source.indexSha256);
  assert.equal(descriptor.sourceSha256,source.sourceSha256);
  const checked=packet('.'+descriptor.file,descriptor.sha256);
  finalApplications[source.indexSha256]={...require('./final-application.cjs')(data,checked,examples.filter(x=>x.source.indexSha256===source.indexSha256)),owner:descriptor.sha256};
  const caseDesc=descriptors.find(d=>d.kind==='case')?.descriptor;
  const final=finalApplications[source.indexSha256];
  if(caseDesc && final.checked){
    const elimination=require('../../../public/js/proof-atlas-elimination');
    const evidence=packet('.'+caseDesc.file,caseDesc.sha256);
    const provider=elimination.provider(evidence,data,record,caseDesc.sha256,caseDesc.file);
    final.cases=require('./final-cases.cjs')(data,record,provider,final);
    if(final.cases.checked)require('./case-use-judgments.cjs')(data,final.cases,examples.filter(x=>x.source.indexSha256===source.indexSha256));
  }
  flows[source.indexSha256]=require('./statement-flow.cjs')(data,examples.filter(x=>x.source.indexSha256===source.indexSha256));
  const bindings={};
  for(const clause of flows[source.indexSha256])for(const branch of clause.coverage.branches.largest){
    for(const part of branch.frontier){
      const key=part.anchor.route.slots.join('.');
      if(!Object.hasOwn(bindings,key))bindings[key]=lexicalInputs(data,part.anchor);
    }
  }
  groupBindings[source.indexSha256]=bindings;
  typeContexts[source.indexSha256]=require('./group-type-context.cjs')(data,bindings);
}
const local=file=>fs.readFileSync(path.join(__dirname,file),'utf8');
process.stdout.write(local('inference-template.html.in')
  .replace('/* SELECTOR */',()=>local('select-branch.js'))
  .replace('/* TYPE CONTEXTS */',()=>JSON.stringify(typeContexts).replaceAll('<','\\u003c'))
  .replace('/* GROUP BINDINGS */',()=>JSON.stringify(groupBindings).replaceAll('<','\\u003c'))
  .replace('/* FINALS */',()=>JSON.stringify(finalApplications).replaceAll('<','\\u003c'))
  .replace('/* FLOWS */',()=>JSON.stringify(flows).replaceAll('<','\\u003c'))
  .replace('/* EXAMPLES */',()=>JSON.stringify(examples).replaceAll('<','\\u003c')));
