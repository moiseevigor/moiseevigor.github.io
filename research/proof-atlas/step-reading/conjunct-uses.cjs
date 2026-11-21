// Inventory literal conjunction domains among leading proof-body lambdas.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine,equal}=require('../../../public/js/proof-atlas-elimination');
const ranked=require('./ranked-binder-uses.cjs');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
require('../../../public/data/proof-atlas/library-manifest');
const ai=window.PROOF_ATLAS_AI_SAMPLE.edition;
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const cases={leftOnly:0,rightOnly:0,both:0,neither:0,unavailable:0};
const edition=[ai,...window.PROOF_ATLAS_LIBRARY.editions].find(e=>e.id===(process.argv[2]||ai.id));
const nested=process.argv.includes('--all-lambdas');
const occurrences=process.argv.includes('--occurrences');
const follow=process.argv.includes('--follow-helpers');
assert(!follow||nested,'Following helper bodies requires --all-lambdas');
assert(edition,'Unknown edition');
let theorems=0,parameters=0;
const records=[],types=[],leadingArities=new Map();
for(const d of edition.declarations.filter(x=>x.kind==='theorem'&&x.bodyAvailable)){
 theorems++;
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d);
 if(follow){
  let body=g.roots[1],arity=0;
  while(g.kind[body]===6){arity++;body=g.children[body][1];}
  leadingArities.set(d.name,arity);
 }
 const addr=(node,slots)=>({node,path:slots.join('')});

 function conjunction(node){
  const s=spine(g,node);
  if(s.args.length===2 && g.kind[s.head]===4 && g.payloads[s.head].name==='And')return s.args;
 }
 function inspect(binder,slots){
  parameters++;
  const domain=g.children[binder][0];
  if(conjunction(domain)){
   const binderRoute={root:1,slots},refs=ranked(g,binderRoute),groups=new Map();
   for(let rank=0n;rank<refs.total;rank++){
    let at=refs.select(rank);
    assert.deepEqual(A.binding(g,at.route).route,binderRoute);
    let clause=domain,clauseSlots=slots.concat(0),steps='';
    for(;;){
     const parts=conjunction(clause);if(!parts)break;
     const parentSlots=at.route.slots.slice(0,-1),parent=A.walk(g,{root:1,slots:parentSlots});
     const p=g.payloads[parent];
     if(g.kind[parent]===11 && p.typeName==='And' && (p.index===0||p.index===1)){
      const right=p.index===1;
      steps+=right?'R':'L';clause=parts[p.index];clauseSlots=clauseSlots.concat(right?[1]:[0,1]);
      at={node:parent,route:{root:1,slots:parentSlots}};continue;
     }
     const c=applicationAtUse(g,at,{includePeers:false});
     if(!c || g.kind[c.head.node]!==4 || !['And.left','And.right'].includes(c.label)||c.slot!==3||c.arity<3)break;
     const right=c.label==='And.right';
     steps+=right?'R':'L';clause=parts[Number(right)];
     clauseSlots=clauseSlots.concat(right?[1]:[0,1]);const prefix=c.call.route.slots.concat(Array(c.arity-3).fill(0));
     at={node:A.walk(g,{root:1,slots:prefix}),route:{root:1,slots:prefix}};
    }
    const c=applicationAtUse(g,at,{includePeers:false});
    const parentSlots=at.route.slots.slice(0,-1),parent=A.walk(g,{root:1,slots:parentSlots});
    const receiver=c?c.label+' · '+(c.slot?'argument '+c.slot+' of '+c.arity:'function position'):
     A.kinds[g.kind[parent]]+'.'+A.fields[A.kinds[g.kind[parent]]][at.route.slots.at(-1)];
    if(nested && !steps && c?.slot===4 && c.arity===5 && g.kind[c.head.node]===4 && c.label==='And.casesOn'){
     const method=g.children[c.call.node][1],inner=g.children[method][1];
     if(g.kind[method]!==6 || g.kind[inner]!==6){cases.unavailable++;}else{
      const body=g.children[inner][1],options={maxStates:8192,maxWork:16384,useSupport:false};
      const [left,right]=[1,0].map(i=>countReferences(g,body,i,options));
      if(left.status!=='counted'||right.status!=='counted')cases.unavailable++;
      else cases[left.occurrences!=='0'?(right.occurrences!=='0'?'both':'leftOnly'):
       (right.occurrences!=='0'?'rightOnly':'neither')]++;
     }
    }
    // A local function name alone does not identify its binder.
    const target=c?addr(c.call.node,c.call.route.slots):addr(parent,parentSlots);
    const identity=c?(g.kind[c.head.node]===4?c.head.node:g.kind[c.head.node]===0?
     A.binding(g,c.head.route).route.slots:c.head.route.slots):null;
    const key=JSON.stringify([steps,identity,receiver]);
    if(!groups.has(key))groups.set(key,{steps,receiver,clause:addr(clause,clauseSlots),target,slot:c?.slot,use:addr(at.node,at.route.slots),count:0});
    const group=groups.get(key);
    if(occurrences && group.count){
     (group.additional??=[]).push({use:addr(at.node,at.route.slots),target});
    }
    if(follow && !group.count && !steps && c?.slot>0 && g.kind[c.head.node]===4){
     Object.assign(groups.get(key),{callee:g.payloads[c.head.node].name,arity:c.arity,head:addr(c.head.node,c.head.route.slots)});
    }
    groups.get(key).count++;
   }
   if(edition===ai&&!nested)types.push([g,g.roots[0]]);
   records.push({declaration:d.name,indexSha256:d.indexSha256,binder:addr(binder,slots),name:g.payloads[binder].binderName,
    total:Number(refs.total),groups:[...groups.values()]});
  }
 }
 if(nested){
  const seen=new Set();
  function visit(id,slots){
   if(seen.has(id))return;
   seen.add(id);
   if(g.kind[id]===6)inspect(id,slots);
   g.children[id].forEach((child,k)=>visit(child,slots.concat(k)));
  }
  visit(g.roots[1],[]);
 }else{
  let binder=g.roots[1],slots=[];
  while(g.kind[binder]===6){inspect(binder,slots);slots=slots.concat(1);binder=g.children[binder][1];}
 }
}
const summary={edition:edition.id,theorems,parameters};
if(nested)summary.jointBranches=cases;
if(follow){
 // A named theorem transports a clause only when its entire returned term
 // projects that clause directly from the corresponding positional binder.
 const byName=new Map();
 for(const r of records){
  if(/^1*$/.test(r.binder.path))byName.set(JSON.stringify([r.declaration,r.binder.path.length+1]),r);
 }
 const transfers=[];
 for(const caller of records)for(const group of caller.groups){
  if(!group.callee)continue;
  const callee=byName.get(JSON.stringify([group.callee,group.slot]));
  if(!callee || callee.total!==1 || leadingArities.get(group.callee)!==group.arity)continue;
  const [result]=callee.groups;
  if(!result.steps || result.use.path!=='1'.repeat(group.arity))continue;
  transfers.push({caller:caller.declaration,callerDigest:caller.indexSha256,argument:group.use,call:group.target,
   head:group.head,slot:group.slot,callee:callee.declaration,calleeDigest:callee.indexSha256,
   parameter:callee.binder,returned:result.use,clause:result.steps,count:group.count});
 }
 summary.helperTransfers=transfers;
}
if(edition===ai&&!nested){
 assert.equal(records.length,2);
 summary.identicalTypes=equal(types[0][0],types[0][1],types[1][0],types[1][1]);
 assert(summary.identicalTypes);
}
console.log(JSON.stringify({...summary,records},null,2));
