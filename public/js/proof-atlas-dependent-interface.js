/* Context dependencies for one native recorded term/type pair. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-context-types'):host.ProofAtlasContextTypes;
class DependentInterfaceError extends Error{constructor(m){super('Dependent interface: '+m);}}
const demand=(v,m)=>{if(!v)throw new DependentInterfaceError(m);},hash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x),clone=x=>JSON.parse(JSON.stringify(x)),binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
function bits(mask,depth){demand(typeof mask==='string'&&/^(0|[1-9a-f][0-9a-f]{0,127})$/.test(mask),'support encoding');const n=BigInt('0x'+mask);demand((n>>BigInt(depth))===0n,'escaped support');return n;}
function indices(mask,depth){const n=bits(mask,depth),out=[];for(let i=0;i<depth;i++)if(n&(1n<<BigInt(i)))out.push(depth-1-i);return out.sort((a,b)=>a-b);}
function typeSupport(g,root,depth){const memo=[];for(let id=0;id<g.kind.length;id++){demand(g.kind[id]!==1&&g.kind[id]!==2,'unresolved recorded type');let found=g.kind[id]===0?1n<<BigInt(g.payloads[id].index):0n;for(let j=0;j<g.children[id].length;j++)found|=memo[g.children[id][j]]>>BigInt(binds(g.kind[id],j)?1:0);demand(found<(1n<<512n),'type support width');memo.push(found);}return bits(memo[root].toString(16),depth).toString(16);}
function plan(data,record,entry,evidence){
 demand(hash(record.indexSha256)&&hash(record.sourceSha256)&&hash(evidence?.sha256)&&evidence.name===record.name&&evidence.indexSha256===record.indexSha256&&evidence.sourceSha256===record.sourceSha256,'native evidence/source identity');
 const p=P.validate(entry,data),depth=p.retained.length;demand(depth<=512,'context bound');
 const ref=(node,route)=>({namespace:'original-packet',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,node,route:clone(route),path:A.path(data,route)}),requests=new Set([p.node]);
 const contexts=p.retained.map((b,slot)=>{const cs=data.children[b.node],domain=cs[0],value=data.kind[b.node]===8?cs[1]:null;requests.add(domain);if(value!==null)requests.add(value);return {slot,sourceBinder:ref(b.node,b.route),constructor:A.kinds[data.kind[b.node]],payload:clone(data.payloads[b.node]),domain:ref(domain,{root:b.route.root,slots:[...b.route.slots,0]}),value:value===null?null:ref(value,{root:b.route.root,slots:[...b.route.slots,1]})};});
 return {format:'ProofAtlasDependentInterfacePlan/1',source:ref(p.node,entry.state.route),nativeType:{namespace:'native-closed-context-type',evidenceSha256:evidence.sha256,originalRoute:clone(entry.state.route),graphRoot:entry.typeRoot,role:entry.role},universeContext:{namespace:'original-declaration-universe-context',sourceIndexSha256:record.indexSha256,parameters:clone(record.levelParams||[]),minimized:false},depth,contexts,typeMask:typeSupport(entry.graph,entry.typeRoot,depth),requests:[...requests]};
}
function complete(p,summaries){
 demand(p?.format==='ProofAtlasDependentInterfacePlan/1'&&p.depth<=512,'plan bounds');
 const known=new Map(summaries.map(s=>[s.node,s]));demand(known.size===summaries.length&&known.size===p.requests.length&&p.requests.every(id=>known.has(id)),'summary inventory');
 function read(node,depth){const s=known.get(node);demand(s&&s.indexSha256===p.source.indexSha256&&s.sourceSha256===p.source.sourceSha256&&s.width===512&&s.unresolved===false&&s.mask!==null,'known qualified summary');return bits(s.mask,depth).toString(16);}
 const termMask=read(p.source.node,p.depth),contexts=p.contexts.map(c=>({...clone(c),domainMask:read(c.domain.node,c.slot),valueMask:c.value?read(c.value.node,c.slot):null})),seed=new Set([...indices(termMask,p.depth),...indices(p.typeMask,p.depth)]),required=new Set(seed),reasons=new Map([...seed].map(j=>[j,[]]));
 for(let j=p.depth-1;j>=0;j--)if(required.has(j))for(const field of ['domainMask','valueMask'])if(contexts[j][field]!==null)for(const k of indices(contexts[j][field],j)){required.add(k);if(!reasons.has(k))reasons.set(k,[]);reasons.get(k).push({slot:j,field:field==='domainMask'?'binder-type':'let-value'});}
 const ordered=[...required].sort((a,b)=>a-b);for(const c of contexts){c.retained=required.has(c.slot);c.reducedSlot=c.retained?ordered.indexOf(c.slot):null;c.supportFromTerm=indices(termMask,p.depth).includes(c.slot);c.supportFromType=indices(p.typeMask,p.depth).includes(c.slot);c.headerReasons=reasons.get(c.slot)||[];}
 return {format:'ProofAtlasDependentInterface/1',namespace:'source-typing-interface',source:clone(p.source),nativeType:clone(p.nativeType),universeContext:clone(p.universeContext),originalDepth:p.depth,retainedSlots:ordered,omittedSlots:contexts.filter(c=>!c.retained).map(c=>c.slot),termMask,typeMask:p.typeMask,contexts,reducedContextTyping:'not-checked-by-this-operation',sharedTyping:'not-derived',guarantee:'Syntactic context closure for one original recorded term/type pair. Slot order and original binder references are preserved. This is not a shared typing judgment or a logical-necessity claim.'};
}
// Return an exact, bounded page of dependency edges. Large contexts stay paged.
function dependencies(model,origin,{offset=0,limit=16}={}){
 demand(model?.format==='ProofAtlasDependentInterface/1'&&Number.isInteger(offset)&&offset>=0&&Number.isInteger(limit)&&limit>=1&&limit<=16,'edge page bounds');let fields;
 if(origin==='term'||origin==='type')fields=[{field:origin==='term'?'term-support':'recorded-type-support',mask:origin==='term'?model.termMask:model.typeMask,depth:model.originalDepth}];
 else {demand(Number.isInteger(origin)&&origin>=0&&origin<model.originalDepth,'context origin');const c=model.contexts[origin];demand(c.retained,'omitted context origin');fields=[{field:'binder-type',mask:c.domainMask,depth:c.slot},...(c.valueMask===null?[]:[{field:'let-value',mask:c.valueMask,depth:c.slot}])];}
 let total=0;const edges=[];for(const f of fields)for(const slot of indices(f.mask,f.depth)){const target=model.contexts[slot];demand(target.retained,'incomplete context closure');if(total>=offset&&edges.length<limit)edges.push({from:origin,relation:f.field,targetSlot:slot,target:clone(target.sourceBinder)});total++;}return {origin,offset,limit,total,edges,remaining:Math.max(0,total-offset-edges.length)};
}
function validate(model,data,record,entry,evidence,summaries){demand(JSON.stringify(model)===JSON.stringify(complete(plan(data,record,entry,evidence),summaries)),'model differs from checked derivation');return true;}
const api={plan,complete,dependencies,validate,DependentInterfaceError};if(node)module.exports=api;else host.ProofAtlasDependentInterface=api;
})(typeof window==='undefined'?globalThis:window);
