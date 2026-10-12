/* Proof Atlas document reader. 
 * Kernel Expr symbols, named Lean declarations and mathematical commentary
 * are deliberately separate sources of evidence. No missing proof text is invented.
 */
(function () {
  'use strict';
  const data=window.PROOF_ATLAS_DATA, named=window.PROOF_ATLAS_DECLARATIONS,
    terms=window.PROOF_ATLAS_TERMS, api=window.ProofAtlasAPI;
  const root=document.getElementById('proof-atlas');
  if(!root||!data||!api||!window.ProofAtlasTermReader)return;
  const decoder=window.ProofAtlasTermReader.create(data,terms);
  const $=id=>document.getElementById(id), app=root.querySelector('.pa-app');
  const panel=$('pa-reader'), scroll=$('pa-reader-scroll'), content=$('pa-reader-content');
  const toggle=$('pa-reader-toggle'),close=$('pa-reader-close');
  const hud=$('pa-branch-hud'), hudTitle=$('pa-branch-title'),hudStats=$('pa-branch-stats'),hudNote=$('pa-branch-note');
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
  const FORMAL='From Lean / source',EDITORIAL='Explanatory interpretation';
  const article={
    crossing:'This is the counting conclusion of Lemma 3.3, the crossing principle. The two phase branches cover the phase circle once while monotonicity and endpoint identification exclude distinct crossings. This paragraph is a synopsis, not a quotation from the research manuscript.',
    exists_branch:'Existence is obtained by reducing a phase modulo 2K and applying the intermediate value theorem to one of two continuous phase branches. The formal proof cites intermediate-value lemmas in Mathlib.',
    unique_branch:'Uniqueness uses range bounds to restrict the difference of winding indices, together with injectivity of each strictly monotone branch and identification of the glued endpoints.',
    eq_of_branch_eq:'When two signed branches have the same phase value, strict monotonicity and the common endpoint relation force the same p parameter.',
    psiP:'The positive branch of the zero-curve phase correspondence.',
    psiM:'The negative branch of the zero-curve phase correspondence.'
  };
  const state={tab:'explain',selection:null,open:true,history:[]};
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
  function renderNamed(parent,n){
    parent.appendChild(pill(FORMAL));
    eyebrow(parent,n.kind+' · Crossing.lean · line '+n.line);
    heading(parent,n.short);
    paragraph(parent,n.summary);
    separator(parent);
    if(state.tab==='lean'){
      eyebrow(parent,'Verified source-level declaration statement');
      code(parent,n.statement);
      notice(parent,n.short==='crossing'?'The crossing type and elaborated proof term are published. Inspect the proof root to read the actual term; its original tactic script is not reconstructed.':'This declaration statement is published. Its own proof body is not expanded by the crossing export; references to it remain named constants.');
      if(n.short==='crossing')action(makeActions(parent),'Read complete crossing proof',()=>toExpression(data.roots[1]));
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
  function download(text,name){
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const link=el('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function renderExpr(parent,i){
    const k=decoder.kind(i),leaf=data.size[i]===1,decl=leaf?namedForOccurrence(i):null;
    heading(parent,'Expression #'+i+' · '+(data.roots[1]===i?'Crossing proof':k));
    const meta=el('p','pr-subtree-meta',word(data.size[i])+' occurrences · '+word(termCounts[i])+' terminal leaves');parent.appendChild(meta);
    if(state.history.length){const prior=state.history[state.history.length-1],back=makeActions(parent);action(back,'← Back to subtree #'+prior,()=>{state.history.pop();state.restoring=true;toExpression(prior);state.restoring=false;});}
    if(decoder.complete){
      if(state.tab==='explain'){
        paragraph(parent,decoder.describe(i));
        eyebrow(parent,'The selected term · readable rendering');
        const pre=code(parent,decoder.format(i));pre.id='pa-subtree-text';
        parent.appendChild(el('p','pr-detail','Notation hides recognized type and instance arguments. The full-term view retains every occurrence.'));
      }else{
        eyebrow(parent,'All arguments · no subtree truncation');
        const pre=code(parent,decoder.format(i,false));pre.id='pa-subtree-text';
      }
      const ctx=decoder.context(i);
      if(ctx.length){
        const details=el('details','pr-context');details.appendChild(el('summary',null,'Variables and assumptions in scope · '+ctx.length));
        const list=el('dl','pr-context-list');for(const entry of ctx){const dt=el('dt');action(dt,entry.name+' · binder #'+entry.id,()=>toExpression(entry.id));const dd=el('dd',null,entry.type);list.append(dt,dd);}details.appendChild(list);parent.appendChild(details);
      }
      if(state.tab==='lean'){
        eyebrow(parent,'Every occurrence in this subtree');
        const rows=decoder.rows(i),list=el('ol','pr-term-tree');let shown=0;
        const more=el('button','pr-term-more'),status=el('p','pr-detail');more.type='button';
        const append=()=>{for(const r of rows.slice(shown,shown+200)){const li=el('li');li.dataset.occurrence=r.id;li.style.setProperty('--term-depth',Math.min(r.depth,8));const b=el('button','pr-term-row');b.type='button';b.dataset.occurrence=r.id;b.append(el('span','pr-term-index','#'+r.id),el('span','pr-term-role',r.role),el('span','pr-term-label',r.label));b.title=r.path;b.addEventListener('click',()=>toExpression(r.id));li.appendChild(b);list.appendChild(li);}shown=Math.min(shown+200,rows.length);status.textContent=word(shown)+' / '+word(rows.length)+' occurrences shown';more.hidden=shown===rows.length;more.textContent='Show next '+Math.min(200,rows.length-shown)+' occurrences';};
        more.addEventListener('click',append);append();parent.append(list,status,more);
      }
      const actions=makeActions(parent);
      action(actions,'Download entire subtree',()=>{const rows=decoder.rows(i);download('Selected occurrence #'+i+'\n'+decoder.path(i)+'\nCoreGIR SHA-256: '+terms.source.coregirSha256+'\n\nFULL TERM\n'+decoder.format(i,false)+'\n\nALL '+rows.length+' OCCURRENCES\n'+rows.map(r=>'  '.repeat(r.depth)+'#'+r.id+' '+r.role+' | '+r.label+' | '+JSON.stringify(r.payload)+' | '+r.path).join('\n'),'crossing-subtree-'+i+'.txt');});
      const source=el('details','pr-context');source.appendChild(el('summary',null,'Formal provenance'));paragraph(source,decoder.path(i));paragraph(source,'CoreGIR SHA-256: '+terms.source.coregirSha256);paragraph(source,terms.scope);parent.appendChild(source);
    }else{
      notice(parent,'The released graph omits term payloads. The entire structural subtree is shown below, but its redacted formulas cannot be reconstructed.');
      const rows=decoder.rows(i);code(parent,rows.map(r=>'  '.repeat(r.depth)+'#'+r.id+' '+r.role+' · '+r.label).join('\n'));
    }
    const refs=relatedNames(i);
    if(refs.length){const details=el('details','pr-context');details.appendChild(el('summary',null,'Project declarations used here · '+refs.length));const a=makeActions(details);for(const r of refs){const n=namedMap.get(r.name.split('.').pop());action(a,r.name+' · '+r.count+' use'+(r.count===1?'':'s'),()=>n?toNamed(n.short):toExpression(r.idx));}parent.appendChild(details);}
    if(decl){const a=makeActions(parent);action(a,'Open named '+decl.kind+' '+decl.short+' ↗',()=>toNamed(decl.short));}
    const actions=makeActions(parent);
    if(data.parent[i]>=0)action(actions,'Parent #'+data.parent[i],()=>toExpression(data.parent[i]));
    for(const j of children[i])action(actions,'Child #'+j+' · '+decoder.kind(j),()=>toExpression(j));
    const choose=makeActions(parent);action(choose,'Show descendants on graph',()=>api.setScope('subtree'));action(choose,'Show path to root',()=>api.setScope('lineage'));
  }
  function renderDep(parent,i){
    const d=data.deps[i];parent.appendChild(pill(FORMAL));
    eyebrow(parent,'Direct environment declaration reference');
    heading(parent,d.name==='Kernel/library declaration'?'Library declaration #'+(i+1):d.name);
    paragraph(parent,'This dependency appears '+d.count+' time'+(d.count===1?'':'s')+' in the theorem’s elaborated expression. The graph projection abbreviates library names; the selected reference occurrence reveals the actual published declaration name. Referenced declarations’ own proof bodies are not expanded.');
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
    $('pa-reader-title').textContent=s.type==='expr'?'Subtree #'+s.id:
      s.type==='decl'?s.id:s.type==='dep'?'Declaration dependency':'Interpretation';
    document.querySelector('[data-pa-reader-tab="lean"]').textContent=s.type==='expr'?'Full term':'Lean statement';
    document.querySelectorAll('.pa-reader-tabs [data-pa-reader-tab]').forEach(b=>{
      const active=b.dataset.paReaderTab===state.tab;
      b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');
    });
    if(s.type==='decl'){
      const n=namedMap.get(s.id);if(n)renderNamed(content,n);
    }else if(s.type==='expr')renderExpr(content,s.id);
    else if(s.type==='dep')renderDep(content,s.id);
    else renderIdea(content,s.id);
    displayHud(s);
    $('pa-reader-status').textContent=s.type==='decl'?'Lean declaration · source-level':
      s.type==='expr'?(decoder.complete?'Actual subtree · '+word(data.size[s.id])+' occurrences':'Structural subtree · payload unavailable'):
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
    setOpen(true);render();
  }));
  $('pa-branch-desc').addEventListener('click',()=>api.setScope('subtree'));
  $('pa-branch-lineage').addEventListener('click',()=>api.setScope('lineage'));
  window.addEventListener('proof-atlas:selection',e=>{
    if(e.detail.type==='expr'&&state.selection?.type==='expr'&&e.detail.id!==state.selection.id&&!state.restoring)state.history.push(state.selection.id);
    if(e.detail.type!=='expr')state.history=[];
    state.selection=e.detail;
    render();
  });
  window.addEventListener('proof-atlas:mode',()=>{
    displayHud(state.selection);
  });
  window.ProofAtlasReader={open:()=>setOpen(true),close:()=>setOpen(false),showSubtree:toExpression};
  // The main graph initializes before this reader script. Restore its actual
  // default named declaration selection on first load.
  const snapshot=api.getSnapshot();
  state.selection=snapshot.mode==='map'?{type:'decl',id:snapshot.namedSelected}:
    {type:'expr',id:snapshot.selected};
  setOpen(true);render();
  // Share a selected occurrence without changing other page anchors.
  const selected=window.location.hash.match(/^#expr-(\d+)$/);
  if(selected&&Number(selected[1])<data.parent.length)toExpression(Number(selected[1]));
})();
