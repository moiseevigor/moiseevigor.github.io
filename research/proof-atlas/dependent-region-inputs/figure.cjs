'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), assert = require('assert/strict'), crypto = require('crypto');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/dependent-region-inputs/', sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
const native = read('native'), model = read('model-check'); assert.equal(model.status, 'PASS');
const p = native.profiles.find(p => p.source.name === 'AtlasDependentRegion.finConstructor'), c = p.native.cases.find(c => c.policy === 'all-boundary-positions');
assert.equal(c.status, 'PASS'); assert.deepEqual(c.keptContextSlots, []); assert.equal(c.independentInputs, 5);
const ports = c.bindings.map(binding => binding.port); assert.deepEqual(ports.map(p => [p.kind, p.call, p.slot ?? null]), [['input',0,0],['input',0,1],['result',0,null],['input',1,0],['input',1,2],['input',1,3],['result',1,null]]);
const observed = model.casesWithDependencies.find(row => row.source.indexSha256 === p.source.indexSha256 && row.policy === c.policy);
assert.deepEqual(observed.dependencies.map(edge => [edge.binding,edge.target]).sort(), [[5,2],[5,4],[6,2]].sort());
const nativeCaseSha256 = sha(Buffer.from(JSON.stringify(c))), links = [];
function href(binding, field, tail = [], relation = null) {
  const b = c.bindings[binding].port;
  const query = new URLSearchParams({ source: p.source.indexSha256, edition: p.source.edition, proof: p.source.name, call: String(b.call),
    ...(b.kind === 'input' ? { input: String(b.slot) } : {}), policy: c.policy, nativeCase: nativeCaseSha256, binding: String(binding), field, ...(tail.length ? {within:tail.join('.')} : {}) });
  const url = '/projects/proof-atlas/manual/paged-network/?' + query + '#ns-lab';
  links.push({ binding, field, tail, relation, href: url, source: p.source, nativeCaseSha256 }); return url;
}
const escape = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const parts = [], text = (x,y,value,cls='math') => `<text x="${x}" y="${y}" class="${cls}">${escape(value)}</text>`;
const wire = (d,type=false,edge=null) => {
  const path = `<path d="${d}" class="${type?'type-wire':'wire'}" marker-end="url(#${type?'type-arrow':'arrow'})"/>`;
  if(!edge){parts.push(path);return;}
  const dependency=observed.dependencies.find(row=>row.binding===edge[0]&&row.target===edge[1]);assert(dependency);
  const prefix=[];for(let i=0;i<edge[0];i++)prefix.push(c.bindings[i].port.kind==='input'?1:2);prefix.push(0);
  assert.deepEqual(dependency.selected.route.slots.slice(0,prefix.length),prefix);
  const link=href(edge[0],'domain',dependency.selected.route.slots.slice(prefix.length),dependency);
  parts.push(`<a href="${escape(link)}" aria-label="Inspect type reference from binding ${edge[0]} to binding ${edge[1]}" tabindex="0">${path}</a>`);
};
const cards = [
  {i:0,x:22,y:140,w:285,h:65,title:'Input 0:0',lines:['f : ℕ → ℕ'],field:'binder'},
  {i:1,x:22,y:235,w:285,h:65,title:'Input 0:1',lines:['u : ℕ'],field:'binder'},
  {i:4,x:22,y:355,w:285,h:65,title:'Input 1:2',lines:['v : ℕ'],field:'binder'},
  {i:3,x:22,y:505,w:355,h:85,title:'Input 1:0 · constructor function',lines:['c : {k : ℕ} → (v : ℕ) →','v < k → Fin k'],field:'binder'},
  {i:2,x:420,y:225,w:235,h:90,title:'Rebuilt call 0',lines:['r := f u','r : ℕ'],field:'value'},
  {i:5,x:740,y:355,w:335,h:90,title:'Input 1:3 · dependent domain',lines:['h : v < r'],field:'domain'},
  {i:6,x:740,y:535,w:335,h:90,title:'Rebuilt call 1',lines:['y := @c r v h','y : Fin r'],field:'value'}
];
parts.push(text(22,35,'Computed results can determine later input types','title'), text(22,68,'A checked finConstructor region · five supplied inputs · no retained original context','label'), text(22,99,'Solid arrows: value inputs. Dashed arrows: references inside computed type expressions.','caption'));
wire('M307 173 C365 173 365 253 416 253'); wire('M307 268 L416 268');
wire('M655 270 C690 270 700 559 736 559'); wire('M377 548 L736 584');
wire('M307 388 C355 388 530 607 736 607'); wire('M908 445 L908 531');
wire('M655 240 C690 240 690 372 736 372',true,[5,2]); wire('M307 370 C480 370 565 411 736 411',true,[5,4]);
wire('M655 298 C670 298 670 326 690 326 L1088 326 L1088 610 L1078 610',true,[6,2]);
parts.push(text(675,336,'type','caption'),text(490,385,'type','caption'),text(1010,490,'type','caption'));
for (const card of cards) {
  const url = href(card.i,card.field), label = 'Inspect '+card.title+' in its exact native function';
  parts.push(`<a href="${escape(url)}" aria-label="${escape(label)}" tabindex="0"><rect x="${card.x}" y="${card.y}" width="${card.w}" height="${card.h}" rx="4" class="box"/>${text(card.x+12,card.y+20,card.title,'label')}${card.lines.map((line,i)=>text(card.x+12,card.y+47+i*23,line,card.i===3?'smallmath':'math')).join('')}</a>`);
}
parts.push(text(22,665,'Return both original result positions. The closed result type is PProd ℕ (Fin (f u)).','caption'), text(22,695,'Each card selects its original source port and the recorded computed field. Layout has no mathematical metric.','caption'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 720" role="group" aria-labelledby="title desc"><title id="title">Dependent input domain in a checked region function</title><desc id="desc">Five inputs build two results. The later proof input h has type v less than r, where r is computed earlier. Three dashed links retain exact computed type references. Source and computed locations stay separate.</desc><style>svg{--paper:#fff;--ink:#202124;--muted:#535d68;--line:#697785;--type:#285a86;--pale:#f2f5f8;background:var(--paper)}@media(prefers-color-scheme:dark){svg{--paper:#191b1e;--ink:#eceff2;--muted:#b7c1ca;--line:#9aa9b7;--type:#9bc8ef;--pale:#252a30}}text{fill:var(--ink)}.title{font:26px Georgia,serif}.math{font:20px Georgia,serif}.smallmath{font:18px Georgia,serif}.label{font:15px Arial,sans-serif}.caption{font:15px Arial,sans-serif;fill:var(--muted)}.box{fill:var(--pale);stroke:var(--line);stroke-width:1.4}.wire,.type-wire{fill:none;stroke:var(--line);stroke-width:1.8}.type-wire{stroke:var(--type);stroke-dasharray:6 4}a:focus .box,a:hover .box{stroke:var(--type);stroke-width:3}a:focus{outline:2px solid var(--type)}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--line)"/></marker><marker id="type-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--type)"/></marker></defs>${parts.join('\n')}</svg>\n`;
const metadata = { format:'ProofAtlasDependentDomainFigure/1',status:'PASS',source:p.source,nativeCaseSha256,
  nativeSha256:sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),links,dependencies:observed.dependencies,
  svgSha256:sha(Buffer.from(svg)),producerSha256:sha(fs.readFileSync(__filename)),
  scope:'One finite checked region function with three literal computed-domain references. Human labels use the authored Fin/Nat calibration; no semantic necessity, metric geometry or comprehension claim.' };
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(base+'dependent-domain.svg','utf8'),svg);assert.deepEqual(read('figure'),metadata);}
else{fs.writeFileSync(base+'dependent-domain.svg',svg);fs.writeFileSync(base+'figure.json.gz',z.gzipSync(Buffer.from(JSON.stringify(metadata,null,2)+'\n')));}
console.log(JSON.stringify({status:'PASS',links:links.length,typeReferences:observed.dependencies.length}));
