/* In-memory page fixtures from already recorded owned core controls. No native replay. */
'use strict';
const fs = require('fs'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data');
const T = require('../../../public/js/proof-atlas-deep-context');
const CP = require('../construction-pages/pack.cjs'), captions = require('../construction-pages/captions.cjs');
const bytes = v => Buffer.from(JSON.stringify(v)), sha = b => crypto.createHash('sha256').update(b).digest('hex');
const folder = 'research/proof-atlas/local-definitions/fixtures';
async function* cases() {
  const inventory = JSON.parse(fs.readFileSync(folder + '/index.json'));
  const raw = file => {const d = inventory.files[file]; assert(d); assert(/^[a-f0-9]{64}\.json\.gz$/.test(d.file)); const b = fs.readFileSync(folder + '/files/' + d.file); assert.equal(b.length,d.bytes); assert.equal(sha(b),d.sha256); return z.gunzipSync(b,{maxOutputLength:67108864});};
  for (const {record,descriptor} of inventory.registry) {
    const sourceBytes = raw(record.indexFile), pkg = await T.recordedLets(sourceBytes,raw(descriptor.file),descriptor,record), c = pkg.case(record.name), adapter = captions.open(c,e => raw(e.evidenceFile));
    yield {record,c,captions:adapter,sourceBytes,edition:'local-definition-controls'};
  }
}
async function pages(x) {
  const c = x.c, record = x.record, data = A.validateIndex(JSON.parse(x.sourceBytes),record), files = new Map(), fields = ['kind','children','payloads','expanded','neededScope'];
  const header = {...data}; for (const field of fields) delete header[field];
  const base = '/public/data/proof-atlas/source-pages/' + record.indexSha256 + '/';
  function put(value, suffix) {const b = bytes(value), hash = sha(b), file = base + hash + suffix; files.set(file,b); return {sha256:hash,file};}
  let leaves = [];
  for (let start = 0; start < data.kind.length; start += 256) {
    const nodes = []; for (let i = start; i < Math.min(start + 256,data.kind.length); i++) nodes.push(fields.map(f => data[f][i]));
    leaves.push(put({format:'ProofAtlasSourcePage/1',indexSha256:record.indexSha256,start,nodes},'.gz').sha256);
  }
  const pageCount = leaves.length; let level = 0, span = 1;
  while (true) {const next = []; for (let i = 0; i < leaves.length; i += 64) next.push(put({format:'ProofAtlasSourceIndex/1',level,first:i * span,children:leaves.slice(i,i + 64)},'.json.gz').sha256); if (next.length === 1) {leaves = next; break;} leaves = next; level++; span *= 64;}
  const manifest = {format:'ProofAtlasSourcePages/1',record,descriptors:[],header,nodeCount:data.kind.length,pageCount,pageSize:256,fanout:64,indexLevel:level,indexRoot:leaves[0],originalIndexSha256:record.indexSha256,normalizedSourceSha256:sha(bytes(data)),producerSha256:sha(fs.readFileSync(__filename)),validatorSha256:sha(fs.readFileSync('public/js/proof-atlas-library-data.js'))};
  const sd = {...put(manifest,'.json.gz'),name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,nodes:data.kind.length,pages:pageCount};
  const packed = await CP.pack(c,{captions:x.captions}); for (const [file,b] of packed.files) files.set(file,b);
  return {sd,qd:packed.descriptor,files,fetcher:async file => {assert(files.has(file),'Unexpected fixture request: ' + file); return new Response(z.gzipSync(files.get(file)));}};
}
module.exports = {cases,pages};
