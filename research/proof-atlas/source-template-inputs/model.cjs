/* Independent constructor reconstruction. Native binder domains and tuple
   universe annotations are observations; this module does not infer Lean types. */
'use strict';
const assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data'),{table}=require('../method-context/catalogue.cjs');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2,key=JSON.stringify;
function context(g,anchor){let id=g.roots[1],frames=[];for(const[depth,slot]of anchor.route.slots.entries()){if(binds(g.kind[id],slot))frames.push({node:id,slots:anchor.route.slots.slice(0,depth)});assert(slot<g.children[id].length);id=g.children[id][slot];}assert.equal(id,anchor.node);return frames;}
function audit(source,profile,observed){
 assert.equal(observed.status,'PASS');assert.equal(observed.constraintRule,'source-lambda-order/1');
 if(observed.status==='PASS'){assert.equal(observed.namespace,'region-source-template-function');assert.deepEqual(observed.members,profile.members);assert.deepEqual(observed.order,profile.order);}
 const t=table(),add=(k,p,cs=[])=>{assert(t.g.kind.length<131072,'model row bound');return t.add(k,p,cs);},symbol=name=>add(1,{id:name,idNameParts:[{str:name}]}),prefix=profile.commonContext.map((_,i)=>symbol('prefix-'+i)),bindings=[],syms=[],results=new Map(),types=new Map(),sourceValues=new Map(),sourceTypes=new Map();let copied=0;
 const importMemo=new WeakMap();
 function raw(g,root){let memo=importMemo.get(g);if(!memo){memo=new Map();importMemo.set(g,memo);}function read(id){if(memo.has(id))return memo.get(id);const n=add(g.kind[id],g.payloads[id],g.children[id].map(read));memo.set(id,n);return n;}return read(root);}
 function imported(g,root,scope){const memo=new Map();function read(id,depth=0){const key=id+':'+depth;if(memo.has(key))return memo.get(key);const k=g.kind[id],p=g.payloads[id];let n;
  if(k===0&&p.index>=depth){const position=scope.length-1-(p.index-depth);assert(position>=0&&position<scope.length,'native observation context');n=scope[position];}
  else n=add(k,p,g.children[id].map((c,s)=>read(c,depth+Number(binds(k,s)))));memo.set(key,n);return n;
 }return read(root);}
 const sourceMemo=new Map(),graphIds=new WeakMap();let graphNumber=0;
 function sourceAt(g,id,frames,depth=0){if(!graphIds.has(g))graphIds.set(g,graphNumber++);const cache=graphIds.get(g)+':'+id+':'+key(frames)+':'+depth;if(sourceMemo.has(cache))return sourceMemo.get(cache);assert(++copied<=262144,'source reconstruction work');const k=g.kind[id],p=g.payloads[id];let n;
  if(k===0&&p.index>=depth){const j=frames.length-1-(p.index-depth);assert(j>=0,'open original expression');if(j<prefix.length)n=prefix[j];else{const frame=frames[j],node=frame.node;assert.equal(source.kind[node],8,'unavailable local lambda');n=sourceAt(source,source.children[node][1],frames.slice(0,j),0);}}
  else n=add(k,p,g.children[id].map((c,s)=>sourceAt(g,c,frames,depth+Number(binds(k,s)))));sourceMemo.set(cache,n);return n;
 }
 function original(anchor){const frames=context(source,anchor);assert.deepEqual(frames.slice(0,prefix.length),profile.commonContext);return sourceAt(source,anchor.node,frames);}
 function abstract(root,scope){const positions=new Map(scope.map((id,i)=>[id,scope.length-1-i])),memo=new Map();function read(id,depth=0){const k=id+':'+depth;if(memo.has(k))return memo.get(k);let n;if(positions.has(id))n=add(0,{index:depth+positions.get(id)});else n=add(t.g.kind[id],t.g.payloads[id],t.g.children[id].map((c,s)=>read(c,depth+Number(binds(t.g.kind[id],s)))));memo.set(k,n);return n;}return read(root);}
 function project(root,oldSize,kept){const memo=new Map();function read(id,depth=0){const k=id+':'+depth;if(memo.has(k))return memo.get(k);const kind=t.g.kind[id],p=t.g.payloads[id];let payload=p;if(kind===0&&p.index>=depth){const slot=oldSize-1-(p.index-depth),j=kept.indexOf(slot);assert(j>=0,'required context omitted');payload={index:depth+kept.length-1-j};}const n=add(kind,payload,t.g.children[id].map((c,s)=>read(c,depth+Number(binds(kind,s)))));memo.set(k,n);return n;}return read(root);}
 function close(root,kept,pi=false){for(const j of [...kept].reverse()){const frame=source.kind[profile.commonContext[j].node],id=profile.commonContext[j].node,p=source.payloads[id],cs=source.children[id],before=kept.filter(k=>k<j),domain=project(raw(source,cs[0]),j,before);
  if(frame===8)root=add(8,{declName:p.declName,declNameParts:p.declNameParts,nondep:false},[domain,project(raw(source,cs[1]),j,before),root]);
  else root=add(pi?7:6,{binderName:p.binderName,binderNameParts:p.binderNameParts,binderInfo:p.binderInfo},[domain,root]);
 }return root;}
 function metadataFor(kind,i){return kind===6?{binderName:'input.'+i,binderNameParts:[{str:'input'},{num:String(i)}],binderInfo:'default'}:{declName:'result.'+i,declNameParts:[{str:'result'},{num:String(i)}],nondep:false};}
 function closeComputed(root){for(let i=bindings.length-1;i>=0;i--){const b=bindings[i];root=abstract(root,[syms[i]]);root=add(b.kind,metadataFor(b.kind,i),b.kind===6?[b.domain,root]:[b.domain,b.value,root]);}return root;}
 function application(g,id){let args=[];while(g.kind[id]===5){args.unshift(g.children[id][1]);id=g.children[id][0];}return{id,args};}
 const keys=observed.bindings.map(row=>row.key);assert.equal(new Set(keys).size,keys.length);
 const byKey=new Map(keys.map((key,i)=>[key,i])),byPort=new Map(),creation=[],callCounts=new Map();
 keys.forEach(key=>syms.push(symbol('binding-'+key)));
 for(const[i,row]of observed.bindings.entries()){
  const kind=row.port.kind;assert(['input','derived-input','result'].includes(kind));
  const scope=[...prefix,...syms.slice(0,i)],domain=imported(row.graph,row.graph.roots[0],scope),originalValue=imported(row.graph,row.graph.roots.at(-1),prefix),value=kind==='input'?undefined:imported(row.graph,row.graph.roots[1],scope);
  const portKey=kind==='result'?'result:'+row.port.call:'input:'+row.port.call+':'+row.port.slot;assert(!byPort.has(portKey));byPort.set(portKey,i);
  const record=profile.records.find(r=>r.index===row.port.call);assert(record);
  if(kind==='result')assert.equal(originalValue,original(record.anchor),'source result value');
  else{const port=record.ports[row.port.slot];assert(port);assert.deepEqual(row.port.source,port);assert.equal(originalValue,original(port.input),'source input value');}
  bindings.push({kind:kind==='input'?6:8,domain,value,originalValue});
 }
 let positions=0,internalUses=0,creationCount=0;
 for(const call of profile.order){
  const c=profile.records.find(c=>c.index===call),a=application(source,c.anchor.node),fields=[a.id,...a.args];assert.equal(fields.length,c.ports.length);let built;
  for(let slot=0;slot<fields.length;slot++){
   const p=c.ports[slot];assert.equal(fields[slot],p.input.node);const member=profile.records.find(r=>key(r.anchor)===key(p.producer));assert.equal(member?.index??null,profile.members.includes(p.knownProducer)?p.knownProducer:null);
   const internal=member!==undefined,promote=!internal&&(observed.policy==='all-boundary-positions'||p.role==='proof'&&(slot>0||observed.policy==='proof-and-function-inputs'));let value;
   if(internal){assert(results.has(member.index),'source producer order');value=results.get(member.index);internalUses++;}
   else{positions++;if(promote){const i=byPort.get('input:'+call+':'+slot);assert(i!==undefined);assert.equal(keys[i],'atlasRegionInput.'+creationCount);creation.push(keys[i]);creationCount++;value=syms[i];}else value=original(p.input);}
   built=slot?add(5,{},[built,value]):value;callCounts.set(call+':'+slot,creationCount);
  }
  const i=byPort.get('result:'+call);assert(i!==undefined);assert.equal(keys[i],'atlasRegionResult.'+call);assert.equal(bindings[i].value,built,'complete computed application');
  const observation=observed.calls.find(r=>r.call===call);assert(observation);assert.deepEqual(observation.source,c.anchor);assert.equal(observation.contextBindingKeys.length,creationCount);assert.equal(new Set(observation.contextBindingKeys).size,creationCount);
  const scope=[...prefix,...observation.contextBindingKeys.map(key=>{assert(byKey.has(key));return syms[byKey.get(key)];})];
  assert.equal(imported(observation.graph,observation.graph.roots[0],scope),built,'call snapshot value');assert.equal(imported(observation.graph,observation.graph.roots[1],scope),bindings[i].domain,'call snapshot result type');
  results.set(call,syms[i]);types.set(call,bindings[i].domain);sourceValues.set(call,bindings[i].originalValue);
  const frames=context(source,c.anchor);assert.equal(observation.originalContextLength,frames.length);sourceTypes.set(call,sourceAt(observation.originalType,observation.originalType.roots[0],frames));
  creation.push(keys[i]);creationCount++;
 }
 assert.equal(creationCount,bindings.length);assert.equal(positions,observed.boundaryPositions);assert.equal(internalUses,observed.internalPositions);
 function scopeFor(names){assert.equal(new Set(names).size,names.length);return[...prefix,...names.map(key=>{assert(byKey.has(key),'foreign declaration key');return syms[byKey.get(key)];})];}
 function replaceNamed(root,mapping){const memo=new Map();function visit(id){if(mapping.has(id))return mapping.get(id);if(memo.has(id))return memo.get(id);const n=add(t.g.kind[id],t.g.payloads[id],t.g.children[id].map(visit));memo.set(id,n);return n;}return visit(root);}
 const originalMap=new Map(syms.map((s,i)=>[s,bindings[i].originalValue])),constraintFor=new Map();
 for(const[index,r]of observed.constraints.entries()){
  assert(!constraintFor.has(r.bindingKey));constraintFor.set(r.bindingKey,index);assert(byKey.has(r.bindingKey));
  const i=byKey.get(r.bindingKey),row=observed.bindings[i],b=bindings[i];assert.equal(row.port.kind,'derived-input');assert.equal(row.port.constraint,index);
  const before=scopeFor(r.contextBindingKeys);assert.equal(r.binding,r.contextBindingKeys.length);assert.equal(r.contextLength,before.length);assert(!r.contextBindingKeys.includes(r.bindingKey));
  const originalPort={...row.port,kind:'input'};delete originalPort.constraint;assert.deepEqual(r.sourcePort,originalPort);
  const g=r.graph,at=(root,ctx)=>imported(g,g.roots[root],ctx),value=at(0,before),domain=at(3,before);assert.equal(value,b.value,'assignment value');assert.equal(domain,b.domain,'assignment domain');
  const restored=replaceNamed(value,originalMap),originalDomain=replaceNamed(domain,originalMap);
  assert.equal(restored,at(1,prefix));assert.equal(b.originalValue,at(2,prefix));assert.equal(originalDomain,at(4,prefix));
  for(const label of['kernelAssignmentTyping','kernelSourceSpecialization','kernelSourceEqualityWitness'])assert.equal(r[label],'PASS');
  assert.deepEqual(r.rootContexts,['before-binding','original','original','before-binding','original','original','original']);
  const equality=application(g,g.roots[6]),head=g.payloads[equality.id];assert.equal(g.kind[equality.id],4);assert.deepEqual(head.nameParts,[{str:'Eq'}]);assert.equal(head.levels.length,1);
  let expected=add(4,head);for(const arg of[originalDomain,restored,b.originalValue])expected=add(5,{},[expected,arg]);assert.equal(expected,at(6,prefix));
  const refl=add(4,{name:'Eq.refl',nameParts:[{str:'Eq'},{str:'refl'}],levels:head.levels});assert.equal(add(5,{},[add(5,{},[refl,originalDomain]),restored]),at(5,prefix));
 }
 assert.equal(observed.derivedInputs,constraintFor.size);assert.equal(constraintFor.size,observed.bindings.filter(b=>b.port.kind==='derived-input').length);
 // Replay every assignment at its original source slot. A reordered predecessor
 // list must be the complete actual prefix, even when an omitted row is unused.
 // Reconstruct each explicit permutation from its complete pre-order snapshot.
 // This checks both header and value dependencies; source port order stays separate.
 let currentOrder=[],created=0,previousCallPosition=-1;const history=[];
 const permutationByCause=new Map(observed.permutations.map(p=>[p.cause,p]));assert.equal(permutationByCause.size,observed.permutations.length);
 function references(root,out=new Set(),seen=new Set()){
  if(seen.has(root))return out;seen.add(root);const i=syms.indexOf(root);if(i>=0){out.add(keys[i]);return out;}if(prefix.includes(root))return out;
  for(const c of t.g.children[root])references(c,out,seen);return out;
 }
 for(const [event,record]of observed.constraints.entries()){
  const eventPosition=profile.order.indexOf(record.call)*65+record.slot;
  assert(eventPosition>=previousCallPosition,'assignment source-event order');previousCallPosition=eventPosition;
  const count=callCounts.get(record.call+':'+record.slot);assert(Number.isInteger(count)&&count>=created,'unknown or stale assignment event');
  currentOrder.push(...creation.slice(created,count));created=count;
  assert(currentOrder.includes(record.bindingKey),'assignment target not yet created');
  const permutation=permutationByCause.get(record.bindingKey);
  if(permutation){
   assert.deepEqual(currentOrder,permutation.old,'pre-permutation order');
   const scope=scopeFor(permutation.old),g=permutation.graph;assert.equal(permutation.nodes.length,permutation.old.length);assert.equal(permutation.kernelContextTyping,'PASS');
   const pending=permutation.nodes.map((row,j)=>{
    assert.equal(row.key,permutation.old[j]);const i=byKey.get(row.key),b=bindings[i],domain=imported(g,g.roots[row.domainRoot],scope);assert.equal(domain,b.domain);
    const assigned=constraintFor.get(row.key),hasValue=observed.bindings[i].port.kind==='result'||assigned!==undefined&&assigned<=event;assert.equal(row.valueRoot!==null,hasValue);
    const value=row.valueRoot===null?null:imported(g,g.roots[row.valueRoot],scope);if(value!==null)assert.equal(value,b.value);
    return{key:row.key,deps:new Set([...references(domain),...(value===null?[]:references(value))])};
   });
   const done=new Set(),ordered=[];while(pending.length){const j=pending.findIndex(row=>[...row.deps].every(key=>done.has(key)));assert(j>=0,'cyclic/unknown computed dependency');const row=pending.splice(j,1)[0];done.add(row.key);ordered.push(row.key);}
   assert.deepEqual(ordered,permutation.new,'stable dependency order');assert.notDeepEqual(ordered,currentOrder,'spurious identity permutation');
   history.push({count:created,old:[...currentOrder],next:[...ordered]});currentOrder=ordered;
  }
  const position=currentOrder.indexOf(record.bindingKey);assert.equal(position,record.binding);assert.deepEqual(currentOrder.slice(0,position),record.contextBindingKeys,'complete assignment predecessor context');
 }
 currentOrder.push(...creation.slice(created));assert.deepEqual(currentOrder,keys,'final declaration order');
 for(const observation of observed.calls){const count=creation.indexOf('atlasRegionResult.'+observation.call);let order=[],n=0;for(const h of history)if(h.count<=count){order.push(...creation.slice(n,h.count));assert.deepEqual(order,h.old);order=[...h.next];n=h.count;}order.push(...creation.slice(n,count));assert.deepEqual(order,observation.contextBindingKeys,'typed call snapshot order');}
 let templateStates=0,templateGroups=0;
 for(const plan of observed.templates){
  assert.equal(plan.relation,'derived-source-value-pattern/1');assert(byKey.has(plan.bindingKey));const i=byKey.get(plan.bindingKey),g=plan.graph,scope=scopeFor(plan.contextBindingKeys),target=bindings[i];
  assert.equal(plan.constraint,constraintFor.get(plan.bindingKey));assert.equal(plan.call,observed.constraints[plan.constraint].call);assert.equal(plan.slot,observed.constraints[plan.constraint].slot);assert(!plan.contextBindingKeys.includes(plan.bindingKey));const known=creation.slice(0,callCounts.get(plan.call+':'+plan.slot));assert(plan.contextBindingKeys.every(key=>known.includes(key)));
  const original=imported(g,g.roots[0],prefix);assert.equal(original,target.originalValue,'whole original source lambda');assert.equal(t.g.kind[original]===10?t.g.kind[t.g.children[original][0]]:t.g.kind[original],6);
  const replacements=new Map(),groupBySource=new Map();
  for(const[j,group]of plan.groups.entries()){
   const sourceValue=imported(g,g.roots[group.sourceRoot],prefix);assert.equal(t.g.neededScope[sourceValue],0,'open source pattern');assert(!replacements.has(sourceValue));assert(group.targets.length>0&&group.targets.every(key=>plan.contextBindingKeys.includes(key)));
   for(const key of group.targets)assert.equal(bindings[byKey.get(key)].originalValue,sourceValue,'pattern/source provenance');
   const selected=syms[byKey.get(group.targets[0])];assert.equal(imported(g,g.roots[group.targetRoot],scope),selected);replacements.set(sourceValue,selected);groupBySource.set(sourceValue,j);
  }
  const memo=new Map(),used=new Set();function rewrite(id){if(memo.has(id))return memo.get(id);let out;if(replacements.has(id)){out=replacements.get(id);used.add(groupBySource.get(id));}else out=add(t.g.kind[id],t.g.payloads[id],t.g.children[id].map(rewrite));memo.set(id,out);return out;}
  const value=rewrite(original);assert.equal(value,imported(g,g.roots[1],scope),'complete source-lambda rewrite');assert.equal(value,target.value,'template/assignment link');assert.equal(memo.size,plan.storedStates,'composite cache accounting');assert.deepEqual([...used],plan.usedGroups);
  assert.equal(replaceNamed(value,originalMap),original,'literal whole-source-lambda recovery');templateStates+=memo.size;templateGroups+=used.size;
 }
 let shape=observed.graph.roots[0];for(const b of bindings){assert.equal(observed.graph.kind[shape],b.kind);shape=observed.graph.children[shape].at(-1);}
 function pack(g,shape,values,domains,i=0){if(i===values.length-1)return{value:values[i],type:domains[i]};const a=application(g,shape),head=g.payloads[a.id];assert.equal(g.kind[a.id],4);assert.deepEqual(head.nameParts,[{str:'PProd'},{str:'mk'}]);assert.equal(head.levels.length,2);assert.equal(a.args.length,4);const tail=pack(g,a.args[3],values,domains,i+1);let value=add(4,head);for(const v of[domains[i],tail.type,values[i],tail.value])value=add(5,{},[value,v]);const typeHead=add(4,{name:'PProd',nameParts:[{str:'PProd'}],levels:head.levels});return{value,type:add(5,{},[add(5,{},[typeHead,domains[i]]),tail.type])};}
 const values=profile.members.map(id=>results.get(id)),domains=profile.members.map(id=>types.get(id)),packed=pack(observed.graph,shape,values,domains),fn=closeComputed(packed.value),rawFn=abstract(fn,prefix);assert.equal(rawFn,raw(observed.graph,observed.graph.roots[0]),'complete raw function');
 function free(g,root){const memo=new Map();function visit(id){if(memo.has(id))return memo.get(id);let refs=new Set();if(g.kind[id]===0)refs.add(g.payloads[id].index);else for(const[s,child]of g.children[id].entries())for(const i of visit(child)){if(binds(g.kind[id],s)){if(i>0)refs.add(i-1);}else refs.add(i);}memo.set(id,refs);return refs;}return visit(root);}
 const kept=new Set([...free(t.g,rawFn),...free(observed.graph,observed.graph.roots[1])].map(i=>prefix.length-1-i));let changed=true;while(changed){changed=false;for(const j of [...kept]){assert(j>=0&&j<prefix.length);const node=profile.commonContext[j].node,fields=source.kind[node]===8?source.children[node].slice(0,2):source.children[node].slice(0,1);for(const field of fields)for(const i of free(source,field)){const k=j-1-i;assert(k>=0&&k<j);if(!kept.has(k)){kept.add(k);changed=true;}}}}
 assert.deepEqual([...kept].sort((a,b)=>a-b),observed.keptContextSlots);
 const projected=project(rawFn,prefix.length,observed.keptContextSlots),projectedType=project(raw(observed.graph,observed.graph.roots[1]),prefix.length,observed.keptContextSlots);assert.equal(projected,raw(observed.graph,observed.graph.roots[2]));assert.equal(projectedType,raw(observed.graph,observed.graph.roots[3]));
 const closed=close(projected,observed.keptContextSlots);assert.equal(closed,raw(observed.graph,observed.graph.roots[4]));assert.equal(close(projectedType,observed.keptContextSlots,true),raw(observed.graph,observed.graph.roots[5]));
 let restored=closed;for(const j of observed.keptContextSlots)if(source.kind[profile.commonContext[j].node]!==8)restored=add(5,{},[restored,prefix[j]]);for(const b of bindings)if(b.kind===6)restored=add(5,{},[restored,b.originalValue]);assert.equal(abstract(restored,prefix),raw(observed.graph,observed.graph.roots[6]));
 const old=pack(observed.graph,observed.graph.roots[7],profile.members.map(id=>sourceValues.get(id)),profile.members.map(id=>sourceTypes.get(id)));assert.equal(abstract(old.value,prefix),raw(observed.graph,observed.graph.roots[7]));
 let eqNode=observed.graph.roots[9];for(const j of profile.commonContext.keys())eqNode=observed.graph.children[eqNode].at(-1);const equality=application(observed.graph,eqNode),head=observed.graph.payloads[equality.id];assert.deepEqual(head.nameParts,[{str:'Eq'}]);assert.equal(head.levels.length,1);
 let eq=add(4,head);for(const arg of[old.type,restored,old.value])eq=add(5,{},[eq,arg]);const all=prefix.map((_,i)=>i);assert.equal(close(abstract(eq,prefix),all,true),raw(observed.graph,observed.graph.roots[9]),'closed source equality type');
 const refl=add(4,{name:'Eq.refl',nameParts:[{str:'Eq'},{str:'refl'}],levels:head.levels}),witness=add(5,{},[add(5,{},[refl,old.type]),restored]);assert.equal(close(abstract(witness,prefix),all),raw(observed.graph,observed.graph.roots[8]),'closed source witness');
 assert.equal(bindings.filter(b=>b.kind===6).length,observed.independentInputs);
 return{status:observed.status,bindings:bindings.length,inputs:observed.independentInputs,derived:observed.derivedInputs,templates:observed.templates.length,permutations:observed.permutations.length,templateStates,templateGroups,positions,internalUses,rows:t.g.kind.length,copied};
}
module.exports={audit,context};
