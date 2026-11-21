// Export forks whose complete binder-use inventory includes uses of both sides of a conjunction.
'use strict';
const fs=require('node:fs');
const forks=[];
for(const path of process.argv.slice(2)){
 const {edition,jointBranches,records}=JSON.parse(fs.readFileSync(path,'utf8'));
 if(!jointBranches)throw Error('Expected an --all-lambdas census');
 for(const r of records){
  const steps=new Set(r.groups.map(group=>group.steps));
  if(!['L','R'].every(side=>[...steps].some(step=>step.startsWith(side))))continue;
  if(r.groups.some(g=>1+(g.additional?.length||0)!==g.count))throw Error('Regenerate census with --occurrences');
  forks.push({edition,declaration:r.declaration,digest:r.indexSha256,binder:r.binder,name:r.name,groups:r.groups});
 }
}
console.log('window.PROOF_ATLAS_CLAUSE_FORKS='+JSON.stringify(forks)+';');
