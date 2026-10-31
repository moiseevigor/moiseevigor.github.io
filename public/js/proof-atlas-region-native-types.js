/* Finite native type judgments, matched to exact projected occurrences.
   One bounded type packet; no full native archive or proof graph is fetched. */
(function(host){
 'use strict';
 const isNode=typeof module!=='undefined'&&module.exports,A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const base='/public/data/proof-atlas/region-native-types/',limits=Object.freeze({registryBytes:524288,packetBytes:1048576,rows:32768,path:512,vertices:4});
 const demand=(ok,m)=>{if(!ok)throw Error('Region native types: '+m);},nat=n=>Number.isSafeInteger(n)&&n>=0,hex=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s),copy=v=>JSON.parse(JSON.stringify(v));
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const judgments=['kernelOriginalTyping','kernelProjectedOpenTyping','kernelClosedExpectedType','kernelRecoveryConversion','kernelEqualityWitness','literalInverse'];
 function open(registry,header,{fetcher=host.fetch.bind(host),signal,notationCatalog=host.PROOF_ATLAS_TYPE_NOTATION}={}){
  demand(registry?.format==='ProofAtlasRegionTypeRegistry/1'&&Array.isArray(registry.profiles)&&registry.profiles.length<=32,'registry');
  demand(new TextEncoder().encode(JSON.stringify(registry)).length<=limits.registryBytes,'registry byte bound');
  const profiles=registry.profiles.filter(p=>p.nativeCaseSha256===header.nativeCaseSha256&&p.nativeInventorySha256===header.nativeInventorySha256&&same(p.source,header.source)&&p.id===header.id);
  demand(profiles.length<=1,'unique native owner');const profile=profiles[0]?freeze(copy(profiles[0])):null;
  if(profile){demand(hex(profile.graphManifestSha256)&&Array.isArray(profile.entries)&&profile.entries.length<=512,'profile');for(const e of profile.entries)demand(hex(e.sha256)&&nat(e.bytes)&&e.bytes>0&&e.bytes<=limits.packetBytes&&e.file===base+e.sha256+'.json.gz'&&nat(e.record),'packet descriptor');}
  let disposed=false,packet=null,loaded=null,active=null,pending=null,epoch=0,loads=0,peakRows=0,peakBytes=0;
  const live=s=>{demand(!disposed,'released');if(signal?.aborted||s?.aborted)throw signal?.reason||s.reason||Error('Cancelled');};
  function match(cut){
   live();const a=cut?.root?.address;if(!profile||a?.namespace!=='region-context-projection'||a.rule!=='ordered-lexical-context-projection/1'||a.relativeSlots?.length!==0)return null;
   const owner=a.coefficientOwner;if(owner?.nativeCaseSha256!==profile.nativeCaseSha256||owner.nativeInventorySha256!==profile.nativeInventorySha256||owner.graphManifestSha256!==profile.graphManifestSha256)return null;
   const entries=profile.entries.filter(e=>same(e.region,a.region)&&same(e.keptSlots,a.keptSlots)&&same(e.part,a.part));demand(entries.length<=1,'unique region');return entries[0]||null;
  }
  async function read(e,s){
   live(s);const combined=signal?host.AbortSignal.any([signal,s]):s,response=await fetcher(e.file,{signal:combined});demand(response.ok,'asset unavailable ('+response.status+')');
   const reader=response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(),parts=[];let total=0;
   try{while(true){live(s);const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.byteLength;demand(total<=e.bytes&&total<=limits.packetBytes,'decoded byte bound');parts.push(chunk.value);}}
   catch(error){await reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
   demand(total===e.bytes,'decoded size');const raw=new Uint8Array(total);let offset=0;for(const part of parts){raw.set(part,offset);offset+=part.length;}
   demand(await A.digest(raw)===e.sha256,'packet hash');live(s);return JSON.parse(new TextDecoder().decode(raw));
  }
  function validate(p,e,cut){
   demand(p.format==='ProofAtlasRegionTypePacket/1'&&same(p.owner,{source:profile.source,id:profile.id,nativeCaseSha256:profile.nativeCaseSha256,nativeInventorySha256:profile.nativeInventorySha256,graphManifestSha256:profile.graphManifestSha256}),'packet owner');
   const q=p.query,a=cut.root.address;demand(q.id===e.record&&same(q.regionAddress,a.region)&&same(q.originalAddress,a.original)&&same(q.baseKeptSlots,a.keptSlots)&&same(q.part,a.part),'exact projection match');
   demand(p.contextLetNondep===false&&nat(p.originalDepth)&&p.originalDepth<=512&&p.retainedDepth===q.keptSlots.length&&p.retainedDepth<=p.originalDepth,'context sizes/annotations');
   demand(q.keptSlots.every((s,i)=>nat(s)&&s<p.originalDepth&&(i===0||q.keptSlots[i-1]<s)),'ordered context');
   demand(judgments.every(k=>p.judgments[k]==='PASS')&&hex(p.evidence.recordSha256)&&hex(p.evidence.archiveSha256)&&hex(p.evidence.nativeVerificationSha256)&&p.evidence.record===q.id,'recorded judgments');
   demand(Array.isArray(p.frames)&&p.frames.length===p.originalDepth&&p.frames.every((f,i)=>f.ordinal===i&&['lam','forallE','letE'].includes(f.kind)&&typeof f.name==='string'&&f.name.length<=4096&&f.locator.component===q.component&&Array.isArray(f.locator.slots)&&f.locator.slots.length<=512),'context directory');
   const g=p.types,n=g?.kind?.length;demand(g?.serialization==='ExprDAG/1'&&nat(n)&&n>0&&n<=limits.rows&&['children','payloads','expanded','neededScope'].every(f=>g[f]?.length===n)&&g.roots?.length===2,'type DAG shape');
   const depths=[];for(let i=0;i<n;i++){
    const k=g.kind[i],cs=g.children[i];demand(nat(k)&&k<12&&Array.isArray(cs)&&cs.length===(A.fields[A.kinds[k]]||[]).length&&cs.every(c=>nat(c)&&c<i),'ordered fields');A.payloadKey(k,g.payloads[i]);
    depths[i]=Math.max(0,...cs.map(c=>depths[c]+1));demand(depths[i]<=512,'type depth');
    demand(typeof g.expanded[i]==='string'&&g.expanded[i].length<=4096&&/^[1-9]\d*$/.test(g.expanded[i])&&BigInt(g.expanded[i])===1n+cs.reduce((s,c)=>s+BigInt(g.expanded[c]),0n),'type occurrences');
    const needed=k===0?g.payloads[i].index+1:Math.max(0,...cs.map((c,s)=>g.neededScope[c]-Number(binds(k,s))));demand(nat(needed)&&needed===g.neededScope[i],'type lexical scope');
   }
   demand(g.roots.every(r=>nat(r)&&r<n)&&g.neededScope[g.roots[0]]<=p.originalDepth&&g.neededScope[g.roots[1]]<=p.retainedDepth,'type root contexts');
   return freeze(p);
  }
  function start(task){
   active=task;(async()=>{try{live(task.controller.signal);const value=validate(await read(task.entry,task.controller.signal),task.entry,task.cut);live(task.controller.signal);demand(task.epoch===epoch,'superseded');packet=value;loaded=task.entry;loads++;peakRows=Math.max(peakRows,value.types.kind.length);peakBytes=Math.max(peakBytes,task.entry.bytes);task.resolve(record());}
   catch(e){task.reject(e);}finally{active=null;const next=pending;pending=null;if(next)start(next);}})();
  }
  function release(){epoch++;packet=null;loaded=null;active?.controller.abort(Error('Superseded native type query'));pending?.reject(Error('Superseded native type query'));pending=null;}
  function load(cut,{signal:s}={}){
   try{live(s);const entry=match(cut);release();if(!entry)return Promise.resolve(null);const controller=new AbortController();
    const combined=host.AbortSignal.any([controller.signal,...(s?[s]:[]),...(signal?[signal]:[])]);
    // A task owns only this combined signal; the controller remains cancellable.
    return new Promise((resolve,reject)=>{const task={entry,cut:freeze(copy(cut)),epoch,resolve,reject,controller:{signal:combined,abort:reason=>controller.abort(reason)}};if(active)pending=task;else start(task);});
   }catch(e){return Promise.reject(e);}
  }
  function record(){live();return packet?freeze({query:copy(packet.query),evidence:copy(packet.evidence),judgments:copy(packet.judgments),originalDepth:packet.originalDepth,retainedDepth:packet.retainedDepth,contextLetNondep:false}):null;}
  function inspect(slots=[],{typeRoot=1}={}){
   live();demand(packet,'no loaded record');demand((typeRoot===0||typeRoot===1)&&Array.isArray(slots)&&slots.length<=512&&slots.every(s=>nat(s)&&s<3),'type path');
   const g=packet.types;let node=g.roots[typeRoot],scope=[];
   for(let i=0;i<slots.length;i++){const slot=slots[i];demand(slot<g.children[node].length,'type field');if(binds(g.kind[node],slot))scope.push({node,slots:slots.slice(0,i)});node=g.children[node][slot];}
   const address=(id,path)=>({namespace:'region-native-type',nativeCaseSha256:profile.nativeCaseSha256,recordSha256:packet.evidence.recordSha256,packetSha256:loaded.sha256,query:packet.query.id,typeRoot,node:id,slots:copy(path)});
   function summary(id){let args=0,metadata=0,work=0;while(++work<=512){if(g.kind[id]===10){metadata++;id=g.children[id][0];}else if(g.kind[id]===5){args++;id=g.children[id][0];}else break;}const head=g.kind[id]===4?g.payloads[id].name:A.kinds[g.kind[id]];return head+(args?' · '+args+' arguments':'')+(metadata?' · metadata wrapper':'');}
   const root={kind:A.kinds[g.kind[node]],payload:g.payloads[node],expanded:g.expanded[node],neededScope:g.neededScope[node],address:address(node,slots)},children=slots.length<512?g.children[node].map((id,slot)=>({slot,field:A.fields[root.kind][slot],kind:A.kinds[g.kind[id]],summary:summary(id),expanded:g.expanded[id],relativeSlots:[...slots,slot],address:address(id,[...slots,slot])})):[];
   let binding=null;if(root.kind==='bvar'){
    const index=root.payload.index;if(index<scope.length){const local=scope[scope.length-1-index];binding={relation:'type-local-binder',name:g.payloads[local.node].binderName||g.payloads[local.node].declName||'_',address:address(local.node,local.slots),relativeSlots:copy(local.slots)};}
    else{const ambient=index-scope.length,originalSlot=typeRoot===0?packet.originalDepth-1-ambient:packet.query.keptSlots[packet.retainedDepth-1-ambient],frame=packet.frames[originalSlot];demand(frame,'ambient binder');binding={relation:'original-context-binder',name:frame.name,address:frame.address,locator:frame.locator};}
   }
   // A bounded raw-syntax preview, without notation recovery or implicit-argument
   // hiding. It never expands the complete occurrence tree to obtain a label.
   const names=(typeRoot===0?packet.frames:packet.query.keptSlots.map(s=>packet.frames[s])).map(f=>f.name).concat(scope.map(s=>g.payloads[s.node].binderName||g.payloads[s.node].declName||'_'));
   const todo=[{node,names,depth:0}],parts=[];let chars=0,visits=0,truncated=false;
   const emit=text=>{const room=640-chars;if(text.length>room){parts.push(text.slice(0,room));chars=640;truncated=true;}else{parts.push(text);chars+=text.length;}};
   while(todo.length&&chars<640){const item=todo.pop();if(typeof item==='string'){emit(item);continue;}if(visits>=512){truncated=true;break;}visits++;if(item.depth>24){emit('…');truncated=true;continue;}
    const id=item.node,k=g.kind[id],p=g.payloads[id],cs=g.children[id],child=(s,bound=false)=>({node:cs[s],names:bound?[...item.names,p.binderName||p.declName||'_']:item.names,depth:item.depth+1});
    if(k===0)emit((item.names[item.names.length-1-p.index]||'?')+'[#'+p.index+']');
    else if(k===3)emit('Sort '+A.levelText(p.level));
    else if(k===4)emit(p.name+(p.levels.length?'.{'+p.levels.map(A.levelText).join(', ')+'}':''));
    else if(k===5)todo.push(')',child(1),' ',child(0),'(');
    else if(k===6||k===7)todo.push(child(1,true),k===6?' => ':', ',child(0),' : ',p.binderName||'_',k===6?'fun ':'∀ ');
    else if(k===8)todo.push(child(2,true),'; ',child(1),' := ',child(0),' : ',p.declName||'_','let ');
    else if(k===10)todo.push(child(0),'[metadata] ');
    else if(k===11)todo.push(')',child(0),'(',p.typeName+'['+p.index+'] ');
    else if(k===9)emit(p.literalKind==='natVal'?String(p.value):JSON.stringify(p.value));
    else emit(A.kinds[k]+' '+p.id);
   }
   if(todo.length)truncated=true;
   const notationEngine=isNode?require('./proof-atlas-type-notation'):host.ProofAtlasTypeNotation;
   let notation=null;if(notationEngine&&notationCatalog?.parentNativeVerificationSha256===packet.evidence.nativeVerificationSha256){
    const ambient=(typeRoot===0?packet.frames:packet.query.keptSlots.map(s=>packet.frames[s])).map(f=>({name:f.name,address:f.address,locator:f.locator,relation:'original-context-binder'})),local=scope.map(s=>({name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(s.node,s.slots),slots:s.slots,relation:'type-local-binder'}));
    notation=notationEngine.scene(g,node,notationCatalog,{slots,context:[...ambient,...local],address});
   }
   return freeze({root,children,binding,relativeSlots:copy(slots),parent:slots.length?slots.slice(0,-1):null,contextDepth:(typeRoot===0?packet.originalDepth:packet.retainedDepth)+scope.length,stats:{vertices:1+children.length,represented:root.expanded,hiddenOccurrences:String(BigInt(root.expanded)-BigInt(1+children.length))},preview:{text:parts.join('')+(truncated?'…':''),truncated,visited:visits},notation,typing:'type-syntax-only'});
  }
  return Object.freeze({match,load,record,inspect,release,state:()=>({disposed,loaded:!!packet,query:packet?.query.id??null,cachedRows:packet?.types.kind.length||0,cachedBytes:packet?loaded.bytes:0,loads,peakRows,peakBytes,active:!!active,pending:!!pending,limits}),dispose:()=>{release();disposed=true;}});
 }
 const api={open,limits,base};if(isNode)module.exports=api;else host.ProofAtlasRegionNativeTypes=api;
})(typeof window==='undefined'?globalThis:window);
