'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data'),{spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const inventory=require('./transport-boundaries.json');
const cases=[];
for(const record of inventory.records){
  const transports=Object.values(record.examples).flat();
  if(!transports.length)continue;
  const owner=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(d=>d.name===record.name);
  const bytes=gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const g=A.validateIndex(JSON.parse(bytes),owner);
  const route=path=>({root:1,slots:Array.from(path,Number)});
  const at=path=>A.walk(g,route(path));
  const groups=new Map();
  for(const t of transports){
    const parent=transports.filter(p=>p!==t&&t.slots.startsWith(p.slots)).sort((a,b)=>b.slots.length-a.slots.length)[0];
    const key=parent?.node??null;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(t);
  }
  for(const [parent,branches] of groups){
    assert.equal(branches.length,2);
    const [left,right]=branches;
    let path='';
    while(left.slots[path.length]===right.slots[path.length])path+=left.slots[path.length];
    const node=at(path),application=spine(g,node);
    assert.equal(g.payloads[application.head].name,'Or.casesOn');
    assert.equal(application.args.length,6);
    const major=path+'001';
    assert.equal(at(major),application.args[3]);
    const binding=A.binding(g,route(major));
    assert(binding);
    assert.equal(A.kinds[g.kind[binding.node]],'letE');
    const value=g.children[binding.node][1];
    const introduced=spine(g,value);
    assert.equal(g.payloads[introduced.head].name,'Iff.mpr');
    assert.equal(introduced.args.length,4);
    assert.equal(g.payloads[spine(g,introduced.args[2]).head].name,'Classical.or_iff_not_imp_left');
    const branchEvidence=branches.map((transport,i)=>{
      const binder=path+(i===0?'01':'1');
      assert.equal(at(binder),application.args[4+i]);assert.equal(A.kinds[g.kind[at(binder)]],'lam');
      assert.equal(transport.slots,binder+'1');
      const symmetry=transport.slots+'00001';
      const symmetric=spine(g,at(symmetry));
      assert.equal(g.payloads[symmetric.head].name,'Eq.symm');
      assert.equal(symmetric.args.length,4);
      const premise=symmetry+'1';
      assert.equal(at(premise),symmetric.args[3]);
      assert.deepEqual(A.binding(g,route(premise)),{node:at(binder),route:route(binder)});
      return {transport:transport.node,binder:at(binder),symmetry:at(symmetry),premise:at(premise)};
    });
    cases.push({declaration:record.name,indexSha256:record.indexSha256,parent,path,node,
      value,name:g.payloads[binding.node].declName,major:at(major),majorBinder:binding.node,majorBinderPath:binding.route.slots.join(''),branches:branchEvidence});
  }
}
console.log(JSON.stringify(cases,null,2));
