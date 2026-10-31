/* Separate control/index registries; earlier source and native inventories stay frozen. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), assert = require('assert/strict');
const S = require('../application-ports/store.cjs'), P = require('../network-streaming/pack.cjs');
const K = require('../native-type-paging/pack.cjs'), M = require('../../../public/js/proof-atlas-application-ports');
const N = require('../../../public/js/proof-atlas-application-network');
process.chdir(path.resolve(__dirname, '../../..'));
const folder = process.argv[2]; assert(folder && path.isAbsolute(folder));
const base = 'research/proof-atlas/dependent-region-inputs/';
const read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const verification = read(base + 'verification.json.gz'), native = read(base + 'native.json.gz'), ports = read(base + 'ports.json.gz');
assert.equal(verification.status, 'PASS');
for (const [file, hash] of Object.entries(verification.producerFiles)) assert.equal(S.sha(fs.readFileSync(file)), hash, file);
assert.equal(S.sha(z.gunzipSync(fs.readFileSync(base + 'native.json.gz'))), verification.nativeSha256);
assert.equal(S.sha(z.gunzipSync(fs.readFileSync(base + 'ports.json.gz'))), verification.refinedPortsSha256);
const frozen = ['network-streaming-manifest.js', 'application-region-controls-manifest.js', 'application-type-index-manifest.js', 'region-function-pages-manifest.js'];
const before = Object.fromEntries(frozen.map(file => [file, S.sha(fs.readFileSync('public/data/proof-atlas/' + file))]));
const producerSha256 = S.sha(fs.readFileSync(__filename)), nativeEvidenceSha256 = S.sha(z.gunzipSync(fs.readFileSync(base + 'verification.json.gz')));
const descriptors = [], tables = [], typeProfiles = [], assets = new Map();
function remember(ref) {
  const raw = z.gunzipSync(fs.readFileSync('.' + ref.file)); assert.equal(S.sha(raw), ref.sha256, ref.file);
  assets.set(ref.file, { sha256: ref.sha256, gzipSha256: S.sha(fs.readFileSync('.' + ref.file)) }); return ref;
}
function emit(file, raw) {
  if (fs.existsSync('.' + file)) assert(z.gunzipSync(fs.readFileSync('.' + file)).equals(raw));
  else { fs.mkdirSync(path.dirname('.' + file), { recursive: true }); fs.writeFileSync('.' + file, z.gzipSync(raw)); }
  return remember({ file, sha256: S.sha(raw), bytes: raw.length });
}
function index(kind, value, cap) {
  const raw = K.encode(value); assert(raw.length <= cap); const sha256 = S.sha(raw);
  return emit('/public/data/proof-atlas/application-type-index/' + sha256 + '.' + kind + '.gz', raw);
}
for (const [i, profile] of native.profiles.entries()) {
  const packet = fs.readFileSync(path.join(folder, 'packets', profile.source.name.split('.').pop() + '.json'));
  assert.equal(S.sha(packet), profile.source.indexSha256);
  emit(profile.record.indexFile, packet);
  const sourcePages = S.sourcePages(profile.source, profile.record, producerSha256);
  for (const name of fs.readdirSync('public/data/proof-atlas/source-pages/' + profile.source.indexSha256)) {
    const file = '/public/data/proof-atlas/source-pages/' + profile.source.indexSha256 + '/' + name;
    remember({ file, sha256: S.sha(z.gunzipSync(fs.readFileSync('.' + file))) });
  }
  const row = ports[i]; assert.deepEqual(row.source, profile.source);
  const owner = remember(S.store('public/data/proof-atlas/application-ports', Buffer.from(JSON.stringify(row) + '\n')));
  assert.deepEqual(owner, profile.originalNativeOwner);
  const dir = 'public/data/proof-atlas/application-ports/' + owner.sha256, fields = { ...row }; delete fields.entries;
  const header = remember(S.store(dir, { format: 'ProofAtlasApplicationHeader/1', owner, keys: Object.keys(row), fields }));
  const calls = profile.records.map(call => ({ index: call.index, anchor: call.anchor, arguments: call.arguments, functionLabel: call.functionLabel,
    ports: call.ports.map(port => ({ ...remember(S.store(dir, { format: 'ProofAtlasApplicationPortPage/1', ownerSha256: owner.sha256, id: port.id, entry: row.entries.find(entry => entry.id === port.id) })), id: port.id, slot: port.slot, input: port.input })) }));
  const pages = remember(S.store(dir, { format: 'ProofAtlasApplicationQueryPages/1', source: profile.source, owner, roundtripSha256: owner.sha256, producerSha256, header, calls }));
  const descriptor = { source: profile.source, record: profile.record, sourcePages, kind: 'authored-dependent-region', owner, pages,
    calls: calls.map(call => ({ ...call, ports: call.ports.map(({ id, slot, input }) => ({ id, slot, input })) })) };
  const table = { format: 'ProofAtlasApplicationNetwork/1', source: profile.source, owner, nativeEvidenceSha256, calls: profile.records };
  N.validate(table, { ...descriptor, topology: { nativeEvidenceSha256 } });
  const prepared = K.prepare(descriptor, Buffer.from(JSON.stringify(row) + '\n'), packet), typeCalls = [];
  for (const call of calls) {
    const portDescriptors = [];
    for (let slot = 0; slot <= call.arguments; slot++) {
      const packed = K.pack(prepared, call.index + ':' + slot);
      for (const [file, raw] of packed.files) emit(file, raw);
      portDescriptors.push(packed.descriptor);
    }
    const original = { index: call.index, anchor: call.anchor, arguments: call.arguments };
    typeCalls.push({ ...original, page: index('call', { format: 'ProofAtlasApplicationTypeCallIndex/1', source: profile.source, ownerSha256: owner.sha256, call: original, ports: portDescriptors }, 262144) });
  }
  typeProfiles.push({ source: profile.source, ownerSha256: owner.sha256,
    page: index('profile', { format: 'ProofAtlasApplicationTypeProfile/1', source: profile.source, ownerSha256: owner.sha256, calls: typeCalls }, 262144) });
  descriptors.push(descriptor); tables.push(table);
}
const typeCatalog = { format: 'ProofAtlasApplicationTypeCatalogRef/1', ...index('catalog', { format: 'ProofAtlasApplicationTypeCatalog/1', profiles: typeProfiles,
  producerSha256, packerSha256: S.sha(fs.readFileSync('research/proof-atlas/native-type-paging/pack.cjs')), scope: 'Four authored dependent-domain controls; recorded v2 zeta bridges, with optional untyped beta probes kept separate.' }, 131072) };
const records = [], graphs = [];
for (const [i, descriptor] of descriptors.entries()) {
  descriptor.pagedTypeCatalog = typeCatalog;
  const file = path.join(folder, 'dependent-network-' + i + '.sqlite'); assert(!fs.existsSync(file)); const db = P.database(file);
  for (const call of tables[i].calls) {
    db.prepare('INSERT INTO calls(id,route,node,payload) VALUES (?,?,?,?)').run(call.index, M.key(call.anchor.route), call.anchor.node, JSON.stringify(call));
    for (const port of call.ports) if (port.knownProducer !== null) db.prepare('INSERT INTO edges(producer,consumer,slot) VALUES (?,?,?)').run(port.knownProducer, call.index, port.slot);
  }
  const nativeDescriptor = remember(P.store(descriptor)), packed = P.pack(db, { mode: 'native', source: descriptor.source, owner: descriptor.owner, nativeEvidenceSha256, authoredControl: true }); db.close();
  const record = { mode: 'native', source: descriptor.source, owner: descriptor.owner, record: descriptor.record, sourcePages: descriptor.sourcePages,
    nativeDescriptor, pagedTypeCatalog: typeCatalog, ...packed, focus: tables[i].calls.length - 1 };
  records.push(record); remember(record.pages);
  const old = P.read(record.pages), calls = [];
  function all(ref) { const value = P.read(ref); remember(ref); if (!ref.level) calls.push(...value.rows); else for (const child of value.children) all(child); }
  all(old.callRoot);
  function reverse(ref) { if (!ref) return; const value = P.read(ref); remember(ref); if (ref.level) for (const child of value.children) reverse(child); }
  reverse(old.outgoingRoot);
  const original = { scope: record.scope, headerSha256: record.pages.sha256, counts: record.counts }, order = 'call-id';
  for (const call of calls) for (const port of call.ports) if (port.knownProducer !== null) assert(port.knownProducer < call.index);
  const scope = S.sha(Buffer.from(JSON.stringify({ rule: 'first-hit-selected-reachability/1', source: record.source, owner: record.owner, original, order })));
  const rows = calls.map(call => [call.index, call.ports.length, call.outStart, call.outCount, call.ports.filter(port => port.knownProducer !== null).map(port => [port.knownProducer, port.slot, port.outOrdinal])]);
  const leaf = { ...remember(S.store('public/data/proof-atlas/inventory-graph', { format: 'ProofAtlasInventoryGraphPage/1', scope, first: 0, count: calls.length, level: 0, rows })), first: 0, count: calls.length, level: 0 };
  const graph = remember(S.store('public/data/proof-atlas/inventory-graph', { format: 'ProofAtlasInventoryGraph/1', scope, source: record.source, owner: record.owner, original, order, counts: record.counts, root: leaf, rowLimit: 512, ordinalOrder: 'producer-call-id,consumer-call-id,input-slot', scopeNote: 'Complete predetermined computational-call inventory; omitted type-expression applications remain outside this inventory.' }));
  graphs.push({ source: record.source, owner: record.owner, original, scope, order, counts: record.counts, graph });
}
const manifest = { format: 'ProofAtlasDependentRegionControls/1', producerSha256, nativeEvidenceSha256, records, graphs };
const manifestFile = 'public/data/proof-atlas/dependent-region-controls-manifest.js';
fs.writeFileSync(manifestFile, 'window.PROOF_ATLAS_DEPENDENT_REGION_CONTROLS = ' + JSON.stringify(manifest) + ';\n');
for (const [file, hash] of Object.entries(before)) assert.equal(S.sha(fs.readFileSync('public/data/proof-atlas/' + file)), hash, file);
const report = { format: 'ProofAtlasDependentRegionPublication/1', status: 'PASS', producerSha256, manifestSha256: S.sha(fs.readFileSync(manifestFile)),
  profiles: 4, calls: 10, ports: 32, typeCatalog, frozenInventories: before, assets: Object.fromEntries([...assets].sort(([a], [b]) => a.localeCompare(b))),
  scope: 'Compiled controls, original native v2 port owners, paged source/type data and exact finite source-use indexes. Earlier manifests remain unchanged. Binding-probe tables are bounded metadata sidecars, distinct from paged recorded type tables.' };
fs.writeFileSync(base + 'publication.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n')));
console.log(JSON.stringify({ status: 'PASS', profiles: 4, calls: 10, ports: 32, assets: assets.size }));
