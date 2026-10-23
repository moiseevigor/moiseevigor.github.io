/* Exact Riccati context continuation through normal public page providers. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), assert = require('assert/strict');
const T = require('../public/js/proof-atlas-deep-context');
const F = require('../public/js/proof-atlas-occurrence-context-frame');
const M = require('../public/js/proof-atlas-cursor-context-frame');
const SP = require('../public/js/proof-atlas-source-pages');
const Q = require('../public/js/proof-atlas-construction-pages');
const h = {};
for (const name of ['library-manifest', 'occurrence-types-manifest', 'let-result-pools-manifest', 'source-pages-manifest', 'construction-pages-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), {window: h});
}
const raw = file => z.gunzipSync(fs.readFileSync('.' + file), {maxOutputLength: 67108864});
function walk(data, route) {
  const bytes = Buffer.from(route.slots, 'base64url');
  let node = data.roots[route.root], depth = 0;
  for (let i = 0; i < route.depth; i++) {
    const slot = (bytes[i >> 2] >> ((i % 4) * 2)) & 3;
    if (([6, 7].includes(data.kind[node]) && slot === 1) || (data.kind[node] === 8 && slot === 2)) depth++;
    node = data.children[node][slot];
    assert.notEqual(node, undefined);
  }
  return {node, depth};
}
(async () => {
  const report = {status: 'RUNNING', profiles: 0, typeViews: 0, refusals: 0, completeArchiveRequests: 0, rows: []};
  for (const edition of ['published-15', 'working-26']) {
    const record = h.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === edition).declarations.find(r => r.name === 'JacobiData.slope_bound_abs');
    const same = d => d.edition === edition && d.name === record.name && d.indexSha256 === record.indexSha256;
    const td = h.PROOF_ATLAS_OCCURRENCE_TYPES.records.find(same), ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(same);
    const bytes = raw(record.indexFile), base = await T.recorded(bytes, raw(td.file), td, record);
    const pkg = T.mergeRecorded(base, await T.recordedLets(bytes, raw(ld.file), ld, record));
    const c = pkg.case(record.name), complete = F.open(c);
    const sd = h.PROOF_ATLAS_SOURCE_PAGES.records.find(same), qd = h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(same);
    const fetcher = async file => {
      if (!['source-pages', 'type-pages', 'construction-pages'].some(dir => file.startsWith('/public/data/proof-atlas/' + dir + '/'))) {
        report.completeArchiveRequests++;
        throw Error('Complete archive requested: ' + file);
      }
      return new Response(fs.readFileSync('.' + file));
    };
    const source = await SP.open(sd, record, {fetcher, pageLimit: 1});
    const queries = await Q.open(qd, record, {fetcher, indexLimit: 1, recordLimit: 1});
    const model = M.open(source, queries), root = {format: 'ProofAtlasPackedRoute/1', root: 1, depth: 0, slots: ''};
    try {
      const frame = await model.create(root, {maxMembers: 64}), reference = complete.create(root, {maxMembers: 64});
      assert.deepEqual(frame, reference);
      assert.deepEqual(frame.context, {initialLength: 0, finalLength: 12, extensionCount: 12});
      assert.equal(frame.members.length, 12);
      assert.deepEqual(frame.members.slice(0, 6).map(m => m.rule), Array(6).fill('Pi-introduction'));
      assert.deepEqual(frame.members.slice(6).map(m => m.binder.name), ['hz', 'hD', 'hds', 'hprod', 'amgm', 'hsum']);
      assert.deepEqual(frame.stats, {retained: '12', hidden: '165582', represented: '165594'});
      for (const [i, member] of frame.members.entries()) {
        const selected = walk(c.data, model.resolve(frame, {member: i}));
        assert.equal(selected.node, member.node);
        assert.equal(selected.depth, i);
        assert.equal(c.data.kind[selected.node], i < 6 ? 6 : 8);
        const body = walk(c.data, model.resolve(frame, {member: i, field: 'body'}));
        assert.equal(body.depth, i + 1);
        for (const field of i < 6 ? ['binderType'] : ['type', 'value']) {
          assert.equal(walk(c.data, model.resolve(frame, {member: i, field})).depth, i);
        }
      }
      const addresses = [...frame.members.map((_, i) => ({member: i})), ...frame.headers.map(p => p.address), frame.continuation.address];
      assert.equal(addresses.length, 31);
      for (const address of addresses) {
        const expected = await complete.typeFor(reference, address), actual = await model.typeFor(frame, address, 'kernel', {pageLimit: 1});
        assert.deepEqual(await actual.cursor.scene(actual.observation, source), T.typeScene(expected, c.data));
        report.typeViews++;
      }
      const amgm = {member: 10, field: 'value'}, route = model.resolve(frame, amgm);
      assert.deepEqual(walk(c.data, route), {node: 1227, depth: 10});
      assert.equal(c.get(route).role, 'proof');
      assert.equal(frame.continuation.contextLength, 12);
      if (edition === 'published-15') {
        assert.equal(frame.stop, 'non-context-construction');
        assert.equal(frame.continuation.availableRule, 'Pi-application');
      } else {
        assert.equal(frame.stop, 'no-construction-record');
        assert.equal(frame.continuation.availableRule, null);
        assert(c.get(model.resolve(frame, frame.continuation.address)), 'Typed body remains available without inventing its construction');
      }
      const foreign = {...record, indexSha256: '0'.repeat(64)};
      await assert.rejects(() => SP.open(sd, foreign, {fetcher})); report.refusals++;
      await assert.rejects(() => Q.open(qd, foreign, {fetcher})); report.refusals++;
      report.profiles++;
      report.rows.push({edition, frameMembers: 12, typedPoints: addresses.length, amgmNode: 1227, amgmContext: 10, stop: frame.stop});
    } finally {
      source.dispose(); queries.dispose();
    }
  }
  assert.equal(report.profiles, 2); assert.equal(report.typeViews, 62); assert.equal(report.completeArchiveRequests, 0);
  report.status = 'PASS';
  report.scope = 'Selected recorded contexts in two immutable packets, using normal public page providers. No historical-environment reconstruction, complete proof-step coverage or comprehension claim.';
  fs.writeFileSync('/tmp/atlas-riccati-context-continuation.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
})().catch(error => {console.error(error.stack); process.exit(1);});
