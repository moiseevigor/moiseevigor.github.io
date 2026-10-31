/* Predetermined region candidates. Every input position survives, including
   positions held fixed by a policy; failed candidates are never replaced. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const S=require('../network-streaming/pack.cjs'),A=require('../../../public/js/proof-atlas-library-data'),N=require('../../../public/js/proof-atlas-network-streaming');
process.chdir(path.resolve(__dirname,'../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),registry=f=>{const w={};vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});return JSON.parse(JSON.stringify(Object.values(w)[0]));},read=ref=>S.read(ref);
const directory=process.argv[2];assert(directory);fs.mkdirSync(directory,{recursive:false});
const descriptors=[...registry('public/data/proof-atlas/network-streaming-manifest.js').records,...registry('public/data/proof-atlas/application-region-controls-manifest.js').records];
function row(ref,id){for(;;){const p=read(ref);if(!ref.level)return p.rows[id-ref.first];ref=p.children.find(c=>id>=c.first&&id<c.first+c.count);assert(ref);}}
function context(g,anchor){let node=g.roots[anchor.route.root],frames=[];for(const[depth,slot]of anchor.route.slots.entries()){if(((g.kind[node]===6||g.kind[node]===7)&&slot===1)||(g.kind[node]===8&&slot===2))frames.push({node,slots:anchor.route.slots.slice(0,depth)});node=g.children[node][slot];}assert.equal(node,anchor.node);return frames;}
const profiles=[];
for(const name of['JacobiData.slope_bound_abs','lean_workbook_plus_6206','AtlasRegionControls.diamond','AtlasRegionControls.shortcut','AtlasRegionControls.twoPorts','AtlasRegionControls.proofShortcut']){
 const d=descriptors.find(d=>d.source.name===name);assert(d,name);const h=read(d.pages);let members;
 if(name==='JacobiData.slope_bound_abs')members=[25,26,27,75,76,77,78];
 else if(name==='lean_workbook_plus_6206'){
  // Deterministic breadth-first source-use neighborhood of the existing focus.
  const all=Array.from({length:d.counts.calls},(_,id)=>row(h.callRoot,id)),chosen=new Set([d.focus]);
  while(chosen.size<7){const edges=all.flatMap(c=>c.ports.filter(p=>p.knownProducer!==null).map(p=>[p.knownProducer,c.index]));const next=edges.find(([a,b])=>chosen.has(a)!==chosen.has(b));if(!next)break;chosen.add(chosen.has(next[0])?next[1]:next[0]);}members=[...chosen].sort((a,b)=>a-b);
 }else members=Array.from({length:d.counts.calls},(_,i)=>i);
 const records=members.map(id=>row(h.callRoot,id));records.forEach(c=>N.validateCall(h,c));
 const inventory=Array.from({length:d.counts.calls},(_,id)=>row(h.callRoot,id)),labels=new Set(inventory.map(c=>members.includes(c.index)?-1:c.index)),degrees=new Map([...labels].map(k=>[k,0])),out=new Map([...labels].map(k=>[k,[]]));let uses=0;
 for(const c of inventory)for(const p of c.ports)if(p.knownProducer!==null){uses++;const a=members.includes(p.knownProducer)?-1:p.knownProducer,b=members.includes(c.index)?-1:c.index;if(a!==b){out.get(a).push(b);degrees.set(b,degrees.get(b)+1);}}
 const queue=[...labels].filter(k=>degrees.get(k)===0);for(let i=0;i<queue.length;i++)for(const b of out.get(queue[i])){degrees.set(b,degrees.get(b)-1);if(degrees.get(b)===0)queue.push(b);}
 const graphCheck={status:queue.length===labels.size?'ACYCLIC':'CYCLIC',inventoryCalls:inventory.length,inventoryUses:uses,scope:'Complete pinned finite source-use inventory; omitted source uses remain unknown.'};
 const raw=z.gunzipSync(fs.readFileSync('.'+d.record.indexFile));assert.equal(sha(raw),d.source.indexSha256);const g=A.validateIndex(JSON.parse(raw),d.record);
 let common=context(g,records[0].anchor);for(const c of records){const ctx=context(g,c.anchor);let n=0;while(n<common.length&&n<ctx.length&&JSON.stringify(common[n])===JSON.stringify(ctx[n]))n++;common=common.slice(0,n);}
 const edges=records.flatMap(c=>c.ports.filter(p=>members.includes(p.knownProducer)).map(p=>({from:p.knownProducer,to:c.index,slot:p.slot}))),order=[],pending=new Set(members);
 while(pending.size){const next=[...pending].sort((a,b)=>a-b).find(id=>!edges.some(e=>e.to===id&&pending.has(e.from)));assert.notEqual(next,undefined,'source-use cycle');order.push(next);pending.delete(next);}
 const packet=path.resolve(directory,'packet-'+profiles.length+'.json');fs.writeFileSync(packet,raw);
 const request={format:'ProofAtlasRegionInputFunctionRequest/1',source:d.source,record:d.record,originalNativeOwner:d.owner,packetFile:packet,members,order,commonContext:common,records,edges,graphCheck,policies:['all-boundary-positions','proof-arguments','proof-and-function-inputs']};
 const requestFile=path.resolve(directory,'request-'+profiles.length+'.json');fs.writeFileSync(requestFile,JSON.stringify(request)+'\n');profiles.push({source:d.source,record:d.record,originalNativeOwner:d.owner,members,order,commonContext:common,records,edges,graphCheck,policies:request.policies,packetFile:packet,requestFile,requestSha256:sha(fs.readFileSync(requestFile))});
}
fs.writeFileSync(directory+'/plan.json',JSON.stringify({format:'ProofAtlasRegionInputFunctionPlan/1',profiles},null,2)+'\n');console.log(JSON.stringify({status:'PASS',profiles:profiles.length,candidates:profiles.length*3,regions:profiles.map(p=>({name:p.source.name,members:p.members,commonContext:p.commonContext.length,inputs:p.records.reduce((n,c)=>n+c.ports.length,0)-p.edges.length}))}));
