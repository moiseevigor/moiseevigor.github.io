/* Combine native query batches only when their contextual core judgments agree. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),S=require('./share_type_graphs.cjs');
const key=e=>e.route.root+':'+e.route.slots.join('.');
function merge(base,patch){
 const result=structuredClone(base),seen=new Set();for(const update of patch){assert.equal(update.format,'ProofAtlasOccurrenceTypes/1');const record=result.find(r=>r.name===update.name&&r.source.edition===update.source.edition);assert(record,'Patch outside original query inventory');const head=r=>{const h={...r};delete h.entries;return h;};assert.deepEqual(head(record),head(update),'Native environment or packet changed');
  for(const next of update.entries){const k=record.name+':'+key(next);assert(!seen.has(k),'Duplicate update route');seen.add(k);const j=record.entries.findIndex(e=>key(e)===key(next));assert(j>=0,'Update outside original occurrence queries');const old=record.entries[j];assert.equal(old.status,'checked');assert.equal(old.applicationJudgment?.status,'unavailable');assert.equal(next.applicationJudgment?.status,'checked');
   const core=e=>{const copy={...e};delete copy.applicationJudgment;return{...head(record),entries:[copy]};};assert.equal(S.judgmentsDigest(core(old)),S.judgmentsDigest(core(next)),'Native core type, role, route or context changed');record.entries[j]=structuredClone(next);
  }
 }return result;
}
function enrichLambdas(base,patch){
 const result=structuredClone(base),seen=new Set();for(const update of patch){const record=result.find(r=>r.name===update.name&&r.source.edition===update.source.edition);assert(record);const header=r=>{const h={...r};delete h.entries;return h;};assert.deepEqual(header(record),header(update),'Native environment or packet changed');
  for(const next of update.entries){const k=record.name+':'+key(next);assert(!seen.has(k),'Duplicate lambda route');seen.add(k);assert.equal(next.status,'checked');assert.equal(next.lambdaJudgment?.status,'checked');assert.equal(next.arguments.length,0);const j=record.entries.findIndex(e=>key(e)===key(next));if(j<0)record.entries.push(structuredClone(next));else{const core=e=>{const copy={...e};delete copy.lambdaJudgment;return{...header(record),entries:[copy]};};assert.equal(S.judgmentsDigest(core(record.entries[j])),S.judgmentsDigest(core(next)),'Existing core judgment changed');record.entries[j]=structuredClone(next);}assert(record.entries.length<=512,'Query inventory exceeds bound');}
 }return result;
}
if(require.main===module){const args=process.argv.slice(2),lambda=args[0]==='--lambdas';if(lambda)args.shift();const [base,patch,output]=args;assert(output,'Usage: merge_occurrence_types.cjs [--lambdas] BASE PATCH OUTPUT');assert(!fs.existsSync(output),'Do not overwrite extraction evidence');fs.writeFileSync(output,JSON.stringify((lambda?enrichLambdas:merge)(JSON.parse(fs.readFileSync(base)),JSON.parse(fs.readFileSync(patch))))+'\n');}
module.exports={merge,enrichLambdas};
