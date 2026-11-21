'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const notation=require('../../../public/js/proof-atlas-type-notation');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const declaredDomain=require('./declared-domain.cjs');
const window={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window});

function formula(term,data){
 const parts=term.children.map(c=>formula(c.value,data));
 if(term.form==='binary')return '('+parts.join(' '+term.label+' ')+')';
 if(term.form==='prefix')return term.label+'('+parts.join(', ')+')';
 if(term.form==='absolute')return '|'+parts[0]+'|';
 if(term.form==='forall' && data.neededScope[data.children[term.origin.node][1]]===0)
  return '('+parts[0]+' → '+parts[1]+')';
 if(term.form==='lambda')return '(λ '+term.label+' ∶ '+parts[0]+', '+parts[1]+')';
 if(term.form==='let')return '(let '+term.label+' ∶ '+parts[0]+' := '+parts[1]+' in '+parts[2]+')';
 if(term.form==='forall')return '(∀ '+term.label+' ∶ '+parts[0]+', '+parts[1]+')';
 if(term.kind==='application'||term.form==='application'){
  const head=term.children[0]?.field==='head'?parts.shift():term.label;
  return parts.length?head+'('+parts.join(', ')+')':head;
 }
 if(parts.length)return term.label+'('+parts.join(', ')+')';
 return term.label;
}
module.exports=function sharedDomain(data,binder){
 const {domain,references,statement}=declaredDomain(data,binder);
 const address=(node,slots)=>({namespace:'source',node,route:{root:domain.route.root,slots}});
 const ctx=context(data,domain.route).binders.map(b=>({name:data.payloads[b.node].binderName??data.payloads[b.node].declName,address:address(b.node,b.route.slots)}));
 const scene=notation.scene(data,domain.node,window.PROOF_ATLAS_TYPE_NOTATION,{context:ctx,slots:domain.route.slots,address});
 assert.equal(atlas.walk(data,domain.route),scene.root.origin.node);
 return {domain,statement,formula:formula(scene.root,data),references:references?.map(r=>({name:r.name,binder:r.binder,use:r.use}))??null};
};
