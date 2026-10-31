/* Independent syntax reconstruction of the finite native region judgments.
   This is not a JavaScript type checker. Native typing remains recorded evidence. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const crypto = require('crypto'), assert = require('assert/strict'), readline = require('readline');
const A = require('../../../public/js/proof-atlas-library-data');
const M = require('../region-context-projection/model.cjs');
const S = require('../binder-support/model.cjs');
const ROOT = path.resolve(__dirname, '../../..');
const local = name => path.join(__dirname, name);
const sha = raw => crypto.createHash('sha256').update(raw).digest('hex');
const bytes = name => z.gunzipSync(fs.readFileSync(local(name)));
const load = name => JSON.parse(bytes(name));
const binds = M.binds;

// Intern independently of native row identifiers. Payload keys preserve raw
// universe syntax, structured Names, binder annotations and metadata.
function table() {
  const rows = [], keys = new Map(), supports = new Map();
  function add(kind, payload, children) {
    const key = JSON.stringify([kind, A.payloadKey(kind, payload), children]);
    if (keys.has(key)) return keys.get(key);
    assert(rows.length < 1048576, 'canonical row bound');
    const id = rows.length;
    rows.push({kind, payload, children}); keys.set(key, id); return id;
  }
  function graph(g, limit) {
    const n = g.kind.length, ids = [], depths = [];
    assert.equal(g.serialization, 'ExprDAG/1'); assert(n > 0 && n <= limit);
    for (const field of ['children', 'payloads', 'expanded', 'neededScope']) assert.equal(g[field].length, n);
    for (let i = 0; i < n; i++) {
      const k = g.kind[i], cs = g.children[i], p = g.payloads[i];
      assert(A.kinds[k]); assert.equal(cs.length, (A.fields[A.kinds[k]] || []).length);
      assert(cs.every(c => Number.isInteger(c) && c >= 0 && c < i), 'postorder');
      depths[i] = Math.max(0, ...cs.map(c => depths[c] + 1)); assert(depths[i] <= 512);
      assert.equal(1n + cs.reduce((n, c) => n + BigInt(g.expanded[c]), 0n), BigInt(g.expanded[i]));
      const need = k === 0 ? p.index + 1 : Math.max(0, ...cs.map((c, s) => g.neededScope[c] - Number(binds(k, s))));
      assert.equal(g.neededScope[i], need);
      ids.push(add(k, p, cs.map(c => ids[c])));
    }
    assert(g.roots.every(r => Number.isInteger(r) && r >= 0 && r < n));
    const reached = new Set(), todo = [...g.roots];
    while (todo.length) { const id = todo.pop(); if (reached.has(id)) continue; reached.add(id); todo.push(...g.children[id]); }
    assert.equal(reached.size, n, 'no unowned rows');
    return {ids, roots: g.roots.map(r => ids[r])};
  }
  function support(id) {
    if (supports.has(id)) return supports.get(id);
    const r = rows[id], out = new Set(r.kind === 0 ? [r.payload.index] : []);
    r.children.forEach((c, slot) => { for (const index of support(c)) {
      if (!binds(r.kind, slot) || index > 0) out.add(index - Number(binds(r.kind, slot)));
    }});
    assert(out.size <= 512 && [...out].every(i => i >= 0 && i < 512));
    const value = [...out].sort((a, b) => a - b); supports.set(id, value); return value;
  }
  function rename(root, mapping) {
    const memo = new Map();
    function visit(id, depth) {
      const key = id + ':' + depth;
      if (memo.has(key)) return memo.get(key);
      assert(depth <= 512 && memo.size < 262144, 'rewrite state/depth bound');
      const r = rows[id]; let result;
      if (r.kind === 0 && r.payload.index >= depth) {
        const target = mapping[r.payload.index - depth]; assert(Number.isInteger(target), 'omitted dependency');
        result = add(0, {index: target + depth}, []);
      } else result = add(r.kind, r.payload, r.children.map((c, s) => visit(c, depth + Number(binds(r.kind, s)))));
      assert(memo.size < 262144); memo.set(key, result); return result;
    }
    return visit(root, 0);
  }
  function project(root, depth, kept) {
    return rename(root, Array.from({length: depth}, (_, i) => {
      const position = kept.indexOf(depth - 1 - i); return position < 0 ? undefined : kept.length - 1 - position;
    }));
  }
  const embed = (root, depth, kept) => rename(root, [...kept].reverse().map(slot => depth - 1 - slot));
  function close(body, frames, kept, pi) {
    for (const slot of [...kept].reverse()) {
      const r = rows[frames[slot]], earlier = kept.filter(s => s < slot);
      const type = project(r.children[0], slot, earlier);
      body = r.kind === 8 ? add(8, {...r.payload, nondep: false}, [type, project(r.children[1], slot, earlier), body]) :
        add(pi ? 7 : 6, r.payload, [type, body]);
    }
    return body;
  }
  function peel(root, count) {
    for (let i = 0; i < count; i++) { const r = rows[root]; assert([6, 7, 8].includes(r.kind)); root = r.children[r.kind === 8 ? 2 : 1]; }
    return root;
  }
  function spine(root) {
    const args = []; while (rows[root].kind === 5) { args.unshift(rows[root].children[1]); root = rows[root].children[0]; }
    return {head: rows[root], args};
  }
  return {rows, add, graph, support, project, embed, close, peel, spine};
}

async function main() {
  const planRaw = bytes('plan.json.gz'), nativeRaw = bytes('native-check.json.gz');
  const plan = JSON.parse(planRaw), native = JSON.parse(nativeRaw), freeze = load('freeze.json.gz');
  assert.equal(plan.format, 'ProofAtlasRegionNativePlan/1'); assert.equal(native.format, 'ProofAtlasRegionNativeVerification/1');
  assert.equal(freeze.format, 'ProofAtlasRegionNativeFreeze/1');
  assert.equal(native.status, 'PASS'); assert.equal(freeze.status, 'PASS');
  assert.equal(sha(planRaw), native.planSha256); assert.equal(sha(planRaw), freeze.planSha256);
  assert.equal(sha(nativeRaw), freeze.nativeVerificationSha256);
  assert.equal(native.independentDependencyRebuild, false); assert.equal(native.allKernelDataHashesVerified, true);
  assert.equal(freeze.postRunLibrariesMatchBuild, true); assert.equal(freeze.originalPrivateSourcesPublished, false);
  const files = {...plan.files, ...native.build.sourceFiles, ...native.sourceFiles};
  for (const [file, digest] of Object.entries(files)) assert.equal(sha(fs.readFileSync(path.join(ROOT, file))), digest, file);
  const bundle = JSON.parse(z.gunzipSync(fs.readFileSync(path.join(ROOT, 'research/proof-atlas/corpus-definition-boundaries/native-check.json.gz'))));
  const report = {format: 'ProofAtlasRegionNativeModel/1', status: 'PASS', profiles: 0, queries: 0,
    termQueries: 0, headerQueries: 0, literalInverses: 0, reconstructedClosures: 0,
    recoveryWitnessShapes: 0, maxNativeRows: 0, maxTypeRows: 0};
  assert.equal(plan.profiles.length, 11); assert.equal(native.profiles.length, 11);
  for (let pi = 0; pi < plan.profiles.length; pi++) {
    const profile = plan.profiles[pi], record = native.profiles[pi];
    assert.equal(record.profile, pi); assert.deepEqual(record.source, profile.source);
    assert.equal(record.id, profile.id); assert.equal(record.nativeCaseSha256, profile.nativeCaseSha256);
    const owner = bundle.profiles.find(p => p.source.indexSha256 === profile.source.indexSha256);
    assert.deepEqual(owner.source, profile.source);
    const g = owner.cases.find(c => c.plan.id === profile.id).native.result.graph;
    const original = JSON.parse(owner.sourcePacketText);
    function address(q, slots) {
      if (q.componentIndex === 0) return {namespace: 'source-expression', edition: profile.source.edition,
        name: profile.source.name, indexSha256: profile.source.indexSha256, sourceSha256: profile.source.sourceSha256,
        node: A.walk(original, {root: 1, slots}), route: {root: 1, slots}};
      assert.equal(q.componentIndex, 4);
      return {namespace: 'corpus-definition-boundary', sourceIndexSha256: profile.source.indexSha256,
        nativeInventorySha256: profile.nativeInventorySha256, nativeCaseSha256: profile.nativeCaseSha256,
        manifestSha256: profile.graphManifestSha256, case: profile.id, component: q.component,
        node: A.walk(g, {root: 4, slots}), route: {root: q.component, slots}};
    }
    // Python's compact serialization preserves insertion order and UTF-8 here.
    assert.equal(sha(Buffer.from(JSON.stringify(g) + '\n')), record.graphSha256);
    const base = record.baseline;
    assert.equal(base.status, 'PASS'); assert.equal(base.kernelRootAssignments, 5);
    assert.equal(base.wrongProofRejected, true); assert.equal(base.loadExts, false);
    assert.equal(base.executableIrRestored, false); assert.equal(base.queries, profile.queries.length);
    assert.equal(base.originalTargetImported, profile.source.name === 'JacobiData.slope_bound_abs');
    assert.deepEqual(base.imports, ['Mathlib', 'Aesop', ...(base.originalTargetImported ? ['SE2Conjugate.Riccati'] : [])]);
    const file = local('native-' + pi + '.ndjson.gz'); assert.equal(sha(fs.readFileSync(file)), record.outputSha256);
    const stream = fs.createReadStream(file).pipe(z.createGunzip()), digest = crypto.createHash('sha256');
    const counter = S.counter(g); let qi = 0;
    for await (const line of readline.createInterface({input: stream, crlfDelay: Infinity})) {
      assert(Buffer.byteLength(line) < 67108864); digest.update(line + '\n');
      const row = JSON.parse(line), q = profile.queries[qi], entry = record.resources.queries[qi++];
      assert(q); assert.deepEqual(row.query, q); assert.equal(sha(Buffer.from(line + '\n')), entry.rawSha256);
      assert.equal(q.component, q.componentIndex === 0 ? 'source.term' : 'interface.term');
      assert.deepEqual(q.regionAddress, address(q, q.regionSlots));
      assert.deepEqual(q.originalAddress, address(q, q.slots));
      assert.equal(row.format, 'ProofAtlasRegionNativeQuery/1');
      for (const field of ['status', 'kernelOriginalTyping', 'kernelClosedExpectedType', 'kernelProjectedOpenTyping',
        'kernelRecoveryConversion', 'kernelEqualityWitness', 'literalInverse']) assert.equal(row[field], 'PASS');
      const t = table(), source = t.graph(g, 262144), results = t.graph(row.graph, 262144), types = t.graph(row.types, 32768);
      const r = results.roots; assert.equal(r.length, 9); assert.equal(types.roots.length, 2);
      const at = M.walk(g, g.roots[q.componentIndex], q.slots), frames = at.scope.map(s => source.ids[s.node]);
      assert.equal(q.sourceTableNode, at.node); assert.equal(r[0], source.ids[at.node]);
      assert.equal(row.originalDepth, frames.length); assert.equal(row.retainedDepth, q.keptSlots.length);
      assert.deepEqual(q.keptSlots, [...new Set(q.keptSlots)].sort((a, b) => a - b));
      assert(q.keptSlots.every(s => s >= 0 && s < frames.length));
      const region = M.reference(g, g.roots[q.componentIndex], q.regionSlots, counter);
      assert.deepEqual(q.baseKeptSlots, region.kept);
      if (q.part.kind === 'term') { assert.deepEqual(q.slots, q.regionSlots); assert.deepEqual(q.keptSlots, region.kept); report.termQueries++; }
      else {
        assert.equal(q.part.kind, 'header'); assert(region.kept.includes(q.part.slot));
        assert(['binderType', 'letValue'].includes(q.part.role));
        assert.deepEqual(q.slots, [...region.scope[q.part.slot].path, q.part.role === 'binderType' ? 0 : 1]);
        assert.deepEqual(q.keptSlots, region.kept.filter(s => s < q.part.slot)); report.headerQueries++;
      }
      assert.equal(r[1], types.roots[0]); assert.equal(r[3], types.roots[1]);
      assert.deepEqual(t.support(r[0]), row.termSupport); assert.deepEqual(t.support(r[1]), row.rawTypeSupport);
      const closure = new Set([...t.support(r[0]), ...t.support(r[1])].map(i => frames.length - 1 - i));
      let changed = true;
      while (changed) { changed = false; for (const slot of [...closure]) {
        assert(slot >= 0 && slot < frames.length); const h = t.rows[frames[slot]];
        for (const field of h.children.slice(0, h.kind === 8 ? 2 : 1)) for (const index of t.support(field)) {
          const target = slot - 1 - index; assert(target >= 0 && target < slot);
          if (!closure.has(target)) { closure.add(target); changed = true; }
        }
      }}
      assert.deepEqual([...closure].sort((a, b) => a - b), row.typedClosureSlots);
      assert([...closure].every(slot => q.keptSlots.includes(slot)));
      assert.equal(t.project(r[0], frames.length, q.keptSlots), r[2]);
      assert.equal(t.project(r[1], frames.length, q.keptSlots), r[3]);
      assert.equal(t.embed(r[2], frames.length, q.keptSlots), r[0]);
      assert.equal(t.embed(r[3], frames.length, q.keptSlots), r[1]); report.literalInverses += 2;
      assert.equal(t.close(r[2], frames, q.keptSlots, false), r[4]);
      assert.equal(t.close(r[3], frames, q.keptSlots, true), r[5]); report.reconstructedClosures += 2;
      // Check the closed recovery witness's exact syntax without inferring types.
      let applied = r[4];
      for (const slot of q.keptSlots) if (t.rows[frames[slot]].kind !== 8)
        applied = t.add(5, {}, [applied, t.add(0, {index: frames.length - 1 - slot}, [])]);
      const all = frames.map((_, i) => i), eqBody = t.peel(r[8], frames.length), witnessBody = t.peel(r[7], frames.length);
      const equality = t.spine(eqBody), witness = t.spine(witnessBody);
      assert.equal(equality.head.kind, 4); assert.equal(witness.head.kind, 4);
      assert.equal(equality.head.payload.name, 'Eq'); assert.equal(witness.head.payload.name, 'Eq.refl');
      assert.equal(equality.head.payload.levels.length, 1);
      assert.equal(A.levelsKey(equality.head.payload.levels), A.levelsKey(witness.head.payload.levels));
      assert.deepEqual(equality.args, [r[1], applied, r[0]]); assert.deepEqual(witness.args, [r[1], applied]);
      assert.equal(t.close(eqBody, frames, all, true), r[8]);
      assert.equal(t.close(witnessBody, frames, all, false), r[7]); report.recoveryWitnessShapes++;
      report.maxNativeRows = Math.max(report.maxNativeRows, row.graph.kind.length);
      report.maxTypeRows = Math.max(report.maxTypeRows, row.types.kind.length);
      assert.equal(row.graph.kind.length, entry.rows); assert.equal(row.types.kind.length, entry.typeRows);
      report.queries++;
    }
    assert.equal(qi, profile.queries.length); assert.equal(digest.digest('hex'), record.resources.rawStreamSha256);
    assert.equal(record.resources.exitCode, 0); assert.equal(record.resources.stopReason, null);
    assert.deepEqual(record.resources.streamErrors, []); report.profiles++;
  }
  assert.equal(report.queries, 150); assert.equal(report.termQueries, 22); assert.equal(report.headerQueries, 128);
  assert.equal(plan.queryCount, report.queries); assert.equal(native.queries, report.queries);
  report.scope = 'Finite recorded native typing; independent complete syntax, lexical closure, projection, inverse and recovery-shape reconstruction. No general typing-preservation theorem or UI attachment.';
  report.files = {...files, ...Object.fromEntries(['check.cjs', 'freeze.py', 'plan.json.gz', 'native-check.json.gz', 'freeze.json.gz',
    ...plan.profiles.map((_, i) => 'native-' + i + '.ndjson.gz')].map(name => [path.relative(ROOT, local(name)), sha(fs.readFileSync(local(name)))]))};
  const raw = Buffer.from(JSON.stringify(report, null, 2) + '\n');
  if (process.argv.includes('--check')) assert(raw.equals(bytes('model.json.gz')));
  else if (process.argv.includes('--write')) fs.writeFileSync(local('model.json.gz'), z.gzipSync(raw, {mtime: 0}));
  console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k]) => k !== 'files'))));
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
