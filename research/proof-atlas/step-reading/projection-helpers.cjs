// Reduce the --all-lambdas --follow-helpers report to one entry per helper.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const report=JSON.parse(fs.readFileSync(0,'utf8')),helpers=new Map();
for(const transfer of report.helperTransfers){
 const entry={edition:report.edition,name:transfer.callee,digest:transfer.calleeDigest,
  arity:transfer.returned.path.length,slot:transfer.slot,clause:transfer.clause,
  parameter:transfer.parameter.node,result:transfer.returned.node};
 const previous=helpers.get(entry.name);
 if(previous)assert.deepEqual(entry,previous);
 helpers.set(entry.name,entry);
}
console.log('window.PROOF_ATLAS_PROJECTION_HELPERS='+JSON.stringify([...helpers.values()],null,2)+';');
