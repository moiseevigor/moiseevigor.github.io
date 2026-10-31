/* Native source frontiers beside the existing source-use cut; no invented edges. */
(function(host){
 'use strict';
 const P=host.ProofAtlasFrontierPages,V=host.ProofAtlasComputedTypeNeighborhoodView;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=fn;return b;};
 function mount(root,{descriptor,selectedCall=null,onCalls=()=>{},onCall=()=>{}}){
  const box=el('section',undefined,'fp-reader');box.dataset.frontierReader='';root.replaceChildren(box);box.append(el('h3','A source frontier as typed function inputs'));
  const unavailable=message=>{box.append(el('p',message));return{markCall:()=>{},state:()=>({status:'unavailable'}),dispose:()=>root.replaceChildren()};};
  if(!P||!V||!host.PROOF_ATLAS_FRONTIER_PAGES)return unavailable('Checked frontier components unavailable. Reload to retry; the source-use cut remains available.');
  const profile=host.PROOF_ATLAS_FRONTIER_PAGES.profiles.find(p=>P.sourceEqual(p.source,descriptor.source));
  if(!profile)return unavailable('No checked frontier function is recorded for this source packet. The source-use cut remains available.');
  const controls=el('div',undefined,'an-controls'),caseLabel=el('label','Recorded source frontier '),caseSelect=el('select'),componentLabel=el('label','Computed component '),componentSelect=el('select'),status=el('p'),ports=el('div',undefined,'fp-ports'),fields=el('div'),sourceBox=el('div'),evidence=el('details'),retry=button('Retry computed pages',()=>chooseCase(wanted));
  status.setAttribute('role','status');status.dataset.frontierStatus='';caseSelect.dataset.frontierCase='';componentSelect.dataset.frontierComponent='';caseLabel.append(caseSelect);componentLabel.append(componentSelect);controls.append(caseLabel,componentLabel,retry);box.append(el('p','Original fragments are closed over their exact source contexts, then supplied as new typed parameters. Supplying those original fragments recovers the source proof. Source-use wires retain their original meaning; this panel adds no graph edges.'),controls,status,ports,fields,sourceBox,evidence);
  for(const c of profile.cases){const o=el('option',c.calls.length===1?'One input · call '+c.calls[0]:c.calls.length+' inputs · calls '+c.calls.join(', '));o.value=c.id;caseSelect.append(o);}
  let disposed=false,lease=null,caseController=null,fieldController=null,version=0,fieldVersion=0,wanted=null,current=null,activeCall=selectedCall,requestedCall=selectedCall,loading=false,scene=null,sourceTarget=null;
  const live=v=>!disposed&&v===version;
  function retire(){version++;fieldVersion++;caseController?.abort();fieldController?.abort();lease?.dispose();lease=null;current=null;scene=null;sourceTarget=null;fields.replaceChildren();ports.replaceChildren();sourceBox.replaceChildren();componentSelect.replaceChildren();evidence.replaceChildren();}
  function sourceLink(address){const a=el('a','Open exact original occurrence');a.href='/projects/proof-atlas/library/?loading=paged&edition='+encodeURIComponent(profile.source.edition)+'&proof='+encodeURIComponent(profile.source.name)+'&route='+encodeURIComponent(address.route.root+':'+address.route.slots.join('.'))+'#expr-'+address.node;a.dataset.frontierSource=JSON.stringify(address);return a;}
  function showSource(address){
   sourceTarget=address;const i=current.calls.indexOf(activeCall),call=i<0?current.calls[0]:activeCall;sourceBox.replaceChildren(el('h4','Original source context target'),el('p','This is an original binder occurrence, outside the computed component.'),sourceLink(address),button('Show owning source call '+call,()=>{if(!disposed&&sourceTarget===address)onCall(call);}));
  }
  async function navigate(component,slots=[],focus=false){
   if(!lease||disposed)return;fieldController?.abort();fieldController=new AbortController();const v=version,f=++fieldVersion,owner=lease;loading=true;scene=null;sourceTarget=null;fields.replaceChildren();sourceBox.replaceChildren();componentSelect.value=component;status.textContent='Checking the selected component path through pages…';
   try{const cut=await owner.neighborhood(component,slots,{signal:fieldController.signal});if(!live(v)||f!==fieldVersion||owner!==lease)return;scene=cut;
    const view=V.create(cut,address=>{if(!live(v)||f!==fieldVersion||owner!==lease)return;if(address.namespace==='source-expression')showSource(address);else navigate(address.component,address.route.slots,true);});fields.replaceChildren(view);
    const detail=el('details');detail.append(el('summary','Exact computed address'),el('pre',JSON.stringify(cut.root.address,null,2)));fields.append(detail);
    status.textContent='Recorded whole-function typing and declared-goal conversion: PASS. Selected fields show syntax and binding; they have no additional typing judgments.';
    if(focus)view.focus({preventScroll:true});
   }catch(e){if(live(v)&&f===fieldVersion){status.textContent='Computed fields unavailable: '+e.message+'. Retry keeps the original source cut.';scene=null;}}
   finally{if(live(v)&&f===fieldVersion)loading=false;}
  }
  function markPorts(){for(const row of ports.querySelectorAll('[data-frontier-port]')){const active=Number(row.dataset.frontierPort)===activeCall;row.classList.toggle('fp-active',active);row.querySelector('button')?.setAttribute('aria-pressed',String(active));}}
  async function chooseCase(id){
   if(disposed)return;retire();wanted=id;const c=profile.cases.find(c=>c.id===id),v=version;if(!c)return;current=c;caseSelect.value=id;loading=true;caseController=new AbortController();status.textContent='Checking the native component manifest and its scope owners…';retry.disabled=true;
   try{const loaded=await P.open(c,descriptor.source,{signal:caseController.signal});if(!live(v)){loaded.dispose();return;}lease=loaded;
    for(const component of lease.manifest.components){const o=el('option',component.component+' · '+component.scope.kind+' '+component.scope.length);o.value=component.component;componentSelect.append(o);}
    for(const [i,call]of c.calls.entries()){const h=lease.manifest.holes[i],row=el('div',undefined,'fp-port');row.dataset.frontierPort=String(call);row.append(el('strong','Input '+(i+1)+' ← original call '+call),el('p','Closed over '+h.context.length+' original binder frames.'),button('Select source call '+call,()=>{if(!live(v))return;activeCall=call;markPorts();onCall(call);}),sourceLink(lease.sourceFragment(i)));ports.append(row);}
    ports.append(button('Load these source calls in the graph',()=>{if(live(v))onCalls([...c.calls]);}));markPorts();
    evidence.append(el('summary','Native owner and scope of this record'),el('pre',JSON.stringify({source:lease.manifest.source,nativeCaseSha256:c.nativeCaseSha256,nativeInventorySha256:c.nativeInventorySha256,manifestSha256:c.sha256,judgments:lease.manifest.judgments},null,2)),el('p','A nonoverlapping source-tree frontier on one recorded proof. This is not an arbitrary graph-region interface or a minimal-premise result.'));
    await navigate('function.term');
   }catch(e){if(live(v)){loading=false;current=null;status.textContent='Computed frontier unavailable: '+e.message+'. Source-use geometry remains available.';}}
   finally{if(live(v))retry.disabled=false;}
  }
  function markCall(call){
   if(disposed||call===requestedCall)return;requestedCall=call;activeCall=call;
   if(current?.calls.includes(call)){markPorts();return;}
   const match=profile.cases.find(c=>c.calls.length===1&&c.calls[0]===call);
   if(match)chooseCase(match.id);
   else{retire();wanted=null;loading=false;caseSelect.selectedIndex=-1;retry.disabled=true;status.textContent='No checked frontier input is recorded for source call '+call+'. Choose a recorded frontier explicitly; no previous component is shown.';}
  }
  caseSelect.onchange=()=>{activeCall=null;requestedCall=null;chooseCase(caseSelect.value);};componentSelect.onchange=()=>navigate(componentSelect.value);const first=profile.cases.find(c=>c.calls.length===1&&c.calls[0]===selectedCall);
  if(first)chooseCase(first.id);else{requestedCall=null;markCall(selectedCall);}
  return{markCall,state:()=>({status:disposed?'disposed':lease?'ready':current?'loading':'unavailable',loading,case:current?.id||null,activeCall,selection:scene?.root.address||null,sourceTarget,lease:lease?.state()||null}),dispose:()=>{if(disposed)return;retire();disposed=true;root.replaceChildren();}};
 }
 host.ProofAtlasFrontierPagesView={mount};
})(window);
