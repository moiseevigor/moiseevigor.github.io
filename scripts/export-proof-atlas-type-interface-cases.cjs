/* Emit actual source-cut interfaces for the independent raw-record checker. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const J=require('../public/js/proof-atlas-judgment-geometry'),R=require('../public/js/proof-atlas-local-refinement'),{sources}=require('./proof-atlas-judgment-fixtures.cjs');
const key=r=>r.root+':'+r.slots.join('.');
const output=process.argv[2]||'/tmp/atlas-type-interfaces/cases.json';
const cases=[];
function expansion(x,options,selected=null){
 const scene=J.create(x.data,x.record,x.resolve,options),state=R.start(scene,x.data,x.record);
 const rows=selected?[state.ledger.rows.find(r=>key(r.route)===key(selected))]:state.ledger.rows.slice(0,2);
 for(const row of rows){
  assert(row);if(selected)assert(row.typeReference);
  const child=J.create(x.data,x.record,x.resolve,{...options,judgmentRoute:row.route,maxNodes:4,maxDepth:1,...(row.typeReference?{rootInterface:{node:row.node,path:row.path,route:row.route,role:row.role,reference:row.typeReference}}:{})});
  const node=child.nodes[0],next=R.expand(state,row.path,child,x.data,x.record),edge=next.scene.edges.find(e=>e.from===row.path&&e.to===row.origin.path);
  assert(edge);cases.push({source:x.record,boundary:row,child:{node:node.node,path:node.id,route:node.route,role:node.role,context:node.context,typeReference:node.typeReference},rootInterface:child.rootInterface||null,edge,...(selected?{selectedSharedNodeControl:true}:{})});
 }
}
(async()=>{
 let packets=0;
 for await(const x of sources()){
  packets++;const root=x.data.declaration.rootPaths.indexOf('root.value');
  if(x.record.name==='JacobiCore.E_pos'&&x.edition==='published-15'){
   for(const [parent,selected]of [[[1,1],[1,1,0,0,0,1]],[[1,2],[1,2,1]]])expansion(x,{judgmentRoute:{root:1,slots:parent},maxNodes:1,maxDepth:0,policy:'source-order',sourceFallback:true},{root:1,slots:selected});
  }
  for(const policy of ['proof-first','proof-focus','source-order'])for(const grouping of ['none','introductions','context'])for(const sourceFallback of [false,true]){
   expansion(x,{judgmentRoute:{root:root<0?0:root,slots:[]},maxNodes:13,maxDepth:3,policy,foldIntroductions:grouping==='introductions',foldContextFrames:grouping==='context',sourceFallback});
  }
 }
 assert.equal(packets,34);assert.equal(cases.length,1226);
 const packet={format:'ProofAtlasTypeInterfaceCases/1',packets,cases,scope:'Actual producer output. Validate source paths, native-record references and type syntax independently; no new kernel typing claimed.'},raw=JSON.stringify(packet)+'\n';
 assert(Buffer.byteLength(raw)<=64*1024**2);fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,raw);
 console.log(JSON.stringify({status:'PASS',packets,cases:cases.length,typedInterfaces:cases.filter(c=>c.boundary.typeReference).length,output,sha256:crypto.createHash('sha256').update(raw).digest('hex')}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
