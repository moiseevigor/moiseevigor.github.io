/* Scoped source-binding projection. Counts do not assert semantic necessity. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,R=node?require('./proof-atlas-recursive-inputs'):host.ProofAtlasRecursiveInputs;
 const demand=(ok,message)=>{if(!ok)throw Error('Binding uses: '+message);};
 const readerBudget=Object.freeze({maxStates:65536,maxDepth:512,maxWork:262144});
 let wideSignatures;
 function loadWideSignatures(){
  if(!wideSignatures)wideSignatures=A.compressed('/public/data/proof-atlas/ai-wide-signatures.json.gz',
   'ce0ae64b90b1c6b08848bf64c3298d63f62622658c7d8bd5bdb138166bd46c18',{maxBytes:68919,expectedBytes:68919})
   .catch(error=>{wideSignatures=null;throw error;});
  return wideSignatures;
 }
 // This replay covers one occurrence. Shared expression numbers alone cannot identify it.
 async function checkedCallDomains(record,call){
  if(record.indexSha256!=='8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d' ||
    call.node!==2181 || call.route.root!==1 || call.route.slots.join('')!=='11111112111111110110101010010100100110011')return null;
  const report=await A.compressed('/public/data/proof-atlas/ai-caller-domains.json.gz',
   '877952c3d07b59f47bd7609622d83674194510c48129af82faa5448639ca334c',{maxBytes:7918,expectedBytes:7918});
  demand(report.call.indexSha256===record.indexSha256 && report.call.declaration===record.name &&
   report.call.node===call.node && report.call.root===call.route.root &&
   String(report.call.slots)===String(call.route.slots),'caller type address');
  return report.arguments;
 }
 function describe(data,record,route,options={}){
  demand(data.declaration?.name===record.name&&(data.declaration.sourceSha256===undefined||data.declaration.sourceSha256===record.sourceSha256)&&data.kind.length===record.uniqueNodes&&JSON.stringify(data.declaration.rootPaths)===JSON.stringify(record.rootPaths)&&/^[a-f0-9]{64}$/.test(record.indexSha256)&&/^[a-f0-9]{64}$/.test(record.sourceSha256),'source packet identity');
  const id=A.walk(data,route),kind=A.kinds[data.kind[id]];demand(['lam','forallE','letE'].includes(kind),'selection is not a source binder');
  const bodySlot=kind==='letE'?2:1,at={root:route.root,slots:[...route.slots]},bodyRoute={root:route.root,slots:[...route.slots,bodySlot]},body=data.children[id][bodySlot],maxStates=options.maxStates??65536,maxDepth=options.maxDepth??512;
  const budget={maxStates,maxDepth};
  if(options.maxWork!==undefined)budget.maxWork=options.maxWork;
  const headers=data.children[id].slice(0,bodySlot).map((n,j)=>{const r={root:route.root,slots:[...route.slots,j]};return{node:n,route:r,path:A.path(data,r),field:A.fields[kind][j],expanded:data.expanded[n],scope:'before-this-binder'};});
  const total=BigInt(data.expanded[id]),headerOccurrences=headers.reduce((n,h)=>n+BigInt(h.expanded),0n),bodyOccurrences=BigInt(data.expanded[body]);demand(1n+headerOccurrences+bodyOccurrences===total,'source region partition');
  return{format:'ProofAtlasBindingUse/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,namespace:'original-packet'},selection:{node:id,path:A.path(data,at),route:at,kind,name:data.payloads[id].binderName||data.payloads[id].declName||'_'},body:{node:body,path:A.path(data,bodyRoute),route:bodyRoute,expanded:bodyOccurrences.toString(),scope:'inside-this-binder'},headers,references:R.countReferences(data,body,0,budget),budget,partition:{retainedBinder:'1',hiddenHeaderOccurrences:headerOccurrences.toString(),collapsedBodyOccurrences:bodyOccurrences.toString(),total:total.toString()},guarantee:'Exact references to this binder in its body, including nested type and value regions with lexical scope respected. Its own domain/type and let value are outside its scope. This projection summarizes only this binding relation; other relations remain in the full source diagram. Counts establish syntax, not semantic necessity or a new typing judgment.'};
 }
 function validate(scene,data,record){demand(JSON.stringify(scene)===JSON.stringify(describe(data,record,scene.selection.route,scene.budget)),'changed source, scope or reference count');return true;}
 function mount(container,config){
  const scene=describe(config.data,config.record,config.route,config.budget||readerBudget),el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},button=(label,occurrence)=>{const n=el('button',label);n.type='button';n.dataset.bindingSource=occurrence.path;n.onclick=()=>config.onProofOccurrence(occurrence.node,occurrence.route);return n;};
  container.replaceChildren();container.classList.add('pl-binding-uses');container.append(el('h4','Binding references · '+scene.selection.name));
  const counted=scene.references.status==='counted',count=scene.references.occurrences;
  const note=el('p',counted?count+(count==='1'?' exact reference':' exact references')+' in the body. Its own '+(scene.selection.kind==='letE'?'type and value are':'domain is')+' outside this binder’s scope.':'Reference count unavailable: '+scene.references.reason);note.setAttribute('aria-live','polite');container.append(note);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('pl-binding-diagram');svg.setAttribute('aria-hidden','true');container.append(svg);
  function shape(tag,attrs,text){const n=document.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))n.setAttribute(key,value);if(text!==undefined)n.textContent=text;svg.append(n);return n;}
  function draw(){const width=Math.max(260,svg.clientWidth||600);svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} 108`);shape('rect',{x:24,y:34,width:75,height:36,rx:3,fill:scene.selection.kind==='letE'?'#e3a381':'#e9bf76'});shape('text',{x:61,y:57,'text-anchor':'middle',class:'pl-binding-glyph'},scene.selection.kind==='lam'?'λ':scene.selection.kind==='forallE'?'∀':'let');shape('rect',{x:width-118,y:28,width:100,height:48,rx:4,fill:'none',stroke:'#b6cbd1','stroke-width':2});shape('text',{x:width-68,y:57,'text-anchor':'middle',class:'pl-binding-body-label'},'body region');if(counted&&BigInt(count)>0n)shape('path',{d:`M ${width-120} 52 L 105 52 l 6 -4 m -6 4 l 6 4`,class:'pl-binding-wire'});shape('text',{x:width/2,y:96,'text-anchor':'middle',class:'pl-binding-body-label'},counted?(count==='0'?'No body reference to this binder':'References point back to the binder'):'No reference relation asserted');}
  const observer=new ResizeObserver(draw);observer.observe(svg);draw();
  const actions=el('div');actions.className='pl-actions';actions.append(button('Open body region',scene.body));for(const h of scene.headers)actions.append(button('Open '+h.field+' · before binder',h));container.append(actions,el('p','The body is collapsed. Each button opens its exact source region. Counts include references in type annotations.'));
  if(counted && count!=='0' && config.sourceLink){
   const form=el('form'),label=el('label','Reference number '),input=el('input');
   const find=el('button','Locate reference'),result=el('div');
   input.type='text';input.inputMode='numeric';input.pattern='[1-9][0-9]*';
   input.required=true;input.value='1';input.maxLength=count.length;input.size=Math.min(count.length+1,12);
   find.type='submit';result.setAttribute('aria-live','polite');label.append(input);
   form.append(label,' of '+count+' ',find);container.append(form,result);
   function clearLocatedUse(){
    result.replaceChildren();result.classList.remove('pl-located-use');svg.style.display='';
   }
   input.oninput=()=>{input.setCustomValidity('');clearLocatedUse();};
   form.onsubmit=event=>{
    event.preventDefault();clearLocatedUse();
    if(!/^[1-9][0-9]*$/.test(input.value)||BigInt(input.value)>BigInt(count)){
     input.setCustomValidity('Enter a reference number from 1 to '+count+'.');input.reportValidity();return;
    }
    const found=R.countReferences(config.data,scene.body.node,0,{...scene.budget,ordinal:BigInt(input.value)});
    if(found.status!=='counted'){result.textContent=found.reason;return;}
    const route={root:scene.body.route.root,slots:scene.body.route.slots.concat(found.witness.slots)};
    const use={node:found.witness.node,route};
    svg.style.display='none';
    result.classList.add('pl-located-use');
    const origin=el('div');
    origin.append(config.sourceLink('Reference '+input.value+' · e'+use.node,use),' to ',el('code',scene.selection.name));
    result.append(origin);
    const receiving=el('div');receiving.className='pl-receiving-expression';result.append(receiving);
    const receiver=host.ProofAtlasOmittedReferences?.applicationAtUse(config.data,use,{includePeers:false});
    if(receiver){
     receiving.append(receiver.slot?'Argument '+receiver.slot+' of '+receiver.arity+' in ':'Function in ',
      config.sourceLink(receiver.label,receiver.call));
     const ports=el('div');ports.className='pl-receiving-ports';
     ports.setAttribute('role','group');ports.setAttribute('aria-label','Compiled application inputs');
     function inputAt(position){
      const slots=receiver.call.route.slots.concat(Array(receiver.arity-position).fill(0));
      if(position)slots.push(1);
      const route={root:receiver.call.route.root,slots};
      return {node:A.walk(config.data,route),route};
     }
     function drawPorts(first,last,focusPosition){
      ports.replaceChildren();
      const positions=new Set([0,1,receiver.slot,receiver.arity]);
      for(let j=first;j<=last;j++)positions.add(j);
      let previous=-1;
      for(const position of [...positions].sort((a,b)=>a-b)){
       if(position>previous+1){
        const lo=previous+1,hi=position-1;
        const start=hi<first?Math.max(lo,hi-4):lo,end=Math.min(hi,start+4);
        const range=lo===hi?String(lo):lo+'–'+hi;
        const gap=el('button',range);
        gap.type='button';
        gap.setAttribute('aria-label','Show '+(start===end?'argument '+start:'arguments '+start+'–'+end));
        gap.onclick=()=>drawPorts(start,end,start);
        ports.append(gap);
       }
       const target=inputAt(position);
       const port=config.sourceLink(position?String(position):'fn',target);
       port.setAttribute('aria-label',position?'Argument '+position:'Function');
       if(position===receiver.slot){
        demand(target.route.root===route.root && String(target.route.slots)===String(route.slots),'selected input address');
        port.setAttribute('aria-current','true');
       }
       ports.append(port);
       if(position===focusPosition)port.focus();
       previous=position;
      }
     }
     const first=receiver.arity<=7?1:Math.max(1,receiver.slot-2);
     const last=receiver.arity<=7?receiver.arity:Math.min(receiver.arity,receiver.slot+2);
     drawPorts(first,last);
     receiving.append(ports);
     const ai=host.PROOF_ATLAS_AI_SAMPLE,head=config.data.payloads[receiver.head.node];
     if(receiver.slot && receiver.arity>=8 && config.data.kind[receiver.head.node]===4 &&
       ai?.edition.id==='goedel-sample-4331' && ai.edition.declarations.includes(config.record) &&
       ai.provenance.compiler.includes('819816b2e0a3bf405af45ae5c7af2491d8f5bee6') &&
       ai.provenance.environment.dependencyRevisions.mathlib==='0df444a360eaa60ab8c11dca51a86af692955474'){
      const details=el('details'),content=el('div');
      details.append(el('summary','Declared type of argument '+receiver.slot),content);
      receiving.append(details);
      details.ontoggle=async()=>{
       if(!details.open || content.childNodes.length)return;
       content.textContent='Loading declaration…';
       try{
        const rows=await loadWideSignatures();
        const signature=rows.find(r=>r.name===head.name && r.levelCount===head.levels.length);
        const parameters=signature?.parameters;
        const parameter=parameters?.[receiver.slot-1];
        if(!parameter){content.textContent='This position has no recorded binder in the declared signature.';return;}
        const generated=parameter.name.includes('._@.') || parameter.name==='_';
        content.replaceChildren(el('code',(generated?'':parameter.name+' : ')+parameter.domain));
        const checked=await checkedCallDomains(config.record,receiver.call);
        function showCallerType(parent,slot){
         if(!checked)return;
         const row=checked[slot-1];
         demand(row.slot===slot && row.node===inputAt(slot).node,'caller type input');
         const text=el('div','Kernel-checked type at this call: ');
         text.append(el('code',row.expected));parent.append(text);
        }
        showCallerType(content,receiver.slot);
        for(let i=receiver.slot;i<Math.min(parameters.length,receiver.arity);i++){
         if(!parameters[i].dependsOn.includes(receiver.slot))continue;
         const line=el('p');
         line.append(config.sourceLink('Argument '+(i+1),inputAt(i+1)),' has declared type ',el('code',parameters[i].domain));
         content.append(line);
         showCallerType(content,i+1);
        }
       }catch{content.textContent='Declaration unavailable. Close and reopen to retry.';details.addEventListener('toggle',()=>content.replaceChildren(),{once:true});}
      };
     }
    }else{
     const parent={root:route.root,slots:route.slots.slice(0,-1)};
     const node=A.walk(config.data,parent),kind=A.kinds[config.data.kind[node]];
     receiving.append('Constructor field ',config.sourceLink(kind+'.'+A.fields[kind][route.slots.at(-1)],{node,route:parent}));
    }
   };
  }
  let navigation=null,inputControl=null;if(host.ProofAtlasUseNavigation&&host.ProofAtlasPackedRoutes){
   const panel=el('div'),U=host.ProofAtlasUseNavigation,P=host.ProofAtlasPackedRoutes;container.append(panel);
   const openSource=at=>{const bytes=P.parse(at.route),slots=Array.from({length:at.route.depth},(_,i)=>(bytes[i>>2]>>((i%4)*2))&3);if(slots.length<=512)config.onProofOccurrence(at.node,{root:at.route.root,slots});else{const u=new URL(location.href);u.searchParams.set('view','occurrence');u.searchParams.delete('loading');u.searchParams.delete('route');u.hash='occurrence='+config.record.indexSha256+'.'+at.route.root+'.'+at.route.depth+'.'+at.route.slots;location.assign(u.href);}};
   navigation=U.mount(panel,{owner:U.open(config.data,config.record),route:P.encode(config.route.root,config.route.slots),onSource:openSource});
   if(host.ProofAtlasUseInputs&&config.getNativeProviders){const target=el('div'),I=host.ProofAtlasUseInputs;container.append(target);inputControl=I.control(target,{navigation:panel,getUse:()=>navigation.getWitness(),prepare:async(receipt,signal)=>{const prepared=config.prepareNative?await config.prepareNative(signal):null,owner=I.open(config.data,config.record,prepared?.providers||config.getNativeProviders(),prepared?.options||{});try{return await I.find(owner,I.sourceUse(receipt),{signal});}finally{I.dispose(owner);}},onSource:openSource});}
  }
  const details=el('details');details.append(el('summary','Source, counting bounds and occurrence accounting'),el('pre',JSON.stringify(scene,null,2)));details.querySelector('pre').tabIndex=0;container.append(details);
  return{getScene:()=>scene,getWitness:()=>navigation?.getWitness()||null,getUseInput:()=>inputControl?.getScene()||null,dispose:()=>{inputControl?.dispose();navigation?.dispose();observer.disconnect();container.replaceChildren();}};
 }
 const api={readerBudget,describe,validate,mount};if(node)module.exports=api;else host.ProofAtlasBindingUses=api;
})(typeof window==='undefined'?globalThis:window);
