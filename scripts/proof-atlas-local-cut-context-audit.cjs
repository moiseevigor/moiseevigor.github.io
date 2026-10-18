'use strict';
const assert=require('assert/strict');
const arities={bvar:0,fvar:0,mvar:0,sort:0,const:0,app:2,lam:2,forallE:2,letE:3,lit:0,mdata:1,proj:1};
const contexts={'root':[], 'app.fn':[0], 'app.arg':[1], 'lam.binderType':[0], 'lam.body':[1], 'forallE.binderType':[0], 'forallE.body':[1], 'letE.type':[0], 'letE.value':[1], 'letE.body':[2], 'mdata.expr':[0], 'proj.struct':[0], 'nested.shadowed-body':[1,2]};
const laws=['plug_refines','fill_refines','retained_plug','hidden_plug','fill_visible','fill_exact_transfer','visible_inside','visible_outside','plug_compose','focus_compose'];
const same=(a,b)=>assert.deepEqual(a,b),key=p=>p.join('.');
function sourceSize(source,depth=0,counter={nodes:0}){
 assert(source&&typeof source==='object'&&Object.hasOwn(arities,source.kind));
 same(Object.keys(source).sort(),['children','kind','payload']);
 assert(depth<=32&&++counter.nodes<=4096);assert(JSON.stringify(source.payload).length<=4096);
 assert(Array.isArray(source.children)&&source.children.length===arities[source.kind]);
 return 1+source.children.reduce((n,c)=>n+sourceSize(c,depth+1,counter),0);
}
function at(tree,path){let current=tree;for(const slot of path){assert(current.kind!=='hole');assert(Number.isInteger(slot)&&slot>=0&&slot<current.children.length);current=current.children[slot];}return current;}
function paths(source,prefix=[]){return[prefix,...source.children.flatMap((child,i)=>paths(child,[...prefix,i]))];}
function partition(cut,source){
 if(cut.kind==='hole'){same(Object.keys(cut).sort(),['kind','source']);same(cut.source,source);return{retained:0,hidden:sourceSize(source)};}
 same(Object.keys(cut).sort(),['children','kind','payload']);same(cut.kind,source.kind);same(cut.payload,source.payload);assert.equal(cut.children.length,source.children.length);
 const children=cut.children.map((c,i)=>partition(c,source.children[i]));
 return{retained:1+children.reduce((n,c)=>n+c.retained,0),hidden:children.reduce((n,c)=>n+c.hidden,0)};
}
function visible(cut,path){if(cut.kind==='hole')return false;if(!path.length)return true;return path[0]<cut.children.length&&visible(cut.children[path[0]],path.slice(1));}
function below(parent,path){return parent.length<=path.length&&parent.every((slot,i)=>slot===path[i]);}
function prune(source,depth){return depth===0?{kind:'hole',source}:{kind:source.kind,payload:source.payload,children:source.children.map(c=>prune(c,depth-1))};}
function replace(cut,path,replacement){
 if(!path.length){assert.equal(cut.kind,'hole');return replacement;}
 assert.notEqual(cut.kind,'hole');assert(path[0]<cut.children.length);
 return{...cut,children:cut.children.map((c,i)=>i===path[0]?replace(c,path.slice(1),replacement):c)};
}
function audit(data){
 assert.equal(data.format,'ProofAtlasLocalCutContext/1');assert.equal(data.leanVersion,'4.33.1');assert.equal(data.theorems.length,laws.length);
 for(const [i,t]of data.theorems.entries()){
  assert.equal(t.name,'ProofAtlas.SourceCut.Local.'+laws[i]);assert(typeof t.type==='string'&&t.type.length>20);
  assert(Array.isArray(t.axioms)&&new Set(t.axioms).size===t.axioms.length&&t.axioms.every(a=>['propext','Quot.sound'].includes(a)));
  for(const field of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(t[field],'PASS');
 }
 assert.equal(data.cases.length,156);const labels=new Set();let replacements=0,outsideChecks=0,insideChecks=0;
 for(const c of data.cases){
  assert.equal(c.proofTypingClaim,false);assert(!labels.has(c.label));labels.add(c.label);
  const [focusKind,context]=c.label.split('/');assert(Object.hasOwn(arities,focusKind)&&Object.hasOwn(contexts,context));same(c.focus,contexts[context]);
  const size=sourceSize(c.source),allPaths=paths(c.source),target=at(c.source,c.focus);assert.equal(target.kind,focusKind);
  if(context!=='root')assert.equal(c.source.kind,context==='nested.shadowed-body'?'lam':context.split('.')[0]);
  const before=partition(c.before,c.source);assert.equal(at(c.before,c.focus).kind,'hole');
  assert.equal(c.occurrences,size);assert.equal(c.initialRetained,before.retained);assert.equal(c.initialHidden,before.hidden);assert.equal(before.retained+before.hidden,size);assert.equal(c.rows.length,4);
  for(const [depth,row]of c.rows.entries()){
   assert.equal(row.depth,depth);same(row.replacement,prune(target,depth));same(row.after,replace(c.before,c.focus,row.replacement));
   const after=partition(row.after,c.source),replacement=partition(row.replacement,target);
   assert.equal(row.retained,after.retained);assert.equal(row.hidden,after.hidden);assert.equal(row.replacementRetained,replacement.retained);
   assert.equal(after.retained,before.retained+replacement.retained);assert.equal(after.hidden,before.hidden-sourceSize(target)+replacement.hidden);assert.equal(after.retained+after.hidden,size);
   assert.equal(row.visibility.length,allPaths.length);
   for(const [i,observation]of row.visibility.entries()){
    const path=allPaths[i],inside=below(c.focus,path);same(observation.path,path);assert.equal(observation.inside,inside);assert.equal(observation.before,visible(c.before,path));assert.equal(observation.after,visible(row.after,path));
    if(inside){assert.equal(observation.after,visible(row.replacement,path.slice(c.focus.length)));insideChecks++;}
    else{assert.equal(observation.before,observation.after);outsideChecks++;}
   }
   replacements++;
  }
 }
 for(const kind of Object.keys(arities))for(const context of Object.keys(contexts))assert(labels.has(kind+'/'+context));
 return{status:'PASS',kernelCheckedLaws:10,focusKinds:12,structuralChildPositions:11,contexts:13,cases:156,replacements,insideChecks,outsideChecks,exactSourcePayloadsAndSiblingCuts:true,scope:'Small serialized locality/composition fixtures. No JavaScript proof, source typing, lexical-link or comprehension claim.'};
}
module.exports=audit;
