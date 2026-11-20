// Count an outer binder's direct uses inside each observed application input.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const z = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const ordinal = require('./model.cjs');
const multiplicity = require('../free-index-multiplicity/model.cjs');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'), {window});
function read(file, hash) {
  const bytes = z.gunzipSync(fs.readFileSync('.' + file));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  return JSON.parse(bytes);
}
const inside = (route, parent) => route.root === parent.root && parent.slots.every((slot,i) => route.slots[i] === slot);
const results = [];
for (const descriptor of window.PROOF_ATLAS_NETWORK_STREAMING.records) {
  const {source,owner,record,mode} = descriptor;
  if (mode !== 'native' || source.edition !== 'goedel-sample-4331') continue;
  const data = atlas.validateIndex(read(record.indexFile,source.indexSha256),record);
  const native = read(owner.file,owner.sha256);
  assert.equal(native.source.indexSha256,source.indexSha256);
  const calls = new Map();
  for (const {id,junction} of native.entries) {
    const [call,slot] = id.split(':').map(Number);
    if (!calls.has(call)) calls.set(call,[]);
    calls.get(call)[slot] = junction;
  }
  const summary = {source, nativeOwner:owner.sha256, calls:calls.size, binders:0, compared:0, outsideBody:0, positions:0, mixed:0, example:null};
  let body = data.roots[1], slots = [];
  while (data.kind[body] === 6) {
    const binder = {root:1,slots};
    const query = ordinal.open(data,binder);
    const bodyRoute = {root:1,slots:[...slots,1]};
    const counts = [];
    summary.binders++;
    for (const [call,ports] of calls) {
      const anchor = ports[0].consumer.anchor;
      if (!inside(anchor.route,bodyRoute)) {summary.outsideBody++;continue;}
      const whole = query.interval(anchor.route);
      assert.equal(whole.node,anchor.node);
      let sum = 0n;
      const positive = [];
      assert.equal(ports.length,ports[0].consumer.arguments+1);
      for (const [slot,j] of ports.entries()) {
        assert.deepEqual(j.consumer.anchor,anchor);
        const input = j.consumer.input;
        const route = input.route;
        assert(inside(route,anchor.route));
        const hit = query.interval(route);
        assert.equal(hit.node,input.node);
        let node = data.children[body][1], index = 0;
        for (const field of route.slots.slice(bodyRoute.slots.length)) {
          index += Number(atlas.fields[atlas.kinds[data.kind[node]]][field] === 'body');
          node = data.children[node][field];
        }
        counts.push({node,index,count:hit.count});
        if (hit.count) {
          assert.equal(hit.first,whole.first+sum);
          for (const rank of new Set([hit.first,hit.first+hit.count-1n])) {
            const use = query.select(rank);
            assert(inside(use.route,route));
            assert.deepEqual(atlas.binding(data,use.route).route,binder);
          }
          positive.push({slot,role:slot ? j.producer.role : 'function',first:String(hit.first),count:String(hit.count),input});
        }
        sum += hit.count;
        summary.positions++;
      }
      assert.equal(sum,whole.count);
      summary.compared++;
      if (['value','proof'].every(role=>positive.some(p=>p.role===role))) {
        summary.mixed++;
        if (!summary.example) summary.example = {binder,call,anchor,positive};
      }
    }
    if (counts.length) {
      const key = c => c.node+':'+c.index;
      const oracle = multiplicity.evaluate(data,[...new Map(counts.map(c=>[key(c),{node:c.node,index:c.index}])).values()]);
      assert.equal(oracle.status,'complete');
      const exact = new Map(oracle.rows.map(c=>[key(c),BigInt(c.count)]));
      for (const c of counts) assert.equal(c.count,exact.get(key(c)));
    }
    body = data.children[body][1];
    slots = bodyRoute.slots;
  }
  results.push(summary);
}
assert.equal(results.length,6);
console.log(JSON.stringify(results,null,2));
