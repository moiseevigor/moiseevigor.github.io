/* Field fidelity and independent lexical/partition checks for authored controls. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),A=require('../public/js/proof-atlas-library-data'),G=require('../public/js/proof-atlas-geometry-core'),D=require('../public/js/proof-atlas-constructor-diagram'),E=require('../public/js/proof-atlas-manual-examples');
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/lean-expr-grammar.js','utf8'),{window:h});const rules=JSON.parse(JSON.stringify(h.PROOF_ATLAS_GRAMMAR.kinds));
let fields=0,cuts=0,scopeLinks=0,negativeControls=0;
for(const rule of rules){const m=D.model(rule);assert.deepEqual(m.fields.map(f=>f.name),rule.fields.map(f=>f.name));assert.deepEqual(m.fields.filter(f=>f.link==='expr').map(f=>f.name),G.vocabulary[rule.kind].ports.map(p=>p==='domain'?'binderType':p));for(const f of m.fields){assert.equal(f.scope,f.link==='expr'?(f.name==='body'&&['lam','forallE','letE'].includes(rule.kind)?'Γ + binder':'Γ'):null);fields++;}const html=D.html(rule);assert.equal((html.match(/data-field=/g)||[]).length,rule.fields.length);}
assert.equal(rules.length,12);assert.deepEqual(D.model(rules.find(k=>k.kind==='letE')).fields.filter(f=>f.link==='expr').map(f=>f.name),['type','value','body']);
assert.throws(()=>D.model({fields:[{link:'invented'}]}),/Unknown/);negativeControls++;
assert(!D.html({kind:'<script>',fields:[{name:'<img>',type:'<b>',link:'payload'}]}).includes('<script>'));
function binding(d,r){let id=d.roots[r.root];const stack=[];for(let at=0;at<r.slots.length;at++){const slot=r.slots[at],kind=A.kinds[d.kind[id]];if((kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2)stack.unshift({node:id,path:A.path(d,{root:r.root,slots:r.slots.slice(0,at)})});id=d.children[id][slot];}return stack[d.payloads[id].index];}
for(const id of E.ids){const x=E.example(id),d=x.data;for(let i=0;i<d.kind.length;i++)if(d.kind[i]===3)A.compileLevels([d.payloads[i].level]);
 const raw=G.create(d,x.record,{route:{root:0,slots:[]},maxNodes:18,maxDepth:4});
 const routes=[{root:0,slots:[]},...raw.nodes.filter(n=>n.kind==='bvar').map(n=>n.route)];
 for(const route of routes)for(const fold of [false,true])for(let depth=0;depth<=4;depth++){
  const s=G.create(d,x.record,{route,maxNodes:18,maxDepth:depth,foldBinders:fold,foldApplications:fold,maxApplicationChildren:3,maxLayerNodes:5});assert(G.validate(s,d,x.record));assert(s.nodes.length<=18);assert.equal(BigInt(s.stats.represented),BigInt(d.expanded[A.walk(d,route)]));assert.equal(s.nodes.reduce((n,v)=>n+BigInt(v.retainedOccurrences||1)+BigInt(v.hidden),0n),BigInt(s.stats.represented));
  for(const n of s.nodes)assert.equal(A.walk(d,n.route),n.node);
  for(const l of s.links)if(l.relation==='bound-to'){const n=s.nodes.find(n=>n.id===l.from),b=binding(d,n.route);assert.equal(l.target,b.path);assert.equal(l.node,b.node);scopeLinks++;}
  const changed=JSON.parse(JSON.stringify(s));changed.stats.hidden='999999';assert.throws(()=>G.validate(changed,d,x.record),/changed/);negativeControls++;cuts++;
 }
 if(id==='scope'||id==='let'){const refs=raw.nodes.filter(n=>n.kind==='bvar');assert.equal(refs.length,2);assert.equal(refs[0].node,refs[1].node);assert.notEqual(binding(d,refs[0].route).path,binding(d,refs[1].route).path);const focused=G.create(d,x.record,{route:refs[1].route,maxNodes:1,maxDepth:0});assert.equal(focused.links[0].boundary,true);}
 if(id==='scale')assert.equal(raw.stats.represented,((1n<<61n)-1n).toString());
}
console.log(JSON.stringify({status:'PASS',constructors:rules.length,semanticFields:fields,examples:E.ids.length,cuts,scopeLinks,negativeControls,scope:'Authored structural controls and pinned-field presentation. No new native checks, semantic equivalence or comprehension measurements.'}));
