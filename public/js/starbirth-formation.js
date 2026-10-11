/* A deterministic illustration, not a collapse solver or an observational fit. */
(function () {
  'use strict';
  const sources = [
    ['Young (2023)', 'https://arxiv.org/abs/2312.03039'],
    ['Dunham et al. (2014)', 'https://arxiv.org/abs/1401.1809'],
    ['Ercolano & Pascucci (2017)', 'https://arxiv.org/abs/1704.00214'],
    ['NASA: stars', 'https://science.nasa.gov/universe/stars/']
  ];
  const phases = [
    {title:'Molecular cloud', tag:'Gas + dust', short:'Cloud → core', description:'Cold molecular gas and a small dust component gather into denser regions. Some regions become gravitationally unstable; others disperse.', change:'Dense structures develop inside the cloud.', energy:'Thermal pressure, turbulence and magnetic fields compete with gravity.', observe:'Dust emission and molecular spectral lines; no central stellar object yet.', note:'Most of the material is gas. Dust helps hide what is inside.', source:1},
    {title:'Collapsing prestellar core', tag:'Gravity gathers material', short:'Core → first core', description:'A bound core contracts. While radiation can escape, it carries away much of the compression heat. The centre grows denser.', change:'Material falls towards the central region.', energy:'Gravity drives contraction; cooling limits the temperature rise.', observe:'Cold dust and infalling gas. A catalogue label does not reveal every hidden source.', note:'Contraction is inward. There is no central protostar yet.', source:0},
    {title:'First hydrostatic core', tag:'A temporary pressure-supported core', short:'First core → collapse', description:'The centre becomes opaque enough to retain heat. Gas pressure briefly slows the collapse, creating the first hydrostatic core.', change:'A small, warm central object forms inside the envelope.', energy:'Gas pressure temporarily supports the first core.', observe:'Mostly envelope emission. A slow outflow is possible in magnetised models.', note:'Reveal the centre to see the first core inside the opaque envelope.', source:0},
    {title:'Second collapse', tag:'H₂ dissociation · around 2,000 K', short:'Collapse → protostar', description:'Molecular hydrogen begins to dissociate. Energy goes into breaking molecules, weakening the pressure response and allowing rapid contraction.', change:'The central region contracts again to stellar densities.', energy:'Dissociation absorbs energy; gravity regains the upper hand.', observe:'The envelope can hide this central transition.', note:'The tiny centre contracts. The surrounding envelope does not vanish.', source:0},
    {title:'Embedded protostar', tag:'Second core formed · often Class 0', short:'Protostar → envelope clearing', description:'A second hydrostatic core forms: the nascent protostar. An infalling envelope supplies material through a disk, while outflows remove some gas.', change:'The central protostar gains mass; cavities develop around outflows.', energy:'Accretion and contraction release gravitational energy.', observe:'Strong infrared/submillimetre envelope emission; jets and molecular outflows.', note:'This is the program’s birth milestone. The protostar is still obscured.', source:1},
    {title:'Envelope clears', tag:'Accretion continues · often Class I', short:'Envelope → exposed disk', description:'The envelope reservoir diminishes as matter accretes or is expelled. The star and disk become easier to see along some sightlines.', change:'The envelope thins; the star–disk system becomes more exposed.', energy:'Accretion and contraction continue; deuterium burning can contribute.', observe:'Infrared emission from the star, disk and remaining envelope.', note:'Outflow cavities open sightlines, but viewing angle still matters.', source:1},
    {title:'Young star with disk', tag:'Pre-main sequence · often Class II', short:'Disk → disk-poor star', description:'The envelope has largely dispersed. A young star remains surrounded by a gas-and-dust disk that can keep feeding it and forming planets.', change:'The disk evolves while the young star contracts.', energy:'Stellar contraction, with continued disk accretion in many systems.', observe:'A visible young star with excess infrared light from its disk.', note:'The star already exists. A disk does not make it a newborn at this moment.', source:2},
    {title:'Disk-poor young star', tag:'Pre-main sequence · often Class III', short:'Young star → main sequence', description:'Accretion, outflows and irradiation disperse the disk. A largely exposed young star keeps contracting towards its main-sequence structure.', change:'Little disk material remains; the stellar interior evolves.', energy:'Contraction still contributes before sustained hydrogen burning dominates.', observe:'Mostly stellar light, often with magnetic activity.', note:'Disk clearing and stellar contraction are overlapping processes.', source:2},
    {title:'Main-sequence star', tag:'Sustained hydrogen fusion', short:'A stable stellar state', description:'The central temperature and density support sustained hydrogen fusion. For a Sun-like star, fusion becomes its long-term energy source.', change:'A long-lived balance between gravity and pressure is established.', energy:'Hydrogen fusion supplies the luminosity; pressure supports the star.', observe:'Stellar photospheric light. Our Sun is a main-sequence star.', note:'The main sequence comes after protostellar birth, not at the same time.', source:3}
  ];
  // Artist's parameters; radii vary with the changing visual zoom, not physical units.
  const poses = [
    [250,.55,0,0,0,0], [170,.72,0,0,0,.65], [145,.82,23,20,.25,1],
    [130,.85,6,35,.22,1], [125,.80,15,105,1,.9], [108,.43,22,128,.8,.6],
    [75,.07,33,145,.2,.15], [35,.01,29,92,0,0], [0,0,26,0,0,0]
  ];
  function stateAt(value) {
    const position = Math.max(0, Math.min(800, Number.isFinite(Number(value)) ? Number(value) : 0));
    const index = Math.min(8, Math.floor(position / 100));
    const fraction = (position / 100) - index;
    const t = fraction * fraction * (3 - 2 * fraction);
    const a = poses[index], b = poses[Math.min(8,index + 1)];
    const values = a.map((v,i) => v + (b[i] - v) * t);
    return {position,index,cloudRadius:values[0],cloudOpacity:values[1],coreRadius:values[2],diskRadius:values[3],jet:values[4],infall:values[5]};
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {phases,stateAt};
  if (typeof document === 'undefined') return;
  const root = document.getElementById('star-formation');
  if (!root) return;
  const canvas = root.querySelector('#sbf-canvas');
  const context = canvas.getContext('2d');
  if (!context) return; // The accessible static sequence remains available.
  const input = root.querySelector('#sbf-timeline');
  const play = root.querySelector('#sbf-play');
  const reveal = root.querySelector('#sbf-reveal');
  const buttons = Array.from(root.querySelectorAll('[data-phase]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = 0, cutaway = false, playing = false, frame = null, previous = null, announced = -1;
  let width = 0, height = 0;
  // Seeded geometry stays fixed: repeated scrubbing produces identical frames.
  let seed = 62417;
  function random() { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; }
  const stars = Array.from({length:75}, () => ({x:random(),y:random(),r:.3+random()*.7,a:.12+random()*.3}));
  const dust = Array.from({length:420}, () => ({angle:random()*Math.PI*2,r:Math.sqrt(random()),jitter:random(),size:.35+random()*1.1}));
  const knots = Array.from({length:48}, () => ({angle:random()*Math.PI*2,r:Math.sqrt(random()),size:20+random()*45,a:.08+random()*.07}));
  function glow(x,y,r,colour,alpha) {
    if (r <= 0 || alpha <= 0) return;
    const gradient = context.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0, 'rgba('+colour+','+alpha+')');
    gradient.addColorStop(1, 'rgba('+colour+',0)');
    context.fillStyle=gradient; context.beginPath();context.arc(x,y,r,0,2*Math.PI);context.fill();
  }
  function draw() {
    if (!width || !height) return;
    const state=stateAt(position), scale=Math.min(width/650,height/400)*(1+.55*Math.min(1,position/500));
    const cx=width/2,cy=height*.51;
    context.clearRect(0,0,width,height);context.fillStyle='#141b20';context.fillRect(0,0,width,height);
    for (const star of stars) {
      context.fillStyle='rgba(228,222,211,'+star.a+')';context.beginPath();context.arc(star.x*width,star.y*height,star.r,0,2*Math.PI);context.fill();
    }
    context.save();context.translate(cx,cy);context.scale(scale,scale);
    const cloud=state.cloudRadius;
    glow(0,0,cloud*1.15,'132,129,120',state.cloudOpacity*.42);
    if (cloud>0) {
      for (const knot of knots) {
        const x=Math.cos(knot.angle)*knot.r*cloud, y=Math.sin(knot.angle)*knot.r*cloud*.65;
        glow(x,y,knot.size*(.6+cloud/300),'156,147,134',state.cloudOpacity*knot.a);
      }
    }
    // Broad first-core flows become narrower protostellar outflows.
    if (state.jet>.01) {
      const length=38+state.jet*130, spread=position<400?24:14;
      for (const sign of [-1,1]) {
        const gradient=context.createLinearGradient(0,sign*12,0,sign*length);
        gradient.addColorStop(0,'rgba(222,185,132,'+(state.jet*.55)+')');gradient.addColorStop(1,'rgba(222,185,132,0)');
        context.fillStyle=gradient;context.beginPath();context.moveTo(-4,sign*8);context.lineTo(-spread,sign*length);context.quadraticCurveTo(0,sign*(length+15),spread,sign*length);context.lineTo(4,sign*8);context.closePath();context.fill();
        for (let i=0;i<12;i++) {
          const t=((i/12)+(position/180))%1;
          glow(Math.sin(i*2.3)*spread*t,sign*(15+t*length),2.5,'248,213,162',state.jet*(1-t)*.7);
        }
      }
    }
    if (state.diskRadius>2) {
      context.save();context.rotate(-.17);
      for (let i=16;i>0;i--) {
        const radius=state.diskRadius*i/16;
        const fading=position>600?Math.max(0,1-(position-600)/200):1;
        context.strokeStyle='rgba(203,151,96,'+((.12+i*.012)*fading)+')';context.lineWidth=2.5;
        context.beginPath();context.ellipse(0,0,radius,radius*.22,0,0,2*Math.PI);context.stroke();
      }
      context.restore();
    }
    if (position>=200) {
      const core=state.coreRadius;
      glow(0,0,core*4.5,'241,172,89',.25);
      const surface=context.createRadialGradient(-core*.3,-core*.35,0,0,0,core);
      surface.addColorStop(0,'#fff3cd');surface.addColorStop(.6,position>=600?'#f4d28b':'#e9b273');surface.addColorStop(1,'#ae7447');
      context.fillStyle=surface;context.beginPath();context.arc(0,0,core,0,2*Math.PI);context.fill();
      if (position>=800) {
        // Qualitative indication of a fusion-powered interior; not a reaction model.
        for (let i=0;i<12;i++) {
          const angle=i*Math.PI/6;
          context.strokeStyle='rgba(249,220,159,.35)';context.lineWidth=1;
          context.beginPath();context.moveTo(Math.cos(angle)*core*1.7,Math.sin(angle)*core*1.7);context.lineTo(Math.cos(angle)*core*2.4,Math.sin(angle)*core*2.4);context.stroke();
        }
      }
    }
    // The envelope obscures the core unless the reader opens an explanatory cutaway.
    const veil=state.cloudOpacity*(cutaway?.17:1);
    if (cloud>0) {
      glow(0,0,cloud*.64,'41,44,42',veil*.96);
      for (const point of dust) {
        const angle=point.angle + position*.0018*(1-point.r);
        const r=point.r*cloud;
        const x=Math.cos(angle)*r, y=Math.sin(angle)*r*.67;
        const cavity=position>=350 && Math.abs(x)<Math.abs(y)*.20 ? .08 : 1;
        context.fillStyle='rgba(196,179,153,'+(veil*(.18+point.jitter*.35)*cavity)+')';
        context.beginPath();context.arc(x,y,point.size,0,2*Math.PI);context.fill();
      }
      if (!cutaway && position>=200 && position<550) glow(0,0,state.coreRadius*1.65,'35,38,36',.92);
      if (state.infall>.05) {
        context.strokeStyle='rgba(191,187,172,'+(state.infall*.28)+')';context.lineWidth=1;
        for (let i=0;i<7;i++) {
          const angle=i*Math.PI*2/7+.4;
          const r=cloud*(.46+.06*Math.sin(position/30+i));
          const x=Math.cos(angle)*r,y=Math.sin(angle)*r*.67;
          context.beginPath();context.moveTo(x*1.16,y*1.16);context.lineTo(x,y);
          context.lineTo(x*1.06-5*Math.sin(angle),y*1.06+5*Math.cos(angle));
          context.moveTo(x,y);context.lineTo(x*1.06+5*Math.sin(angle),y*1.06-5*Math.cos(angle));context.stroke();
        }
      }
    }
    context.restore();
  }
  function update(value, announce) {
    const state=stateAt(value); position=state.position; input.value=String(position);
    if(state.index<2||state.index>5)cutaway=false;
    const phase=phases[state.index];
    for (const field of ['title','description','change','energy','observe']) root.querySelector('#sbf-'+field).textContent=phase[field];
    root.querySelector('#sbf-step').textContent='Milestone '+(state.index+1)+' of 9';
    root.querySelector('#sbf-position').textContent=phase.short;
    root.querySelector('#sbf-scene-tag').textContent=phase.tag;
    root.querySelector('#sbf-scene-note').textContent=cutaway&&state.index>=2&&state.index<=5?'Cutaway view: the central object is revealed. A telescope cannot remove the envelope this way.':phase.note;
    const citation=sources[phase.source], source=root.querySelector('#sbf-source');
    source.textContent='Physics source: '+citation[0]+' ↗';source.href=citation[1];
    input.setAttribute('aria-valuetext',phase.title+', milestone '+(state.index+1)+' of 9');
    canvas.setAttribute('aria-label',phase.title+'. '+phase.change+' '+(cutaway?'Schematic cutaway. ':'')+'Illustration, not a simulation or observation.');
    buttons.forEach((button,i)=>{if(i===state.index)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
    reveal.disabled=state.index<2||state.index>5;
    reveal.setAttribute('aria-pressed',String(cutaway));reveal.textContent=cutaway?'Restore envelope':'Reveal centre';
    if(announce&&announced!==state.index) {root.querySelector('#sbf-announcement').textContent=phase.title+'. '+phase.description;announced=state.index;}
    draw();
  }
  function pause() {
    playing=false;previous=null;if(frame!==null)cancelAnimationFrame(frame);frame=null;
    play.textContent='Play sequence';play.setAttribute('aria-pressed','false');
    root.querySelector('#sbf-motion-note').textContent=reducedMotion.matches?'Reduced motion · use the timeline or milestone buttons':'Paused · explore at your own pace';
  }
  function animate(now) {
    if(!playing)return;
    if(previous!==null)update(position+Math.min(80,now-previous)*(800/24000),true);
    previous=now;
    if(position>=800)pause();else frame=requestAnimationFrame(animate);
  }
  input.disabled=false;buttons.forEach(button=>button.disabled=false);
  root.querySelector('#sbf-reset').disabled=false;
  play.disabled=reducedMotion.matches;
  input.addEventListener('input',()=>{pause();update(Number(input.value),true);});
  buttons.forEach(button=>button.addEventListener('click',()=>{pause();update(Number(button.dataset.phase)*100,true);}));
  reveal.addEventListener('click',()=>{cutaway=!cutaway;update(position,false);});
  root.querySelector('#sbf-reset').addEventListener('click',()=>{pause();cutaway=false;update(0,true);});
  play.addEventListener('click',()=>{
    if(playing){pause();return;}
    if(reducedMotion.matches)return;
    if(position>=800)update(0,false);
    playing=true;previous=null;play.textContent='Pause';play.setAttribute('aria-pressed','true');
    root.querySelector('#sbf-motion-note').textContent='Playing · 24-second illustration, not real elapsed time';
    frame=requestAnimationFrame(animate);
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
  reducedMotion.addEventListener('change',()=>{pause();play.disabled=reducedMotion.matches;});
  function resize() {
    const box=canvas.getBoundingClientRect();width=box.width;height=box.height;
    const ratio=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);draw();
  }
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  root.querySelector('.sbf-placeholder').remove();
  root.classList.add('is-ready');pause();update(0,false);resize();
}());
