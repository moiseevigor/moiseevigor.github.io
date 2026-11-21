// Export forks whose complete binder-use inventory consists of immediate clause projections.
'use strict';
const fs=require('node:fs');
const forks=[];
for(const path of process.argv.slice(2)){
 const {edition,jointBranches,records}=JSON.parse(fs.readFileSync(path,'utf8'));
 if(!jointBranches)throw Error('Expected an --all-lambdas census');
 for(const r of records){
  const steps=new Set(r.groups.map(group=>group.steps));
  if(steps.size!==2 || !steps.has('L') || !steps.has('R'))continue;
  forks.push({edition,declaration:r.declaration,digest:r.indexSha256,binder:r.binder,name:r.name,groups:r.groups});
 }
}
console.log('window.PROOF_ATLAS_CLAUSE_FORKS='+JSON.stringify(forks)+';');
