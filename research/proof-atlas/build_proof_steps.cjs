/* Build a reviewed passage index from immutable compiled packets, retaining occurrence paths. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const ROOT=path.resolve(__dirname,'../..'),A=require('../../public/js/proof-atlas-library-data');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const w={};vm.runInNewContext(fs.readFileSync(path.join(ROOT,'public/data/proof-atlas/library-manifest.js'),'utf8'),{window:w});
const edition=w.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15'),records=new Map(edition.declarations.map(d=>[d.name,d]));
const source=fs.readFileSync(path.join(ROOT,'public/research/se2/conjugate_times_se2.tex'),'utf8'),review=JSON.parse(fs.readFileSync(path.join(__dirname,'proof-step-map.json')));
const loaded=new Map(),packets=new Map();
function load(name){if(!loaded.has(name)){const r=records.get(name);assert(r,'Missing compiled declaration '+name);const bytes=zlib.gunzipSync(fs.readFileSync(path.join(ROOT,r.indexFile)));assert.equal(sha(bytes),r.indexSha256);loaded.set(name,A.validateIndex(JSON.parse(bytes),r));}return loaded.get(name);}
function spine(d,i){const args=[];while(d.kind[i]===5){args.unshift(d.children[i][1]);i=d.children[i][0];}return{head:i,args,name:d.kind[i]===4?d.payloads[i].name:null};}
function telescope(d){let i=d.roots[0],arity=0;while(d.kind[i]===7){arity++;i=d.children[i][1];}return{node:i,arity};}
function occurrences(d,root,selected){
 // Prune by shared-node reachability, then enumerate only indexed occurrence paths.
 const has=[];for(let i=0;i<d.kind.length;i++)has[i]=selected.has(i)||d.children[i].some(c=>has[c]);
 const out=[],stack=[{node:d.roots[root],slots:[]}];while(stack.length){const r=stack.pop();if(!has[r.node])continue;if(selected.has(r.node))out.push({node:r.node,route:{root,slots:r.slots}});d.children[r.node].forEach((c,j)=>{if(has[c])stack.push({node:c,slots:[...r.slots,j]});});assert(out.length<20000,'Unexpected mapping expansion');}return out;
}
const passages=[],anchors=[];
for(const step of review.steps){
 const start=source.indexOf(step.raw);assert(start>=0);assert.equal(source.indexOf(step.raw,start+1),-1,'Ambiguous article excerpt');
 assert.deepEqual(step.sourceLines,[source.slice(0,start).split('\n').length,source.slice(0,start+step.raw.length).split('\n').length]);
 const passage={...step,excerptSha256:sha(step.raw)};delete passage.anchors;delete passage.selection;passage.declarations=[...new Set(step.anchors.map(a=>a.declaration))];passage.defaultDeclaration=step.selection;passages.push(passage);
 for(const spec of step.anchors){
  const d=load(spec.declaration),r=records.get(spec.declaration);packets.set(r.name,{name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256});
  let nodes,root=spec.selector==='conclusion'?0:1,arity;
  if(spec.selector==='proof'){nodes=[d.roots[1]];while(d.kind[nodes[0]]===6)nodes=[d.children[nodes[0]][1]];}
  else if(spec.selector==='conclusion')nodes=[telescope(d).node];
  else if(spec.selector==='node'){nodes=[spec.node];assert.equal(A.kinds[d.kind[spec.node]],spec.expectedKind);arity=spec.arity;if(spec.callee){const s=spine(d,spec.node);assert.equal(s.name,spec.callee);assert.equal(s.args.length,arity);}}
  else if(spec.selector==='call'){
   arity=spec.arity??telescope(load(spec.callee)).arity;
   nodes=A.reachable(d,d.roots[1]).filter(i=>{const s=spine(d,i);return d.kind[i]===5&&s.name===spec.callee&&s.args.length===arity;});
   assert(nodes.length,'Missing fully applied proof call: '+JSON.stringify(spec));
  }else throw Error('Unknown mapping selector');
  for(const occurrence of occurrences(d,root,new Set(nodes))){const node=occurrence.node,scope=spec.selector==='conclusion'?'statement':'proof';
   anchors.push({declaration:r.name,step:step.id,path:A.path(d,occurrence.route),node,kind:A.kinds[d.kind[node]],role:spec.selector,scope,callee:spec.callee||null,arity:arity??null,subtreeSha256:sha(JSON.stringify({kind:d.kind[node],children:d.children[node],payload:d.payloads[node]}))});
  }
 }
}
for(const p of passages){const choices=anchors.filter(a=>a.step===p.id&&a.declaration===p.defaultDeclaration);p.defaultPath=(choices.find(a=>a.path.startsWith('root.value'))||choices[0])?.path||null;assert(p.status==='unmapped'||p.defaultPath,'Missing default exact path for '+p.id);}
const result={format:'ProofAtlasProofSteps/1',articleSha256:sha(source),edition:'published-15',method:'Reviewed exact article excerpts linked to checksum-bound compiled occurrence paths. Complete named theorem calls are identified by application spine and declaration telescope. Descendants retain proof-step context; prose equivalence is not kernel certified.',scope:'Theorems 3.4 and 4.1: scalar clauses and proof steps. Conditional Jacobi hypotheses and finite tangencies remain explicit; analytic exclusions are indexed without invented proofs.',packets:[...packets.values()],passages,anchors};
fs.writeFileSync(path.join(ROOT,'public/data/proof-atlas/article-proof-steps.js'),'/* Source-bound proof-step correspondence; compiled data only. */\nwindow.PROOF_ATLAS_PROOF_STEPS='+JSON.stringify(result)+';\n');
console.log(JSON.stringify({status:'PASS',passages:passages.length,conditional:passages.filter(p=>p.status==='partial').length,unmapped:passages.filter(p=>p.status==='unmapped').length,anchors:anchors.length,declarations:packets.size}));
