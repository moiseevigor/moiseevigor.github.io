/* Shared field and binder portals; dimensions and colors carry no mathematical metric. */
(function(host){
 'use strict';
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function create(scene,onSelect){
  const same=host.ProofAtlasApplicationPorts.same,A=host.ProofAtlasLibraryData,G=host.ProofAtlasGeometry,fail=()=>{throw Error('Invalid computed type neighborhood');};
  if(scene?.format!=='ProofAtlasComputedTypeNeighborhood/1'||!Array.isArray(scene.children)||scene.children.length>3||scene.stats.vertexLimit!==4||scene.stats.pathLimit!==512||scene.stats.retained!==scene.children.length+1||scene.root.expanded!==scene.stats.represented||BigInt(scene.stats.retained)+BigInt(scene.stats.hidden)!==BigInt(scene.stats.represented))fail();
  const rootAddress=scene.root.address;
  if(!['application-ports','common-prefix-output-types','scope-output-composition'].includes(rootAddress.namespace)||rootAddress.route.root!==rootAddress.component||!Array.isArray(rootAddress.route.slots)||rootAddress.route.slots.length>512||scene.context.source.namespace!=='source-expression'||scene.context.source.indexSha256!==rootAddress.sourceIndexSha256)fail();
  const equivalent=(address,slots)=>address&&same(address,{...rootAddress,node:address.node,route:{root:rootAddress.component,slots}});
  if(!equivalent(scene.componentRoot,[])||!same(scene.parent,rootAddress.route.slots.length?{...rootAddress,node:scene.parent?.node,route:{root:rootAddress.component,slots:rootAddress.route.slots.slice(0,-1)}}:null))fail();
  for(const record of [scene.root,...scene.children]){
   const rule=G.vocabulary[record.kind];if(!rule||record.glyph!==rule.glyph||typeof record.summary.text!=='string'||record.summary.text.length>1024||typeof record.summary.truncated!=='boolean')fail();
   if(record.binding){const b=record.binding;
    if(b.relation==='computed-local-binder'){const slots=b.address?.route?.slots;if(!Array.isArray(slots)||slots.length>=record.address.route.slots.length||!same(slots,record.address.route.slots.slice(0,slots.length))||!equivalent(b.address,slots))fail();}
    else if(b.relation==='original-context-binder'){const origin=scene.context.source;if(!Number.isInteger(b.ordinal)||b.ordinal<0||b.ordinal>=scene.context.length||!same(b.address,{...origin,node:b.address.node,route:b.address.route})||!same(b.address.route.slots,origin.route.slots.slice(0,b.address.route.slots.length)))fail();}
    else fail();
   }
  }
  if(scene.ports.length!==(A.fields[scene.root.kind]||[]).length)fail();
  for(const [slot,port]of scene.ports.entries()){
   if(port.slot!==slot||port.field!==G.vocabulary[scene.root.kind].ports[slot])fail();
   if(rootAddress.route.slots.length===512){if(port.status!=='unavailable'||port.reason!=='selection-path-bound'||port.address!==null||scene.children.length)fail();}
   else{const child=scene.children[slot];if(!child||port.status!=='shown'||!equivalent(child.address,[...rootAddress.route.slots,slot])||!same(port.address,child.address)||port.expanded!==child.expanded)fail();}
  }
  const composed=rootAddress.namespace==='scope-output-composition';
  const box=el('section',undefined,'atlas-type-neighborhood');box.dataset.typeNeighborhood=scene.root.address.component;box.tabIndex=-1;box.setAttribute('aria-label',composed?'Fields inside the recorded component':'Fields inside the recorded type');box.append(el('h5',composed?'Inside the recorded component':'Inside the recorded type'),el('p','Original Γ'+scene.context.length+' · '+scene.root.localBinders+(composed?' local binders.':' local type binders.')+' Syntax only; no additional typing judgment.'));
  const pick=(label,address,role)=>{const b=el('button',label);b.type='button';b.dataset.typeNeighborhoodSelect=role;if(address){b.dataset.typeNeighborhoodAddress=JSON.stringify(address);b.onclick=()=>onSelect(address);}else b.disabled=true;return b;};
  const tools=el('div',undefined,'atlas-type-neighborhood-tools');tools.append(pick('Component root',scene.componentRoot,'root'),pick(composed?'Component parent':'Type parent',scene.parent,'parent'));box.append(tools);
  function card(record,role){
   const card=el('div',undefined,'atlas-type-neighborhood-card');card.dataset.typeNeighborhoodNode=role;card.append(el('strong',record.glyph+' '+record.kind+' · e'+record.address.node));const text=el('pre',record.summary.text+(record.summary.truncated?'… [preview truncated]':''));text.tabIndex=0;text.setAttribute('role','region');text.setAttribute('aria-label',role+(composed?' component syntax':' type syntax'));card.append(text);
   if(record.binding){const b=record.binding,external=b.relation==='original-context-binder',button=pick(external?'↶ Original Γ slot '+(b.ordinal+1):(composed?'↶ Enclosing computed binder':'↶ Enclosing type binder'),b.address,'binder');button.dataset.typeNeighborhoodBinding=b.relation;card.append(button);}
   return card;
  }
  const diagram=el('div',undefined,'atlas-type-neighborhood-diagram'),root=card(scene.root,'selected');root.classList.add('atlas-type-neighborhood-root');diagram.append(root);const fields=el('ol',undefined,'atlas-type-neighborhood-fields');
  for(const port of scene.ports){const li=el('li'),label=el('strong',port.field+' →');li.append(label);
   if(port.status==='shown'){const record=scene.children[port.slot],child=card(record,port.field);child.prepend(pick('Open '+port.field+' · '+record.glyph+' '+record.kind,port.address,'field'));child.append(el('small',(BigInt(record.expanded)-1n).toString()+' descendants outside this cut'));li.append(child);}
   else li.append(el('p','Field has '+port.expanded+' occurrences; selection depth limit reached.'));
   fields.append(li);
  }
  if(!scene.ports.length)fields.append(el('li','Leaf constructor: no expression fields. Its payload remains separate data.'));
  diagram.append(fields);box.append(diagram,el('p',scene.stats.retained+' retained + '+scene.stats.hidden+' hidden = '+scene.stats.represented+' expression occurrences. Binder portals are outside this count.'));return box;
 }
 host.ProofAtlasComputedTypeNeighborhoodView={create};
})(window);
