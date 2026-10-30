/* Eight retained calls; reverse-edge rank/select loads only the displayed consumer page. */
(function(host){
 'use strict';const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts,N=node?require('./proof-atlas-network-streaming'):host.ProofAtlasNetworkStreaming,P=node?require('./proof-atlas-network-page-store'):host.ProofAtlasNetworkPageStore;
 const copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Streamed network pages: '+m);},integer=n=>Number.isSafeInteger(n)&&n>=0,hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
 async function open(descriptor,options={}){
  const d=copy(descriptor),p=d.pages;demand(p&&hash(p.sha256)&&p.file==='/public/data/proof-atlas/network-streaming/'+p.sha256+'.json.gz'&&p.bytes>0&&p.bytes<=65536,'header address');
  let header=await A.compressed(p.file,p.sha256,{expectedBytes:p.bytes,maxBytes:65536,signal:options.signal});
  demand(header.format==='ProofAtlasPagedNetwork/1'&&header.scope===d.scope&&hash(header.scope)&&['native','source-only','control'].includes(header.mode)&&header.mode===d.mode&&M.same(header.source,d.source)&&M.same(header.owner,d.owner)&&M.same(header.counts,d.counts),'source and coverage owner');
  const c=header.counts;demand(Object.values(c).every(integer)&&c.calls>0&&c.calls<=1000000000&&c.ports>=2*c.calls&&c.ports<=65*c.calls&&c.ports===c.known+c.unrecorded,'inventory counts');
  P.reference(header.callRoot);demand(header.callRoot.first===0&&header.callRoot.count===c.calls,'complete call range');if(c.known){P.reference(header.outgoingRoot);demand(header.outgoingRoot.first===0&&header.outgoingRoot.count===c.known,'complete reverse range');}else demand(header.outgoingRoot===null,'empty reverse range');
  let calls=P.open(header.callRoot,'calls',header.scope),outgoing=P.open(header.outgoingRoot,'outgoing',header.scope),selected=new Map(),scene=null,disposed=false,serial=0,controller=null,tickets=[],connectionRows=0,peakRows=0,peakBytes=0,portLease=null,connectionController=null,connectionSerial=0,successorTicket=null;
  const live=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Network cancelled');};
  function cancel(clearTickets=true){successorTicket=null;serial++;connectionSerial++;connectionController?.abort();connectionController=null;controller?.abort();controller=null;if(clearTickets){tickets=[];connectionRows=0;}portLease?.dispose();portLease=null;}
  function dispose(){if(disposed)return;cancel();disposed=true;selected.clear();scene=header=null;calls.dispose();outgoing.dispose();options.signal?.removeEventListener('abort',dispose);}
  options.signal?.addEventListener('abort',dispose,{once:true});
  function account(){const bytes=new TextEncoder().encode(JSON.stringify([...selected.values()])).length;demand(selected.size<=8&&bytes<=4194304,'retained call bound');peakRows=Math.max(peakRows,selected.size);peakBytes=Math.max(peakBytes,bytes);return bytes;}
  async function row(id,signal){demand(integer(id)&&id<header.counts.calls,'call number');const c=await calls.get(id,signal);demand(c.index===id,'call rank identity');N.validateCall(header,c);demand(new TextEncoder().encode(JSON.stringify(c)).length<=262144,'single call byte bound');return copy(c);}
  async function focus(id){live();cancel();const current=serial;controller=new AbortController();const c=await row(id,controller.signal);live();demand(current===serial,'stale focus');selected=new Map([[id,c]]);scene=N.create(header,[c],id);account();return copy(scene);}
  async function connections(offset=0){live();demand(integer(offset),'connection offset');connectionController?.abort();connectionController=new AbortController();const request=++connectionSerial,current=serial,signal=connectionController.signal,local=[...scene.links.map(e=>({...e,direction:'internal'})),...scene.incoming.map(e=>({...e,direction:'incoming'}))],total=local.length+scene.accounting.outgoingPorts,rows=[];
   demand(offset<=total,'connection offset outside cut');tickets=[];
   for(let rank=offset;rank<Math.min(offset+8,total);rank++){
    if(rank<local.length){rows.push(copy(local[rank]));continue;}
    let remaining=rank-local.length,block=null;for(const candidate of scene.outgoingBlocks){if(remaining<candidate.count){block=candidate;break;}remaining-=candidate.count;}demand(block,'outgoing complement block');
    const raw=N.outgoingRank(block,remaining),e=await outgoing.get(raw,signal);live();demand(current===serial&&request===connectionSerial,'stale connection page');
    demand(e.ordinal===raw&&e.from===block.producer&&integer(e.to)&&e.to<header.counts.calls&&!selected.has(e.to)&&integer(e.slot)&&e.slot<=64&&M.same(e.producer,selected.get(e.from).anchor),'reverse source-use endpoint');
    rows.push({...N.wire(header,e),direction:'outgoing'});
   }
   live();demand(current===serial&&request===connectionSerial,'stale connection page');connectionRows=rows.length;tickets=copy(rows);return{offset,total,rows,limit:8};
  }
  // All uses of one retained result, including uses already inside the cut.
  // Input positions, rather than distinct consumers or stored node IDs, own the rows.
  async function uses(id,offset=0){
   live();demand(header.mode!=='control'&&selected.has(id)&&integer(offset),'retained source result and use offset');
   const c=selected.get(id);demand(offset<=c.outCount,'use offset outside producer');
   connectionController?.abort();connectionController=new AbortController();const request=++connectionSerial,current=serial,signal=connectionController.signal;successorTicket=null;tickets=[];connectionRows=0;const rows=[],consumers=new Map();
   for(let rank=offset;rank<Math.min(offset+8,c.outCount);rank++){
    const ordinal=c.outStart+rank,e=await outgoing.get(ordinal,signal);live();demand(current===serial&&request===connectionSerial,'stale use page');
    demand(e.ordinal===ordinal&&e.from===id&&integer(e.to)&&e.to<header.counts.calls&&e.to!==id&&integer(e.slot)&&e.slot<=64&&integer(e.hops)&&e.hops<=16&&M.same(e.producer,c.anchor),'result-use endpoint');
    demand(header.mode==='native'?['proof','type','value'].includes(e.role)&&(e.slot===0?e.visibility===null:['default','implicit','strictImplicit','instImplicit'].includes(e.visibility)):e.role==='unobserved'&&e.visibility===null,'result-use observation boundary');
    const edge=N.wire(header,e);demand(M.route(edge.input.route)&&integer(edge.input.node),'result-use input address');
    const target=await row(e.to,signal);live();demand(current===serial&&request===connectionSerial,'stale use consumer');checkReverse(target,edge);N.create(header,[c,target],id);
    consumers.set(target.index,{id:target.index,address:N.address(header,target.anchor),label:target.functionLabel,result:copy(target.result),arguments:target.arguments});rows.push({...edge,direction:'outgoing'});
   }
   live();demand(current===serial&&request===connectionSerial,'stale use page');const page={call:id,producer:N.address(header,c.anchor),offset,total:c.outCount,rows,consumers:[...consumers.values()],limit:8};demand(new TextEncoder().encode(JSON.stringify(page)).length<=4194304,'use page byte budget');connectionRows=rows.length;tickets=copy(rows);return page;
  }
  function checkReverse(c,reverse){const p=c.ports[reverse.slot];demand(p&&p.knownProducer===reverse.from&&p.outOrdinal===reverse.ordinal&&M.same(N.address(header,p.input),reverse.input)&&M.same(N.address(header,p.producer),reverse.producer)&&p.role===reverse.role&&p.visibility===reverse.visibility&&p.hops.length===reverse.hops,'reverse/input witness agreement');}
  // Replace the cut only after checking the selected reverse row against its consumer.
  // This works at the eight-call limit and retains no unbounded navigation history.
  async function followUse(ordinal){
   live();const reverse=tickets.find(e=>e.direction==='outgoing'&&e.ordinal===ordinal);demand(reverse&&selected.has(reverse.from),'follow a currently exposed result use');const producer=selected.get(reverse.from);cancel();const current=serial;controller=new AbortController();const c=await row(reverse.to,controller.signal);live();demand(current===serial,'stale use continuation');checkReverse(c,reverse);N.create(header,[producer,c],producer.index);
   const next=N.create(header,[c],c.index);selected=new Map([[c.index,c]]);scene=next;account();return{edge:copy(reverse),scene:copy(scene)};
  }
  // One reverse-index row is enough to follow an unambiguous inventoried use.
  // This is separate from the eight-row connection page; it never scans hidden consumers.
  async function successor(id){
   live();demand(selected.has(id),'successor of a retained call');successorTicket=null;
   connectionController?.abort();connectionController=new AbortController();const request=++connectionSerial,current=serial,signal=connectionController.signal;
   const c=selected.get(id);if(c.outCount!==1)return{kind:c.outCount?'branch':'end',count:c.outCount};
   const e=await outgoing.get(c.outStart,signal);live();demand(current===serial&&request===connectionSerial,'stale successor');
   demand(e.ordinal===c.outStart&&e.from===id&&integer(e.to)&&e.to<header.counts.calls&&integer(e.slot)&&e.slot<=64&&M.same(e.producer,c.anchor),'unique reverse source-use endpoint');
   const edge=N.wire(header,e);successorTicket={...edge,direction:'outgoing'};return{kind:'unique',count:1,edge:copy(edge)};
  }
  async function expand(id){live();demand(selected.size<8&&!selected.has(id),'call budget or already retained');const incoming=scene.incoming.find(e=>e.from===id),reverse=tickets.find(e=>e.direction==='outgoing'&&e.to===id)|| (successorTicket?.to===id?successorTicket:null);demand(incoming||reverse,'expand a currently exposed frontier');cancel();const current=serial;controller=new AbortController();const c=await row(id,controller.signal);live();demand(current===serial,'stale expansion');
   if(reverse)checkReverse(c,reverse);
   const next=new Map(selected);next.set(id,c);const model=N.create(header,[...next.values()],scene.focus);selected=next;scene=model;account();return copy(scene);
  }
  function collapse(id){live();demand(id!==scene.focus&&selected.has(id),'cannot collapse focus or absent call');cancel();selected.delete(id);scene=N.create(header,[...selected.values()],scene.focus);account();return copy(scene);}
  function getCall(id){live();demand(selected.has(id),'call outside retained cut');return copy(selected.get(id));}
  function release(){live();cancel(false);}
  async function inspect(id,slot){live();demand(selected.has(id)&&selected.get(id).ports[slot],'visible actual input');cancel(false);const current=serial;controller=new AbortController();demand(options.inspect,'source inspector unavailable');const lease=await options.inspect(d,copy(selected.get(id)),slot,{signal:controller.signal});if(disposed||current!==serial){lease.dispose();throw Error('Streamed network pages: stale inspector');}portLease=lease;return lease.getDetail();}
  const state=()=>({format:'ProofAtlasStreamedNetworkState/1',disposed,mode:d.mode,inventoryCalls:d.counts.calls,retainedCalls:selected.size,retainedBytes:disposed?0:account(),callLimit:8,callByteLimit:4194304,peakRows,peakBytes,connectionRows,connectionLimit:8,successorRows:successorTicket?1:0,successorLimit:1,callPages:calls.state(),outgoingPages:outgoing.state(),selectedPort:portLease?.state()||null,wholeTopologyRequested:false,wholeSourceArchiveRequested:false,wholeNativeRecordRequested:false});
  try{await focus(options.focus??d.focus??0);return Object.freeze({getScene:()=>{live();return copy(scene);},getCall,getIdentity:()=>{live();return{scope:header.scope,headerSha256:p.sha256};},focus,expand,collapse,connections,uses,followUse,successor,inspect,getDetail:()=>portLease?.getDetail()||null,info:a=>{live();demand(portLease,'no selected port');return portLease.info(a);},neighborhood:a=>{live();demand(portLease?.neighborhood&&a.namespace==='application-ports','recorded type fields unavailable');return portLease.neighborhood(a);},support:(a,request)=>{live();demand(portLease?.support&&a.namespace==='application-ports','recorded type support unavailable');return portLease.support(a,request);},state,release,dispose});}catch(error){dispose();throw error;}
 }
 const api={open};if(node)module.exports=api;else host.ProofAtlasNetworkStreamPages=api;
})(typeof window==='undefined'?globalThis:window);
