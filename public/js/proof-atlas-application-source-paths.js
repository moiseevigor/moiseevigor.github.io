/* Source witnesses for a bounded application window; native graphs stay separate. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const fields=['kind','children','payloads','expanded','neededScope'],copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Application source paths: '+m);};
 async function open(descriptor,record,ports,options={}){
  const rowLimit=options.rowLimit??4096,byteLimit=options.byteLimit??4194304,rows=new Map();let bytes=0,disposed=false,cursor=null;
  const live=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Source verification cancelled');};
  const dispose=()=>{disposed=true;rows.clear();bytes=0;cursor?.dispose();};
  demand(Number.isInteger(rowLimit)&&rowLimit>=1&&rowLimit<=4096&&Number.isInteger(byteLimit)&&byteLimit>=1&&byteLimit<=4194304,'path bounds');
  demand(Array.isArray(ports)&&ports.length>=1&&ports.length<=5,'one port or application window');
  demand(descriptor?.file==='/public/data/proof-atlas/source-pages/'+record.indexSha256+'/manifest-'+descriptor.sha256+'.json.gz','source manifest address');
  try{
   live();cursor=await P.open(descriptor,record,{fetcher:options.fetcher,signal:options.signal,pageLimit:1,indexLimit:2});
   async function row(id){live();demand(Number.isInteger(id)&&id>=0&&id<cursor.data.kind.length,'source row');if(rows.has(id))return rows.get(id);demand(rows.size<rowLimit,'source path row bound');const value=await cursor.run(()=>fields.map(f=>cursor.data[f][id]),{signal:options.signal});live();const size=new TextEncoder().encode(JSON.stringify(value)).length;demand(bytes+size<=byteLimit,'source path byte bound');rows.set(id,Object.freeze(value));bytes+=size;return value;}
   async function path(at){demand(M.route(at?.route),'source route');let id=cursor.data.roots[at.route.root];for(const slot of at.route.slots){const tuple=await row(id);demand(slot<tuple[1].length,'ordered source field');id=tuple[1][slot];}await row(id);demand(id===at.node,'source node/occurrence');}
   async function spine(at){await path(at);let id=at.node;for(let depth=0;;depth++){demand(depth<=64,'application spine bound');const tuple=await row(id);if(tuple[0]!==5)break;await row(tuple[1][1]);id=tuple[1][0];}}
   for(const j of ports){demand(j&&Array.isArray(j.definitionHops)&&j.definitionHops.length<=16,'binding witness bound');await spine(j.consumer.anchor);await path(j.consumer.input);await spine(j.producer.anchor);for(const hop of j.definitionHops)for(const at of [hop.use,hop.binder,hop.value])await path(at);if(j.externalBinder)await path(j.externalBinder);}
   const data={...cursor.manifest.header};for(const [i,f]of fields.entries())data[f]=new Proxy([],{get(target,k,receiver){if(k==='length')return cursor.data.kind.length;if(typeof k==='string'&&/^(0|[1-9]\d*)$/.test(k)){live();const tuple=rows.get(Number(k));demand(tuple,'source row outside retained paths');return tuple[i];}return Reflect.get(target,k,receiver);},set(){throw Error('Read-only application source paths');},ownKeys(){throw Error('Whole-source enumeration unavailable');}});Object.freeze(data);
   for(const j of ports)M.validateSourcePort(j,data,{anchor:j.consumer.anchor,arguments:j.consumer.arguments},j.consumer.slot);
   live();return Object.freeze({input:(call,slot)=>{live();demand(call.node===A.walk(data,call.route),'source call');return copy(M.sourceInput(data,call,slot));},inspect:at=>{live();demand(at?.namespace==='source-expression'&&at.name===record.name&&at.indexSha256===record.indexSha256&&at.sourceSha256===record.sourceSha256&&at.node===A.walk(data,at.route),'foreign source selection');return{kind:A.kinds[data.kind[at.node]],payload:copy(data.payloads[at.node]),path:A.path(data,at.route)};},state:()=>({disposed,sourceRows:rows.size,sourceRowJsonBytes:bytes,rowLimit,byteLimit,sourcePageCache:cursor.state(),sourceWitnessesChecked:!disposed,wholeSourceArchiveRequested:false}),dispose});
  }catch(error){dispose();throw error;}
 }
 const api={open};if(node)module.exports=api;else host.ProofAtlasApplicationSourcePaths=api;
})(typeof window==='undefined'?globalThis:window);
