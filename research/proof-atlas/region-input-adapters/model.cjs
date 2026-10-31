/* Independent constructor reconstruction. Native binder domains and tuple
   universe annotations are observations; this module does not infer Lean types. */
'use strict';
const assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data'),{table}=require('../method-context/catalogue.cjs');
const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2,key=JSON.stringify;
function context(g,anchor){let id=g.roots[1],frames=[];for(const[depth,slot]of anchor.route.slots.entries()){if(binds(g.kind[id],slot))frames.push({node:id,slots:anchor.route.slots.slice(0,depth)});assert(slot<g.children[id].length);id=g.children[id][slot];}assert.equal(id,anchor.node);return frames;}
function audit(source,profile,observed){
 if(observed.status==='PASS'){assert.equal(observed.namespace,'region-input-adapter-function');assert.deepEqual(observed.members,profile.members);assert.deepEqual(observed.order,profile.order);}
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
 function close(root,kept){for(const j of [...kept].reverse()){const frame=source.kind[profile.commonContext[j].node],id=profile.commonContext[j].node,p=source.payloads[id],cs=source.children[id],before=kept.filter(k=>k<j),domain=project(raw(source,cs[0]),j,before);
  if(frame===8)root=add(8,{declName:p.declName,declNameParts:p.declNameParts,nondep:false},[domain,project(raw(source,cs[1]),j,before),root]);
  else root=add(6,{binderName:p.binderName,binderNameParts:p.binderNameParts,binderInfo:p.binderInfo},[domain,root]);
 }return root;}
 function metadataFor(kind,i){return kind===6?{binderName:'input.'+i,binderNameParts:[{str:'input'},{num:String(i)}],binderInfo:'default'}:{declName:'result.'+i,declNameParts:[{str:'result'},{num:String(i)}],nondep:false};}
 function closeComputed(root){for(let i=bindings.length-1;i>=0;i--){const b=bindings[i];root=abstract(root,[syms[i]]);root=add(b.kind,metadataFor(b.kind,i),b.kind===6?[b.domain,root]:[b.domain,b.value,root]);}return root;}
 function application(g,id){let args=[];while(g.kind[id]===5){args.unshift(g.children[id][1]);id=g.children[id][0];}return{id,args};}
 let cursor=0,positions=0,internalUses=0;
 function next(kind,call,slot,expectedValue){const row=observed.bindings[cursor];assert(row,'missing binding');assert.equal(row.port.kind,kind);assert.equal(row.port.call,call);if(slot!==null){assert.equal(row.port.slot,slot);assert.deepEqual(row.port[kind==='adapter'?'sourcePort':'source'],profile.records.find(c=>c.index===call).ports[slot]);}
  const scope=[...prefix,...syms],domain=imported(row.graph,row.graph.roots[0],scope),originalValue=imported(row.graph,row.graph.roots.at(-1),prefix);assert.equal(originalValue,expectedValue,'original input/result source value');
  let value;if(kind==='result')value=imported(row.graph,row.graph.roots[1],scope);
  const sym=symbol('binding-'+cursor);bindings.push({kind:kind==='result'?8:6,domain,value,originalValue});syms.push(sym);cursor++;return{sym,domain,value,originalValue};
 }
 for(const call of profile.order){const c=profile.records.find(c=>c.index===call);assert(c);const app=application(source,c.anchor.node),fields=[app.id,...app.args];assert.equal(fields.length,c.ports.length);let built;
  for(let slot=0;slot<fields.length;slot++){
   const p=c.ports[slot];assert.equal(fields[slot],p.input.node);const member=profile.records.find(r=>key(r.anchor)===key(p.producer));assert.equal(member?.index??null,profile.members.includes(p.knownProducer)?p.knownProducer:null,'all internal source uses');
   const internal=member!==undefined,promote=!internal&&(observed.policy==='all-boundary-positions'||p.role==='proof'&&(slot>0||observed.policy==='proof-and-function-inputs'));let value;
   if(internal){assert(results.has(member.index),'producer order');value=results.get(member.index);internalUses++;}
   else{positions++;value=promote?next('input',call,slot,original(p.input)).sym:original(p.input);}
   // Adapter inputs belong to the computed interface; they are never
   // assigned an invented original source occurrence.
   if(observed.bindings[cursor]?.port.kind==='adapter'&&observed.bindings[cursor].port.call===call&&observed.bindings[cursor].port.slot===slot){
    const metadata=observed.bindings[cursor].port;
    assert.equal(metadata.call,call);assert.equal(metadata.slot,slot);assert.equal(metadata.originalSpecialization,'identity');
    const a=observed.adapters[metadata.adapterIndex],scope=[...prefix,...syms];
    assert(a);assert.equal(a.binding,cursor);assert.equal(a.call,call);assert.equal(a.slot,slot);assert.equal(a.contextLength,scope.length);assert.deepEqual(a.sourcePort,p);
    for(const key of['kernelInputTypeNonconversion','kernelAdaptedInputTyping','kernelRebuiltApplicationTyping'])assert.equal(a[key],'PASS');
    assert.equal(a.graph.roots.length,4);
    const actual=imported(a.graph,a.graph.roots[0],scope),expected=imported(a.graph,a.graph.roots[1],scope);
    const info={binderName:'value',binderNameParts:[{str:'value'}],binderInfo:'default'},domain=add(7,info,[actual,expected]);
    assert.equal(domain,imported(a.graph,a.graph.roots[2],scope),'adapter actual-to-expected domain');
    const identityRoot=a.graph.roots[3];assert.equal(a.graph.kind[identityRoot],6);
    // The original identity domain is a native type observation. Its lambda
    // body, scope and specialization are reconstructed, not inferred here.
    const originalDomain=imported(a.graph,a.graph.children[identityRoot][0],prefix),identity=add(6,info,[originalDomain,add(0,{index:0})]);
    assert.equal(identity,imported(a.graph,identityRoot,prefix),'literal identity specialization');
    const binding=next('adapter',call,slot,identity);assert.equal(binding.domain,domain);value=add(5,{},[binding.sym,value]);
   }
   built=slot?add(5,{},[built,value]):value;
   if(observed.status==='KERNEL_REJECTED'&&call===observed.call&&slot===observed.slot){assert.equal(cursor,observed.bindings.length);assert.equal(imported(observed.detail,observed.detail.roots[0],[...prefix,...syms]),built,'complete rejected application');return{status:observed.status,bindings:cursor,positions,internalUses,rows:t.g.kind.length,copied};}
  }
  const row=next('result',call,null,original(c.anchor));assert.equal(row.value,built,'rebuilt application body');results.set(call,row.sym);types.set(call,row.domain);sourceValues.set(call,row.originalValue);
  const observation=(observed.calls||observed.completedCalls).find(r=>r.call===call);assert(observation);assert.deepEqual(observation.source,c.anchor);const frames=context(source,c.anchor);assert.equal(observation.originalContextLength,frames.length);sourceTypes.set(call,sourceAt(observation.originalType,observation.originalType.roots[0],frames));
 }
 assert.equal(cursor,observed.bindings.length);assert.equal(positions,observed.boundaryPositions);assert.equal(internalUses,observed.internalPositions);
 let shape=observed.graph.roots[0];for(const b of bindings){assert.equal(observed.graph.kind[shape],b.kind);shape=observed.graph.children[shape].at(-1);}
 function pack(g,shape,values,domains,i=0){if(i===values.length-1)return{value:values[i],type:domains[i]};const a=application(g,shape),head=g.payloads[a.id];assert.equal(g.kind[a.id],4);assert.deepEqual(head.nameParts,[{str:'PProd'},{str:'mk'}]);assert.equal(head.levels.length,2);assert.equal(a.args.length,4);const tail=pack(g,a.args[3],values,domains,i+1),fn=add(4,head);let value=fn;for(const v of[domains[i],tail.type,values[i],tail.value])value=add(5,{},[value,v]);const typeHead=add(4,{name:'PProd',nameParts:[{str:'PProd'}],levels:head.levels});return{value,type:add(5,{},[add(5,{},[typeHead,domains[i]]),tail.type])};}
 const values=profile.members.map(id=>results.get(id)),domains=profile.members.map(id=>types.get(id)),packed=pack(observed.graph,shape,values,domains),fn=closeComputed(packed.value),rawFn=abstract(fn,prefix);
 assert.equal(rawFn,raw(observed.graph,observed.graph.roots[0]),'complete raw module function');
 function free(g,root){const memo=new Map();function visit(id){if(memo.has(id))return memo.get(id);let refs=new Set();if(g.kind[id]===0)refs.add(g.payloads[id].index);else for(const[s,child]of g.children[id].entries())for(const i of visit(child)){if(binds(g.kind[id],s)){if(i>0)refs.add(i-1);}else refs.add(i);}memo.set(id,refs);return refs;}return visit(root);}
 const kept=new Set([...free(t.g,rawFn),...free(observed.graph,observed.graph.roots[1])].map(i=>prefix.length-1-i));let changed=true;while(changed){changed=false;for(const j of [...kept]){assert(j>=0&&j<prefix.length);const node=profile.commonContext[j].node,fields=source.kind[node]===8?source.children[node].slice(0,2):source.children[node].slice(0,1);for(const field of fields)for(const i of free(source,field)){const k=j-1-i;assert(k>=0&&k<j);if(!kept.has(k)){kept.add(k);changed=true;}}}}
 assert.deepEqual([...kept].sort((a,b)=>a-b),observed.keptContextSlots,'least term/type/header context closure');
 const projected=project(rawFn,prefix.length,observed.keptContextSlots);assert.equal(projected,raw(observed.graph,observed.graph.roots[2]),'projected module function');
 const closed=close(projected,observed.keptContextSlots);assert.equal(closed,raw(observed.graph,observed.graph.roots[4]),'complete closed module function');
 let restored=closed;for(const j of observed.keptContextSlots)if(source.kind[profile.commonContext[j].node]!==8)restored=add(5,{},[restored,prefix[j]]);for(const b of bindings)if(b.kind===6)restored=add(5,{},[restored,b.originalValue]);
 assert.equal(abstract(restored,prefix),raw(observed.graph,observed.graph.roots[6]),'complete source specialization');
 const old=pack(observed.graph,observed.graph.roots[7],profile.members.map(id=>sourceValues.get(id)),profile.members.map(id=>sourceTypes.get(id)));
 assert.equal(abstract(old.value,prefix),raw(observed.graph,observed.graph.roots[7]),'all original result values');
 assert.equal(bindings.filter(b=>b.kind===6).length,observed.independentInputs);assert.equal(observed.adapterInputs,observed.adapters.length);assert.equal(observed.boundaryInputs+observed.adapterInputs,observed.independentInputs);return{status:observed.status,bindings:cursor,inputs:observed.independentInputs,positions,internalUses,rows:t.g.kind.length,copied};
}
module.exports={audit,context};
