/* A checked Pi-application rule, separate from syntactic graph edges. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes;
 const demand=(ok,message)=>{if(!ok)throw Error('Application judgment: '+message);},key=r=>r.root+':'+r.slots.join('.');
 function create(data,record,typing,route,slot=1){
  demand(typing?.source.name===record.name&&typing.source.indexSha256===record.indexSha256&&typing.source.sourceSha256===record.sourceSha256,'stale packet');
  const e=typing.get(route),at=T.context(data,route);demand(e?.status==='checked'&&e.node===at.node&&e.path===A.path(data,route),'no checked judgment at this occurrence');demand(e.context.length===at.binders.length&&e.context.every((b,j)=>b.node===at.binders[j].node&&b.path===at.binders[j].path&&key(b.route)===key(at.binders[j].route)),'changed context');
  T.applicationRoots(e);T.validateApplication(e,data,e.typeGraph);const trace=e.applicationJudgment;demand(trace?.status==='checked','no checked application trace');demand(Number.isInteger(slot)&&slot>=1&&slot<=trace.stages.length,'stage outside trace');
  const s=trace.stages[slot-1],a=e.arguments[slot-1],fRoute={root:s.route.root,slots:[...s.route.slots,0]},f=A.walk(data,fRoute);
  return{format:'ProofAtlasApplicationRule/1',rule:'Pi-application',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,typeEvidenceSha256:typing.sha256,...(e.typingOrigin?{typingOrigin:e.typingOrigin}:{}),judgment:{node:e.node,path:e.path,route}},context:e.context,stage:slot,stages:trace.stages.length,
   function:{node:f,path:A.path(data,fRoute),route:fRoute,role:s.functionRole,typeRoot:s.beforeRoot,piRoot:s.piRoot,text:s.beforeText},
   argument:{node:a.node,path:a.path,route:a.route,role:a.role,typeRoot:s.actualRoot,domainRoot:s.domainRoot,text:s.argumentText,domainText:s.domainText},
   result:{node:s.node,path:s.path,route:s.route,role:s.resultRole,typeRoot:s.afterRoot,substitutedRoot:s.substitutedRoot,text:s.afterText},
   binder:{name:s.binderName,info:s.binderInfo,bodyUsesBinder:s.bodyUsesBinder},conversions:{function:s.kernelFunctionConversion,domain:s.kernelDomainConversion,result:s.kernelResultConversion,method:trace.conversions},
   guarantee:'Native kernel typing and conversions recorded for these exact terms in the original context. Pretty text is abbreviated presentation. This rule does not assert saturation, logical dependency or prose equivalence.'};
 }
 function validate(scene,data,record,typing){const expected=create(data,record,typing,scene.source.judgment.route,scene.stage);demand(JSON.stringify(scene)===JSON.stringify(expected),'changed rule, occurrence or type root');return true;}
 function mount(container,config){
  const {data,record,typing,judgmentRoute,onProofOccurrence,onTypeComponent,onStageChange}=config,el=(tag,text)=>{const n=document.createElement(tag);if(tag==='pre')n.tabIndex=0;if(text!==undefined)n.textContent=text;return n;};let slot=1,scene=null,disposed=false;
  const button=(title,fn)=>{const b=el('button',title);b.type='button';b.onclick=fn;return b;};
  function render(){
   if(disposed)return;scene=create(data,record,typing,judgmentRoute,slot);container.replaceChildren();container.classList.add('pl-application-judgment');container.append(el('h4','Π application · stage '+slot+' of '+scene.stages));
   const controls=el('div'),select=el('select');controls.className='pl-actions';select.setAttribute('aria-label','Application stage');for(let j=1;j<=scene.stages;j++){const o=el('option','Argument '+j);o.value=String(j);select.append(o);}select.value=String(slot);select.onchange=()=>change(Number(select.value));const previous=button('Previous stage',()=>change(slot-1)),next=button('Next stage',()=>change(slot+1));previous.disabled=slot===1;next.disabled=slot===scene.stages;controls.append(previous,select,next);container.append(controls);
   const premises=el('div');premises.className='pl-rule-premises';
   const typeButton=(title,kind)=>button(title,()=>onTypeComponent({kind,slot}));
   function termButton(kind,title,premise){const b=button(title+' · e'+premise.node,()=>onProofOccurrence(premise.node,premise.route));b.dataset.judgmentTerm=kind;b.title=premise.path;return b;}
   function premise(kind,title,value){const section=el('section');section.className='pl-rule-premise';section.append(el('h5',title+' · '+value.role),termButton(kind,kind==='function'?(slot===1?'Function head':'Application through argument '+(slot-1)):kind==='argument'?'Argument '+slot:'Application through argument '+slot,value),el('pre',value.text));return section;}
   const fn=premise('function','Γ ⊢ f : τ',scene.function);fn.append(typeButton('Function type','application-function-type'),typeButton('Convert τ to Π (x : A), B','application-pi-type'));
   const arg=premise('argument','Γ ⊢ a : A′',scene.argument);arg.append(typeButton('Argument type','application-argument-type'),el('p','A′ ≡ A · kernel conversion recorded'));if(scene.argument.typeRoot!==scene.argument.domainRoot)arg.append(el('pre',scene.argument.domainText));else arg.append(el('p','A′ and A are the same recorded type expression.'));arg.append(typeButton('Expected domain A','application-domain'));premises.append(fn,arg);container.append(premises);
   const bar=el('div','Π application');bar.className='pl-rule-bar';container.append(bar);const result=premise('result','Γ ⊢ f a : τ′',scene.result);result.classList.add('pl-rule-result');result.append(typeButton('Result type τ′','application-result-type'),el('p','τ′ ≡ B[a/x] · kernel conversion recorded'),typeButton('Substituted result B[a/x]','application-substitution-type'));container.append(result);
   const dependence=el('p',scene.binder.bodyUsesBinder?'B refers to the current binder. Substitution uses this exact compiled argument.':'B does not contain the current bound variable.');dependence.className='pl-rule-dependence';container.append(dependence);
   const context=el('details'),list=el('ol');context.append(el('summary','Γ · '+scene.context.length+' enclosing binders'));for(const b of scene.context){const li=el('li'),jump=button(b.kind+' · '+b.path,()=>onProofOccurrence(b.node,b.route));jump.dataset.judgmentContext=b.path;li.append(jump);list.append(li);}context.append(list);container.append(context);
   const details=el('details');details.append(el('summary','Exact application provenance'),el('pre',JSON.stringify({source:scene.source,function:scene.function.path,argument:scene.argument.path,result:scene.result.path,conversions:scene.conversions},null,2)),el('p',scene.guarantee));container.append(details);
  }
  function change(next){demand(Number.isInteger(next)&&next>=1&&next<=scene.stages,'stage outside trace');slot=next;onStageChange?.(slot);render();}
  render();return{getScene:()=>scene,selectStage:change,dispose:()=>{disposed=true;container.replaceChildren();}};
 }
 const api={create,validate,mount};if(node)module.exports=api;else host.ProofAtlasApplicationJudgment=api;
})(typeof window==='undefined'?globalThis:window);
