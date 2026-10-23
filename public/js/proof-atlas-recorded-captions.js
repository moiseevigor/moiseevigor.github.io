/* Bounded presentation attached to one exact construction component. */
(function (host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
  const limits = Object.freeze({codePoints: 240, textBytes: 512, envelopeBytes: 2048});
  const suffix = '… [truncated recorded text]';
  const demand = (value, message) => { if (!value) throw Error('Recorded caption: ' + message); };
  const bytes = value => new TextEncoder().encode(value);
  const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
  const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const natural = value => Number.isSafeInteger(value) && value >= 0;
  const digest = value => A.digest(bytes(value));
  function validateOrigin(attachment) {
    demand(attachment?.format === 'ProofAtlasCaptionOrigin/1' && ['original-source', 'computed-native-type'].includes(attachment.namespace), 'origin namespace');
    demand(typeof attachment.source?.name === 'string' && hex(attachment.source.indexSha256) && hex(attachment.source.sourceGraphSha256)
      && hex(attachment.evidenceSha256) && hex(attachment.typeTableSha256), 'origin source/owner');
    P.parse(attachment.construction?.route); P.parse(attachment.selected?.route); P.parse(attachment.recording?.queryRoute);
    demand(natural(attachment.construction.node) && natural(attachment.selected.node) && natural(attachment.selected.contextLength)
      && attachment.selected.contextLength <= attachment.selected.route.depth && ['proof', 'type', 'value'].includes(attachment.selected.role), 'origin interface');
    demand(['conclusion', 'binderType', 'body', 'fn', 'arg', 'type', 'value'].includes(attachment.field), 'origin field');
    if (attachment.namespace === 'computed-native-type') demand(natural(attachment.typeRoot) && attachment.observation === 'kernel', 'inferred-type origin');
    else demand(['binderType', 'type'].includes(attachment.field) && attachment.selected.role === 'type'
      && attachment.typeRoot === undefined && attachment.observation === undefined, 'source-expression origin');
  }
  function textSize(text) {
    demand(typeof text === 'string', 'text');
    let codePoints = 0, utf8Bytes = 0;
    for (const point of text) {
      const scalar = point.codePointAt(0);
      demand(scalar < 0xd800 || scalar > 0xdfff, 'Unicode scalar text');
      codePoints++; utf8Bytes += scalar <= 0x7f ? 1 : scalar <= 0x7ff ? 2 : scalar <= 0xffff ? 3 : 4;
    }
    return {codePoints, utf8Bytes};
  }
  function excerpt(text) {
    const full = textSize(text);
    if (full.codePoints <= limits.codePoints && full.utf8Bytes <= limits.textBytes) return {text, truncated: false};
    const marker = textSize(suffix);
    let result = '', count = marker.codePoints, size = marker.utf8Bytes;
    for (const point of text) {
      const length = textSize(point).utf8Bytes;
      if (count + 1 > limits.codePoints || size + length > limits.textBytes) break;
      result += point; count++; size += length;
    }
    return {text: result + suffix, truncated: true};
  }
  function origin(source, construction, field, category = 'recorded-inferred-type') {
    demand(['recorded-inferred-type', 'recorded-source-expression'].includes(category), 'category');
    const entry = construction.entry, part = field === 'conclusion' ? entry : construction.premises.find(p => p.field === field);
    demand(part && hex(source.indexSha256) && hex(source.sourceGraphSha256), 'source component');
    demand(hex(entry.evidenceSha256) && hex(entry.typeTableSha256), 'recorded owner');
    P.parse(entry.route); P.parse(part.route); P.parse(construction.recording.queryRoute);
    demand(natural(part.node) && natural(part.contextLength) && ['proof', 'type', 'value'].includes(part.role), 'component interface');
    if (category === 'recorded-source-expression') demand(
      construction.rule === 'Pi-introduction' && field === 'binderType' || construction.rule === 'let-binding' && field === 'type', 'source header field');
    const root = field === 'conclusion' ? entry.root : part.typeRoot;
    if (category === 'recorded-inferred-type') demand(natural(root), 'recorded type root');
    return {format: 'ProofAtlasCaptionOrigin/1', namespace: category === 'recorded-source-expression' ? 'original-source' : 'computed-native-type',
      source: {name: source.name, indexSha256: source.indexSha256, sourceGraphSha256: source.sourceGraphSha256},
      evidenceSha256: entry.evidenceSha256, typeTableSha256: entry.typeTableSha256,
      construction: {route: entry.route, node: entry.node}, field,
      selected: {route: part.route, node: part.node, contextLength: part.contextLength, role: part.role},
      ...(category === 'recorded-inferred-type' ? {typeRoot: root, observation: 'kernel'} : {}), recording: construction.recording};
  }
  async function create(text, attachment, presentation = 'recorded-native-text') {
    validateOrigin(attachment);
    demand(['recorded-native-text', 'compiled-constructor-summary'].includes(presentation), 'presentation');
    const short = excerpt(text), full = textSize(text);
    const caption = {format: 'ProofAtlasRecordedCaption/1', category: attachment.namespace === 'original-source' ? 'recorded-source-expression' : 'recorded-inferred-type',
      origin: {namespace: attachment.namespace, sourceIndexSha256: attachment.source.indexSha256, sourceNode: attachment.selected.node,
        contextLength: attachment.selected.contextLength, originKey: await digest(canonical(attachment))},
      presentation, text: short.text, textSha256: await digest(text), excerptSha256: await digest(short.text),
      originalCodePoints: full.codePoints, originalBytes: full.utf8Bytes,
      truncatedByCaptionBudget: short.truncated, nativeTextMayElide: true};
    await validate(caption, attachment);
    return Object.freeze({...caption, origin: Object.freeze(caption.origin)});
  }
  async function validate(caption, attachment) {
    validateOrigin(attachment);
    demand(caption && Object.keys(caption).sort().join(',') === 'category,excerptSha256,format,nativeTextMayElide,origin,originalBytes,originalCodePoints,presentation,text,textSha256,truncatedByCaptionBudget', 'envelope fields');
    demand(caption.format === 'ProofAtlasRecordedCaption/1' && caption.category === (attachment.namespace === 'original-source' ? 'recorded-source-expression' : 'recorded-inferred-type'), 'envelope identity');
    demand(canonical(caption.origin) === canonical({namespace: attachment.namespace, sourceIndexSha256: attachment.source.indexSha256,
      sourceNode: attachment.selected.node, contextLength: attachment.selected.contextLength, originKey: await digest(canonical(attachment))}), 'original component origin');
    demand(['recorded-native-text', 'compiled-constructor-summary'].includes(caption.presentation) && caption.nativeTextMayElide === true, 'presentation scope');
    demand(typeof caption.text === 'string' && excerpt(caption.text).truncated === false && bytes(canonical(caption)).length <= limits.envelopeBytes, 'caption byte/scalar bounds');
    demand(hex(caption.textSha256) && caption.excerptSha256 === await digest(caption.text) && natural(caption.originalCodePoints) && natural(caption.originalBytes), 'text sizes/digests');
    if (caption.truncatedByCaptionBudget === false) demand(caption.originalCodePoints === Array.from(caption.text).length && caption.originalBytes === bytes(caption.text).length && caption.textSha256 === caption.excerptSha256, 'complete text');
    else demand(caption.truncatedByCaptionBudget === true && caption.text.endsWith(suffix) && (caption.originalCodePoints > limits.codePoints || caption.originalBytes > limits.textBytes), 'explicit truncation');
    return true;
  }
  const api = {limits, excerpt, origin, create, validate};
  if (node) module.exports = api; else host.ProofAtlasRecordedCaptions = api;
})(typeof window === 'undefined' ? globalThis : window);
