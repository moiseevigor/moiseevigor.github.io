/* Collection geometry and four-vertex computed cuts share one native lease. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
 const labels={'whole':'One output group','scope-fibres':'Group by exact source context','interleaved-reordered':'Reordered groups'},titles={flat:'Flat tuple · F',hierarchical:'Grouped tuple · H',flatten:'flatten : H → F',gather:'gather : F → H'};
 function mount(root,{parent,onCall=()=>{},onSource=()=>{},selectedCall=null,preferredCase='scope-fibres',onCaseChange=()=>{}}){
  const C=host.ProofAtlasOutputComposition,V=host.ProofAtlasComputedTypeNeighborhoodView;
  let disposed=false,lease=null,scene=null,receipt=null,loading=false,caseVersion=0,fieldVersion=0,portVersion=0,contextVersion=0,activeCall=selectedCall,part='type',slots=[],contextChoice=null,contextOffset=0,componentWanted='flatten',caseWanted=Object.hasOwn(labels,preferredCase)?preferredCase:'scope-fibres',outsideCall=null;
  const controller=new AbortController(),box=el('section',undefined,'oc-view'),status=el('p'),tools=el('div',undefined,'an-controls'),geometry=el('div'),statement=el('div'),contexts=el('div'),componentTools=el('div',undefined,'an-controls'),fieldsBox=el('div');
  box.dataset.outputComposition='';status.setAttribute('role','status');box.append(el('h4','Output collection geometry'),status,tools,geometry,statement,contexts,componentTools,fieldsBox);root.replaceChildren(box);
  const button=(label,action)=>{const b=el('button',label);b.type='button';if(loading){b.disabled=true;b.dataset.ocDisabled='false';}b.onclick=()=>{if(!disposed&&!loading&&box.contains(b))action();};return b;};
  const select=el('select');select.setAttribute('aria-label','Output grouping');select.dataset.compositionCase='';tools.append(select);
  const retry=button('Retry output grouping',open);retry.dataset.compositionRetry='';tools.append(retry);
  function busy(value){loading=value;box.setAttribute('aria-busy',String(value));for(const e of box.querySelectorAll('button,select')){if(value){e.dataset.ocDisabled=String(e.disabled);e.disabled=true;}else if(e.dataset.ocDisabled!==undefined){e.disabled=e.dataset.ocDisabled==='true';delete e.dataset.ocDisabled;}}select.disabled=value||!lease;}
  function live(version=caseVersion){return!disposed&&version===caseVersion&&!!lease&&!lease.state().disposed;}
  function origin(){return scene.ports.find(p=>p.call===activeCall)||scene.ports[0];}
  function sourceGuard(){const version=caseVersion,port=portVersion;return()=>live(version)&&!loading&&port===portVersion;}
  function openSource(call,address,extra=()=>true){
   if(!live()||loading)return;markPort(call,true);const valid=sourceGuard();onSource(call,address,()=>valid()&&extra());
  }
  function markPort(call,emit=false){
   if(!scene||!live()){if(!disposed&&!scene){activeCall=call;outsideCall=null;}return;}const found=scene.ports.some(p=>p.call===call),next=found?call:null;if(activeCall===next&&(found||outsideCall===call))return;activeCall=next;outsideCall=found?null:call;portVersion++;
   for(const b of geometry.querySelectorAll('[data-composition-port]'))b.setAttribute('aria-pressed',String(Number(b.dataset.compositionPort)===activeCall));
   drawStatement(call);if(receipt)drawFields(false);if(emit&&found)onCall(call);
  }
  function drawStatement(outside=null){
   statement.replaceChildren();const p=scene.ports.find(p=>p.call===activeCall);
   if(!p){statement.append(el('p','Source selection '+(outside===null?'':'#'+outside+' ')+'has no output position in this collection.','oc-caption'));return;}
   statement.append(el('strong','Output #'+p.call+' · source '+p.originalContextId+' · '+p.originalContextLength+' binders'));
   const pre=el('pre',p.originalTypeText);pre.tabIndex=0;pre.setAttribute('aria-label','Original-context result statement');statement.append(pre);
   statement.append(el('p','Flat position '+(p.position+1)+' ↔ group '+p.group+', local position '+(p.localPosition+1)+'. These positions keep one original occurrence.','oc-caption'));
   const source=button('Open original result #'+p.call,()=>openSource(p.call,p.source));source.dataset.compositionSource='';statement.append(source);
  }
  function drawGeometry(){
   geometry.replaceChildren();const pair=el('div',undefined,'oc-pair'),flat=el('section',undefined,'oc-side'),grouped=el('section',undefined,'oc-side');
   flat.append(el('h5','F · flat outputs at shared Γ'),el('p',scene.commonContextLength+' shared source binders · '+scene.ports.length+' result positions','oc-caption'));
   const flatPorts=el('div',undefined,'oc-ports');for(const p of scene.ports){const b=button('#'+p.call+' · '+p.originalContextId,()=>markPort(p.call,true));b.dataset.compositionPort=String(p.call);b.dataset.compositionFlat=String(p.position);b.setAttribute('aria-label','Flat position '+(p.position+1)+', source result '+p.call);b.setAttribute('aria-pressed',String(p.call===activeCall));flatPorts.append(b);}flat.append(flatPorts);
   const shared=button('Inspect shared Γ frames',()=>showContext('shared'));shared.dataset.compositionShared='';flat.append(shared);
   grouped.append(el('h5','H · grouped outputs at shared Γ'));
   for(const group of scene.groups){const item=el('section',undefined,'oc-group');item.dataset.compositionGroup=String(group.ordinal);item.append(el('strong','Group '+group.ordinal+' · '+group.contextId+' · '+group.contextLength+' binders'));
    const lets=group.frames.filter(f=>f.kind==='letE').length,lambdas=group.frames.length-lets;item.append(el('p',group.frames.length?lets+' source lets · '+lambdas+' lambda inputs · close '+group.contextId+' back to Γ':'This group already uses shared Γ.','oc-caption'));
    const members=el('div',undefined,'oc-ports');for(const position of group.positions){const p=scene.ports[position],b=button('#'+p.call,()=>markPort(p.call,true));b.dataset.compositionPort=String(p.call);b.dataset.compositionNested=group.ordinal+':'+group.positions.indexOf(position);b.setAttribute('aria-label','Group '+group.ordinal+', local position '+(group.positions.indexOf(position)+1)+', source result '+p.call);b.setAttribute('aria-pressed',String(p.call===activeCall));members.append(b);}item.append(members);
    if(group.frames.length){const open=button('Inspect additional '+group.contextId+' frames',()=>showContext(group.ordinal));open.dataset.compositionContext=String(group.ordinal);item.append(open);}grouped.append(item);
   }
   pair.append(flat,grouped);geometry.append(pair,el('p',scene.comparison?'Recorded F/H types are convertible. Output positions still retain their separate routing.':'Recorded F/H types are not convertible. The adapter maps are required.','oc-comparison'));
   const maps=el('div',undefined,'an-controls');for(const name of ['flatten','gather']){const b=button((name==='flatten'?'← ':'→ ')+titles[name],()=>chooseComponent(name));b.dataset.compositionMap=name;maps.append(b);}for(const name of ['flat','hierarchical']){const b=button('Inspect '+titles[name],()=>chooseComponent(name));b.dataset.compositionMap=name;maps.append(b);}geometry.append(maps,
    el('p','Map arrows represent recorded typed functions. The source-use graph keeps its own connections. Context labels identify exact paths within this collection.','oc-caption'));
  }
  function showContext(choice){contextChoice=choice;contextOffset=0;drawContext();}
  function drawContext(){
   contextVersion++;contexts.replaceChildren();if(contextChoice===null)return;const version=contextVersion,group=contextChoice==='shared'?null:scene.groups[contextChoice],rows=group?group.frames:scene.sharedFrames;
   const box=el('section',undefined,'oc-context');box.dataset.compositionFrames='';box.append(el('h5',group?'Additional frames of '+group.contextId:'Shared source context Γ'));
   for(const frame of rows.slice(contextOffset,contextOffset+4)){const b=button('Open source frame '+(frame.beforeDepth+1)+' · '+frame.kind+' '+frame.name,()=>{const call=group&&(!scene.ports.some(p=>p.call===activeCall&&p.group===group.ordinal))?scene.ports[group.positions[0]].call:origin().call;openSource(call,frame.address,()=>contextVersion===version);});b.dataset.compositionFrame=String(frame.beforeDepth);box.append(b);}
   box.append(el('p',rows.length?'Frames '+(contextOffset+1)+'–'+Math.min(contextOffset+4,rows.length)+' of '+rows.length+'. Domains and let values keep their pre-binder scope.':'No additional source frames.','oc-caption'));
   if(rows.length>4){const prev=button('Previous source frames',()=>{contextOffset-=4;drawContext();}),next=button('Next source frames',()=>{contextOffset+=4;drawContext();});prev.disabled=contextOffset===0;next.disabled=contextOffset+4>=rows.length;box.append(prev,next);}contexts.append(box);
  }
  function drawFields(focus=false){
   if(!receipt||!live()||loading)return;const version=caseVersion,field=++fieldVersion,r=receipt,sourceCall=origin().call;
   const cut=lease.neighborhood(r,part,slots,sourceCall),valid=()=>live(version)&&!loading&&receipt===r&&field===fieldVersion;
   const onSelect=address=>{if(!valid())return;if(address.namespace==='source-expression'){markPort(sourceCall,true);const selectedField=fieldVersion;openSource(sourceCall,address,()=>live(version)&&receipt===r&&fieldVersion===selectedField);return;}const [component,rootPart]=address.component.split('.');if(component!==r.component)return;part=rootPart;slots=address.route.slots;drawFields(true);};
   fieldsBox.replaceChildren(el('h5',titles[r.component]+' · '+part+' at Γ ('+r.contextLength+' binders)'));if(!slots.length&&['flatten','gather'].includes(r.component))fieldsBox.append(el('p',part==='type'?(r.component==='flatten'?'Domain H; body F under the adapter-input binder.':'Domain F; body H under the adapter-input binder.'):(r.component==='flatten'?'The lambda input is the grouped tuple H.':'The lambda input is the flat tuple F.'),'oc-caption'));fieldsBox.append(V.create(cut,onSelect));
   const detail=el('details');detail.dataset.compositionAddress='';detail.append(el('summary','Exact computed field and native owner'),el('pre',JSON.stringify(cut.root.address,null,2)));fieldsBox.append(detail);
   if(focus)fieldsBox.querySelector('[data-type-neighborhood]')?.focus({preventScroll:true});
  }
  function drawComponentTools(){componentTools.replaceChildren();for(const name of ['term','type']){const b=button('Inspect '+name,()=>{part=name;slots=[];drawFields(true);});b.dataset.compositionPart=name;componentTools.append(b);}}
  async function chooseComponent(name){
   if(!live()||loading)return;componentWanted=name;const version=caseVersion;fieldVersion++;receipt=null;fieldsBox.replaceChildren();componentTools.replaceChildren();busy(true);status.textContent='Loading one recorded '+name+' component…';
   try{const r=await lease.select(scene.case,name);if(!live(version))return;receipt=r;part='type';slots=[];busy(false);drawComponentTools();drawFields();status.textContent='Recorded adapter typing and source routing checked. Browser fields show syntax; kernel checks belong to the native record.';}
   catch(error){if(live(version)){receipt=null;status.textContent='Computed component unavailable: '+error.message;}}
   finally{if(live(version))busy(false);}
  }
  async function chooseCase(name){
   if(!lease||loading)return;caseVersion++;fieldVersion++;portVersion++;contextVersion++;receipt=null;scene=lease.scene(name);caseWanted=scene.name;onCaseChange(scene.name);if(!scene.ports.some(p=>p.call===activeCall)){if(activeCall!==null)outsideCall=activeCall;activeCall=outsideCall===null?scene.ports[0].call:null;}
   select.value=scene.name;contextChoice=null;contexts.replaceChildren();drawGeometry();drawStatement(outsideCall);await chooseComponent(componentWanted);
  }
  async function open(){
   if(disposed||loading)return;caseVersion++;fieldVersion++;lease?.dispose();lease=null;receipt=null;scene=null;geometry.replaceChildren();statement.replaceChildren();contexts.replaceChildren();componentTools.replaceChildren();fieldsBox.replaceChildren();select.replaceChildren();busy(true);status.textContent='Checking recorded groupings against the live source contexts…';const version=caseVersion;
   try{const loaded=await C.open(parent,{signal:controller.signal});if(disposed||version!==caseVersion){loaded.dispose?.();return;}if(loaded.status==='unavailable'){status.textContent=loaded.reason;return;}lease=loaded;for(const c of lease.cases()){const option=el('option',labels[c.name]);option.value=c.name;select.append(option);}busy(false);await chooseCase(caseWanted);}
   catch(error){if(!disposed&&version===caseVersion)status.textContent='Output grouping unavailable: '+error.message;}
   finally{if(!disposed&&version===caseVersion)busy(false);}
  }
  const parentSignal=host.ProofAtlasRegionOutputs.signal(parent);
  function dispose(){if(disposed)return;disposed=true;loading=false;caseVersion++;fieldVersion++;portVersion++;contextVersion++;controller.abort();parentSignal.removeEventListener('abort',dispose);lease?.dispose();lease=null;scene=null;receipt=null;activeCall=null;box.replaceChildren();root.replaceChildren();}
  parentSignal.addEventListener('abort',dispose,{once:true});select.onchange=()=>{if(!loading)chooseCase(select.value);};open();
  return{markPort:call=>markPort(call,false),state:()=>({loading,case:scene?.name||null,activeCall,selection:receipt?JSON.parse(JSON.stringify(receipt)):null,field:receipt?{part,slots:[...slots]}:null,lease:lease?.state()||null}),dispose};
 }
 host.ProofAtlasOutputCompositionView={mount};
})(window);
