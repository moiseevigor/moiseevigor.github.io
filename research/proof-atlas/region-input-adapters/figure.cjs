'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-input-adapters/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=file=>JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const native=read(base+'native.json.gz'),model=read(base+'model-check.json.gz'),host={};assert.equal(model.status,'PASS');
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/region-adapter-function-pages-manifest.js','utf8'),{window:host});
const p=native.profiles.find(p=>p.source.name==='JacobiData.slope_bound_abs'),c=p.native.cases.find(c=>c.policy==='all-boundary-positions');
const d=host.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES.profiles.find(p1=>p1.source.indexSha256===p.source.indexSha256).cases.find(d=>d.id===c.policy),m=read('.'+d.file);
const pair=c.adapters.filter(a=>a.call===25);assert.deepEqual(pair.map(a=>[a.binding,a.slot,a.sourcePort.knownProducer]),[[17,3,76],[18,4,75]]);
assert.equal(c.boundaryInputs,35);assert.equal(c.adapterInputs,6);assert.deepEqual(c.keptContextSlots,[]);
const input=slot=>m.bindings.findIndex(b=>b.kind==='input'&&b.call===25&&b.slot===slot),result=m.bindings.findIndex(b=>b.kind==='result'&&b.call===25);
assert.deepEqual([input(0),input(1),input(2),result],[14,15,16,19]);
function variable(a,node,binding){assert.equal(a.graph.kind[node],0);assert.equal(a.contextLength-1-a.graph.payloads[node].index,c.originalContextLength+binding);}
const equality=pair[0],g=equality.graph;let head=g.roots[1],args=[];while(g.kind[head]===5){args.unshift(g.children[head][1]);head=g.children[head][0];}
assert.equal(g.payloads[head].name,'Eq');assert.equal(args.length,3);assert.equal(g.kind[args[0]],3);assert.deepEqual(g.payloads[args[0]].level,{kind:'zero'});variable(equality,args[1],input(1));variable(equality,args[2],input(2));variable(pair[1],pair[1].graph.roots[1],input(1));
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c])),links=[];
function link(binding,field){
 const b=m.bindings[binding],port=field==='value'?null:b.kind==='adapter'?p.records.find(r=>r.index===b.call).ports[b.slot]:null;
 const query=new URLSearchParams({source:p.source.indexSha256,edition:p.source.edition,proof:p.source.name,call:String(b.call),...(b.kind==='result'?{}:{input:String(b.slot)}),policy:c.policy,rule:'adapters',nativeCase:d.nativeCaseSha256,binding:String(binding),field});
 const slots=[...b.slots,...({binder:[],domain:[0],actual:[0,0],required:[0,1],value:[1]}[field])];let node=c.graph.roots[0];for(const slot of slots)node=c.graph.children[node][slot];
 const selected={namespace:'region-input-components',sourceIndexSha256:p.source.indexSha256,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,manifestSha256:d.sha256,case:c.policy,component:'function.original',node,route:{root:'function.original',slots}};
 const source=b.kind==='adapter'?b.inputSource:b.source,url='/projects/proof-atlas/manual/paged-network/?'+query+'#ns-lab';
 links.push({binding,field,href:url,selected,source,sourceOwner:p.source});return escape(url);
}
const text=(x,y,s,cls='math')=>`<text x="${x}" y="${y}" class="${cls}">${escape(s)}</text>`,parts=[];
parts.push(text(22,35,'Additional inputs connect incompatible proof types','title'),text(22,68,'One Riccati transport call. Adapter functions are assumptions, not inferred conversions.','caption'));
function card(binding,field,x,y,w,h,title,formula,adapter=false){parts.push(`<a href="${link(binding,field)}" tabindex="0" aria-label="${escape(title)}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" class="box${adapter?' adapter':''}"/>${text(x+12,y+22,title,'label')}${text(x+12,y+54,formula)}</a>`);}
card(input(0),'domain',22,110,590,82,'Supplied transport head t · source input 25:0','t : ∀ P Q : Prop, (P = Q) → P → Q');
card(input(1),'binder',650,110,185,82,'Input 25:1','P : Prop');card(input(2),'binder',870,110,205,82,'Input 25:2','Q : Prop');
card(17,'actual',22,260,250,82,'Produced type · call 76','e : A');card(17,'domain',380,260,350,82,'Additional input α','α : A → (P = Q)',true);card(17,'required',810,260,265,82,'Required at input 25:3','α e : P = Q');
card(18,'actual',22,420,250,82,'Produced type · call 75','h : C');card(18,'domain',380,420,350,82,'Additional input β','β : C → P',true);card(18,'required',810,420,265,82,'Required at input 25:4','β h : P');
for(const y of[300,460])for(const d of[`M272 ${y} H376`,`M730 ${y} H806`])parts.push(`<path class="wire" d="${d}" marker-end="url(#arrow)"/>`);
parts.push('<path class="wire" d="M1075 300 H1090 V570 H1040 V596" marker-end="url(#arrow)"/><path class="wire" d="M943 502 V596" marker-end="url(#arrow)"/>');
card(result,'value',22,600,1053,65,'Rebuilt call 25','r := t P Q (α e) (β h) : Q');
parts.push(text(22,710,'A and C name the recorded produced propositions. Source ports and computed fields stay distinct.','caption'),text(22,739,'Full Riccati interface: 35 boundary inputs + 6 adapters; original context 10 → 0. This adds assumptions.','caption'));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 760" role="group" aria-labelledby="title desc"><title id="title">Explicit proof adapters at a Riccati transport step</title><desc id="desc">Two computed proofs have types A and C. Supplied adapter functions produce the equality and premise required by a chosen transport head. Ten links select original source connections and exact computed fields. Only the two adapted input wires are drawn; the complete application is shown below.</desc><style>svg{--paper:#fff;--ink:#202124;--muted:#535d68;--line:#697785;--pale:#f2f5f8;background:var(--paper)}@media(prefers-color-scheme:dark){svg{--paper:#191b1e;--ink:#eceff2;--muted:#b7c1ca;--line:#9aa9b7;--pale:#252a30}}text{fill:var(--ink)}.title{font:26px Georgia,serif}.math{font:20px Georgia,serif}.label{font:15px Arial,sans-serif}.caption{font:15px Arial,sans-serif;fill:var(--muted)}.box{fill:var(--pale);stroke:var(--line);stroke-width:1.4}.adapter{stroke-dasharray:6 4}.wire{fill:none;stroke:var(--line);stroke-width:1.8}a:focus .box,a:hover .box{stroke:var(--ink);stroke-width:3}a:focus{outline:2px solid var(--ink)}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--line)"/></marker></defs>${parts.join('\n')}</svg>\n`;
const report={format:'ProofAtlasRegionInputAdapterFigure/1',status:'PASS',source:p.source,links,nativeSha256:sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),nativeCaseSha256:d.nativeCaseSha256,svgSha256:sha(Buffer.from(svg)),producerSha256:sha(fs.readFileSync(__filename)),scope:'Two of six supplied Riccati adapters. A and C alias recorded computed propositions; P and Q retain exact boundary positions. This is a conditional input interface, not inferred equality, semantic equivalence under arbitrary adapters or measured comprehension.'};
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(base+'adapter-wires.svg','utf8'),svg);assert.deepEqual(read(base+'figure.json.gz'),report);}else{fs.writeFileSync(base+'adapter-wires.svg',svg);fs.writeFileSync(base+'figure.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',links:links.length,adapterWires:2}));
