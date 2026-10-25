/* Exact source paths for every mode; native types only when separately recorded. */
(function(host){
 'use strict';const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts,C=node?require('./proof-atlas-construction-composition'):host.ProofAtlasConstructionComposition,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,P=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,Q=node?require('./proof-atlas-application-port-pages'):host.ProofAtlasApplicationPortPages;
 const copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Network port inspector: '+m);};
 const address=(d,a)=>({namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,...copy(a)});
 async function open(d,c,slot,options={}){
  const p=c.ports[slot];demand(p&&p.slot===slot,'actual port');
  if(d.mode==='native'){
   const descriptor=await A.compressed(d.nativeDescriptor.file,d.nativeDescriptor.sha256,{expectedBytes:d.nativeDescriptor.bytes,maxBytes:2097152,signal:options.signal});demand(M.same(descriptor.source,d.source)&&M.same(descriptor.owner,d.owner)&&M.same(descriptor.calls[c.index].anchor,c.anchor),'native/source identity');
   const lease=await Q.open(descriptor,c.anchor.route,{firstArgument:slot===0?0:Math.floor((slot-1)/4)*4,signal:options.signal});
   try{const scene=lease.create(),n=scene.nodes.find(n=>n.slot===slot);demand(M.same(n.address,address(d,p.producer))&&M.same(n.inputAddress,address(d,p.input))&&n.role===p.role&&n.contextLength===p.producerContextLength&&n.visibility===p.visibility,'native port topology bridge');
    const plain=a=>{const{namespace,name,indexSha256,sourceSha256,...at}=a;return at;};demand(M.same(n.hops.map(h=>({...h,use:plain(h.use),binder:plain(h.binder),value:plain(h.value)})),p.hops),'native binding paths');
    const detail={call:c.index,slot,node:n,result:scene.nodes[0],source:copy(p),owner:d.owner.sha256,typeStatus:'recorded-native'};
    return Object.freeze({getDetail:()=>copy(detail),state:()=>({mode:'native',providerBytes:d.nativeDescriptor.bytes,...lease.state()}),dispose:()=>lease.dispose(),info:at=>{if(at.namespace==='source-expression')return lease.inspectSource(at);const info=lease.computedInfo(at),original=at.component==='producerType',selected=scene.nodes.find(n=>n.slot===Number(at.input.split(':')[1]));return{...info,ambientContextLength:original?selected.contextLength:scene.nodes[0].contextLength,contextOrigin:{relation:original?'original-producer-context':'consumer-context',source:copy(original?selected.address:scene.nodes[0].address)}};}});
   }catch(error){lease.dispose();throw error;}
  }
  demand(d.mode==='source-only'&&d.nativeDescriptor===null,'unavailable native types remain unavailable');
  const fields=['kind','children','payloads','expanded','neededScope'],rows=new Map();let bytes=0,disposed=false;
  const cursor=await P.open(d.sourcePages,d.record,{signal:options.signal,pageLimit:1,indexLimit:2});
  const check=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Source inspection cancelled');};
  async function row(id){check();if(rows.has(id))return rows.get(id);demand(rows.size<4096,'source path row bound');const value=await cursor.run(()=>fields.map(f=>cursor.data[f][id]),{signal:options.signal});check();bytes+=new TextEncoder().encode(JSON.stringify(value)).length;demand(bytes<=4194304,'source path byte bound');rows.set(id,Object.freeze(value));return value;}
  async function path(at){let id=cursor.data.roots[at.route.root];for(const s of at.route.slots){const value=await row(id);demand(value[1][s]!==undefined,'ordered source child');id=value[1][s];}await row(id);demand(id===at.node,'exact source occurrence');}
  async function spine(at){await path(at);let id=at.node;for(let steps=0;;steps++){demand(steps<=64,'source spine bound');const value=await row(id);if(value[0]!==5)break;await row(value[1][1]);id=value[1][0];}}
  function dispose(){disposed=true;rows.clear();bytes=0;cursor.dispose();}
  try{await spine(c.anchor);await path(p.input);await spine(p.producer);for(const h of p.hops)for(const a of[h.use,h.binder,h.value])await path(a);if(p.externalBinder)await path(p.externalBinder);
   const data={...cursor.manifest.header};for(const[i,f]of fields.entries())data[f]=new Proxy([],{get(target,k,receiver){if(k==='length')return cursor.data.kind.length;if(typeof k==='string'&&/^(0|[1-9]\d*)$/.test(k)){check();const value=rows.get(Number(k));demand(value,'source row outside retained paths');return value[i];}return Reflect.get(target,k,receiver);},set(){throw Error('Read-only source paths');}});
   demand(M.same(M.sourceInput(data,c.anchor,slot),p.input),'literal source input');const r=C.resolve(data,p.input);demand(M.same(r.producer,p.producer)&&M.same(r.definitionHops,p.hops)&&r.producerContext.length===p.producerContextLength&&T.context(data,c.anchor.route).binders.length===p.consumerContextLength,'structural source-use witness');
   const result={address:address(d,c.anchor),text:A.describe(data,c.anchor.node),typeText:'Type observation unavailable · source structure only',contextLength:p.consumerContextLength,role:'unobserved'};
   const n={slot,address:address(d,p.producer),inputAddress:address(d,p.input),text:A.describe(data,p.producer.node),inputText:A.describe(data,p.input.node),typeText:result.typeText,contextLength:p.producerContextLength,role:'unobserved',visibility:null,externalBinder:p.externalBinder?address(d,p.externalBinder):null,hops:p.hops.map(h=>({...copy(h),use:address(d,h.use),binder:address(d,h.binder),value:address(d,h.value)}))};
   const detail={call:c.index,slot,node:n,result,source:copy(p),owner:null,typeStatus:'unavailable'};
   return Object.freeze({getDetail:()=>{check();return copy(detail);},state:()=>({mode:'source-only',disposed,sourceRows:rows.size,sourceBytes:bytes,rowLimit:4096,byteLimit:4194304,sourcePageCache:cursor.state(),nativeNodes:0,nativeBytes:0}),dispose,info:at=>{check();demand(at.namespace==='source-expression'&&at.indexSha256===d.source.indexSha256&&at.sourceSha256===d.source.sourceSha256&&at.name===d.source.name&&at.node===A.walk(data,at.route),'foreign source address or unavailable type');return{kind:A.kinds[data.kind[at.node]],payload:copy(data.payloads[at.node]),path:A.path(data,at.route)};}});
  }catch(error){dispose();throw error;}
 }
 const api={open};if(node)module.exports=api;else host.ProofAtlasNetworkPortInspector=api;
})(typeof window==='undefined'?globalThis:window);
