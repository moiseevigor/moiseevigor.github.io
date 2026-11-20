// Compare equal navigation tasks with fresh, identically bounded cursors.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const z = require('node:zlib');
const {createHash} = require('node:crypto');
const paged = require('./paged.cjs');
const pages = require('../../../public/js/proof-atlas-source-pages');
const window = {};
for (const name of ['source-pages','network-streaming']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'-manifest.js','utf8'),{window});
}
async function measure(descriptor, record, binder, entries, shared) {
  const base = descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
  let bytes = 0;
  const cursor = await pages.open(descriptor,record,{pageLimit:2,indexLimit:1,fetcher:async file=>{
    assert(file.startsWith(base));
    const buffer=fs.readFileSync('.'+file);
    bytes+=buffer.length;
    return new Response(buffer);
  }});
  try {
    const call = entries[0].consumer.anchor.route;
    const sharedIndex = shared && await paged.open(cursor,binder,{within:call});
    const visits = [], answers = [];
    for (const entry of entries) {
      const route = entry.consumer.input.route;
      const index = sharedIndex || await paged.open(cursor,binder,{within:route});
      const interval = shared ? await index.interval(route) : {count:index.total,first:1n};
      const n=(interval.count+1n)/2n;
      const use=n ? await index.select(interval.first+n-1n) : null;
      answers.push({count:String(interval.count),use});
      visits.push({slot:entry.consumer.slot,sourceLoads:cursor.state().pageLoads,bytes});
    }
    assert(cursor.state().peakCachedNodes<=512);
    return {answers,visits};
  } finally {cursor.dispose();}
}
async function run() {
  const report=[];
  for (const item of require('./port-results.json').filter(x=>x.example)) {
    const {source,example}=item;
    const descriptor=window.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===source.edition && d.name===source.name);
    const profile=window.PROOF_ATLAS_NETWORK_STREAMING.records.find(d=>d.owner?.sha256===item.nativeOwner);
    assert.equal(profile.record.indexSha256,source.indexSha256);
    const bytes=z.gunzipSync(fs.readFileSync('.'+profile.owner.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),item.nativeOwner);
    const entries=JSON.parse(bytes).entries.filter(e=>e.id.split(':')[0]===String(example.call)).map(e=>e.junction);
    entries.sort((a,b)=>a.consumer.slot-b.consumer.slot);
    for (const order of ['field','proof-first']) {
      const ordered=order==='field' ? entries : [...entries].sort((a,b)=>
        Number(b.consumer.slot!==0 && b.producer.role==='proof')-Number(a.consumer.slot!==0 && a.producer.role==='proof'));
      const local=await measure(descriptor,profile.record,example.binder,ordered,false);
      const shared=await measure(descriptor,profile.record,example.binder,ordered,true);
      assert.deepEqual(shared.answers,local.answers);
      for (const [i,j] of ordered.entries()) {
        const pos=example.positive.find(p=>p.slot===j.consumer.slot);
        assert.equal(shared.answers[i].count,pos?.count||'0');
        const use=shared.answers[i].use,route=j.consumer.input.route;
        if(use) assert(use.route.root===route.root && route.slots.every((s,k)=>s===use.route.slots[k]));
      }
      report.push({name:source.name,packet:source.indexSha256,binder:example.binder,call:example.call,order,
        totalUses:shared.answers.reduce((n,a)=>n+Number(a.count),0),local:local.visits,shared:shared.visits});
    }
  }
  console.log(JSON.stringify(report,null,2));
}
run().catch(e=>{console.error(e);process.exitCode=1;});
