// Compare the first and last occurrence of each application row in the proof body.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const zlib = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {binds} = require('./model.cjs');

function endpoints(data, reverse) {
  const parent = new Int32Array(data.kind.length).fill(-1);
  const edge = new Uint8Array(data.kind.length);
  const root = data.roots[1];
  const stack = [[root, root, 0]];
  while (stack.length) {
    const [row, from, slot] = stack.pop();
    if (parent[row] !== -1) continue;
    parent[row] = from;
    edge[row] = slot;
    const children = data.children[row];
    for (let i = 0; i < children.length; i++) {
      const j = reverse ? i : children.length - 1 - i;
      stack.push([children[j], row, j]);
    }
  }
  return function path(row) {
    if (parent[row] < 0) return null;
    const slots = [];
    while (row !== root) {
      slots.push(edge[row]);
      row = parent[row];
    }
    return slots.reverse();
  };
}

function binderPaths(data, slots) {
  let row = data.roots[1], path = '1';
  const binders = [];
  for (const slot of slots) {
    if (binds(data.kind[row], slot)) binders.push(path);
    row = data.children[row][slot];
    path += '.' + slot;
  }
  return binders.reverse();
}

function measure(data) {
  const first = endpoints(data, false), last = endpoints(data, true);
  const masks = [];
  const counts = {repeated:0, sameContext:0, differentContextSameTargets:0, differentTargets:0};
  let witness;
  for (let row = 0; row < data.kind.length; row++) {
    const kind = data.kind[row];
    let mask = kind === 0 ? 1n << BigInt(data.payloads[row].index) : 0n;
    data.children[row].forEach((child, slot) => {
      mask |= masks[child] >> BigInt(binds(kind, slot));
    });
    masks.push(mask);
    if (kind !== 5) continue;
    const left = first(row), right = last(row);
    if (!left || String(left) === String(right)) continue;
    counts.repeated++;
    const a = binderPaths(data,left), b = binderPaths(data,right);
    if (JSON.stringify(a) === JSON.stringify(b)) { counts.sameContext++; continue; }
    let changed = false;
    for (let index = 0; mask; index++, mask >>= 1n) {
      if (!(mask & 1n)) continue;
      assert(a[index] && b[index]);
      if (a[index] === b[index]) continue;
      changed = true;
      if (!witness || left.length + right.length < witness.left.length + witness.right.length)
        witness = {row, left, right, index, leftBinder:a[index], rightBinder:b[index]};
      break;
    }
    if (changed) counts.differentTargets++;
    else counts.differentContextSameTargets++;
  }
  if (witness) {
    const relative = [];
    let node = witness.row, index = witness.index;
    while (data.kind[node] !== 0) {
      const slot = data.children[node].findIndex((child, j) =>
        Boolean(masks[child] & (1n << BigInt(index + Number(binds(data.kind[node], j))))));
      assert(slot >= 0);
      index += Number(binds(data.kind[node], slot));
      relative.push(slot);
      node = data.children[node][slot];
    }
    assert.equal(data.payloads[node].index,index);
    for (const side of ['left','right']) {
      const slots = witness[side].concat(relative);
      assert.equal(atlas.walk(data,{root:1,slots}),node);
      const binding = atlas.binding(data,{root:1,slots});
      assert.equal(['1',...binding.route.slots].join('.'),witness[side+'Binder']);
    }
    witness.relativeReference = relative;
  }
  return {counts,witness};
}

// Independent small-proof control. Expand every occurrence and resolve every
// variable under endpoint applications by walking from the proof root.
function checkExpanded(data, expected) {
  const rows = new Map();
  function visit(row, slots) {
    if (data.kind[row] === 5) {
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row).push(slots);
    }
    data.children[row].forEach((child, slot) => visit(child, slots.concat(slot)));
  }
  visit(data.roots[1], []);
  const counts = {repeated:0, sameContext:0, differentContextSameTargets:0, differentTargets:0};
  const {context} = require('../../../public/js/proof-atlas-occurrence-types');
  for (const [row, routes] of rows) {
    if (routes.length < 2) continue;
    counts.repeated++;
    const left = routes[0], right = routes.at(-1);
    const scope = slots => context(data,{root:1,slots}).binders.map(b=>b.route.slots);
    if (JSON.stringify(scope(left)) === JSON.stringify(scope(right))) { counts.sameContext++; continue; }
    function changes(node, relative) {
      if (data.kind[node] === 0) {
        const target = prefix => atlas.binding(data,{root:1,slots:prefix.concat(relative)}).route.slots;
        const a = target(left), b = target(right);
        return a.length < left.length && String(a) !== String(b);
      }
      return data.children[node].some((child,slot)=>changes(child,relative.concat(slot)));
    }
    if (changes(row,[])) counts.differentTargets++;
    else counts.differentContextSameTargets++;
  }
  assert.deepEqual(counts,expected);
}

const records = inventory();
for (const {source} of require('./port-results.json')) {
  const {record} = records.find(i=>i.record.indexSha256===source.indexSha256);
  const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const result = measure(data);
  const expandedControl = BigInt(data.expanded[data.roots[1]]) <= 100000n;
  if (expandedControl) checkExpanded(data,result.counts);
  console.log(JSON.stringify({source,expandedControl,...result}));
}
