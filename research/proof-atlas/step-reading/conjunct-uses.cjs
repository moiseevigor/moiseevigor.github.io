// Inventory literal conjunction domains among leading proof-body lambdas.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine,equal}=require('../../../public/js/proof-atlas-elimination');
const ranked=require('./ranked-binder-uses.cjs');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
let theorems=0,parameters=0;
const records=[],types=[];
for(const d of edition.declarations.filter(x=>x.kind==='theorem'&&x.bodyAvailable)){
 theorems++;
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d);
 const addr=(node,slots)=>({node,path:slots.join('')});
 let binder=g.roots[1],slots=[];
 function conjunction(node){
  const s=spine(g,node);
  if(s.args.length===2 && g.kind[s.head]===4 && g.payloads[s.head].name==='And')return s.args;
 }
 while(g.kind[binder]===6){
  parameters++;
  const domain=g.children[binder][0];
  if(conjunction(domain)){
   const binderRoute={root:1,slots},refs=ranked(g,binderRoute),groups=new Map();
   for(let rank=0n;rank<refs.total;rank++){
    let at=refs.select(rank);
    assert.deepEqual(A.binding(g,at.route).route,binderRoute);
    let clause=domain,clauseSlots=slots.concat(0),steps='';
    for(;;){
     const c=applicationAtUse(g,at,{includePeers:false});
     if(!c || g.kind[c.head.node]!==4 || !['And.left','And.right'].includes(c.label)||c.slot!==3||c.arity!==3)break;
     const parts=conjunction(clause);if(!parts)break;
     const right=c.label==='And.right';
     steps+=right?'R':'L';clause=parts[Number(right)];
     clauseSlots=clauseSlots.concat(right?[1]:[0,1]);at=c.call;
    }
    const c=applicationAtUse(g,at,{includePeers:false});
    const parentSlots=at.route.slots.slice(0,-1),parent=A.walk(g,{root:1,slots:parentSlots});
    const receiver=c?c.label+' · '+(c.slot?'argument '+c.slot+' of '+c.arity:'function position'):
     A.kinds[g.kind[parent]]+'.'+A.fields[A.kinds[g.kind[parent]]][at.route.slots.at(-1)];
    // A local function name alone does not identify its binder.
    const target=c?addr(c.call.node,c.call.route.slots):addr(parent,parentSlots);
    const identity=c?(g.kind[c.head.node]===4?c.head.node:g.kind[c.head.node]===0?
     A.binding(g,c.head.route).route.slots:c.head.route.slots):null;
    const key=JSON.stringify([steps,identity,receiver]);
    if(!groups.has(key))groups.set(key,{steps,receiver,clause:addr(clause,clauseSlots),target,slot:c?.slot,use:addr(at.node,at.route.slots),count:0});
    groups.get(key).count++;
   }
   types.push([g,g.roots[0]]);
   records.push({declaration:d.name,indexSha256:d.indexSha256,binder:addr(binder,slots),name:g.payloads[binder].binderName,
    total:Number(refs.total),groups:[...groups.values()]});
  }
  slots=slots.concat(1);binder=g.children[binder][1];
 }
}
assert.equal(records.length,2);
const identicalTypes=equal(types[0][0],types[0][1],types[1][0],types[1][1]);
assert(identicalTypes);
console.log(JSON.stringify({edition:edition.id,theorems,parameters,identicalTypes,records},null,2));
