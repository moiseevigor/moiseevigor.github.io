// Run from the repository root. Match complete call occurrences before reading their inputs.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
global.window = {};
require('../../../public/data/proof-atlas/article-proof-steps.js');
require('../../../public/data/proof-atlas/occurrence-types-manifest.js');
const article = window.PROOF_ATLAS_PROOF_STEPS;
const records = window.PROOF_ATLAS_OCCURRENCE_TYPES.records;
const results = [];
for (const anchor of article.anchors.filter(a => a.callee && a.kind === 'app')) {
  const {step, declaration, callee, node, path, arity} = anchor;
  const row = {step, declaration, callee, node, path, arity};
  results.push(row);
  const record = records.find(r => r.name === declaration && r.edition === article.edition);
  if (!record) {
    row.status = 'no native declaration record';
    continue;
  }
  const packet = article.packets.find(p => p.name === declaration);
  assert.equal(record.indexSha256, packet.indexSha256);
  assert.equal(record.sourceSha256, packet.sourceSha256);
  const bytes = fs.readFileSync('.' + record.file);
  assert.equal(crypto.createHash('sha256').update(zlib.gunzipSync(bytes)).digest('hex'), record.sha256);
  const data = JSON.parse(zlib.gunzipSync(bytes));
  const entry = data.entries.find(e => e.node === node && e.path === path);
  if (entry?.applicationJudgment?.status !== 'checked') {
    row.status = 'no checked trace at exact call';
    continue;
  }
  assert.equal(entry.kernelCheck, 'PASS');
  const stages = entry.applicationJudgment.stages;
  assert.equal(stages.length, arity);
  assert.equal(entry.arguments.length, arity);
  assert.equal(stages.at(-1).afterRoot, entry.typeRoot);
  row.status = 'checked trace';
  row.result = entry.typeText;
  row.inputs = entry.arguments.map((arg, i) => {
    const stage = stages[i];
    assert.equal(stage.slot, i + 1);
    assert.equal(arg.slot, stage.slot);
    assert.equal(stage.actualRoot, arg.typeRoot);
    assert.equal(stage.domainRoot, arg.expectedRoot);
    for (const field of ['kernelDomainConversion','kernelFunctionConversion','kernelResultConversion']) {
      assert.equal(stage[field], 'PASS');
    }
    const suffix = Array(arity - i - 1).fill(0).concat(1);
    assert.deepEqual(arg.route, {root: entry.route.root, slots: entry.route.slots.concat(suffix)});
    return {slot: arg.slot, role: arg.role, type: stage.argumentText, node: arg.node, route: arg.route};
  });
}
console.log(JSON.stringify({edition: article.edition, results}, null, 2));
