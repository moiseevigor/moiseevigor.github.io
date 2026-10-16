/* Capture-avoiding instantiation of native constructor signatures. No new typing judgment. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
 const demand=(ok,m)=>{if(!ok)throw Error('Constructor expectation: '+m);},binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
 function derive(metadata,signatureRoot,data,record,use,options={}){
  demand(use&&['complete','partial'].includes(use.status),'native source layout required');
  const context=T.context(data,use.head.route).binders,component=options.component||{kind:'residual'},maxNodes=options.maxNodes??32768,maxWork=options.maxWork??131072,maxIdentityBytes=options.maxIdentityBytes??8*1024**2;
  demand(Number.isInteger(maxNodes)&&maxNodes>=1&&maxNodes<=131072&&Number.isInteger(maxWork)&&maxWork>=1&&maxWork<=524288&&Number.isInteger(maxIdentityBytes)&&maxIdentityBytes>=64&&maxIdentityBytes<=16*1024**2,'work bounds');
  demand(component.kind==='residual'||component.kind==='input'&&Number.isInteger(component.slot)&&component.slot>=1&&component.slot<=use.inputs.length&&component.slot<=use.supplied+1,'component requires preceding source inputs');
  const preceding=component.kind==='input'?component.slot-1:use.supplied;
  let formal=signatureRoot;for(let j=0;j<preceding;j++){demand(metadata.kind[formal]===7,'native telescope');formal=metadata.children[formal][1];}
  if(component.kind==='input'){demand(metadata.kind[formal]===7,'native input');formal=metadata.children[formal][0];}
  const argumentsUsed=use.inputs.slice(0,preceding).map(p=>p.source);demand(argumentsUsed.every(Boolean),'missing source argument');
  const graph={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},memo=new Map(),intern=new Map();let work=0,identityBytes=0;
  function add(kind,payload,children){const k=JSON.stringify([kind,A.payloadKey(kind,payload),children]);if(intern.has(k))return intern.get(k);const id=graph.kind.length;demand(id<maxNodes,'computed node bound');identityBytes+=2*k.length;demand(identityBytes<=maxIdentityBytes,'computed identity byte bound');intern.set(k,id);graph.kind.push(kind);graph.payloads.push(payload);graph.children.push(children);graph.expanded.push((1n+children.reduce((s,c)=>s+BigInt(graph.expanded[c]),0n)).toString());graph.neededScope.push(kind===0?payload.index+1:Math.max(0,...children.map((c,j)=>graph.neededScope[c]-(binds(kind,j)?1:0))));return id;}
  // Source variables keep their own internal binders; only their external Γ is lifted.
  function source(id,amount,cutoff=0,depth=0){const k='s:'+id+':'+amount+':'+cutoff;if(memo.has(k))return memo.get(k);demand(++work<=maxWork&&depth<=512,'source work/depth bound');const kind=data.kind[id],p=data.payloads[id],out=add(kind,kind===0&&p.index>=cutoff?{...p,index:p.index+amount}:p,data.children[id].map((c,j)=>source(c,amount,cutoff+(binds(kind,j)?1:0),depth+1)));memo.set(k,out);return out;}
  function signature(id,depth=0,traversal=0){const k='m:'+id+':'+depth;if(memo.has(k))return memo.get(k);demand(++work<=maxWork&&traversal<=512,'signature work/depth bound');const kind=metadata.kind[id],p=metadata.payloads[id];let out;
   if(kind===0&&p.index>=depth){const formalIndex=p.index-depth;demand(formalIndex<preceding,'native signature escaped formal telescope');out=source(argumentsUsed[preceding-1-formalIndex].node,depth);}
   else out=add(kind,p,metadata.children[id].map((c,j)=>signature(c,depth+(binds(kind,j)?1:0),traversal+1)));memo.set(k,out);return out;
  }
  const root=signature(formal);demand(graph.neededScope[root]<=context.length,'derived expression escaped source context');
  const label=component.kind==='input'?'input.'+component.slot:'residual';
  return{format:'ProofAtlasConstructorExpectation/1',namespace:'constructor-expectation',component:{...component},graph,root,computedData:{...graph,serialization:'ExprDAG/1',declaration:{name:record.name,rootPaths:['expected.'+label]},roots:[root]},context,origin:{kind:'derived-constructor-expectation',namespace:'constructor-expectation',sourceNamespace:use.sourceNamespace,constructor:use.name,source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},selection:use.members.at(-1)||use.head,signature:{file:use.origin.file,sha256:use.origin.sha256,root:signatureRoot,formalRoot:formal,levels:use.origin.levels},component:{...component},targetInput:component.kind==='input'?{slot:component.slot,name:use.inputs[component.slot-1].name,source:use.inputs[component.slot-1].source}:null,arguments:argumentsUsed,method:'simultaneous-capture-avoiding-instantiation/1',kernelCheck:'not-performed'},bounds:{maxNodes,maxWork,maxIdentityBytes,maxDepth:512},work,identityBytes,guarantee:'Derived expected expression from a native instantiated signature and exact source arguments. No argument typing, conversion or result typing is newly checked.'};
 }
 function validate(p,metadata,signatureRoot,data,record,use){const expected=derive(metadata,signatureRoot,data,record,use,{component:p.component,maxNodes:p.bounds.maxNodes,maxWork:p.bounds.maxWork,maxIdentityBytes:p.bounds.maxIdentityBytes});demand(JSON.stringify(p)===JSON.stringify(expected),'changed expected expression, context or derivation');return true;}
 function scene(p,record,slots=[]){const G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;return G.createExpected(p.computedData,record,p.origin,p.context,{route:{root:0,slots},maxNodes:32,maxDepth:3,maxLayerNodes:6,maxApplicationChildren:4,foldBinders:true,foldApplications:true});}
 function mount(container,{prepared:p,record,data,onProofOccurrence}){
  const B=node?require('./proof-atlas-beta-reduction'):host.ProofAtlasBetaReduction;
  if(p.origin.targetInput?.source){const at=p.origin.targetInput.source,b=document.createElement('button');b.type='button';b.textContent='Open original input '+p.origin.targetInput.slot+' · '+p.origin.targetInput.name;b.dataset.expectedInputSource=at.path;b.onclick=()=>onProofOccurrence(at.node,at.route);container.append(b);}
  return B.mountComputed(container,{data,record,prepared:{...p,entry:null},domPrefix:'expectation',showExpression:true,namespace:'constructor-expectation',computedNote:p.guarantee,provenanceTitle:'Expected expression derivation',provenance:s=>({derivation:p.origin,context:s.ambientContext,namespace:p.namespace}),createScene:slots=>scene(p,record,slots),onProofOccurrence});
 }
 const api={derive,validate,scene,mount};if(node)module.exports=api;else host.ProofAtlasConstructorExpectations=api;
})(typeof window==='undefined'?globalThis:window);
