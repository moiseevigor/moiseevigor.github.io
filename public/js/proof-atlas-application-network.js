/* An occurrence cut of the recorded source-use graph, never a semantic proof DAG. */
(function(host) {
  'use strict';
  const isNode=typeof module!=='undefined'&&module.exports;
  const M=isNode?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const demand=(ok,message)=>{if(!ok)throw Error('Application network: '+message);};
  const hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
  const key=M.key, same=M.same;
  function validate(table,d) {
    demand(table?.format==='ProofAtlasApplicationNetwork/1'&&same(table.source,d.source)&&same(table.owner,d.owner),'source and native owner');
    demand(hash(table.nativeEvidenceSha256)&&table.nativeEvidenceSha256===d.topology.nativeEvidenceSha256,'native evidence identity');
    demand(table.calls.length===d.calls.length&&table.calls.length>0&&table.calls.length<=128,'finite call inventory');
    const routes=new Map(),counts={ports:0,known:0,unrecorded:0};
    for(const [index,c] of table.calls.entries()) {
      const original=d.calls[index];
      demand(c.index===index&&same(c.anchor,original.anchor)&&M.route(c.anchor.route)&&!routes.has(key(c.anchor.route)),'exact unique call occurrence');
      demand(c.arguments===original.arguments&&c.arguments>0&&c.arguments<=64&&c.functionLabel===original.functionLabel&&c.ports.length===c.arguments+1,'actual call ports');
      demand(['proof','type','value'].includes(c.result.role)&&Number.isInteger(c.result.contextLength)&&c.result.contextLength>=0&&typeof c.result.typeText==='string'&&c.result.typeText.length<=1024,'result summary');
      routes.set(key(c.anchor.route),index);
    }
    const outgoing=table.calls.map(()=>[]),indegree=table.calls.map(()=>0);
    for(const c of table.calls) for(const [slot,p] of c.ports.entries()) {
      const expected=d.calls[c.index].ports[slot];
      demand(p.id===c.index+':'+slot&&p.slot===slot&&same(p.input,expected.input),'ordered source input identity');
      demand(M.route(p.producer?.route)&&Number.isInteger(p.producer.node)&&p.producer.node>=0&&Number.isInteger(p.producerKind)&&p.producerKind>=0&&p.producerKind<12,'producer occurrence');
      demand(['proof','type','value'].includes(p.role)&&p.consumerContextLength===c.result.contextLength&&Number.isInteger(p.producerContextLength)&&p.producerContextLength>=0&&p.producerContextLength<=p.consumerContextLength,'source context prefix length');
      demand(slot===0?p.visibility===null:['default','implicit','strictImplicit','instImplicit'].includes(p.visibility),'visibility independent of role');
      demand(Array.isArray(p.hops)&&p.hops.length<=16&&typeof p.definitionBoundary==='boolean','binding path bounds');
      let previous=p.input;
      for(const hop of p.hops) {
        demand(same(previous,hop.use)&&M.route(hop.binder?.route)&&M.route(hop.value?.route)&&same(hop.value.route,{root:hop.binder.route.root,slots:[...hop.binder.route.slots,1]})&&typeof hop.nondep==='boolean','explicit ordered binding path');
        previous=hop.value;
      }
      demand(same(previous,p.producer),'source use terminates at producer');
      demand(p.externalBinder===null||M.route(p.externalBinder.route),'external binder boundary');
      const actual=routes.get(key(p.producer.route));
      demand(p.knownProducer===(actual===undefined?null:actual),'source route determines recorded producer');
      if(actual!==undefined) {
        demand(p.producerKind===5&&same(p.producer,table.calls[actual].anchor)&&p.producerContextLength===table.calls[actual].result.contextLength&&p.literalProducerResultType==='PASS','same source result and original context');
        demand(actual!==c.index,'self-cycle'); outgoing[actual].push(c.index); indegree[c.index]++; counts.known++;
      } else { demand(p.literalProducerResultType===null,'unrecorded producer has no result bridge'); counts.unrecorded++; }
      counts.ports++; demand(counts.ports<=1024,'finite port inventory');
    }
    // Parallel port edges remain separate, including repeated uses of one result.
    const ready=indegree.flatMap((n,i)=>n===0?[i]:[]);let visited=0;
    for(let cursor=0;cursor<ready.length;cursor++) { visited++; for(const next of outgoing[ready[cursor]])if(--indegree[next]===0)ready.push(next); }
    demand(visited===table.calls.length,'acyclic source-use inventory');
    return counts;
  }
  function address(table,anchor) {
    return {namespace:'source-expression',name:table.source.name,indexSha256:table.source.indexSha256,sourceSha256:table.source.sourceSha256,...copy(anchor)};
  }
  function create(table,d,selected,focus,limit=8) {
    const total=validate(table,d);
    demand(Number.isInteger(limit)&&limit>=1&&limit<=8&&Array.isArray(selected)&&selected.length>0&&selected.length<=limit&&new Set(selected).size===selected.length,'retained call budget');
    demand(selected.every(i=>Number.isInteger(i)&&table.calls[i])&&selected.includes(focus),'selected calls and focus');
    const ids=[...selected].sort((a,b)=>a-b),kept=new Set(ids),links=[],incoming=[],outgoing=[],boundaries=[];
    const accounting={retainedCalls:ids.length,hiddenCalls:table.calls.length-ids.length,internalPorts:0,incomingPorts:0,outgoingPorts:0,hiddenKnownPorts:0,visibleUnrecordedPorts:0,hiddenUnrecordedPorts:0,totalPorts:total.ports};
    for(const c of table.calls)for(const p of c.ports) {
      const visible=kept.has(c.index),producer=p.knownProducer,fromVisible=producer!==null&&kept.has(producer);
      const relation=p.hops.length?'binding-mediated-source-use':'direct-source-use';
      const wire={id:p.id,from:producer,to:c.index,slot:p.slot,role:p.role,visibility:p.visibility,relation,hops:p.hops.length,input:address(table,p.input),producer:address(table,p.producer)};
      if(producer===null) {
        if(visible){accounting.visibleUnrecordedPorts++;boundaries.push({...wire,kind:p.definitionBoundary?'definition-limit':p.externalBinder?'context-input':'unrecorded-fragment'});}
        else accounting.hiddenUnrecordedPorts++;
      } else if(visible&&fromVisible){links.push(wire);accounting.internalPorts++;}
      else if(visible){incoming.push(wire);accounting.incomingPorts++;}
      else if(fromVisible){outgoing.push(wire);accounting.outgoingPorts++;}
      else accounting.hiddenKnownPorts++;
    }
    // Rank is layout only; it carries no implication, necessity or mathematical distance.
    const ranks=new Map(ids.map(i=>[i,0]));
    for(let round=0;round<ids.length;round++)for(const e of links)ranks.set(e.to,Math.max(ranks.get(e.to),ranks.get(e.from)+1));
    const columns=new Map();const nodes=ids.map(id=>{const c=table.calls[id],rank=ranks.get(id),row=columns.get(rank)||0;columns.set(rank,row+1);return{id,address:address(table,c.anchor),label:c.functionLabel,result:copy(c.result),arguments:c.arguments,ports:c.ports.length,rank,row};});
    demand(accounting.totalPorts===accounting.internalPorts+accounting.incomingPorts+accounting.outgoingPorts+accounting.hiddenKnownPorts+accounting.visibleUnrecordedPorts+accounting.hiddenUnrecordedPorts,'exact port partition');
    return {format:'ProofAtlasApplicationNetworkScene/1',source:copy(table.source),owner:table.owner.sha256,focus,limit,nodes,links,incoming,outgoing,boundaries,accounting,scope:'A cut of explicitly recorded application occurrences. Ports count actual source fields, not disjoint syntax regions or necessary premises. Native type details are loaded separately for one selected port window.'};
  }
  function expand(table,d,scene,id) {
    demand(scene.source.indexSha256===table.source.indexSha256&&scene.owner===table.owner.sha256,'foreign cut');
    demand(same(scene,create(table,d,scene.nodes.map(n=>n.id),scene.focus,scene.limit)),'altered cut');
    const adjacent=[...scene.incoming.map(e=>e.from),...scene.outgoing.map(e=>e.to)];
    demand(adjacent.includes(id)&&!scene.nodes.some(n=>n.id===id),'expansion must cross this cut');
    return create(table,d,[...scene.nodes.map(n=>n.id),id],scene.focus,scene.limit);
  }
  function collapse(table,d,scene,id) {
    demand(same(scene,create(table,d,scene.nodes.map(n=>n.id),scene.focus,scene.limit)),'altered cut');
    demand(id!==scene.focus&&scene.nodes.some(n=>n.id===id),'cannot collapse focus or an absent call');
    return create(table,d,scene.nodes.filter(n=>n.id!==id).map(n=>n.id),scene.focus,scene.limit);
  }
  const api={validate,create,expand,collapse,address};
  if(isNode)module.exports=api;else host.ProofAtlasApplicationNetwork=api;
})(typeof window==='undefined'?globalThis:window);
