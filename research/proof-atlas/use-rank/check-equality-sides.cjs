// Count homogeneous equalities in proof bodies, retaining multiplicity of shared rows.
'use strict';
const fs = require('node:fs');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const window = {};
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
const {firstStructuralDifference} = require('../../../public/js/proof-atlas-omitted-references');
const differences = {constructor:0n,payload:0n,identical:0n,limit:0n};
let belowRoot = 0n, maxDepth = 0;
function reference(data,left,right) {
  if (left===right) return null;
  const k=data.kind[left];
  if (k!==data.kind[right]) return {left,right,status:'constructor',slots:[]};
  if (atlas.payloadKey(k,data.payloads[left])!==atlas.payloadKey(k,data.payloads[right]))
    return {left,right,status:'payload',slots:[]};
  for (const [slot,child] of data.children[left].entries()) {
    const hit=reference(data,child,data.children[right][slot]);
    if (hit) return {...hit,slots:[slot,...hit.slots]};
  }
  return null;
}
// Two unary chains postpone the only mismatch beyond the comparison budget.
const chains={kind:[0,0],children:[[],[]],payloads:[{index:0},{index:1}]};
for (let i=2;i<1028;i++) {
  chains.kind.push(10);
  chains.children.push([i-2]);
  chains.payloads.push({});
}
assert.deepEqual(firstStructuralDifference(chains,1026,1027),{status:'limit'});
assert.deepEqual(firstStructuralDifference(chains,1026,1026),{status:'identical'});
let equalities = 0n, shared = 0n, affected = 0;
for (const record of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations) {
  const bytes = gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const visits = Array(data.kind.length).fill(0n);
  visits[data.roots[1]] = 1n;
  let total = 0n, pairs = 0n, same = 0n;
  for (let row = visits.length-1; row >= 0; row--) {
    const count = visits[row];
    if (!count) continue;
    total += count;
    for (const child of data.children[row]) visits[child] += count;
    if (data.kind[row] !== 5) continue;
    const {head,args} = spine(data,row);
    if (args.length !== 3 || data.kind[head] !== 4 || data.payloads[head].name !== 'Eq') continue;
    pairs += count;
    if (args[1] === args[2]) same += count;
    else {
      const hit=firstStructuralDifference(data,args[1],args[2]);
      differences[hit.status]+=count;
      if (hit.status==='limit') continue;
      assert.deepEqual(hit,reference(data,args[1],args[2])??{status:'identical'});
      if (hit.slots?.length) {
        belowRoot+=count;
        maxDepth=Math.max(maxDepth,hit.slots.length);
      }
    }
  }
  assert.equal(total,BigInt(data.expanded[data.roots[1]]));
  equalities += pairs;
  shared += same;
  if (same) affected++;
  console.log(record.name,String(pairs),String(same));
}
console.log('Equality occurrences:',String(equalities),'with identical operand rows:',String(shared),'in proofs:',affected);
console.log('Different operand rows:',differences,'below root:',String(belowRoot),'maximum field depth:',maxDepth);
