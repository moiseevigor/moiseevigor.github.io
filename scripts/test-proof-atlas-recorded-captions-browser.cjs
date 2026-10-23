/* Browser-engine parity only; these captions are not yet attached to the reader. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), path = require('path'), assert = require('assert/strict');
const {chromium} = require('playwright');
const T = require('../public/js/proof-atlas-deep-context'), C = require('../public/js/proof-atlas-recorded-captions');
const producer = require('../research/proof-atlas/construction-pages/captions.cjs'), F = require('../public/js/proof-atlas-occurrence-context-frame'), h = {};
for (const name of ['library-manifest', 'occurrence-types-manifest', 'let-result-pools-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), {window: h});
const raw = file => z.gunzipSync(fs.readFileSync('.' + file), {maxOutputLength: 67108864});
(async () => {
  const examples = [];
  for (const edition of ['published-15', 'working-26']) {
    const record = h.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === edition).declarations.find(r => r.name === 'JacobiData.slope_bound_abs');
    const d = h.PROOF_ATLAS_OCCURRENCE_TYPES.records.find(x => x.name === record.name && x.edition === edition);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === record.name && x.edition === edition);
    const pkg = T.mergeRecorded(await T.recorded(raw(record.indexFile), raw(d.file), d, record), await T.recordedLets(raw(record.indexFile), raw(ld.file), ld, record));
    const c = pkg.case(record.name), source = T.sourceIdentity(c.data, record), adapter = producer.open(c, owner => raw(owner.evidenceFile));
    const frameModel = F.open(c), frame = frameModel.create({format: 'ProofAtlasPackedRoute/1', root: 1, depth: 0, slots: ''}, {maxMembers: 64});
    assert.equal(frame.members.length, 12);
    for (let member = 0; member < frame.members.length; member++) {
      const entry = c.get(frameModel.resolve(frame, {member})), native = T.construction(entry, c.data);
      const construction = {...native, entry: {...native.entry, root: native.entry.typeData.roots[0]}}, captions = await adapter.create(entry);
      for (const [field, caption] of Object.entries(captions.inferredTypes)) {
        const part = await T.constructionType(entry, c.data, field);
        examples.push({caption, attachment: C.origin(source, construction, field), text: part.typeText});
      }
      if (captions.sourceHeader) examples.push({caption: captions.sourceHeader,
        attachment: C.origin(source, construction, construction.premises[0].field, 'recorded-source-expression')});
    }
  }
  assert.equal(examples.length, 108); // 84 typed rule components and 24 source headers.
  const browser = await chromium.launch({headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH});
  const page = await browser.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto((process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8833') + '/projects/proof-atlas/program/');
    for (const name of ['proof-atlas-library-data', 'proof-atlas-packed-routes', 'proof-atlas-recorded-captions']) await page.addScriptTag({path: path.resolve('public/js/' + name + '.js')});
    const results = await page.evaluate(async examples => {
      const C = ProofAtlasRecordedCaptions, results = [];
      for (const example of examples) {
        await C.validate(example.caption, example.attachment);
        const foreign = structuredClone(example.attachment); foreign.selected.node++;
        let refused = false; try { await C.validate(example.caption, foreign); } catch { refused = true; }
        if (!refused) throw Error('Foreign original occurrence accepted');
        if (example.text !== undefined) results.push(await C.create(example.text, example.attachment, example.caption.presentation));
        else results.push(example.caption);
      }
      return results;
    }, examples);
    assert.deepEqual(results, examples.map(x => x.caption));
    for (const text of ['😀'.repeat(300), 'αβγ'.repeat(200), 'a'.repeat(1000)]) assert.deepEqual(await page.evaluate(text => ProofAtlasRecordedCaptions.excerpt(text), text), C.excerpt(text));
    assert.deepEqual(errors, []);
    const report = {status: 'PASS', captionComparisons: examples.length, foreignOccurrenceRefusals: examples.length, unicodeControls: 3,
      readerIntegration: false, scope: 'Node/WebCrypto parity for finite genuine caption envelopes and separate Unicode controls. No renderer, accessibility, native recheck or comprehension claim.'};
    fs.writeFileSync(process.env.ATLAS_CAPTION_BROWSER_REPORT || '/tmp/atlas-recorded-captions-browser.json', JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(report));
  } finally { await browser.close(); }
})().catch(error => { console.error(error.stack); process.exit(1); });
