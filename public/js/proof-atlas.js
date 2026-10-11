/* Proof Atlas / public anonymized Lean graph explorer.
 * Structural data are a projection of a privately validated CoreGIR export.
 * Geometric coordinates are layout; 'idea' nodes are editorial annotations.
 */
(function () {
  'use strict';
  const D = window.PROOF_ATLAS_DATA;
  const host = document.getElementById('pa-explorer');
  if (!host) return;
  const canvas = document.getElementById('pa-canvas'), ctx = canvas.getContext('2d');
  if (!D || !ctx || !Array.isArray(D.parent) || D.parent.length !== 7288) {
    document.getElementById('pa-canvas-status').textContent = 'Measured graph data could not be loaded';
    return;
  }
  const N = D.parent.length, children = Array.from({length:N}, () => []), depth = new Uint8Array(N);
  D.parent.forEach((p,i) => { if (p >= 0) { children[p].push(i);depth[i]=depth[p]+1; } });
  const palette = ['#6e91c7','#4fc8b4','#bb9ce6','#e4b468','#e4b468','#d89c83'];
  const state = {mode:'whole',selected:D.roots[1],root:D.roots[1],scale:1,panX:0,panY:0,points:[],down:null,open:new Set([D.roots[1]]),extra:null};
  const titles = {
    whole:['Whole-proof geometry','All 7,288 Lean expression occurrences · radial syntax layout'],
    deps:['Dependency constellation','42 exact direct references · labels selectively anonymized'],
    recursive:['Recursive microscope','Expand expressions within a scoped subtree'],
    meaning:['Core mathematical argument','Human-authored explanation · NOT an extracted semantic proof']
  };
  const $=id=>document.getElementById(id), kind=i=>D.kinds[Number(D.kind[i])], fmt=n=>Number(n).toLocaleString('en-US');
  const leaves = new Uint16Array(N), first=new Float64Array(N), last=new Float64Array(N), angle=new Float64Array(N);
  let leafCounter=0;
  function locate(i) {
    if (!children[i].length) {first[i]=last[i]=leafCounter++;leaves[i]=1;return;}
    first[i]=leafCounter;
    for(const c of children[i]) locate(c);
    last[i]=leafCounter-1;
  }
  for(const root of D.roots) locate(root);
  for(let i=0;i<N;i++) angle[i]=2*Math.PI*((first[i]+last[i])*0.5+0.5)/leafCounter-Math.PI/2;

  let width=900,height=620,dpr=1;
  function resize() {
    const box=canvas.getBoundingClientRect();width=Math.max(300,box.width);height=Math.max(280,box.height);
    dpr=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  function paintBackground(){
    ctx.clearRect(0,0,width,height);
    const g=ctx.createRadialGradient(width*.46,height*.47,30,width*.46,height*.47,Math.max(width,height)*.85);
    g.addColorStop(0,'#163144');g.addColorStop(1,'#0b1a2b');
    ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
  }
  function plotPoint(x,y,r,col,opacity=1) {
    ctx.globalAlpha=opacity;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  function segment(x1,y1,x2,y2,color='#839cab',alpha=.3,lw=1) {
    ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1;
  }
  function label(x,y,text,size=12,color='#bfd2de',align='center',weight=500) {
    ctx.fillStyle=color;ctx.font=weight+' '+size+'px system-ui, sans-serif';ctx.textAlign=align;
    ctx.fillText(text,x,y,Math.max(20,width-30));
  }
  function sceneStart() {
    paintBackground();ctx.save();ctx.translate(width/2+state.panX,height/2+state.panY);
    ctx.scale(state.scale,state.scale);ctx.translate(-width/2,-height/2);state.points=[];
  }
  function sceneEnd(){ctx.restore();}
  function coord(i) {
    const rad=Math.min(width,height)*.44;
    const r=14+rad*Math.pow((depth[i]+1)/(D.stats.maxDepth+1),.76);
    return {x:width/2+r*Math.cos(angle[i]),y:height/2+r*Math.sin(angle[i])};
  }
  function register(x,y,id,type='expr',radius=7){state.points.push({x,y,id,type,radius});}
  function drawWhole(){
    sceneStart();
    ctx.lineWidth=.58;ctx.strokeStyle='rgba(146,183,192,.13)';ctx.beginPath();
    for(let i=0;i<N;i++){const p=D.parent[i];if(p<0)continue;const a=coord(i),b=coord(p);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
    ctx.stroke();
    for(let i=0;i<N;i++){const p=coord(i),k=Number(D.kind[i]);plotPoint(p.x,p.y,k===3||k===4?1.8:1.07,palette[k],k===0?.45:.81);register(p.x,p.y,i,'expr',4);}
    let i=state.selected;while(i>=0){const a=coord(i);plotPoint(a.x,a.y,i===state.selected?5:2.3,'#f3cb7b',1);i=D.parent[i];}
    sceneEnd();
    $('pa-stage-count').textContent='7,288 expression occurrences · 7,286 child edges';
  }
  function depName(d,i) {
    return d.name==='Kernel/library declaration'?'Declaration '+String(i+1).padStart(2,'0'):d.name;
  }
  function drawDeps() {
    sceneStart();
    const sorted=D.deps.map((d,i)=>({d,i})).sort((a,b)=>b.d.count-a.d.count);
    const center={x:width/2,y:height/2},R=Math.min(width,height)*.35;
    for(let j=0;j<sorted.length;j++){
      const {d,i}=sorted[j],a=2*Math.PI*j/sorted.length-Math.PI/2;
      const r=R*(.85+.12*Math.sin(3*a)),x=center.x+r*Math.cos(a),y=center.y+r*Math.sin(a);
      const bubble=4+Math.min(18,Math.sqrt(d.count)*.47);
      segment(center.x,center.y,x,y,d.local?'#e6bb72':'#66acc4',d.local?.52:.23,.65+Math.log1p(d.count)/4);
      plotPoint(x,y,bubble,d.local?'#e6bc79':'#50beb4',.88);register(x,y,i,'dep',bubble+6);
      if(j<8 || d.local) label(x,y+(bubble+15),depName(d,i).slice(0,26),10.5,'#d5e1e7');
    }
    plotPoint(center.x,center.y,32,'#2a5b65');
    label(center.x,center.y-4,'crossing',13,'#fff');label(center.x,center.y+12,'theorem',11,'#d5ece9');
    sceneEnd();$('pa-stage-count').textContent='42 distinct directly referenced declarations';
  }
  function visibleRecursive(){
    const result=[];
    function visit(i,level,parent) {
      if(result.length>=135)return;
      result.push({i,level,parent});
      if(state.open.has(i) && level<10)for(const c of children[i])visit(c,level+1,i);
    }
    visit(state.root,0,-1);return result;
  }
  function drawRecursive(){
    sceneStart();
    const v=visibleRecursive(),byLayer=new Map(),coordMap=new Map();
    for(const n of v){if(!byLayer.has(n.level))byLayer.set(n.level,[]);byLayer.get(n.level).push(n.i);}
    const layers=Math.max(...byLayer.keys())+1;
    for(const n of v){
      const ids=byLayer.get(n.level),index=ids.indexOf(n.i);
      coordMap.set(n.i,{x:65+(width-130)*n.level/Math.max(1,layers-1),y:72+(height-145)*(index+.5)/ids.length});
    }
    for(const n of v){if(!coordMap.has(n.parent))continue;const a=coordMap.get(n.i),b=coordMap.get(n.parent);segment(a.x,a.y,b.x,b.y,'#94bac3',.54,1.55);}
    for(const n of v){const p=coordMap.get(n.i),r=4+Math.min(9,Math.log2(1+D.size[n.i]));plotPoint(p.x,p.y,r,n.i===state.selected?'#f1ce8a':palette[Number(D.kind[n.i])]);register(p.x,p.y,n.i,'expr',r+6);}
    sceneEnd();$('pa-stage-count').textContent=v.length+' shown · '+fmt(D.size[state.root])+' in selected subtree';
  }
  const reasons=[
    {id:'phase',x:.14,y:.5,title:'Phase relation',symbol:'ψ',note:'The phase relation σu(p) − p = ψ (mod 2K) converts an intersection into a statement about two phase maps.'},
    {id:'exists',x:.47,y:.27,title:'Existence',symbol:'∃',note:'Continuity and endpoint coverage yield a crossing for every phase; the formal theorem references exists_branch.'},
    {id:'unique',x:.47,y:.73,title:'Uniqueness',symbol:'≤1',note:'Strict monotonicity and endpoint identification give at most one crossing parameter; the formal theorem references unique_branch.'},
    {id:'crossing',x:.83,y:.5,title:'One crossing',symbol:'∃!',note:'The two supporting lemmas are assembled into existence and uniqueness in CrossingData.crossing.'}
  ];
  function drawMeaning(){
    sceneStart();
    const pos=new Map(reasons.map(x=>[x.id,{x:width*x.x,y:height*x.y}]));
    for(const [a,b] of [['phase','exists'],['phase','unique'],['exists','crossing'],['unique','crossing']]){
      const A=pos.get(a),B=pos.get(b);segment(A.x,A.y,B.x,B.y,'#7ed0bf',.8,2.5);
    }
    for(const it of reasons){
      const p=pos.get(it.id),col=it.id==='crossing'?'#e5ba72':'#69cbbd';
      plotPoint(p.x,p.y,Math.min(25,width*.043),col,.95);
      label(p.x,p.y+5,it.symbol,15,'#0d2434', 'center',700);
      label(p.x,p.y+46,it.title,Math.min(13,width*.024),'#e9f0f5','center',600);
      register(p.x,p.y,it.id,'idea',30);
    }
    sceneEnd();$('pa-stage-count').textContent='Interpretation by the researchers · not inferred by the compiler';
  }
  function draw(){if(!canvas.width)return; if(state.mode==='whole')drawWhole();else if(state.mode==='deps')drawDeps();else if(state.mode==='recursive')drawRecursive();else drawMeaning();}
  function updateMode(mode){
    state.mode=mode;state.panX=state.panY=0;state.scale=1;
    const names=titles[mode];$('pa-view-title').textContent=names[0];$('pa-view-subtitle').textContent=names[1];
    document.querySelectorAll('.pa-modes button').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',on?'true':'false');});
    draw();
  }
  function field(name,value) {
    const dl=$('pa-inspector-fields'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=name;dd.textContent=String(value);dl.append(dt,dd);
  }
  function action(name,handler){
    const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',handler);$('pa-inspector-actions').appendChild(b);
  }
  function selectExpr(i){
    if(i<0||i>=N)return;
    state.selected=i;$('pa-inspector-fields').replaceChildren();$('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent='Expression #'+i;
    $('pa-inspector-summary').textContent='A single elaborated Lean expression occurrence; this public projection deliberately omits its original payload and source text.';
    field('Lean expression kind',kind(i));field('Depth in expression forest',depth[i]);field('Nodes in subtree',fmt(D.size[i]));field('Direct child expressions',children[i].length);
    if(D.parent[i]>=0)field('Parent occurrence','#'+D.parent[i]);
    const bound=D.binder.find(pair=>pair[0]===i);
    if(bound)field('Bound by expression','#'+bound[1]);
    action('Open this subtree',()=>{state.root=i;state.open.add(i);updateMode('recursive');});
    if(children[i].length)action('Show first child',()=>selectExpr(children[i][0]));
    if(D.parent[i]>=0)action('Go to parent',()=>selectExpr(D.parent[i]));
    $('pa-canvas-status').textContent='Selected expression #'+i;draw();
  }
  function selectDep(i){
    const d=D.deps[i];$('pa-inspector-fields').replaceChildren();$('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent=depName(d,i);
    $('pa-inspector-summary').textContent='A referenced declaration in the theorem type or proof value. Marker size encodes use frequency.';
    field('Direct uses',fmt(d.count));field('Reference kind',d.local?'SE(2) project-local':'Lean / mathlib');
    if(d.uses?.length)action('Inspect first occurrence',()=>{updateMode('whole');selectExpr(d.uses[0]);});
    $('pa-canvas-status').textContent='Selected declaration: '+depName(d,i);draw();
  }
  function selectIdea(id){
    const it=reasons.find(x=>x.id===id);if(!it)return;
    $('pa-inspector-fields').replaceChildren();$('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent=it.title;
    $('pa-inspector-summary').textContent=it.note;
    field('Interpretation status','Human-authored; references named formal declarations');
    if(id==='exists'||id==='unique'){
      const dep=D.deps.findIndex(x=>x.name==='CrossingData.'+(id==='exists'?'exists_branch':'unique_branch'));
      if(dep>=0) action('Locate exact reference occurrence',()=>{updateMode('deps');selectDep(dep);});
    }
    $('pa-canvas-status').textContent='Selected interpretive node: '+it.title;
    draw();
  }
  function hit(clientX,clientY){
    const rect=canvas.getBoundingClientRect();
    const x=(clientX-rect.left-width/2-state.panX)/state.scale+width/2;
    const y=(clientY-rect.top-height/2-state.panY)/state.scale+height/2;
    let found=null,best=Infinity;
    for(const p of state.points) {
      const d=(p.x-x)**2+(p.y-y)**2;
      if(d<best){best=d;found=p;}
    }
    return found&&best<Math.pow(Math.max(found.radius,7)/Math.min(state.scale,1.7),2)*2?found:null;
  }
  canvas.addEventListener('pointerdown',e=>{state.down={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{
    const d=state.down;if(!d)return;
    state.panX+=e.clientX-d.x;state.panY+=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;draw();
  });
  canvas.addEventListener('pointerup',e=>{
    const d=state.down;state.down=null;
    if(!d||Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>5)return;
    const p=hit(e.clientX,e.clientY);if(!p)return;
    if(p.type==='expr')selectExpr(p.id);else if(p.type==='dep')selectDep(p.id);else selectIdea(p.id);
  });
  canvas.addEventListener('wheel',e=>{e.preventDefault();state.scale=Math.max(.35,Math.min(12,state.scale*Math.exp(-e.deltaY*.001)));draw();},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&state.selected>=0){selectExpr(state.selected);e.preventDefault();}
    if(e.key==='ArrowUp'&&D.parent[state.selected]>=0){selectExpr(D.parent[state.selected]);e.preventDefault();}
    if(e.key==='ArrowDown'&&children[state.selected].length){selectExpr(children[state.selected][0]);e.preventDefault();}
  });
  document.querySelectorAll('.pa-modes button').forEach(b=>b.addEventListener('click',()=>updateMode(b.dataset.mode)));
  document.querySelectorAll('.pa-quicklinks button').forEach(b=>b.addEventListener('click',()=>{
    const t=b.dataset.target;
    if(t==='proof'){updateMode('whole');selectExpr(D.roots[1]);}
    if(t==='type'){updateMode('whole');selectExpr(D.roots[0]);}
    if(t==='exists'||t==='unique'){
      const idx=D.deps.findIndex(d=>d.name==='CrossingData.'+(t==='exists'?'exists_branch':'unique_branch'));
      if(idx>=0){updateMode('deps');selectDep(idx);}
    }
  }));
  $('pa-find').addEventListener('click',()=>{
    const v=Number($('pa-search').value);
    if(Number.isInteger(v)&&v>=0&&v<N){updateMode('whole');selectExpr(v);}
    else $('pa-canvas-status').textContent='Enter a node number between 0 and 7,287';
  });
  $('pa-search').addEventListener('keydown',e=>{if(e.key==='Enter')$('pa-find').click();});
  $('pa-plus').addEventListener('click',()=>{state.scale=Math.min(12,state.scale*1.4);draw();});
  $('pa-minus').addEventListener('click',()=>{state.scale=Math.max(.35,state.scale/1.4);draw();});
  $('pa-fit').addEventListener('click',()=>{state.scale=1;state.panX=state.panY=0;draw();});
  window.addEventListener('resize',resize);
  updateMode('whole');resize();selectExpr(D.roots[1]);
})();
