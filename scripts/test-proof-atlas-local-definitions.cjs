/* Independent fields, lexical contexts, native origins and disjoint source cuts. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm');
const assert = require('assert/strict'), crypto = require('crypto');
const T = require('../public/js/proof-atlas-deep-context'), P = require('../public/js/proof-atlas-packed-routes');
const U = require('../public/js/proof-atlas-local-definition-unit'), F = require('../public/js/proof-atlas-local-definition-frame');
const D = require('../public/js/proof-atlas-definition-frame-delivery');
const producer = require('../research/proof-atlas/construction-pages/captions.cjs');
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const canonical = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k, x[k]])) : x);
const slots = r => {const b = Buffer.from(r.slots, 'base64url'); return Array.from({length:r.depth}, (_, i) => b[i >> 2] >> ((i % 4) * 2) & 3);};
function at(data, route) {
  let node = data.roots[route.root], context = 0;
  for (const s of slots(route)) {const k = data.kind[node]; if ([6,7].includes(k) && s === 1 || k === 8 && s === 2) context++; node = data.children[node][s]; assert.notEqual(node, undefined);}
  return {node, context};
}
function syntax(a, x, b, y) {
  const todo = [[x,y]], seen = new Set();
  while (todo.length) {const [i,j] = todo.pop(), key = i + ':' + j; if (seen.has(key)) continue; seen.add(key);
    if (a.kind[i] !== b.kind[j] || canonical(a.payloads[i]) !== canonical(b.payloads[j]) || a.children[i].length !== b.children[j].length) return false;
    a.children[i].forEach((n, k) => todo.push([n,b.children[j][k]]));
  }
  return true;
}
const out = {status:'RUNNING', corpusProfiles:0, controlProfiles:0, corpusLets:0, controlLets:0, units:0, typePorts:0, frames:0, joins:0, sourceRegions:0, refusals:0, controlRoles:{}, differentControlRoles:0, browserModelComparisons:0, sameNodeContextGraftsRejected:0, deliveryFrames:0, deliveryRefusals:0};
const catalogs = Object.fromEntries(['corpus','core'].map(dataset => [dataset, {format:'ProofAtlasDefinitionFrameCatalogPrototype/1',dataset,starts:[]} ]));
const deliveries = {corpus:[], core:[]};
async function audit(c, captions, edition, control) {
  const u = U.open(c, captions, edition), f = F.open(c, captions, edition), shared = [];
  for (const e of c.entries) {
    const rule = T.construction(e, c.data); if (rule?.rule !== 'let-binding') continue;
    const owner = rule.entry, g = owner.typeData, parts = rule.premises;
    for (const shareTypes of [false, true]) {
      const v = await u.create(e, {shareTypes}); await u.validate(JSON.parse(JSON.stringify(v)), e);
      assert.deepEqual(at(c.data, v.root.route), {node:e.node, context:e.contextLength});
      assert.equal(v.binding.variableRole, 'not-recorded-by-this-interface'); assert.equal(v.binding.countContribution, '0');
      assert.equal(v.binding.from, e.contextLength); assert.equal(v.binding.to, e.contextLength + 1);
      assert.equal(v.value.role, parts[1].role); assert.equal(v.wholeRole, e.role);
      assert.equal(v.sharing.structuralEquality, syntax(g, rule.components.declaredType, g, parts[1].typeRoot));
      assert.equal(v.sharing.active, shareTypes && v.sharing.structuralEquality);
      assert.equal(v.formulas.length, v.sharing.active ? 3 : 4);
      for (const [i, region] of v.partition.regions.entries()) {
        const actual = at(c.data, region.route); assert.equal(actual.node, c.data.children[e.node][i]); assert.equal(actual.context, e.contextLength + (i === 2 ? 1 : 0)); assert.equal(region.expanded, c.data.expanded[actual.node]); out.sourceRegions++;
      }
      assert.equal(BigInt(v.partition.hidden) + 1n, BigInt(c.data.expanded[e.node]));
      for (const [name, index] of [['valueType',1], ['bodyType',2], ['conclusionType',-1]]) {
        const p = v.ports[name]; assert.equal(p.root, index < 0 ? g.roots[0] : parts[index].typeRoot); assert.equal(p.context.length, e.contextLength + (index === 2 ? 1 : 0)); assert.equal(p.evidenceSha256, owner.evidenceSha256); assert.equal(p.typeTableSha256, owner.typeTableSha256); out.typePorts++;
      }
      assert(syntax(c.data, parts[0].node, g, rule.components.declaredType));
      assert.notEqual(v.ports.declared.caption.origin.originKey, v.ports.valueType.caption.origin.originKey); assert.notEqual(v.ports.bodyType.caption.origin.originKey, v.ports.conclusionType.caption.origin.originKey); out.units++;
    }
    const single = await u.create(e);
    const deliveryStart = {source:single.source, root:single.root, frames:{}}, dataset = control ? 'core' : 'corpus';
    for (const change of [v => v.binding.variableRole = v.wholeRole, v => v.value.role = 'unknown', v => v.ports.bodyType.context.length--, v => v.source.indexSha256 = '0'.repeat(64), v => v.ports.valueType.caption.text += 'altered', v => v.partition.hidden = '0']) {
      const bad = structuredClone(single); change(bad); await assert.rejects(() => u.validate(bad, e)); out.refusals++;
    }
    assert.throws(() => u.port(structuredClone(single), 'declared')); out.refusals++;
    for (const maxUnits of [1,2,4,8]) {
      const v = await f.create(e.route, {maxUnits}); await f.validate(JSON.parse(JSON.stringify(v)));
      assert(v.units.length <= maxUnits); assert.equal(v.joins.length, v.units.length - 1);
      let expected = e;
      for (const [i, member] of v.units.entries()) {
        const actual = at(c.data, member.root.route), r = T.construction(expected, c.data); assert.equal(r.rule, 'let-binding'); assert.equal(actual.node, expected.node); assert.equal(actual.context, e.contextLength + i); assert.deepEqual(member.root.route, expected.route);
        if (i) {const previous = v.units[i-1], priorRule = T.construction(c.get(previous.root.route), c.data), j = v.joins[i-1]; assert.deepEqual(previous.body.route, member.root.route); assert.equal(previous.body.node, member.root.node); assert.equal(previous.body.role, member.wholeRole); assert.equal(previous.body.contextLength, member.context.length); assert(syntax(priorRule.entry.typeData, priorRule.premises.at(-1).typeRoot, r.entry.typeData, r.entry.typeData.roots[0])); assert.notEqual(j.parentPort.caption.origin.originKey, j.childPort.caption.origin.originKey); out.joins++;}
        expected = c.get(r.premises.at(-1).route);
      }
      const regions = v.sourcePartition.regions.map(r => slots(r.route));
      for (let a = 0; a < regions.length; a++) for (let b = 0; b < regions.length; b++) if (a !== b) assert(!(regions[a].length <= regions[b].length && regions[a].every((s,i) => regions[b][i] === s)), 'Source regions must be disjoint');
      let hidden = 0n;
      for (const r of v.sourcePartition.regions) {const actual = at(c.data, r.route); assert.equal(r.node, actual.node); assert.equal(r.contextLength, actual.context); assert.equal(r.expanded, c.data.expanded[actual.node]); hidden += BigInt(r.expanded);}
      assert.equal(hidden, BigInt(v.sourcePartition.hidden)); assert.equal(hidden + BigInt(v.units.length), BigInt(c.data.expanded[e.node]));
      if (v.units.length > 1) assert(v.units.reduce((sum,x) => sum + BigInt(x.partition.represented), 0n) > BigInt(v.sourcePartition.represented));
      out.frames++;
      if ([4,8].includes(maxUnits)) {const body = Buffer.from(JSON.stringify(v) + '\n'), hash = sha(body); deliveryStart.frames[maxUnits] = {file:hash + '.frame.json',bytes:body.length,sha256:hash,units:v.units.length,stop:v.continuation.status}; deliveries[dataset].push({v,start:deliveryStart,budget:maxUnits});}
    }
    catalogs[dataset].starts.push(deliveryStart);
    const full = await f.create(e.route, {maxUnits:8});
    for (const change of [v => v.continuation.route.root = 1 - v.continuation.route.root, v => v.units[0].root.node++, v => v.sourcePartition.represented = '1']) {const bad = structuredClone(full); change(bad); await assert.rejects(() => f.validate(bad)); out.refusals++;}
    if (control) {out.controlLets++; out.controlRoles[single.value.role] = (out.controlRoles[single.value.role] || 0) + 1; out.differentControlRoles += single.value.role !== single.wholeRole;}
    else out.corpusLets++;
    if (control && c.record.name === 'AtlasLet.sharedContexts') shared.push(full);
    if (control && ['AtlasLet.typeChain','AtlasLet.mixedShadow'].includes(c.record.name) && e.contextLength === 0) {
      assert.deepEqual(full.units.map(x => x.value.role), ['type','value','proof']);
      const host = {ProofAtlasDeepContext:T, ProofAtlasPackedRoutes:P, ProofAtlasRecordedCaptions:require('../public/js/proof-atlas-recorded-captions'), ProofAtlasOccurrenceContextFrame:require('../public/js/proof-atlas-occurrence-context-frame')};
      for (const name of ['local-definition-unit','local-definition-frame']) vm.runInNewContext(fs.readFileSync('public/js/proof-atlas-' + name + '.js','utf8'), {window:host, TextEncoder});
      const model = host.ProofAtlasLocalDefinitionFrame.open(c, captions, edition); assert.deepEqual(JSON.parse(JSON.stringify(await model.create(e.route, {maxUnits:8}))), full); out.browserModelComparisons++;
    }
  }
  if (shared.length) {assert.equal(shared.length, 2); assert.equal(shared[0].root.node, shared[1].root.node); assert.notDeepEqual(shared[0].root.route, shared[1].root.route); assert.notDeepEqual(shared[0].units[0].value.head.binding.route, shared[1].units[0].value.head.binding.route); const graft = structuredClone(shared[0]); graft.units[0] = structuredClone(shared[1].units[0]); await assert.rejects(() => f.validate(graft)); out.sameNodeContextGraftsRejected++;}
}
(async () => {
  const h = {}, raw = file => z.gunzipSync(fs.readFileSync('.' + file), {maxOutputLength:67108864});
  for (const n of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '.js','utf8'), {window:h});
  const {library, types} = require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY, h.PROOF_ATLAS_OCCURRENCE_TYPES, null, h.PROOF_ATLAS_AI_SAMPLE);
  for (const d of types.records) {
    const record = library.editions.find(e => e.id === d.edition).declarations.find(r => r.name === d.name), bytes = raw(record.indexFile); let pkg = await T.recorded(bytes, raw(d.file), d, record);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === d.name && x.edition === d.edition && x.indexSha256 === d.indexSha256); if (ld) pkg = T.mergeRecorded(pkg, await T.recordedLets(bytes, raw(ld.file), ld, record));
    const c = pkg.case(record.name); await audit(c, producer.open(c, e => raw(e.evidenceFile)), d.edition, false); out.corpusProfiles++;
  }
  const folder = 'research/proof-atlas/local-definitions/fixtures', controls = JSON.parse(fs.readFileSync(folder + '/index.json'));
  assert.equal(controls.format, 'ProofAtlasOwnedDefinitionControls/1'); assert.equal(controls.native.queries, 34); assert.equal(controls.native.moduleOwnershipVerified, true);
  const fixture = file => {const d = controls.files[file]; assert(d); assert(/^[a-f0-9]{64}\.json\.gz$/.test(d.file)); const b = fs.readFileSync(path.join(folder, 'files', d.file)); assert.equal(b.length, d.bytes); assert.equal(sha(b), d.sha256); return z.gunzipSync(b, {maxOutputLength:67108864});};
  for (const {record, descriptor} of controls.registry) {
    const bytes = fixture(record.indexFile), evidence = fixture(descriptor.file), pkg = await T.recordedLets(bytes, evidence, descriptor, record), c = pkg.case(record.name);
    await audit(c, producer.open(c, e => fixture(e.evidenceFile)), 'local-definition-controls', true); out.controlProfiles++;
    if (out.controlProfiles === 1) for (const change of [e => e.environment.module = 'Foreign.Module', e => e.environment.moduleOwnershipVerified = false, e => e.environment.imports.push('Mathlib'), e => e.environment.sourceSha256 = '0'.repeat(64), e => e.environment.dependencyRevisions.mathlib = 'a'.repeat(40), e => delete e.environment.dependencyRevisions, e => e.source.edition = 'recursion-controls', e => e.environment.kind = 'fresh-projection-control/1', e => {e.environment.kind = 'generic-attestation'; e.environment.lakeManifestSha256 = 'a'.repeat(64); e.environment.dependencyRevisions.mathlib = 'a'.repeat(40);}]) {
      const bad = JSON.parse(evidence); change(bad); const altered = Buffer.from(JSON.stringify(bad)); await assert.rejects(() => T.recordedLets(bytes, altered, {...descriptor, sha256:sha(altered), decodedBytes:altered.length}, record)); out.refusals++;
    }
  }
  for (const dataset of ['corpus','core']) {
    const catalog = D.catalog(catalogs[dataset], dataset);
    for (const change of [c => c.starts.push(c.starts[0]), c => c.starts[0].frames[8].bytes = D.limits.frameBytes + 1, c => c.starts[0].source.sourceGraphSha256 = 'missing']) {const bad = structuredClone(catalog); change(bad); assert.throws(() => D.catalog(bad, dataset)); out.deliveryRefusals++;}
    for (const {v,start,budget} of deliveries[dataset]) {
      D.frame(v, catalog, start, budget); out.deliveryFrames++;
      for (const change of [f => f.source.indexSha256 = '0'.repeat(64), f => f.root.node++, f => f.options.maxUnits = 64, f => f.units[0].binding.to--, f => f.units[0].ports.bodyType.context.length--, f => f.sourcePartition.hidden = '0', f => f.continuation.route.root = 1 - f.continuation.route.root]) {const bad = structuredClone(v); change(bad); assert.throws(() => D.frame(bad, catalog, start, budget)); out.deliveryRefusals++;}
      if (v.joins.length) {const bad = structuredClone(v); bad.joins[0].childPort = structuredClone(bad.joins[0].parentPort); assert.throws(() => D.frame(bad, catalog, start, budget)); out.deliveryRefusals++;}
    }
  }
  assert.equal(out.corpusProfiles, 26); assert.equal(out.controlProfiles, 25); assert.equal(out.corpusLets, 60); assert.equal(out.controlLets, 34); assert.equal(out.frames, 376); assert.equal(out.units, 188); assert.deepEqual(out.controlRoles, {value:22, type:6, proof:6}); assert.equal(out.differentControlRoles, 10); assert.equal(out.browserModelComparisons, 2); assert.equal(out.sameNodeContextGraftsRejected, 1);
  assert.equal(out.deliveryFrames, 188);
  out.status = 'PASS'; out.scope = 'Finite original-source/type/origin correspondence over all current recorded let constructions and owned native calibration records, plus bounded delivery contracts. Controls are extracted attestations, not fresh kernel replay by this test. No general preservation theorem, combined reduction or comprehension result.';
  fs.writeFileSync(process.env.ATLAS_LOCAL_DEFINITION_REPORT || '/tmp/atlas-local-definitions.json', JSON.stringify(out, null, 2) + '\n'); console.log(JSON.stringify(out));
})().catch(e => {console.error(e.stack); process.exit(1);});
