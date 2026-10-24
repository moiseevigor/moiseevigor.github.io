/* Compare every paged unit/frame with its complete original native-record model. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), assert = require('assert/strict');
const T = require('../public/js/proof-atlas-deep-context'), U = require('../public/js/proof-atlas-local-definition-unit'), F = require('../public/js/proof-atlas-local-definition-frame');
const M = require('../public/js/proof-atlas-cursor-local-definitions'), SP = require('../public/js/proof-atlas-source-pages'), Q = require('../public/js/proof-atlas-construction-pages');
const producer = require('../research/proof-atlas/construction-pages/captions.cjs'), controls = require('../research/proof-atlas/local-definitions/control-pages.cjs');
const h = {};
for (const n of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','source-pages-manifest','construction-pages-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '.js','utf8'),{window:h});
const {library,types} = require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
const raw = f => z.gunzipSync(fs.readFileSync('.' + f),{maxOutputLength:67108864});
async function* cases() {
  for (const d of types.records) {
    const record = library.editions.find(e => e.id === d.edition).declarations.find(r => r.name === d.name), b = raw(record.indexFile); let pkg = await T.recorded(b,raw(d.file),d,record);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === d.name && x.edition === d.edition && x.indexSha256 === record.indexSha256); if (ld) pkg = T.mergeRecorded(pkg,await T.recordedLets(b,raw(ld.file),ld,record));
    const c = pkg.case(record.name); yield {record,c,captions:producer.open(c,e => raw(e.evidenceFile)),edition:d.edition,core:false,
      sd:h.PROOF_ATLAS_SOURCE_PAGES.records.find(x => x.edition === d.edition && x.name === d.name),qd:h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(x => x.edition === d.edition && x.name === d.name),fetcher:async file => {assert(['/public/data/proof-atlas/source-pages/','/public/data/proof-atlas/construction-pages/','/public/data/proof-atlas/type-pages/'].some(p => file.startsWith(p)),'Complete archive request: ' + file); return new Response(fs.readFileSync('.' + file));}};
  }
  for await (const x of controls.cases()) yield {...x,core:true,...await controls.pages(x)};
}
(async () => {
  const out = {status:'RUNNING',corpusProfiles:0,coreProfiles:0,corpusStarts:0,coreStarts:0,units:0,frames:0,joins:0,typeSelections:0,originPairs:0,refusals:0,peakSourceNodes:0,peakTypeNodes:0,peakFrameBytes:0,conditionalReleases:0,completeArchiveRequests:0,rows:[]};
  for await (const x of cases()) {
    if (process.env.ATLAS_DEFINITION_CASE && x.record.name !== process.env.ATLAS_DEFINITION_CASE) continue;
    const entries = x.c.entries.filter(e => T.construction(e,x.c.data)?.rule === 'let-binding');
    if (!entries.length) {out[x.core ? 'coreProfiles' : 'corpusProfiles']++; continue;}
    const s = await SP.open(x.sd,x.record,{fetcher:x.fetcher,pageLimit:1,indexLimit:1}), q = await Q.open(x.qd,x.record,{fetcher:x.fetcher,indexLimit:1,recordLimit:1});
    const m = M.open(s,q,x.record,x.edition), full = F.open(x.c,x.captions,x.edition), one = U.open(x.c,x.captions,x.edition); let last;
    try {
      for (const e of entries) {
        out[x.core ? 'coreStarts' : 'corpusStarts']++;
        for (const shareTypes of [false,true]) {const u = await m.createUnit(e.route,{shareTypes}); assert.deepEqual(u,await one.create(e,{shareTypes})); assert.equal(q.state().activeTypeTables,0); out.units++;}
        for (const maxUnits of [1,4,8]) {
          const v = await m.create(e.route,{maxUnits}); assert.deepEqual(v,await full.create(e.route,{maxUnits})); assert.equal(q.state().activeTypeTables,0); last = v;
          out.frames++; out.joins += v.joins.length; out.peakFrameBytes = Math.max(out.peakFrameBytes,Buffer.byteLength(JSON.stringify(v)));
          if (maxUnits !== 8) continue;
          for (const [i,u] of v.units.entries()) for (const field of ['conclusion','type','value','body','binding']) {
            const route = m.resolve(v,{unit:i,field}); assert.deepEqual(route,field === 'type' ? u.ports.declared.route : ['conclusion','binding'].includes(field) ? u.root.route : u[field].route);
          }
          // Every start checks all four independently recorded components in its first unit.
          for (const [field,id] of [['conclusion','conclusionType'],['value','valueType'],['body','bodyType'],['type',null]]) {
            const session = await m.typeFor(v,{unit:0,field},'kernel',{pageLimit:1}), root = id ? v.units[0].ports[id].root : T.construction(e,x.c.data).premises[0].typeRoot;
            assert.equal(session.observation.root,root); assert.equal(session.observation.origin.recording.field,field); out.typeSelections++; q.releaseType(session.cursor);
          }
          for (const j of v.joins) {assert.deepEqual(j.parentPort.sourceAnchor,j.childPort.sourceAnchor); assert.notEqual(j.parentPort.caption.origin.originKey,j.childPort.caption.origin.originKey); out.originPairs++;}
        }
      }
      assert(await m.validate(JSON.parse(JSON.stringify(last))));
      for (const change of [v => v.units[0].binding.to--,v => v.joins.length ? v.joins[0].childPort = v.joins[0].parentPort : v.units[0].ports.bodyType.context.length--,v => v.source.indexSha256 = '0'.repeat(64),v => v.sourcePartition.hidden = '0']) {const bad = structuredClone(last); change(bad); await assert.rejects(() => m.validate(bad)); out.refusals++;}
      for (const address of [{unit:-1},{unit:last.units.length},{unit:0,field:'invented'}]) {assert.throws(() => m.resolve(last,address)); out.refusals++;}
      assert.throws(() => m.resolve(structuredClone(last),{unit:0})); out.refusals++;
      for (const maxUnits of [0,9,1.5]) {await assert.rejects(() => m.create(last.root.route,{maxUnits})); out.refusals++;}
      const aborted = new AbortController(); aborted.abort(Error('cancelled frame')); await assert.rejects(() => m.create(last.root.route,{signal:aborted.signal})); out.refusals++;
      await assert.rejects(() => m.typeFor(last,{unit:0,field:'binding'})); out.refusals++;
      // An obsolete operation must not release another selection's active cursor.
      const row = await q.lookup(last.units[0].root.route), a = await q.typeFor(row,'conclusion','kernel',{pageLimit:1}), b = await q.typeFor(row,'body','kernel',{pageLimit:1});
      assert.equal(q.releaseType(a.cursor),false); assert.equal(q.state().activeTypeTables,1); assert.equal(b.cursor.table(b.observation).data.roots[0],b.observation.root); assert.equal(q.releaseType(b.cursor),true); assert.equal(q.state().activeTypeTables,0); out.conditionalReleases++;
      out.peakSourceNodes = Math.max(out.peakSourceNodes,s.state().peakCachedNodes); out.peakTypeNodes = Math.max(out.peakTypeNodes,m.state().peakTypeNodes);
      assert(s.state().cachedNodes <= 256 && q.state().indexPages <= 1 && q.state().recordPages <= 1 && m.state().peakTypeNodes <= 64);
      out[x.core ? 'coreProfiles' : 'corpusProfiles']++;
      out.rows.push({name:x.record.name,edition:x.edition,starts:entries.length,source:s.state(),query:q.state(),model:m.state()}); console.log(JSON.stringify({name:x.record.name,starts:entries.length,frames:out.frames}));
    } finally {q.dispose(); s.dispose(); assert.equal(q.state().activeTypeTables,0); assert.equal(s.state().cachedNodes,0); if (last) {assert.throws(() => m.resolve(last,{unit:0})); await assert.rejects(() => m.create(last.root.route));}}
  }
  if (!process.env.ATLAS_DEFINITION_CASE) {assert.equal(out.corpusProfiles,26); assert.equal(out.coreProfiles,25); assert.equal(out.corpusStarts,60); assert.equal(out.coreStarts,34); assert.equal(out.units,188); assert.equal(out.frames,282);}
  out.status = 'PASS'; out.scope = 'Exact paged/complete model comparison for finite recorded local definitions, including original A vs inferred type B comparisons via single-row source/type reads. One-page source/native/index/type caches. No full archive fallback, new native judgments or whole-browser memory/comprehension claim.';
  fs.writeFileSync(process.env.ATLAS_CURSOR_DEFINITION_REPORT || '/tmp/atlas-cursor-local-definitions.json',JSON.stringify(out,null,2) + '\n'); console.log(JSON.stringify({...out,rows:undefined}));
})().catch(e => {console.error(e.stack); process.exit(1);});
