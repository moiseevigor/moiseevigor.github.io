/* Pi introduction: an explicit context extension and one discharged binder. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
 const demand=(ok,m)=>{if(!ok)throw Error('Lambda judgment: '+m);},key=r=>r.root+':'+r.slots.join('.');
 function create(data,record,typing,route){
  demand(typing?.source.name===record.name&&typing.source.indexSha256===record.indexSha256&&typing.source.sourceSha256===record.sourceSha256,'stale packet');const e=typing.get(route),at=T.context(data,route);demand(e?.status==='checked'&&e.node===at.node&&e.path===A.path(data,route),'no checked occurrence');demand(e.context.length===at.binders.length&&e.context.every((b,j)=>b.node===at.binders[j].node&&key(b.route)===key(at.binders[j].route)),'changed context');T.lambdaRoots(e);T.validateLambda(e,data,e.typeGraph);const t=e.lambdaJudgment;demand(t?.status==='checked','no checked lambda introduction');
  return{format:'ProofAtlasLambdaRule/1',rule:'Pi-introduction',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,typeEvidenceSha256:typing.sha256,judgment:{node:e.node,path:e.path,route}},context:e.context,extendedContext:t.body.context,
   binder:{node:e.node,path:e.path,route,name:t.binderName,info:t.binderInfo},domain:t.domain,body:t.body,
   result:{node:e.node,path:e.path,route,typeRoot:e.typeRoot,piRoot:t.piRoot,role:e.role,text:e.typeText},
   discharge:{node:e.node,path:e.path,route,from:t.body.context.length,to:e.context.length},
   checks:{domainSort:t.kernelDomainSort,binderConversion:t.kernelBinderConversion,bodyConversion:t.kernelBodyConversion,functionConversion:t.kernelFunctionConversion,method:t.conversions},
   guarantee:'Recorded native typing and conversions under the original contexts. Domain checking precedes the binder; the body uses the extended context; the conclusion discharges exactly that binder. Pretty text is presentation, not a portable kernel certificate.'};
 }
 function validate(scene,data,record,typing){demand(JSON.stringify(scene)===JSON.stringify(create(data,record,typing,scene.source.judgment.route)),'changed scope, occurrence or type');return true;}
 function mount(container,config){
  const {data,record,typing,judgmentRoute,onProofOccurrence,onTypeComponent}=config,scene=create(data,record,typing,judgmentRoute),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(tag==='pre')n.tabIndex=0;return n;},button=(title,fn)=>{const b=el('button',title);b.type='button';b.onclick=fn;return b;},typeButton=(title,kind)=>button(title,()=>onTypeComponent({kind})),term=(name,title,value)=>{const b=button(title+' · e'+value.node,()=>onProofOccurrence(value.node,value.route));b.dataset.lambdaTerm=name;b.title=value.path;return b;};
  container.replaceChildren();container.classList.add('pl-lambda-judgment');container.append(el('h4','Lambda introduction · discharge '+scene.binder.name));
  const domain=el('section');domain.className='pl-rule-premise';domain.append(el('h5','Γ ⊢ A : σ · σ reduces to a sort'),term('domain','Domain before the binder',scene.domain),el('pre',scene.domain.text),typeButton('Domain expression A','lambda-domain-expression'),typeButton('Domain type σ','lambda-domain-type'),typeButton('Kernel-normalized sort','lambda-domain-sort'));container.append(domain);
  const frame=el('section');frame.className='pl-lambda-body-frame';frame.append(el('h5','Γ, '+scene.binder.name+' : A'),term('binder','New binder '+scene.binder.name,scene.binder),el('p','The body has one additional binder; the domain above uses Γ.'));
  frame.append(el('h5','Γ, x : A ⊢ b : B′ · '+scene.body.role),term('body','Body in the extended context',scene.body),el('pre',scene.body.text),typeButton('Body type B′','lambda-body-type'),el('p','B′ ≡ B · kernel conversion recorded'));
  if(scene.body.typeRoot!==scene.body.expectedRoot){frame.append(el('p','The recorded body and expected types are structurally different.'),el('pre',scene.body.expectedText));}frame.append(typeButton('Expected body type B','lambda-expected-body'));container.append(frame);
  const bar=el('div','Π introduction · discharge '+scene.binder.name);bar.className='pl-rule-bar';container.append(bar);const result=el('section');result.className='pl-rule-premise pl-rule-result';result.append(el('h5','Γ ⊢ λ x : A, b : τ · '+scene.result.role),term('result','Lambda in the original context',scene.result),el('pre',scene.result.text),typeButton('Lambda type τ','lambda-function-type'),el('p','τ ≡ Π (x : A), B · kernel conversion recorded'),typeButton('Π result type','lambda-pi-type'),typeButton('Π binder domain','lambda-pi-domain'));container.append(result);
  const context=el('details'),list=el('ol');context.append(el('summary','Original Γ · '+scene.context.length+' enclosing binders'));for(const b of scene.context){const li=el('li'),jump=button(b.kind+' · '+b.path,()=>onProofOccurrence(b.node,b.route));jump.dataset.lambdaContext=b.path;li.append(jump);list.append(li);}context.append(list);container.append(context);
  const provenance=el('details');provenance.append(el('summary','Exact introduction provenance'),el('pre',JSON.stringify({source:scene.source,binder:scene.binder,discharge:scene.discharge,domain:scene.domain.path,body:scene.body.path,checks:scene.checks},null,2)),el('p',scene.guarantee));container.append(provenance);
  return{getScene:()=>scene,dispose:()=>container.replaceChildren()};
 }
 const api={create,validate,mount};if(node)module.exports=api;else host.ProofAtlasLambdaJudgment=api;
})(typeof window==='undefined'?globalThis:window);
