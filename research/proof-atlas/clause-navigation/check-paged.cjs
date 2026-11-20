'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const {createHash} = require('node:crypto');
const fixtures = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const atlas = require('../../../public/js/proof-atlas-library-data');
const pages = require('../../../public/js/proof-atlas-source-pages');
const navigation = require('../../../public/js/proof-atlas-clause-navigation');

async function main() {
  const pageLimit = Number(process.argv[2] || 2);
  assert([1, 2].includes(pageLimit));
  const window = {};
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'), {window});
  const summaries = [];
  for (const {edition, record} of fixtures.inventory()) {
    const descriptor = window.PROOF_ATLAS_SOURCE_PAGES.records.find(d => d.edition === edition && d.name === record.name);
    const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), record.indexSha256);
    const data = atlas.validateIndex(JSON.parse(bytes), record);
    const cursor = await pages.open(descriptor, record, {pageLimit, indexLimit:1, fetcher:async file => {
      assert(file.startsWith(descriptor.file.slice(0, descriptor.file.lastIndexOf('/') + 1)));
      assert.notEqual(file, record.indexFile);
      return new Response(fs.readFileSync('.' + file));
    }});
    let type = data.roots[0], slots = [], comparisons = 0;
    try {
      while (true) {
        const routes = [{root:0, slots}];
        const target = navigation.destination(data, routes[0]);
        if (target) routes.push(target.route);
        if (data.kind[type] === 7) routes.push({root:0, slots:[...slots, 0]});
        for (const route of routes) {
          assert.deepEqual(await navigation.pagedDestination(cursor, route), navigation.destination(data, route));
          comparisons++;
        }
        if (data.kind[type] !== 7) break;
        type = data.children[type][1];
        slots = [...slots, 1];
      }
      const state = cursor.state();
      assert(state.peakCachedNodes <= 256 * pageLimit && state.indexPages <= 1);
      summaries.push({pageLimit, edition, name:record.name, comparisons, pageLoads:state.pageLoads,
        peakCachedNodes:state.peakCachedNodes, peakCachedDecodedBytes:state.peakCachedDecodedBytes});
    } finally {
      cursor.dispose();
    }
  }
  console.log(JSON.stringify(summaries,null,2));
}
main().catch(error => {console.error(error); process.exitCode = 1;});
