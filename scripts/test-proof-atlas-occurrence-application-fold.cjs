/* Independent source-field, context, partition and reversible-fold audit. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict');
const repo=path.resolve(__dirname,'..'),js=path.join(repo,'public/js/');
const T=require(js+'proof-atlas-deep-context'),P=require(js+'proof-atlas-packed-routes'),S=require('../research/proof-atlas/occurrence-constructions/application-fold.cjs');
const h={};for(const name of ['deep-typing-manifest','occurrence-constructions-manifest','library-manifest','occurrence-types-manifest','goedel-sample-manifest'])vm.runInNewContext(fs.readFileSync(path.join(repo,'public/data/proof-atlas/'+name+'.js'),'utf8'),{window:h});
const raw=file=>z.gunzipSync(fs.readFileSync(path.join(repo,file)),{maxOutputLength:67108864}),read=d=>JSON.parse(raw(d.file));
const slots=r=>{const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3);};
const decode=(root,a)=>({root:root.root,slots:[...slots(root).slice(0,a.prefixDepth??root.depth),...(a.slots||[])]});
const key=r=>r.root+':'+r.slots.join('.');
function at(data,r){let node=data.roots[r.root];const context=[];r.slots.forEach((slot,d)=>{if((data.kind[node]===6||data.kind[node]===7)&&slot===1||data.kind[node]===8&&slot===2)context.push({node,slots:r.slots.slice(0,d)});node=data.children[node][slot];assert.notEqual(node,undefined);});return{node,context};}
let scenes=0,groups=0,members=0,links=0,maxBytes=0,selectedInner=0,partialGroups=0,refusals=0,componentViews=0,stageInterfaces=0,amgm=null;
function audit(scene,data){
 const root=scene.root.route,allMembers=scene.nodes.flatMap(g=>g.members),points=[...allMembers,...scene.frontiers],byId=new Map(points.map(p=>[p.id,p])),addresses=new Set();let retained=0;
 for(const p of points){const route=decode(root,p.address),walk=at(data,route);assert.equal(walk.node,p.node);assert.equal(walk.context.length,p.contextLength);assert(!addresses.has(key(route)));addresses.add(key(route));}
 for(const group of scene.nodes){
  const outside=decode(root,group.address),last=group.members.at(-1);assert.deepEqual(decode(root,last.address),outside);assert.equal(group.retained,String(group.members.length));retained+=group.members.length;
  if(last.kind==='app'){
   assert.equal(group.ports.length,group.members.length+1);const headEdge=scene.edges.find(e=>e.from===group.id&&e.field==='head'),head=byId.get(headEdge.sourceTo),headRoute=decode(root,head.address);
   assert.deepEqual(headRoute,{root:outside.root,slots:[...outside.slots,...Array(group.members.length).fill(0)]});assert.equal(group.headIsApplication,data.kind[head.node]===5);assert.equal(group.slotBasis,group.headIsApplication?'relative-to-retained-suffix':'complete-source-spine');
   if(group.headIsApplication)partialGroups++;
   for(let i=0;i<group.members.length;i++){
    const member=group.members[i],route=decode(root,member.address),original=at(data,route);assert.equal(data.kind[member.node],5);assert.deepEqual(route,{root:outside.root,slots:[...outside.slots,...Array(group.members.length-1-i).fill(0)]});assert.equal(original.context.length,group.contextLength);
    const edge=scene.edges.find(e=>e.from===group.id&&e.field==='arg'+(i+1)),port=group.ports.find(p=>p.slot===i+1);assert(edge&&port);assert.equal(edge.sourceFrom,member.id);assert.equal(edge.sourceField,'arg');assert.equal(port.member,member.id);assert.equal(port.sourceField,'arg');const argument=byId.get(edge.sourceTo),argumentRoute=decode(root,argument.address);assert.deepEqual(argumentRoute,{root:route.root,slots:[...route.slots,1]});assert.equal(argument.contextLength,group.contextLength);
    for(const field of ['fn','arg'])assert.equal(scene.sourceEdges.filter(e=>e.from===member.id&&e.field===field).length,1);
   }
   if(group.members.length>1){groups++;members+=group.members.length;}
  }else{assert.equal(last.rule,'Pi-introduction');assert.equal(group.members.length,1);assert.deepEqual(group.ports.map(p=>p.field),['binderType','body']);}
 }
 let hidden=0n;for(const f of scene.frontiers)hidden+=BigInt(data.expanded[f.node]);assert.equal(String(retained),scene.stats.retained);assert.equal(String(hidden),scene.stats.hidden);assert.equal(BigInt(retained)+hidden,BigInt(data.expanded[scene.root.node]));assert.equal(scene.stats.represented,data.expanded[scene.root.node]);
 const frontierRoutes=scene.frontiers.map(f=>decode(root,f.address));for(let i=0;i<frontierRoutes.length;i++)for(let j=0;j<frontierRoutes.length;j++)if(i!==j)assert(!frontierRoutes[i].slots.every((s,k)=>s===frontierRoutes[j].slots[k]));
 for(const link of scene.links){const p=byId.get(link.from),r=decode(root,p.address),walk=at(data,r),binder=walk.context.at(-1-data.payloads[p.node].index);assert.equal(link.countContribution,'0');assert.equal(link.node,binder.node);assert.deepEqual(decode(root,link.address),{root:r.root,slots:binder.slots});links++;}
 assert(scene.nodes.length<=13);assert(retained<=13);assert(scene.nodes.every(g=>g.members.length<=scene.memberLimit));maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(scene)));assert(maxBytes<=65536);scenes++;
}
(async()=>{
 const controls=T.mergeControls(await T.prepare(read(h.PROOF_ATLAS_DEEP_TYPING),h.PROOF_ATLAS_DEEP_TYPING),await T.prepareConstructions(read(h.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS),h.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS));
 const {library,types}=require(js+'proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
 const cases=[...controls.cases];for(const d of types.records){const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),pkg=await T.recorded(raw(record.indexFile),raw(d.file),d,record);cases.push(pkg.case(record.name));}
 for(const c of cases){const model=S.open(c);for(const e of c.entries){if(!T.construction(e,c.data))continue;
  for(const maxNodes of [1,7,13])for(const memberLimit of [1,2,13]){const scene=model.create(e.route,{maxNodes,maxDepth:4},memberLimit);assert(model.validate(scene));assert.equal(S.canonical(S.fold(model.unfold(scene),memberLimit)),S.canonical(scene));audit(scene,c.data);}
  const scene=model.create(e.route,{maxNodes:13,maxDepth:4}),group=scene.nodes.find(g=>g.members.length>1);
  if(group){for(const member of group.members){assert.deepEqual(model.routeFor(scene,group.id,member.id),Croute(scene,member));const type=await model.typeFor(scene,group.id,member.id);assert.equal(type.typeData.roots[0],member.typeReference.root);assert.deepEqual(type.route,Croute(scene,member));componentViews++;
    const stage=model.stageFor(scene,group.id,member.id),native=T.construction(c.get(Croute(scene,member)),c.data);assert.equal(stage.contextLength,native.entry.contextLength);assert.deepEqual(stage.checks,native.checks);assert.deepEqual(stage.roles,{function:native.premises[0].role,argument:native.premises[1].role,result:native.entry.role});
    for(const [label,root]of Object.entries({...native.components,before:native.premises[0].typeRoot,argument:native.premises[1].typeRoot,after:native.entry.typeData.roots[0]})){assert.equal(stage.types[label].root,root);assert.equal(stage.types[label].namespace,'computed-native-type');assert.equal(stage.types[label].evidenceSha256,native.entry.evidenceSha256);assert.deepEqual(stage.types[label].contextAddress,member.address);}
    assert.equal(stage.binderInfo,native.entry.typeData.payloads[native.components.pi].binderInfo);stageInterfaces++;
   }
   // Selecting an inner application cannot import the enclosing arguments.
   const inside=group.members[0],insideRoute=model.routeFor(scene,group.id,inside.id),inner=model.create(insideRoute,{maxNodes:13,maxDepth:4});assert.deepEqual(inner.root.route,insideRoute);
   for(const point of [...inner.nodes.flatMap(g=>g.members),...inner.frontiers]){const absolute=decode(inner.root.route,point.address),prefix=slots(insideRoute);assert(absolute.slots.length>=prefix.length&&prefix.every((s,d)=>s===absolute.slots[d]));}selectedInner++;
  }
  if(c.name==='JacobiData.slope_bound_abs'&&e.node===1227){amgm={scene,sourceDepth:e.route.depth};assert.equal(scene.nodes[0].members.length,4);assert.equal(scene.stats.retained,'4');assert.equal(scene.stats.hidden,'165');assert.equal(scene.stats.represented,'169');assert.equal(scene.nodes[0].slotBasis,'complete-source-spine');}
 }}
 assert(amgm);const caseR=cases.find(c=>c.name==='JacobiData.slope_bound_abs'),model=S.open(caseR),entry=caseR.entries.find(e=>e.node===1227),scene=model.create(entry.route,{maxNodes:13,maxDepth:4});
 const reject=fn=>{assert.throws(fn);refusals++;};
 for(const change of [s=>s.nodes[0].members.reverse(),s=>s.nodes[0].ports.reverse(),s=>s.nodes[0].members[0].role='wrong',s=>s.nodes[0].slotBasis='relative-to-retained-suffix',s=>s.edges[0].sourceField='arg',s=>s.stats.hidden='164',s=>s.nodes[0].members.pop(),s=>s.source.indexSha256='0'.repeat(64)]){const bad=structuredClone(scene);change(bad);reject(()=>model.validate(bad));}
 reject(()=>model.create(entry.route,{},0));reject(()=>model.create(entry.route,{},14));reject(()=>model.routeFor(structuredClone(scene),scene.nodes[0].id,scene.nodes[0].members[0].id));reject(()=>model.routeFor(scene,scene.nodes[0].id,'foreign'));
 const report={status:'PASS',scope:'Reversible construction-cut grouping; not integrated into the browser',cases:cases.length,scenes,groupAppearances:groups,groupedMemberAppearances:members,originalBinderLinks:links,componentViews,stageInterfaces,selectedInner,partialGroupAppearances:partialGroups,maxSceneBytes:maxBytes,refusals,newNativeJudgments:0,amgm:{sourceDepth:amgm.sourceDepth,...amgm.scene.stats,stageCount:amgm.scene.nodes[0].members.length},wholeProofCoverage:false,humanComprehensionMeasured:false};
 const output=process.env.ATLAS_APPLICATION_FOLD_REPORT||'/tmp/atlas-application-spine-fold';fs.mkdirSync(output,{recursive:true});
 fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2)+'\n');fs.writeFileSync(path.join(output,'amgm.json'),JSON.stringify(amgm.scene,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1);});
function Croute(scene,member){return P.encode(scene.root.route.root,decode(scene.root.route,member.address).slots);}
