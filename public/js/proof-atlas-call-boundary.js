/* All roles at one constituent call's region boundary; original contexts stay separate. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts,N=node?require('./proof-atlas-network-streaming'):host.ProofAtlasNetworkStreaming,R=node?require('./proof-atlas-application-regions'):host.ProofAtlasApplicationRegions,I=node?require('./proof-atlas-network-port-inspector'):host.ProofAtlasNetworkPortInspector;
 const copy=x=>JSON.parse(JSON.stringify(x)),bytes=x=>new TextEncoder().encode(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Call boundary: '+m);};
 async function open(model,unitId,descriptor,callId,options={}){
  if(options.signal?.aborted)throw options.signal.reason||Error('Call boundary cancelled');await R.unfold(model);const unit=model.units.find(u=>u.id===unitId),call=model.records.find(c=>c.index===callId);
  demand(unit&&call&&unit.members.includes(callId),'call inside selected region');
  demand(descriptor.mode===model.mode&&M.same(descriptor.source,model.identity.source)&&M.same({scope:descriptor.scope,headerSha256:descriptor.pages.sha256},model.identity.inventory)&&(descriptor.owner?.sha256||null)===model.identity.nativeOwner,'original source/inventory/native owner');
  demand(descriptor.record.name===descriptor.source.name&&descriptor.record.indexSha256===descriptor.source.indexSha256&&descriptor.record.sourceSha256===descriptor.source.sourceSha256,'source packet identity');
  const refs=unit.inputs.filter(r=>r.call===callId),inside=unit.internalUses.filter(e=>e.to===callId),slots=[...refs.map(r=>r.slot),...inside.map(e=>e.slot)];
  demand(slots.length===call.ports.length&&new Set(slots).size===call.ports.length&&slots.every(s=>Number.isSafeInteger(s)&&s>=0&&s<call.ports.length),'complete disjoint call-input partition');
  const source=a=>N.address({source:model.identity.source},a),identity={namespace:'call-boundary-window',source:copy(model.identity.source),nativeOwner:model.identity.nativeOwner,inventory:copy(model.identity.inventory),regionId:unitId,call:source(call.anchor)},counts={actualInputs:call.ports.length,internalInputs:inside.length,boundaryInputs:refs.length};
  const inspect=options.inspect||I.open,controller=new AbortController();let disposed=false,busy=false,active=null,serial=0,last=null,peakRows=0,peakBytes=0,peakLeases=0;
  const live=()=>{demand(!disposed,'disposed');if(controller.signal.aborted)throw controller.signal.reason||Error('Call input page cancelled');if(options.signal?.aborted)throw options.signal.reason||Error('Call input page cancelled');};
  function dispose(){if(disposed)return;disposed=true;serial++;controller.abort();active?.dispose();active=null;last=null;options.signal?.removeEventListener('abort',dispose);}options.signal?.addEventListener('abort',dispose,{once:true});
  function structural(ref){const p=call.ports[ref.slot];return{call:callId,slot:p.slot,kind:p.slot===0?'function':'argument',role:p.role,visibility:p.visibility,sourceKind:p.externalBinder?'original-binder':p.knownProducer===null?'original-fragment':'application-result',knownProducer:p.knownProducer,inputAddress:source(p.input),producerAddress:source(p.producer),binderAddress:p.externalBinder?source(p.externalBinder):null,sourceOrigin:{kind:p.externalBinder?'original-binder':'original-producer',address:source(p.externalBinder?{node:p.externalBinder.node,route:p.externalBinder.route}:p.producer),contextLength:p.externalBinder?null:p.producerContextLength},producerContextLength:p.producerContextLength,consumerContextLength:p.consumerContextLength,definitionHops:p.hops.map(h=>({...copy(h),use:source(h.use),binder:source(h.binder),value:source(h.value)})),nativeOwner:model.identity.nativeOwner,typeStatus:'unavailable',parameter:null,inputText:null,producerText:null,producerTypeText:null,expectedTypeText:null,producerTypeAddress:null,expectedTypeAddress:null};}
  async function page(offset=0){
   live();demand(!busy,'another call input page is loading');demand(Number.isSafeInteger(offset)&&offset>=0&&offset%4===0&&(offset<refs.length||offset===0),'input page offset');busy=true;const version=++serial;last=null;const rows=[];let size=0;
   try{for(const ref of refs.slice(offset,offset+4)){live();const row=structural(ref),p=call.ports[ref.slot];
     if(model.mode==='native'){
      const lease=await inspect(descriptor,call,ref.slot,{signal:controller.signal});if(disposed||version!==serial){lease.dispose();live();throw Error('Call boundary: retired page');}active=lease;peakLeases=1;
      try{const detail=lease.getDetail(),n=detail.node;
       demand(detail.typeStatus==='recorded-native'&&detail.owner===model.identity.nativeOwner&&detail.call===callId&&detail.slot===ref.slot&&n.slot===ref.slot,'original native input query');
       demand(M.same(detail.result.address,source(call.anchor))&&detail.result.contextLength===call.result.contextLength&&detail.result.role===call.result.role,'original result and consumer context');
       demand(M.same(n.address,row.producerAddress)&&M.same(n.inputAddress,row.inputAddress)&&M.same(n.externalBinder,row.binderAddress)&&M.same(n.hops,row.definitionHops)&&n.contextLength===row.producerContextLength&&n.role===p.role&&n.visibility===p.visibility,'source/role/visibility/context bridge');
       const producer=n.typeAddress,expected=n.inputTypeAddress;
       for(const [at,component]of[[producer,'producerType'],[expected,'inputType']])demand(at?.namespace==='application-ports'&&at.evidenceSha256===model.identity.nativeOwner&&at.sourceIndexSha256===model.identity.source.indexSha256&&at.input===callId+':'+ref.slot&&at.component===component&&M.same(at.query,call.anchor.route)&&at.route.root===component&&at.route.slots.length===0,'separate original computed type roots');
       const pi=lease.info(producer),ei=lease.info(expected);
       demand(pi.ambientContextLength===row.producerContextLength&&ei.ambientContextLength===row.consumerContextLength&&pi.text===n.typeText&&typeof ei.text==='string','original and consumer type contexts');
       demand(typeof n.text==='string'&&typeof n.inputText==='string'&&(ref.slot===0?n.parameter===null:typeof n.parameter==='string'),'recorded term text and parameter');
       Object.assign(row,{typeStatus:'recorded-native',parameter:n.parameter,inputText:n.inputText,producerText:n.text,producerTypeText:pi.text,expectedTypeText:ei.text,producerTypeAddress:copy(producer),expectedTypeAddress:copy(expected)});
      }finally{active?.dispose();active=null;}
     }
     size+=bytes(row).length;demand(size<=4194304,'4 MiB call-summary budget');rows.push(row);
    }
    live();demand(version===serial,'retired page');peakRows=Math.max(peakRows,rows.length);peakBytes=Math.max(peakBytes,size);last={format:'ProofAtlasCallBoundaryPage/1',identity:copy(identity),mode:model.mode,call:callId,counts:copy(counts),offset,total:refs.length,limit:4,rows,bytes:size,previous:offset?Math.max(0,offset-4):null,next:offset+4<refs.length?offset+4:null,scope:'Every role at this call’s region boundary, in original slot order. Internal input positions remain source-use wires. Recorded expected types are in the consumer context; original producer types retain their own contexts and addresses. No common-context sequent or premise-necessity claim.'};return copy(last);
   }catch(error){last=null;throw error;}finally{active?.dispose();active=null;busy=false;}
  }
  try{live();}catch(error){dispose();throw error;}return Object.freeze({page,dispose,state:()=>({disposed,busy,mode:model.mode,call:callId,counts:copy(counts),retainedRows:last?.rows.length||0,retainedBytes:last?.bytes||0,rowLimit:4,byteLimit:4194304,activeNativeLeases:active?1:0,peakNativeLeases:peakLeases,peakRows,peakBytes,retainedNativeGraphs:active?'one existing inspector window':0,wholeNativeRecordRequested:false,wholeSourceArchiveRequested:false})});
 }
 const api={open};if(node)module.exports=api;else host.ProofAtlasCallBoundary=api;
})(typeof window==='undefined'?globalThis:window);
