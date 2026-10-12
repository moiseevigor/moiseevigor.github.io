/* Proof Atlas document reader. 
 * Kernel Expr symbols, named Lean declarations and mathematical commentary
 * are deliberately separate sources of evidence. No missing proof text is invented.
 */
(function () {
  'use strict';
  const data=window.PROOF_ATLAS_DATA, named=window.PROOF_ATLAS_DECLARATIONS,
    grammar=window.PROOF_ATLAS_GRAMMAR, api=window.ProofAtlasAPI;
  const root=document.getElementById('proof-atlas');
  if(!root||!data||!api||!grammar||grammar.kinds.length!==12)return;
  const $=id=>document.getElementById(id), app=root.querySelector('.pa-app');
  const panel=$('pa-reader'), scroll=$('pa-reader-scroll'), content=$('pa-reader-content');
  const toggle=$('pa-reader-toggle'),close=$('pa-reader-close');
  const hud=$('pa-branch-hud'), hudTitle=$('pa-branch-title'),hudStats=$('pa-branch-stats'),hudNote=$('pa-branch-note');
  const kinds=new Map(grammar.kinds.map(k=>[k.kind,k]));
  const namedMap=new Map((named?.nodes||[]).map(n=>[n.short,n]));
  const children=Array.from({length:data.parent.length},()=>[]);
  for(let i=0;i<data.parent.length;i++){
    const p=data.parent[i];if(p>=0)children[p].push(i);
  }
  const termCounts=new Uint32Array(data.parent.length);
  for(let i=data.parent.length-1;i>=0;i--){
    termCounts[i]=children[i].length?children[i].reduce((a,j)=>a+termCounts[j],0):1;
  }
  const depIndex=new Map();
  for(const d of data.deps)for(const i of d.uses)depIndex.set(i,d);
  const languageKinds=kinds;
  const FORMAL='From Lean / source',EDITORIAL='Explanatory interpretation',REDACTED='Source payload not public';
  const article={
    crossing:'This is the counting conclusion of Lemma 3.3, the crossing principle. The two phase branches cover the phase circle once while monotonicity and endpoint identification exclude distinct crossings. This paragraph is a synopsis, not a quotation from the research manuscript.',
    exists_branch:'Existence is obtained by reducing a phase modulo 2K and applying the intermediate value theorem to one of two continuous phase branches. The formal proof cites intermediate-value lemmas in Mathlib.',
    unique_branch:'Uniqueness uses range bounds to restrict the difference of winding indices, together with injectivity of each strictly monotone branch and identification of the glued endpoints.',
    eq_of_branch_eq:'When two signed branches have the same phase value, strict monotonicity and the common endpoint relation force the same p parameter.',
    psiP:'The positive branch of the zero-curve phase correspondence.',
    psiM:'The negative branch of the zero-curve phase correspondence.'
  };
  const state={tab:'explain',selection:null,selectedKind:'app',open:true};
  const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=String(text);return n;};
  const word=n=>Number(n).toLocaleString('en-US');
  function pill(text,warning=false){const x=el('span','pr-badge'+(warning?' pr-badge--warning':''),text);return x;}
  function heading(parent,title){parent.appendChild(el('h3','pr-heading',title));}
  function paragraph(parent,text){parent.appendChild(el('p','pr-body',text));}
  function eyebrow(parent,text){parent.appendChild(el('div','pr-eyebrow',text));}
  function separator(parent){parent.appendChild(el('div','pr-separator'));}
  function stat(parent,name,value){const n=el('div','pr-stat');n.append(el('strong',null,value),el('span',null,name));parent.appendChild(n);}
  function stats(parent,items){
    const row=el('div','pr-statlist');for(const [name,value] of items)stat(row,name,value);parent.appendChild(row);
  }
  function action(parent,text,fn){
    const b=el('button',null,text);b.type='button';b.addEventListener('click',fn);parent.appendChild(b);return b;
  }
  function makeActions(parent){const d=el('div','pr-actions');parent.appendChild(d);return d;}
  function notice(parent,text){
    const d=el('div','pr-disclaimer',text);parent.appendChild(d);
  }
  function code(parent,text){
    const p=el('pre','pr-code');const k=el('code',null,text);p.appendChild(k);parent.appendChild(p);return p;
  }
  function toExpression(i){api.selectExpression(i);setOpen(true);}
  function toNamed(n){api.selectDeclaration(n);setOpen(true);}
  function namedForOccurrence(i){
    const d=depIndex.get(i);
    if(!d||!d.name.startsWith('CrossingData.'))return null;
    return namedMap.get(d.name.split('.').pop())||null;
  }
  function relatedNames(i,limit=10){
    const matches=[];
    const end=i+data.size[i];
    for(const dep of data.deps){
      if(!dep.name.startsWith('CrossingData.'))continue;
      const refs=dep.uses.filter(j=>j>=i&&j<end);
      if(refs.length)matches.push({name:dep.name,count:refs.length,idx:refs[0]});
    }
    return matches.slice(0,limit);
  }
  function diagram(k){
    const row=k.diagram||[['input','expression'],['operation','result']];
    const two=k.kind==='app'||k.kind==='lam'||k.kind==='forallE'||k.kind==='letE'||k.kind==='proj';
    const boxText=esc(row[1]?.[0]||k.form);
    const a=esc(row[0]?.[0]||'input'),b=esc(row[0]?.[1]||'term');
    // Structural ports, scopes, and bindings are explicit; all geometry is
    // schematic and not a representation of source spans.
    const arrows=two?
      '<path d="M73 48 C73 73 133 70 133 93 M259 48 C259 72 199 75 199 93" />':
      '<path d="M165 49 L165 93"/>';
    const inputNodes=two?
      '<rect x="13" y="14" width="123" height="32" rx="5"/><rect x="199" y="14" width="123" height="32" rx="5"/>':
      '<rect x="70" y="14" width="190" height="32" rx="5"/>';
    const labels=two?
      '<text x="74" y="34" text-anchor="middle">'+a+'</text><text x="260" y="34" text-anchor="middle">'+b+'</text>':
      '<text x="165" y="34" text-anchor="middle">'+a+'</text>';
    const scope=k.role==='binder'?'<path d="M43 59 V141 H287 V59" stroke="#c6a981" stroke-dasharray="5 5" fill="none" opacity=".65"/>':'';
    const hole=k.kind==='mvar'?'<circle cx="165" cy="112" r="25" fill="none" stroke="#ad889e" stroke-dasharray="5 4" stroke-width="2"/>':'';
    return '<svg viewBox="0 0 334 158" class="pr-rule-svg" role="img" aria-label="'+esc(k.title)+': '+esc(k.meaning)+'">'+
      '<rect width="334" height="158" rx="9" fill="#edf3ef"/>'+
      '<g fill="none" stroke="#7ea1a5" stroke-width="2">'+arrows+'</g>'+scope+
      '<g fill="#fff" stroke="#769ba2" stroke-width="1.5">'+inputNodes+'</g>'+hole+
      '<rect x="89" y="93" width="153" height="37" rx="6" fill="#1c5360" />'+
      '<g fill="#264b55" font-family="system-ui,sans-serif" font-size="11">'+labels+'</g>'+
      '<text x="165" y="116" fill="#f7faf8" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="600">'+boxText.slice(0,21)+'</text>'+
      '<text x="165" y="149" fill="#66818a" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10">'+esc(k.meaning)+'</text></svg>';
  }
  function selectedRule(){
    return languageKinds.get(state.selectedKind)||grammar.kinds[0];
  }
  function renderRule(parent,k){
    eyebrow(parent,'Core expression constructor · '+k.kind);
    heading(parent,k.title);
    const svg=el('div');svg.innerHTML=diagram(k);parent.appendChild(svg);
    paragraph(parent,k.explanation);
    eyebrow(parent,'Corresponding Lean source expression — illustrative');
    code(parent,k.example);
    notice(parent,k.caution);
    const foot=el('p','pr-detail',k.observed?
      'Observed in the SE(2) crossing certificate. This example describes the constructor, not the selected proof expression.':
      'Not observed in the closed CrossingData.crossing certificate; included because it is part of the Lean.Expr language.');
    parent.appendChild(foot);
  }
  function renderGrammar(parent){
    parent.appendChild(pill('12 / 12 Core Lean.Expr constructors'));
    eyebrow(parent,'A finite graphical alphabet');
    heading(parent,'The visual syntax of Lean');
    paragraph(parent,'These twelve constructors define the kernel expression tree exported by CoreGIR. Surface syntax (theorem, tactics, macro syntax) elaborates into combinations of them; it is a separate, much larger language.');
    const grid=el('div','pr-syntax-grid');
    for(const k of grammar.kinds){
      const b=el('button','pr-syntax-card'+(state.selectedKind===k.kind?' active':''));b.type='button';
      b.append(el('strong',null,k.kind),el('span',null,k.title));
      const svg=el('div');svg.innerHTML=diagram(k);b.appendChild(svg);
      b.addEventListener('click',()=>{
        state.selectedKind=k.kind;
        render({resetScroll:false});
        const spot=$('pa-rule-focus');if(spot)spot.scrollIntoView({block:'nearest',behavior:'smooth'});
      });
      grid.appendChild(b);
    }
    parent.appendChild(grid);separator(parent);
    const box=el('div');box.id='pa-rule-focus';parent.appendChild(box);
    renderRule(box,selectedRule());
  }
  function renderNamed(parent,n){
    parent.appendChild(pill(FORMAL));
    eyebrow(parent,n.kind+' · Crossing.lean · line '+n.line);
    heading(parent,n.short);
    paragraph(parent,n.summary);
    separator(parent);
    if(state.tab==='lean'){
      eyebrow(parent,'Verified source-level declaration statement');
      code(parent,n.statement);
      notice(parent,'This is the declaration statement exported from Crossing.lean; the unpublished proof body and elaborated term are not included in the public atlas.');
    }else{
      paragraph(parent,'This node names a Lean '+(n.kind==='def'?'definition':n.kind==='structure'?'structure':'theorem')+'. It is not an arbitrary expression ID.');
      if(article[n.short]){
        eyebrow(parent,'Correspondence with the SE(2) research article');
        paragraph(parent,article[n.short]);
        notice(parent,'This is an authorial interpretation of the article’s result, not an exact manuscript quotation or a verified line-by-line alignment.');
      }else{
        eyebrow(parent,'Meaning');
        paragraph(parent,'Its formal declaration is given in Crossing.lean. The statement is available in the Lean tab. No article passage has been assigned to this specific declaration.');
      }
    }
    separator(parent);
    const deps=(n.refs||[]),actions=makeActions(parent);
    if(deps.length){
      eyebrow(parent,'Referenced supporting declarations · source-level');
      for(const dep of deps.slice(0,9))action(actions,'↖ '+dep,()=>toNamed(dep));
    }
    const leanTab=makeActions(parent);
    action(leanTab,state.tab==='lean'?'Read explanation':'View Lean statement',()=>{
      state.tab=state.tab==='lean'?'explain':'lean';render();
    });
  }
  function renderExpr(parent,i){
    const k=data.kinds[Number(data.kind[i])],rule=languageKinds.get(k);
    const leaf=(data.size[i]===1),decl=leaf?namedForOccurrence(i):null;
    state.selectedKind=k;
    parent.appendChild(pill('Measured CoreGIR expression'));
    eyebrow(parent,leaf?'Terminal syntax occurrence':'Internal expression');
    heading(parent,decl?decl.short:'Expression #'+i+' · '+(rule?.title||k));
    if(state.tab==='lean'){
      eyebrow(parent,'Structural syntax — payload anonymized');
      const childIds=children[i];
      const preview=leaf?('Expr.'+k+'  -- no expression children') :
        ('Expr.'+k+'(\n'+childIds.map((j,n)=>'  child '+(n+1)+': #'+j+'  -- '+data.kinds[+data.kind[j]]).join('\n')+'\n)');
      code(parent,decl?decl.statement:preview);
      if(!decl)notice(parent,'This is a readable structural sketch, not verbatim Lean source. Binder names, universe levels, types, and original source spans were withheld in the public projection.');
    }else{
      if(decl){
        paragraph(parent,'This syntax leaf is a reference to the actual Lean '+decl.kind+' '+decl.name+'. The enclosing expression applies or otherwise uses that declaration.');
        if(article[decl.short])paragraph(parent,article[decl.short]);
      }else{
        paragraph(parent,rule?.explanation||'A Lean expression. The public data give its structural constructor and edges, not the original mathematical formula.');
      }
      if(rule){
        const d=el('div');d.innerHTML=diagram(rule);parent.appendChild(d);
      }
      notice(parent,leaf?
        'A terminal expression is not necessarily a lemma. A const node can reference a named declaration; a bvar points to its binder; a lit is an atomic value.':
        'The highlighted subtree is an exact set of expression occurrences. It has no automatically known article passage or independent lemma boundary.');
    }
    stats(parent,[['Expression occurrences',word(data.size[i])],['Terminal leaves',word(termCounts[i])],['Direct children',children[i].length],['Source depth',(()=>{let d=0,j=i;while(data.parent[j]>=0){d++;j=data.parent[j];}return d})()]]);
    const refs=relatedNames(i);
    if(refs.length){
      separator(parent);
      eyebrow(parent,'Named declarations inside this subtree');
      const a=makeActions(parent);
      for(const r of refs){
        const n=namedMap.get(r.name.split('.').pop());
        action(a,r.name+' · '+r.count+' occurrence'+(r.count===1?'':'s'),()=>n?toNamed(n.short):toExpression(r.idx));
      }
    }
    if(decl){
      const a=makeActions(parent);
      action(a,'Open named '+decl.kind+' ↗',()=>toNamed(decl.short));
    }
    separator(parent);
    eyebrow(parent,'Immediate syntax structure');
    const actions=makeActions(parent);
    if(data.parent[i]>=0)action(actions,'Parent #'+data.parent[i],()=>toExpression(data.parent[i]));
    for(const j of children[i].slice(0,7))action(actions,'Child #'+j+' · '+data.kinds[+data.kind[j]],()=>toExpression(j));
    if(children[i].length>7)paragraph(parent,'The remaining '+(children[i].length-7)+' direct children are accessible through the subtree explorer.');
    const choose=makeActions(parent);
    action(choose,'Show descendants on graph',()=>api.setScope('subtree'));
    action(choose,'Show path to root',()=>api.setScope('lineage'));
  }
  function renderDep(parent,i){
    const d=data.deps[i];parent.appendChild(pill(FORMAL));
    eyebrow(parent,'Direct environment declaration reference');
    heading(parent,d.name==='Kernel/library declaration'?'Library declaration #'+(i+1):d.name);
    paragraph(parent,'This dependency appears '+d.count+' time'+(d.count===1?'':'s')+' in the theorem’s elaborated expression. The public projection obscures many library names; the original closed proof remains private.');
    const actions=makeActions(parent);
    if(d.uses.length)action(actions,'Inspect exact reference occurrence #'+d.uses[0],()=>toExpression(d.uses[0]));
    const local=d.name.startsWith('CrossingData.')?namedMap.get(d.name.split('.').pop()):null;
    if(local)action(actions,'Read '+local.short+' statement',()=>toNamed(local.short));
  }
  function renderIdea(parent,id){
    parent.appendChild(pill(EDITORIAL,true));
    const descriptions={
      phase:['Phase relation','A phase line meets one of two branches when ψ equals a signed lift modulo 2K.'],
      exists:['Existence','Continuity and phase-range coverage give at least one crossing.'],
      unique:['Uniqueness','Strict monotonicity, range bounds and identification at glued endpoints give at most one crossing parameter.'],
      crossing:['One crossing','Combine existence and uniqueness to establish exactly one parameter for each phase.']
    };
    const pair=descriptions[id]||['Mathematical idea','Human-authored explanatory diagram'];
    heading(parent,pair[0]);paragraph(parent,pair[1]);
    notice(parent,'This is an editorial outline of the argument, not a statement extracted automatically from Lean.Expr.');
    const target={exists:'exists_branch',unique:'unique_branch',crossing:'crossing'}[id];
    if(target){const a=makeActions(parent);action(a,'Open formal theorem '+target,()=>toNamed(target));}
  }
  function displayHud(selection){
    const show=selection?.type==='expr' && (api.getSnapshot()?.mode==='whole');
    hud.hidden=!show;
    if(!show)return;
    const i=selection.id,k=data.kinds[Number(data.kind[i])],n=data.size[i],leaf=n===1;
    hudTitle.textContent=(leaf?'Terminal':'Subtree')+' #'+i+' · '+k;
    hudStats.replaceChildren();
    for(const value of [word(n)+' nodes',word(termCounts[i])+' terminal leaves']){
      hudStats.appendChild(el('span',null,value));
    }
    hudNote.textContent=leaf?
      'This leaf has no descendants; trace its enclosing proof structure instead.':
      'This entire structural subtree can be highlighted, without claiming it is a named lemma.';
    $('pa-branch-desc').disabled=leaf;
    $('pa-branch-lineage').disabled=data.parent[i]<0;
  }
  function render(opts={}){
    const preserve=opts.resetScroll===false;
    const oldY=preserve?scroll.scrollTop:0;
    content.replaceChildren();
    const s=state.selection||{type:'decl',id:'crossing'};
    $('pa-reader-title').textContent=s.type==='expr'?'Lean expression '+s.id:
      s.type==='decl'?s.id:s.type==='dep'?'Declaration dependency':'Interpretation';
    document.querySelectorAll('.pa-reader-tabs [data-pa-reader-tab]').forEach(b=>{
      const active=b.dataset.paReaderTab===state.tab;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');
    });
    if(state.tab==='language')renderGrammar(content);
    else if(s.type==='decl'){
      const n=namedMap.get(s.id);if(n)renderNamed(content,n);
    }else if(s.type==='expr')renderExpr(content,s.id);
    else if(s.type==='dep')renderDep(content,s.id);
    else renderIdea(content,s.id);
    displayHud(s);
    $('pa-reader-status').textContent=state.tab==='language'?'12 Lean.Expr constructors · all covered':
      s.type==='decl'?'Lean declaration · source-level':
      s.type==='expr'?'CoreGIR structure · original payload private':
      s.type==='dep'?'Lean environment dependency':'Editorial explanation';
    scroll.scrollTop=preserve?oldY:0;
  }
  function setOpen(open){
    state.open=Boolean(open);
    app.classList.toggle('pa-reader-open',state.open);
    panel.hidden=!state.open;
    toggle.setAttribute('aria-expanded',state.open?'true':'false');
    toggle.textContent=state.open?'Hide reader':'Open reader';
    // Existing graph ResizeObserver is already watching the canvas viewport.
    requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));
  }
  $('pa-reader-close').addEventListener('click',()=>setOpen(false));
  toggle.addEventListener('click',()=>setOpen(!state.open));
  document.querySelectorAll('[data-pa-reader-tab]').forEach(b=>b.addEventListener('click',()=>{
    state.tab=b.dataset.paReaderTab;
    if(state.tab==='language'&&state.selection?.type==='expr'){
      state.selectedKind=data.kinds[Number(data.kind[state.selection.id])];
    }
    setOpen(true);render();
  }));
  $('pa-branch-desc').addEventListener('click',()=>api.setScope('subtree'));
  $('pa-branch-lineage').addEventListener('click',()=>api.setScope('lineage'));
  window.addEventListener('proof-atlas:selection',e=>{
    state.selection=e.detail;
    if(state.tab==='language'&&e.detail.type==='expr'){
      state.selectedKind=data.kinds[Number(data.kind[e.detail.id])];
    }
    render();
  });
  window.addEventListener('proof-atlas:mode',()=>{
    displayHud(state.selection);
  });
  window.ProofAtlasReader={
    open:()=>setOpen(true),close:()=>setOpen(false),
    showGrammar:kind=>{
      if(kind&&kinds.has(kind))state.selectedKind=kind;
      state.tab='language';setOpen(true);render();
    }
  };
  // The main graph initializes before this reader script. Restore its actual
  // default named declaration selection on first load.
  const snapshot=api.getSnapshot();
  state.selection=snapshot.mode==='map'?{type:'decl',id:snapshot.namedSelected}:
    {type:'expr',id:snapshot.selected};
  state.selectedKind=data.kinds[Number(data.kind[snapshot.selected])];
  setOpen(true);render();
})();
