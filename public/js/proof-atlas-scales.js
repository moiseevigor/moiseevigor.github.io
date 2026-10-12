/* Proof Atlas / four semantic scales for every Lean.Expr constructor.
 * This is a diagrammatic REFERENCE, not a kernel checker.
 * The closed Lean.Expr sum type has precisely twelve constructor tags.
 */
(function () {
  'use strict';
  const root=document.getElementById('pa-scale-interactive');
  const G=window.PROOF_ATLAS_GRAMMAR;
  if (!root || !G || !Array.isArray(G.kinds) || G.kinds.length!==12) return;
  const byKind=new Map(G.kinds.map(k=>[k.kind,k]));
  const order=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
  const rawFields={
    bvar:[['index : Nat','attribute']],fvar:[['fvarId : FVarId','context reference']],
    mvar:[['mvarId : MVarId','elaboration reference']],sort:[['u : Level','universe']],
    const:[['name : Name','environment reference'],['us : List Level','universe args']],
    app:[['fn : Expr','expression'],['arg : Expr','expression']],
    lam:[['binderName : Name','attribute'],['binderType : Expr','expression'],['body : Expr','scoped expression'],['binderInfo : BinderInfo','attribute']],
    forallE:[['binderName : Name','attribute'],['binderType : Expr','expression'],['body : Expr','scoped expression'],['binderInfo : BinderInfo','attribute']],
    letE:[['declName : Name','attribute'],['type : Expr','expression'],['value : Expr','expression'],['body : Expr','scoped expression'],['nondep : Bool','attribute']],
    lit:[['val : Literal','literal payload']],mdata:[['data : MData','metadata'],['expr : Expr','expression']],
    proj:[['typeName : Name','environment reference'],['idx : Nat','field index'],['struct : Expr','expression']]
  };
  const meanings={
    bvar:'A de Bruijn index is meaningful only relative to its enclosing binders. The scope connection is a reference, not a theorem dependency.',
    fvar:'A local hypothesis or parameter is tracked in an elaboration context. A closed kernel declaration must not retain unresolved free variables.',
    mvar:'A goal placeholder during elaboration. Unassigned metavariables cannot appear as unresolved holes in a completed kernel-checked proof.',
    sort:'Universes track levels of types (Prop = Sort 0; Type u = Sort (u + 1)). A universe node does not prove a proposition.',
    const:'A name refers into the environment. It may denote a theorem, a definition, a constructor or an axiom; the declaration kind must be inspected.',
    app:'Applying a term f to an argument a is a generic operation. It is logical modus ponens only when the types say so.',
    lam:'A λ binder creates a function; when its body is a proof, it may introduce a hypothesis. Scope links must remain explicit.',
    forallE:'A dependent Π type expresses function types and, in Prop, universal quantification or implication. Formation alone proves nothing.',
    letE:'A local value is named within a body; the body sees the new binder. The binding must not leak outside its scope.',
    lit:'A natural-number or string literal is atomic data, not a mathematical inference.',
    mdata:'Metadata wraps an expression; its mathematical meaning is that of the inner term. No independent proof edge is created.',
    proj:'Selects a field from a single-constructor inductive structure. The projection type and index must be justified by the environment.'
  };
  const form={
    bvar:'.bvar index',fvar:'.fvar fvarId',mvar:'.mvar mvarId',sort:'.sort u',
    const:'.const name levels',app:'.app fn arg',lam:'.lam name type body binderInfo',
    forallE:'.forallE name type body binderInfo',letE:'.letE name type value body nondep',
    lit:'.lit value',mdata:'.mdata data expr',proj:'.proj typeName idx struct'
  };
  const defaultLabel={
    bvar:'Variable in scope',fvar:'Local context',mvar:'Unsolved goal',sort:'Universe',
    const:'Named declaration',app:'Typed application',lam:'Function introduction',
    forallE:'Dependent type',letE:'Local definition',lit:'Literal value',
    mdata:'Auxiliary annotation',proj:'Field selection'
  };
  const NS='http://www.w3.org/2000/svg';
  const observedCounts={app:3527,const:2892,bvar:431,lam:110,lit:322,forallE:6};
  const $=id=>document.getElementById(id);
  const dom=(tag,cls,content)=>{
    const el=document.createElement(tag);if(cls)el.className=cls;
    if(content!==undefined)el.textContent=String(content);
    return el;
  };
  function svgNode(tag,attrs,text){
    const e=document.createElementNS(NS,tag);
    for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));
    if(text!==undefined)e.textContent=text;
    return e;
  }
  const selectors=$('pa-scale-choices');
  const cards=new Map();
  for(const [j,id] of order.entries()){
    const k=byKind.get(id);if(!k)continue;
    const b=dom('button','pa-scale-choice');b.type='button';b.dataset.kind=id;
    b.setAttribute('aria-pressed','false');
    const n=dom('span','pa-scale-choice-index',String(j+1).padStart(2,'0'));
    const name=dom('strong',null,id);
    const presence=dom('span','pa-scale-chip',k.observed?'MEASURED':'NOT OBSERVED');
    b.append(n,name,presence);selectors.appendChild(b);
    b.addEventListener('click',()=>select(id));
    cards.set(id,b);
  }
  const pi=[
    {x:85,label:'CORE',fill:'#ddece6'}, {x:231,label:'GRAPH',fill:'#e3e7ef'},
    {x:377,label:'MODULE',fill:'#e9e9db'}, {x:523,label:'IDEA',fill:'#f0e3d6'}
  ];
  function drawFlow(id){
    const svg=$('pa-scale-flow');svg.replaceChildren();
    for(let i=0;i<4;i++){
      let {x,label,fill}=pi[i];
      svg.appendChild(svgNode('rect',{x:x-60,y:13,width:119,height:60,rx:8,fill,stroke:'#8da8a3','stroke-width':.8}));
      svg.appendChild(svgNode('text',{x,y:36,'font-size':11,'font-weight':700,'text-anchor':'middle',fill:'#49716f'},label));
      svg.appendChild(svgNode('text',{x,y:56,'font-size':13,'font-weight':650,'text-anchor':'middle',fill:'#183f4c'},i===0?id:i===1?'child links':i===2?'typed boundary':'explanation'));
      if(i<3){
        svg.appendChild(svgNode('path',{d:'M'+(x+61)+' 43H'+(pi[i+1].x-64),stroke:'#588c88','stroke-width':1.6,fill:'none'}));
        svg.appendChild(svgNode('path',{d:'M'+(pi[i+1].x-64)+' 43l-6 -4v8z',fill:'#588c88'}));
      }
    }
  }
  function drawTermGraph(id){
    const svg=$('pa-scale-graph');svg.replaceChildren();
    const all=rawFields[id];
    const expr=all.filter(a=>a[1].includes('expression'));
    const other=all.filter(a=>!a[1].includes('expression'));
    svg.appendChild(svgNode('rect',{x:208,y:20,width:146,height:42,rx:9,fill:'#194f5a'}));
    svg.appendChild(svgNode('text',{x:281,y:46,'text-anchor':'middle','font-size':18,'font-weight':700,fill:'#fff'},id));
    const n=all.length;
    if(!n){
      svg.appendChild(svgNode('text',{x:281,y:185,'text-anchor':'middle','font-size':14,fill:'#435e69'},'Atomic constructor'));
      return;
    }
    for(let i=0;i<n;i++){
      const [name,kind]=all[i];
      const crowded=n>3;
      // Five-field let expressions need two rows; a single row would cause
      // port rectangles to overlap and create misleading visual connections.
      const row=crowded?(i<3?0:1):0;
      const inRow=crowded?(row===0?Math.min(n,3):n-3):n;
      const pos=crowded?(row===0?i:i-3):i;
      const x=crowded?(280+(pos-(inRow-1)/2)*(inRow===3?164:174)):(50+(i+.5)*(462/n));
      const y=crowded?(row===0?142:201):155;
      const boxWidth=crowded?130:Math.min(144,462/n+26);
      const solid=kind.includes('expression');const color=solid?'#237f7d':'#c19b5f';
      const sx=281,sy=62,cy=y-15;
      const kx=281+(x-281)*.45;
      svg.appendChild(svgNode('path',{d:'M'+sx+' '+sy+' C'+sx+' 92 '+kx+' 96 '+x+' '+cy,
        fill:'none',stroke:color,'stroke-width':solid?2:1.8,
        'stroke-dasharray':solid?'none':'5 4'}));
      svg.appendChild(svgNode('rect',{x:x-boxWidth/2,y:y-15,width:boxWidth,height:39,rx:7,
        fill:solid?'#e3f3ee':'#f6ede2',stroke:color,'stroke-width':1.2}));
      svg.appendChild(svgNode('text',{x,y:y+1,'text-anchor':'middle','font-size':crowded?11:13,fill:'#254956','font-weight':650},name.split(' : ')[0]));
      svg.appendChild(svgNode('text',{x,y:y+17,'text-anchor':'middle','font-size':9.5,fill:'#56717b'},solid?'child Expr':kind));
    }
    svg.appendChild(svgNode('text',{x:280,y:248,'text-anchor':'middle','font-size':11.5,fill:'#617d7b'},
      expr.length+' Expr '+(expr.length===1?'child':'children')+' · '+other.length+' reference / annotation '+(other.length===1?'field':'fields')));
  }
  function drawModule(id){
    const svg=$('pa-scale-module');svg.replaceChildren();
    const open=id==='mvar'||id==='fvar';
    svg.appendChild(svgNode('rect',{x:35,y:35,width:490,height:172,rx:11,fill:'#edf3ef',stroke:'#90aca2','stroke-width':1.3,'stroke-dasharray':'6 4'}));
    svg.appendChild(svgNode('text',{x:60,y:65,fill:'#496e70','font-size':13,'font-weight':700},'LOCAL TYPING CONTEXT Γ'));
    svg.appendChild(svgNode('rect',{x:164,y:100,width:240,height:51,rx:8,fill:'#1e5260'}));
    svg.appendChild(svgNode('text',{x:284,y:130,'text-anchor':'middle',fill:'#fff','font-size':16,'font-weight':700},id));
    svg.appendChild(svgNode('path',{d:'M86 124H163 M403 124H481',stroke:'#699b93','stroke-width':2,fill:'none'}));
    svg.appendChild(svgNode('text',{x:92,y:112,'text-anchor':'middle',fill:'#47686c','font-size':12},'inputs'));
    svg.appendChild(svgNode('text',{x:466,y:112,'text-anchor':'middle',fill:'#47686c','font-size':12},'result'));
    svg.appendChild(svgNode('text',{x:280,y:187,'text-anchor':'middle',fill:open?'#996c3d':'#467b73','font-size':12},
      open?'Open / temporary elaboration state':'Type and environment obligations still apply'));
    svg.appendChild(svgNode('text',{x:280,y:232,'text-anchor':'middle',fill:'#698286','font-size':12},
      'Collapsing must preserve the context, types and references'));
  }
  function drawMeaning(id){
    const svg=$('pa-scale-meaning-diagram');svg.replaceChildren();
    const title=defaultLabel[id]||id;
    svg.appendChild(svgNode('rect',{x:31,y:35,width:205,height:85,rx:8,fill:'#e3f0e9',stroke:'#6d9992'}));
    svg.appendChild(svgNode('text',{x:133,y:70,'text-anchor':'middle',fill:'#244f55','font-size':14,'font-weight':650},title));
    svg.appendChild(svgNode('text',{x:133,y:93,'text-anchor':'middle',fill:'#547376','font-size':12},'constructor-level role'));
    svg.appendChild(svgNode('path',{d:'M244 76H307',stroke:'#9e9980','stroke-width':2,'stroke-dasharray':'4 5'}));
    svg.appendChild(svgNode('path',{d:'M304 72l7 4-7 4',fill:'none',stroke:'#9e9980','stroke-width':1.5}));
    svg.appendChild(svgNode('rect',{x:320,y:35,width:213,height:85,rx:8,fill:'#f6ebdc',stroke:'#d1ac76'}));
    svg.appendChild(svgNode('text',{x:426,y:68,'text-anchor':'middle',fill:'#725c3c','font-size':14,'font-weight':650},'Mathematical meaning'));
    svg.appendChild(svgNode('text',{x:426,y:93,'text-anchor':'middle',fill:'#907653','font-size':12},'Needs full theorem context'));
    svg.appendChild(svgNode('text',{x:280,y:157,'text-anchor':'middle',fill:'#55727a','font-size':13},
      'A single expression tag never identifies a proof strategy'));
    svg.appendChild(svgNode('text',{x:280,y:180,'text-anchor':'middle',fill:'#55727a','font-size':13},
      'or establishes theorem validity by itself.'));
  }
  const allCounts={};let total=0;
  for(const e of G.kinds){const n=observedCounts[e.kind]||0;allCounts[e.kind]=n;total+=n;}
  const priorState={current:null};
  function select(id){
    const k=byKind.get(id);if(!k)return;
    priorState.current=id;
    for(const [tag,b] of cards){const is=tag===id;b.setAttribute('aria-pressed',is?'true':'false');}
    const count=allCounts[id]||0,was=count>0;
    $('pa-scale-kind').textContent=id+' · '+k.title;
    $('pa-scale-status').textContent=was?'OBSERVED IN CROSSING · '+count.toLocaleString('en-US')+' occurrences':
      'NOT PRESENT IN THIS BENCHMARK';
    $('pa-scale-status').classList.toggle('pa-scale-status-absent',!was);
    $('pa-scale-note').textContent=k.explanation;
    $('pa-scale-core').textContent='Lean.Expr.'+form[id]+'\n\nIllustrative source:\n'+k.example;
    $('pa-scale-graph-note').textContent='Solid links: expression children. Dashed links: attributes, context, universe levels or environmental references; these are not child expression edges.';
    $('pa-scale-module-note').textContent='A formal certificate is checked in a typing context. A collapsed module is valid only when its assumptions, scope, type and evidence are preserved.';
    $('pa-scale-meaning').textContent=meanings[id];
    $('pa-scale-scope').textContent='The diagram is a proposed visualization of '+id+
      '. It is not a kernel-checked derivation of the example.';
    drawFlow(id);drawTermGraph(id);drawModule(id);drawMeaning(id);
  }
  select('app');
})();