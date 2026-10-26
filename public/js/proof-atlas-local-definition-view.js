/* Same definition interfaces in complete and paged readers; no independent data loader. */
(function(host) {
'use strict';
const el = (tag,value,cls) => {const n = document.createElement(tag); if (value !== undefined) n.textContent = value; if (cls) n.className = cls; return n;};
function mount(parent, model, data, scene, callbacks) {
  let disposed = false, rendering = 0, action = 0, scale = 1, selection = null;
  const shell = el('section',undefined,'pdu-view'), viewport = el('div',undefined,'pow-viewport'), sizing = el('div',undefined,'pow-sizing'), stage = el('div',undefined,'pdu-stage');
  const status = el('p','Select a source port, recorded type or exact join.','pow-help'), details = el('details'), identity = el('pre');
  shell.dataset.localDefinitionView = ''; status.setAttribute('role','status'); identity.tabIndex = 0; details.append(el('summary','Selected formal origins'),identity);
  const sharing = el('input'); sharing.type = 'checkbox'; sharing.checked = true; sharing.dataset.definitionSharing = '';
  const label = el('label'); label.append(sharing,document.createTextNode(' Share structurally identical A / B formula'));
  shell.append(el('h2','Local definitions'),el('p','Values and their types stay before the new binder. Bodies use the extended context. Joins retain both native origins.','pow-help'),label);
  viewport.tabIndex = 0; viewport.setAttribute('aria-label','Local-definition interfaces. Scroll or drag empty space to pan.'); sizing.append(stage); viewport.append(sizing); shell.append(viewport);
  const boundary = el('section',undefined,'pdu-boundary'), continuation = scene.continuation;
  const canContinue = continuation.status === 'member-budget' && continuation.compatible && continuation.availableRule === 'let-binding';
  const messages = {'member-budget':'More compatible local definitions remain at the exact body occurrence.','no-construction-record':'No construction record is available at the remaining body occurrence.','different-recorded-interface':'The next recorded interface differs; composition stops here.','non-context-construction':'The next recorded rule is ' + continuation.availableRule + '.','unsupported-unit-rule':'The next context rule is not a local definition; this interface stops here.'};
  boundary.append(el('h3','Remaining body · Γ' + continuation.contextLength),el('p',messages[continuation.status] || 'Original source boundary retained.','pow-help'));
  const focus = el('button',canContinue ? 'Continue definitions' : 'Focus remaining source'); focus.type = 'button'; focus.dataset.definitionContinuation = '';
  focus.onclick = () => {if (!disposed) (canContinue ? callbacks.onSource : callbacks.onOriginalSource || callbacks.onSource)(continuation.route);}; boundary.append(focus);
  shell.append(boundary,el('p',scene.sourcePartition.retained + ' retained lets + ' + scene.sourcePartition.hidden + ' hidden header/body occurrences = ' + scene.sourcePartition.represented + '. Overlapping unit subtrees are not summed.','pow-summary'),status,details);
  function clear() {stage.querySelectorAll('[aria-pressed]').forEach(b => b.setAttribute('aria-pressed','false')); stage.querySelectorAll('[data-definition-unit]').forEach(n => n.dataset.highlight = 'false');}
  function highlight(indices, ids) {clear(); stage.querySelectorAll('[data-definition-unit]').forEach(n => n.dataset.highlight = String(indices.includes(Number(n.dataset.definitionUnit)))); for (const id of ids) stage.querySelectorAll('[data-definition-port="' + id + '"],[data-definition-type="' + id + '"]').forEach(b => b.setAttribute('aria-pressed','true'));}
  function address(index,id) {return {unit:index,field:({declared:'type',valueType:'value',bodyType:'body',conclusionType:'conclusion',root:'conclusion'})[id] || id};}
  function pick(index,id,showType=false) {
    const u = scene.units[index], value = u.ports[id] || u[id], a = address(index,id), route = model.resolve(scene,a);
    selection = {kind:'port',unit:index,id,value}; highlight([index],[index + '-' + id]); identity.textContent = JSON.stringify({source:scene.source,...selection},null,2);
    status.textContent = id === 'binding' ? 'Original context extension. This interface records no introduced-variable typing judgment.' : value.namespace === 'computed-native-type' ? 'Recorded type component; its source anchor and native origin are retained.' : 'Original source occurrence in Γ' + value.contextLength + '.';
    if (showType) return {address:a,route};
    const typed = !['declared','binding'].includes(id);
    callbacks.onSelect(route,typed ? callbacks.lazyTypes ? () => model.typeFor(scene,a) : model.typeFor(scene,a) : null);
  }
  function sourceButton(parent,index,id,title) {
    const epoch = rendering, b = el('button',title); b.type = 'button'; b.dataset.definitionPort = index + '-' + id; b.dataset.constructionPoint = ''; b.setAttribute('aria-pressed','false'); b.onclick = () => {if (!disposed && epoch === rendering) {action++; pick(index,id);}}; parent.append(b);
  }
  function typeButton(parent,index,id,title) {
    const epoch = rendering, b = el('button',title); b.type = 'button'; b.dataset.definitionType = index + '-' + id; b.setAttribute('aria-pressed','false');
    b.onclick = async () => {if (disposed || epoch !== rendering) return; const serial = ++action, p = pick(index,id,true); b.disabled = true;
      try {callbacks.onTypeStart?.(); const entry = await model.typeFor(scene,p.address); if (!disposed && serial === action && epoch === rendering) callbacks.onType(p.route,entry); else model.releaseType?.(entry);}
      catch (error) {if (!disposed && serial === action && epoch === rendering) status.textContent = 'Recorded type unavailable: ' + error.message;}
      finally {b.disabled = false;}
    }; parent.append(b);
  }
  function formula(parent,caption,title) {const n = el('div',caption.text,'pdu-formula'); n.tabIndex = 0; n.setAttribute('role','region'); n.setAttribute('aria-label',title); n.dataset.recordedCaption = caption.category; n.dataset.captionOrigin = caption.origin.originKey; parent.append(n); if (caption.truncatedByCaptionBudget) parent.append(el('small','Recorded text truncated; exact origin retained.'));}
  function render() {
    rendering++; action++; selection = null; identity.textContent = ''; status.textContent = 'Select a source port, recorded type or exact join.'; stage.replaceChildren();
    stage.append(el('p','Γ' + scene.root.contextLength + ' → Γ' + scene.continuation.contextLength + ' · ' + scene.units.length + ' local definitions','pdu-extent'));
    for (const [i,u] of scene.units.entries()) {
      const row = el('article',undefined,'pdu-row'); row.dataset.definitionUnit = i; row.dataset.highlight = 'false'; row.setAttribute('aria-label','Definition ' + (i + 1) + ': ' + u.binding.name);
      const value = el('section',undefined,'pdu-card pdu-value'); value.append(el('h3','Value · ' + u.value.role),el('p','Prior context Γ' + u.context.length,'pow-help'),el('p',u.value.head.label,'pdu-formula'));
      const vPorts = el('div',undefined,'pdu-ports'); sourceButton(vPorts,i,'value','Value · source'); value.append(vPorts);
      const shared = sharing.checked && u.sharing.structuralEquality, declared = el('div',undefined,'pdu-type-block'); declared.append(el('h4',shared ? 'Declared A / recorded B' : 'Declared type A')); formula(declared,u.ports.declared.caption,'Declared type A');
      const aPorts = el('div',undefined,'pdu-ports'); sourceButton(aPorts,i,'declared','A · source'); if (shared) typeButton(aPorts,i,'valueType','B · recorded type'); declared.append(aPorts); if (shared) declared.append(el('small','One formula; two separate formal ports.')); value.append(declared);
      if (!shared) {const inferred = el('div',undefined,'pdu-type-block'); inferred.append(el('h4','Recorded value type B')); formula(inferred,u.ports.valueType.caption,'Recorded value type B'); const p = el('div',undefined,'pdu-ports'); typeButton(p,i,'valueType','B · recorded type'); inferred.append(p); value.append(inferred);}
      const conversion = el('p','B ≡ A · recorded conversion','pdu-conversion'); conversion.dataset.definitionConversion = 'value'; conversion.dataset.definitionChecks = 'kernelValueConversion'; value.append(conversion);
      const binding = el('section',undefined,'pdu-card pdu-binding'); binding.append(el('p','Definition ' + (i + 1),'pow-help'),el('h3',u.binding.name + ' := v'),el('p','Γ' + u.binding.from + ' → Γ' + u.binding.to,'pdu-context'));
      binding.append(el('p','Declared type at port A.','pow-help'));
      const bPorts = el('div',undefined,'pdu-ports'); sourceButton(bPorts,i,'binding','Context extension'); sourceButton(bPorts,i,'root','Whole let · source'); binding.append(bPorts);
      const result = el('section',undefined,'pdu-card'); result.append(el('h3','Body and result'));
      for (const [title,id,field,scope] of [['Body type C','bodyType','body',u.body.contextLength],['Result type R','conclusionType','root',u.context.length]]) {
        const block = el('div',undefined,'pdu-type-block'); block.append(el('h4',title + ' · Γ' + scope)); formula(block,u.ports[id].caption,title);
        const p = el('div',undefined,'pdu-ports'); if (field === 'body') sourceButton(p,i,field,'Body · source'); typeButton(p,i,id,field === 'body' ? 'C · recorded type' : 'R · recorded type'); block.append(p); result.append(block);
      }
      const substitution = el('p','C[v/x] ≡ R · recorded result conversion','pdu-conversion'); substitution.dataset.definitionConversion = 'result'; substitution.dataset.definitionChecks = 'kernelResultTypeConversion,kernelSubstitutedTypeConversion'; substitution.setAttribute('aria-label','Recorded result conversion after substituting the value for the local definition ' + u.binding.name + ' in the body type'); result.append(substitution);
      const assignment = el('span',':= →','pdu-assignment'), extension = el('span','Γ+ →','pdu-extension'); assignment.setAttribute('aria-hidden','true'); extension.setAttribute('aria-hidden','true'); row.append(value,binding,result,assignment,extension); stage.append(row);
      if (i < scene.joins.length) {
        const j = scene.joins[i], join = el('section',undefined,'pdu-join'), epoch = rendering, b = el('button','Inspect join ' + (i + 1)); b.type = 'button'; b.dataset.definitionJoin = i; b.setAttribute('aria-pressed','false');
        join.append(el('p','Body ' + (i + 1) + ' = whole definition ' + (i + 2) + ' · Γ' + j.sourcePosition.contextLength),b);
        b.onclick = () => {if (disposed || epoch !== rendering) return; action++; selection = {kind:'join',index:i,value:j}; highlight([i,i+1],[i + '-body',i + '-bodyType',(i+1) + '-root',(i+1) + '-conclusionType']); b.setAttribute('aria-pressed','true'); identity.textContent = JSON.stringify({source:scene.source,...selection},null,2); status.textContent = 'Same source occurrence and structurally equal recorded types. The parent body and next conclusion keep distinct native origins.'; callbacks.onSelect(j.sourcePosition.route,callbacks.lazyTypes ? () => model.typeFor(scene,{unit:i,field:'body'}) : model.typeFor(scene,{unit:i,field:'body'}));}; stage.append(join);
      }
    }
    resize();callbacks.onRender?.();
  }
  function resize() {if (disposed) return; sizing.style.width = stage.offsetWidth * scale + 'px'; sizing.style.height = stage.offsetHeight * scale + 'px';}
  function setScale(value) {scale = value; stage.style.transform = 'scale(' + scale + ')'; resize();}
  let drag = null; viewport.addEventListener('pointerdown',e => {if (e.target.closest('.pdu-card,button,a,.pdu-formula,.pdu-join')) return; drag = {x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop}; viewport.setPointerCapture(e.pointerId);}); viewport.addEventListener('pointermove',e => {if (drag) viewport.scrollTo(drag.left + drag.x - e.clientX,drag.top + drag.y - e.clientY);}); for (const name of ['pointerup','pointercancel']) viewport.addEventListener(name,() => {drag = null;});
  const observer = new ResizeObserver(resize); observer.observe(stage); sharing.onchange = render;
  parent.replaceChildren(shell); parent.hidden = false; render(); setScale(1);
  return {getScene:() => scene,getSelection:() => selection,setScale,select:route => {if (disposed) return; const indices = scene.units.map((u,i) => [u.root.route,u.body.route].some(r => r.root === route.root && r.depth === route.depth && r.slots === route.slots) ? i : -1).filter(i => i >= 0); if (indices.length) highlight(indices,[]);},dispose:() => {disposed = true; action++; rendering++; observer.disconnect(); shell.remove(); parent.hidden = true;}};
}
host.ProofAtlasLocalDefinitionView = {mount};
})(typeof window === 'undefined' ? globalThis : window);
