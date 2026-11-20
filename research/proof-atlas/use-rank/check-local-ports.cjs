// Start with an input occurrence and binder. No ordinal offset or whole-binder
// count is supplied to the paged reader.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const z = require('node:zlib');
const {createHash} = require('node:crypto');
const pages = require('../../../public/js/proof-atlas-source-pages');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const whole = require('./model.cjs');
const paged = require('./paged.cjs');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
async function run() {
  const results = [];
  for (const item of require('./port-results.json').filter(x=>x.example)) {
    const {source,example} = item;
    const {record} = inventory().find(x=>x.record.indexSha256===source.indexSha256 && x.edition===source.edition);
    const bytes = z.gunzipSync(fs.readFileSync('.'+record.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.indexSha256);
    const data = atlas.validateIndex(JSON.parse(bytes),record);
    const reference = whole.open(data,example.binder);
    const descriptor = window.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===source.edition && d.name===source.name);
    const base = descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
    const native = z.gunzipSync(fs.readFileSync('public/data/proof-atlas/application-ports/'+item.nativeOwner+'.json.gz'));
    assert.equal(createHash('sha256').update(native).digest('hex'),item.nativeOwner);
    const entries = JSON.parse(native).entries.filter(e=>e.id.split(':')[0]===String(example.call));
    const openSource = () => pages.open(descriptor,record,{pageLimit:2,indexLimit:1,fetcher:async file=>{
        assert(file.startsWith(base));assert.notEqual(file,record.indexFile);
        return new Response(fs.readFileSync('.'+file));
      }});
    const baseline = await openSource();
    let wholeBuildPageLoads;
    try {
      const index = await paged.open(baseline,example.binder);
      assert.equal(index.total,reference.total);
      wholeBuildPageLoads = baseline.state().pageLoads;
    } finally {baseline.dispose();}
    for (const {junction:j} of entries) {
      const within = j.consumer.input.route;
      const oracle = reference.interval(within);
      const cursor = await openSource();
      try {
        const local = await paged.open(cursor,example.binder,{within});
        assert.equal(local.source.indexSha256,source.indexSha256);
        assert.equal(local.total,oracle.count);
        const build = cursor.state().pageLoads;
        await assert.rejects(local.select(0n),RangeError);
        await assert.rejects(local.select(local.total+1n),RangeError);
        await assert.rejects(local.rank(j.consumer.anchor.route),/Outside binder body/);
        let middlePageLoads = null;
        if (local.total) {
          const middle = (local.total+1n)/2n;
          assert.deepEqual(await local.select(middle),reference.select(oracle.first+middle-1n));
          middlePageLoads = cursor.state().pageLoads-build;
        }
        let checked = 0;
        for (let n=1n;n<=local.total;n++) {
          const use = await local.select(n);
          assert.deepEqual(use,reference.select(oracle.first+n-1n));
          assert.deepEqual(atlas.binding(data,use.route).route,example.binder);
          assert.equal(await local.rank(use.route),n);
          checked++;
        }
        if (j.consumer.slot===0) {
          await assert.rejects(paged.open(cursor,example.binder,{within:example.binder}),/Outside binder body/);
          await assert.rejects(paged.open(cursor,example.binder,{within:{root:within.root,slots:[...within.slots,-1]}}),/Invalid subtree field/);
        }
        const end = cursor.state();
        assert(end.peakCachedNodes<=512 && end.indexPages<=1);
        results.push({packet:source.indexSha256,name:source.name,call:example.call,slot:j.consumer.slot,
          binder:example.binder,input:j.consumer.input,checked,buildPageLoads:build,wholeBuildPageLoads,middlePageLoads,scheduled:local.scheduled,
          peakSourceRows:end.peakCachedNodes});
      } finally {cursor.dispose();}
    }
  }
  console.log(JSON.stringify(results,null,2));
}
run().catch(err=>{console.error(err);process.exitCode=1;});
