// Independent finite control: enumerate original child occurrences and resolve each variable.
'use strict';
const fs = require('node:fs'), z = require('node:zlib'), assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const html = fs.readFileSync(__dirname+'/riccati.html','utf8');
const packet = JSON.parse(html.match(/^const packet=(.*);$/m)[1]);
const {record} = inventory().find(r=>r.edition===packet.edition && r.record.name===packet.name);
const bytes = z.gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(createHash('sha256').update(bytes).digest('hex'),packet.hash);
const data = atlas.validateIndex(JSON.parse(bytes),record);
function external(field,firstUses) {
  const counts = new Map(), pending = [field];
  while (pending.length) {
    const {node,route} = pending.pop();
    if (data.kind[node]===0) {
      const binder = atlas.binding(data,route);
      if (binder.route.slots.length < field.route.slots.length) {
        const key = binder.route.slots.join('.');
        if(firstUses){
          const prior=firstUses.get(key);
          if(!prior || route.slots.join('.') < prior.route.slots.join('.'))firstUses.set(key,{node,route});
        }
        counts.set(key,1+(counts.get(key)||0));
      }
    }
    data.children[node].forEach((child,i)=>pending.push({node:child,route:{root:1,slots:route.slots.concat(i)}}));
  }
  return counts;
}
const owners = [];
function checkEdges(step) {
  const first=new Map(),counts=external(step.value,first);
  const expected=owners.flatMap((key,producer)=>counts.has(key)?[{producer,count:String(counts.get(key)),use:first.get(key)}]:[]);
  assert.deepEqual([...step.uses].sort((a,b)=>a.producer-b.producer),expected);
}
let node = data.roots[1], slots = [], i = 0, additions = 0;
while ([6,8].includes(data.kind[node])) {
  const local = data.kind[node]===8;
  if (local) {
    const step = packet.localSteps[i++];
    assert.equal(step.name,data.payloads[node].declName);
    for (const [s,field] of [step.type,step.value].entries()) {
      assert.deepEqual(field,{node:data.children[node][s],route:{root:1,slots:slots.concat(s)}});
    }
    checkEdges(step);
    owners.push(slots.join('.'));
    const value = external(step.value);
    for (const k of external(step.type).keys()) value.delete(k);
    for (const r of step.extra) {
      const key = r.binder.route.slots.join('.');
      assert.equal(String(value.get(key)),r.count);
      assert.deepEqual(r.use.route.slots.slice(0,step.value.route.slots.length),step.value.route.slots);
      assert.equal(atlas.walk(data,r.use.route),r.use.node);
      assert.deepEqual(atlas.binding(data,r.use.route),{node:r.binder.node,route:r.binder.route});
      value.delete(key); additions++;
    }
    assert.equal(value.size,0);
  }
  const body = local ? 2 : 1; slots.push(body);node=data.children[node][body];
}
assert.equal(i,packet.localSteps.length);
assert.deepEqual(packet.finalBody.value,{node,route:{root:1,slots}});
checkEdges(packet.finalBody);
console.log(i+' local definitions, '+additions+' value-only input links verified');
