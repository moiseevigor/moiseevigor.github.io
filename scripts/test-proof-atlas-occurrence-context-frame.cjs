/* Independent original-route, ordered-scope, type-origin and partition checks. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),F=require('../public/js/proof-atlas-occurrence-context-frame'),P=require('../public/js/proof-atlas-packed-routes'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','deep-typing-manifest','occurrence-constructions-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const {library,types}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
const raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864});
const slots=r=>{const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3);};
const pack=r=>P.encode(r.root,r.slots);
const equal=(a,b)=>assert.deepEqual({root:a.root,slots:slots(a)},b);
function at(data,route){let node=data.roots[route.root];const context=[];for(const [i,s]of route.slots.entries()){
 if(([6,7].includes(data.kind[node])&&s===1)||(data.kind[node]===8&&s===2))context.push({node,route:{root:route.root,slots:route.slots.slice(0,i)}});
 node=data.children[node][s];assert.notEqual(node,undefined);
}return{node,context};}
let frames=0,starts=0,mixed=0,long=0,headers=0,typeActions=0,links=0,localLinks=0,maxBytes=0,refusals=0,controlFrames=0,maxInitialContext=0,dependentBodyComponents=0;
const rows=[];let saved,linkSaved;
function expectedChain(c,entry,limit){const result=[];let e=entry;
 while(e&&result.length<limit){const rule=T.construction(e,c.data);if(!rule||!['Pi-introduction','let-binding'].includes(rule.rule))break;
  result.push(rule);const part=rule.premises.at(-1),next=c.get(part.route),nextRule=next&&T.construction(next,c.data);
  if(!nextRule||nextRule.entry.role!==part.role||nextRule.entry.contextLength!==part.contextLength||!T.expressionEqual(rule.entry.typeData,part.typeRoot,nextRule.entry.typeData,nextRule.entry.typeData.roots[0]))break;e=next;
 }return result;}
async function audit(c,entry,limit,checkTypes=false){
 const model=F.open(c),frame=model.create(entry.route,{maxMembers:limit}),expected=expectedChain(c,entry,limit),root={root:entry.route.root,slots:slots(entry.route)},points=[];
 assert.equal(frame.members.length,expected.length);assert.equal(frame.context.initialLength,at(c.data,root).context.length);assert.equal(frame.context.finalLength,frame.context.initialLength+expected.length);
 maxInitialContext=Math.max(maxInitialContext,frame.context.initialLength);
 let bodyRoute=root;
 for(const [i,rule]of expected.entries()){
  const m=frame.members[i],actual=at(c.data,bodyRoute);assert.equal(m.node,actual.node);assert.equal(m.rule,rule.rule);assert.equal(m.contextLength,actual.context.length);equal(model.resolve(frame,{member:i}),bodyRoute);
  assert.equal(m.binder.kind,rule.rule==='let-binding'?'local-definition':'assumption');assert.equal(m.binder.name,rule.rule==='let-binding'?c.data.payloads[m.node].declName:c.data.payloads[m.node].binderName);assert.equal(typeof m.binder.name,'string');assert.deepEqual(m.checks,rule.checks);
  const recording=m.recording.query;assert.deepEqual({root:root.root,slots:[...root.slots.slice(0,recording.prefixDepth),...recording.slots]},{root:rule.recording.queryRoute.root,slots:slots(rule.recording.queryRoute)});
  const firstOrigin=frame.origins[m.type.origin];assert.equal(firstOrigin.evidenceSha256,rule.entry.evidenceSha256);assert.equal(firstOrigin.typeTableSha256,rule.entry.typeTableSha256);assert.equal(m.type.root,rule.entry.typeData.roots[0]);assert.equal(m.components.status,'recorded-type-expressions-only');
  for(const [name,root]of Object.entries(rule.components)){const ref=m.components.expressions[name];assert.equal(ref.root,root);assert.equal(ref.origin,m.type.origin);const contextLength=actual.context.length+(rule.rule==='Pi-introduction'&&name==='expectedBody'?1:0);assert(rule.entry.typeData.neededScope[root]<=contextLength);assert.deepEqual(ref.context,rule.rule==='Pi-introduction'&&name==='expectedBody'?{member:i,field:'body'}:{member:i});if(rule.entry.typeData.neededScope[root]>actual.context.length)dependentBodyComponents++;}
  if(checkTypes){const type=await model.typeFor(frame,{member:i});assert.equal(type.node,m.node);assert.equal(type.typeData.roots[0],m.type.root);assert.equal(type.contextLength,m.contextLength);typeActions++;}
  for(const [j,part]of rule.premises.slice(0,-1).entries()){
   const p=frame.headers.find(p=>p.address.member===i&&p.address.field===part.field);assert(p);const r={root:root.root,slots:[...bodyRoute.slots,j]};equal(model.resolve(frame,p.address),r);assert.equal(p.node,at(c.data,r).node);assert.equal(p.contextLength,actual.context.length);points.push({point:p,route:r,part,rule});headers++;
  }
  bodyRoute={root:root.root,slots:[...bodyRoute.slots,rule.rule==='let-binding'?2:1]};
 }
 equal(model.resolve(frame,{member:expected.length}),bodyRoute);points.push({point:frame.continuation,route:bodyRoute,part:expected.at(-1).premises.at(-1),rule:expected.at(-1)});
 const frontier=points.map(x=>x.route.slots);for(let i=0;i<frontier.length;i++)for(let j=0;j<frontier.length;j++)if(i!==j)assert(!(frontier[i].length<=frontier[j].length&&frontier[i].every((s,k)=>s===frontier[j][k])));
 let hidden=0n;
 for(const {point:p,route:r,part,rule}of points){
  const actual=at(c.data,r);assert.equal(p.node,actual.node);assert.equal(p.contextLength,actual.context.length);assert.equal(p.expanded,c.data.expanded[p.node]);assert.equal(p.role,part.role);assert.equal(p.type.root,part.typeRoot);assert.deepEqual(p.type.context,p.address);hidden+=BigInt(p.expanded);
  const origin=frame.origins[p.type.origin];assert.equal(origin.namespace,'computed-native-type');assert.equal(origin.evidenceSha256,rule.entry.evidenceSha256);
  if(c.data.kind[p.node]===0){const target=actual.context.at(-1-c.data.payloads[p.node].index),link=frame.links.find(l=>JSON.stringify(l.from)===JSON.stringify(p.address));assert(target&&link);equal(model.resolve(frame,link.target),target.route);assert.equal(link.node,target.node);assert.equal(link.countContribution,'0');assert.equal(link.bindingClass,c.data.kind[target.node]===8?'local-definition':'assumption');links++;if(link.bindingClass==='local-definition')localLinks++;}
  if(checkTypes){const type=await model.typeFor(frame,p.address);assert.equal(type.node,p.node);equal(type.route,r);assert.equal(type.contextLength,p.contextLength);assert.equal(type.typeData.roots[0],p.type.root);assert.equal(type.evidenceSha256,origin.evidenceSha256);typeActions++;}
 }
 assert.equal(frame.stats.hidden,String(hidden));assert.equal(frame.stats.retained,String(expected.length));assert.equal(hidden+BigInt(expected.length),BigInt(c.data.expanded[entry.node]));assert.equal(frame.stats.represented,c.data.expanded[entry.node]);assert(frame.origins.length<=2);
 const expanded=model.expand(frame);assert.equal(expanded.nodes.length,expected.length);assert.equal(expanded.frontiers.length,points.length);assert.equal(expanded.edges.length,expected.reduce((s,c)=>s+c.premises.length,0));assert.deepEqual(expanded.stats,frame.stats);
 for(const e of expanded.edges){const parent=expanded.nodes[e.from.member],route=model.resolve(frame,e.from),slot=(parent.rule==='let-binding'?['type','value','body']:['binderType','body']).indexOf(e.field);assert(slot>=0);assert.deepEqual(model.resolve(frame,e.to),P.append(route,[slot]));}
 model.validate(JSON.parse(JSON.stringify(frame)));maxBytes=Math.max(maxBytes,Buffer.byteLength(JSON.stringify(frame)));assert(maxBytes<=F.limits.metadataBytes);assert(frame.headers.length+1<=129);frames++;if(frame.links.length)linkSaved={model,frame};return{model,frame,c,entry};
}
(async()=>{
 for(const d of types.records){const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),bytes=raw(record.indexFile);let pkg=await T.recorded(bytes,raw(d.file),d,record);
  const ld=h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x=>x.edition===d.edition&&x.name===record.name&&x.indexSha256===record.indexSha256);if(ld)pkg=T.mergeRecorded(pkg,await T.recordedLets(bytes,raw(ld.file),ld,record));
  const c=pkg.case(record.name);
  for(const entry of c.entries){const construction=T.construction(entry,c.data);if(!construction||!['Pi-introduction','let-binding'].includes(construction.rule))continue;starts++;
   for(const limit of [1,4,13,32,64]){const result=await audit(c,entry,limit,limit===64);if(limit===64){const frame=result.frame;if(frame.members.length>13)long++;if(new Set(frame.members.map(m=>m.rule)).size>1)mixed++;rows.push({edition:d.edition,name:d.name,root:frame.root,members:frame.members.length,stop:frame.stop,represented:frame.stats.represented,bytes:Buffer.byteLength(JSON.stringify(frame))});if(frame.members.length===57)saved=result;}}
  }
 }
 const controls=T.mergeControls(await T.prepare(JSON.parse(raw(h.PROOF_ATLAS_DEEP_TYPING.file)),h.PROOF_ATLAS_DEEP_TYPING),await T.prepareConstructions(JSON.parse(raw(h.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS.file)),h.PROOF_ATLAS_OCCURRENCE_CONSTRUCTIONS));
 for(const c of controls.cases)for(const e of c.entries){if(T.construction(e,c.data)?.rule!=='Pi-introduction')continue;await audit(c,e,64,true);controlFrames++;}
 assert(saved);const {model,frame,entry,c}=saved,reject=f=>{assert.throws(f);refusals++;},refuse=async f=>{await assert.rejects(f);refusals++;};
 for(const maxMembers of [0,65,1.5,NaN])reject(()=>model.create(entry.route,{maxMembers}));
 reject(()=>F.open({...c,data:structuredClone(c.data)}));reject(()=>model.resolve(structuredClone(frame),{member:0}));reject(()=>model.expand(structuredClone(frame)));
 for(const address of [{member:-1},{member:58},{member:57,field:'body'},{member:0,field:'value'},{member:0,field:'unknown'},{prefixDepth:frame.root.route.depth},{member:0,extra:0}])reject(()=>model.resolve(frame,address));
 for(const change of [s=>s.members[0].contextLength++,s=>s.members[0].binder.kind='local-definition',s=>s.headers[0].type.root++,s=>s.continuation.address.member--,s=>s.origins[0].namespace='source',s=>s.members.reverse(),s=>s.stats.hidden='0',s=>s.source.indexSha256='0'.repeat(64)]){const bad=structuredClone(frame);change(bad);reject(()=>model.validate(bad));}
 await refuse(()=>model.typeFor(frame,{member:57,field:'body'}));await refuse(()=>model.typeFor(frame,{member:0},'unsupported'));
 assert(linkSaved);for(const change of [s=>s.links[0].target={member:s.members.length},s=>s.headers[0].contextLength++]){const bad=structuredClone(linkSaved.frame);change(bad);reject(()=>linkSaved.model.validate(bad));}
 assert.equal(starts,269);assert.equal(long,61);assert.equal(mixed,45);assert.equal(frames,starts*5+controlFrames);
 assert(maxInitialContext>=10000);assert(dependentBodyComponents>0);
 const report={status:'PASS',scope:'Finite native-compatible context-frame model; not a renderer, native consumer proof or whole-proof typing claim',starts,frames,controlFrames,longerThanThirteen:long,mixedChains:mixed,headerAppearances:headers,typedBoundaryActions:typeActions,binderLinkAppearances:links,localDefinitionLinks:localLinks,maxInitialContext,dependentBodyComponents,maxSceneBytes:maxBytes,refusals,newNativeJudgments:0,rows};
 fs.writeFileSync(process.env.ATLAS_CONTEXT_FRAME_REPORT||'/tmp/atlas-occurrence-context-frame.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
