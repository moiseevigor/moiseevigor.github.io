/* One visual rule for recorded producer, lifted and expected type roots. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;},labels={original:'Producer type',lifted:'Lifted producer type',expected:'Expected input type'};
 function create(bridge,select,onReturn){
  if(bridge?.format!=='ProofAtlasInputTypeBridge/1'||['originalContextTyping','consumerContextTyping','kernelInputDomain','kernelPortTypeConversion'].some(k=>bridge.checks[k]!=='PASS')||bridge.checks.literalTypeWeakening!==true||!['same','different','unavailable'].includes(bridge.comparison.status)||bridge.comparison.status==='unavailable'&&bridge.comparison.reason!=='structural-comparison-budget')throw Error('Recorded input type bridge unavailable');
  const same=host.ProofAtlasApplicationPorts.same,components=['producerType','producerTypeInConsumer','inputType'],ids=['original','lifted','expected'];if(bridge.stages.length!==3||bridge.stages.some((s,i)=>s.id!==ids[i]||s.address.namespace!=='application-ports'||s.address.evidenceSha256!==bridge.identity.nativeOwner||s.address.sourceIndexSha256!==bridge.identity.source.indexSha256||s.address.input!==bridge.identity.input||s.address.component!==components[i]||s.address.route.root!==components[i]||s.address.route.slots.length||!same(s.address.query,bridge.identity.query)||!Number.isSafeInteger(s.contextLength)||s.contextLength<0)||!same(bridge.stages[0].contextSource,bridge.producerSource)||!same(bridge.stages[1].contextSource,bridge.stages[2].contextSource)||bridge.stages[1].contextLength!==bridge.stages[2].contextLength||bridge.stages[1].contextLength-bridge.stages[0].contextLength!==bridge.contextExtension)throw Error('Mixed original and consumer type observations');
  const witness=bridge.comparison.witness;
  if(witness){
   const refuse=()=>{throw Error('Foreign or invalid type-difference witness');};
   if(bridge.comparison.status!=='different')refuse();
   if(witness.status==='unavailable'){
    if(witness.reason!=='selection-path-bound'||witness.pathLimit!==512||!Number.isInteger(witness.pathLength)||witness.pathLength<=512)refuse();
   }else{
    if(witness.status!=='located'||witness.format!=='ProofAtlasTypeDifference/1'||!['constructor','payload','arity'].includes(witness.reason))refuse();
    if(!Array.isArray(witness.slots)||witness.slots.length>512||!witness.slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2))refuse();
    if(!Array.isArray(witness.fields)||witness.fields.length!==witness.slots.length||!witness.fields.every(f=>['fn','arg','domain','body','type','value','expr','struct'].includes(f)))refuse();
    if(!Number.isInteger(witness.formalBinders)||witness.formalBinders<0||witness.formalBinders>witness.slots.length)refuse();
    for(const [endpoint,stage]of [[witness.left,bridge.stages[1]],[witness.right,bridge.stages[2]]]){
     if(!endpoint||!host.ProofAtlasLibraryData.kinds.includes(endpoint.kind)||typeof endpoint.payloadPreview!=='string'||endpoint.payloadPreview.length>1024||typeof endpoint.payloadTruncated!=='boolean'||!Number.isInteger(endpoint.node)||endpoint.node<0)refuse();
     const expected={...stage.address,node:endpoint.node,route:{root:stage.address.component,slots:witness.slots}};if(!same(endpoint.address,expected))refuse();
    }
   }
  }
  const box=el('section',undefined,'atlas-type-bridge');box.dataset.typeBridge=bridge.identity.input;box.tabIndex=-1;box.setAttribute('aria-label','Recorded type bridge for input '+bridge.identity.input);box.append(el('h4','Type at input '+bridge.identity.input));
  const status=bridge.comparison.status==='same'?'Same literal type structure in the consumer context.':bridge.comparison.status==='different'?'Different literal type structure; kernel conversion recorded.':'Literal structure comparison unavailable: work budget reached. Kernel conversion is separately recorded.';const verdict=el('p',status);verdict.dataset.typeComparison=bridge.comparison.status;box.append(verdict);
  const folded=bridge.contextExtension===0&&bridge.stages[0].text===bridge.stages[1].text,flow=el('div',undefined,'atlas-type-flow'+(folded?' atlas-type-identity':''));box.dataset.typeContextFolded=String(folded);
  function stageCard(stage,showText=true){const card=el('div',undefined,'atlas-type-stage'),pick=el('button',labels[stage.id]);card.dataset.typeStage=stage.id;pick.type='button';pick.dataset.typeSelect=stage.id;pick.dataset.typeAddress=JSON.stringify(stage.address);pick.setAttribute('aria-pressed','false');pick.onclick=()=>{for(const button of box.querySelectorAll('[data-type-address]'))button.setAttribute('aria-pressed',String(button===pick));select(stage.address);};card.append(pick,el('p',(stage.id==='original'?'Original producer Γ':'Consumer Γ')+stage.contextLength));if(showText){const pre=el('pre',stage.text);pre.tabIndex=0;pre.setAttribute('role','region');pre.setAttribute('aria-label',labels[stage.id]+' in context Γ'+stage.contextLength);card.append(pre);}return card;}
  if(folded){const pair=el('div',undefined,'atlas-type-context-pair');pair.append(el('p','Same recorded context · two type roots'),stageCard(bridge.stages[0],false),stageCard(bridge.stages[1]));flow.append(pair);}
  for(const [i,stage]of bridge.stages.entries()){
   if(folded&&i<2)continue;if(i){const relation=el('div',undefined,'atlas-type-relation');relation.append(el('strong',i===1?'→':'≡'),el('span',i===1?'Context extension +'+bridge.contextExtension:'Kernel conversion'),el('small',i===1?'Literal weakening checked':'Recorded PASS'));flow.append(relation);}flow.append(stageCard(stage));
  }box.append(flow);
  if(witness){
   const difference=el('section',undefined,'atlas-type-difference');difference.dataset.typeMismatch=witness.status;difference.setAttribute('aria-label','Literal type difference');difference.append(el('h5','One literal difference'));
   if(witness.status==='unavailable')difference.append(el('p','A structural difference was found at depth '+witness.pathLength+'. Its path exceeds the 512-field selection limit.'));
   else{
    difference.append(el('p',({constructor:'Constructors differ',payload:'Constructor payloads differ',arity:'Ordered field counts differ'})[witness.reason]+' · consumer Γ'+bridge.stages[1].contextLength+' · '+witness.formalBinders+' local binders'));
    const path=el('code',['root',...witness.fields].join(' › '));path.dataset.typeDifferencePath=JSON.stringify(witness.slots);difference.append(path);
    const pair=el('div',undefined,'atlas-type-difference-pair');
    for(const [side,label]of [['left','Lifted producer'],['right','Expected input']]){
     const endpoint=witness[side],card=el('div',undefined,'atlas-type-stage'),pick=el('button','Inspect '+label.toLowerCase()+' difference');pick.type='button';pick.dataset.typeDifferenceSelect=side;pick.dataset.typeAddress=JSON.stringify(endpoint.address);pick.setAttribute('aria-pressed','false');pick.onclick=()=>{for(const b of box.querySelectorAll('[data-type-address]'))b.setAttribute('aria-pressed',String(b===pick));select(endpoint.address);};
     const payload=el('pre',endpoint.payloadPreview+(endpoint.payloadTruncated?'… [preview truncated]':''));payload.tabIndex=0;payload.setAttribute('role','region');payload.setAttribute('aria-label',label+' constructor payload');card.append(el('strong',label+' · '+endpoint.kind),payload,pick);pair.append(card);
    }difference.append(pair,el('p','One mismatch in ordered depth-first traversal. Kernel conversion is recorded for the type roots; this is not a conversion trace between these subexpressions.'));
   }box.append(difference);
  }
  box.append(el('p','The conversion relates type roots. The original source-use path is a separate relation.'));if(onReturn){const back=el('button','Return to selected input');back.type='button';back.onclick=onReturn;box.append(back);}return box;
 }
 host.ProofAtlasInputTypeBridgeView={create};
})(window);
