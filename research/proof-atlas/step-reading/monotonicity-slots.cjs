// Match source-level residual application slots to four separately Lean-checked interfaces.
'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {gunzipSync}=require('node:zlib');
const data=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
const edition=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
const expected=require('./all-body-coverage.json')[0].all.beyondPrefixes;
const owners=new Map(edition.declarations.map(r=>[r.name,r]));
const predicates=new Set(['Monotone','StrictMono','StrictMonoOn','StrictAntiOn']);
function load(owner){
  const bytes=gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  return data.validateIndex(JSON.parse(bytes),owner);
}
const targets=new Map();
for(const name of Object.keys(expected)){
  const term=load(owners.get(name));
  let result=term.roots[0],prefix=0;
  while(term.kind[result]===7){prefix++;result=term.children[result][1];}
  const {head,args}=spine(term,result),predicate=term.payloads[head].name;
  assert.equal(term.kind[head],4);
  assert(predicates.has(predicate));
  assert.deepEqual(term.payloads[head].nameParts,[{str:predicate}]);
  const restricted=predicate.endsWith('On');
  assert.equal(args.length,restricted?6:5);
  targets.set(name,{predicate,prefix,roles:restricted?
    ['first point','first membership','second point','second membership','order premise']:
    ['first point','second point','order premise']});
}
const counts={},byCallee={};
for(const owner of edition.declarations.filter(r=>r.kind==='theorem' && r.bodyAvailable)){
  const term=load(owner),root=term.roots[1],visits=Array(root+1).fill(0),prefixes=Array(root+1).fill(0);
  visits[root]=1;
  for(let id=root;id>=0;id--){
    if(!visits[id])continue;
    const app=term.kind[id]===5;
    const weight=visits[id]-prefixes[id];
    if(app&&weight){
      const {head,args}=spine(term,id),name=term.payloads[head].name;
      const target=term.kind[head]===4?targets.get(name):null;
      if(target && args.length>target.prefix){
        assert.deepEqual(term.payloads[head].nameParts,name.split('.').map(str=>({str})));
        for(let slot=target.prefix;slot<args.length;slot++){
          const role=target.roles[slot-target.prefix];assert(role);
          counts[role]=(counts[role]||0)+weight;
          byCallee[name]=(byCallee[name]||0)+weight;
        }
      }
    }
    term.children[id].forEach((c,i)=>{visits[c]+=visits[id];assert(Number.isSafeInteger(visits[c]));if(app&&i===0)prefixes[c]+=visits[id];});
  }
}
assert.deepEqual(byCallee,Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,Number(v)])));
console.log(JSON.stringify({edition:edition.id,byCallee,counts},null,2));
