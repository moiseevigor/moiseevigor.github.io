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
  const reverseBinders = Array.from({length:N},()=>[]);
  const forwardBinders = new Int32Array(N).fill(-1);
  for(const [variable,binder] of D.binder) {
    reverseBinders[binder].push(variable);
    forwardBinders[variable]=binder;
  }
  const reducedMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {mode:'whole',selected:D.roots[1],root:D.roots[1],scale:1,panX:0,panY:0,
    points:[],down:null,open:new Set([D.roots[1]]),extra:null,
    hover:null,hoverPower:0,hoverTarget:0,hoverFrame:0,lastHoverTime:0,pointer:null};
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
  const appElement = host.querySelector('.pa-app');
  const canvasFrame = host.querySelector('.pa-canvas-frame');
  // Hovered-node details float beside the pointer and can also be read in the
  // inspector. They never capture pointer events or obscure graph selection.
  const tooltip=document.createElement('div');
  tooltip.className='pa-node-tooltip';tooltip.hidden=true;
  tooltip.setAttribute('aria-hidden','true');canvasFrame.appendChild(tooltip);
  const hoverDetails=document.createElement('section');
  hoverDetails.className='pa-hover-details';hoverDetails.hidden=true;
  hoverDetails.setAttribute('aria-label','Directly connected nodes');
  const inspectorNote=host.querySelector('.pa-inspector-note');
  inspectorNote.parentNode.insertBefore(hoverDetails,inspectorNote);
  function resize() {
    if(state.hover&&state.hoverTarget){state.hover=null;state.hoverPower=state.hoverTarget=0;tooltip.hidden=true;hoverDetails.hidden=true;}
    // Bitmap size must follow actual CSS dimensions on every layout change.
    // Using independent width/height scales distorts a circular proof graph;
    // all drawing transforms below use the same scalar zoom in both axes.
    const box=canvasFrame.getBoundingClientRect();
    width=Math.max(1,box.width);height=Math.max(1,box.height);
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
  function baseCoord(i) {
    const rad=Math.min(width,height)*.44;
    const r=14+rad*Math.pow((depth[i]+1)/(D.stats.maxDepth+1),.76);
    return {x:width/2+r*Math.cos(angle[i]),y:height/2+r*Math.sin(angle[i])};
  }
  function coord(i) {
    const p=baseCoord(i),h=state.hover;
    if(state.mode!=='whole'||!h||h.type!=='expr'||state.hoverPower<.001||i===h.id||!h.adj.has(i)) return p;
    // A local elastic dilation, not a force simulation: every exact edge
    // retains its endpoints, while its visible metric embedding breathes.
    const origin=h.center,dx=p.x-origin.x,dy=p.y-origin.y;
    const d=Math.hypot(dx,dy);
    const push=(7+Math.min(10,Math.log2(1+D.size[i])*1.7))*state.hoverPower;
    if(d<.1) {p.x+=Math.cos(angle[i])*push;p.y+=Math.sin(angle[i])*push;}
    else {p.x+=dx/d*push;p.y+=dy/d*push;}
    return p;
  }
  function oneHop(i) {
    // Deduplicate vertices even if a binder link and child edge meet the same
    // occurrence. The relationship labels remain part of the inspector.
    const adjacent=new Map();
    function add(n,relation){if(n<0)return;if(!adjacent.has(n))adjacent.set(n,[]);
      const labels=adjacent.get(n);if(!labels.includes(relation))labels.push(relation);}
    add(D.parent[i],'parent');
    for(const child of children[i])add(child,'child');
    add(forwardBinders[i],'binder');
    for(const variable of reverseBinders[i])add(variable,'bound variable');
    return adjacent;
  }
  function register(x,y,id,type='expr',radius=7){state.points.push({x,y,id,type,radius});}
  function drawWhole(){
    sceneStart();
    ctx.lineWidth=.58;ctx.strokeStyle='rgba(146,183,192,.13)';ctx.beginPath();
    for(let i=0;i<N;i++){const p=D.parent[i];if(p<0)continue;const a=coord(i),b=coord(p);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);}
    ctx.stroke();
    for(let i=0;i<N;i++){const p=coord(i),k=Number(D.kind[i]);plotPoint(p.x,p.y,k===3||k===4?1.8:1.07,palette[k],k===0?.45:.81);register(p.x,p.y,i,'expr',4);}
    let i=state.selected;while(i>=0){const a=coord(i);plotPoint(a.x,a.y,i===state.selected?5:2.3,'#f3cb7b',1);i=D.parent[i];}
    const h=state.hover;
    if(h&&h.type==='expr'&&state.hoverPower>.005){
      const center=coord(h.id),energy=state.hoverPower;
      // Neighbours at graph distance exactly one, including binder links.
      // A soft halo signals proximity without flashing the entire network.
      ctx.globalAlpha=.12*energy;ctx.fillStyle='#9ce6d4';
      ctx.beginPath();ctx.arc(center.x,center.y,21+energy*8,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      for(const [neighbor,relations] of h.adj){
        const p=coord(neighbor),binderEdge=relations.includes('binder')||relations.includes('bound variable');
        segment(center.x,center.y,p.x,p.y,binderEdge?'#ca9fec':'#a4f3da',.88*energy,binderEdge?2.3:2);
        plotPoint(p.x,p.y,2.5+3.1*energy,binderEdge?'#d5afea':'#a3ebd6',.6+.4*energy);
      }
      plotPoint(center.x,center.y,5+5*energy,'#ffe2a3',.8+.2*energy);
      ctx.strokeStyle='#fff2c6';ctx.lineWidth=1.35;ctx.globalAlpha=.8*energy;
      ctx.beginPath();ctx.arc(center.x,center.y,9+5*energy,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
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
      const isHover=state.hover && state.hover.type==='dep'&&state.hover.id===i;
      const lift=isHover?state.hoverPower:0;
      plotPoint(x,y,bubble+lift*6,d.local?'#e6bc79':'#50beb4',.88);
      if(lift>.02){segment(center.x,center.y,x,y,'#bcf4d8',lift,3);
        plotPoint(x,y,bubble+lift*6,'#f6dba0',lift*.65);}
      register(x,y,i,'dep',bubble+6);
      if(j<8 || d.local) label(x,y+(bubble+15),depName(d,i).slice(0,26),10.5,'#d5e1e7');
    }
    plotPoint(center.x,center.y,32,'#2a5b65');
    label(center.x,center.y-4,'crossing',13,'#fff');label(center.x,center.y+12,'theorem',11,'#d5ece9');
    register(center.x,center.y,'theorem','theorem',35);
    if(state.hover&&state.hover.type==='theorem'&&state.hoverPower>.01){
      plotPoint(center.x,center.y,34+7*state.hoverPower,'#a4e5d8',.3*state.hoverPower);
      label(center.x,center.y+4,'42 links',12,'#fff');
    }
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
    if(state.hover&&state.hover.type==='expr'&&state.hoverPower>.01){
      const h=state.hover,center=coordMap.get(h.id);
      if(center) {
        for(const [other,rel] of h.adj) {
          if(!coordMap.has(other))continue;
          const q=coordMap.get(other),isBinder=rel.includes('binder')||rel.includes('bound variable');
          segment(center.x,center.y,q.x,q.y,isBinder?'#d8afe8':'#b9f1d9',state.hoverPower,2.5);
          plotPoint(q.x,q.y,7+3*state.hoverPower,'#a8efdb',state.hoverPower);
        }
        plotPoint(center.x,center.y,9+4*state.hoverPower,'#ffe2a3');
      }
    }
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
      const raised=state.hover&&state.hover.type==='idea'&&state.hover.id===it.id;
      plotPoint(p.x,p.y,Math.min(25,width*.043)+(raised?6*state.hoverPower:0),raised?'#f9d89c':col,.95);
      label(p.x,p.y+5,it.symbol,15,'#0d2434', 'center',700);
      label(p.x,p.y+46,it.title,Math.min(13,width*.024),'#e9f0f5','center',600);
      register(p.x,p.y,it.id,'idea',30);
    }
    sceneEnd();$('pa-stage-count').textContent='Interpretation by the researchers · not inferred by the compiler';
  }
  function draw(){if(!canvas.width)return; if(state.mode==='whole')drawWhole();else if(state.mode==='deps')drawDeps();else if(state.mode==='recursive')drawRecursive();else drawMeaning();}
  function updateMode(mode){
    state.hover=null;state.hoverPower=state.hoverTarget=0;
    tooltip.hidden=true;fillHoverDetails(null);
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

  // Every edge listed here is one hop in the currently shown explanatory
  // diagram. These semantic edges are editorial and are never conflated with
  // exact Lean expression or binder links.
  const ideaEdges=[['phase','exists'],['phase','unique'],['exists','crossing'],['unique','crossing']];
  function infoFor(p) {
    if(p.type==='expr') {
      const adj=oneHop(p.id);
      return {key:'expr:'+p.id,id:p.id,type:'expr',title:'Expression #'+p.id,
        subtitle:'Lean '+kind(p.id)+' · depth '+depth[p.id]+' · subtree '+fmt(D.size[p.id]),
        adj,items:Array.from(adj,([id,roles])=>({label:'#'+id+' · '+kind(id),detail:roles.join(' / ')})),
        count:adj.size};
    }
    if(p.type==='dep'){
      const d=D.deps[p.id];
      return {key:'dep:'+p.id,id:p.id,type:'dep',title:depName(d,p.id),
        subtitle:fmt(d.count)+' use'+(d.count===1?'':'s')+' in the theorem',
        adj:new Map([['theorem',['uses']]]),
        items:[{label:'CrossingData.crossing',detail:'1 hop: theorem'}],count:1};
    }
    if(p.type==='theorem'){
      return {key:'theorem',id:'theorem',type:'theorem',title:'CrossingData.crossing',
        subtitle:'42 direct declaration neighbours (use counts are shown on hover)',
        adj:new Map(D.deps.map((d,i)=>[i,['uses']])),
        items:D.deps.map((d,i)=>({label:depName(d,i),detail:fmt(d.count)+' reference'+(d.count===1?'':'s')})),count:D.deps.length};
    }
    const item=reasons.find(t=>t.id===p.id);
    const ids=ideaEdges.filter(([a,b])=>a===p.id||b===p.id).map(([a,b])=>a===p.id?b:a);
    return {key:'idea:'+p.id,id:p.id,type:'idea',title:item.title,
      subtitle:'Interpretive proof sketch, not automatically certified',
      adj:new Map(ids.map(i=>[i,['connected idea']])),
      items:ids.map(i=>({label:reasons.find(t=>t.id===i).title,detail:'direct diagram connection'})),count:ids.length};
  }
  function fillHoverDetails(h) {
    hoverDetails.replaceChildren();
    if(!h){hoverDetails.hidden=true;return;}
    hoverDetails.hidden=false;
    const head=document.createElement('h4');head.textContent='ONE-HOP NEIGHBOURHOOD';
    hoverDetails.appendChild(head);
    const blurb=document.createElement('p');
    blurb.textContent=h.title+' · '+h.count+' directly connected node'+(h.count===1?'':'s');
    hoverDetails.appendChild(blurb);
    const list=document.createElement('ol');list.className='pa-hover-neighbors';
    for(const row of h.items) {
      const li=document.createElement('li');
      const name=document.createElement('strong');name.textContent=row.label;
      const rel=document.createElement('span');rel.textContent=row.detail;
      li.append(name,rel);list.appendChild(li);
    }
    hoverDetails.appendChild(list);
  }
  function showTooltip(h) {
    if(!h||!state.pointer){tooltip.hidden=true;return;}
    tooltip.hidden=false;
    tooltip.replaceChildren();
    const title=document.createElement('strong');title.textContent=h.title;
    const meta=document.createElement('span');meta.textContent=h.subtitle;
    const tally=document.createElement('small');tally.textContent=h.count+' connected at distance 1';
    tooltip.append(title,meta,tally);
    // Position relative to the canvas, with no overflow on narrow screens.
    const rect=canvas.getBoundingClientRect();
    const localX=state.pointer.clientX-rect.left,localY=state.pointer.clientY-rect.top;
    const cardWidth=Math.min(250,Math.max(150,width-30));
    const left=Math.max(10,Math.min(width-cardWidth-8,localX+18));
    const top=Math.max(12,Math.min(height-108,localY+18));
    tooltip.style.left=left+'px';tooltip.style.top=top+'px';
  }
  function setHover(point) {
    const next=point?infoFor(point):null;
    // Cache the current geometric anchor for local elastic displacement.
    if(next&&next.type==='expr')next.center=baseCoord(next.id);
    const old=state.hover;
    if(old&&next&&old.key===next.key){
      state.hoverTarget=1;
      fillHoverDetails(old);showTooltip(old);
      if(reducedMotion){state.hoverPower=1;draw();}
      else wakeHover();
      return;
    }
    state.hover=next;state.hoverTarget=next?1:0;
    if(next){fillHoverDetails(next);showTooltip(next);}
    else {tooltip.hidden=true;fillHoverDetails(null);}
    if(reducedMotion){state.hoverPower=state.hoverTarget;draw();}
    else wakeHover();
    $('pa-canvas-status').textContent=next?'Hover: '+next.title+' · '+next.count+' one-hop neighbours':
      'Select a node to inspect';
  }
  function wakeHover(){
    if(state.hoverFrame)return;
    state.lastHoverTime=0;
    state.hoverFrame=requestAnimationFrame(tickHover);
  }
  function tickHover(now){
    state.hoverFrame=0;
    const dt=state.lastHoverTime?Math.min(50,now-state.lastHoverTime):16;
    state.lastHoverTime=now;
    state.hoverPower+=(state.hoverTarget-state.hoverPower)*(1-Math.exp(-dt/95));
    if(Math.abs(state.hoverTarget-state.hoverPower)<.016)state.hoverPower=state.hoverTarget;
    draw();
    if(state.hoverPower!==state.hoverTarget)state.hoverFrame=requestAnimationFrame(tickHover);
    else if(state.hoverTarget===0)state.hover=null;
  }
  function clearHover(){
    if(!state.hover&&!state.hoverPower)return;
    // Keep the last neighbourhood while it relaxes, then remove it.
    if(state.hover) {
      state.hoverTarget=0;tooltip.hidden=true;hoverDetails.hidden=true;
      if(reducedMotion){state.hoverPower=0;state.hover=null;draw();}
      else wakeHover();
    }
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
  canvas.addEventListener('pointerdown',e=>{
    clearHover();
    state.down={x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    const d=state.down;
    if(d){state.panX+=e.clientX-d.x;state.panY+=e.clientY-d.y;d.x=e.clientX;d.y=e.clientY;draw();return;}
    if(e.pointerType==='touch')return;
    state.pointer={clientX:e.clientX,clientY:e.clientY};
    // On dense branches hit detection is intentionally based on the *drawn*
    // geometry (including elastic displacement) so the hover follows dots.
    const p=hit(e.clientX,e.clientY);
    if(p)setHover(p);
    else clearHover();
  });
  canvas.addEventListener('pointerleave',()=>{state.pointer=null;clearHover();});
  canvas.addEventListener('pointerup',e=>{
    const d=state.down;state.down=null;
    if(!d||Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>5)return;
    const p=hit(e.clientX,e.clientY);if(!p)return;
    if(p.type==='expr')selectExpr(p.id);else if(p.type==='dep')selectDep(p.id);
    else if(p.type==='theorem'){updateMode('whole');selectExpr(D.roots[1]);}
    else selectIdea(p.id);
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
  const focusButton = $('pa-focus');
  const fullscreenButton = $('pa-fullscreen');
  function refitSoon() {
    requestAnimationFrame(()=>{resize();requestAnimationFrame(resize);});
  }
  function setFocus(on) {
    appElement.classList.toggle('pa-focus',on);
    focusButton.setAttribute('aria-pressed',on?'true':'false');
    focusButton.textContent=on?'Show panels':'Focus graph';
    refitSoon();
  }
  focusButton.addEventListener('click',()=>setFocus(!appElement.classList.contains('pa-focus')));
  function syncFullscreen() {
    const active=document.fullscreenElement===appElement;
    fullscreenButton.textContent=active?'⛶ Exit fullscreen':'⛶ Fullscreen';
    fullscreenButton.setAttribute('aria-pressed',active?'true':'false');
    refitSoon();
  }
  fullscreenButton.addEventListener('click',async()=>{
    if(document.fullscreenElement===appElement) {
      try { await document.exitFullscreen(); } catch(e) { $('pa-canvas-status').textContent='Unable to exit fullscreen'; }
    } else if (appElement.requestFullscreen) {
      try { await appElement.requestFullscreen(); }
      catch(e) { window.location.href='/projects/proof-atlas/app/'; }
    } else {
      window.location.href='/projects/proof-atlas/app/';
    }
  });
  document.addEventListener('fullscreenchange',syncFullscreen);
  if (window.ResizeObserver) {
    const canvasObserver = new ResizeObserver(()=>resize());
    canvasObserver.observe(canvasFrame);
  }
  window.addEventListener('resize',refitSoon);
  updateMode('whole');resize();selectExpr(D.roots[1]);
})();
