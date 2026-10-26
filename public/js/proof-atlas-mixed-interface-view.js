/* Mixed source/context interfaces; computed expression ports never acquire new typing. */
(function(host) {
'use strict';
const el = (tag,value,cls) => {const n = document.createElement(tag); if (value !== undefined) n.textContent = value; if (cls) n.className = cls; return n;};
function mount(parent, model, data, scene, callbacks) {
  let disposed = false, rendering = 0, action = 0, scale = 1, selection = null, variableView = null, variableError = null, variableLoading = false, variableRequest = 0, variableLoadController = null;
  const shell = el('section',undefined,'pdu-view'), viewport = el('div',undefined,'pow-viewport'), sizing = el('div',undefined,'pow-sizing'), stage = el('div',undefined,'pdu-stage');
  const status = el('p','Select a source port, recorded type or exact join.','pow-help'), details = el('details'), identity = el('pre');
  shell.dataset.mixedInterfaceView = ''; status.setAttribute('role','status'); identity.tabIndex = 0; details.append(el('summary','Selected formal origins'),identity);
  const sharing = el('input'); sharing.type = 'checkbox'; sharing.checked = true; sharing.dataset.definitionSharing = '';
  const label = el('label'); label.append(sharing,document.createTextNode(' Share structurally identical A / B formula'));
  label.hidden=!scene.units.some(u=>u.format==='ProofAtlasLocalDefinitionUnitPrototype/1');
  shell.append(el('h2','Context interfaces'),el('p','Assumptions and definitions extend the original context. Body types, result types and conversion expressions keep separate formal origins.','pow-help'),label);
  const usesButton=el('button','Recorded variable uses');usesButton.type='button';usesButton.dataset.variableUseActivate='';usesButton.setAttribute('aria-expanded','false');if(callbacks.loadUses)shell.append(usesButton);
  viewport.tabIndex = 0; viewport.setAttribute('aria-label','Context interfaces. Scroll or drag empty space to pan.'); sizing.append(stage); viewport.append(sizing); shell.append(viewport);
  const boundary = el('section',undefined,'pdu-boundary'), continuation = scene.continuation;
  const canContinue = continuation.stop === 'member-budget' && continuation.compatible && ['Pi-introduction','let-binding'].includes(continuation.availableRule);
  const messages = {'member-budget':'More compatible context interfaces remain at the exact body occurrence.','no-construction-record':'No construction record is available at the remaining body occurrence.','different-recorded-interface':'The next recorded interface differs; composition stops here.','non-context-construction':'The next recorded rule is ' + continuation.availableRule + '.','unsupported-unit-rule':'The next context rule is not a local definition; this interface stops here.'};
  boundary.append(el('h3','Remaining body · Γ' + continuation.contextLength),el('p',messages[continuation.stop] || 'Original source boundary retained.','pow-help'));
  const focus = el('button',canContinue ? 'Continue interfaces' : 'Focus remaining source'); focus.type = 'button'; focus.dataset.definitionContinuation = '';
  focus.onclick = () => {if (!disposed) (canContinue ? callbacks.onSource : callbacks.onOriginalSource || callbacks.onSource)(continuation.route);}; boundary.append(focus);
  shell.append(boundary,el('p',scene.sourcePartition.retained + ' retained constructors + ' + scene.sourcePartition.hidden + ' hidden header/body occurrences = ' + scene.sourcePartition.represented + '. Overlapping unit subtrees are not summed.','pow-summary'),status,details);
  function clear() {variableView?.clearSelection();stage.querySelectorAll('[aria-pressed]').forEach(b => b.setAttribute('aria-pressed','false')); stage.querySelectorAll('[data-definition-unit]').forEach(n => n.dataset.highlight = 'false');}
  function highlight(indices, ids) {clear(); stage.querySelectorAll('[data-definition-unit]').forEach(n => n.dataset.highlight = String(indices.includes(Number(n.dataset.definitionUnit)))); for (const id of ids) stage.querySelectorAll('[data-definition-port="' + id + '"],[data-definition-type="' + id + '"]').forEach(b => b.setAttribute('aria-pressed','true'));}
  function address(index,id) {return {unit:index,field:({declared:'type',domain:'binderType',domainSort:'binderType',valueType:'value',bodyType:'body',conclusionType:'conclusion',root:'conclusion',codomain:'conclusion',expectedBody:'conclusion',correspondence:'binding'})[id] || id};}
  function pick(index,id,showType=false) {
    const u = scene.units[index], value = id==='correspondence'?u.binderCorrespondence:u.ports[id] || u[id], a = address(index,id), route = model.resolve(scene,a);
    selection = {kind:'port',unit:index,id,value}; highlight([index],[index + '-' + id]); identity.textContent = JSON.stringify({source:scene.source,...selection},null,2);
    status.textContent = id==='codomain'?'Syntax inside recorded R; no additional typing judgment.':id === 'binding' ? 'Original context extension. This interface records no introduced-variable typing judgment.' : value.namespace === 'computed-native-type' ? 'Recorded type component; its source anchor and native origin are retained.' : 'Original source occurrence in Γ' + value.contextLength + '.';
    if (showType) return {address:a,route,typeRoute:id==='codomain'?u.ports.codomain.typeRoute:null};
    if(['expectedBody','correspondence'].includes(id)){details.open=true;status.textContent=id==='expectedBody'?'Expected D is a recorded expression in original Γ+x. No additional typing judgment.':'Original source λ and computed type Π binders correspond; their identities remain distinct.';}
    const typed = !['declared','domain','binding','expectedBody','correspondence'].includes(id);
    callbacks.onSelect(route,typed ? callbacks.lazyTypes ? () => model.typeFor(scene,a) : model.typeFor(scene,a) : null);
  }
  function sourceButton(parent,index,id,title) {
    const epoch = rendering, b = el('button',title); b.type = 'button'; b.dataset.definitionPort = index + '-' + id; b.dataset.constructionPoint = ''; b.setAttribute('aria-pressed','false'); b.onclick = () => {if (!disposed && epoch === rendering) {action++; pick(index,id);}}; parent.append(b);
  }
  function typeButton(parent,index,id,title) {
    const epoch = rendering, b = el('button',title); b.type = 'button'; b.dataset.definitionType = index + '-' + id; b.setAttribute('aria-pressed','false');
    b.onclick = async () => {if (disposed || epoch !== rendering) return; const serial = ++action, p = pick(index,id,true); b.disabled = true;
      try {callbacks.onTypeStart?.(); const entry = await model.typeFor(scene,p.address); if (!disposed && serial === action && epoch === rendering) await callbacks.onType(p.route,entry,p.typeRoute); else model.releaseType?.(entry);}
      catch (error) {if (!disposed && serial === action && epoch === rendering) status.textContent = 'Recorded type unavailable: ' + error.message;}
      finally {b.disabled = false;}
    }; parent.append(b);
  }
  function pickUse(ref,index,mode){
    action++;selection={kind:'recorded-use',reference:ref,observation:index,mode};highlight(ref.kind==='retained-binder'?[ref.target.unit]:[],[]);identity.textContent=JSON.stringify({source:scene.source,...selection},null,2);status.textContent='Recorded '+ref.use.role+' use e'+ref.use.node+' in its original Γ'+ref.use.contextLength+'. Its observation does not type the enclosing region.';
  }
  async function activateUses(index=null){
    if(variableView){if(index!==null)return variableView.setFilter(index);variableLoadController?.abort();variableView.dispose();variableView=null;usesButton.textContent='Recorded variable uses';usesButton.setAttribute('aria-expanded','false');action++;return;}
    const request=++variableRequest,serial=++action,epoch=rendering,live=()=>!disposed&&serial===action&&epoch===rendering;variableLoadController?.abort();variableLoadController=new AbortController();variableLoading=true;variableError=null;usesButton.disabled=true;status.textContent='Loading recorded variable-use references…';
    try{const provider=await callbacks.loadUses(variableLoadController.signal);if(!live()){provider.dispose();return;}
      variableView=host.ProofAtlasVariableUseView.mount(shell,stage,scene,provider,{
        onPick:pickUse,onReset:()=>{action++;selection=null;},
        onSource:ref=>{const current=action;return callbacks.onUseSource(ref,()=>!disposed&&current===action&&epoch===rendering);},
        onBinder:ref=>{const current=action;return callbacks.onUseBinder(ref,()=>!disposed&&current===action&&epoch===rendering);},
        onType:async(ref,choice)=>{const current=action,liveChoice=()=>!disposed&&current===action&&epoch===rendering;let entry;
          try{callbacks.onTypeStart?.();entry=await callbacks.typeForUse(ref,choice,liveChoice);if(liveChoice())await callbacks.onType(ref.use.route,entry);else model.releaseType?.(entry);}
          catch(error){if(liveChoice())throw error;model.releaseType?.(entry);}
        },
        onFocus:route=>callbacks.onOriginalSource(route)
      });
      usesButton.textContent='Hide recorded uses';usesButton.setAttribute('aria-expanded','true');await variableView.setFilter(index);
    }catch(error){if(live()){variableError=error.message;status.textContent='Recorded variable uses unavailable: '+error.message;}}
    finally{if(request===variableRequest){variableLoading=false;usesButton.disabled=false;}}
  }
  function formula(parent,caption,title) {const n = el('div',caption.text,'pdu-formula'); n.tabIndex = 0; n.setAttribute('role','region'); n.setAttribute('aria-label',title); n.dataset.recordedCaption = caption.category; n.dataset.captionOrigin = caption.origin.originKey; parent.append(n); if (caption.truncatedByCaptionBudget) parent.append(el('small','Recorded text truncated; exact origin retained.'));}
  function render() {
    variableRequest++;variableLoadController?.abort();variableLoading=false;usesButton.disabled=false;variableView?.dispose();variableView=null;usesButton.textContent='Recorded variable uses';usesButton.setAttribute('aria-expanded','false');
    rendering++; action++; selection = null; identity.textContent = ''; status.textContent = 'Select a source port, recorded type or exact join.'; stage.replaceChildren();
    stage.append(el('p','Γ' + scene.root.contextLength + ' → Γ' + scene.continuation.contextLength + ' · ' + scene.units.length + ' context extensions','pdu-extent'));
    for (const [i,u] of scene.units.entries()) {
      const row = el('article',undefined,'pdu-row'); row.dataset.definitionUnit = i; row.dataset.highlight = 'false'; row.setAttribute('aria-label','Definition ' + (i + 1) + ': ' + u.binding.name);
      const intro=u.rule==='Pi-introduction';row.dataset.interfaceRule=intro?'Pi-introduction':'let-binding';row.setAttribute('aria-label',(intro?'Introduction ':'Definition ')+(i+1)+': '+u.binding.name);
      const value = el('section',undefined,'pdu-card pdu-value');
      if(intro){
        value.append(el('h3','Domain A'),el('p','Prior context Γ'+u.context.length,'pow-help'));formula(value,u.ports.domain.caption,'Original domain A');
        const ports=el('div',undefined,'pdu-ports');sourceButton(ports,i,'domain','A · source');value.append(ports);
        const sort=el('div',undefined,'pdu-type-block');sort.append(el('h4','Recorded type of A'));formula(sort,u.ports.domainSort.caption,'Recorded type of A');const p=el('div',undefined,'pdu-ports');typeButton(p,i,'domainSort','Type of A · geometry');sort.append(p);value.append(sort);
      }else{
        value.append(el('h3','Value · ' + u.value.role),el('p','Prior context Γ' + u.context.length,'pow-help'),el('p',u.value.head.label,'pdu-formula'));
        const vPorts=el('div',undefined,'pdu-ports');sourceButton(vPorts,i,'value','Value · source');value.append(vPorts);
        const shared=sharing.checked&&u.sharing.structuralEquality,declared=el('div',undefined,'pdu-type-block');declared.append(el('h4',shared?'Declared A / recorded B':'Declared type A'));formula(declared,u.ports.declared.caption,'Declared type A');
        const aPorts=el('div',undefined,'pdu-ports');sourceButton(aPorts,i,'declared','A · source');if(shared)typeButton(aPorts,i,'valueType','B · recorded type');declared.append(aPorts);if(shared)declared.append(el('small','One formula; two separate formal ports.'));value.append(declared);
        if(!shared){const inferred=el('div',undefined,'pdu-type-block');inferred.append(el('h4','Recorded value type B'));formula(inferred,u.ports.valueType.caption,'Recorded value type B');const p=el('div',undefined,'pdu-ports');typeButton(p,i,'valueType','B · recorded type');inferred.append(p);value.append(inferred);}
        const conversion=el('p','B ≡ A · recorded conversion','pdu-conversion');conversion.dataset.interfaceConversion='value';conversion.dataset.interfaceChecks='kernelValueConversion';value.append(conversion);
      }
      const binding=el('section',undefined,'pdu-card pdu-binding');binding.append(el('p',(intro?'Introduction ':'Definition ')+(i+1),'pow-help'),el('h3',(intro?'λ '+u.binding.name+' : A':u.binding.name+' := v')),el('p','Γ'+u.binding.from+' → Γ'+u.binding.to,'pdu-context'));
      binding.append(el('p',intro?'Assumption extension.':'Definition extension.','pow-help'),el('p','The introduced variable has no separate typing record in this interface.','pow-help'));
      const bPorts=el('div',undefined,'pdu-ports');sourceButton(bPorts,i,'binding','Context extension');sourceButton(bPorts,i,'root',(intro?'Whole λ':'Whole let')+' · source');if(intro)sourceButton(bPorts,i,'correspondence','Source λ ↔ type Π');binding.append(bPorts);
      if(callbacks.loadUses){const b=el('button','Recorded uses of '+u.binding.name),epoch=rendering;b.type='button';b.dataset.variableUseBinder=i;b.onclick=()=>{if(!disposed&&epoch===rendering)activateUses(i);};bPorts.append(b);}
      const result = el('section',undefined,'pdu-card'); result.append(el('h3','Body and result'));
      for (const [title,id,field,scope] of [['Body type C','bodyType','body',u.body.contextLength],['Result type R','conclusionType','root',u.context.length]]) {
        const block = el('div',undefined,'pdu-type-block'); block.append(el('h4',title + ' · Γ' + scope)); formula(block,u.ports[id].caption,title);
        const p = el('div',undefined,'pdu-ports'); if (field === 'body') sourceButton(p,i,field,'Body · source'); typeButton(p,i,id,field === 'body' ? 'C · recorded type' : 'R · recorded type'); block.append(p); result.append(block);
      }
      if(intro){
        const expected=el('div',undefined,'pdu-type-block');expected.append(el('h4','Expected D · original Γ'+u.body.contextLength),el('p','Native expression e'+u.ports.expectedBody.root+'. No additional typing judgment.','pow-help'));
        const p=el('div',undefined,'pdu-ports');sourceButton(p,i,'expectedBody','D · expression origin');typeButton(p,i,'codomain','R codomain · geometry');expected.append(p);result.append(expected);
        const conversion=el('p','C ≡ D · recorded body conversion','pdu-conversion');conversion.dataset.interfaceConversion='body';conversion.dataset.interfaceChecks='kernelBodyConversion';conversion.dataset.structuralEquality=String(u.bodyConversion.structuralEquality);result.append(conversion,el('small',u.bodyConversion.structuralEquality?'C and D have matching syntax; their formal ports remain separate.':'C and D have different syntax. The recorded conversion relates them.'));
        const functionConversion=el('p','R ≡ Π(x : A), D · recorded function conversion','pdu-conversion');functionConversion.dataset.interfaceConversion='function';functionConversion.dataset.interfaceChecks='kernelFunctionConversion';result.append(functionConversion,el('small','The codomain in R uses a computed Π binder; D uses the original source extension.'));
      }else{
        const substitution=el('p','C[v/x] ≡ R · recorded result conversion','pdu-conversion');substitution.dataset.interfaceConversion='result';substitution.dataset.interfaceChecks='kernelResultTypeConversion,kernelSubstitutedTypeConversion';result.append(substitution);
      }
      const assignment=el('span',intro?'A →':':= →','pdu-assignment'),extension=el('span','Γ+ →','pdu-extension');assignment.setAttribute('aria-hidden','true');extension.setAttribute('aria-hidden','true');row.append(value,binding,result,assignment,extension); stage.append(row);
      if (i < scene.joins.length) {
        const j = scene.joins[i], join = el('section',undefined,'pdu-join'), epoch = rendering, b = el('button','Inspect join ' + (i + 1)); b.type = 'button'; b.dataset.definitionJoin = i; b.setAttribute('aria-pressed','false');
        join.append(el('p','Body ' + (i + 1) + ' = next whole expression ' + (i + 2) + ' · Γ' + j.sourcePosition.contextLength),b);
        b.onclick = () => {if (disposed || epoch !== rendering) return; action++; selection = {kind:'join',index:i,value:j}; highlight([i,i+1],[i + '-body',i + '-bodyType',(i+1) + '-root',(i+1) + '-conclusionType']); b.setAttribute('aria-pressed','true'); identity.textContent = JSON.stringify({source:scene.source,...selection},null,2); status.textContent = 'Same source occurrence and structurally equal recorded types. The parent body and next conclusion keep distinct native origins.'; callbacks.onSelect(j.sourcePosition.route,callbacks.lazyTypes ? () => model.typeFor(scene,{unit:i,field:'body'}) : model.typeFor(scene,{unit:i,field:'body'}));}; stage.append(join);
      }
    }
    resize();callbacks.onRender?.();
  }
  function resize() {if (disposed) return; sizing.style.width = stage.offsetWidth * scale + 'px'; sizing.style.height = stage.offsetHeight * scale + 'px';}
  function setScale(value) {scale = value; stage.style.transform = 'scale(' + scale + ')'; resize();}
  let drag = null; viewport.addEventListener('pointerdown',e => {if (e.target.closest('.pdu-card,button,a,.pdu-formula,.pdu-join')) return; drag = {x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop}; viewport.setPointerCapture(e.pointerId);}); viewport.addEventListener('pointermove',e => {if (drag) viewport.scrollTo(drag.left + drag.x - e.clientX,drag.top + drag.y - e.clientY);}); for (const name of ['pointerup','pointercancel']) viewport.addEventListener(name,() => {drag = null;});
  const observer = new ResizeObserver(resize); observer.observe(stage); sharing.onchange = render;
  usesButton.onclick=()=>{if(!disposed)activateUses();};
  parent.replaceChildren(shell); parent.hidden = false; render(); setScale(1);
  return {getScene:() => scene,getSelection:() => selection,getVariableUseState:()=>variableView?.getState()||{loading:variableLoading,error:variableError},setScale,select:route => {if (disposed||selection?.kind==='recorded-use') return; const indices = scene.units.map((u,i) => [u.root.route,u.body.route].some(r => r.root === route.root && r.depth === route.depth && r.slots === route.slots) ? i : -1).filter(i => i >= 0); if (indices.length) highlight(indices,[]);},dispose:() => {disposed = true; action++; rendering++; variableRequest++;variableLoadController?.abort();variableView?.dispose();variableView=null;observer.disconnect(); shell.remove(); parent.hidden = true;}};
}
host.ProofAtlasMixedInterfaceView = {mount};
})(typeof window === 'undefined' ? globalThis : window);
