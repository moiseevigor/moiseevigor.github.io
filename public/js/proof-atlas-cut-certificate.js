/* A sparse source cut. Independent validation needs the immutable source packet. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,L=node?require('./proof-atlas-boundary-ledger'):host.ProofAtlasBoundaryLedger;
 const limits=Object.freeze({entries:3072,cards:32,routeDepth:512,encodedBytes:8388608,countDigits:4096});
 const demand=(ok,message)=>{if(!ok)throw Error('Source cut record: '+message);},key=slots=>slots.join('.'),copy=r=>({root:r.root,slots:[...r.slots]}),below=(r,p)=>r.root===p.root&&p.slots.length<=r.slots.length&&p.slots.every((s,i)=>r.slots[i]===s);
 const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x,same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
 function amount(x){demand(typeof x==='string'&&x.length<=limits.countDigits&&/^(0|[1-9]\d*)$/.test(x),'source count encoding or bound');return BigInt(x);}
 function route(r){demand(Number.isInteger(r?.root)&&r.root>=0&&Array.isArray(r.slots)&&r.slots.length<=limits.routeDepth&&r.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'source route bound');return copy(r);}
 function extendsScope(kind,slot){return((kind===6||kind===7)&&slot===1)||kind===8&&slot===2;}
 function freeze(value){const work=[value],seen=new WeakSet();while(work.length){const next=work.pop();if(!next||typeof next!=='object'||seen.has(next))continue;seen.add(next);Object.freeze(next);work.push(...Object.values(next).filter(v=>v&&typeof v==='object'));}return value;}
 function create(scene,data,record,{maxEntries=limits.entries,maxBytes=limits.encodedBytes}={}){
  demand(Number.isInteger(maxEntries)&&maxEntries>=1&&maxEntries<=limits.entries&&Number.isInteger(maxBytes)&&maxBytes>=1024&&maxBytes<=limits.encodedBytes,'record bounds');
  demand(data.serialization==='ExprDAG/1'&&scene.source?.name===record.name&&scene.source.indexSha256===record.indexSha256&&scene.source.sourceSha256===record.sourceSha256&&data.declaration.name===record.name,'source identity');
  demand(/^[a-f0-9]{64}$/.test(record.indexSha256)&&/^[a-f0-9]{64}$/.test(record.sourceSha256),'source hashes');
  demand(['source-expression','kernel-rule'].includes(scene.root?.namespace),'source namespace');
  const root=route(scene.root.route);demand(A.walk(data,root)===scene.root.node&&A.path(data,root)===scene.root.path,'source root');
  demand(scene.root.namespace===(data.declaration.rootPaths[root.root].startsWith('root.rule.')?'kernel-rule':'source-expression'),'source namespace does not match original root');
  demand(Array.isArray(scene.nodes)&&scene.nodes.length>=1&&scene.nodes.length<=limits.cards,'card bound');
  const encoder=new TextEncoder();let accounted=1024;const charge=x=>{accounted+=encoder.encode(JSON.stringify(x)).length+64;demand(accounted<=maxBytes,'encoded record bound');};
  const source={name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256};charge(source);charge(root);
  const cards=[],cardRoots=new Map();
  for(const n of scene.nodes){const r=route(n.route);demand(below(r,root)&&A.walk(data,r)===n.node&&A.path(data,r)===n.id,'card source occurrence');const k=key(r.slots.slice(root.slots.length));demand(!cardRoots.has(k),'duplicate card root');const card={id:n.id,node:n.node,route:r,retained:amount(n.retainedOccurrences).toString()};charge(card);cardRoots.set(k,cards.length);cards.push(card);}
  demand(cardRoots.get('')===0,'displayed root card');
  const external=[],context=[];let id=data.roots[root.root];
  for(let depth=0;depth<root.slots.length;depth++){
   const slot=root.slots[depth],kind=data.kind[id];demand(A.fields[A.kinds[kind]]?.[slot],'root source field');
   if(extendsScope(kind,slot)){const r={root:root.root,slots:root.slots.slice(0,depth)},binder={node:id,kind:A.kinds[kind],route:r};charge(binder);external.push(binder);context.push({...binder,target:{external:external.length-1}});}
   id=data.children[id][slot];
  }
  const ledger=L.create(scene,data),holes=new Map();
  for(const h of ledger.rows){demand(below(h.route,root),'hidden root outside selected source');const relative=h.route.slots.slice(root.slots.length);holes.set(key(relative),h);}
  const entries=[],seenCards=new Set(),seenHoles=new Set(),owned=cards.map(()=>0),parents=new Map();let hidden=0n,retained=0n,variables=0;
  function visit(node,slots,ctx,owner){
   demand(entries.length<maxEntries&&root.slots.length+slots.length<=limits.routeDepth,'source cut entry or route bound');
   const k=key(slots),at={root:root.root,slots:[...root.slots,...slots]};if(cardRoots.has(k))owner=cardRoots.get(k);demand(Number.isInteger(owner),'unowned source occurrence');
   const hole=holes.get(k),i=entries.length;
   if(hole){demand(!cardRoots.has(k)&&hole.node===node&&hole.origin.path===cards[owner].id,'hidden root owner');const row={tag:'hole',node,slots,occurrences:amount(data.expanded[node]).toString(),owner};charge(row);entries.push(row);seenHoles.add(k);hidden+=amount(row.occurrences);return i;}
   const kind=data.kind[node],children=data.children[node],fields=A.fields[A.kinds[kind]]||[];demand(A.kinds[kind]&&children.length===fields.length,'kernel constructor fields');
   const row={tag:'node',node,slots,constructor:A.kinds[kind],owner,children:[]};
   if(kind===0){const index=data.payloads[node].index;demand(Number.isSafeInteger(index)&&index>=0,'bound variable index');row.binding={index,target:ctx.at(-1-index)?.target||null};variables++;}
   charge(row);entries.push(row);owned[owner]++;retained++;
   if(cardRoots.has(k)){
    const n=scene.nodes[owner];demand(same(n.context,ctx.map(b=>({node:b.node,kind:b.kind,path:A.path(data,b.route),route:b.route}))),'card lexical context');
    seenCards.add(owner);if(owner!==0){const previous=slots.slice(0,-1);while(!cardRoots.has(key(previous)))previous.pop();parents.set(owner,cardRoots.get(key(previous)));}
   }
   for(let slot=0;slot<children.length;slot++){
    let next=ctx;if(extendsScope(kind,slot))next=[...ctx,{node,kind:A.kinds[kind],route:at,target:{entry:i}}];
    row.children.push(visit(children[slot],[...slots,slot],next,owner));
   }
   return i;
  }
  visit(scene.root.node,[],context,0);
  demand(seenCards.size===cards.length&&seenHoles.size===holes.size,'inaccessible card or hidden root');
  for(let i=0;i<cards.length;i++)demand(String(owned[i])===cards[i].retained,'card ownership count');
  demand(retained===amount(scene.stats.retainedOccurrences)&&hidden===amount(scene.stats.hidden)&&retained+hidden===amount(data.expanded[scene.root.node])&&retained+hidden===amount(scene.stats.represented),'complete source partition');
  demand(scene.edges.length===cards.length-1,'display edge inventory');
  for(let i=1;i<cards.length;i++){
   const p=parents.get(i),edges=scene.edges.filter(e=>e.from===cards[i].id&&e.to===cards[p].id);demand(edges.length===1,'display edge source parent');
   const ports=scene.nodes[p].ports.filter(port=>port.child===cards[i].id);demand(ports.length===1&&same(ports[0].route,cards[i].route)&&ports[0].node===cards[i].node&&ports[0].field===edges[0].port,'display edge source port');
   demand(ports[0].scopeExtension===scene.nodes[i].context.length-scene.nodes[p].context.length&&edges[0].scopeExtension===ports[0].scopeExtension,'display edge lexical extension');
  }
  const binderSlots=new Map();for(let owner=0;owner<cards.length;owner++)if(['context-frame','introduction-telescope'].includes(scene.nodes[owner].rule)){let slot=0;for(const [i,row]of entries.entries())if(row.tag==='node'&&row.owner===owner&&['lam','forallE','letE'].includes(row.constructor))binderSlots.set(i,++slot);}
  const expectedLinks=[];
  for(const row of entries)if(row.binding?.target){
   const target=row.binding.target,binder=target.entry!==undefined?entries[target.entry]:external[target.external],binderRoute=target.entry!==undefined?{root:root.root,slots:[...root.slots,...binder.slots]}:binder.route;
   const at={root:root.root,slots:[...root.slots,...row.slots]},from=A.path(data,at);demand(from===cards[row.owner].id,'variable inside unsupported compound card');
   const inside=target.entry!==undefined,display=inside?cards[binder.owner].id:null,slot=inside?binderSlots.get(target.entry)||null:null;
   if(inside&&!slot)demand(same(cards[binder.owner].route,binderRoute),'binder inside unsupported compound card');
   expectedLinks.push({from,to:A.path(data,binderRoute),node:binder.node,route:binderRoute,relation:'source-bound-to',namespace:scene.root.namespace==='kernel-rule'?'kernel-rule-context':'proof-context',boundary:!inside,...(scene.foldIntroductions||scene.foldContextFrames?{displayTo:display,binderSlot:slot}:{})});
  }
  const linkFields=l=>({from:l.from,to:l.to,node:l.node,route:l.route,relation:l.relation,namespace:l.namespace,boundary:l.boundary,...(scene.foldIntroductions||scene.foldContextFrames?{displayTo:l.displayTo,binderSlot:l.binderSlot}:{})});
  demand(same(scene.links.map(linkFields).sort((a,b)=>a.from.localeCompare(b.from)),expectedLinks.sort((a,b)=>a.from.localeCompare(b.from))),'displayed lexical links');
  const result={format:'ProofAtlasSourceCutRecord/1',source,root:{node:scene.root.node,route:root,namespace:scene.root.namespace},limits:{...limits,entries:maxEntries,encodedBytes:maxBytes},cards,external,entries,stats:{retained:String(retained),hidden:String(hidden),represented:String(retained+hidden),variables,boundVariables:expectedLinks.length},scope:'Structural source cut and lexical links of a previously validated scene. Native typing and semantic interpretation are not checked by this record.'};
  const bytes=encoder.encode(JSON.stringify(result)).length;demand(bytes<=maxBytes,'encoded record bound');return freeze(result);
 }
 function validate(certificate,scene,data,record){demand(same(certificate,create(scene,data,record,{maxEntries:certificate.limits.entries,maxBytes:certificate.limits.encodedBytes})),'changed source cut record');return true;}
 // Both inputs must already be checked against their source packet.
 function refinement(before,after){
  demand(before.format==='ProofAtlasSourceCutRecord/1'&&after.format===before.format&&same(before.source,after.source)&&same(before.root,after.root),'refinement source identity');
  demand(before.entries.length<=limits.entries&&after.entries.length<=limits.entries,'refinement entry bound');
  const next=new Map(after.entries.filter(e=>e.tag==='node').map(e=>[key(e.slots),e]));
  function binding(e,c){if(!e.binding)return null;const t=e.binding.target;if(!t)return{index:e.binding.index,target:null};const b=t.entry!==undefined?c.entries[t.entry]:c.external[t.external];return{index:e.binding.index,node:b.node,route:t.entry!==undefined?{root:c.root.route.root,slots:[...c.root.route.slots,...b.slots]}:b.route};}
  let kept=0;for(const e of before.entries)if(e.tag==='node'){const n=next.get(key(e.slots));demand(n&&n.node===e.node&&n.constructor===e.constructor&&same(binding(e,before),binding(n,after)),'previously visible source path lost or changed');kept++;}
  const holes=new Set(before.entries.filter(e=>e.tag==='hole').map(e=>key(e.slots)));
  for(const e of after.entries)if(e.tag==='hole')demand(e.slots.some((_,i)=>holes.has(key(e.slots.slice(0,i))))||holes.has(key(e.slots)),'new hidden region outside previous holes');
  const delta=amount(after.stats.retained)-amount(before.stats.retained);demand(delta>=0n&&delta===amount(before.stats.hidden)-amount(after.stats.hidden)&&before.stats.represented===after.stats.represented,'refinement transfer');
  return{format:'ProofAtlasSourceCutRefinement/1',source:before.source,root:before.root,preservedPaths:kept,newPaths:delta.toString(),transferredOccurrences:delta.toString(),scope:'Pointwise comparison of source-validated cuts; no new kernel typing is inferred.'};
 }
 const api={create,validate,refinement,limits};if(node)module.exports=api;else host.ProofAtlasCutCertificate=api;
})(typeof window==='undefined'?globalThis:window);
