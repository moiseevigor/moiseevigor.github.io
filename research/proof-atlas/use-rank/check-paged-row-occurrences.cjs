'use strict';
const fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const pages=require('../../../public/js/proof-atlas-source-pages');
const paged=require('./paged-row-occurrences.cjs'),complete=require('../../../public/js/proof-atlas-row-occurrences');
const window={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
(async()=>{
 const results=[];
 const fixtures=require('./shared-application-contexts.json').slice();
 const control=inventory().find(i=>i.record.name==='AtlasExamples.shared_induction_64');
 fixtures.push({source:{name:control.record.name,edition:control.edition,indexSha256:control.record.indexSha256},
   witness:{row:3,left:[...Array(65).fill(1),0,1,1,0,0,0]}});
 for(const item of fixtures){
  const {source}=item,w=item.middleWitness??item.witness,route={root:1,slots:w.first??w.left};
  const {record}=inventory().find(i=>i.record.indexSha256===source.indexSha256);
  const desc=window.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.edition===source.edition&&d.name===source.name);
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.indexSha256);
  const baseline=complete.index(JSON.parse(bytes),w.row,route);
  const base=desc.file.slice(0,desc.file.lastIndexOf('/')+1);
  let requests=0,compressedBytes=0;
  const cursor=await pages.open(desc,record,{pageLimit:2,indexLimit:2,fetcher:async file=>{
   assert(file.startsWith(base)&&file!==record.indexFile);const b=fs.readFileSync('.'+file);
   requests++;compressedBytes+=b.length;return new Response(b);
  }});
  try{
   const index=await paged.open(cursor,1,w.row);
   const build=requests;
   assert.equal(index.source.indexSha256,source.indexSha256);
   assert.equal(index.total,baseline.total);
   const ordinals=index.total<=1000n ? Array.from({length:Number(index.total)},(_,i)=>BigInt(i+1)) :
    [1n,2n,2n**53n-1n,2n**53n,2n**53n+1n,index.total/2n,index.total-1n,index.total];
   for(const n of ordinals){
    const expected=baseline.select(n);
    assert.deepEqual(index.select(n),expected);
    assert.equal(index.rank(expected),n);
   }
   assert.equal(requests,build);assert.throws(()=>index.select(0n),RangeError);
   assert.throws(()=>index.rank({root:1,slots:[]}),RangeError);
   const state=cursor.state();assert(state.peakCachedNodes<=512 && state.indexPages<=2);
   results.push({source:source.indexSha256,name:source.name,row:w.row,total:String(index.total),ordinalsChecked:ordinals.length,
    retainedRows:index.retained,childSlots:index.edges,countDigits:index.digits,peakSourceRows:state.peakCachedNodes,
    sourcePageLoads:state.pageLoads,indexLoads:state.indexLoads,requests,compressedBytes,completePacketBytes:fs.statSync('.'+record.indexFile).size});
  }finally{cursor.dispose();}
 }
 console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
