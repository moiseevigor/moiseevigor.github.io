/* One bounded topology and one existing typed-port window; no archive fallback. */
(function(host) {
  'use strict';
  const isNode=typeof module!=='undefined'&&module.exports;
  const A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
  const M=isNode?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
  const N=isNode?require('./proof-atlas-application-network'):host.ProofAtlasApplicationNetwork;
  const Q=isNode?require('./proof-atlas-application-port-pages'):host.ProofAtlasApplicationPortPages;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const demand=(ok,message)=>{if(!ok)throw Error('Application network pages: '+message);};
  async function open(d,options={}) {
    const part=d.topology;
    demand(part&&/^[a-f0-9]{64}$/.test(part.sha256)&&part.file==='/public/data/proof-atlas/application-network/'+part.sha256+'.json.gz'&&Number.isInteger(part.bytes)&&part.bytes>0&&part.bytes<=2097152,'topology address and decoded limit');
    let table=await A.compressed(part.file,part.sha256,{maxBytes:2097152,expectedBytes:part.bytes,signal:options.signal});
    N.validate(table,d);
    let disposed=false,scene=null,lease=null,controller=null,serial=0,detail=null,typedScene=null;
    const live=()=>{demand(!disposed,'disposed');if(options.signal?.aborted)throw options.signal.reason||Error('Network cancelled');};
    function clear(){serial++;controller?.abort();controller=null;lease?.dispose();lease=null;detail=typedScene=null;}
    function dispose(){if(disposed)return;clear();disposed=true;table=scene=null;options.signal?.removeEventListener('abort',dispose);}
    options.signal?.addEventListener('abort',dispose,{once:true});
    function focus(id){live();clear();scene=N.create(table,d,[id],id);return copy(scene);}
    focus(options.focus??0);
    async function inspect(call,slot) {
      live();demand(scene.nodes.some(n=>n.id===call)&&Number.isInteger(slot)&&table.calls[call]?.ports[slot],'visible actual port');
      clear();const current=serial;controller=new AbortController();
      const acquired=await Q.open(d,table.calls[call].anchor.route,{firstArgument:slot===0?0:Math.floor((slot-1)/4)*4,signal:controller.signal});
      if(disposed||current!==serial){acquired.dispose();throw Error('Application network pages: stale port');}
      try {
        lease=acquired;const typed=lease.create();typedScene=typed;const node=typed.nodes.find(n=>n.slot===slot),p=table.calls[call].ports[slot];
        demand(node&&M.same(node.address,N.address(table,p.producer))&&M.same(node.inputAddress,N.address(table,p.input))&&node.contextLength===p.producerContextLength&&node.role===p.role&&node.visibility===p.visibility,'native/source topology bridge');
        const original=a=>{const {namespace,name,indexSha256,sourceSha256,...anchor}=a;return anchor;};
        demand(M.same(node.hops.map(h=>({...h,use:original(h.use),binder:original(h.binder),value:original(h.value)})),p.hops),'native binding path bridge');
        detail={call,slot,node,result:typed.nodes[0],source:copy(p),owner:d.owner.sha256};return copy(detail);
      } catch(error){clear();throw error;}
    }
    function info(address){
      live();demand(lease,'no selected typed window');
      if(address.namespace==='source-expression')return lease.inspectSource(address);
      const observed=lease.computedInfo(address);
      if(address.component==='producerType'){
        const slot=Number(address.input.split(':')[1]),node=typedScene.nodes.find(n=>n.slot===slot);
        demand(node,'producer type context');
        return {...observed,ambientContextLength:node.contextLength,contextOrigin:{relation:'original-producer-context',source:copy(node.address)},consumerContextLength:typedScene.nodes[0].contextLength};
      }
      return {...observed,contextOrigin:{relation:'consumer-context',source:copy(typedScene.nodes[0].address)}};
    }
    function state(){return{format:'ProofAtlasApplicationNetworkState/1',disposed,topologyBytes:disposed?0:part.bytes,topologyLimit:2097152,inventoryCalls:disposed?0:table.calls.length,retainedCalls:scene?.nodes.length||0,callLimit:8,typedWindows:lease?1:0,detail:detail?{call:detail.call,slot:detail.slot}:null,selectedWindow:lease?.state()||null,wholeSourceArchiveRequested:false,wholeNativeRecordRequested:false};}
    return Object.freeze({getScene:()=>{live();return copy(scene);},getDetail:()=>detail?copy(detail):null,focus,expand:id=>{live();const next=N.expand(table,d,scene,id);clear();scene=next;return copy(scene);},collapse:id=>{live();const next=N.collapse(table,d,scene,id);clear();scene=next;return copy(scene);},inspect,info,state,release:clear,dispose});
  }
  const api={open};if(isNode)module.exports=api;else host.ProofAtlasApplicationNetworkPages=api;
})(typeof window==='undefined'?globalThis:window);
