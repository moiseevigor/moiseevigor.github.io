/* Illustrated, complete constructor vocabulary of Lean.Expr. */
(function () {
  'use strict';
  const G=window.PROOF_ATLAS_GRAMMAR, grid=document.getElementById('pa-language-grid');
  if(!G||!grid||G.kinds.length!==12)return;
  const scopeRoles={binder:'Binder with explicit scope',operation:'Typed operation',reference:'Reference',atom:'Atomic expression',type:'Universe',state:'Elaboration state',wrapper:'Metadata wrapper',scope:'Scoped reference'};
  const htmlEscape=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  function diagram(k) {
    const args=k.diagram||[['input','term'],['result','output']];
    const many=new Set(['app','lam','forallE','letE','proj']).has(k.kind);
    const slots=many?
      '<rect x="12" y="12" width="129" height="35" rx="5"/><rect x="198" y="12" width="129" height="35" rx="5"/>':
      '<rect x="66" y="12" width="201" height="35" rx="5"/>';
    const leads=many?
      '<path d="M76 47 Q80 72 144 88 M263 47 Q252 76 188 88"/>':
      '<path d="M166 47 V88"/>';
    const inputs=many?
      '<text x="76" y="34" text-anchor="middle">'+htmlEscape(args[0][0])+'</text><text x="263" y="34" text-anchor="middle">'+htmlEscape(args[0][1])+'</text>':
      '<text x="166" y="34" text-anchor="middle">'+htmlEscape(args[0][0])+'</text>';
    const frame=k.role==='binder'?
      '<rect x="37" y="61" width="259" height="80" rx="9" stroke="#d3b982" fill="none" stroke-dasharray="5 4"/>':'';
    const hole=k.kind==='mvar'?
      '<circle cx="167" cy="108" r="25" stroke="#bd8fa1" stroke-dasharray="5 4" stroke-width="2" fill="none"/>':'';
    return '<svg viewBox="0 0 335 159" role="img" aria-label="'+htmlEscape(k.kind)+' constructor with typed input and output ports">'+
      '<rect width="335" height="159" rx="10" fill="#edf3ef"/>'+
      '<g fill="none" stroke="#8daab0" stroke-width="1.8">'+leads+'</g>'+
      '<g fill="#fff" stroke="#8ea6af" stroke-width="1.3">'+slots+'</g>'+
      '<g fill="#244753" font-size="11" font-family="system-ui,sans-serif">'+inputs+'</g>'+
      frame+hole+
      '<rect x="89" y="88" width="156" height="42" rx="6" fill="#285b67"/>'+
      '<text x="167" y="113" text-anchor="middle" fill="#fff" font-family="system-ui,sans-serif" font-size="14" font-weight="700">'+htmlEscape(args[1][0]).slice(0,24)+'</text>'+
      '<text x="167" y="150" text-anchor="middle" fill="#637f84" font-family="system-ui,sans-serif" font-size="11">'+htmlEscape(k.meaning)+'</text></svg>';
  }
  const examples=new Map(G.kinds.map(k=>[k.kind,k]));
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
    bottom.textContent='Graph interface: '+k.ports+' → '+k.meaning+'.';
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
