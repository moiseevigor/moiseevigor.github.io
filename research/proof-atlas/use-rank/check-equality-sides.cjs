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
  }
  assert.equal(total,BigInt(data.expanded[data.roots[1]]));
  equalities += pairs;
  shared += same;
  if (same) affected++;
  console.log(record.name,String(pairs),String(same));
}
console.log('Equality occurrences:',String(equalities),'with identical operand rows:',String(shared),'in proofs:',affected);
