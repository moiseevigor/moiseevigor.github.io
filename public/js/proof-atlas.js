/* Proof Atlas / public anonymized Lean graph explorer.
 * Structural data are a projection of a privately validated CoreGIR export.
 * Geometric coordinates are layout; 'idea' nodes are editorial annotations.
 */
(function () {
  'use strict';
  const D = window.PROOF_ATLAS_DATA;
  const S = window.PROOF_ATLAS_DECLARATIONS;
  const host = document.getElementById('pa-explorer');
  if (!host) return;
  const canvas = document.getElementById('pa-canvas'), ctx = canvas.getContext('2d');
  const drawing=window.ProofAtlasDrawingTheme?.read(canvas)||{paper:'#ffffff',surface:'#f6f6f3',ink:'#1c1d1f',muted:'#3f4349',border:'#e6e5e1',accent:'#2d5b8c',selected:'#e9eff6',warm:'#b4652e',sans:'system-ui'};
  if (!D || !ctx || !Array.isArray(D.parent) || D.parent.length !== 7288) {
    document.getElementById('pa-canvas-status').textContent = 'Measured graph data could not be loaded';
    return;
  }
  const N = D.parent.length, children = Array.from({length:N}, () => []), depth = new Uint8Array(N);
  D.parent.forEach((p,i) => { if (p >= 0) { children[p].push(i);depth[i]=depth[p]+1; } });
  const subtreeValid=D.parent.every((p,i)=>p<0||p<i) &&
    D.roots.reduce((n,r)=>n+D.size[r],0)===N &&
    children.every((cs,i)=>{
      let pos=i+1;for(const ch of cs){if(ch!==pos)return false;pos+=D.size[ch];}
      return pos===i+D.size[i];
    });
  const constantAt=new Map();
  for(const dep of D.deps)for(const i of dep.uses)constantAt.set(i,dep);
  const terminalCounts=new Uint32Array(N);
  for(let i=N-1;i>=0;i--){
    terminalCounts[i]=children[i].length?
      children[i].reduce((n,j)=>n+terminalCounts[j],0):1;
  }
  const TERMINAL_PREVIEW_LIMIT=24;
  const palette = [drawing.accent,drawing.accent,drawing.warm,drawing.warm,drawing.warm,drawing.warm];
  const namedNodes = S && Array.isArray(S.nodes) ? S.nodes : [];
  const namedById = new Map(namedNodes.map(n=>[n.short,n]));
  const namedEdges = S && Array.isArray(S.edges) ? S.edges : [];
  const namedIncoming = new Map(namedNodes.map(n=>[n.short,[]]));
  const namedOutgoing = new Map(namedNodes.map(n=>[n.short,[]]));
  for(const e of namedEdges){
    if(namedIncoming.has(e.to)&&namedOutgoing.has(e.from)){
      namedIncoming.get(e.to).push(e.from);namedOutgoing.get(e.from).push(e.to);
    }
  }
  const groupColors={
    hypotheses:drawing.muted,definitions:drawing.accent,endpoints:drawing.muted,monotonicity:drawing.warm,
    range:drawing.muted,gluing:drawing.warm,existence:drawing.accent,uniqueness:drawing.warm,conclusion:drawing.warm
  };
  const namedDepth=new Map(),namedCoordinates=new Map();
  function declarationDepth(id){
    if(namedDepth.has(id))return namedDepth.get(id);
    let rank=0;
    for(const p of namedIncoming.get(id)||[])rank=Math.max(rank,1+declarationDepth(p));
    namedDepth.set(id,rank);return rank;
  }
  for(const n of namedNodes) declarationDepth(n.short);
  // A named theorem map is the default because it communicates mathematics.
  // The 7,288-expression diagram remains the exact, low-level microscope.
  const reverseBinders = Array.from({length:N},()=>[]);
  const forwardBinders = new Int32Array(N).fill(-1);
  for(const [variable,binder] of D.binder) {
    reverseBinders[binder].push(variable);
    forwardBinders[variable]=binder;
  }
  const reducedMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const state = {mode:'map',selected:D.roots[1],namedSelected:'crossing',root:D.roots[1],scale:1,panX:0,panY:0,
    points:[],down:null,open:new Set([D.roots[1]]),extra:null,
    selectionScope:'subtree',
    hover:null,hoverPower:0,hoverTarget:0,hoverFrame:0,lastHoverTime:0,pointer:null};
  const titles = {
    map:['Named proof map','26 Lean declarations · 81 source-level references · Crossing.lean'],
    whole:['Kernel syntax microscope','CrossingData.crossing · focused example · 7,288 occurrences'],
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
  // The transient hover dock and persistent inspector scroll separately.
  const inspector=host.querySelector('.pa-inspector');
  const inspectorSelected=document.createElement('div');
  inspectorSelected.className='pa-inspector-selection';
  while(inspector.firstChild)inspectorSelected.appendChild(inspector.firstChild);
  inspector.appendChild(inspectorSelected);
  const hoverDetails=document.createElement('section');
  hoverDetails.className='pa-hover-details';
  hoverDetails.setAttribute('aria-label','Directly connected nodes');
  inspector.insertBefore(hoverDetails,inspectorSelected);
  function resetSelectionScroll(){inspectorSelected.scrollTop=0;}
  function navigateToExpression(i){
    if(state.mode!=='whole')updateMode('whole');
    selectExpr(i);
  }
  function resize() {
    if(state.hover&&state.hoverTarget){state.hover=null;state.hoverPower=state.hoverTarget=0;tooltip.hidden=true;fillHoverDetails(null);}
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
    ctx.fillStyle=drawing.paper;ctx.fillRect(0,0,width,height);
  }
  // Sizes and stroke widths are expressed in screen pixels, not in zoomed
  // world units. Hover never makes a node grow with the zoom level.
  const screenUnit=()=>1/Math.max(.8,state.scale);
  function plotPoint(x,y,r,col,opacity=1) {
    ctx.globalAlpha=opacity;ctx.fillStyle=col;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  function segment(x1,y1,x2,y2,color=drawing.border,alpha=.3,lw=1) {
    ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();ctx.globalAlpha=1;
  }
  function label(x,y,text,size=12,color=drawing.ink,align='center',weight=500) {
    ctx.fillStyle=color;ctx.font=weight+' '+size+'px '+drawing.sans;ctx.textAlign=align;
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
    // Subtle elastic movement: at most 2 SCREEN pixels, independent of zoom.
    // This is a transient viewing effect, never a change to the proof graph.
    const origin=h.center,dx=p.x-origin.x,dy=p.y-origin.y;
    const d=Math.hypot(dx,dy);
    const push=2*screenUnit()*state.hoverPower;
    if(d<.1) {p.x+=Math.cos(angle[i])*push;p.y+=Math.sin(angle[i])*push;}
    else {p.x+=dx/d*push;p.y+=dy/d*push;}
    return p;
  }
  // One canonical radial Bézier path is used by both base drawing and hover.
  // Highlighting therefore retraces an EXISTING parent–child edge: it never
  // fabricates a straight shortcut between graph nodes.
  function radialEdge(parent,child) {
    const cx=width/2,cy=height/2,dx=parent.x-cx,dy=parent.y-cy;
    const ex=child.x-cx,ey=child.y-cy;
    const rp=Math.hypot(dx,dy),rc=Math.hypot(ex,ey);
    const mid=(rp+rc)/2;
    const pa=Math.atan2(dy,dx),ca=Math.atan2(ey,ex);
    ctx.moveTo(parent.x,parent.y);
    ctx.bezierCurveTo(cx+mid*Math.cos(pa),cy+mid*Math.sin(pa),
      cx+mid*Math.cos(ca),cy+mid*Math.sin(ca),child.x,child.y);
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
  function register(x,y,id,type='expr',radius=7,w=0,h=0){state.points.push({x,y,id,type,radius,w,h});}
  function drawSelectedSyntaxBranch(){
    if(state.mode!=='whole')return;
    const selected=state.selected;
    if(selected<0||selected>=N)return;
    const su=screenUnit(),isTerminal=children[selected].length===0;
    const showLineage=isTerminal||state.selectionScope==='lineage'||!subtreeValid;
    const count=D.size[selected];
    ctx.save();
    ctx.strokeStyle=showLineage?drawing.warm:drawing.accent;
    ctx.globalAlpha=showLineage?.67:(count<=350?.42:.15);
    ctx.lineWidth=(showLineage?1.25:.9)*su;
    ctx.beginPath();
    if(showLineage){
      let i=selected;while(D.parent[i]>=0){
        const par=D.parent[i];radialEdge(coord(par),coord(i));i=par;
      }
    }else for(let i=selected+1;i<selected+count;i++){
      radialEdge(coord(D.parent[i]),coord(i));
    }
    ctx.stroke();ctx.globalAlpha=1;
    if(showLineage){
      let i=selected;while(i>=0){
        const q=coord(i);plotPoint(q.x,q.y,(i===selected?3.45:2)*su,drawing.warm,.88);
        i=D.parent[i];
      }
    }else{
      for(let i=selected;i<selected+count;i++){
        if(children[i].length)continue;
        const q=coord(i);
        plotPoint(q.x,q.y,(count<=100?2.7:1.85)*su,drawing.accent,.84);
      }
    }
    const q=coord(selected);plotPoint(q.x,q.y,3.8*su,drawing.warm);
    ctx.restore();
  }
  function drawWhole(){
    sceneStart();
    // The base network and highlighted network follow the exact same path.
    // Faint curves avoid visual spokes and retain the radial proof structure.
    ctx.lineWidth=.62*screenUnit();
    ctx.strokeStyle=drawing.border;
    ctx.beginPath();
    for(let i=0;i<N;i++){
      const p=D.parent[i];if(p<0)continue;
      radialEdge(coord(p),coord(i));
    }
    ctx.stroke();
    const su=screenUnit();
    for(let i=0;i<N;i++){
      const p=coord(i),k=Number(D.kind[i]);
      plotPoint(p.x,p.y,(k===3||k===4?1.9:1.22)*su,palette[k],k===0?.48:.84);
      register(p.x,p.y,i,'expr',5);
    }
    drawSelectedSyntaxBranch();
    const h=state.hover;
    if(h&&h.type==='expr'&&state.hoverPower>.005){
      const e=state.hoverPower,origin=coord(h.id);
      // For high-degree binders use lower contrast, not ever-wider strokes.
      const alpha=Math.min(.51,Math.max(.21,.64/Math.sqrt(Math.max(1,h.adj.size)/5)))*e;
      ctx.globalAlpha=alpha;
      ctx.lineWidth=1.18*su;
      ctx.strokeStyle=drawing.accent;
      ctx.beginPath();
      for(const [neighbour,relations] of h.adj){
        // Scope/binder references are real semantic links but are NOT drawn
        // in the base structural tree. Show endpoints, not fictitious spokes.
        if(D.parent[neighbour]===h.id)radialEdge(coord(h.id),coord(neighbour));
        else if(D.parent[h.id]===neighbour)radialEdge(coord(neighbour),coord(h.id));
      }
      ctx.stroke();
      ctx.globalAlpha=1;
      // Slightly larger dots + thin rings identify the actual degree-1 set.
      for(const [neighbour,relations] of h.adj){
        const q=coord(neighbour);
        const binder=relations.includes('binder')||relations.includes('bound variable');
        const color=binder?drawing.accent:drawing.muted;
        plotPoint(q.x,q.y,2.35*su,color,.55+.4*e);
        if(binder){
          ctx.globalAlpha=.53*e;ctx.strokeStyle=color;ctx.lineWidth=.8*su;
          ctx.beginPath();ctx.arc(q.x,q.y,3.75*su,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
        }
      }
      plotPoint(origin.x,origin.y,3.55*su,drawing.warm,.9);
      ctx.globalAlpha=.68*e;ctx.strokeStyle=drawing.warm;ctx.lineWidth=.95*su;
      ctx.beginPath();ctx.arc(origin.x,origin.y,5.65*su,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    }
    sceneEnd();
    $('pa-stage-count').textContent='7,288 expression occurrences · 7,286 child edges';
  }
  function drawMap(){
    sceneStart();
    if(!namedNodes.length){
      label(width/2,height/2,'Named declaration data unavailable',17,drawing.warm);sceneEnd();return;
    }
    const marginX=Math.max(70,Math.min(120,width*.085));
    const marginTop=80,marginBottom=48;
    const maxLayer=Math.max(...Array.from(namedDepth.values()),1);
    const grouping=new Map();
    for(const n of namedNodes){
      const layer=namedDepth.get(n.short)||0;
      if(!grouping.has(layer))grouping.set(layer,[]);
      grouping.get(layer).push(n);
    }
    const xScale=(width-2*marginX)/maxLayer;
    const cardWidth=Math.max(82,Math.min(165,xScale*.76));
    const cardHeight=Math.max(27,Math.min(37,(height-marginTop-marginBottom)/9*.66));
    namedCoordinates.clear();
    for(const [layer,nodes] of grouping) {
      const x=marginX+layer*xScale;
      const step=(height-marginTop-marginBottom)/Math.max(1,nodes.length);
      for(let j=0;j<nodes.length;j++){
        const y=marginTop+step*(j+.5);
        namedCoordinates.set(nodes[j].short,{x,y,w:cardWidth,h:cardHeight});
      }
    }
    // Layer headings are conceptual orientation, not a claim that the
    // dependency layers correspond to unique mathematical mechanisms.
    const captions=['Inputs','Endpoint lemmas','Ranges & gluing','Combining cases','Uniqueness','Conclusion'];
    for(let layer=0;layer<=maxLayer;layer++){
      const x=marginX+layer*xScale;
      label(x,33,captions[layer]||('Level '+layer),Math.min(12,Math.max(9,xScale*.085)),drawing.muted);
    }
    const active=state.hover?.type==='decl' ? state.hover.id : state.namedSelected;
    const highlighted=new Set([active,...(namedIncoming.get(active)||[]),...(namedOutgoing.get(active)||[])]);
    // Draw all source-level references quietly, then bring the local one-hop
    // dependencies forward. No edges are invented by the graph layout.
    ctx.beginPath();ctx.strokeStyle=drawing.border;ctx.lineWidth=.85*screenUnit();
    for(const e of namedEdges){
      const a=namedCoordinates.get(e.from),b=namedCoordinates.get(e.to);
      if(!a||!b)continue;
      const bend=Math.max(18,(b.x-a.x)*.38);
      ctx.moveTo(a.x+a.w/2,a.y);
      ctx.bezierCurveTo(a.x+a.w/2+bend,a.y,b.x-b.w/2-bend,b.y,b.x-b.w/2,b.y);
    }
    ctx.stroke();
    for(const e of namedEdges){
      if(e.from!==active&&e.to!==active)continue;
      const a=namedCoordinates.get(e.from),b=namedCoordinates.get(e.to);
      if(!a||!b)continue;
      const bend=Math.max(18,(b.x-a.x)*.38);
      ctx.beginPath();ctx.moveTo(a.x+a.w/2,a.y);
      ctx.bezierCurveTo(a.x+a.w/2+bend,a.y,b.x-b.w/2-bend,b.y,b.x-b.w/2,b.y);
      ctx.strokeStyle=e.to===active?drawing.warm:drawing.accent;
      ctx.globalAlpha=.92;ctx.lineWidth=1.7*screenUnit();ctx.stroke();ctx.globalAlpha=1;
    }
    for(const n of namedNodes){
      const p=namedCoordinates.get(n.short),sel=n.short===active;
      const dim=!!active&&!highlighted.has(n.short);
      const major=['crossing','unique_branch','exists_branch','eq_of_branch_eq'].includes(n.short);
      ctx.fillStyle=sel?drawing.selected:drawing.surface;
      ctx.globalAlpha=dim?.51:1;
      ctx.fillRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h);
      ctx.strokeStyle=sel?drawing.warm:major?drawing.accent:drawing.border;
      ctx.lineWidth=(sel?2.1:major?1.5:.8)*screenUnit();
      ctx.strokeRect(p.x-p.w/2,p.y-p.h/2,p.w,p.h);
      ctx.fillStyle=groupColors[n.group]||drawing.muted;
      ctx.fillRect(p.x-p.w/2,p.y-p.h/2,3.1*screenUnit(),p.h);
      ctx.globalAlpha=dim?.65:1;
      // Centered names—not numerical expression identifiers.
      const limit=Math.max(7,Math.floor((p.w-12)/7.05));
      const shown=n.short.length>limit?n.short.slice(0,limit-1)+'…':n.short;
      label(p.x,p.y+4*screenUnit(),shown,Math.max(9,Math.min(12,xScale*.083)),drawing.ink,'center',major?700:550);
      ctx.globalAlpha=1;
      register(p.x,p.y,n.short,'decl',Math.max(p.w,p.h)/2,p.w,p.h);
    }
    sceneEnd();
    $('pa-stage-count').textContent=namedNodes.length+' named definitions and theorems · '+namedEdges.length+' source-level references';
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
      segment(center.x,center.y,x,y,d.local?drawing.warm:drawing.muted,d.local?.52:.23,.65+Math.log1p(d.count)/4);
      const isHover=state.hover && state.hover.type==='dep'&&state.hover.id===i;
      const lift=isHover?state.hoverPower:0;
      plotPoint(x,y,bubble,d.local?drawing.warm:drawing.accent,.88);
      if(lift>.02){
        // Existing dependency connection, highlighted at original geometry.
        segment(center.x,center.y,x,y,drawing.accent,.43*lift,1.05*screenUnit());
        ctx.globalAlpha=.65*lift;ctx.strokeStyle=drawing.warm;ctx.lineWidth=1.1*screenUnit();
        ctx.beginPath();ctx.arc(x,y,bubble+1.9*screenUnit(),0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
      }
      register(x,y,i,'dep',bubble+6);
      if(j<8 || d.local) label(x,y+(bubble+15),depName(d,i).slice(0,26),10.5,drawing.ink);
    }
    plotPoint(center.x,center.y,32,drawing.surface);
    label(center.x,center.y-4,'crossing',13,drawing.ink);label(center.x,center.y+12,'theorem',11,drawing.ink);
    register(center.x,center.y,'theorem','theorem',35);
    if(state.hover&&state.hover.type==='theorem'&&state.hoverPower>.01){
      plotPoint(center.x,center.y,34+7*state.hoverPower,drawing.accent,.3*state.hoverPower);
      label(center.x,center.y+4,'42 links',12,drawing.ink);
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
    for(const n of v){if(!coordMap.has(n.parent))continue;const a=coordMap.get(n.i),b=coordMap.get(n.parent);segment(a.x,a.y,b.x,b.y,drawing.muted,.54,1.55);}
    for(const n of v){const p=coordMap.get(n.i),r=4+Math.min(9,Math.log2(1+D.size[n.i]));plotPoint(p.x,p.y,r,n.i===state.selected?drawing.warm:palette[Number(D.kind[n.i])]);register(p.x,p.y,n.i,'expr',r+6);}
    if(state.hover&&state.hover.type==='expr'&&state.hoverPower>.01){
      const h=state.hover,center=coordMap.get(h.id),su=screenUnit();
      if(center){
        for(const [other,rel] of h.adj){
          if(!coordMap.has(other))continue;
          const q=coordMap.get(other),isBinder=rel.includes('binder')||rel.includes('bound variable');
          // Only retrace structural links. Scope links get a small ring.
          if(D.parent[other]===h.id || D.parent[h.id]===other){
            segment(center.x,center.y,q.x,q.y,drawing.accent,.42*state.hoverPower,1.15*su);
          }
          plotPoint(q.x,q.y,(isBinder?3.45:2.75)*su,isBinder?drawing.warm:drawing.accent,.8);
        }
        plotPoint(center.x,center.y,3.8*su,drawing.warm);
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
      const A=pos.get(a),B=pos.get(b);segment(A.x,A.y,B.x,B.y,drawing.accent,.8,2.5);
    }
    for(const it of reasons){
      const p=pos.get(it.id),col=it.id==='crossing'?drawing.warm:drawing.accent;
      const raised=state.hover&&state.hover.type==='idea'&&state.hover.id===it.id;
      plotPoint(p.x,p.y,Math.min(25,width*.043)+(raised?1.2*screenUnit()*state.hoverPower:0),raised?drawing.warm:col,.95);
      label(p.x,p.y+5,it.symbol,15,drawing.paper, 'center',700);
      label(p.x,p.y+46,it.title,Math.min(13,width*.024),drawing.ink,'center',600);
      register(p.x,p.y,it.id,'idea',30);
    }
    sceneEnd();$('pa-stage-count').textContent='Interpretation by the researchers · not inferred by the compiler';
  }
  function draw(){Object.assign(drawing,window.ProofAtlasDrawingTheme?.read(canvas)||{});palette.splice(0,palette.length,drawing.accent,drawing.muted,drawing.muted,drawing.warm,drawing.warm,drawing.muted);Object.keys(groupColors).forEach((k,i)=>groupColors[k]=[drawing.accent,drawing.muted,drawing.warm][i%3]);if(!canvas.width)return; if(state.mode==='map')drawMap();else if(state.mode==='whole')drawWhole();else if(state.mode==='deps')drawDeps();else if(state.mode==='recursive')drawRecursive();else drawMeaning();}
  function announceSelection(type,id){
    window.dispatchEvent(new CustomEvent('proof-atlas:selection',{
      detail:{type,id,mode:state.mode}
    }));
  }
  function updateMode(mode){
    state.hover=null;state.hoverPower=state.hoverTarget=0;
    tooltip.hidden=true;fillHoverDetails(null);
    state.mode=mode;state.panX=state.panY=0;state.scale=1;
    const legend=$('pa-syntax-legend');
    if(legend)legend.hidden=!(mode==='whole'||mode==='recursive');
    const names=titles[mode];$('pa-view-title').textContent=names[0];$('pa-view-subtitle').textContent=names[1];
    document.querySelectorAll('.pa-modes button').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',on?'true':'false');});
    draw();
    window.dispatchEvent(new CustomEvent('proof-atlas:mode',{detail:{mode}}));
  }
  function field(name,value) {
    const dl=$('pa-inspector-fields'),dt=document.createElement('dt'),dd=document.createElement('dd');
    dt.textContent=name;dd.textContent=String(value);dl.append(dt,dd);
  }
  function action(name,handler){
    const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',handler);$('pa-inspector-actions').appendChild(b);
  }
  function showNamedStatement(n){
    const box=document.createElement('pre');
    box.className='pa-lean-statement';
    box.textContent=n.statement;
    $('pa-inspector-actions').appendChild(box);
  }
  function selectDeclaration(id){
    const n=namedById.get(id);if(!n)return;
    resetSelectionScroll();
    state.namedSelected=id;
    $('pa-inspector-fields').replaceChildren();
    $('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent=n.short;
    $('pa-inspector-summary').textContent=n.summary;
    field('Lean declaration',n.kind==='def'?'Definition':n.kind==='structure'?'Structure':'Theorem / lemma');
    field('Declared in','Crossing.lean, line '+n.line);
    field('Proof references in this module',(namedIncoming.get(id)||[]).length);
    field('Used by following declarations',(namedOutgoing.get(id)||[]).length);
    const heading=document.createElement('div');heading.className='pa-statement-heading';
    heading.textContent='LEAN STATEMENT';
    $('pa-inspector-actions').appendChild(heading);
    showNamedStatement(n);
    for(const ref of namedIncoming.get(id)||[]){
      action('← '+ref,()=>selectDeclaration(ref));
    }
    if(n.external?.length)field('Other source-level proof machinery',n.external.join(', '));
    $('pa-canvas-status').textContent=n.name+' · '+n.kind;
    draw();
    announceSelection('decl',id);
  }
  function describeTerminal(i){
    const k=kind(i),dep=constantAt.get(i);
    if(k==='const'){
      if(dep&&dep.name!=='Kernel/library declaration'){
        const x=dep.name.split('.').pop(),named=namedById.get(x);
        return {title:dep.name,type:named?.kind==='theorem'?'Named theorem reference':
          named?.kind==='def'?'Named definition reference':'Named constant reference',
          explanation:named?.summary||'A Lean constant reference: whether it represents a lemma depends on its declaration.'};
      }
      return {title:'Anonymized constant',type:'Lean constant',
        explanation:'The declaration name was removed from this public dataset; this terminal syntax node cannot be classified as a lemma.'};
    }
    if(k==='bvar'){
      const binder=forwardBinders[i];
      return {title:'Bound variable',type:'Lean bound-variable occurrence',
        explanation:binder>=0?'This leaf points to its enclosing binder at expression #'+binder+'.':'A variable belonging to an enclosing scope.'};
    }
    if(k==='lit')return {title:'Literal',type:'Lean literal',
      explanation:'A literal value (for example a number), with no expression children.'};
    return {title:'Terminal expression',type:'Lean '+k,
      explanation:'No subexpressions. A syntax leaf is not automatically an independent theorem.'};
  }
  function terminalPageOccurrences(i,offset,limit=TERMINAL_PREVIEW_LIMIT){
    const out=[];
    let seen=0;
    if(subtreeValid){
      for(let j=i;j<i+D.size[i]&&out.length<limit;j++){
        if(!children[j].length&&seen++>=offset)out.push(j);
      }
    }else{
      const stack=[i];
      while(stack.length&&out.length<limit){
        const j=stack.pop();
        if(children[j].length)stack.push(...children[j].slice().reverse());
        else if(seen++>=offset)out.push(j);
      }
    }
    return out;
  }
  function addTerminalExplorer(i){
    const total=terminalCounts[i];
    const h=document.createElement('div');
    h.className='pa-statement-heading';h.textContent='TERMINAL LEAVES · '+fmt(total);
    $('pa-inspector-actions').appendChild(h);
    const note=document.createElement('p');note.className='pa-terminal-note';
    note.textContent='Each terminal is a Lean expression occurrence—not necessarily a theorem. A known constant can link to its actual declaration.';
    $('pa-inspector-actions').appendChild(note);
    const list=document.createElement('div');list.className='pa-terminal-list';
    $('pa-inspector-actions').appendChild(list);
    const pager=document.createElement('div');pager.className='pa-terminal-pager';
    const prev=document.createElement('button');prev.type='button';prev.textContent='← Earlier leaves';
    const next=document.createElement('button');next.type='button';next.textContent='Later leaves →';
    const count=document.createElement('span');count.setAttribute('aria-live','polite');
    pager.append(prev,count,next);
    $('pa-inspector-actions').appendChild(pager);
    let page=0;
    const pages=Math.ceil(total/TERMINAL_PREVIEW_LIMIT);
    function renderPage(){
      const offset=page*TERMINAL_PREVIEW_LIMIT;
      const preview=terminalPageOccurrences(i,offset);
      list.replaceChildren();
      for(const j of preview){
        const desc=describeTerminal(j),button=document.createElement('button');
        button.type='button';button.textContent='#'+j+' · '+desc.title;
        button.addEventListener('click',()=>navigateToExpression(j));
        list.appendChild(button);
      }
      prev.disabled=page===0;next.disabled=page>=pages-1;
      pager.hidden=pages<2;
      count.textContent=fmt(offset+1)+'-'+fmt(Math.min(offset+preview.length,total))+' / '+fmt(total);
      list.scrollTop=0;
    }
    prev.addEventListener('click',()=>{if(page>0){page--;renderPage();}});
    next.addEventListener('click',()=>{if(page<pages-1){page++;renderPage();}});
    renderPage();
  }
  function selectExpr(i){
    if(!Number.isInteger(i)||i<0||i>=N)return;
    resetSelectionScroll();
    state.selected=i;state.selectionScope='subtree';
    const isTerminal=children[i].length===0,leaf=isTerminal?describeTerminal(i):null;
    $('pa-inspector-fields').replaceChildren();$('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent=isTerminal?'#'+i+' · '+leaf.title:'Expression #'+i;
    $('pa-inspector-summary').textContent=isTerminal?leaf.explanation:
      'This subexpression has '+fmt(terminalCounts[i])+' terminal syntax leaves. Its highlighted descendant region is exact in the CoreGIR occurrence tree—not a set of independent lemmas.';
    field('Lean expression kind',kind(i));
    field('Syntactic role',isTerminal?leaf.type:'Internal expression');
    field('Depth from root',depth[i]);
    field('Subtree occurrences',fmt(D.size[i]));
    field('Terminal leaves',fmt(terminalCounts[i]));
    if(D.parent[i]>=0)field('Parent expression','#'+D.parent[i]);
    if(forwardBinders[i]>=0)field('Bound by expression','#'+forwardBinders[i]);
    if(isTerminal){
      field('Descendants','0 · ancestor path highlighted');
      const dep=constantAt.get(i);
      const localName=dep?.name.startsWith('CrossingData.')?dep.name.split('.').pop():null;
      if(localName&&namedById.has(localName)){
        action('Read '+localName+' in the theorem map',()=>{
          updateMode('map');selectDeclaration(localName);
        });
      }
      if(D.parent[i]>=0)action('Follow this leaf to its parent',()=>navigateToExpression(D.parent[i]));
    }else{
      action('Highlight all descendants + leaves',()=>{state.selectionScope='subtree';draw();});
      action('Highlight path to root',()=>{state.selectionScope='lineage';draw();});
    }
    const refs=D.deps.filter(dep=>dep.name!=='Kernel/library declaration' &&
      dep.uses.some(j=>j>=i&&j<i+D.size[i])).slice(0,8);
    if(refs.length){
      const h=document.createElement('div');h.className='pa-statement-heading';
      h.textContent='NAMED DECLARATIONS IN SUBTREE';
      $('pa-inspector-actions').appendChild(h);
      for(const dep of refs){
        const j=dep.uses.find(x=>x>=i&&x<i+D.size[i]);
        action(dep.name+' → #'+j,()=>navigateToExpression(j));
      }
    }
    addTerminalExplorer(i);
    action('Open as recursive subexpression',()=>{state.root=i;state.open.add(i);updateMode('recursive');});
    if(D.parent[i]>=0)action('Go to parent',()=>navigateToExpression(D.parent[i]));
    $('pa-canvas-status').textContent=isTerminal?'Terminal #'+i+' · ancestry highlighted':
      'Subtree #'+i+' · '+fmt(terminalCounts[i])+' leaves';
    draw();
    announceSelection('expr',i);
  }
  function selectDep(i){
    resetSelectionScroll();
    const d=D.deps[i];$('pa-inspector-fields').replaceChildren();$('pa-inspector-actions').replaceChildren();
    $('pa-inspector-heading').textContent=depName(d,i);
    $('pa-inspector-summary').textContent='A referenced declaration in the theorem type or proof value. Marker size encodes use frequency.';
    field('Direct uses',fmt(d.count));field('Reference kind',d.local?'SE(2) project-local':'Lean / mathlib');
    if(d.uses?.length)action('Inspect first occurrence',()=>{updateMode('whole');selectExpr(d.uses[0]);});
    $('pa-canvas-status').textContent='Selected declaration: '+depName(d,i);draw();
    announceSelection('dep',i);
  }
  function selectIdea(id){
    const it=reasons.find(x=>x.id===id);if(!it)return;
    resetSelectionScroll();
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
    announceSelection('idea',id);
  }

  // Every edge listed here is one hop in the currently shown explanatory
  // diagram. These semantic edges are editorial and are never conflated with
  // exact Lean expression or binder links.
  const ideaEdges=[['phase','exists'],['phase','unique'],['exists','crossing'],['unique','crossing']];
  function infoFor(p) {
    if(p.type==='decl'){
      const n=namedById.get(p.id);
      const deps=namedIncoming.get(p.id)||[],users=namedOutgoing.get(p.id)||[];
      const adj=new Map([...deps.map(x=>[x,['required by this declaration']]),...users.map(x=>[x,['uses this declaration']])]);
      return {key:'decl:'+p.id,id:p.id,type:'decl',title:n.name,subtitle:n.summary,
        adj,items:[...deps.map(id=>({label:id,detail:'Referenced in proof'})),
          ...users.map(id=>({label:id,detail:'Uses this declaration'}))],count:adj.size};
    }
    if(p.type==='expr') {
      const adj=oneHop(p.id),terminal=children[p.id].length===0;
      const role=terminal?describeTerminal(p.id):null;
      const title=role?.title||('Lean '+kind(p.id)+' #'+p.id);
      const subtitle=terminal?(role.type+' · expression #'+p.id):
        ('Internal expression · depth '+depth[p.id]+' · '+fmt(terminalCounts[p.id])+' terminal leaves');
      return {key:'expr:'+p.id,id:p.id,type:'expr',title,subtitle,
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
    // A fixed-size dock prevents layout shifts while hover data changes.
    hoverDetails.replaceChildren();
    const head=document.createElement('h4');
    head.textContent='HOVER · DIRECT CONNECTIONS';
    hoverDetails.appendChild(head);
    const blurb=document.createElement('p');
    blurb.textContent=h?h.title+' · '+h.count+' direct neighbour'+(h.count===1?'':'s'):
      'Hover a node for its one-hop connections; click to examine a branch.';
    hoverDetails.appendChild(blurb);
    if(!h)return;
    const list=document.createElement('ol');list.className='pa-hover-neighbors';
    for(const row of h.items.slice(0,24)){
      const li=document.createElement('li');
      const name=document.createElement('strong');name.textContent=row.label;
      const rel=document.createElement('span');rel.textContent=row.detail;
      li.append(name,rel);list.appendChild(li);
    }
    if(h.items.length>24){
      const li=document.createElement('li');li.textContent='… plus '+(h.items.length-24)+' connections';
      list.appendChild(li);
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
      // Keep the existing hover list DOM and its scrollTop while moving
      // over the same node; only the floating pointer card moves.
      showTooltip(old);
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
      state.hoverTarget=0;tooltip.hidden=true;
      // Keep the last hovered neighborhood visible in the dock so readers
      // can move from the canvas to the right pane and scroll the list.
      if(hoverDetails.firstElementChild){
        hoverDetails.firstElementChild.textContent='LAST HOVER · DIRECT CONNECTIONS';
      }
      $('pa-canvas-status').textContent='Select a node to inspect';
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
      if(p.type==='decl' && Math.abs(p.x-x)<=(p.w||0)/2+3/Math.max(.6,state.scale)
        && Math.abs(p.y-y)<=(p.h||0)/2+3/Math.max(.6,state.scale)){
        return p;
      }
      const d=(p.x-x)**2+(p.y-y)**2;
      if(d<best){best=d;found=p;}
    }
    if(!found)return null;
    // Pointer tolerance is in SCREEN pixels; prevents distant nodes from
    // acquiring enormous hit radii when heavily zoomed.
    const tolerance=found.type==='expr'?7:Math.max(10,Math.min(30,found.radius*state.scale+3));
    return best*state.scale*state.scale<tolerance*tolerance?found:null;
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
    if(p.type==='decl')selectDeclaration(p.id);
    else if(p.type==='expr')selectExpr(p.id);else if(p.type==='dep')selectDep(p.id);
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
  window.ProofAtlasAPI={
    selectExpression(i){if(state.mode!=='whole')updateMode('whole');selectExpr(i);},
    selectDeclaration(id){if(state.mode!=='map')updateMode('map');selectDeclaration(id);},
    selectDependency(i){if(state.mode!=='deps')updateMode('deps');selectDep(i);},
    mode(mode){updateMode(mode);},
    setScope(scope){
      if(scope!=='subtree'&&scope!=='lineage')return;
      state.selectionScope=scope;draw();
      announceSelection('expr',state.selected);
    },
    getSnapshot(){return {mode:state.mode,selected:state.selected,namedSelected:state.namedSelected,scope:state.selectionScope};},
    getScreenPosition(type,id){
      const p=state.points.find(p=>p.type===type&&p.id===id);if(!p)return null;
      const rect=canvas.getBoundingClientRect();
      return {x:rect.left+width/2+state.panX+state.scale*(p.x-width/2),y:rect.top+height/2+state.panY+state.scale*(p.y-height/2)};
    },
    getChildIds(i){return i>=0&&i<N?children[i].slice():[];}
  };
  fillHoverDetails(null);
  window.ProofAtlasDrawingTheme?.subscribe(()=>draw());
  if(namedNodes.length){updateMode('map');resize();selectDeclaration('crossing');}
  else{updateMode('whole');resize();selectExpr(D.roots[1]);}
})();
