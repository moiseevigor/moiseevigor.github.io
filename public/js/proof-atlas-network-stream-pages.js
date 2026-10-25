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
  let calls=P.open(header.callRoot,'calls',header.scope),outgoing=P.open(header.outgoingRoot,'outgoing',header.scope),selected=new Map(),scene=null,disposed=false,serial=0,controller=null,tickets=[],connectionRows=0,peakRows=0,peakBytes=0,portLease=null,connectionController=null,connectionSerial=0;
  const live=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Network cancelled');};
  function cancel(clearTickets=true){serial++;connectionSerial++;connectionController?.abort();connectionController=null;controller?.abort();controller=null;if(clearTickets){tickets=[];connectionRows=0;}portLease?.dispose();portLease=null;}
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
  async function expand(id){live();demand(selected.size<8&&!selected.has(id),'call budget or already retained');const incoming=scene.incoming.find(e=>e.from===id),reverse=tickets.find(e=>e.direction==='outgoing'&&e.to===id);demand(incoming||reverse,'expand a currently exposed frontier');cancel();const current=serial;controller=new AbortController();const c=await row(id,controller.signal);live();demand(current===serial,'stale expansion');
   if(reverse){const p=c.ports[reverse.slot];demand(p&&p.knownProducer===reverse.from&&p.outOrdinal===reverse.ordinal&&M.same(N.address(header,p.input),reverse.input)&&M.same(N.address(header,p.producer),reverse.producer),'reverse/input witness agreement');}
   const next=new Map(selected);next.set(id,c);const model=N.create(header,[...next.values()],scene.focus);selected=next;scene=model;account();return copy(scene);
  }
  function collapse(id){live();demand(id!==scene.focus&&selected.has(id),'cannot collapse focus or absent call');cancel();selected.delete(id);scene=N.create(header,[...selected.values()],scene.focus);account();return copy(scene);}
  function getCall(id){live();demand(selected.has(id),'call outside retained cut');return copy(selected.get(id));}
  function release(){live();cancel(false);}
  async function inspect(id,slot){live();demand(selected.has(id)&&selected.get(id).ports[slot],'visible actual input');cancel(false);const current=serial;controller=new AbortController();demand(options.inspect,'source inspector unavailable');const lease=await options.inspect(d,copy(selected.get(id)),slot,{signal:controller.signal});if(disposed||current!==serial){lease.dispose();throw Error('Streamed network pages: stale inspector');}portLease=lease;return lease.getDetail();}
  const state=()=>({format:'ProofAtlasStreamedNetworkState/1',disposed,mode:d.mode,inventoryCalls:d.counts.calls,retainedCalls:selected.size,retainedBytes:disposed?0:account(),callLimit:8,callByteLimit:4194304,peakRows,peakBytes,connectionRows,connectionLimit:8,callPages:calls.state(),outgoingPages:outgoing.state(),selectedPort:portLease?.state()||null,wholeTopologyRequested:false,wholeSourceArchiveRequested:false,wholeNativeRecordRequested:false});
  try{await focus(options.focus??d.focus??0);return Object.freeze({getScene:()=>{live();return copy(scene);},getCall,focus,expand,collapse,connections,inspect,getDetail:()=>portLease?.getDetail()||null,info:a=>{live();demand(portLease,'no selected port');return portLease.info(a);},state,release,dispose});}catch(error){dispose();throw error;}
 }
 const api={open};if(node)module.exports=api;else host.ProofAtlasNetworkStreamPages=api;
})(typeof window==='undefined'?globalThis:window);
