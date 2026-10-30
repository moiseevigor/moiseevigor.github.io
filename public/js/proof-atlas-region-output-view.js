/* The output tuple is a computed collection; source-use boxes remain separate. */
(function(host){
 'use strict';const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(root,{descriptor,current,loadCollection,onCall=()=>{},onSource=()=>{},selectedCall=null,grouped=false,onGroupingChange=()=>{},preferredCase='scope-fibres',onCaseChange=()=>{}}){
  const O=host.ProofAtlasRegionOutputs,V=host.ProofAtlasComputedTypeNeighborhoodView;
  let disposed=false,version=0,fieldVersion=0,renderVersion=0,lease=null,receipt=null,loading=false,first=0,controller=new AbortController(),compositionView=null,compositionCall=null;
  const button=(text,action)=>{const b=el('button',text);b.type='button';const epoch=version;b.onclick=()=>{if(!disposed&&!loading&&epoch===version&&box.contains(b))action();};return b;};
  const box=el('section',undefined,'ro-outputs'),status=el('p'),tools=el('div',undefined,'an-controls'),content=el('div'),compositionHost=el('div');compositionHost.hidden=true;box.dataset.regionOutputs='';status.setAttribute('role','status');box.append(el('h3','Outputs at the shared binder prefix'),status,tools,compositionHost,content);root.replaceChildren(box);
  const available=O.available(descriptor);
  function presets(){const select=el('select');select.setAttribute('aria-label','Checked output collection');for(const [i,d] of available.entries()){const option=el('option',d.label);option.value=String(i);select.append(option);}const load=button('Load checked result collection',()=>{if(!loading)loadCollection(available[Number(select.value)]);});load.dataset.outputCollectionLoad='';tools.append(select,load);}
  if(available.length)presets();
  const grouping=button('Group output collection',toggleGrouping);grouping.dataset.outputGrouping='';grouping.setAttribute('aria-expanded','false');grouping.disabled=true;tools.append(grouping);
  const inspect=button('Inspect current result collection',open);inspect.dataset.outputInspect='';tools.append(inspect);
  function setLoading(value){loading=value;box.setAttribute('aria-busy',String(value));for(const b of [...tools.querySelectorAll('button,select'),...content.querySelectorAll('button,select')]){if(value){b.dataset.roDisabled=String(b.disabled);b.disabled=true;}else if(b.dataset.roDisabled!==undefined){b.disabled=b.dataset.roDisabled==='true';delete b.dataset.roDisabled;}}grouping.disabled=value||!lease;}
  function retireComposition(){compositionView?.dispose();compositionView=null;compositionHost.replaceChildren();compositionHost.hidden=true;content.hidden=false;grouping.textContent='Group output collection';grouping.setAttribute('aria-expanded','false');}
  function toggleGrouping(){
   if(disposed||loading||!lease)return;
   if(compositionView){const call=compositionView.state().activeCall;retireComposition();grouped=false;onGroupingChange(false);const restore=summary().ports.some(p=>p.call===call)?call:summary().ports[0].call;choose(restore);return;}
   const C=host.ProofAtlasOutputComposition,CV=host.ProofAtlasOutputCompositionView;
   compositionHost.hidden=false;
   if(!C||!CV){compositionHost.replaceChildren(el('p','Output grouping component unavailable. Reload to retry; individual results remain available.'));return;}
   try{if(!C.available(lease).length){compositionHost.replaceChildren(el('p','No recorded grouping for this exact output collection.'));return;}
    const selected=compositionCall??receipt?.call;compositionView=CV.mount(compositionHost,{parent:lease,selectedCall:selected,preferredCase,onCaseChange:name=>{preferredCase=name;onCaseChange(name);},onCall:id=>{compositionCall=id;onCall(id);},onSource});
    lease.releaseTypes();receipt=null;content.replaceChildren();content.hidden=true;grouped=true;onGroupingChange(true);grouping.textContent='Show individual result types';grouping.setAttribute('aria-expanded','true');
   }catch(error){retireComposition();compositionHost.hidden=false;compositionHost.append(el('p','Output grouping unavailable: '+error.message));}
  }
  function summary(){return lease?.summary();}
  function drawTypes(){
   const epoch=version,currentReceipt=receipt;fieldVersion++;renderVersion++;const info=summary();content.replaceChildren();if(!currentReceipt)return;
   content.append(el('p','Recorded PProd output tuple · Γ'+info.commonContextLength+' · '+info.ports.length+' ordered result positions. The source-use grouping is unchanged.','ro-caption'));
   const choices=el('div',undefined,'an-controls');
   for(const p of info.ports.slice(first,first+4)){const b=button('Output '+p.call,()=>choose(p.call));b.dataset.outputCall=String(p.call);b.setAttribute('aria-pressed',String(p.call===currentReceipt.call));choices.append(b);}
   if(info.ports.length>4){const prev=button('Previous output positions',()=>{first=Math.max(0,first-4);drawTypes();}),next=button('Next output positions',()=>{first+=4;drawTypes();});prev.disabled=first===0;next.disabled=first+4>=info.ports.length;choices.append(prev,next);}content.append(choices);
   const pair=el('div',undefined,'ro-type-pair');
   for(const side of ['originalResultType','closedResultType']){
    if(side==='closedResultType')pair.append(el('p',currentReceipt.suffixLength?currentReceipt.letSlots.filter(Boolean).length+' lets retained · '+currentReceipt.argumentCount+' λ inputs':'Identity closure','ro-relation'));
    const card=el('section',undefined,'ro-type-card'),original=side==='originalResultType';
    card.append(el('strong',(original?'Source-result type · Γ':'Closed result type · Γ')+(original?currentReceipt.originalContextLength:currentReceipt.commonContextLength)));
    const pre=el('pre',original?currentReceipt.originalTypeText:currentReceipt.closedTypeText);pre.tabIndex=0;pre.setAttribute('aria-label',original?'Original-context result type':'Shared-prefix result type');card.append(pre);
    const pick=button(original?'Inspect source-result type':'Inspect closed result type',()=>fields(side,[]));pick.dataset.outputSide=side;card.append(pick);pair.append(card);
   }content.append(pair);
   const source=button('Open original result '+currentReceipt.call,()=>{if(epoch===version&&receipt===currentReceipt)onSource(currentReceipt.call,currentReceipt.source,()=>!disposed&&!loading&&epoch===version&&receipt===currentReceipt);});source.dataset.outputSource='';
   content.append(el('p','Projection: '+(Array(currentReceipt.projection.snd).fill('PProd.snd').concat(currentReceipt.projection.fst?['PProd.fst']:[]).join(' → ')||'identity')+'. Supply '+currentReceipt.argumentCount+' original lambda argument(s); local let values remain definitions. Native typing and recovery were checked.','ro-caption'),source);
   const field=el('div');field.dataset.outputFields='';content.append(field);
   const provenance=el('details');provenance.dataset.outputReceipt='';provenance.append(el('summary','Exact source, closure and native evidence owners'),el('pre',JSON.stringify(currentReceipt,null,2)));content.append(provenance,
    el('p','The browser checks hashes, exact binder occurrences, wrapper domains/values and the original type below the wrappers. Kernel typing belongs to the recorded native check. These output values do not make the region’s boundary inputs independent.','ro-caption'));
  }
  function fields(side,slots){
   if(disposed||!receipt||loading)return;const epoch=version,render=renderVersion,selected=++fieldVersion,r=receipt,scene=lease.neighborhood(r,side,slots),hostBox=content.querySelector('[data-output-fields]');
   const current=()=>!disposed&&!loading&&box.contains(hostBox)&&epoch===version&&render===renderVersion&&selected===fieldVersion&&receipt===r;
   const chooseAddress=address=>{if(!current())return;if(address.namespace==='source-expression')onSource(r.call,address,current);else fields(address.component,address.route.slots);};
   hostBox.replaceChildren(V.create(scene,chooseAddress));
   const header=lease.sourceHeader(r,scene.root.address);if(header){const pick=button('Original header for this closure wrapper',()=>{if(current())onSource(r.call,header,current);});pick.dataset.outputHeader='';hostBox.append(pick);}
   const exact=el('details');exact.dataset.outputFieldAddress='';exact.append(el('summary','Selected computed field address'),el('pre',JSON.stringify(scene.root.address,null,2)));hostBox.append(exact);
  }
  async function choose(call){
   if(disposed||loading||!lease)return;const epoch=version;setLoading(true);status.textContent='Checking source headers and one recorded result type…';
   try{const result=await lease.select(call);if(disposed||epoch!==version)return;receipt=result;onCall(call);drawTypes();status.textContent='Recorded output '+call+' · exact source context and closure fields checked.';}
   catch(error){if(!disposed&&epoch===version){receipt=null;content.replaceChildren();status.textContent='Output type unavailable: '+error.message;}}
   finally{if(!disposed&&epoch===version)setLoading(false);}
  }
  async function open(){
   if(disposed||loading)return;retireComposition();lease?.dispose();lease=null;receipt=null;content.replaceChildren();const epoch=version;setLoading(true);status.textContent='Checking this exact result collection…';
   try{const {model,unitId}=await current(),opened=await O.open(model,unitId,descriptor,{signal:controller.signal});if(disposed||epoch!==version){opened.dispose?.();return;}
    if(opened.status==='unavailable'){status.textContent=opened.reason;return;}lease=opened;const ports=summary().ports;setLoading(false);await choose(ports.some(p=>p.call===selectedCall)?selectedCall:ports[0].call);if(grouped&&!disposed&&epoch===version)toggleGrouping();
   }catch(error){if(!disposed&&epoch===version)status.textContent='Output collection unavailable: '+error.message;}
   finally{if(!disposed&&epoch===version)setLoading(false);}
  }
  open();return{selectCall:id=>{compositionCall=id;compositionView?.markPort(id);},state:()=>({loading,composition:compositionView?.state()||null,selection:receipt?JSON.parse(JSON.stringify(receipt)):null,lease:lease?.state()||null}),dispose(){if(disposed)return;disposed=true;version++;fieldVersion++;retireComposition();controller.abort();lease?.dispose();lease=null;receipt=null;root.replaceChildren();}};
 }
 host.ProofAtlasRegionOutputView={mount};
})(window);
