// Count direct uses of paired binders across complete theorem inventories.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {firstUse} = require('./first-use.cjs');
const rawFixtures = process.argv[2];
const controls = rawFixtures ? JSON.parse(fs.readFileSync(rawFixtures, 'utf8')) : [];
const window = {};
for (const file of ['library-manifest','goedel-sample-manifest','recursion-examples-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file+'.js','utf8'), {window});
}

// Bit k records a use of the kth variable outside this stored row. Crossing a
// binder body consumes bit zero and shifts outer references down one place.
function support(data, skipTypeFields) {
  const rows = [];
  for (let i = 0; i < data.kind.length; i++) {
    const kind = atlas.kinds[data.kind[i]];
    let bits = kind === 'bvar' ? 1n << BigInt(data.payloads[i].index) : 0n;
    data.children[i].forEach((child,j) => {
      const field = atlas.fields[kind][j];
      if (skipTypeFields && (field === 'domain' || field === 'type')) return;
      bits |= field === 'body' ? rows[child] >> 1n : rows[child];
    });
    rows.push(bits);
  }
  return rows;
}

let comparisons = 0;
const result = [];
const excludedControls = [];
for (const edition of [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition,
  window.PROOF_ATLAS_RECURSION_EXAMPLES.edition]) {
  const stats = {crossChecked:0,edition:edition.id,theorems:0,proofsWithAliasedWitness:0,bindersWithAliasedWitness:0,paired:0,outsideExplicitTypes:0,typeFieldsOnly:0,unused:0};
  for (const fixture of controls.filter(x => x.edition === edition.id)) {
    const record = edition.declarations.find(r => r.name === fixture.name);
    assert(record && record.indexSha256 === fixture.indexSha256);
    if (record.kind !== 'theorem') excludedControls.push({edition:edition.id,name:record.name,
      kind:record.kind,binders:fixture.binders.length});
  }
  for (const record of edition.declarations.filter(r => r.kind === 'theorem')) {
    const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
    const data = atlas.validateIndex(JSON.parse(bytes),record);
    const all = support(data,false), limited = support(data,true);
    const fixture = controls.find(x => x.edition === edition.id && x.name === record.name);
    let [type,proof] = data.roots;
    // Compare only the selected shortest witnesses within this one proof.
    // A group of size two certifies distinct binders with the same stored use row.
    const witnessGroups = new Map();
    let depth = 0;
    stats.theorems++;
    while (data.kind[type] === 7 && data.kind[proof] === 6 && data.children[type][0] === data.children[proof][0]) {
      const body = data.children[proof][1];
      const any = Boolean(all[body] & 1n), outside = Boolean(limited[body] & 1n);
      assert(!outside || any);
      const introduction = {root:1,slots:Array(depth).fill(1)};
      const witness = firstUse(data,introduction);
      assert.equal(any,Boolean(witness));
      if (witness) {
        const group = witnessGroups.get(witness.node) || [];
        group.push({name:data.payloads[proof].binderName,introduction,use:witness.route});
        witnessGroups.set(witness.node,group);
      }
      assert.equal(outside,Boolean(firstUse(data,introduction,true)));
      stats.crossChecked++;
      if (fixture) {
        assert.equal(fixture.indexSha256,record.indexSha256);
        const witness = fixture.binders[depth];
        assert.equal(any,Boolean(witness.firstUse));
        assert.equal(outside,Boolean(witness.useOutsideTypeFields));
        comparisons++;
      }
      stats.paired++;
      if (outside) stats.outsideExplicitTypes++;
      else if (!any) stats.unused++;
      else {
        stats.typeFieldsOnly++;
        stats.example ??= {name:record.name,indexSha256:record.indexSha256,binder:data.payloads[proof].binderName,
          introduction,node:proof,witness};
      }
      depth++;
      type = data.children[type][1];
      proof = body;
    }
    if (fixture) assert.equal(depth,fixture.binders.length);
    const aliases = [...witnessGroups.entries()].filter(([,uses]) => uses.length > 1);
    if (aliases.length) {
      stats.proofsWithAliasedWitness++;
      stats.bindersWithAliasedWitness += aliases.reduce((n,[,uses]) => n + uses.length, 0);
      const [node, uses] = aliases[0];
      stats.aliasExample ??= {name:record.name,indexSha256:record.indexSha256,node,uses:uses.slice(0,2)};
    }
  }
  assert.equal(stats.paired,stats.outsideExplicitTypes+stats.typeFieldsOnly+stats.unused);
  result.push(stats);
}
assert.equal(comparisons + excludedControls.reduce((sum,r) => sum+r.binders,0),controls.reduce((sum,r) => sum+r.binders.length,0));
console.log(JSON.stringify({witnessComparisons:comparisons,excludedControls,editions:result},null,2));
