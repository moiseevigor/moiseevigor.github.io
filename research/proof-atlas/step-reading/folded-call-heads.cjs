// Attribute counted-edge reductions to the head expression of each complete application.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const ports=require('./distinct-call-ports.cjs'),scopes=require('./receiver-scopes.cjs');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const records=new Map(),proofs=[],powers=new Map();
for(const d of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.filter(d=>d.kind==='theorem' && d.bodyAvailable)){
 const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
 assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
 const g=A.validateIndex(JSON.parse(raw),d),inventory=ports(g,Infinity),partition=scopes(g),byHead=new Map();
 for(const p of inventory.routes){
  const {head,args}=spine(g,p.callNode);
  const key=g.kind[head]===4?g.payloads[head].name:'('+A.kinds[g.kind[head]]+' head)';
  const operand=A.walk(g,{root:1,slots:p.slots});
  let groups=1n;
  if(p.upper>1n){
   const {total,instances}=partition(p.callNode,g.payloads[operand].index);
   assert.equal(total,p.upper);groups=instances;
  }
  if(key==='HPow.hPow'){
   const fields=p.slots.slice(p.callLength);
   const position=fields.at(-1)===1?args.length-fields.length+1:0;
   let exponent='absent';
   if(args.length===6){
    const {head:h,args:terms}=spine(g,args[5]);
    if(g.kind[h]===4 && g.payloads[h].name==='OfNat.ofNat' && terms.length===3 &&
       g.kind[terms[1]]===9 && g.payloads[terms[1]].literalKind==='natVal')exponent='OfNat '+g.payloads[terms[1]].value;
    else if(g.kind[h]===4 && g.payloads[h].name==='Nat.rawCast' && terms.length===3 &&
       g.kind[terms[0]]===4 && g.payloads[terms[0]].name==='Nat' &&
       g.kind[terms[2]]===9 && g.payloads[terms[2]].literalKind==='natVal')exponent='Nat.rawCast '+g.payloads[terms[2]].value;
    else if(g.kind[h]===9 && !terms.length)exponent='literal '+g.payloads[h].value;
    else exponent=g.kind[h]===4?g.payloads[h].name:A.kinds[g.kind[h]];
   }
   const label=[position,args.length,exponent].join('/');
   if(!powers.has(label))powers.set(label,{label,ports:0,uses:0,groups:0});
   const bucket=powers.get(label);bucket.ports++;bucket.uses+=Number(p.upper);bucket.groups+=Number(groups);
  }
  if(!byHead.has(key))byHead.set(key,{head:key,ports:0,uses:0,groups:0});
  const r=byHead.get(key);r.ports++;r.uses+=Number(p.upper);r.groups+=Number(groups);
 }
 const heads=[...byHead.values()];
 for(const r of heads){
  r.folded=r.uses-r.groups;
  if(!records.has(r.head))records.set(r.head,{head:r.head,ports:0,uses:0,groups:0,folded:0,proofs:0});
  const sum=records.get(r.head);
  for(const key of ['ports','uses','groups','folded'])sum[key]+=r[key];
  if(r.folded)sum.proofs++;
 }
 heads.sort((a,b)=>b.folded-a.folded);
 proofs.push({declaration:d.name,indexSha256:d.indexSha256,heads});
}
const totals=[...records.values()].sort((a,b)=>b.folded-a.folded);
assert.deepEqual(['ports','uses','groups','folded'].map(k=>totals.reduce((n,r)=>n+r[k],0)),[10967,696781,15405,681376]);
console.log(JSON.stringify({totals,powerPositions:[...powers.values()].sort((a,b)=>b.uses-a.uses),proofs},null,2));
