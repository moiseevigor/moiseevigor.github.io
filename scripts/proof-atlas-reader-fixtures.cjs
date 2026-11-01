/* Current reader fixtures use the sealed recorded union. Historical experiment
   inputs and their native evidence remain unchanged. Sparse variable-use pages
   retain their historical package owners through recordedUseCase. */
'use strict';
const assert=require('assert/strict');
const legacy=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
const union=require('../research/proof-atlas/recorded-union.cjs');
const captions=require('../research/proof-atlas/construction-pages/captions.cjs');
async function* cases(){
 const inventory=union.inventory();
 for await(const original of legacy.cases()){
  if(original.core){yield original;continue;}
  const item=inventory.find(x=>x.edition===original.edition&&x.record.name===original.record.name&&x.record.indexSha256===original.record.indexSha256&&x.record.sourceSha256===original.record.sourceSha256);
  assert(item,'Current reader source union unavailable');
  const {case:c}=await union.open(item);
  yield {...original,record:item.record,c,recordedUseCase:original.c,captions:captions.open(c,e=>union.raw(e.evidenceFile))};
 }
}
module.exports={cases};
