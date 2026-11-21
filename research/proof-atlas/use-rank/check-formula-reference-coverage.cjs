// Measure visible references and the exact source regions concealing the rest.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const notation=require('../../../public/js/proof-atlas-type-notation');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const window={};
for(const name of ['type-notation-catalog','goedel-sample-manifest','library-manifest'])
 vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window});
const examples=new Set(require('./port-results.json').map(r=>r.source.indexSha256));
function measure(record){
 const raw=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
 assert.equal(createHash('sha256').update(raw).digest('hex'),record.indexSha256);
 const data=A.validateIndex(JSON.parse(raw),record),root=data.roots[0];
 const inventory=new Map(),seen=new Set(),mass=[];
 for(let i=0;i<=root;i++)mass[i]=data.children[i].reduce((s,c)=>s+mass[c],Number(data.kind[i]===0));
 function enumerate(node,slots){
  if(data.kind[node]===0)inventory.set(slots.join('.'),A.binding(data,{root:0,slots}));
  data.children[node].forEach((child,j)=>enumerate(child,slots.concat(j)));
 }
 enumerate(root,[]);assert.equal(inventory.size,mass[root]);
 const address=(node,slots)=>({namespace:'statement',node,route:{root:0,slots}});
 const queue=[{node:root,slots:[],depth:0}];
 const omitted={notation:new Set(),collapsed:new Set()};
 let first,maxDepth=0,visibleNodes=0;
 for(let i=0;i<queue.length;i++){
  const region=queue[i];
  const ctx=context(data,{root:0,slots:region.slots}).binders.map(b=>({
   name:data.payloads[b.node].binderName??data.payloads[b.node].declName,address:address(b.node,b.route.slots)}));
  const scene=notation.scene(data,region.node,window.PROOF_ATLAS_TYPE_NOTATION,{slots:region.slots,context:ctx,address});
  const counts={visible:0,collapsed:0,notation:0};
  maxDepth=Math.max(maxDepth,region.depth);
  visibleNodes+=scene.stats.nodes;
  function hidden(node,slots,kind){
   assert.equal(A.walk(data,{root:0,slots}),node);
   if(i===0)for(const path of inventory.keys()){
    const prefix=slots.join('.');
    if(path===prefix||path.startsWith(prefix+'.'))omitted[kind].add(path);
   }
   counts[kind]+=mass[node];
   if(!mass[node])return;
   assert(slots.length>region.slots.length);
   queue.push({node,slots,depth:region.depth+1});
  }
  function inspect(term){
   if(term.kind==='reference'){
    const key=term.slots.join('.'),binder=inventory.get(key),target=term.head.target.address??term.head.target.origin;
    assert(binder&&!seen.has(key));assert.equal(binder.node,target.node);assert.deepEqual(binder.route,target.route);
    counts.visible++;seen.add(key);
   }
   if(term.kind==='frontier')hidden(term.origin.node,term.slots,'collapsed');
   for(const port of [...(term.hiddenPorts??[]),...(term.foldedPorts??[])])hidden(port.node,port.slots,'notation');
   term.children.forEach(c=>inspect(c.value));
  }
  inspect(scene.root);
  assert.equal(counts.visible+counts.collapsed+counts.notation,mass[region.node]);
  if(i===0)first=counts;
 }
 assert.equal(seen.size,inventory.size);
 const groups=require('../../../public/js/proof-atlas-omitted-references').inspect(data,window.PROOF_ATLAS_TYPE_NOTATION);
 for(const g of groups)for(let n=1n;n<=g.total;n++){
  const {use,binder}=g.select(n),path=use.route.slots.join('.');
  assert(omitted[g.kind].delete(path));assert.equal(use.node,A.walk(data,use.route));
  assert.deepEqual(binder,inventory.get(path));
 }
 assert.equal(omitted.notation.size,0);assert.equal(omitted.collapsed.size,0);
 return {name:record.name,source:record.indexSha256,total:inventory.size,first,panels:queue.length,maxDepth,visibleNodes};
}
const sample=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations;
const published=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.filter(r=>r.kind==='theorem');
const proofs=sample.map(r=>({...measure(r),group:examples.has(r.indexSha256)?'development':'held-out'}));
const project=published.map(measure);
function summary(rows){
 const sum=f=>rows.reduce((n,r)=>n+f(r),0);
 return {theorems:rows.length,total:sum(r=>r.total),visible:sum(r=>r.first.visible),
  collapsed:sum(r=>r.first.collapsed),notation:sum(r=>r.first.notation),
  panels:sum(r=>r.panels),maxPanels:Math.max(...rows.map(r=>r.panels)),maxDepth:Math.max(...rows.map(r=>r.maxDepth)),
  withHiddenNotation:sum(r=>Number(r.first.notation>0)),fullyVisible:sum(r=>Number(r.first.visible===r.total))};
}
console.log(JSON.stringify({proofs,development:summary(proofs.filter(x=>x.group==='development')),
 heldOut:summary(proofs.filter(x=>x.group==='held-out')),published:summary(project),
 publishedResultDigest:createHash('sha256').update(JSON.stringify(project)).digest('hex'),
 riccati:project.find(x=>x.name==='JacobiData.slope_bound_abs'),
 largestInitialNotationOmission:project.reduce((a,b)=>a.first.notation>=b.first.notation?a:b)},null,2));
