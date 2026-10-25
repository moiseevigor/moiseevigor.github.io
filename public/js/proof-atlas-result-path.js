/* Fold a selected, bounded source-use path; all side inputs and stage results remain exposed. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const N=node?require('./proof-atlas-network-streaming'):host.ProofAtlasNetworkStreaming;
 const M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Result path: '+m);};
 const integer=n=>Number.isSafeInteger(n)&&n>=0,hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
 async function create(scene,records,order,stop,inventory){
  demand(hash(inventory?.scope)&&hash(inventory.headerSha256),'inventory provenance');
  demand(['native','source-only'].includes(scene.mode)&&Array.isArray(order)&&order.length>0&&order.length<=8&&new Set(order).size===order.length&&order[0]===scene.focus,'bounded ordered path');
  demand(hash(scene.source?.indexSha256)&&hash(scene.source?.sourceSha256)&&(scene.mode==='native'?hash(scene.owner):scene.owner===null),'original source and native-owner boundary');
  const a=scene.accounting,h={mode:scene.mode,source:scene.source,owner:scene.owner?{sha256:scene.owner}:null,counts:{calls:a.retainedCalls+a.hiddenCalls,ports:a.totalPorts,known:a.internalPorts+a.incomingPorts+a.outgoingPorts+a.hiddenKnownPorts,unrecorded:a.visibleUnrecordedPorts+a.hiddenUnrecordedPorts}};
  demand(records.length===order.length&&records.every(c=>order.includes(c.index)),'exactly the folded members');
  const checked=N.create(h,records,scene.focus);demand(M.same(checked,scene),'source cut agrees with retained records');
  const byId=new Map(records.map(c=>[c.index,c])),edges=[],sideInputs=[],stages=[];
  for(const [position,id]of order.entries()){
   const c=byId.get(id);demand(c,'path member exists');let threaded=null;
   if(position){const previous=byId.get(order[position-1]);demand(previous.outCount===1,'stop before an inventoried branch');
    const matches=checked.links.filter(e=>e.from===previous.index&&e.to===id);demand(matches.length===1,'one exact ordered use');
    threaded=matches[0];demand(threaded.ordinal===previous.outStart,'unique reverse ordinal');edges.push(copy(threaded));
   }
   for(const p of c.ports)if(threaded?.slot!==p.slot)sideInputs.push({call:id,slot:p.slot});
   stages.push({call:id,address:N.address(h,c.anchor),record:copy(c)});
  }
  demand(checked.links.length===edges.length,'no additional internal use hidden by the fold');
  const last=byId.get(order[order.length-1]);demand(stop&&['end','branch','budget'].includes(stop.kind),'explicit path boundary');
  if(stop.kind==='end')demand(last.outCount===0&&stop.count===0,'end means no further inventoried use');
  if(stop.kind==='branch')demand(last.outCount>1&&stop.count===last.outCount,'branch degree');
  if(stop.kind==='budget')demand(last.outCount===1&&stop.count===1&&order.length===stop.limit&&integer(stop.limit)&&stop.limit>=1&&stop.limit<=8&&stop.next?.from===last.index&&stop.next.ordinal===last.outStart&&integer(stop.next.to)&&stop.next.to<h.counts.calls&&!order.includes(stop.next.to)&&M.same(stop.next.producer,N.address(h,last.anchor)),'budget boundary');
  const roles={proof:0,type:0,value:0,unobserved:0},visibility={default:0,implicit:0,strictImplicit:0,instImplicit:0,function:0,unobserved:0};
  const inputKinds={function:0,proof:0,type:0,value:0,unobserved:0};
  for(const ref of sideInputs){const p=byId.get(ref.call).ports[ref.slot];demand(p.role in roles,'recorded or unavailable input role');roles[p.role]++;inputKinds[p.slot===0?'function':p.role]++;visibility[p.slot===0?'function':p.visibility||'unobserved']++;}
  const actualPorts=records.reduce((sum,c)=>sum+c.ports.length,0);demand(actualPorts===sideInputs.length+edges.length,'every actual input retained once');
  const derivationBytes=new TextEncoder().encode(JSON.stringify({rule:'unique-inventoried-consumer/1',inventory,source:scene.source,owner:scene.owner,records:order.map(id=>byId.get(id)),stop}));
  demand(derivationBytes.length<=4194304,'derivation input byte budget');const derivationSha256=await A.digest(derivationBytes);
  const result={format:'ProofAtlasResultUsePath/1',identity:{namespace:'source-use-path',derivationSha256,rule:'unique-inventoried-consumer/1',inventory:copy(inventory),source:copy(scene.source),nativeOwner:scene.owner,stages:stages.map(s=>copy(s.address))},mode:scene.mode,focus:scene.focus,inventoryCounts:copy(h.counts),stages,edges,sideInputs,stop:copy(stop),counts:{calls:stages.length,actualPorts,pathUses:edges.length,sideInputs:sideInputs.length,resultPortals:stages.length,roles,inputKinds,visibility},scope:'A folded path of inventoried source uses. Every stage result remains an exposed portal. Side inputs are retained, including functions, types and instances. No complete-use, premise-necessity, common-context or new composite typing judgment is inferred.'};
  demand(new TextEncoder().encode(JSON.stringify(result)).length<=8388608,'derived path byte budget');return result;
 }
 async function unfold(model){
  demand(model?.format==='ProofAtlasResultUsePath/1','path format');
  const rows=model.stages.map(s=>s.record),h={mode:model.mode,source:model.identity.source,owner:model.identity.nativeOwner?{sha256:model.identity.nativeOwner}:null,counts:model.inventoryCounts};
  const scene=N.create(h,rows,model.focus),replayed=await create(scene,rows,model.stages.map(s=>s.call),model.stop,model.identity.inventory);
  demand(M.same(replayed,model),'fold contains every original input, stage and boundary');return scene;
 }
 async function follow(session,start,{limit=8,live=()=>true}={}){
  demand(Number.isInteger(limit)&&limit>=1&&limit<=8,'path call limit');
  const current=()=>demand(live(),'retired traversal');current();await session.focus(start);current();const order=[start];let stop;
  for(;;){const next=await session.successor(order[order.length-1]);current();
   if(next.kind!=='unique'){stop=next;break;}
   demand(!order.includes(next.edge.to),'cycle or repeated path member');
   if(order.length===limit){stop={kind:'budget',count:1,limit,next:copy(next.edge)};break;}
   await session.expand(next.edge.to);current();order.push(next.edge.to);
  }
  const result=await create(session.getScene(),order.map(id=>session.getCall(id)),order,stop,session.getIdentity());current();return result;
 }
 const api={create,unfold,follow};if(node)module.exports=api;else host.ProofAtlasResultPath=api;
})(typeof window==='undefined'?globalThis:window);
