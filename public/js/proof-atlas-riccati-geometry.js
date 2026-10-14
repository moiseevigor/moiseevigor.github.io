/* Reviewed argument geometry. Edges are completed calls in the compiled index. */
(function(host){
 'use strict';
 const definitions=[
  ['factor','JacobiData.z_eq_neg_beta_div_ell','step-riccati-factor','Factorization','z = ab = −β/ℓ','derivatives',0],
  ['a','JacobiData.a_deriv_form','step-riccati-pair','Rewrite the a-slope formula','(d² + ca + k²s²a²)/(ds)','derivatives',1],
  ['b','JacobiData.b_deriv_form','step-riccati-pair','Rewrite the b-slope formula','((1−k²)s² − cb − d²b²)/(ds)','derivatives',1],
  ['z','JacobiData.hasDerivAt_z','step-riccati-cancellation','Product differentiation','z′ = (T₁ + T₂)/(ds)','derivatives',2],
  ['product','JacobiData.T1_mul_T2','step-riccati-product','Product identity','T₁T₂ = d²s²z(1−z)D','bound',0],
  ['sign','JacobiData.T1_T2_same_sign','step-riccati-sign','Common sign','T₁ and T₂ have the same sign','bound',0],
  ['amgm','JacobiData.two_sqrt_mul_le_add','step-riccati-amgm','AM–GM helper','2√(xy) ≤ x + y, x,y ≥ 0','bound',0],
  ['slope','JacobiData.slope_bound_abs','step-riccati-amgm','Scalar slope bound','|(T₁ + T₂)/(ds)| ≥ 2√(z(1−z)D)','bound',1],
  ['lift','SBracket.one_le_ε_deriv_u','step-riccati-lift','Bound the lift-slope expression','ε zₚ/(2√(z(1−z)D)) ≥ 1','bound',2]
 ];
 function model(index){
  const nodes=definitions.map(([id,declaration,step,title,formula,group,level])=>{
   const anchor=index.anchors.find(a=>a.declaration===declaration&&a.step===step&&a.role==='proof');
   if(!anchor)throw Error('Missing compiled argument node: '+declaration);
   return{id,declaration,step,title,formula,group,level,anchor};
  });
  const byName=new Map(nodes.map(n=>[n.declaration,n]));
  const edges=index.anchors.filter(a=>a.role==='call'&&a.step.startsWith('step-riccati-')&&byName.has(a.declaration)&&byName.has(a.callee)).map(a=>({from:byName.get(a.callee).id,to:byName.get(a.declaration).id,anchor:a}));
  if(edges.length!==6)throw Error('Riccati argument calls changed; review the geometry');
  return{nodes,edges};
 }
 function mount(container,index,select){
  const data=model(index),buttons=new Map(),ns='http://www.w3.org/2000/svg';
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
  container.replaceChildren();container.append(el('p','Arrows point from a lemma to its completed application in another proof. They show indexed calls, not a claim that all intermediate arguments are displayed.','pa-argument-note'));
  container.append(el('p','The a/b nodes rewrite derivative formulas algebraically. The z′ node contains the differentiation proof. The last node bounds the oriented lift-slope expression.','pa-argument-note'));
  container.append(el('p','D = 1 − k² + k²z. The scalar bound retains z ∈ (0,1), d > 0 and nonzero denominator hypotheses; the phase-lift result uses the supplied inverse-lift derivative and ε = ±1.','pa-argument-note'));
  const groups=[];
  for(const [id,title]of [['derivatives','Differentiation'],['bound','Slope inequality']]){
   const section=el('section',null,'pa-argument-group');section.append(el('h3',title));const graph=el('div',null,'pa-argument-graph'),svg=document.createElementNS(ns,'svg');svg.setAttribute('aria-hidden','true');graph.append(svg);
   const scoped=data.nodes.filter(n=>n.group===id);
   for(const level of [...new Set(scoped.map(n=>n.level))]){
    const row=el('div',null,'pa-argument-row');
    for(const node of scoped.filter(n=>n.level===level)){
     const b=el('button',null,'pa-argument-node');b.type='button';b.dataset.argumentNode=node.id;b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',node.title+'; open its exact compiled proof step');b.append(el('strong',node.title),el('span',node.formula),el('small',node.declaration.split('.').pop()));b.onclick=()=>select(node.anchor);buttons.set(node.id,b);row.append(b);
    }graph.append(row);
   }
   section.append(graph);const list=el('div',null,'pa-argument-calls');
   for(const edge of data.edges.filter(e=>scoped.some(n=>n.id===e.to))){
    const from=data.nodes.find(n=>n.id===edge.from),to=data.nodes.find(n=>n.id===edge.to),b=el('button',from.title+' → '+to.title);b.type='button';b.dataset.argumentCall=edge.from+'-'+edge.to;b.title='Select the complete '+edge.anchor.callee+' application at '+edge.anchor.path;b.onclick=()=>select(edge.anchor);list.append(b);
   }
   section.append(list);container.append(section);groups.push({graph,svg,scoped});
  }
  const unsupported=el('button','Unsupported: exact square-gap identity and equality case','pa-argument-unsupported');unsupported.type='button';unsupported.dataset.argumentUnsupported='true';unsupported.onclick=()=>select({step:'step-riccati-gap'});container.append(unsupported);
  function draw(){for(const{graph,svg,scoped}of groups){
   svg.replaceChildren();const rect=graph.getBoundingClientRect();if(!rect.width)return;svg.setAttribute('viewBox','0 0 '+rect.width+' '+rect.height);
   const defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');marker.id='pa-arrow-'+scoped[0].group;for(const[k,v]of Object.entries({markerWidth:8,markerHeight:8,refX:6,refY:3,orient:'auto',markerUnits:'strokeWidth'}))marker.setAttribute(k,v);const arrow=document.createElementNS(ns,'path');arrow.setAttribute('d','M0,0 L6,3 L0,6');marker.append(arrow);defs.append(marker);svg.append(defs);
   for(const edge of data.edges.filter(e=>scoped.some(n=>n.id===e.to))){const a=buttons.get(edge.from).getBoundingClientRect(),b=buttons.get(edge.to).getBoundingClientRect(),x=a.left+a.width/2-rect.left,y=a.bottom-rect.top,u=b.left+b.width/2-rect.left,v=b.top-rect.top,path=document.createElementNS(ns,'path');path.setAttribute('d',`M${x},${y} C${x},${(y+v)/2} ${u},${(y+v)/2} ${u},${v-4}`);path.setAttribute('marker-end','url(#'+marker.id+')');path.dataset.argumentEdge=edge.from+'-'+edge.to;svg.append(path);}
  }}
  const observer=new ResizeObserver(draw);groups.forEach(g=>observer.observe(g.graph));
  return{select(snapshot){for(const node of data.nodes)buttons.get(node.id).setAttribute('aria-pressed',String(snapshot?.name===node.declaration));draw();for(const edge of data.edges){const selected=snapshot?.name===edge.anchor.declaration&&(snapshot.path===edge.anchor.path||snapshot.path.startsWith(edge.anchor.path+'.'));container.querySelector('[data-argument-call="'+edge.from+'-'+edge.to+'"]').setAttribute('aria-pressed',String(selected));}},data};
 }
 const api={model,mount};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasRiccatiGeometry=api;
})(typeof window==='undefined'?globalThis:window);
