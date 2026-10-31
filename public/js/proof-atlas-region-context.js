/* Lazy lexical context projection. This operation supplies no inferred type. */
(function(host){
 'use strict';
 const rule='ordered-lexical-context-projection/1',limits=Object.freeze({context:512,path:512,metadataBytes:4194304,vertices:4}),copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const demand=(v,m)=>{if(!v)throw Error('Region context: '+m);},nat=n=>Number.isSafeInteger(n)&&n>=0;
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 async function prepare(graph,support,scene,{signal}={}){
  let disposed=false,cursor=null,headers=[],kept=[],witnesses=[],direct=[],metadataBytes=0,headerReads=0,coefficientReads=0;
  const live=()=>{if(signal?.aborted)throw signal.reason||Error('Cancelled');demand(!disposed,'released');};
  const charge=value=>{metadataBytes+=new TextEncoder().encode(JSON.stringify(value)).length;demand(metadataBytes<=limits.metadataBytes,'header/witness metadata bound');};
  try{
   cursor=await graph.context(scene.component,scene.locator.slots,{signal});live();
   demand(same(cursor.region.root.address,scene.root.address)&&['tableNode','kind','expanded','neededScope'].every(k=>cursor.region.root[k]===scene.root[k])&&same(cursor.region.root.payload,scene.root.payload),'selected occurrence');const depth=cursor.region.depth;demand(nat(depth)&&depth<=limits.context,'context bound');
   const summary=await support.summary(scene.root.tableNode,scene.root.expanded,scene.root.neededScope,{signal});coefficientReads++;live();
   demand(summary.owner.nativeCaseSha256===graph.header.nativeCaseSha256&&summary.owner.nativeInventorySha256===graph.header.nativeInventorySha256,'coefficient/native owner');
   if(scene.root.address.namespace==='corpus-definition-boundary')demand(summary.owner.graphManifestSha256===scene.root.address.manifestSha256,'computed graph owner');
   const retain=Array(depth).fill(false);witnesses=Array(depth).fill(null);
   for(const {index,count}of summary.free){const slot=depth-1-index;demand(slot>=0&&slot<depth,'term support outside context');retain[slot]=true;direct.push(slot);const witness={role:'term',count,origin:scene.root.address};charge(witness);witnesses[slot]=witness;}
   for(let slot=depth-1;slot>=0;slot--){
    if(!retain[slot])continue;live();const header=await cursor.header(slot,{signal});headerReads++;live();demand(header.ordinal===slot,'header ordinal');
    charge(header);headers.push(header);
    for(const field of header.fields){
     demand(field.role==='binderType'||header.kind==='letE'&&field.role==='letValue','header field role');
     const s=await support.summary(field.tableNode,field.expanded,field.neededScope,{signal});coefficientReads++;live();demand(same(s.owner,summary.owner),'header coefficient owner');
     for(const {index,count}of s.free){const target=slot-1-index;demand(target>=0&&target<slot,'header dependency is not earlier');if(!retain[target]){retain[target]=true;const witness={role:field.role,count,origin:field.address,via:slot};charge(witness);witnesses[target]=witness;}}
    }
   }
   headers.sort((a,b)=>a.ordinal-b.ordinal);kept=headers.map(h=>h.ordinal);direct.sort((a,b)=>a-b);demand(kept.length===retain.filter(Boolean).length,'closure completeness');
   const positions=new Map(kept.map((slot,i)=>[slot,i])),origin=copy(scene.root.address),base=copy(scene.locator),owner=freeze(copy(summary.owner));
   const projectIndex=(index,internal,ambientDepth,prefixLength)=>{demand(nat(index)&&nat(internal),'index/cutoff');if(index<internal)return index;const slot=ambientDepth-1-(index-internal),position=positions.get(slot);demand(position!==undefined&&position<prefixLength,'omitted referenced context entry');return internal+prefixLength-1-position;};
   function address(original,relativeSlots,part){return{namespace:'region-context-projection',rule,region:origin,keptSlots:copy(kept),part:copy(part),relativeSlots:copy(relativeSlots),original:copy(original),coefficientOwner:owner};}
   async function inspectPart(part,relativeSlots=[],{signal:querySignal}={}){
    live();let at=base,ambientDepth=depth,prefixLength=kept.length;
    if(part.kind==='header'){const h=headers.find(h=>h.ordinal===part.slot),field=h?.fields.find(f=>f.role===part.role);demand(field,'retained header field');at=field.locator;ambientDepth=h.ordinal;prefixLength=positions.get(h.ordinal);}
    else demand(part.kind==='term','projection part');
    demand(Array.isArray(relativeSlots)&&relativeSlots.every(s=>nat(s)&&s<3)&&at.slots.length+relativeSlots.length<=limits.path,'relative path bound');
    const combined=signal&&querySignal?host.AbortSignal.any([signal,querySignal]):querySignal||signal;
    const cut=await graph.inspect(at.component,[...at.slots,...relativeSlots],{signal:combined});live();
    const internal=cut.contextDepth-ambientDepth;demand(internal>=0,'descendant scope');
    const index=i=>projectIndex(i,internal,ambientDepth,prefixLength),need=(n,c=internal)=>n<=c?n:projectIndex(n-1,c,ambientDepth,prefixLength)+1;
    const payload=copy(cut.root.payload);if(cut.root.kind==='bvar')payload.index=index(payload.index);
    const root={kind:cut.root.kind,payload,expanded:cut.root.expanded,neededScope:need(cut.root.neededScope),address:address(cut.root.address,relativeSlots,part),original:copy(cut.root.address),originalIndex:cut.root.kind==='bvar'?cut.root.payload.index:null};
    const children=cut.children.map(child=>{const slot=child.slot,binds=(cut.root.kind==='lam'||cut.root.kind==='forallE')&&slot===1||cut.root.kind==='letE'&&slot===2,relative=[...relativeSlots,slot];return{slot,field:child.field,kind:child.kind,expanded:child.expanded,neededScope:need(child.scope,internal+Number(binds)),relativeSlots:relative,address:address(child.address,relative,part)};});
    let binding=null;if(cut.binding){const targetPath=cut.binding.locator.slots,inside=targetPath.length>=at.slots.length&&at.slots.every((slot,i)=>slot===targetPath[i]);binding={relation:'same-original-binder',address:copy(cut.binding.address),locator:copy(cut.binding.locator),projectedAddress:inside?address(cut.binding.address,targetPath.slice(at.slots.length),part):{namespace:'region-context-entry',rule,region:origin,keptSlots:copy(kept),original:copy(cut.binding.address)}};}
    return freeze({root,children,binding,part:copy(part),relativeSlots:copy(relativeSlots),internalBinders:internal,contextDepth:prefixLength+internal,parent:relativeSlots.length?relativeSlots.slice(0,-1):null,originalLocator:copy(cut.locator),stats:{vertices:1+children.length,represented:root.expanded,hiddenOccurrences:cut.stats.hiddenOccurrences},typing:'unavailable'});
   }
   const inspect=(relative=[],options={})=>inspectPart({kind:'term'},relative,options),inspectHeader=(slot,role,relative=[],options={})=>inspectPart({kind:'header',slot,role},relative,options);
   const api=Object.freeze({inspect,inspectHeader,contextPage:(page=0)=>{live();demand(nat(page)&&page<Math.max(1,Math.ceil(headers.length/4)),'context page');return freeze(headers.slice(page*4,page*4+4).map(header=>({...copy(header),projectedIndex:kept.length-1-positions.get(header.ordinal),why:copy(witnesses[header.ordinal])})));},
    state:()=>({disposed,origin:copy(origin),originalEntries:depth,retainedEntries:kept.length,omittedEntries:depth-kept.length,keptSlots:copy(kept),directSlots:copy(direct),headerReads,coefficientReads,metadataBytes,limits,typing:'unavailable'}),
    dispose:()=>{disposed=true;cursor?.dispose();cursor=null;headers=[];kept=[];direct=[];witnesses=[];positions.clear();metadataBytes=0;graph=null;support=null;scene=null;}});
   return api;
  }catch(e){cursor?.dispose();headers=[];kept=[];witnesses=[];throw e;}
 }
 const api={prepare,limits,rule};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasRegionContext=api;
})(typeof window==='undefined'?globalThis:window);
