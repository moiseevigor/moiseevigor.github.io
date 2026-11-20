'use strict';
const fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {validateSourcePort}=require('../../../public/js/proof-atlas-application-ports');
const definitionPath=require('./definition-path.cjs');

const window={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window});
const d=window.PROOF_ATLAS_NETWORK_STREAMING.records.find(x=>x.source.name==='AtlasComposeControls.aliases');
function packet(file,hash){
  const bytes=z.gunzipSync(fs.readFileSync('.'+file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  return JSON.parse(bytes);
}
const data=atlas.validateIndex(packet(d.record.indexFile,d.source.indexSha256),d.record);
const entry=packet(d.owner.file,d.owner.sha256).entries.find(e=>e.id==='1:4').junction;
validateSourcePort(entry,data,entry.consumer,4);
const path=definitionPath(data,entry),[first,second]=path.definitions;
assert.equal(path.definitions.length,2);
assert.deepEqual(path.definitions.map(h=>h.name),['copyOfQ','q']);
assert.deepEqual(first.use,entry.consumer.input);
assert.deepEqual(first.value,second.use);
assert.equal(first.use.node,second.use.node);
assert.notDeepEqual(first.use.route,second.use.route);
assert.notDeepEqual(first.binder.route,second.binder.route);
for(const hop of path.definitions){
  assert.deepEqual(atlas.binding(data,hop.use.route),{node:hop.binder.node,route:hop.binder.route});
  assert.deepEqual(hop.value.route.slots,[...hop.binder.route.slots,1]);
  assert.equal(atlas.walk(data,hop.value.route),hop.value.node);
}
assert.deepEqual(second.value,entry.producer.anchor);
const swapped=structuredClone(entry);
swapped.definitionHops[1].use.route=first.use.route;
assert.throws(()=>validateSourcePort(swapped,data,entry.consumer,4),/source-use/);
console.log(JSON.stringify({control:d.source.name,owner:d.owner.sha256,slot:4,path},null,2));
