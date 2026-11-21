'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const ranked=require('./ranked-binder-uses.cjs');
const {applicationAtUse}=require('../../../public/js/proof-atlas-omitted-references');
global.window={};require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition,d=edition.declarations.find(x=>x.name==='lean_workbook_plus_6206');
const raw=z.gunzipSync(fs.readFileSync('.'+d.indexFile));
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.indexSha256);
const g=A.validateIndex(JSON.parse(raw),d),binder={root:1,slots:[1,1,1]},r=ranked(g,binder);
const groups=new Map();
for(let n=0n;n<r.total;n++){
 const use=r.select(n);assert.deepEqual(A.binding(g,use.route).route,binder);
 let at=use;const projections=[];
 for(;;){
  const call=applicationAtUse(g,at,{includePeers:false});
  if(!call || !['And.left','And.right'].includes(call.label) || call.arity!==3 || call.slot!==3)break;
  projections.push(call.label);at=call.call;
 }
 const receiver=applicationAtUse(g,at,{includePeers:false});
 assert.equal(receiver.label,'Mathlib.Tactic.Linarith.sub_nonpos_of_le');
 const next=applicationAtUse(g,receiver.call,{includePeers:false});
 const key=projections.join('/');
 if(!groups.has(key))groups.set(key,{projections,count:0,example:{rank:String(n+1n),use,clause:at,receiver:receiver.call,slot:receiver.slot,next:next.call,nextSlot:next.slot}});
 groups.get(key).count++;
}
console.log(JSON.stringify({declaration:d.name,edition:edition.id,indexSha256:d.indexSha256,binder:{node:A.walk(g,binder),name:g.payloads[A.walk(g,binder)].binderName,path:binder.slots.join('')},groups:[...groups.values()]},null,2));
