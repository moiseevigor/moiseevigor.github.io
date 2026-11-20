/* The existing recoverable notation vocabulary, with explicit shape uses. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function mount(out,{session,onSelect}){
  let current=null,use=0,portFirst=0,disposed=false,busy=false;const status=el('p');status.setAttribute('role','status');const content=el('div');out.replaceChildren(status,content);out.classList.add('atlas-type-sharing');
  async function run(task){if(disposed||busy)return;busy=true;status.textContent='Reading type structure…';const controls=[...content.querySelectorAll('button,select')].map(n=>[n,n.disabled]);for(const[n]of controls)n.disabled=true;try{const next=await task();if(disposed)return;current=next;use=next.selectedUse??0;portFirst=0;draw();status.textContent='';}catch(e){if(!disposed)status.textContent='Type structure unavailable: '+e.message;}finally{busy=false;for(const[n,disabled]of controls)if(n.isConnected)n.disabled=disabled;}}
  async function choose(resolve,pick){if(disposed||busy)return;busy=true;try{const address=await resolve();if(disposed)return;await onSelect(address);if(!disposed&&pick?.isConnected)pick.setAttribute('aria-pressed','true');}catch(e){if(!disposed)status.textContent='Type selection unavailable: '+e.message;}finally{busy=false;}}
  const action=(text,fn)=>{const b=el('button',text);b.type='button';b.onclick=()=>{if(!disposed&&!busy)fn();};return b;};
  async function focus(slots){const next=await session.inspect(slots),address=await session.resolveBase(next.base.root.slots);await onSelect(address);return next;}
  function chooseUse(index){use=index;portFirst=0;draw();choose(async()=>current.family.uses[index].address);}
  function notation(root,relative){
   const expression=el('div',undefined,'ats-expression');expression.setAttribute('role','group');expression.setAttribute('aria-label',relative?'Relative shape definition':'Recorded type with separate shape uses');
   function render(n){
    const term=el('span',undefined,'ats-term'),label=n.kind==='frontier'?'⟨'+n.rawKind+'…⟩':n.label+(n.labelTruncated?'…':''),pick=action(label,()=>{
     if(n.kind==='shape-use'){const index=current.family.uses.findIndex(u=>JSON.stringify(u.address.route.slots)===JSON.stringify(n.slots));if(index>=0)chooseUse(index);else run(async()=>{const next=await session.selectUse(n.slots);await onSelect(next.family.uses[next.selectedUse].address);return next;});return;}
     choose(()=>relative?session.resolvePattern(n.slots,use):session.resolveBase(n.slots),pick);
    });
    pick.className='ats-symbol';pick.dataset.typeShapePick=JSON.stringify(n.slots);pick.dataset.typeShapeRelative=String(relative);pick.setAttribute('aria-label',n.kind==='shape-use'?'Select '+label+' at this occurrence':(relative?'Shape ':'Type ')+label+' · '+n.rawKind);
    if(n.kind==='shape-use'){pick.classList.add('ats-use');pick.dataset.typeShapeUse=JSON.stringify(n.slots);}if(n.kind==='reference')pick.classList.add('ats-variable');
    const children=n.children.map(c=>({field:c.field,value:render(c.value)}));
    if(n.kind==='binder'){
     term.classList.add('ats-binder');const head=el('span');head.append(el('span',n.form==='forall'?'∀ ':n.form==='lambda'?'λ ':'let '),pick);term.append(head);
     for(const child of children){const field=el('span',undefined,'ats-field');field.append(el('small',child.field),child.value);term.append(field);}
    }else if(n.kind==='annotated'){term.append(...children.map(c=>c.value),pick);}
    else{term.append(pick);if(children.length){term.append(el('span','('));children.forEach((c,i)=>{if(i)term.append(el('span',', '));term.append(c.value);});term.append(el('span',')'));}}
    return term;
   }
   expression.append(render(root));return expression;
  }
  function draw(){
   content.replaceChildren();if(!current)return;const heading=el('h4','Recorded type structure'),tools=el('div',undefined,'ats-tools');tools.append(action('Component root',()=>run(()=>focus([]))));const path=current.base.root.slots;if(path.length)tools.append(action('Parent region',()=>run(()=>focus(path.slice(0,-1)))));content.append(heading,tools,notation(current.display.root,false));
   const family=current.family;
   if(family){
    const controls=el('div',undefined,'ats-tools'),label=el('label','Repeated shape '),select=el('select');select.setAttribute('aria-label','Repeated shape in this cut');
    for(const g of current.families){const o=el('option',g.id+' · '+g.kind+' · '+g.uses+' visible uses');o.value=String(g.row);select.append(o);}select.value=String(family.row);select.onchange=()=>run(()=>session.selectFamily(Number(select.value)));label.append(select);controls.append(label);content.append(controls);
    if(family.status!=='available')content.append(el('p','Shape interface unavailable: '+family.reason));
    else{
     content.append(el('h5',family.id+' · relative definition'),notation(family.shape.root,true));
     const uses=el('div',undefined,'ats-tools');for(const [i,u]of family.uses.entries()){const b=action('Use '+(family.firstUse+i+1),()=>chooseUse(i));b.dataset.typeShapeInstance=String(i);b.setAttribute('aria-pressed',String(i===use));uses.append(b);}if(family.knownUses>4){const previous=action('Previous uses',()=>run(()=>session.usePage(Math.max(0,family.firstUse-4)))),next=action('Next uses',()=>run(()=>session.usePage(family.firstUse+4)));previous.disabled=family.firstUse===0;next.disabled=family.firstUse+4>=family.knownUses;uses.append(previous,next);}content.append(uses);
     const selected=family.uses[use],place=el('p','Use '+(family.firstUse+use+1)+' · Γ'+selected.contextLength+' · '+selected.address.component+' / '+(selected.address.route.slots.join('.')||'root'));place.className='ats-location';content.append(place);
     const actions=el('div',undefined,'ats-tools');actions.append(action('Inspect this occurrence',()=>choose(async()=>selected.address)),action('Focus this occurrence',()=>run(()=>focus(selected.address.route.slots))));content.append(actions);
     if(!selected.assignments.length)content.append(el('p','No external de Bruijn ports. Declaration and universe dependencies remain in the record.'));
     else{
      const table=el('table'),caption=el('caption','Variable assignments for this use'),head=el('thead'),tr=el('tr');for(const text of ['Shape port','Exact binder']){const th=el('th',text);th.scope='col';tr.append(th);}head.append(tr);const body=el('tbody');
      for(const binding of selected.assignments.slice(portFirst,portFirst+8)){const row=el('tr'),name=el('th',binding.parameter);name.scope='row';const value=el('td'),button=action(binding.name.split('._@')[0]+' · '+(binding.address.namespace==='source-expression'?'original binder':'type binder')+' '+(binding.ordinal+1),()=>choose(async()=>binding.address,button));button.dataset.typeShapeBinding=String(binding.index);button.dataset.typeShapeAddress=JSON.stringify(binding.address);value.append(button);row.append(name,value);body.append(row);}table.append(caption,head,body);content.append(table);
      if(selected.assignments.length>8){const page=el('div',undefined,'ats-tools'),prev=action('Previous ports',()=>{portFirst=Math.max(0,portFirst-8);draw();}),next=action('Next ports',()=>{portFirst+=8;draw();});prev.disabled=portFirst===0;next.disabled=portFirst+8>=selected.assignments.length;page.append(prev,el('span',(portFirst+1)+'–'+Math.min(portFirst+8,selected.assignments.length)+' of '+selected.assignments.length),next);content.append(page);}
     }
     content.append(el('p','Relative syntax only. Each use keeps its own variable assignments; no new typing judgment is added.','ats-caption'));
    }
   }else content.append(el('p','No repeated nonterminal or variable row is exposed in this bounded cut.','ats-caption'));
   const details=el('details'),pre=el('pre',JSON.stringify({owner:current.owner,accounting:current.display.stats,shape:family&&{id:family.id,row:family.row,status:family.status,ports:family.ports,uses:family.uses},rule:current.guarantee},null,2));pre.tabIndex=0;details.append(el('summary','Exact addresses and occurrence accounting'),pre);content.append(details);
  }
  current=session.getScene();if(current)draw();else run(()=>session.inspect());
  return Object.freeze({getScene:()=>current,getState:()=>session.state(),dispose:()=>{disposed=true;session.dispose();content.replaceChildren();status.textContent='';}});
 }
 host.ProofAtlasTypeSharingView={mount};
})(window);
