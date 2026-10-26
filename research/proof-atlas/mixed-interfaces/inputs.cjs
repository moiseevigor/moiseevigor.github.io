/* Explicit local inputs for the prospective mixed-interface experiments. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),path=require('path');
const repo=path.resolve(__dirname,'../../..');
const get=n=>require(path.join(repo,'public/js/proof-atlas-'+n));
const T=get('deep-context');
const producer=require(path.join(repo,'research/proof-atlas/construction-pages/captions.cjs')),controls=require(path.join(repo,'research/proof-atlas/local-definitions/control-pages.cjs'));
const h = {};
for (const n of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','source-pages-manifest','construction-pages-manifest']) vm.runInNewContext(fs.readFileSync(path.join(repo,'public/data/proof-atlas/' + n + '.js'),'utf8'),{window:h});
const {library,types} = get('ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
const raw = f => z.gunzipSync(fs.readFileSync(path.join(repo,f.slice(1))),{maxOutputLength:67108864});
async function* cases() {
  for (const d of types.records) {
    const record = library.editions.find(e => e.id === d.edition).declarations.find(r => r.name === d.name), b = raw(record.indexFile); let pkg = await T.recorded(b,raw(d.file),d,record);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === d.name && x.edition === d.edition && x.indexSha256 === record.indexSha256); if (ld) pkg = T.mergeRecorded(pkg,await T.recordedLets(b,raw(ld.file),ld,record));
    const c = pkg.case(record.name); yield {record,c,captions:producer.open(c,e => raw(e.evidenceFile)),edition:d.edition,core:false,
      sd:h.PROOF_ATLAS_SOURCE_PAGES.records.find(x => x.edition === d.edition && x.name === d.name),qd:h.PROOF_ATLAS_CONSTRUCTION_PAGES.records.find(x => x.edition === d.edition && x.name === d.name),fetcher:async file => {assert(['/public/data/proof-atlas/source-pages/','/public/data/proof-atlas/construction-pages/','/public/data/proof-atlas/type-pages/'].some(p => file.startsWith(p)),'Complete archive request: ' + file); return new Response(fs.readFileSync(path.join(repo,file.slice(1))));}};
  }
  for await (const x of controls.cases()) yield {...x,core:true,...await controls.pages(x)};
}
module.exports={cases};
