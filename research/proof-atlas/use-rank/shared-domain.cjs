'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const notation=require('../../../public/js/proof-atlas-type-notation');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const declaredDomain=require('./declared-domain.cjs');
const window={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window});

function formula(term,data){
 if(term.kind==='reference'){
  const {node,route}=term.origin,binder=atlas.binding(data,route);
  const expected=term.head.target.address??term.head.target.origin;
  assert.equal(binder.node,expected.node);assert.deepEqual(binder.route,expected.route);
  return [{label:term.label,use:{node,route},binder}];
 }
 const introduction={label:term.label,introduction:{node:term.origin.node,route:term.origin.route}};
 const parts=term.children.map(c=>formula(c.value,data));
 const join=(items,sep)=>items.flatMap((part,i)=>i?[sep,...part]:part);
 if(term.form==='binary')return ['(',...join(parts,' '+term.label+' '),')'];
 if(term.form==='absolute')return ['|',...parts[0],'|'];
 if(term.form==='forall' && data.neededScope[data.children[term.origin.node][1]]===0)
  return ['(',...parts[0],' → ',...parts[1],')'];
 if(term.form==='lambda'||term.form==='forall')
  return [term.form==='lambda'?'(λ ':'(∀ ',introduction,' ∶ ',...parts[0],', ',...parts[1],')'];
 if(term.form==='let')return ['(let ',introduction,' ∶ ',...parts[0],' := ',...parts[1],' in ',...parts[2],')'];
 const head=term.children[0]?.field==='head'?parts.shift():[term.label];
 return parts.length?[...head,'(',...join(parts,', '),')']:head;
}
module.exports=function sharedDomain(data,binder){
 const {domain,statement}=declaredDomain(data,binder);
 const address=(node,slots)=>({namespace:'source',node,route:{root:domain.route.root,slots}});
 const ctx=context(data,domain.route).binders.map(b=>({name:data.payloads[b.node].binderName??data.payloads[b.node].declName,address:address(b.node,b.route.slots)}));
 const scene=notation.scene(data,domain.node,window.PROOF_ATLAS_TYPE_NOTATION,{context:ctx,slots:domain.route.slots,address});
 assert.equal(atlas.walk(data,domain.route),scene.root.origin.node);
 return {domain,statement,formula:formula(scene.root,data)};
};
