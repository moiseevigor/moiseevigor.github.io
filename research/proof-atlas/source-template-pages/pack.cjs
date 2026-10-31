/* Scoped pages for checked definitions, source recovery and declaration order. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const A=require('../../../public/js/proof-atlas-library-data'),T=require('../../../public/js/proof-atlas-occurrence-types');
process.chdir(path.resolve(__dirname,'../../..'));
const base='/public/data/proof-atlas/region-function-pages/',folder='research/proof-atlas/source-template-pages/';
const parent='research/proof-atlas/source-template-inputs/native.json.gz',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const raw=z.gunzipSync(fs.readFileSync(parent)),native=JSON.parse(raw),nativeInventorySha256=sha(raw);
const verification=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/source-template-inputs/verification.json.gz')));
assert.equal(verification.status,'PASS');assert.equal(verification.nativeSha256,nativeInventorySha256);
cp.execFileSync(process.execPath,['research/proof-atlas/source-template-inputs/check.cjs','--check'],{stdio:'pipe'});
const files=new Map(),profiles=[],fields=['kind','children','payloads','expanded','neededScope'];
const names=['function.original','function.originalType','function.reduced','function.reducedType','function.closed','function.closedType','source.specialization','source.results','recovery.witness','recovery.type'];
const scopes=['original','original','reduced','reduced','closed','closed','original','original','closed','closed'];
const clone=value=>JSON.parse(JSON.stringify(value));
function put(extension,value){
 const bytes=Buffer.from(JSON.stringify(value)),sha256=sha(bytes),file=base+sha256+'.'+extension+'.gz';
 assert(bytes.length<=(extension==='page'?1048576:extension==='index'?16384:262144),'asset byte bound');
 if(files.has(file))assert(files.get(file).equals(bytes));files.set(file,bytes);return{file,sha256,bytes:bytes.length};
}
let mainRows=0,jointRows=0,extraComponents=0,derivedPositions=0,templates=0,permutations=0;
for(const profile of native.profiles){
 const sourceBytes=z.gunzipSync(fs.readFileSync('.'+profile.record.indexFile));assert.equal(sha(sourceBytes),profile.source.indexSha256);
 const source=A.validateIndex(JSON.parse(sourceBytes),profile.record);
 const commonContext=profile.commonContext.map(frame=>({node:frame.node,kind:A.kinds[source.kind[frame.node]],route:{root:1,slots:frame.slots}}));
 const out={source:profile.source,members:profile.members,cases:[]};
 for(const candidate of profile.native.cases){
  assert.equal(candidate.status,'PASS');assert.equal(candidate.constraintRule,'source-lambda-order/1');
  const g=clone(candidate.graph),components=names.map((component,i)=>({component,root:g.roots[i],scope:scopes[i],nativeOwner:{kind:'function',root:i}}));
  const keys=new Map();
  const nodeKey=(kind,payload,children)=>JSON.stringify([kind,payload,children]);
  for(let id=0;id<g.kind.length;id++)keys.set(nodeKey(g.kind[id],g.payloads[id],g.children[id]),id);
  function importRoot(graph,root){
   const memo=new Map();
   function visit(id){
    if(memo.has(id))return memo.get(id);
    const children=graph.children[id].map(visit),key=nodeKey(graph.kind[id],graph.payloads[id],children);let row=keys.get(key);
    if(row===undefined){row=g.kind.length;assert(row<131072,'joint node bound');keys.set(key,row);
     for(const field of fields)g[field].push(field==='children'?children:clone(graph[field][id]));}
    memo.set(id,row);return row;
   }
   return visit(root);
  }
  function originalComponent(component,label,graph,ordinal,nativeOwner){
   const root=importRoot(graph,graph.roots[ordinal]);assert(g.neededScope[root]<=commonContext.length,'original observation context');
   components.push({component,label,root,scope:'original',nativeOwner:{...nativeOwner,root:ordinal}});extraComponents++;return component;
  }
  const derivations=candidate.constraints.map((record,index)=>{
   const binding=candidate.bindings.find(row=>row.key===record.bindingKey);assert(binding&&binding.port.kind==='derived-input');
   const label=binding.port.call+':'+binding.port.slot,componentNames={};
   for(const [key,ordinal,text]of[['specialized',1,'specialized value'],['original',2,'original source value'],['domain',4,'original domain'],['witness',5,'source-recovery witness'],['equality',6,'source-recovery equality']])
    componentNames[key]=originalComponent('derivation.'+index+'.'+key,label+' · '+text,record.graph,ordinal,{kind:'constraint',index});
   return{index,bindingKey:record.bindingKey,trigger:{call:record.call,slot:record.slot},predecessorKeys:record.contextBindingKeys,
    components:componentNames,kernelAssignmentTyping:record.kernelAssignmentTyping,kernelSourceSpecialization:record.kernelSourceSpecialization,kernelSourceEqualityWitness:record.kernelSourceEqualityWitness};
  });
  const templateRecords=candidate.templates.map((plan,index)=>({index,bindingKey:plan.bindingKey,relation:plan.relation,constraint:plan.constraint,
   originalComponent:originalComponent('template.'+index+'.original','Template '+index+' · complete original lambda',plan.graph,0,{kind:'template',index}),
   patterns:plan.usedGroups.map(group=>({group,targets:plan.groups[group].targets,
    sourceComponent:originalComponent('template.'+index+'.pattern.'+group,'Template '+index+' · source pattern '+group,plan.graph,plan.groups[group].sourceRoot,{kind:'template',index})}))}));
  assert(components.length<=256,'component directory bound');
  const bindings=[];let node=g.roots[0],slots=[];
  for(const [index,binding]of candidate.bindings.entries()){
   const input=binding.port.kind==='input',boundary=binding.port.kind!=='result',expectedKind=input?6:8;
   assert.equal(g.kind[node],expectedKind);assert.equal(input?g.payloads[node].binderName:g.payloads[node].declName,(input?'input.':'result.')+index);
   // The per-binding graph uses this exact final predecessor order.
   assert.equal(g.children[node][0],importRoot(binding.graph,binding.graph.roots[0]),'binding domain');
   if(!input)assert.equal(g.children[node][1],importRoot(binding.graph,binding.graph.roots[1]),'binding value');
   const record=profile.records.find(record=>record.index===binding.port.call),anchor=boundary?record.ports[binding.port.slot].input:record.anchor;
   assert.equal(A.walk(source,anchor.route),anchor.node);
   bindings.push({key:binding.key,kind:binding.port.kind,call:binding.port.call,...(boundary?{slot:binding.port.slot}:{}),
    ...(binding.port.kind==='derived-input'?{constraint:binding.port.constraint}:{}),node,slots:[...slots],source:anchor});
   slots.push(input?1:2);node=g.children[node][input?1:2];
  }
  const creationOrder=[];
  for(const call of profile.order){
   const record=profile.records.find(row=>row.index===call);
   for(const port of record.ports){const binding=bindings.find(row=>row.kind!=='result'&&row.call===call&&row.slot===port.slot);if(binding)creationOrder.push(binding.key);}
   const result=bindings.find(row=>row.kind==='result'&&row.call===call);assert(result);creationOrder.push(result.key);
  }
  assert.equal(new Set(creationOrder).size,bindings.length);assert.equal(creationOrder.length,bindings.length);
  const portMap=[];
  for(const call of profile.order){
   const record=profile.records.find(row=>row.index===call),result=bindings.find(row=>row.kind==='result'&&row.call===call),argumentsCount=record.ports.length-1;
   for(const port of record.ports){
    const boundary=bindings.find(row=>row.kind!=='result'&&row.call===call&&row.slot===port.slot),producer=profile.members.includes(port.knownProducer)?bindings.find(row=>row.kind==='result'&&row.call===port.knownProducer):null;
    const relation=producer?'internal-source-use':boundary?.kind==='derived-input'?'derived-boundary':boundary?'independent-boundary':'fixed-boundary';
    const tail=port.slot===0?Array(argumentsCount).fill(0):[...Array(argumentsCount-port.slot).fill(0),1],slots=[...result.slots,1,...tail];
    assert(slots.length<=512,'computed port path bound');
    let node=g.roots[0];for(const slot of slots)node=g.children[node][slot];
    portMap.push({call,slot:port.slot,source:port.input,relation,bindingKey:(producer||boundary)?.key||null,node,slots});
   }
  }
  assert.equal(portMap.length,candidate.boundaryPositions+candidate.internalPositions);
  const context={original:commonContext,reduced:candidate.keptContextSlots.map(slot=>commonContext[slot]),closed:[]};
  T.validateExpressionGraph(g,components.map(row=>row.root),commonContext.length,131072);
  const indexSizes={};let refs=[],level=0,span=1;
  for(let start=0;start<g.kind.length;start+=64){const nodes=Array.from({length:Math.min(64,g.kind.length-start)},(_,i)=>fields.map(field=>g[field][start+i]));refs.push(put('page',{format:'ProofAtlasRegionFunctionPage/1',start,nodes}));}
  const pageCount=refs.length;
  while(true){const next=[];for(let i=0;i<refs.length;i+=64){const ref=put('index',{format:'ProofAtlasRegionFunctionIndex/1',level,first:i*span,children:refs.slice(i,i+64).map(({sha256,bytes})=>({sha256,bytes}))});indexSizes[ref.sha256]=ref.bytes;next.push(ref);}refs=next;if(refs.length===1)break;level++;span*=64;}
  const nativeCaseSha256=sha(Buffer.from(JSON.stringify(candidate))),id=candidate.policy;
  const judgments=Object.fromEntries(['kernelClosedTyping','kernelEqualityWitness','kernelSpecialization'].map(field=>{assert.equal(candidate[field],'PASS');return[field,'PASS'];}));
  const manifest={format:'ProofAtlasRegionFunctionPages/3',constraintRule:candidate.constraintRule,id,status:'PASS',source:profile.source,
   nativeInventorySha256,nativeCaseSha256,members:profile.members,order:profile.order,commonContext,context,
   sourceAnchor:profile.records[0].anchor,originalNativeOwner:profile.originalNativeOwner,components,bindings,creationOrder,portMap,derivations,templates:templateRecords,
   permutations:candidate.permutations.map(row=>({cause:row.cause,old:row.old,new:row.new,kernelContextTyping:row.kernelContextTyping})),
   judgments,independentInputs:candidate.independentInputs,derivedInputs:candidate.derivedInputs,boundaryPositions:candidate.boundaryPositions,internalPositions:candidate.internalPositions,
   keptContextSlots:candidate.keptContextSlots,originalResultPortals:candidate.originalResultPortals,nodeCount:g.kind.length,pageSize:64,pageCount,indexLevel:level,indexRoot:refs[0].sha256,indexSizes,
   validation:'Whole-function and assignment checks remain recorded native observations. The producer checks complete native rows, component scopes, stable keys and source routes. The browser checks authenticated pages and local field/scope relations; it does not replay Lean.'};
  out.cases.push({...put('manifest',manifest),constraintRule:candidate.constraintRule,id,status:'PASS',source:profile.source,nativeInventorySha256,nativeCaseSha256,members:profile.members});
  mainRows+=candidate.graph.kind.length;jointRows+=g.kind.length;derivedPositions+=derivations.length;templates+=templateRecords.length;permutations+=manifest.permutations.length;
 }
 profiles.push(out);
}
const file='public/data/proof-atlas/source-template-function-pages-manifest.js',js='window.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES = '+JSON.stringify({format:'ProofAtlasRegionFunctionPageInventory/1',nativeInventorySha256,profiles})+';\n';
const check=process.argv.includes('--check');let created=0,reused=0;
for(const [file,raw]of files){if(fs.existsSync('.'+file)){assert(z.gunzipSync(fs.readFileSync('.'+file)).equals(raw));reused++;}else{assert(!check,'Missing asset: '+file);fs.writeFileSync('.'+file,z.gzipSync(raw,{mtime:0}));created++;}}
if(check)assert.equal(fs.readFileSync(file,'utf8'),js);else fs.writeFileSync(file,js);
console.log(JSON.stringify({status:'PASS',profiles:profiles.length,cases:profiles.reduce((n,p)=>n+p.cases.length,0),assets:files.size,created,reused,mainRows,jointRows,extraComponents,derivedPositions,templates,permutations}));
