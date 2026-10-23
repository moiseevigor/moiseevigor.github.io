/* Producer adapter. Original native archives are explicit inputs, never source scripts. */
'use strict';
const assert = require('assert/strict'), crypto = require('crypto');
const T = require('../../../public/js/proof-atlas-deep-context');
const P = require('../../../public/js/proof-atlas-packed-routes');
const C = require('../../../public/js/proof-atlas-recorded-captions');
const key = route => route.root + ':' + route.depth + ':' + route.slots;
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function open(nativeCase, loadEvidence) {
  assert.equal(typeof loadEvidence, 'function');
  const source = T.sourceIdentity(nativeCase.data, nativeCase.record);
  let archiveHash = null, archive = null;
  function record(entry) {
    const owner = T.construction(entry, nativeCase.data)?.entry;
    assert(owner, 'Accepted native construction');
    return owner;
  }
  function nativeHeader(entry, construction) {
    const owner = record(entry);
    if (archiveHash !== owner.evidenceSha256) {
      const bytes = loadEvidence(owner);
      assert(Buffer.isBuffer(bytes) && bytes.length <= 67108864, 'Bounded explicit evidence bytes');
      assert.equal(sha(bytes), owner.evidenceSha256, 'Exact native evidence archive');
      archive = JSON.parse(bytes); archiveHash = owner.evidenceSha256;
    }
    const query = archive.entries.find(q => q.route && key(P.encode(q.route.root, q.route.slots)) === key(owner.route));
    assert(query?.status === 'checked' && query.node === owner.node);
    const introduction = construction.rule === 'Pi-introduction';
    const judgment = introduction ? query.lambdaJudgment : query.letJudgment;
    assert.equal(judgment?.status, 'checked');
    const original = introduction ? judgment.domain : judgment.type, part = construction.premises[0];
    assert.equal(part.field, introduction ? 'binderType' : 'type');
    assert.equal(part.node, original.node); assert.equal(key(part.route), key(P.encode(original.route.root, original.route.slots)));
    assert.equal(part.contextLength, owner.contextLength, 'Pre-binder header');
    assert.equal(original.expressionRoot, construction.components[introduction ? 'domainExpression' : 'declaredType']);
    assert(T.expressionEqual(nativeCase.data, part.node, owner.typeData, original.expressionRoot), 'Original expression, not its inferred type');
    return original.text;
  }
  async function create(entry) {
    const original = T.construction(entry, nativeCase.data);
    assert(original, 'Accepted construction at this original occurrence');
    const construction = {...original, entry: {...original.entry, root: original.entry.typeData.roots[0]}};
    const inferredTypes = {};
    for (const field of ['conclusion', ...construction.premises.map(p => p.field)]) {
      const part = await T.constructionType(entry, nativeCase.data, field);
      if (typeof part.typeText !== 'string') continue; // Missing native text remains unavailable.
      inferredTypes[field] = await C.create(part.typeText, C.origin(source, construction, field),
        part.recording.presentation === 'compiled-constructor-summary' ? 'compiled-constructor-summary' : 'recorded-native-text');
    }
    let sourceHeader;
    if (['Pi-introduction', 'let-binding'].includes(construction.rule)) {
      const field = construction.premises[0].field;
      sourceHeader = await C.create(nativeHeader(entry, construction), C.origin(source, construction, field, 'recorded-source-expression'));
    }
    return {format: 'ProofAtlasConstructionCaptions/1', inferredTypes, ...(sourceHeader ? {sourceHeader} : {})};
  }
  return {create};
}
module.exports = {open};
