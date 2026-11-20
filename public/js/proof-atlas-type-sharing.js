/* Parameterized repeated shapes in recorded type notation. Original computed
 * occurrences, binder assignments and native judgments remain separate. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts,P=node?require('./proof-atlas-paged-notation'):host.ProofAtlasPagedNotation;
 const limits=Object.freeze({nodes:48,sceneNodes:192,lookahead:2,uses:4,ports:512,path:512,rows:4096,rowBytes:2097152,metadataBytes:8388608});
 const copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),nat=x=>Number.isSafeInteger(x)&&x>=0,demand=(v,m)=>{if(!v)throw Error('Type sharing: '+m);},binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const paths=scene=>{const result=[];function visit(n){result.push(n);for(const c of n.children)visit(c.value);}visit(scene.root);return result;};
 function families(scene){
  demand(scene?.format==='ProofAtlasTypeNotationScene/1'&&scene.stats.nodes<=192,'notation scene');
  const qualifier=origin=>{const value=copy(origin);delete value.node;delete value.slots;return value;},owner=qualifier(scene.root.origin),groups=new Map();
  for(const n of paths(scene)){demand(same(qualifier(n.origin),owner)&&same(n.origin.slots,n.slots),'one qualified component per cut');if(n.rawKind==='bvar'||(A.fields[n.rawKind]||[]).length){const key=n.origin.node;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({node:key,slots:copy(n.slots),origin:copy(n.origin),expanded:n.expanded,kind:n.rawKind});}}
  return[...groups.entries()].filter(([,uses])=>uses.length>1).map(([row,uses])=>({id:'S'+row,row,uses,expanded:uses[0].expanded,kind:uses[0].kind})).sort((a,b)=>BigInt(a.expanded)===BigInt(b.expanded)?a.row-b.row:BigInt(a.expanded)>BigInt(b.expanded)?-1:1);
 }
 function fold(base,family){
  demand(family&&families(base).some(g=>same(g,family)),'family belongs to this exact cut');const seen=new Set(family.uses.map(u=>u.slots.join('.'))),removed=[];
  function visit(n){
   if(seen.has(n.slots.join('.'))){demand(n.origin.node===family.row,'shape use row');removed.push({slots:copy(n.slots),node:copy(n)});return portal(n,family.id);}
   const children=n.children.map(c=>({...copy(c),value:visit(c.value)})),ownRetained=BigInt(n.retained)-n.children.reduce((s,c)=>s+BigInt(c.value.retained),0n),ownHidden=BigInt(n.hidden)-n.children.reduce((s,c)=>s+BigInt(c.value.hidden),0n),retained=ownRetained+children.reduce((s,c)=>s+BigInt(c.value.retained),0n),hidden=ownHidden+children.reduce((s,c)=>s+BigInt(c.value.hidden),0n);
   demand(ownRetained>=0n&&ownHidden>=0n&&retained+hidden===BigInt(n.expanded),'fold occurrence conservation');return{...copy(n),children,retained:String(retained),hidden:String(hidden),nodes:1+children.reduce((s,c)=>s+c.value.nodes,0)};
  }
  const root=visit(base.root),header=copy(base);delete header.root;return{...copy(base),format:'ProofAtlasTypeSharingDisplay/1',root,stats:{...copy(base.stats),nodes:root.nodes,retained:root.retained,hidden:root.hidden,metadataBytes:new TextEncoder().encode(JSON.stringify(root)).length},sharingRule:'per-occurrence-shape-use/1',recovery:{header,shape:family.id,row:family.row,removed}};
 }
 function portal(n,id){return{...copy(n),kind:'shape-use',label:id,labelTruncated:false,children:[],head:null,residual:null,metadata:0,hiddenPorts:[],foldedPorts:[],signature:null,shape:id,retained:'0',hidden:n.expanded,nodes:1};}
 function recover(display){
  demand(display?.format==='ProofAtlasTypeSharingDisplay/1'&&display.sharingRule==='per-occurrence-shape-use/1','sharing display');const r=display.recovery,used=new Set();demand(r?.header?.format==='ProofAtlasTypeNotationScene/1'&&Array.isArray(r.removed)&&r.removed.length>=2&&r.removed.length<=192,'recovery record');
  const rows=new Map(r.removed.map(entry=>[entry.slots.join('.'),entry.node]));demand(rows.size===r.removed.length,'unique recovery uses');
  function visit(n){
   if(n.kind==='shape-use'){const key=n.slots.join('.'),original=rows.get(key);demand(original&&original.origin.node===r.row&&same(n,portal(original,r.shape))&&!used.has(key),'changed shape portal or recovery image');used.add(key);return copy(original);}
   const children=n.children.map(c=>({...copy(c),value:visit(c.value)})),ownRetained=BigInt(n.retained)-n.children.reduce((s,c)=>s+BigInt(c.value.retained),0n),ownHidden=BigInt(n.hidden)-n.children.reduce((s,c)=>s+BigInt(c.value.hidden),0n);demand(ownRetained>=0n&&ownHidden>=0n,'opened occurrence weights');
   return{...copy(n),children,retained:String(ownRetained+children.reduce((s,c)=>s+BigInt(c.value.retained),0n)),hidden:String(ownHidden+children.reduce((s,c)=>s+BigInt(c.value.hidden),0n)),nodes:1+children.reduce((s,c)=>s+c.value.nodes,0)};
  }
  const root=visit(display.root);demand(used.size===rows.size&&root.retained===r.header.stats.retained&&root.hidden===r.header.stats.hidden&&root.nodes===r.header.stats.nodes&&root.expanded===r.header.stats.represented,'recovered cut accounting');return{...copy(r.header),root};
 }
 function open({read,nodeCount,root,owner,context=[],signal,maxNodes=24}){
  demand(typeof read==='function'&&nat(nodeCount)&&nodeCount>0&&nodeCount<=65536&&nat(root)&&root<nodeCount,'reader/root');
  demand(owner?.namespace==='application-ports'&&typeof owner.component==='string'&&/^[a-f0-9]{64}$/.test(owner.evidenceSha256)&&/^[a-f0-9]{64}$/.test(owner.sourceIndexSha256)&&/^[a-f0-9]{64}$/.test(owner.typeTableSha256)&&M.route(owner.query)&&typeof owner.input==='string','native owner');
  demand(owner.source?.indexSha256===owner.sourceIndexSha256&&typeof owner.source.name==='string'&&/^[a-f0-9]{64}$/.test(owner.source.sourceSha256),'qualified source');
  demand(context.length<=512&&context.every(c=>typeof c.name==='string'&&c.address?.namespace==='source-expression'&&c.address.name===owner.source.name&&c.address.indexSha256===owner.source.indexSha256&&c.address.sourceSha256===owner.source.sourceSha256&&nat(c.address.node)&&M.route(c.address.route))&&nat(maxNodes)&&maxNodes>0&&maxNodes<=limits.nodes,'context/cut bounds');
  owner=copy(owner);context=copy(context);const qualifier={evidenceSha256:owner.evidenceSha256,sourceIndexSha256:owner.sourceIndexSha256,typeTableSha256:owner.typeTableSha256,source:copy(owner.source),query:copy(owner.query),input:owner.input,component:owner.component},baseOwner={namespace:'application-type-notation',...qualifier,typeRoot:0},catalog={format:'ProofAtlasNotationCatalog/1',entries:[]};
  const base=P.open({read,nodeCount,roots:[root],owner:baseOwner,catalog,context,signal,rowLimit:limits.rows,byteLimit:limits.rowBytes});let pattern=null,current=null,disposed=false,active=false;
  const live=()=>{demand(!disposed,'disposed');if(signal?.aborted)throw signal.reason||Error('Type shape cancelled');},at=(id,slots)=>({namespace:'application-ports',evidenceSha256:owner.evidenceSha256,sourceIndexSha256:owner.sourceIndexSha256,query:copy(owner.query),input:owner.input,component:owner.component,node:id,route:{root:owner.component,slots:[...slots]}});
  async function walk(start,slots){let id=start;demand(Array.isArray(slots)&&slots.length<=limits.path&&slots.every(s=>nat(s)&&s<3),'ordered path');for(const slot of slots){live();const tuple=await read(id,{signal});demand(slot<tuple[1].length,'path field');id=tuple[1][slot];}live();return id;}
  async function environment(slots){let id=root,bindings=copy(context);for(const [depth,slot]of slots.entries()){live();const tuple=await read(id,{signal});demand(slot<tuple[1].length,'use path');if(binds(tuple[0],slot)){const p=tuple[2];bindings.push({name:p.binderName||p.declName||'_',address:at(id,slots.slice(0,depth))});}id=tuple[1][slot];}demand(bindings.length<=limits.ports,'use context bound');return{id,bindings};}
  async function summary(row){const scan=M.dependencyScan(nodeCount,row,0,{includeSupport:true});for(let id=scan.next();id!==null;id=scan.next()){live();scan.accept(id,await read(id,{signal}));}live();return scan.finish();}
  function sealed(value){demand(new TextEncoder().encode(JSON.stringify(value)).length<=limits.metadataBytes,'view metadata bound');return value;}
  async function build(scene,row,first=0){
   const groups=families(scene),chosen=row===undefined?groups[0]:groups.find(g=>g.row===row);demand(row===undefined||chosen,'selected shape not in current cut');
   const result={format:'ProofAtlasTypeSharingScene/1',owner:copy(baseOwner),base:copy(scene),display:copy(scene),families:groups.map(g=>({id:g.id,row:g.row,kind:g.kind,expanded:g.expanded,uses:g.uses.length})),family:null,guarantee:'A repeated constructor shape with separate computed occurrences and lexical assignments. No shared native typing judgment, mathematical equality or semantic compression.'};
   if(!chosen)return{result:sealed(result),nextPattern:null};
   const support=await summary(chosen.row);live();
   demand(support.status!=='available'||Array.isArray(support.indices),'exact support component unavailable');
   if(support.status!=='available'||support.unresolvedIdentifiers||support.indices.length>limits.ports||support.indices.some(i=>i>=limits.ports)){result.family={id:chosen.id,row:chosen.row,status:'unavailable',reason:support.reason||'unresolved-identifiers-or-interface-bound',support};return{result:sealed(result),nextPattern:null};}
   demand(nat(first)&&first%limits.uses===0&&first<chosen.uses.length,'use page');
   const shapeOwner={namespace:'application-type-shape',...qualifier,typeRoot:0,shapeRoot:chosen.row},width=support.indices.length?Math.max(...support.indices)+1:0,parameters=Array.from({length:width},(_,ordinal)=>{const index=width-1-ordinal;return{name:'v'+index,address:{namespace:'application-type-shape-port',...qualifier,shapeRoot:chosen.row,index}};});
   const uses=[];for(const use of chosen.uses.slice(first,first+limits.uses)){const actual=await environment(use.slots);demand(actual.id===chosen.row,'exact shape occurrence');uses.push({address:at(actual.id,use.slots),contextLength:actual.bindings.length,assignments:support.indices.map(index=>{const ordinal=actual.bindings.length-1-index,binding=actual.bindings[ordinal];demand(binding,'shape port outside context');return{index,parameter:'v'+index,ordinal,name:binding.name,address:copy(binding.address)};})});}
   const nextPattern=P.open({read,nodeCount,roots:[chosen.row],owner:shapeOwner,catalog,context:parameters,signal,rowLimit:limits.rows,byteLimit:limits.rowBytes});
   try{const shape=await nextPattern.inspect([],{budget:maxNodes});live();result.display=fold(scene,chosen);result.family={id:chosen.id,row:chosen.row,status:'available',support,shapeOwner,shape,ports:support.indices,uses,firstUse:first,knownUses:chosen.uses.length};return{result:sealed(result),nextPattern};}catch(error){nextPattern.dispose();throw error;}
  }
  async function run(task){live();demand(!active,'operation already active');active=true;try{return await task();}finally{active=false;}}
  function commit(next){live();pattern?.dispose();pattern=next.nextPattern;current=next.result;return copy(current);}
  return Object.freeze({
   getScene:()=>{live();return current?copy(current):null;},
   inspect:(slots=[])=>run(async()=>{
    let scene=await base.inspect(slots,{budget:maxNodes});
    // Use the existing recoverable cut-union operation. A bounded lookahead
    // can expose a repeated row inside a collapsed binder field; it is not a
    // global occurrence index or a second expression grammar.
    for(let step=0;step<limits.lookahead&&!families(scene).length;step++){
     const frontiers=paths(scene).filter(n=>n.kind==='frontier'&&(A.fields[n.rawKind]||[]).length).sort((a,b)=>BigInt(a.expanded)===BigInt(b.expanded)?0:BigInt(a.expanded)>BigInt(b.expanded)?-1:1);
     if(!frontiers.length)break;scene=await base.expand(scene,frontiers[0].slots);
    }
    return commit(await build(scene));
   }),
   selectFamily:row=>run(async()=>{demand(current,'no inspected cut');return commit(await build(current.base,row));}),
   selectUse:slots=>run(async()=>{const family=current?.family;demand(family?.status==='available','no available shape');const group=families(current.base).find(g=>g.row===family.row),index=group.uses.findIndex(u=>same(u.slots,slots));demand(index>=0,'use outside current cut');const first=Math.floor(index/limits.uses)*limits.uses,next=await build(current.base,family.row,first);next.result.selectedUse=index-first;return commit(next);}),
   usePage:first=>run(async()=>{demand(current?.family?.status==='available','no available shape');return commit(await build(current.base,current.family.row,first));}),
   resolveBase:slots=>run(async()=>{demand(current,'no inspected cut');return at(await walk(root,slots),slots);}),
   resolvePattern:(slots,useIndex)=>run(async()=>{const family=current?.family;demand(family?.status==='available'&&nat(useIndex)&&useIndex<family.uses.length,'shape use');const use=family.uses[useIndex].address,prefix=use.route.slots,full=[...prefix,...slots];demand(full.length<=limits.path,'instantiated path bound');const id=await walk(family.row,slots);demand(await walk(root,full)===id,'shape/source path recovery');return at(id,full);}),
   state:()=>({disposed,active,base:base.state(),pattern:pattern?.state()||null,shapePorts:current?.family?.ports?.length||0,visibleUses:current?.family?.uses?.length||0,completeTableArraysAllocated:0,scope:'Two bounded decoded-row maps and notation cuts, one root support result and at most four occurrence assignments. Native type pages and metadata remain owned by the caller; no total-heap bound.'}),
   dispose:()=>{disposed=true;base.dispose();pattern?.dispose();pattern=null;current=null;context=[];}
  });
 }
 const api={families,fold,recover,open,limits};if(node)module.exports=api;else host.ProofAtlasTypeSharing=api;
})(typeof window==='undefined'?globalThis:window);
