'use strict';
const crypto=require('crypto'),repo='../../../public/js/';
const P=require(repo+'proof-atlas-packed-routes'),O=require(repo+'proof-atlas-occurrence-types'),A=require(repo+'proof-atlas-library-data');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const demand=(ok,message)=>{if(!ok)throw Error('Construction prototype: '+message);};
const key=r=>r.root+':'+r.depth+':'+r.slots;
function freeze(v){if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;}
function fingerprints(g){const values=[];for(let n=0;n<g.kind.length;n++)values.push(hash(canonical([g.kind[n],A.payloadKey(g.kind[n],g.payloads[n]),g.children[n].map(c=>values[c])])));return values;}
function contextDepths(data,route){const bytes=P.parse(route),out=[];let node=data.roots[route.root];for(let d=0;d<route.depth;d++){const s=(bytes[d>>2]>>((d%4)*2))&3,k=data.kind[node];if((k===6||k===7)&&s===1||k===8&&s===2)out.push(d);node=data.children[node][s];}return out;}
function prepare(inputBytes,resultBytes,expected){
 demand(inputBytes?.byteLength>0&&inputBytes.byteLength<=67108864&&resultBytes?.byteLength>0&&resultBytes.byteLength<=67108864,'native input byte bounds');
 expected=freeze(structuredClone(expected));
 const capture=bytes=>{demand(bytes instanceof ArrayBuffer||ArrayBuffer.isView(bytes),'native byte buffer');const view=bytes instanceof ArrayBuffer?new Uint8Array(bytes):new Uint8Array(bytes.buffer,bytes.byteOffset,bytes.byteLength);demand(view.buffer instanceof ArrayBuffer,'non-shared native input');return Buffer.from(view);};
 const input=capture(inputBytes),output=capture(resultBytes),evidenceSha256=expected.resultSha256;
 demand(hash(input)===expected.inputSha256&&hash(output)===evidenceSha256,'native input/evidence hashes');
 const rows=JSON.parse(input),result=JSON.parse(output);
 demand(result.status==='PASS'&&result.format==='ProofAtlasDeepConstructionPrototype/1'&&/^[a-f0-9]{64}$/.test(evidenceSha256),'native envelope');
 demand(result.sourceModuleBytesVerified===false&&result.queryAlgorithmFormallyVerified===false&&result.originalMathematicalModulesImported===false,'native scope');
 demand(rows.length===result.cases.length&&rows.length<=32,'case bound');
 const sealed=new WeakSet(),cases=[];
 for(const native of result.cases){
  const row=rows.find(r=>r.name===native.name);demand(row&&!cases.some(c=>c.name===row.name),'source case');
  const data=freeze(structuredClone(row.source));O.validateExpressionGraph(data,data.roots,0,262144);
  demand(native.rootTypeKernelChecked&&native.rootValueConversionKernelChecked&&Array.isArray(native.baselineAxioms)&&!native.baselineAxioms.includes('sorryAx'),'baseline kernel observation');
  demand(native.observations.length===row.requests.length&&native.observations.length<=256,'query inventory');
  const sourceGraphSha256=hash(canonical(data)),entries=new Map(),list=[];
  for(let i=0;i<native.observations.length;i++){
   const q=freeze(structuredClone(native.observations[i])),request=row.requests[i],route=P.encode(q.source.root,q.source.slots),resolved=P.resolve(data,route);
   demand(q.source.root===1&&q.source.node===resolved.node&&q.rule===request.rule&&canonical(q.source.slots)===canonical(request.slots),'native query source');
   demand(canonical(q.binderDepths)===canonical(contextDepths(data,route))&&q.contextLength===resolved.scopeDepth&&q.contextLength<=131072,'original context');
   demand(q.typeContextRoundtrips&&q.sourceTermContextRoundtrips&&q.precedingQueryAgreement&&['proof','type','value'].includes(q.role),'native source/type roundtrips');
   const g=q.typeGraph;O.validateExpressionGraph(g,[],0,131072);const typeHashes=Object.freeze(fingerprints(g)),typeGraphSha256=hash(canonical(g));
   const intro=q.rule==='Pi-introduction',app=q.rule==='Pi-application';demand(intro||app,'unsupported rule');
   demand(data.kind[q.source.node]===(intro?6:5),'source constructor');
   const labels=intro?['lambda-type','domain-expression','domain-type','domain-sort','pi-type','body-type','expected-body-type']:['result-type','function-type','pi-type','expected-domain','argument-type','substituted-result'];
   demand(canonical(labels)===canonical(q.typeRoots)&&g.roots.length===labels.length,'type components');
   const subject=(p,slot)=>{const r=P.append(route,[slot]);demand(p.root===route.root&&p.node===data.children[q.source.node][slot]&&canonical(p.slots)===canonical([...q.source.slots,slot]),'premise source field');return{node:p.node,route:r,binding:P.resolve(data,r).binding};};
   let premises;
   if(intro){
    demand(q.domainBeforeBinder&&q.bodyContextExtended&&q.bodyContextLength===q.contextLength+1&&canonical(q.bodyBinderDepths)===canonical([...q.binderDepths,route.depth]),'one context extension');
    demand(q.domainRole==='type'&&['proof','type','value'].includes(q.bodyRole),'premise roles');
    demand(['kernelDomainSort','kernelBinderConversion','kernelBodyConversion','kernelFunctionConversion'].every(k=>q[k]==='PASS'),'introduction conversions');
    demand(g.kind[g.roots[3]]===3&&g.kind[g.roots[4]]===7,'normalized domain sort and Pi');
    premises=[{...subject(q.domain,0),field:'binderType',role:q.domainRole,typeRoot:g.roots[2],contextLength:q.contextLength},{...subject(q.body,1),field:'body',role:q.bodyRole,typeRoot:g.roots[5],contextLength:q.bodyContextLength}];
   }else{
    demand(['functionRole','argumentRole'].every(k=>['proof','type','value'].includes(q[k])),'application premise roles');
    demand(['kernelFunctionConversion','kernelDomainConversion','kernelResultConversion'].every(k=>q[k]==='PASS'),'application conversions');
    demand(g.kind[g.roots[2]]===7&&g.children[g.roots[2]][0]===g.roots[3],'normalized application Pi/domain');
    premises=[{...subject(q.function,0),field:'fn',role:q.functionRole,typeRoot:g.roots[1],contextLength:q.contextLength},{...subject(q.argument,1),field:'arg',role:q.argumentRole,typeRoot:g.roots[4],contextLength:q.contextLength}];
   }
   g.roots.forEach((root,j)=>demand(g.neededScope[root]<=(intro&&j>=5?q.contextLength+1:q.contextLength),'type component context'));
   if(intro)demand(typeHashes[g.children[g.roots[4]][0]]===typeHashes[g.roots[1]],'lambda/Pi domain expression');
   for(const p of premises){demand(P.resolve(data,p.route).scopeDepth===p.contextLength,'premise context prefix');p.expanded=data.expanded[p.node];p.typeFingerprint=typeHashes[p.typeRoot];}
   const entry=Object.freeze({index:list.length,rule:q.rule,sourceGraphSha256,evidenceSha256,typeGraphSha256,route,node:q.source.node,role:q.role,contextLength:q.contextLength,binderDepths:q.binderDepths,typeGraph:g,typeHashes,typeRoots:labels,typeRoot:g.roots[0],premises:freeze(premises),expanded:data.expanded[q.source.node],native:q});
   demand(!entries.has(key(route)),'duplicate construction query');entries.set(key(route),entry);list.push(entry);sealed.add(entry);
  }
  function resolveReference(ref){
   demand(ref&&typeof ref==='object'&&!Array.isArray(ref)&&Object.keys(ref).every(k=>['query','prefixDepth','slots'].includes(k)),'relative address fields');
   demand(Number.isInteger(ref.query)&&ref.query>=0&&ref.query<list.length,'relative query identity');
   const base=list[ref.query].route,depth=ref.prefixDepth??base.depth,slots=ref.slots??[];
   demand(Number.isInteger(depth)&&depth>=0&&depth<=base.depth&&Array.isArray(slots)&&slots.length<=1&&slots.every(s=>s===0||s===1)&&(slots.length===0||depth===base.depth),'relative prefix/field');
   return P.append(P.prefix(base,depth),slots);
  }
  function relative(route,owner){
   const base=list[owner].route;P.parse(route);demand(route.root===base.root,'relative source root');
   if(route.depth<=base.depth&&key(P.prefix(base,route.depth))===key(route))return{query:owner,...(route.depth===base.depth?{}:{prefixDepth:route.depth})};
   demand(route.depth===base.depth+1&&key(P.prefix(route,base.depth))===key(base),'relative source field');
   const bytes=P.parse(route),slot=(bytes[(route.depth-1)>>2]>>(((route.depth-1)%4)*2))&3;demand(slot<2,'binary construction field');return{query:owner,slots:[slot]};
  }
  const owner=route=>{const e=entries.get(key(route));demand(e,'relative recording query');return e.index;};
  const shortId=id=>'q:'+entries.get(id).index;
  function compact(value){
   const point=(p,index)=>({...p,route:relative(p.route,index),
    ...(p.id?{id:shortId(p.id)}:{}),...(p.parent?{parent:shortId(p.parent)}:{}),
    ...(p.recording?{recording:{...p.recording,queryRoute:relative(p.recording.queryRoute,index)}}:{}),
    ...(p.binding?{binding:{...p.binding,route:relative(p.binding.route,index)}}:{}),
    typeReference:{...p.typeReference,contextSourceRoute:relative(p.typeReference.contextSourceRoute,index),recordingQuery:relative(p.typeReference.recordingQuery,index)}});
   const frontierOwner=new Map(value.frontiers.map(p=>[key(p.route),owner(p.recording.queryRoute)]));
   return{...value,format:'ProofAtlasCompactConstructionPrototype/2',source:{...value.source,addressing:'native-query-relative/1'},root:{...value.root,route:relative(value.root.route,owner(value.root.route))},
    nodes:value.nodes.map(n=>point(n,owner(n.route))),edges:value.edges.map(e=>({...e,from:shortId(e.from),to:shortId(e.to)})),
    frontiers:value.frontiers.map(p=>point(p,owner(p.recording.queryRoute))),
    links:value.links.map(l=>{const index=frontierOwner.get(key(l.from));return{...l,from:relative(l.from,index),target:relative(l.target,index)};})};
  }
  function expandReferences(value){
   demand(value.format==='ProofAtlasCompactConstructionPrototype/2'&&value.source.addressing==='native-query-relative/1'&&value.source.sourceGraphSha256===sourceGraphSha256&&value.source.evidenceSha256===evidenceSha256&&value.source.inputSha256===expected.inputSha256&&value.source.caseName===row.name,'relative scene owner');
   validateScene(value);
   const fullId=id=>{demand(typeof id==='string'&&/^q:(0|[1-9]\d*)$/.test(id),'relative vertex identity');return key(resolveReference({query:Number(id.slice(2))}));};
   const point=p=>({...p,route:resolveReference(p.route),...(p.id?{id:fullId(p.id)}:{}),...(p.parent?{parent:fullId(p.parent)}:{}),
    ...(p.recording?{recording:{...p.recording,queryRoute:resolveReference(p.recording.queryRoute)}}:{}),
    ...(p.binding?{binding:{...p.binding,route:resolveReference(p.binding.route)}}:{}),
    typeReference:{...p.typeReference,contextSourceRoute:resolveReference(p.typeReference.contextSourceRoute),recordingQuery:resolveReference(p.typeReference.recordingQuery)}});
   return freeze({...value,format:'ProofAtlasCompactConstructionPrototype/1',source:{...value.source,addressing:'packed-routes/1'},root:{...value.root,route:resolveReference(value.root.route)},nodes:value.nodes.map(point),edges:value.edges.map(e=>({...e,from:fullId(e.from),to:fullId(e.to)})),frontiers:value.frontiers.map(point),links:value.links.map(l=>({...l,from:resolveReference(l.from),target:resolveReference(l.target)}))});
  }
  function scene(root,options={}){
   demand(sealed.has(root)&&entries.get(key(root.route))===root,'unsealed construction');const budget=options.maxNodes??7,depthLimit=options.maxDepth??3;
   const addressing=options.addressing??'packed';demand(['packed','query-relative'].includes(addressing),'construction address encoding');
   demand(Number.isInteger(budget)&&budget>=1&&budget<=13&&Number.isInteger(depthLimit)&&depthLimit>=0&&depthLimit<=4,'construction display budget');
   const nodes=[],frontiers=[],edges=[],todo=[{entry:root,depth:0,parent:null,field:null}];
   const typeReference=(e,point,typeRoot)=>({namespace:'computed-native-type',graphSha256:e.typeGraphSha256,root:typeRoot,contextSourceRoute:point,recordingQuery:e.route});
   while(todo.length){const item=todo.shift(),e=item.entry;demand(sealed.has(e),'construction owner');
    if(nodes.length===budget||item.depth>depthLimit){frontiers.push({node:e.node,route:e.route,role:e.role,contextLength:e.contextLength,expanded:e.expanded,recording:{kind:'primary-query',queryRoute:e.route},typeGraphSha256:e.typeGraphSha256,typeRoot:e.typeRoot,typeReference:typeReference(e,e.route,e.typeRoot),parent:item.parent,field:item.field});continue;}
    const id=key(e.route);nodes.push({id,node:e.node,route:e.route,rule:e.rule,role:e.role,contextLength:e.contextLength,typeGraphSha256:e.typeGraphSha256,typeRoot:e.typeRoot,typeReference:typeReference(e,e.route,e.typeRoot),expanded:e.expanded,depth:item.depth});if(item.parent)edges.push({from:item.parent,to:id,field:item.field,relation:'native-premise-with-structural-type-agreement'});
    for(const p of e.premises){const child=entries.get(key(p.route));
     if(child){demand(child.role===p.role&&child.contextLength===p.contextLength&&child.typeHashes[child.typeRoot]===p.typeFingerprint,'construction interface disagreement');todo.push({entry:child,depth:item.depth+1,parent:id,field:p.field});}
     else frontiers.push({...p,recording:{kind:e.rule==='Pi-introduction'?'lambda-introduction-observation':'application-premise-observation',queryRoute:e.route,field:p.field},typeGraphSha256:e.typeGraphSha256,typeReference:typeReference(e,p.route,p.typeRoot),parent:id});
    }
   }
   const hidden=frontiers.reduce((s,p)=>s+BigInt(p.expanded),0n);demand(BigInt(nodes.length)+hidden===BigInt(root.expanded),'source partition');
   const links=frontiers.filter(p=>p.binding).map(p=>({from:p.route,target:p.binding.route,node:p.binding.node,namespace:'original-source-context',targetDisplayed:nodes.some(n=>key(n.route)===key(p.binding.route)),countContribution:'0'}));
   const value={format:'ProofAtlasCompactConstructionPrototype/1',source:{sourceGraphSha256,evidenceSha256,inputSha256:expected.inputSha256,caseName:row.name,addressing:'packed-routes/1'},root:{node:root.node,route:root.route},display:{maxNodes:budget,maxDepth:depthLimit},nodes,edges,frontiers,links,stats:{retained:String(nodes.length),hidden:String(hidden),represented:root.expanded},scope:'Finite recorded native construction observations; frontiers are exact source premises, not inferred descendant constructions.'};
   const output=addressing==='query-relative'?compact(value):value;demand(Buffer.byteLength(JSON.stringify(output))<=65536,'compact scene byte budget');return freeze(output);
  }
  function validateScene(value){
   const relative=value?.format==='ProofAtlasCompactConstructionPrototype/2';demand(relative||value?.format==='ProofAtlasCompactConstructionPrototype/1','construction scene format');
   const route=relative?resolveReference(value.root.route):value.root.route,entry=entries.get(key(route));demand(entry,'construction scene query');
   const expected=scene(entry,{maxNodes:value.display?.maxNodes,maxDepth:value.display?.maxDepth,addressing:relative?'query-relative':'packed'});
   demand(canonical(value)===canonical(expected),'construction scene differs from attested source/rules');return true;
  }
  cases.push(Object.freeze({name:row.name,data,entries:Object.freeze(list),get:r=>entries.get(key(r))||null,resolveReference,expandReferences,validateScene,scene}));
 }
 return Object.freeze({cases:Object.freeze(cases)});
}
module.exports={prepare,hash,canonical};
