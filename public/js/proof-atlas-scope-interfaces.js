/* Derived source-scope interfaces; no additional typing or logical necessity. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
 class ScopeInterfaceError extends Error{constructor(message){super('Scope interface: '+message);}}
 const demand=(ok,message)=>{if(!ok)throw new ScopeInterfaceError(message);},binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2,cloneRoute=r=>({root:r.root,slots:[...r.slots]});
 function compute(data,width=512){
  demand(Number.isInteger(width)&&width>=1&&width<=512,'support width');const masks=[],unresolved=[];
  for(let id=0;id<data.kind.length;id++){
   const k=data.kind[id],cs=data.children[id];demand(Number.isInteger(k)&&k>=0&&k<12&&cs.length===(A.fields[A.kinds[k]]||[]).length&&cs.every(c=>Number.isInteger(c)&&c>=0&&c<id),'source order/arity');
   demand(Number.isInteger(data.neededScope[id])&&data.neededScope[id]>=0&&(k!==0||Number.isInteger(data.payloads[id].index)&&data.payloads[id].index>=0),'source scope/index');
   unresolved.push(k===1||k===2||cs.some(c=>unresolved[c]));let mask=null;
   if(data.neededScope[id]===0)mask=0n;
   else if(data.neededScope[id]<=width){if(k===0)mask=1n<<BigInt(data.payloads[id].index);else if(cs.every(c=>masks[c]!==null))mask=cs.reduce((m,c,j)=>m|(binds(k,j)?masks[c]>>1n:masks[c]),0n);}
   if(mask!==null)demand((mask===0n?0:mask.toString(2).length)===data.neededScope[id],'maximum free variable');masks.push(mask);
  }
  return{width,rows:masks.map((m,i)=>[m===null?null:m.toString(16),unresolved[i]])};
 }
 function strip(scene){const {scopeInterfaces,baseFormat,...base}=scene;return{...base,format:baseFormat||scene.format,nodes:scene.nodes.map(n=>({...n,ports:n.ports.map(p=>{const {scopeInterface,...port}=p;return port;})}))};}
 function unavailable(scene,reason){const base=strip(scene);return{...base,format:'ProofAtlasJudgmentScene/8',baseFormat:base.format,scopeInterfaces:{format:'ProofAtlasSourceScope/1',status:'unavailable',reason,bindings:[],interfaces:0,known:0,mentions:0,opaqueRegions:0,guarantee:'Source-scope evidence is unavailable; no empty interface is asserted.'}};}
 function attach(scene,data,record,getSummary,options={}){
  demand(!scene.scopeInterfaces,'interface already attached');demand(scene.source.name===record.name&&scene.source.indexSha256===record.indexSha256&&scene.source.sourceSha256===record.sourceSha256,'source identity');
  const targetLimit=options.targetLimit??16384,bindingLimit=options.bindingLimit??4096,interfaceLimit=options.interfaceLimit??4096;
  demand(Number.isInteger(targetLimit)&&targetLimit>=1&&targetLimit<=16384&&Number.isInteger(bindingLimit)&&bindingLimit>=1&&bindingLimit<=4096&&Number.isInteger(interfaceLimit)&&interfaceLimit>=1&&interfaceLimit<=4096,'layer bounds');
  const frameMap=new Map(),displayed=new Map(scene.nodes.filter(n=>n.binder).map(n=>[n.id,n.id]));
  for(const n of scene.nodes){for(const m of n.telescope?.members||[])frameMap.set(m.path,{displayTo:n.id,slot:m.slot});for(const m of n.contextFrame?.members||[])if(m.binder)frameMap.set(m.path,{displayTo:n.id,slot:m.binderSlot});}
  const bindings=[],ids=new Map();let interfaces=0,known=0,mentions=0,unknown=0,opaqueRegions=0;
  const nodes=scene.nodes.map(n=>{if(!n.ports.length&&BigInt(n.hidden)>0n)opaqueRegions++;return{...n,ports:n.ports.map(p=>{
   if(!p.frontier)return p;demand(++interfaces<=interfaceLimit,'interface bound');const at=T.context(data,p.route);demand(at.node===p.node&&A.path(data,p.route)===p.path,'source region');const summary=getSummary(p.node);
   demand(summary&&summary.indexSha256===record.indexSha256&&summary.sourceSha256===record.sourceSha256&&summary.node===p.node&&Number.isInteger(summary.width)&&summary.width>=1&&summary.width<=512&&typeof summary.unresolved==='boolean','summary identity');
   if(summary.mask===null||summary.unresolved){unknown++;return{...p,scopeInterface:{status:'unavailable',reason:summary.unresolved?'Unresolved elaborator objects in this source region.':'Source support exceeds the summary width.',provenance:summary.provenance}};}
   demand(typeof summary.mask==='string'&&/^(0|[1-9a-f][0-9a-f]*)$/.test(summary.mask)&&summary.mask.length<=Math.ceil(summary.width/4),'support encoding');const mask=BigInt('0x'+summary.mask);demand(mask>>BigInt(summary.width)===0n&&mask>>BigInt(at.binders.length)===0n,'support/context');
   demand((mask===0n?0:mask.toString(2).length)===data.neededScope[p.node],'summary/source maximum');
   const targets=[],bundleMap=new Map();for(let j=0;j<at.binders.length;j++)if((mask>>BigInt(at.binders.length-1-j))&1n){
    demand(++mentions<=targetLimit,'target bound');const b=at.binders[j];let id=ids.get(b.path);if(id===undefined){demand(bindings.length<bindingLimit,'binding bound');const f=frameMap.get(b.path),to=f?.displayTo||displayed.get(b.path)||null;id=bindings.length;ids.set(b.path,id);bindings.push({node:b.node,path:b.path,route:cloneRoute(b.route),kind:b.kind,name:data.payloads[b.node].binderName||data.payloads[b.node].declName||'_',depth:j,displayTo:to,binderSlot:f?.slot||null,boundary:to===null});}
    targets.push(id);const bnd=bindings[id],key=bnd.displayTo||'external-context';if(!bundleMap.has(key))bundleMap.set(key,{kind:bnd.boundary?'external-context':bnd.binderSlot?'frame':'binder',displayTo:bnd.displayTo,targets:[]});bundleMap.get(key).targets.push(id);
   }
   known++;return{...p,scopeInterface:{status:'known',context:at.binders.length,count:targets.length,targets,bundles:[...bundleMap.values()],provenance:summary.provenance}};
  })};});
  return{...scene,format:'ProofAtlasJudgmentScene/8',baseFormat:scene.format,nodes,scopeInterfaces:{format:'ProofAtlasSourceScope/1',status:unknown||opaqueRegions?'partial':'known',bindings,interfaces,known,mentions,unavailable:unknown,opaqueRegions,bounds:{targetLimit,bindingLimit,interfaceLimit},guarantee:'Exact free term-binder mentions in retained source regions, including type annotations. Constant and universe references are separate. A closed term-binder interface is not semantic independence, and a source mention is not logical necessity. Folded and external targets retain their exact original binder occurrences.'}};
 }
 const api={compute,attach,strip,unavailable,ScopeInterfaceError};if(node)module.exports=api;else host.ProofAtlasScopeInterfaces=api;
})(typeof window==='undefined'?globalThis:window);
