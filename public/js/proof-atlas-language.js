/* Illustrated, complete constructor vocabulary of Lean.Expr. */
(function () {
  'use strict';
  const G=window.PROOF_ATLAS_GRAMMAR, grid=document.getElementById('pa-language-grid');
  if(!G||!grid||G.kinds.length!==12)return;
  if(!window.ProofAtlasConstructorDiagram){grid.textContent='Constructor diagrams are unavailable. Reload to retry or use the full language reference.';return;}
  const scopeRoles={binder:'Binder with explicit scope',operation:'Expression operation',reference:'Reference',atom:'Atomic expression',type:'Universe',state:'Elaboration state',wrapper:'Metadata wrapper',scope:'Scoped reference'};

  function diagram(k) { return window.ProofAtlasConstructorDiagram.html(k); }
  let filter='all';
  function card(k) {
    const art=document.createElement('article');
    art.className='pa-language-card';
    art.id='lean-expression-'+k.kind;
    const eyebrow=document.createElement('div');eyebrow.className='pa-language-card-meta';
    eyebrow.textContent=(scopeRoles[k.role]||k.category)+' / '+(k.observed?'Observed in benchmark':'Not observed in benchmark');
    const heading=document.createElement('h3');heading.textContent=k.kind+' · '+k.title;
    const draw=document.createElement('div');draw.innerHTML=diagram(k);
    const description=document.createElement('p');description.textContent=k.explanation;
    const sourceLabel=document.createElement('div');sourceLabel.className='pa-language-caption';sourceLabel.textContent='Illustrative Lean notation';
    const code=document.createElement('pre');code.className='pa-language-example';
    const ins=document.createElement('code');ins.textContent=k.example;code.appendChild(ins);
    const caution=document.createElement('p');caution.className='pa-language-caution';
    caution.textContent=k.caution;
    const bottom=document.createElement('div');bottom.className='pa-language-under';
    bottom.textContent='Expr children: '+(k.fields.filter(f=>f.link==='expr').map(f=>f.name).join(', ')||'none')+'. Attributes and references are listed separately.';
    art.append(eyebrow,heading,draw,description,sourceLabel,code,caution,bottom);
    return art;
  }
  function match(k){
    if(filter==='observed')return k.observed;
    if(filter==='binder')return k.role==='binder'||k.kind==='bvar';
    if(filter==='other')return !k.observed;
    return true;
  }
  function render(){
    grid.replaceChildren();
    let count=0;
    for(const k of G.kinds){if(match(k)){grid.appendChild(card(k));count++}}
    grid.setAttribute('aria-label',count+' Lean expression constructor diagrams');
    document.querySelectorAll('#pa-language-filters button').forEach(btn=>{
      const on=btn.dataset.filter===filter;btn.setAttribute('aria-pressed',on?'true':'false');
    });
  }
  document.querySelectorAll('#pa-language-filters button').forEach(btn=>btn.addEventListener('click',()=>{
    filter=btn.dataset.filter;render();
  }));
  render();
})();
