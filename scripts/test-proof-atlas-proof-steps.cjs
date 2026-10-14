/* Audit literal passages, every path/call, specificity, scope and stale-index controls. */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),create=require('../public/js/proof-atlas-proof-step-index').create;
const root=path.resolve(__dirname,'..'),w={};for(const f of ['article-proof-steps','library-manifest'])vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/proof-atlas/'+f+'.js'),'utf8'),{window:w});
const I=w.PROOF_ATLAS_PROOF_STEPS,source=fs.readFileSync(path.join(root,'public/research/se2/conjugate_times_se2.tex'),'utf8'),page=fs.readFileSync(path.join(root,'projects/proof-atlas/article/index.html'),'utf8');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),index=create(I,sha(source));assert(index.valid);
for(const p of I.passages){assert(source.includes(p.raw));assert.equal(sha(p.raw),p.excerptSha256);assert(source.split('\n').slice(p.sourceLines[0]-1,p.sourceLines[1]).join('\n').includes(p.raw));assert(page.includes('id="'+p.id+'"'));assert(['lem:identities','lem:riccati','lem:crossing','thm:first','thm:cells','app:lean'].includes(p.articleAnchor));if(p.status==='unmapped')assert(!I.anchors.some(a=>a.step===p.id));}
const records=new Map(w.PROOF_ATLAS_LIBRARY.editions[0].declarations.map(r=>[r.name,r])),data=new Map();
for(const p of I.packets){const r=records.get(p.name),bytes=zlib.gunzipSync(fs.readFileSync(path.join(root,r.indexFile)));assert.equal(sha(bytes),p.indexSha256);assert.equal(r.indexSha256,p.indexSha256);assert.equal(r.sourceSha256,p.sourceSha256);data.set(p.name,A.validateIndex(JSON.parse(bytes),r));}
// Every named counterpart in the five partial statement records has an exact
// indexed proof/statement path. This checks index scope, not theorem completeness.
const review=JSON.parse(fs.readFileSync(path.join(root,'research/proof-atlas/article-coverage-map.json')));
const counterparts=review.statements.filter(t=>t.status==='partial').flatMap(t=>t.declarations.map(d=>d.name));
assert(counterparts.every(name=>I.packets.some(p=>p.name===name)));
assert.deepEqual(review.statements.filter(t=>t.status==='not-formalized').map(t=>t.id),['coincident','floquet','late-folds','separatrix']);
const argument=require('../public/js/proof-atlas-riccati-geometry').model(I);
assert.equal(argument.nodes.length,9);assert.equal(argument.edges.length,6);
for(const edge of argument.edges){
 const from=argument.nodes.find(n=>n.id===edge.from),to=argument.nodes.find(n=>n.id===edge.to);
 assert.equal(edge.anchor.callee,from.declaration);assert.equal(edge.anchor.declaration,to.declaration);
 assert(I.anchors.includes(edge.anchor));
}
let calls=0;
for(const a of I.anchors){const d=data.get(a.declaration),r=records.get(a.declaration),found=index.route(d,a.path,A),snapshot={edition:I.edition,name:a.declaration,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256,path:a.path};assert.equal(found.node,a.node);assert.equal(A.path(d,found.route),a.path);assert.equal(sha(JSON.stringify({kind:d.kind[a.node],children:d.children[a.node],payload:d.payloads[a.node]})),a.subtreeSha256);index.validate(snapshot,d,A);const match=index.resolve(snapshot);assert(match.some(m=>m.passage.id===a.step&&!m.inherited));if(a.role==='call'){calls++;let node=a.node,n=0;while(d.kind[node]===5){n++;node=d.children[node][0];}assert.equal(d.payloads[node].name,a.callee);assert.equal(n,a.arity);if(records.has(a.callee)){const r=records.get(a.callee),c=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(root,r.indexFile))));let i=c.roots[0],arity=0;while(c.kind[i]===7){arity++;i=c.children[i][1];}assert.equal(n,arity,'Partial applications are not completed proof calls');}}
 for(let j=0;j<d.children[a.node].length;j++){const route={root:found.route.root,slots:[...found.route.slots,j]},path=A.path(d,route);assert(index.resolve({...snapshot,path}).length,'Indexed child loses its proof step');}
}
const cells=I.anchors.find(a=>a.callee==='JacobiFull.J2_neg_gap'),r=records.get(cells.declaration),snap={edition:I.edition,name:cells.declaration,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256,path:cells.path};assert.equal(index.resolve(snap)[0].passage.id,'step-cells-gap');assert.equal(index.resolve({...snap,path:cells.path+'.arg'})[0].passage.id,'step-cells-gap');assert(index.resolve({...snap,path:cells.path+'.arg'})[0].inherited);
assert.equal(create(I,'0'.repeat(64)).valid,false);assert.throws(()=>index.resolve({...snap,indexSha256:'0'.repeat(64)}),/Stale/);
for(const change of ['path','node','arity']){const bad=JSON.parse(JSON.stringify(I)),a=bad.anchors.find(a=>a.callee==='JacobiFull.J2_neg_gap');if(change==='path')a.path+='.'+'arg';if(change==='node')a.node--;if(change==='arity')a.arity++;const b=create(bad,I.articleSha256);assert.throws(()=>b.validate(snap,data.get(snap.name),A),/mismatch|incomplete|changed/);}
// Mapping metrics count occurrence subtrees without unfolding shared expressions.
const coverage=[];for(const name of ['JacobiFull.exact_first_time','JacobiFull.first_time_complete','JacobiFull.cell_roots','JacobiFull.coincide_imp']){const d=data.get(name),paths=[...new Set(I.anchors.filter(a=>a.declaration===name&&a.scope==='proof').map(a=>a.path))];const top=paths.filter(p=>!paths.some(q=>p!==q&&p.startsWith(q+'.')));const mapped=top.reduce((n,p)=>n+BigInt(d.expanded[index.route(d,p,A).node]),0n);coverage.push({declaration:name,indexedProofOccurrences:mapped.toString(),totalProofOccurrences:d.expanded[d.roots[1]]});}
console.log(JSON.stringify({status:'PASS',articlePassages:I.passages.length,conditionalSteps:I.passages.filter(p=>p.status==='partial').length,explicitUnmappedSteps:I.passages.filter(p=>p.status==='unmapped').length,exactAnchors:I.anchors.length,compiledDeclarations:I.packets.length,completedProofCalls:calls,negativeControls:5,riccatiGeometry:{nodes:argument.nodes.length,completedCallEdges:argument.edges.length},coverage}));
