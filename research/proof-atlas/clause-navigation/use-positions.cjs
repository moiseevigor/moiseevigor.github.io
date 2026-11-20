// Classify a checked witness by fields traversed after entering its binder body.
'use strict';
const fs = require('node:fs');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const reference = JSON.parse(fs.readFileSync(0, 'utf8'));
const totals = {crossesTypeField:0, noExplicitTypeField:0, noUse:0, alternativesOutsideTypeFields:0};
const riccati = [];
for (const {edition,record} of inventory()) {
  const item = reference.find(r => r.edition === edition && r.name === record.name);
  const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.indexSha256);
  assert.equal(item.indexSha256, record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes), record);
  for (const binder of item.binders) {
    const use = binder.firstUse;
    if (!use) { totals.noUse++; continue; }
    assert.deepEqual(atlas.binding(data,use.route).route,binder.introduction);
    const prefix = [...binder.introduction.slots,1];
    assert.deepEqual(use.route.slots.slice(0,prefix.length),prefix);
    let node = atlas.walk(data,{root:1,slots:prefix});
    const crossed = [];
    for (const slot of use.route.slots.slice(prefix.length)) {
      const kind = atlas.kinds[data.kind[node]];
      const field = atlas.fields[kind][slot];
      if (field === 'domain' || (kind === 'letE' && field === 'type')) crossed.push({kind,field,node});
      node = data.children[node][slot];
    }
    assert.equal(node,use.node);
    totals[crossed.length ? 'crossesTypeField' : 'noExplicitTypeField']++;
    const alternative = binder.useOutsideTypeFields;
    if (alternative) {
      assert.deepEqual(atlas.binding(data,alternative.route).route,binder.introduction);
      assert.equal(atlas.walk(data,alternative.route),alternative.node);
      const path = atlas.path(data, alternative.route).split('.').slice(2 + prefix.length);
      assert(!path.includes('domain') && !path.includes('type'));
      if (crossed.length) totals.alternativesOutsideTypeFields++;
      else assert.deepEqual(alternative,use);
    }
    if (edition === 'published-15' && record.name === 'JacobiData.slope_bound_abs') {
      riccati.push({binder:binder.name,use:use.route,crossed});
    }
  }
}
console.log(JSON.stringify({totals,riccati},null,2));
