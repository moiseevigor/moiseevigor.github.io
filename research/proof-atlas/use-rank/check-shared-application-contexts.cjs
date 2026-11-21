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
  const all = allOccurrenceTargets(data,masks);
  assert.equal(all.size,counts.repeated);
  const changedRows = [...all.values()].filter(Boolean).length;
  assert(changedRows >= counts.differentTargets);
  return {counts,witness,all,changedRows};
}

// Every occurrence of a parent contributes once to each child slot. Keep a
// unique binder row only when its occurrence is unique in the proof body.
function allOccurrenceTargets(data,masks) {
  const multiple = -1;
  const root = data.roots[1];
  const visits = new Uint8Array(root+1);
  const scopes = new Array(root+1);
  const classifications = new Map();
  visits[root] = 1;
  scopes[root] = [];
  for (let row=root; row>=0; row--) {
    if (!visits[row]) continue;
    const scope = scopes[row];
    if (visits[row]===2 && data.kind[row]===5)
      classifications.set(row,scope.includes(multiple));
    data.children[row].forEach((child,slot)=>{
      const target = scopes[child] ??= [];
      const body = binds(data.kind[row],slot);
      for (let mask=masks[child], index=0; mask; mask >>= 1n, index++) {
        if (!(mask & 1n)) continue;
        const binder = body && index===0
          ? (visits[row]===1 ? row : multiple)
          : scope[index-Number(body)];
        assert(Number.isInteger(binder));
        if (target[index]===undefined) target[index]=binder;
        else if (target[index]!==binder) target[index]=multiple;
      }
      visits[child]=Math.min(2,visits[child]+visits[row]);
    });
    scopes[row]=undefined;
  }
  return classifications;
}

// Independent small-proof control. Expand every occurrence and resolve every
// variable under endpoint applications by walking from the proof root.
function checkExpanded(data, expected, all) {
  const variableTargets = new Map(), different = new Set(), applications = [];
  let middleWitness;
  const endpointChanges=new Set();
  const rows = new Map();
  function visit(row, slots) {
    if (data.kind[row] === 5) {
      if (!rows.has(row)) rows.set(row, []);
      rows.get(row).push(slots);
      applications.push([row,slots.length]);
    }
    if (data.kind[row]===0) {
      const binder = atlas.binding(data,{root:1,slots}).route.slots;
      for (const [application,depth] of applications) {
        if (binder.length>=depth || different.has(application)) continue;
        const key = application+':'+slots.slice(depth).join('.');
        const address = binder.join('.');
        if (!variableTargets.has(key)) variableTargets.set(key,address);
        else if (variableTargets.get(key)!==address) different.add(application);
      }
    }
    data.children[row].forEach((child, slot) => visit(child, slots.concat(slot)));
    if (data.kind[row]===5) applications.pop();
  }
  visit(data.roots[1], []);
  const counts = {repeated:0, sameContext:0, differentContextSameTargets:0, differentTargets:0};
  const {context} = require('../../../public/js/proof-atlas-occurrence-types');
  for (const [row, routes] of rows) {
    if (routes.length < 2) continue;
    counts.repeated++;
    assert.equal(all.get(row),different.has(row));
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
    if (changes(row,[])) { counts.differentTargets++; endpointChanges.add(row); }
    else counts.differentContextSameTargets++;
  }
  assert.deepEqual(counts,expected);
  for (const row of different) {
    const routes=rows.get(row), first=routes[0], last=routes.at(-1);
    function find(node,relative) {
      if (data.kind[node]===0) {
        const target=prefix=>atlas.binding(data,{root:1,slots:prefix.concat(relative)}).route.slots;
        const a=target(first);
        if (a.length>=first.length || String(a)!==String(target(last))) return;
        const middle=routes.find(route=>String(target(route))!==String(a));
        if (middle) return {row,first,middle,last,relative,endpointBinder:a,middleBinder:target(middle)};
      }
      for (const [slot,child] of data.children[node].entries()) {
        const hit=find(child,relative.concat(slot));
        if (hit) return hit;
      }
    }
    // Require agreement at both endpoints for every outer input of the row.
    if (endpointChanges.has(row)) continue;
    middleWitness=find(row,[]);
    if (middleWitness) break;
  }
  assert.equal(Boolean(middleWitness),different.size>endpointChanges.size);
  return middleWitness;
}

const records = inventory();
for (const {source} of require('./port-results.json')) {
  const {record} = records.find(i=>i.record.indexSha256===source.indexSha256);
  const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const {all,...result} = measure(data);
  const expandedControl = BigInt(data.expanded[data.roots[1]]) <= 500000n;
  if (expandedControl) result.middleWitness=checkExpanded(data,result.counts,all);
  console.log(JSON.stringify({source,expandedControl,...result}));
}
