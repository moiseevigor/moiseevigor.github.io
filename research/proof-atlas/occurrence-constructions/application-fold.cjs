/* Reversible application-spine grouping of attested construction cuts. */
'use strict';
const C=require('../../../public/js/proof-atlas-occurrence-constructions');
const T=require('../../../public/js/proof-atlas-deep-context');
const demand=(v,m)=>{if(!v)throw Error('Application spine fold: '+m);};
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function fold(input,memberLimit=13){
 demand(input.format==='ProofAtlasOccurrenceConstructionCut/1','primitive scene format');
 demand(Number.isInteger(memberLimit)&&memberLimit>=1&&memberLimit<=13,'member limit');
 const byId=new Map(input.nodes.map(n=>[n.id,n])),claimed=new Set(),groups=[],owner=new Map();
 const child=(id,field)=>input.edges.find(e=>e.from===id&&e.field===field);
 // Source nodes are emitted parent before child by the primitive breadth-first cut.
 for(const outer of input.nodes){
  if(claimed.has(outer.id))continue;
  const chain=[outer];let tip=outer;
  while(tip.rule==='Pi-application'&&chain.length<memberLimit){
   const edge=child(tip.id,'fn'),next=byId.get(edge?.to);
   if(!next||next.rule!=='Pi-application')break;
   demand(!claimed.has(next.id),'member already assigned');chain.push(next);tip=next;
  }
  const id='g'+groups.length,members=chain.slice().reverse();
  for(const member of members){claimed.add(member.id);owner.set(member.id,id);}
  const group={id,address:outer.address,node:outer.node,kind:outer.kind,role:outer.role,contextLength:outer.contextLength,depth:outer.depth,
   rule:members.length>1?'Pi-application-spine':outer.rule,retained:String(members.length),members};
  if(outer.rule==='Pi-application'){
   group.ports=[{field:'head',member:tip.id,sourceField:'fn',original:child(tip.id,'fn')},
    ...members.map((m,i)=>({field:'arg'+(i+1),slot:i+1,member:m.id,sourceField:'arg',original:child(m.id,'arg')}))];
   group.headIsApplication=(byId.get(group.ports[0].original.to)||input.frontiers.find(p=>p.id===group.ports[0].original.to))?.kind==='app';
   group.slotBasis=group.headIsApplication?'relative-to-retained-suffix':'complete-source-spine';
  }else group.ports=['binderType','body'].map(field=>({field,member:outer.id,sourceField:field,original:child(outer.id,field)}));
  demand(group.ports.every(p=>p.original),'ordered primitive ports');groups.push(group);
 }
 const edges=[];
 for(const group of groups)for(const port of group.ports){const edge=port.original;edges.push({from:group.id,to:owner.get(edge.to)||edge.to,field:port.field,sourceFrom:edge.from,sourceField:edge.field,sourceTo:edge.to,relation:edge.relation});delete port.original;}
 const result=freeze({format:'ProofAtlasApplicationSpineCut/1',addressing:input.addressing,source:input.source,root:input.root,options:input.options,memberLimit,
  nodes:groups,frontiers:input.frontiers,edges,sourceEdges:input.edges,links:input.links,primitiveScope:input.scope,
  stats:{...input.stats,displayedRules:groups.length,applicationGroups:groups.filter(g=>g.rule==='Pi-application-spine').length},
  guarantee:'Reversible grouping of recorded construction cuts. Every retained application remains a member. Ports retain exact source fields; no rewriting or additional typing judgments.'});
 demand(Buffer.byteLength(JSON.stringify(result))<=65536,'metadata bound');return result;
}
function unfold(scene){
 demand(scene?.format==='ProofAtlasApplicationSpineCut/1','folded scene format');
 return {format:'ProofAtlasOccurrenceConstructionCut/1',addressing:scene.addressing,source:scene.source,root:scene.root,options:scene.options,
  nodes:scene.nodes.flatMap(n=>n.members).sort((a,b)=>Number(a.id.slice(1))-Number(b.id.slice(1))),frontiers:scene.frontiers,edges:scene.sourceEdges,links:scene.links,
  stats:{retained:scene.stats.retained,hidden:scene.stats.hidden,represented:scene.stats.represented},scope:scene.primitiveScope};
}
function open(nativeCase){
 const model=C.open(nativeCase),scenes=new WeakMap();
 function create(route,options={},memberLimit=13){const primitive=model.create(route,options),scene=fold(primitive,memberLimit);scenes.set(scene,primitive);return scene;}
 function validate(scene){model.validate(unfold(scene));demand(canonical(fold(unfold(scene),scene.memberLimit))===canonical(scene),'fold differs from primitive rules');return true;}
 function origin(scene,groupId,memberId){demand(scenes.has(scene),'foreign folded scene');const group=scene.nodes.find(n=>n.id===groupId);demand(group,'group identity');const member=group.members.find(m=>m.id===memberId);demand(member,'member identity');return {primitive:scenes.get(scene),member};}
 function stageFor(scene,groupId,memberId){
  const o=origin(scene,groupId,memberId),route=model.routeFor(o.primitive,o.member.id),c=T.construction(nativeCase.get(route),nativeCase.data);
  demand(c?.rule==='Pi-application','application member');
  const entry=c.entry;
  const ref=root=>({...o.member.typeReference,root}),pi=c.components.pi;
  demand(entry.typeData.kind[pi]===7,'native normalized Pi: '+nativeCase.name+' e'+entry.node+' root '+pi+' kind '+entry.typeData.kind[pi]);
  // Type roots remain in the original shared table; this does not copy the table
  // or create inferred judgments at descendants of a computed type expression.
  return freeze({sourceRoute:route,sourceNode:entry.node,contextLength:entry.contextLength,recording:o.member.recording,
   roles:{function:c.premises[0].role,argument:c.premises[1].role,result:entry.role},
   binderInfo:entry.typeData.payloads[pi].binderInfo,
   types:{before:ref(c.premises[0].typeRoot),argument:ref(c.premises[1].typeRoot),after:ref(entry.typeData.roots[0]),
    ...Object.fromEntries(Object.entries(c.components).map(([name,root])=>[name,ref(root)])),
    ...(c.premises[1].alternateTypeRoot!==undefined?{metaArgument:ref(c.premises[1].alternateTypeRoot)}:{})},
   texts:{before:c.premises[0].typeText,argument:c.premises[1].typeText,after:entry.typeText},checks:c.checks});
 }
 return Object.freeze({create,validate,unfold,stageFor,routeFor:(scene,groupId,memberId)=>{const o=origin(scene,groupId,memberId);return model.routeFor(o.primitive,o.member.id);},typeFor:(scene,groupId,memberId)=>{const o=origin(scene,groupId,memberId);return model.typeFor(o.primitive,o.member.id);},resolve:C.resolveAddress});
}
module.exports={fold,unfold,open,canonical};
