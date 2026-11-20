// Compare occurrence-address lists. All layouts refer to the same compiled packet.
'use strict';
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
function delta(paths) {
  let previous = '';
  return paths.map(path => {
    let common = 0;
    while (common < previous.length && common < path.length && previous[common] === path[common]) common++;
    const item = [common,path.slice(common)];
    previous = path;
    return item;
  });
}
function expand(items) {
  let previous = '';
  return items.map(([common,end]) => (previous = previous.slice(0,common) + end));
}
module.exports = function measure(indexSha256, observed, grouped, binders) {
  const digits = slots => {
    assert(slots.every(slot => Number.isInteger(slot) && slot >= 0 && slot <= 2));
    return slots.join('');
  };
  const full = [...observed].map(path => digits(path.split('.').map(Number))).sort();
  const byBinder = new Map();
  for (const [key,paths] of grouped) {
    const binder = Number(key.split('/')[0]);
    if (!byBinder.has(binder)) byBinder.set(binder,[]);
    for (const template of paths.values()) byBinder.get(binder).push(digits(template.suffix));
  }
  const relative = [...byBinder].map(([row,suffixes]) => [
    [...binders.get(row).values()].map(hit => digits(hit.route.slots)).sort(),suffixes.sort()
  ]).sort(([a],[b]) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
  const output = {};
  const layouts = ['full','relative','fullDelta','relativeDelta'];
  for (const [id,layout] of layouts.entries()) {
    const factored = layout.startsWith('relative'), coded = layout.endsWith('Delta');
    const table = factored ? relative.map(([bases,ends]) => coded ? [delta(bases),delta(ends)] : [bases,ends])
      : coded ? delta(full) : full;
    const raw = Buffer.from(JSON.stringify({indexSha256,root:1,layout:id,table}));
    const zipped = zlib.gzipSync(raw,{level:9});
    const decoded = JSON.parse(zlib.gunzipSync(zipped));
    assert.equal(decoded.indexSha256,indexSha256);
    assert.equal(decoded.root,1);
    let restored;
    switch (layouts[decoded.layout]) {
      case 'full': restored = decoded.table; break;
      case 'fullDelta': restored = expand(decoded.table); break;
      case 'relative': restored = decoded.table.flatMap(([bases,ends]) => bases.flatMap(base => ends.map(end => base+end))); break;
      case 'relativeDelta': restored = decoded.table.flatMap(([a,b]) => {
        const bases = expand(a), ends = expand(b);
        return bases.flatMap(base => ends.map(end => base+end));
      }); break;
    }
    assert.deepEqual(restored.sort(),full);
    output[layout] = {json:raw.length,gzip:zipped.length};
  }
  return output;
};
