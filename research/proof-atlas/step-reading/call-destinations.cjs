// Count destinations of maximal application spines in a compiled proof body.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');

function measure(term, root, recordedRows = new Set()) {
  const weights = Array(root + 1).fill(0n);
  const destinations = new Map();
  const kind = id => atlas.kinds[term.kind[id]];
  const counts = {};
  let expanded = 0n, apps = 0n, prefixes = 0n;
  function record(child, label, weight) {
    const row = destinations.get(child) || {ports: 0, uses: 0n};
    row.ports++;
    row.uses += weight;
    destinations.set(child, row);
    counts[label] = (counts[label] || 0n) + weight;
  }

  weights[root] = 1n;
  if (kind(root) === 'app') record(root, 'root', 1n);
  for (let id = root; id >= 0; id--) {
    const weight = weights[id];
    if (!weight) continue;
    expanded += weight;
    if (kind(id) === 'app') apps += weight;
    for (const [slot, child] of term.children[id].entries()) {
      assert(child < id);
      weights[child] += weight;
      if (kind(child) !== 'app') continue;
      const field = atlas.fields[kind(id)][slot];
      if (kind(id) === 'app' && field === 'fn') {
        prefixes += weight;
        continue;
      }
      if (kind(id) === 'app') {
        const {args} = spine(term, id);
        assert.equal(args.at(-1), child);
        record(child, 'argument', weight);
      } else {
        record(child, kind(id) + '.' + field, weight);
      }
    }
  }
  const maximal = Object.values(counts).reduce((a,b) => a+b, 0n);
  assert.equal(expanded, BigInt(term.expanded[root]));
  assert.equal(apps, maximal + prefixes);
  let ambiguousRows = 0, ambiguousOccurrences = 0n;
  for (const row of destinations.values()) {
    if (row.ports > 1) {
      ambiguousRows++;
      ambiguousOccurrences += row.uses;
    }
  }
  let copiesOfRecordedRows = 0n;
  for (const id of recordedRows) {
    assert(destinations.has(id), 'Recorded row has no maximal occurrence');
    copiesOfRecordedRows += destinations.get(id).uses;
  }
  return {expanded, maximal, ...(recordedRows.size ? {copiesOfRecordedRows} : {}), rows: destinations.size, ambiguousRows, ambiguousOccurrences, counts};
}

// (((f x) (f x)) (f x)): the same row serves as a prefix and as two separate inputs.
const fixture = {kind:[4,4,5,5,5],children:[[],[],[0,1],[2,2],[3,2]],expanded:[1,1,3,7,11]};
assert.deepEqual(measure(fixture,4), {expanded:11n,maximal:3n,rows:2,ambiguousRows:1,
  ambiguousOccurrences:2n,counts:{root:1n,argument:2n}});

assert.equal(measure(fixture,4,new Set([2])).copiesOfRecordedRows,2n);

// Independent expanded-tree oracle for a bounded subterm of each real packet.
function checkByEnumeration(term, root) {
  const rows = new Map(), counts = {};
  function walk(id, parent, slot) {
    const parentKind = parent === null ? null : atlas.kinds[term.kind[parent]];
    if (atlas.kinds[term.kind[id]] === 'app' && !(parentKind === 'app' && slot === 0)) {
      const label = parentKind === null ? 'root' : parentKind === 'app' ? 'argument' :
        parentKind + '.' + atlas.fields[parentKind][slot];
      counts[label] = (counts[label] || 0n) + 1n;
      const row = rows.get(id) || {ports:new Set(), uses:0n};
      row.ports.add(parent + '/' + slot);
      row.uses++;
      rows.set(id, row);
    }
    term.children[id].forEach((child, position) => walk(child, id, position));
  }
  walk(root, null, null);
  const measured = measure(term, root);
  const multiple = [...rows.values()].filter(r => r.ports.size > 1);
  assert.deepEqual(measured.counts, counts);
  assert.equal(measured.rows, rows.size);
  assert.equal(measured.ambiguousRows, multiple.length);
  assert.equal(measured.ambiguousOccurrences, multiple.reduce((n,r) => n + r.uses, 0n));
}

function main() {
  const window = {};
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'), {window});
  const edition = window.PROOF_ATLAS_AI_SAMPLE.edition;
  const proofs = [];
  for (const record of edition.declarations.filter(r => r.bodyAvailable && r.kind === 'theorem')) {
    const bytes = gunzipSync(fs.readFileSync('.' + record.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.indexSha256);
    const term = atlas.validateIndex(JSON.parse(bytes),record);
    let sample = term.roots[1];
    while (BigInt(term.expanded[sample]) > 2000n) {
      sample = term.children[sample].reduce((a,b) => BigInt(term.expanded[a]) >= BigInt(term.expanded[b]) ? a : b);
    }
    checkByEnumeration(term, sample);
    proofs.push({name:record.name, indexSha256:record.indexSha256, ...measure(term,term.roots[1])});
  }
  console.log(JSON.stringify({edition:edition.id,proofs}, (_,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}
if (require.main === module) main();
module.exports = {measure};
