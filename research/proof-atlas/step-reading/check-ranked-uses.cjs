'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const ranked = require('./ranked-binder-uses.cjs');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest');
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === 'published-15');
function load(name) {
  const owner = edition.declarations.find(d => d.name === name);
  const bytes = gunzipSync(fs.readFileSync(path.join(__dirname, '../../..', owner.indexFile)));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  return atlas.validateIndex(JSON.parse(bytes),owner);
}
const caller = load('JacobiData.slope_bound_abs');
const name = 'JacobiData.T1_T2_same_sign';
const term = load(name);
const call = {root:1,slots:'1.1.1.1.1.1.2.2.2.2.2.1.0.0.1'.split('.').map(Number)};
const {args,head} = spine(caller, atlas.walk(caller,call));
assert.equal(caller.payloads[head].name,name);
assert.equal(args.length,6);
const argument = {root:1,slots:call.slots.concat(0,0,0,1)};
assert.equal(atlas.walk(caller,argument),args[2]);
assert.deepEqual(atlas.binding(caller,argument),{node:3248,route:{root:1,slots:[1,1]}});
const binderRoute = {root:1,slots:[1,1]};
const binder = atlas.walk(term,binderRoute);
assert.equal(binder,3733);
const uses = ranked(term,binderRoute);
// Independent oracle walks expanded occurrences in field order, resolving each variable.
const expected = [];
const slots = [];
function visit(node) {
  const route = {root:1,slots};
  if (atlas.kinds[term.kind[node]] === 'bvar') {
    const origin = atlas.binding(term,route);
    if (origin?.node === binder && origin.route.slots.join('.') === '1.1') {
      expected.push({node,route:{root:1,slots:[...slots]}});
    }
  }
  for (const [slot,child] of term.children[node].entries()) {
    slots.push(slot);
    visit(child);
    slots.pop();
  }
}
visit(term.roots[1]);
assert.equal(uses.total,5n);
assert.equal(BigInt(expected.length),uses.total);
expected.forEach((entry,i) => assert.deepEqual(uses.select(BigInt(i)),entry));
assert.throws(()=>uses.select(-1n),RangeError);
assert.throws(()=>uses.select(uses.total),RangeError);
for (const [i,entry] of expected.entries()) {
  const query = new URLSearchParams({edition:edition.id,proof:name,route:'1:'+entry.route.slots.join('.')});
  console.log((i+1)+'. https://moiseevigor.github.io/projects/proof-atlas/library/?'+query+'#expr-'+entry.node);
}
const page = fs.readFileSync(path.join(__dirname,'riccati-common-sign.html'),'utf8');
const links = [...page.matchAll(/<li><a href="([^"]+)">([^<]+)<\/a>/g)];
assert.equal(links.length,expected.length);
for (const [i,entry] of expected.entries()) {
  const url = new URL(links[i][1].replaceAll('&amp;','&'));
  assert.equal(url.searchParams.get('proof'),name);
  assert.equal(url.searchParams.get('route'),'1:'+entry.route.slots.join('.'));
  assert.equal(url.hash,'#expr-'+entry.node);
  const parent = atlas.walk(term,{root:1,slots:entry.route.slots.slice(0,-1)});
  const slot = entry.route.slots.at(-1);
  const kind = atlas.kinds[term.kind[parent]];
  if(kind === 'letE') {
    assert.equal(atlas.fields[kind][slot],'value');
    assert.equal(links[i][2],'Local definition · value');
  } else {
    assert.equal(kind,'app');
    assert.equal(slot,1);
    const receiving = spine(term,parent);
    const label = term.payloads[receiving.head].name.replace('Mathlib.Tactic.Linarith.','');
    assert.equal(links[i][2],label+' · argument '+receiving.args.length);
  }
}
