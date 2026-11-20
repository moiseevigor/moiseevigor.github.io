'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const pages=require('../../../public/js/proof-atlas-source-pages'),ordinal=require('./paged.cjs');
const maxima=require('./results.json').maxima, w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window:w});
async function main() {
  const results=[];
  for (const [edition,example] of Object.entries(maxima)) {
    const {record}=inventory().find(x=>x.edition===edition && x.record.indexSha256===example.packet);
    const descriptor=w.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===edition && d.name===record.name);
    const base=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1);
    const cursor=await pages.open(descriptor,record,{pageLimit:2,indexLimit:1,fetcher:async file=>{
      assert(file.startsWith(base));assert.notEqual(file,record.indexFile);
      return new Response(fs.readFileSync('.'+file));
    }});
    try {
      const index=await ordinal.open(cursor,example.binder);
      assert.equal(index.source.indexSha256,example.packet);
      assert.equal(index.total.toString(),example.total);
      const build=cursor.state();
      const use=await index.select(BigInt(example.middle.ordinal));
      assert.deepEqual(use,example.middle.use);
      const end=cursor.state();
      assert.equal(await index.rank(use.route),BigInt(example.middle.ordinal));
      const afterRank=cursor.state();
      await assert.rejects(index.select(0n),RangeError);
      await assert.rejects(index.select(index.total+1n),RangeError);
      await assert.rejects(index.rank(example.binder),/Outside binder body/);
      assert(end.peakCachedNodes<=512 && end.indexPages<=1);
      results.push({edition,name:record.name,packet:example.packet,total:example.total,
        middle:example.middle.ordinal,scheduled:index.scheduled,evaluated:index.evaluated,
        peakCells:index.peakCells,peakDigits:index.peakDigits,buildPageLoads:build.pageLoads,
        selectionPageLoads:end.pageLoads-build.pageLoads,rankPageLoads:afterRank.pageLoads-end.pageLoads,peakSourceRows:afterRank.peakCachedNodes,
        peakCachedDecodedBytes:afterRank.peakCachedDecodedBytes});
    } finally {cursor.dispose();}
  }
  console.log(JSON.stringify(results,null,2));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
