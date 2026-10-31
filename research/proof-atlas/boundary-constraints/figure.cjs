'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/boundary-constraints/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=n=>JSON.parse(z.gunzipSync(fs.readFileSync(base+n+'.json.gz'))),native=read('native'),model=read('model-check');assert.equal(model.status,'PASS');
const p=native.profiles.find(p=>p.source.name==='AtlasDependentRegion.proofDiamond'),c=p.native.cases.find(c=>c.policy==='all-boundary-positions'),prefix=p.commonContext.length;
assert.equal(c.status,'PASS');assert.equal(c.independentInputs,9);assert.equal(c.derivedInputs,2);assert.deepEqual(c.keptContextSlots,[]);
const aliases=['f','n','k','u','a','h','ℓ','v','b','q','r','g','P','Q','out'];assert.equal(c.bindings.length,aliases.length);
const inputPositions=c.bindings.map((b,i)=>b.port.kind==='input'?i:null).filter(i=>i!==null);assert.deepEqual(inputPositions,[0,1,3,4,5,7,8,9,11]);
assert.deepEqual(c.constraints.map(r=>r.binding),[12,13]);assert.deepEqual(c.members,[0,1,2,3]);
function shape(g,root,count,depth=0){
 const k=g.kind[root],v=g.payloads[root];if(k===0){if(v.index<depth)return['local',v.index];const slot=prefix+count-1-(v.index-depth);assert(slot>=0);return slot<prefix?['original',slot]:['binding',slot-prefix];}
 return[k,v,...g.children[root].map((n,s)=>shape(g,n,count,depth+Number((k===6||k===7)&&s===1||k===8&&s===2)))];
}
function app(g,root){const args=[];while(g.kind[root]===5){args.unshift(g.children[root][1]);root=g.children[root][0];}return{head:root,args};}
const computed=[],links=[],caseHash=sha(Buffer.from(JSON.stringify(c))),inventory=sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),routes=[];let slots=[],node=c.graph.roots[0];
for(const[i,b]of c.bindings.entries()){
 assert.equal(c.graph.kind[node],b.port.kind==='input'?6:8);routes.push({node,slots:[...slots]});slots.push(b.port.kind==='input'?1:2);node=c.graph.children[node].at(-1);
}
for(const[index,expected]of[[2,[0,1]],[6,[3,4,2,5]],[10,[7,8,2,9]],[14,[11,12,13,6,10]]]){
 const g=c.bindings[index].graph,a=app(g,g.roots[1]);assert.deepEqual([a.head,...a.args].map(n=>shape(g,n,index)),expected.map(i=>['binding',i]));
}
for(const[index,result]of[[12,6],[13,10]]){
 const r=c.constraints.find(r=>r.binding===index),b=c.bindings[result];assert.deepEqual(shape(r.graph,r.graph.roots[0],index),shape(b.graph,b.graph.roots[0],result),'Displayed assignment is exactly the recorded incoming result type');
 const g=r.graph,a=app(g,g.roots[0]);assert.equal(g.payloads[a.head].name,index===12?'LE.le':'LT.lt');assert.equal(a.args.length,4);assert.equal(g.payloads[a.args[0]].name,'Nat');assert.equal(g.payloads[a.args[1]].name,index===12?'instLENat':'instLTNat');
 assert.deepEqual(shape(g,a.args[2],index),['binding',index===12?4:8]);
 if(index===12)assert.deepEqual(shape(g,a.args[3],index),['binding',2]);else{const succ=app(g,a.args[3]);assert.equal(g.payloads[succ.head].name,'Nat.succ');assert.deepEqual(succ.args.map(n=>shape(g,n,index)),[['binding',2]]);}
 const location=routes[index],selectedSlots=[...location.slots,1],selected=c.graph.children[location.node][1];
 computed.push({binding:index,alias:aliases[index],resultBinding:result,address:{namespace:'boundary-constraint-components',sourceIndexSha256:p.source.indexSha256,nativeInventorySha256:inventory,nativeCaseSha256:caseHash,case:c.policy,component:'function.original',node:selected,route:{root:'function.original',slots:selectedSlots}},source:c.bindings[index].port.source.input});
}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function href(index){const b=c.bindings[index].port,record=p.records.find(r=>r.index===b.call),source=b.kind==='result'?record.anchor:b.source.input,query=new URLSearchParams({source:p.source.indexSha256,edition:p.source.edition,proof:p.source.name,call:String(b.call),...(b.kind==='result'?{}:{input:String(b.slot)})});const href='/projects/proof-atlas/manual/paged-network/?'+query+'#ns-lab';links.push({binding:index,href,source,sourceOwner:p.source});return escape(href);}
const parts=[],edges=[],text=(x,y,s,cls='math')=>`<text x="${x}" y="${y}" class="${cls}">${escape(s)}</text>`;
parts.push(text(24,36,'Derive boundary propositions from incoming proof types','title'),text(24,68,'Checked proofDiamond function: nine independent inputs, two derived ports, no adapter assumptions.','caption'));
parts.push(text(24,105,'Inputs are interleaved with computations: f, n, u, a, h, v, b, q, g. Both h and q have domains using k.','caption'));
function wire(d,from,to,slot=null){
 const type=slot===null;
 if(type)assert(computed.some(r=>r.binding===to&&r.resultBinding===from),'Unrecorded type observation');
 else{const g=c.bindings[to].graph,a=app(g,g.roots[1]);assert.deepEqual(shape(g,[a.head,...a.args][slot],to),['binding',from],'Invented computed value use');}
 edges.push({relation:type?'recorded-result-type':'computed-value-use',from,to,slot,path:d});
 parts.push(`<path data-edge="${edges.length-1}" d="${d}" class="${type?'type-wire':'wire'}" marker-end="url(#${type?'type-arrow':'arrow'})"/>`);
}
wire('M230 205 H310 V290 H350',2,6,2);wire('M230 205 H290 V430 H350',2,10,2);
wire('M420 335 V350 H315 V525 H420 V540',6,14,3);wire('M530 475 V500 H550 V540',10,14,4);
wire('M1080 265 H1110 V590 H650',12,14,1);wire('M1080 465 H1130 V625 H650',13,14,2);
wire('M660 295 H720 V205 H800',6,12);wire('M660 435 H700 V405 H800',10,13);
function card(i,x,y,w,h,title,lines,derived=false){parts.push(`<a href="${href(i)}" tabindex="0" aria-label="${escape('Inspect original source of '+title)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="box${derived?' derived':''}"/>${text(x+12,y+22,title,'label')}${lines.map((s,j)=>text(x+12,y+51+j*27,s)).join('')}</a>`);}
card(2,24,155,206,94,'Computed result k',['k := f n','k : ℕ']);
card(6,350,235,310,100,'Left result ℓ',['ℓ := @u a k h','ℓ : a ≤ k']);
card(10,350,375,310,100,'Right result r',['r := @v b k q','r : b < succ k']);
card(12,800,155,280,110,'Derived input 3:1',['P := a ≤ k','P : Prop'],true);
card(13,800,355,280,110,'Derived input 3:2',['Q := b < succ k','Q : Prop'],true);
card(14,24,540,626,110,'Join · all ordered arguments retained',['out := @g P Q ℓ r','out : P ∧ Q']);
parts.push(text(805,305,'recorded result type','caption'),text(805,505,'recorded result type','caption'));
parts.push(text(24,700,'Solid: computed value use. Dotted: native type observation determining a boundary definition.','caption'),text(24,731,'Return every original result position: k, ℓ, r, out. Layout is schematic; it has no mathematical metric.','caption'),text(24,762,'Cards open original source occurrences. Computed addresses are in the figure provenance, not the direct-input reader.','caption'));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1160 790" role="group" aria-labelledby="title desc"><title id="title">Dependent boundary equations at a proof join</title><desc id="desc">Two incoming result types define P and Q. The join takes the two propositions and their proofs. Four result positions and all eleven boundary positions remain accounted for; nine are independent and two are computed definitions. Six source links open original compiled occurrences. This is a computed function, not an arbitrary independent replacement of every port.</desc><style>svg{--paper:#fff;--ink:#202124;--muted:#535d68;--line:#697785;--type:#285a86;--pale:#f2f5f8;background:var(--paper)}@media(prefers-color-scheme:dark){svg{--paper:#191b1e;--ink:#eceff2;--muted:#b7c1ca;--line:#9aa9b7;--type:#9bc8ef;--pale:#252a30}}text{fill:var(--ink)}.title{font:26px Georgia,serif}.math{font:21px Georgia,serif}.label{font:15px Arial,sans-serif}.caption{font:15px Arial,sans-serif;fill:var(--muted)}.box{fill:var(--pale);stroke:var(--line);stroke-width:1.4}.derived{stroke:var(--type);stroke-dasharray:3 3}.wire,.type-wire{fill:none;stroke:var(--line);stroke-width:1.8}.type-wire{stroke:var(--type);stroke-dasharray:3 4}a:focus .box,a:hover .box{stroke:var(--type);stroke-width:3}a:focus{outline:2px solid var(--type)}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--line)"/></marker><marker id="type-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--type)"/></marker></defs>${parts.join('\n')}</svg>\n`;
const report={format:'ProofAtlasBoundaryConstraintFigure/1',status:'PASS',source:p.source,nativeCaseSha256:caseHash,nativeSha256:inventory,computed,links,edges,svgSha256:sha(Buffer.from(svg)),producerSha256:sha(fs.readFileSync(__filename)),scope:'Literal application arguments and native result-type/derived-value correspondence for the authored join. Six solid edges are actual computed argument uses; two dotted edges are native type observations. All result and boundary positions remain explicit. Source links do not claim support for these new computed fields in the earlier direct-input reader. No comprehension or general constraint-solving claim.'};
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(base+'boundary-equations.svg','utf8'),svg);assert.deepEqual(read('figure'),report);}else{fs.writeFileSync(base+'boundary-equations.svg',svg);fs.writeFileSync(base+'figure.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',sourceLinks:links.length,derivedDefinitions:computed.length}));
