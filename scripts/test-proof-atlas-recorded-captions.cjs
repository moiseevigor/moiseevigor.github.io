/* Read-only caption transport comparison with every existing construction record. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), assert = require('assert/strict');
const T = require('../public/js/proof-atlas-deep-context'), Q = require('../public/js/proof-atlas-construction-pages');
const C = require('../public/js/proof-atlas-recorded-captions');
const producer = require('../research/proof-atlas/construction-pages/captions.cjs'), h = {};
for (const name of ['library-manifest', 'occurrence-types-manifest', 'goedel-sample-manifest', 'let-result-pools-manifest', 'construction-pages-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), {window: h});
}
const {library, types} = require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY, h.PROOF_ATLAS_OCCURRENCE_TYPES, null, h.PROOF_ATLAS_AI_SAMPLE);
const raw = file => z.gunzipSync(fs.readFileSync('.' + file), {maxOutputLength: 67108864});
const fetcher = async file => { assert(file.startsWith('/public/data/proof-atlas/construction-pages/')); return new Response(fs.readFileSync('.' + file)); };
(async () => {
  const report = {status: 'RUNNING', profiles: 0, constructions: 0, inferredTypes: 0, sourceHeaders: 0, summaries: 0, truncated: 0,
    refusedAttachments: 0, refusedArchives: 0, refusedChangedCaptions: 0, refusedChangedOrigins: 0, refusedEqualTextOrigins: 0, unicodeControls: 0, maxEnvelopeBytes: 0,
    presentationInputArchives: 0, sourcePacketBytesUnchanged: true};
  for (const d of types.records) {
    const record = library.editions.find(e => e.id === d.edition).declarations.find(r => r.name === d.name), bytes = raw(record.indexFile);
    let pkg = await T.recorded(bytes, raw(d.file), d, record);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === record.name && x.edition === d.edition && x.indexSha256 === record.indexSha256);
    if (ld) pkg = T.mergeRecorded(pkg, await T.recordedLets(bytes, raw(ld.file), ld, record));
    const c = pkg.case(record.name), source = T.sourceIdentity(c.data, record), inputs = new Map(), captionsByText = new Map();
    const adapter = producer.open(c, owner => { if (!inputs.has(owner.evidenceSha256)) inputs.set(owner.evidenceSha256, raw(owner.evidenceFile)); return inputs.get(owner.evidenceSha256); });
    const descriptor = h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(x => x.name === record.name && x.edition === d.edition);
    const queries = await Q.open(descriptor, record, {fetcher, indexLimit: 1, recordLimit: 1});
    let controlled = false, headerControlled = false, crossControlled = false;
    try {
      for (const entry of c.entries) {
        const construction = T.construction(entry, c.data); if (!construction) continue;
        const emitted = await adapter.create(entry), row = await queries.lookup(entry.route);
        assert(row?.construction); report.constructions++;
        const pieces = Object.entries(emitted.inferredTypes).map(([field, caption]) => ({field, caption}));
        if (emitted.sourceHeader) pieces.push({field: construction.premises[0].field, caption: emitted.sourceHeader});
        for (const {field, caption} of pieces) {
          const expectedOrigin = C.origin(source, row.construction, field, caption.category);
          assert(await C.validate(JSON.parse(JSON.stringify(caption)), expectedOrigin));
          const size = Buffer.byteLength(JSON.stringify(caption)); report.maxEnvelopeBytes = Math.max(report.maxEnvelopeBytes, size);
          assert(size <= C.limits.envelopeBytes);
          if (caption.category === 'recorded-source-expression') report.sourceHeaders++; else report.inferredTypes++;
          if (caption.presentation === 'compiled-constructor-summary') report.summaries++;
          report.truncated += caption.truncatedByCaptionBudget;
          if (!controlled) {
            for (const change of [x => x.origin.contextLength++, x => x.origin.originKey = '0'.repeat(64), x => x.origin.namespace = 'unknown',
              x => x.category = 'unknown', x => x.text += 'changed', x => x.truncatedByCaptionBudget = !x.truncatedByCaptionBudget,
              x => x.extra = 'unreviewed']) {
              const bad = structuredClone(caption); change(bad); await assert.rejects(() => C.validate(bad, expectedOrigin)); report.refusedChangedCaptions++;
            }
            for (const change of [x => x.source.indexSha256 = '0'.repeat(64), x => x.source.sourceGraphSha256 = '0'.repeat(64),
              x => x.evidenceSha256 = '0'.repeat(64), x => x.typeTableSha256 = '0'.repeat(64), x => x.construction.route.root = 1 - x.construction.route.root,
              x => x.construction.node++, x => x.field = x.field === 'body' ? 'conclusion' : 'body', x => x.selected.route.root = 1 - x.selected.route.root,
              x => x.selected.node++, x => x.selected.contextLength++, x => x.selected.role = x.selected.role === 'proof' ? 'value' : 'proof', x => x.typeRoot++]) {
              const foreign = structuredClone(expectedOrigin); change(foreign); await assert.rejects(() => C.validate(caption, foreign)); report.refusedChangedOrigins++;
            }
            await assert.rejects(() => adapter.create({...entry})); report.refusedAttachments++; controlled = true;
          }
          const earlier = captionsByText.get(caption.text);
          if (!crossControlled && earlier && earlier.origin.originKey !== caption.origin.originKey) {
            await assert.rejects(() => C.validate(earlier, expectedOrigin)); report.refusedEqualTextOrigins++; crossControlled = true;
          } else if (!earlier) captionsByText.set(caption.text, caption);
        }
        if (emitted.sourceHeader && !headerControlled) {
          const field = construction.premises[0].field;
          assert.notEqual(emitted.sourceHeader.origin.originKey, emitted.inferredTypes[field].origin.originKey);
          const wrongArchive = producer.open(c, () => Buffer.from('{}'));
          await assert.rejects(() => wrongArchive.create(entry)); report.refusedArchives++; headerControlled = true;
        }
      }
      assert(raw(record.indexFile).equals(bytes)); report.profiles++; report.presentationInputArchives += inputs.size;
      assert(queries.state().recordPages <= 1 && queries.state().indexPages <= 1 && queries.state().activeTypeTables === 0);
    } finally { queries.dispose(); }
  }
  for (const text of ['😀'.repeat(300), 'αβγ'.repeat(200), 'a'.repeat(1000)]) {
    const short = C.excerpt(text); assert(short.truncated); assert(Array.from(short.text).length <= C.limits.codePoints);
    assert(Buffer.byteLength(short.text) <= C.limits.textBytes); assert(!short.text.includes('\ufffd')); report.unicodeControls++;
  }
  assert.throws(() => C.excerpt('\ud800')); assert.throws(() => C.excerpt('\udc00')); report.unicodeControls += 2;
  assert.equal(report.profiles, 26); assert.equal(report.constructions, 1084); assert.equal(report.inferredTypes, 3312); assert.equal(report.sourceHeaders, 269);
  assert.equal(report.summaries, 60); assert.equal(report.refusedAttachments, 26); assert.equal(report.refusedArchives, 26);
  assert.equal(report.refusedChangedCaptions, 182); assert.equal(report.refusedChangedOrigins, 312); assert.equal(report.refusedEqualTextOrigins, 26);
  report.status = 'PASS';
  report.scope = 'Finite producer/consumer origin comparison against all existing immutable construction records. Source headers are independently matched to original expression roots. Existing native text remains presentation. Source and native archives are separately resident in this offline audit; no new judgments, renderer integration, independent native archive membership or comprehension claim.';
  fs.writeFileSync(process.env.ATLAS_CAPTION_REPORT || '/tmp/atlas-recorded-captions.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
})().catch(error => {console.error(error.stack); process.exit(1);});
