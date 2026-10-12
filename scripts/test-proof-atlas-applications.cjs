'use strict';
// Published Expr.const/Expr.app structure, NOT kernel typing or inference.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=process.env.ATLAS_SITE_ROOT||path.join(__dirname,'..');
const context=vm.createContext({window:{}});
for(const p of ['crossing-structure.js','crossing-terms.js']){
  vm.runInContext(fs.readFileSync(path.join(root,'public/data/proof-atlas',p),'utf8'),context,{filename:p});
}
const structure=context.window.PROOF_ATLAS_DATA,terms=context.window.PROOF_ATLAS_TERMS;
const decode=require(path.join(root,'public/js/proof-atlas-term-reader.js'));
const {create}=require(path.join(root,'public/js/proof-atlas-application-map.js'));
const D=decode.create(structure,terms),A=create(structure,terms,D);
assert(D.complete&&A.valid,'unmodified public proof must have complete exact bridge');
assert.equal(A.count,2892);
assert.equal(A.forDeclaration('CrossingData.exists_branch').length,1);
assert.equal(A.forDeclaration('CrossingData.unique_branch').length,1);
const existence=A.forDeclaration('CrossingData.exists_branch')[0];
const uniqueness=A.forDeclaration('CrossingData.unique_branch')[0];
assert.deepEqual([existence.constant,existence.application,existence.arguments.length,existence.position],[810,808,2,'value']);
assert.deepEqual([uniqueness.constant,uniqueness.application,uniqueness.arguments.length,uniqueness.position],[7273,7259,14,'value']);
assert.equal(A.forApplication(808).constant,810);
assert.equal(A.forApplication(7259).constant,7273);
assert.equal(A.forOccurrence(7273).application,7259);
assert.equal(A.forApplication(7258),null,'Intermediate applications are not maximal applications');
assert.equal(A.forDeclaration('NoInventedTheorem').length,0);
const children=Array.from({length:structure.parent.length},()=>[]);
for(let i=0;i<structure.parent.length;i++)if(structure.parent[i]>=0)children[structure.parent[i]].push(i);
const kind=i=>structure.kinds[Number(structure.kind[i])];
for(let i=0;i<structure.parent.length;i++){
  if(kind(i)!=='const')continue;
  const record=A.forOccurrence(i),args=[];let app=i;
  assert(record,'every published constant must have a record');
  assert.equal(record.name,terms.payloads[i].name);
  while(structure.parent[app]>=0){const parent=structure.parent[app];
    if(kind(parent)!=='app'||children[parent][0]!==app)break;
    args.push(children[parent][1]);app=parent;}
  assert.equal(record.application,app);
  assert.deepEqual(Array.from(record.arguments),args);
  assert.deepEqual(Array.from(D.spine(app).args),args);
  assert(Object.isFrozen(record)&&Object.isFrozen(record.arguments));
}
assert.equal(A.forDeclaration('CrossingData.branch').length,42);
assert.equal(A.forDeclaration('CrossingData.branch').filter(r=>r.position==='type').length,1);
assert.equal(A.forDeclaration('Kernel/library declaration').length,0,'Display categories are not Lean names');
assert.equal(A.forDeclaration('Local helper · lo').length,0,'Display aliases are not Lean names');
assert.equal(A.forApplication(7273),null,'A constant alone is not an application');
let failures=0;
function corrupted(name,change){const s=structuredClone(structure),t=structuredClone(terms);change(s,t);
  assert.equal(create(s,t,D).valid,false,name);failures++;}
corrupted('truncated payloads',(_s,t)=>t.payloads.pop());
corrupted('wrong reference count',(s)=>{s.deps.find(d=>d.name==='CrossingData.unique_branch').count=2;});
corrupted('forged named reference index',(s)=>{s.deps.find(d=>d.name==='CrossingData.unique_branch').uses=[810];});
corrupted('missing indexed reference',(s)=>{let d=s.deps.find(d=>d.name==='Real');d.uses.pop();d.count--;});
corrupted('duplicated reference',(s)=>{let d=s.deps.find(d=>d.name==='And');d.uses.push(d.uses[0]);d.count++;});
corrupted('renamed declaration occurrence',(_s,t)=>{t.payloads[7273].name='CrossingData.notATheorem';});
corrupted('wrong application parent',(s)=>{s.parent[810]=808;});
corrupted('broken root path',(s)=>{s.roots[1]=808;});
corrupted('invalid parent index',(s)=>{s.parent[7273]=7273;});
corrupted('named declaration becomes nonconst',(s)=>{s.kind=s.kind.slice(0,7273)+'0'+s.kind.slice(7274);});
corrupted('local helper display mismatch',(s)=>{s.deps.find(d=>d.name==='Local helper · lo').name='Local helper · psiP';});
corrupted('missing full root',(_s,t)=>{t.rootPaths=[];});
console.log(JSON.stringify({result:'PASS',nodeCount:structure.parent.length,constantOccurrences:A.count,exists:existence,unique:{constant:uniqueness.constant,application:uniqueness.application,arguments:uniqueness.arguments.length},negativeControls:failures},null,2));
