'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const {boundPremise,zeroDifference,logicalInference,arithmeticInference,numeralComparison}=require('../../../public/js/proof-atlas-arithmetic');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const report=fs.readFileSync(0,'utf8').trim().split('\n').map(line=>JSON.parse(line)).find(x=>x.edition===edition.id);
const frontier={},rules={},roots=report.aiArithmetic;
const added=new Set(['mul_eq','add_nonpos','le_of_le_of_eq','sub_nonpos_of_le','sub_neg_of_lt']);
const baseline=process.argv.includes('--baseline');
let uniqueLeaves=0,uniqueSteps=0,certificateVisits=0;const certificates=[],inequalities={};
const signExamples={},signSlots={sub_eq_zero_of_eq:[2,3],mul_nonneg_of_nonpos_of_nonpos:[3,4],mul_pos_of_neg_of_neg:[7,8],sq_nonneg:[6]};
const linarithOnly=baseline||process.argv.includes('--linarith-only');
const arithmeticOnly=linarithOnly||process.argv.includes('--arithmetic-only');
const zeroExamples=[],zeroRows=new Set();let zeroVisits=0;
const equivalenceUses={},logicalExamples={},logicalProofs=new Set();
const folded=process.argv.includes('--fold-zero');
let foldedBranches=0;const zeroProducts={};
const scopes={visits:0,variableRows:0,binderOccurrences:0,ambiguousVariableRows:0,ambiguousInferenceRows:0,examples:[],inferenceExamples:[]};
let fullyRead=0;
let steps=0,leaves=0,maxDepth=0,longest;
for(const d of edition.declarations){
 const selected=roots.filter(r=>r.proof===d.name);
 if(!selected.length)continue;
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d);
 const distinct=new Set(),boundaryRows=new Set(),certRows=new Set();
 const introductions=new Set(),variableRows=new Map(),pathsByRow=new Map(),conflicts=new Set();
 function recordPath(item,depth){
  if(longest && longest.depth>=depth)return;
  const path=[];
  for(let p=item;p;p=p.parent)path.push(p.site);
  longest={proof:d.name,depth,path:path.reverse()};
 }
 for(const {premise} of selected){
  let unresolved=0;
  const todo=[{site:premise,depth:0,parent:null}];
  while(todo.length){
   const item=todo.pop(),{site,depth}=item;
   assert.equal(A.walk(g,site.route),site.node);
   const s=spine(g,site.node),name=g.payloads[s.head]?.name||A.kinds[g.kind[s.head]];
   if(g.kind[site.node]===0){
    const b=boundPremise(g,site);assert(b);
    let index=g.payloads[site.node].index,owner;
    for(let i=site.route.slots.length-1;i>=0;i--){
     const slots=site.route.slots.slice(0,i),root=site.route.root;
     const binderNode=A.walk(g,{root,slots}),kind=g.kind[binderNode],slot=site.route.slots[i];
     if(((kind===6||kind===7)&&slot===1 || kind===8&&slot===2) && index--===0){owner={node:binderNode,route:{root,slots}};break;}
    }
    assert.deepEqual(owner,b.binder);
    const key=b.binder.route.slots.join('.');
    introductions.add(key);scopes.visits++;
    if(!variableRows.has(site.node))variableRows.set(site.node,new Map());
    const owners=variableRows.get(site.node);
    if(!owners.has(key))owners.set(key,{site,binder:b.binder,name:b.name,domain:b.domain});
    for(let parent=item.parent;parent;parent=parent.parent){
     const n=parent.site.node,relative=site.route.slots.slice(parent.site.route.slots.length).join('.');
     if(!pathsByRow.has(n))pathsByRow.set(n,new Map());
     const paths=pathsByRow.get(n);
     const earlier=paths.get(relative);
     if(earlier && earlier.key!==key){
      if(!conflicts.has(n))scopes.inferenceExamples.push({proof:d.name,node:n,relative,
       first:earlier,second:{key,call:parent.site,reference:site,binder:b.binder,name:b.name}});
      conflicts.add(n);
     }else if(!earlier)paths.set(relative,{key,call:parent.site,reference:site,binder:b.binder,name:b.name});
    }
   }
   const cert=numeralComparison(g,site);
   if(cert){
    certificateVisits++;
    const label=cert.values.map(v=>v.text).join(' < ');
    inequalities[label]=(inequalities[label]||0)+1;
    const sites=cert.values.flatMap(v=>[v.literal,v.term,v.proof]).concat(cert.comparison,cert.carrier);
    for(const [i,k] of [7,5,9,8,6,10,11,0].entries()){
     assert.equal(A.walk(g,sites[i].route),s.args[k]);
     assert.deepEqual(sites[i].route.slots,site.route.slots.concat(Array(11-k).fill(0),1));
    }
    if(!certRows.has(site.node)){
     certRows.add(site.node);certificates.push({proof:d.name,site,parent:item.parent.site,label,sites});
     const children=g.children.slice();children[site.node]=[children[site.node][0],s.args[9]];
     assert.equal(numeralComparison({...g,children},site),null);
     const payloads=g.payloads.slice();
     payloads[s.args[8]]={...payloads[s.args[8]],value:cert.values[0].text};
     assert.equal(numeralComparison({...g,payloads},site),null);
    }
   }
   const logical=arithmeticOnly?null:logicalInference(g,site);
   if(logical){
    const zero=zeroDifference(g,logical);
    if(zero){
     zeroVisits++;
     const args=spine(g,logical.proofs[1].node).args;
     const sites=[zero.left,zero.right,zero.equality,zero.difference,logical.propositions[0],zero.equivalence];
     assert.deepEqual(sites.map(x=>A.walk(g,x.route)),[...args.slice(2),s.args[3],s.args[0],s.args[2]]);
     const key=d.name+'/'+site.node;
     if(!zeroRows.has(key)){
      zeroRows.add(key);zeroExamples.push({proof:d.name,site,links:sites});
      assert.equal(zeroDifference(g,{...logical,propositions:logical.propositions.slice().reverse()}),null);
      const parent=A.walk(g,{root:1,slots:zero.left.route.slots.slice(0,-1)});
      const children=g.children.slice();children[parent]=[children[parent][0],s.head];
      assert.equal(zeroDifference({...g,children},logical),null);
     }
    }
    logicalProofs.add(d.name);
    if(!logical.conjunction){
     const sources=logical.proofs.map(p=>{
      const head=spine(g,p.node).head;
      return g.payloads[head]?.name||A.kinds[g.kind[head]];
     }).join(' / ');
     equivalenceUses[sources]=(equivalenceUses[sources]||0)+1;
    }
    const output={ 'Iff.mp':1,'Iff.mpr':0,'And.right':1,'And.left':0 }[name];
    assert.equal(logical.output,output);
    assert.equal(logical.conjunction,s.args.length===3);
    const ports=[...logical.propositions,...logical.proofs];
    assert.equal(ports.length,s.args.length);
    ports.forEach((p,i)=>{
     assert.equal(A.walk(g,p.route),s.args[i]);assert.deepEqual(p.route.slots,site.route.slots.concat(Array(s.args.length-i-1).fill(0),1));
    });
    const partial={node:g.children[site.node][0],route:{root:1,slots:site.route.slots.concat(0)}};
    assert.equal(logicalInference(g,partial),null);
    if(!logicalExamples[name]){
     const displayed=logical.conjunction?[0,1,output,2]:[1-output,output,2,3];
     logicalExamples[name]={proof:d.name,site,links:displayed.map(i=>ports[i])};
    }
   }
   const rule=logical||arithmeticInference(g,site);
   if(!rule || (arithmeticOnly && ['Mathlib.Tactic.Linarith.mul_zero_eq','Mathlib.Tactic.Linarith.zero_mul_eq'].includes(name)) || (arithmeticOnly && name==='sub_eq_zero_of_eq') || (linarithOnly && Object.hasOwn(signSlots,name)) || (baseline && added.has(rule.name.split('.').at(-1)))){frontier[name]=(frontier[name]||0)+1;leaves++;boundaryRows.add(site.node);
    if(!cert)unresolved++;
    recordPath(item,depth);
    continue;}
   if(Object.hasOwn(signSlots,name)){
    for(const [i,k] of signSlots[name].entries()){
     const term=rule.terms[i];
     assert.equal(A.walk(g,term.route),s.args[k]);
     assert.deepEqual(term.route.slots,site.route.slots.concat(Array(s.args.length-1-k).fill(0),1));
    }
    assert.equal(arithmeticInference(g,{node:g.children[site.node][0],route:{root:1,slots:site.route.slots.concat(0)}}),null);
    if(!signExamples[name])signExamples[name]={proof:d.name,site,links:[...rule.proofs,...rule.terms],conclusion:rule.conclusion};
   }
   if(rule.extra!=null){
    const k=rule.name.endsWith('.mul_zero_eq')?0:1;
    assert.equal(rule.extra,k);
    if(rule.relation){
     assert.equal(A.walk(g,rule.relation.route),s.args[1]);
     assert.deepEqual(rule.terms.map(v=>v.node),s.args.slice(3,5));
    }
    if(!zeroProducts[name])zeroProducts[name]={proof:d.name,site,primary:rule.proofs[1-k],terms:rule.terms,extra:rule.proofs[k],relation:rule.relation};
   }
   if(!rule.proofs.length)recordPath(item,depth+1);
   distinct.add(site.node);
   rules[name]=(rules[name]||0)+1;steps++;maxDepth=Math.max(maxDepth,depth+1);
   rule.proofs.forEach((child,i)=>{
    const offset=rule.proofs.length-i;
    assert.deepEqual(child.route.slots,site.route.slots.concat(Array(offset-1).fill(0),1));
    assert.equal(child.node,s.args.at(-offset));
    if(folded && i===rule.extra){foldedBranches++;return;}
    todo.push({site:child,depth:depth+1,parent:item});
   });
  }
  if(!unresolved)fullyRead++;
 }
 scopes.binderOccurrences+=introductions.size;scopes.variableRows+=variableRows.size;
 scopes.ambiguousInferenceRows+=conflicts.size;
 for(const [node,owners] of variableRows){
  if(owners.size<2)continue;
  scopes.ambiguousVariableRows++;
  scopes.examples.push({proof:d.name,node,owners:[...owners.values()]});
 }
 uniqueSteps+=distinct.size;uniqueLeaves+=boundaryRows.size;
}
assert.equal(longest.depth,maxDepth);
assert.equal(certificateVisits,frontier['Mathlib.Meta.NormNum.isNat_lt_true']);
if(linarithOnly && !baseline)assert.equal(certificates.length,272);
console.log(JSON.stringify({scopes,uniqueLeaves,foldedBranches,zeroProducts,zeroVisits,zeroExamples,fullyRead,equivalenceUses,logicalExamples,logicalProofs:logicalProofs.size,signExamples,certificateVisits,certificates,inequalities,uniqueSteps,roots:roots.length,steps,leaves,maxDepth,rules,frontier,longest},null,2));
