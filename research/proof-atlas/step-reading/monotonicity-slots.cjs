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
  targets.set(name,{predicate,prefix,result,roles:restricted?
    ['first point','first membership','second point','second membership','order premise']:
    ['first point','second point','order premise']});
}
for(const [name,target] of targets){
  const digest=owners.get(name).indexSha256;
  const shard=require('../../../public/data/proof-atlas/callee-uses/'+digest[0]+'.json');
  const record=shard.records.find(r=>r.name===name);
  assert.equal(record.indexSha256,digest);
  assert.equal(record.signature.length,target.prefix);
  assert.equal(record.result.head,target.predicate);
  assert.deepEqual(record.result.roles,target.roles);
}
const counts={},byCallee={};
const links=[];
function link(label,name,root,slots,node){
  const query=new URLSearchParams({edition:edition.id,proof:name,route:root+':'+slots.join('.')});
  return '['+label+'](https://moiseevigor.github.io/projects/proof-atlas/library/?'+query+'#expr-'+node+')';
}
for(const owner of edition.declarations.filter(r=>r.kind==='theorem' && r.bodyAvailable)){
  const term=load(owner),root=term.roots[1],visits=Array(root+1).fill(0),prefixes=Array(root+1).fill(0);
  visits[root]=1;
  const hits=new Map();
  for(let id=root;id>=0;id--){
    if(!visits[id])continue;
    const app=term.kind[id]===5;
    const weight=visits[id]-prefixes[id];
    if(app&&weight){
      const {head,args}=spine(term,id),name=term.payloads[head].name;
      const target=term.kind[head]===4?targets.get(name):null;
      if(target && args.length>target.prefix){
        assert.deepEqual(term.payloads[head].nameParts,name.split('.').map(str=>({str})));
        hits.set(id,{name,target,args});
        for(let slot=target.prefix;slot<args.length;slot++){
          const role=target.roles[slot-target.prefix];assert(role);
          counts[role]=(counts[role]||0)+weight;
          byCallee[name]=(byCallee[name]||0)+weight;
        }
      }
    }
    term.children[id].forEach((c,i)=>{visits[c]+=visits[id];assert(Number.isSafeInteger(visits[c]));if(app&&i===0)prefixes[c]+=visits[id];});
  }
  if(process.argv.includes('--links') && hits.size){
    // Visit only branches that can contain one of the measured application rows.
    const reachable=[];
    for(let id=0;id<=root;id++)reachable[id]=hits.has(id)||term.children[id].some(c=>reachable[c]);
    function visit(id,path,inFunction){
      if(!reachable[id])return;
      const hit=hits.get(id);
      if(hit&&!inFunction){
        const {name,target,args}=hit;
        for(let i=target.prefix;i<args.length;i++){
          const slots=path.concat(Array(args.length-1-i).fill(0),1);
          assert.equal(data.walk(term,{root:1,slots}),args[i]);
          const caller=link(owner.name,owner.name,1,path,id);
          const arg=link('Argument '+(i+1),owner.name,1,slots,args[i]);
          const result=link(target.predicate,name,0,Array(target.prefix).fill(1),target.result);
          links.push('| '+caller+' | '+arg+' | '+target.roles[i-target.prefix]+' | '+result+' |');
        }
      }
      term.children[id].forEach((c,i)=>visit(c,path.concat(i),term.kind[id]===5&&i===0));
    }
    visit(root,[],false);
  }
}
assert.deepEqual(byCallee,Object.fromEntries(Object.entries(expected).map(([k,v])=>[k,Number(v)])));
if(process.argv.includes('--links')){
  assert.equal(links.length,Object.values(counts).reduce((a,b)=>a+b,0));
  console.log('# Arguments supplied to monotonicity results\n');
  console.log('The caller link opens the complete call. The argument link selects the supplied expression. The final link opens the named result in the called declaration. Roles follow the four Lean-checked predicate definitions.\n');
  console.log('| Caller | Compiled argument | Role in the unfolded result | Declared result |\n|---|---|---|');
  console.log(links.join('\n'));
}else console.log(JSON.stringify({edition:edition.id,byCallee,counts},null,2));
