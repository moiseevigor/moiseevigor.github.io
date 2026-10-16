/* Source-backed native projection evidence; computed expressions retain separate routes. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,V=node?require('./proof-atlas-expression-views'):host.ProofAtlasExpressionViews;
const demand=(x,m)=>{if(!x)throw Error('Source reference evidence: '+m);},canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x,same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function spine(g,r){const args=[];while(g.kind[r]===5){demand(args.length<256,'spine bound');args.unshift(g.children[r][1]);r=g.children[r][0];}return{head:r,args};}
function validate(e,data,record){
 demand(e.format==='ProofAtlasSourceReferences/2'&&e.status==='checked'&&e.method==='native-exact-source-substitution/1'&&e.templateInstantiationStructuralRoundtrip===true&&e.templatesAreKernelJudgments===false&&e.textIsPresentation===true,'native substitution attestation');
 for(const f of ['kernelProjectionTyping','kernelStructureConversion','kernelFieldConversion','kernelParameters','kernelPrecedingFields'])demand(e[f]==='PASS','native projection checks');
 const at=T.context(data,e.route);demand(at.node===e.node&&data.kind[e.node]===11&&A.path(data,e.route)===e.path&&same(e.context,at.binders),'selected occurrence/context');
 const payload=data.payloads[e.node];demand(payload.typeName===e.family&&A.levelNameIdentity(payload.typeNameParts)===A.levelNameIdentity(e.familyNameParts)&&payload.index===e.index&&Number.isInteger(e.parameters)&&e.parameters>=0&&Number.isInteger(e.fields)&&e.fields>e.index&&e.parameters+e.fields<=256,'native family/field');
 demand(['type','value','proof'].includes(e.role),'native role');
 demand(['type','value','proof'].includes(e.structureRole)&&['typeText','structureTypeText','expectedText'].every(f=>typeof e[f]==='string'&&e[f].length<=65536),'native presentation/structure role');
 const ctor=e.nativeConstructor;demand(ctor?.kind==='ctorInfo'&&A.levelNameIdentity(e.constructorNameParts)!==null&&A.levelNameIdentity(ctor.nameParts)!==null&&ctor.name===e.constructor&&A.levelNameIdentity(ctor.nameParts)===A.levelNameIdentity(e.constructorNameParts)&&ctor.inductive===e.family&&ctor.index===0&&ctor.parameters===e.parameters&&ctor.fields===e.fields&&ctor.unsafe===false,'native constructor identity');
 const input={root:e.route.root,slots:[...e.route.slots,0]},inputNode=data.children[e.node][0],args=spine(data,inputNode).args;
 demand(Array.isArray(e.anchors)&&e.anchors.length===1+args.length&&args.length<=128,'anchor inventory');
 const expected=[input];for(let j=0;j<args.length;j++)expected.push({root:input.root,slots:[...input.slots,...Array(args.length-1-j).fill(0),1]});
 for(let j=0;j<e.anchors.length;j++){const a=e.anchors[j],ctx=T.context(data,expected[j]);demand(a.node===ctx.node&&same(a.route,expected[j])&&a.path===A.path(data,expected[j])&&same(ctx.binders,e.context)&&a.contextAbstractionRoundtrip===true,'anchor route/context/roundtrip');}
 demand(e.roots.length===5+e.parameters+e.index,'template roots');T.validateExpressionGraph(e.templateGraph,e.roots,e.context.length+e.anchors.length,32768);
 T.validateExpressionGraph(e.metadataGraph,[e.signatureRoot],0,32768);
 const view=V.instantiate(e.templateGraph,e.roots[0],data,e.anchors.map(a=>a.node),e.context.length,{roots:e.roots,templateSha256:e.templateSha256}),g=view.graph,rs=view.roots;
 demand(V.equal(g,rs[0],data,inputNode).equal,'borrowed input');
 const normalized=spine(g,rs[2]);demand(g.kind[normalized.head]===4&&g.payloads[normalized.head].name===e.family&&A.levelNameIdentity(g.payloads[normalized.head].nameParts)===A.levelNameIdentity(e.familyNameParts)&&A.levelsKey(g.payloads[normalized.head].levels)===A.levelsKey(e.levels)&&normalized.args.length===e.parameters,'normalized structure type');
 for(let j=0;j<e.parameters;j++)demand(V.equal(g,rs[5+j],g,normalized.args[j]).equal,'parameter order');
 for(let j=0;j<e.index;j++){const r=rs[5+e.parameters+j],p=g.payloads[r];demand(g.kind[r]===11&&p.typeName===e.family&&p.index===j&&A.levelNameIdentity(p.typeNameParts)===A.levelNameIdentity(e.familyNameParts)&&V.equal(g,g.children[r][0],data,inputNode).equal,'earlier projection');}
 const m=e.metadataGraph;let formal=e.signatureRoot;const binders=[];
 while(m.kind[formal]===7){demand(binders.length<256,'constructor telescope bound');binders.push(formal);formal=m.children[formal][1];}
 demand(binders.length===e.parameters+e.fields,'constructor telescope arity');const family=spine(m,formal);demand(m.kind[family.head]===4&&m.payloads[family.head].name===e.family&&A.levelNameIdentity(m.payloads[family.head].nameParts)===A.levelNameIdentity(e.familyNameParts)&&A.levelsKey(m.payloads[family.head].levels)===A.levelsKey(e.levels)&&family.args.length===e.parameters,'constructor family');
 for(let j=0;j<e.parameters;j++)demand(m.kind[family.args[j]]===0&&m.payloads[family.args[j]].index===binders.length-1-j,'constructor parameter position');
 const field=binders[e.parameters+e.index];demand(m.payloads[field].binderName===e.fieldName&&m.payloads[field].binderInfo===e.binderInfo,'field identity');
 const derived=V.instantiate(m,m.children[field][0],g,rs.slice(5),e.context.length,{allowExternal:false,templateSha256:e.metadataSha256});
 const comparison=V.equal(derived.graph,derived.root,g,rs[4]);demand(comparison.equal,'independent expected field reconstruction');
 return{view,derived,comparison,record};
}
const routeKey=r=>r.root+':'+r.slots.join('.');
function provider(pkg,data,record,sha256,file){
 demand(pkg.format==='ProofAtlasSourceReferencePackage/2'&&same(pkg.source,{...pkg.source,name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256})&&pkg.nativeDagMatchesPacket===true&&pkg.leanVersion==='4.33.1','package/source binding');
 demand(/^[a-f0-9]{64}$/.test(sha256)&&/^[a-f0-9]{64}$/.test(pkg.producerSha256)&&/^[a-f0-9]{64}$/.test(pkg.requestSha256),'package producer/request identity');
 const env=pkg.environment;demand(env&&env.compiler?.includes('version 4.33.1,'),'compiler provenance');
 if(env.kind==='existing-project-projection/1'){const m=env.sourceModules?.[record.module];demand(pkg.sourceModuleHashVerified===true&&m?.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(m.compiledModuleSha256)&&/^[a-f0-9]{64}$/.test(env.lakeManifestSha256)&&/^[a-f0-9]{40}$/.test(env.dependencyRevisions?.mathlib)&&Object.values(env.dependencyRevisions).every(r=>/^[a-f0-9]{40}$/.test(r)),'compiled project provenance');}
 else if(env.kind==='self-contained-lean/1')demand(pkg.sourceModuleHashVerified===true&&pkg.source.edition==='recursion-controls'&&env.module==='ProofAtlasExamples.Recursion'&&env.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(env.compiledModuleSha256),'recursion provenance');
 else demand(env.kind==='fresh-source-reference-control/1'&&pkg.source.edition==='source-reference-controls'&&record.module==='ReferenceFixture'&&env.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(env.compiledModuleSha256),'synthetic source provenance');
 demand(Array.isArray(pkg.entries)&&pkg.entries.length>0&&pkg.entries.length<=512,'query bound');
 const records=new Map(),observations=new Map(),known=new WeakSet();
 for(const raw of pkg.entries){const key=routeKey(raw.route);demand(!records.has(key),'duplicate query');const prepared=validate(raw,data,record);records.set(key,prepared);const {view}=prepared;
  const observation=(at,typeRoot,role,text,component)=>{const e={status:'checked',kernelCheck:'PASS',contextWellFormed:true,typeAbstractionRoundtrip:true,node:at.node,route:at.route,path:at.path,context:raw.context,typeRoot,typeGraph:view.graph,role,typeText:text,sourceReference:true,referenceProjection:component===3,referenceComponent:component,referenceQuery:raw.route,referenceTemplateSha256:raw.templateSha256,referenceTemplateRoots:raw.roots,arguments:[]};known.add(e);return e;};
  prepared.selected=observation(raw,view.roots[3],raw.role,raw.typeText,3);prepared.input=observation(raw.anchors[0],view.roots[1],raw.structureRole,raw.structureTypeText,1);prepared.entry=raw;
 }
 for(const p of records.values())observations.set(routeKey(p.selected.route),p.selected);
 for(const p of records.values()){const key=routeKey(p.input.route),old=observations.get(key);if(old)demand(old.role===p.input.role&&same(old.context,p.input.context)&&V.equal(old.typeGraph,old.typeRoot,p.input.typeGraph,p.input.typeRoot).equal,'conflicting structure type');else observations.set(key,p.input);}
 return{source:pkg.source,sha256,file,checked:records.size,queried:pkg.entries.length,get:r=>observations.get(routeKey(r)),isObservation:e=>known.has(e),getRecord:r=>records.get(routeKey(r)),recordFor:e=>known.has(e)?records.get(routeKey(e.referenceQuery)):null};
}
let pendingLoad=null;
const aborted=s=>{if(s?.aborted)throw s.reason||Error('Source reference load cancelled');};
async function awaitLoad(job,signal){if(!signal)return job.catch(()=>{});aborted(signal);let cancel;try{await Promise.race([job.catch(()=>{}),new Promise((_,reject)=>{cancel=()=>reject(signal.reason||Error('Source reference load cancelled'));signal.addEventListener('abort',cancel,{once:true});})]);}finally{signal.removeEventListener('abort',cancel);}}
async function open(d,data,record,{signal}={}){
 aborted(signal);demand(d.name===record.name&&d.indexSha256===record.indexSha256&&d.sourceSha256===record.sourceSha256&&/^[a-f0-9]{64}$/.test(d.sha256)&&Number.isInteger(d.decodedBytes)&&d.decodedBytes>0&&d.decodedBytes<=16*1024**2,'descriptor identity/bounds');
 while(pendingLoad){await awaitLoad(pendingLoad,signal);aborted(signal);}
 const job=(async()=>{const pkg=await A.compressed(d.file,d.sha256,{maxBytes:16*1024**2,expectedBytes:d.decodedBytes,signal});aborted(signal);demand(pkg.source.edition===d.edition&&pkg.producerSha256===d.producerSha256&&pkg.requestSha256===d.requestSha256,'descriptor provenance');
  demand(Array.isArray(pkg.entries)&&pkg.entries.length>0&&pkg.entries.length<=512,'query bound');for(const e of pkg.entries){for(const [field,graph]of [['templateSha256',e.templateGraph],['metadataSha256',e.metadataGraph]]){aborted(signal);demand(await A.digest(new TextEncoder().encode(JSON.stringify(graph)))===e[field],'template/metadata hash');}}
  aborted(signal);const p=provider(pkg,data,record,d.sha256,d.file);demand(p.checked===d.checked,'descriptor query count');return p;})();pendingLoad=job;try{return await job;}finally{if(pendingLoad===job)pendingLoad=null;}
}
function mount(container,{typing,observation,record,data,onProofOccurrence}){
 const p=typing.recordFor(observation);demand(p,'selected reference observation');const e=p.entry,B=node?require('./proof-atlas-beta-reduction'):host.ProofAtlasBetaReduction;
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},controls=el('div'),viewport=el('div'),message=el('p');controls.className='pl-actions';viewport.className='pl-beta-reduction';message.setAttribute('role','status');
 container.classList.add('pl-beta-reduction','pl-source-reference-types');const nativeText=el('pre'),nativePresentation=el('details');nativeText.tabIndex=0;nativePresentation.append(el('summary','Native type text · presentation'),nativeText);
 container.replaceChildren(el('h4','Source-backed field types'),el('p','Native field projection · '+e.family+'.'+e.fieldName+' · Γ'+e.context.length+'. The templates substitute exact source regions without copying their subtrees.'),controls,message,nativePresentation,viewport);
 let mounted=null,disposed=false,active=observation.referenceComponent;
 const choices=[[3,'Result type'],[4,'Expected field type'],[1,'Structure type'],[2,'Normalized structure type']];
 for(const [component,title]of choices){const b=el('button',title);b.type='button';b.dataset.referenceComponent=component;b.onclick=()=>render(component);controls.append(b);}
 function render(component){if(disposed)return;active=component;mounted?.dispose();viewport.replaceChildren();for(const b of controls.children)b.setAttribute('aria-pressed',String(Number(b.dataset.referenceComponent)===component));
  try{const validated=validate(e,data,record),view=validated.view,root=view.roots[component],selectedView={...view,root},computedData={...view.graph,serialization:'ExprDAG/1',roots:[root],declaration:{name:record.name,rootPaths:['source-reference.result']}};
   message.textContent=choices.find(c=>c[0]===component)[1]+' · native root · original source selection retained.';nativeText.textContent=component===4?e.expectedText:component===1?e.structureTypeText:component===3?e.typeText:'The normalized type is retained in the shared expression graph.';
   mounted=B.mountComputed(viewport,{data,record,onProofOccurrence,prepared:{computedData,entry:null},domPrefix:'reference',namespace:'source-reference-view',showExpression:true,computedNote:'Only the recorded complete type roots have native evidence. Computed descendants have separate routes; borrowed regions return to their exact original occurrence.',provenanceTitle:'Source-backed type provenance',provenance:s=>({source:s.source,context:s.ambientContext,field:{family:e.family,index:e.index},nativeTemplateRoundtrip:e.templateInstantiationStructuralRoundtrip,projectionTyping:e.kernelProjectionTyping,conversion:e.kernelFieldConversion,comparison:validated.comparison,view:view.stats()}),createScene:slots=>V.scene(selectedView,record,e.context,slots,{anchors:e.anchors}),sourceReference:slots=>view.origin(slots,e.anchors,root),onSceneError:error=>{message.textContent='Source-backed view unavailable: '+error.message;}});
  }catch(error){message.textContent='Source-backed view unavailable: '+error.message;}
 }
 render(active);return{getScene:()=>mounted?.getScene()||null,dispose:()=>{disposed=true;mounted?.dispose();container.replaceChildren();}};
}
function register(library,inventory){return(node?require('./proof-atlas-source-reference-examples'):host.ProofAtlasSourceReferenceExamples).register(library,inventory);}
const api={validate,provider,open,mount,register,equal:V.equal,state:()=>({activeLoad:pendingLoad!==null})};if(node)module.exports=api;else host.ProofAtlasSourceReferences=api;
})(typeof window==='undefined'?globalThis:window);
