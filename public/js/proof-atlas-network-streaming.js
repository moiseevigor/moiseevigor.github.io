/* Cut accounting from retained input rows and degrees, without a global edge array. */
(function(host){
 'use strict';const node=typeof module!=='undefined'&&module.exports,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Streamed network: '+m);},integer=n=>Number.isSafeInteger(n)&&n>=0;
 function anchor(h,a){return h.mode==='control'?integer(a?.control):M.route(a?.route)&&integer(a.node);}
 function address(h,a){return h.mode==='control'?{namespace:'network-control',controlSha256:h.source.controlSha256,...copy(a)}:{namespace:'source-expression',name:h.source.name,indexSha256:h.source.indexSha256,sourceSha256:h.source.sourceSha256,...copy(a)};}
 function validateCall(h,c){
  const n=h.counts.calls;demand(c&&integer(c.index)&&c.index<n&&anchor(h,c.anchor)&&integer(c.arguments)&&c.arguments>=1&&c.arguments<=64&&c.ports.length===c.arguments+1,'actual call inventory');
  demand(typeof c.functionLabel==='string'&&c.functionLabel.length<=180&&typeof c.result.typeText==='string'&&c.result.typeText.length<=1024&&integer(c.result.contextLength),'call summary');
  demand(integer(c.outStart)&&integer(c.outCount)&&c.outStart+c.outCount<=h.counts.known,'reverse degree range');
  for(const [slot,p]of c.ports.entries()){
   demand(p.id===c.index+':'+slot&&p.slot===slot&&anchor(h,p.input)&&anchor(h,p.producer)&&integer(p.producerKind)&&p.producerKind<12,'ordered input and producer addresses');
   demand(p.consumerContextLength===c.result.contextLength&&integer(p.producerContextLength)&&p.producerContextLength<=p.consumerContextLength&&Array.isArray(p.hops)&&p.hops.length<=16&&typeof p.definitionBoundary==='boolean','lexical boundary');
   let current=p.input;for(const hop of p.hops){demand(M.same(current,hop.use)&&anchor(h,hop.binder)&&anchor(h,hop.value)&&typeof hop.nondep==='boolean','binding chain');if(h.mode!=='control')demand(M.same(hop.value.route,{root:hop.binder.route.root,slots:[...hop.binder.route.slots,1]}),'let value slot');current=hop.value;}
   demand(M.same(current,p.producer),'source witness endpoint');
   if(h.mode==='native'){demand(['proof','type','value'].includes(p.role)&&['proof','type','value'].includes(c.result.role),'native role');demand(slot===0?p.visibility===null:['default','implicit','strictImplicit','instImplicit'].includes(p.visibility),'native binder visibility');}
   else demand(p.role==='unobserved'&&c.result.role==='unobserved'&&p.visibility===null&&p.literalProducerResultType===null,'no fabricated type observation');
   if(p.knownProducer===null)demand(p.outOrdinal===null&&p.literalProducerResultType===null,'unrecorded boundary');
   else {demand(integer(p.knownProducer)&&p.knownProducer<n&&p.knownProducer!==c.index&&integer(p.outOrdinal)&&p.outOrdinal<h.counts.known&&p.producerKind===5,'known source producer');if(h.mode==='native')demand(p.literalProducerResultType==='PASS','native literal result bridge');}
  }return true;
 }
 function wire(h,e){return{id:e.to+':'+e.slot,from:e.from,to:e.to,slot:e.slot,role:e.role,visibility:e.visibility,relation:e.hops?'binding-mediated-source-use':'direct-source-use',hops:e.hops,ordinal:e.ordinal,input:address(h,e.input),producer:address(h,e.producer)};}
 function inputWire(h,c,p){return wire(h,{from:p.knownProducer,to:c.index,slot:p.slot,role:p.role,visibility:p.visibility,hops:p.hops.length,ordinal:p.outOrdinal,input:p.input,producer:p.producer});}
 function create(h,records,focus){
  demand(Array.isArray(records)&&records.length>0&&records.length<=8&&new Set(records.map(c=>c.index)).size===records.length&&records.some(c=>c.index===focus),'retained call cut');
  const sorted=[...records].sort((a,b)=>a.index-b.index),kept=new Map(sorted.map(c=>[c.index,c]));for(const c of sorted)validateCall(h,c);
  const links=[],incoming=[],boundaries=[],excluded=new Map(sorted.map(c=>[c.index,[]]));let knownIn=0,knownOut=0;
  for(const c of sorted){knownOut+=c.outCount;for(const p of c.ports){const e=inputWire(h,c,p);if(p.knownProducer===null){boundaries.push({...e,kind:p.definitionBoundary?'definition-limit':p.externalBinder?'context-input':'unrecorded-fragment'});continue;}knownIn++;const producer=kept.get(p.knownProducer);if(!producer){incoming.push(e);continue;}
    demand(M.same(producer.anchor,p.producer)&&producer.result.contextLength===p.producerContextLength&&p.outOrdinal>=producer.outStart&&p.outOrdinal<producer.outStart+producer.outCount,'same original producer and reverse range');links.push(e);excluded.get(producer.index).push(p.outOrdinal);
  }}
  const outgoingBlocks=sorted.map(c=>{const omitted=excluded.get(c.index).sort((a,b)=>a-b);demand(new Set(omitted).size===omitted.length,'one reverse ordinal per actual input');return{producer:c.index,start:c.outStart,total:c.outCount,excluded:omitted,count:c.outCount-omitted.length};});
  const internal=links.length,a={retainedCalls:sorted.length,hiddenCalls:h.counts.calls-sorted.length,internalPorts:internal,incomingPorts:knownIn-internal,outgoingPorts:knownOut-internal,hiddenKnownPorts:h.counts.known-knownIn-knownOut+internal,visibleUnrecordedPorts:boundaries.length,hiddenUnrecordedPorts:h.counts.unrecorded-boundaries.length,totalPorts:h.counts.ports};
  demand(Object.values(a).every(integer)&&a.totalPorts===a.internalPorts+a.incomingPorts+a.outgoingPorts+a.hiddenKnownPorts+a.visibleUnrecordedPorts+a.hiddenUnrecordedPorts,'global cut partition');
  const ranks=new Map(sorted.map(c=>[c.index,0]));for(let round=0;round<sorted.length;round++){let changed=false;for(const e of links){const value=ranks.get(e.from)+1;if(value>ranks.get(e.to)){ranks.set(e.to,value);changed=true;}}if(!changed)break;demand(round<sorted.length-1,'cycle in retained source uses');}
  const columns=new Map(),nodes=sorted.map(c=>{const rank=ranks.get(c.index),row=columns.get(rank)||0;columns.set(rank,row+1);return{id:c.index,address:address(h,c.anchor),label:c.functionLabel,result:copy(c.result),arguments:c.arguments,ports:c.ports.length,rank,row};});
  return{format:'ProofAtlasStreamedNetworkScene/1',mode:h.mode,source:copy(h.source),owner:h.owner?.sha256||null,focus,limit:8,nodes,links,incoming,boundaries,outgoingBlocks,accounting:a};
 }
 // Rank/select in the complement of the retained internal ordinals. No hidden-edge scan.
 function outgoingRank(block,rank){demand(integer(rank)&&rank<block.count,'outgoing cut rank');let raw=block.start+rank;for(const omitted of block.excluded)if(omitted<=raw)raw++;else break;demand(raw<block.start+block.total,'reverse index rank');return raw;}
 const api={address,validateCall,wire,create,outgoingRank};if(node)module.exports=api;else host.ProofAtlasNetworkStreaming=api;
})(typeof window==='undefined'?globalThis:window);
