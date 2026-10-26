/* Source paths and bindings are reconstructed independently of the new producer. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),vm=require('vm'),assert=require('assert/strict'),J=require('../public/js/proof-atlas-judgment-geometry'),R=require('../public/js/proof-atlas-local-refinement'),C=require('../public/js/proof-atlas-cut-certificate'),raw=require('./test-proof-atlas-judgment-audit.cjs'),{sources}=require('./proof-atlas-judgment-fixtures.cjs');
const key=r=>r.root+':'+r.slots.join('.'),folder=process.env.ATLAS_CUT_RECORDS||'/tmp/atlas-cut-records';
function inspect(cert,scene,data,record){
 C.validate(cert,scene,data,record);assert(Object.isFrozen(cert)&&Object.isFrozen(cert.entries)&&Object.isFrozen(cert.entries[0]));let retained=0,hidden=0n;
 for(const entry of cert.entries){const route={root:cert.root.route.root,slots:[...cert.root.route.slots,...entry.slots]},at=raw.occurrence(data,route);assert.equal(entry.node,at.node);
  if(entry.tag==='hole'){hidden+=BigInt(data.expanded[entry.node]);assert.equal(entry.occurrences,data.expanded[entry.node]);continue;}
  retained++;assert.equal(entry.children.length,data.children[entry.node].length);
  if(entry.binding){const binder=at.binders.at(-1-data.payloads[entry.node].index),t=entry.binding.target;assert.equal(Boolean(t),Boolean(binder));if(t){const b=t.entry!==undefined?cert.entries[t.entry]:cert.external[t.external],r=t.entry!==undefined?{root:cert.root.route.root,slots:[...cert.root.route.slots,...b.slots]}:b.route;assert.equal(b.node,binder.node);assert.deepEqual(r,binder.route);}}
 }
 assert.equal(String(retained),scene.stats.retainedOccurrences);assert.equal(String(hidden),scene.stats.hidden);assert.equal(String(BigInt(retained)+hidden),scene.stats.represented);
 assert(Buffer.byteLength(JSON.stringify(cert))<=C.limits.encodedBytes);
}
(async()=>{fs.mkdirSync(folder,{recursive:true});let inventories=0,initialCuts=0,refinedCuts=0,selectedCuts=0,entries=0,bindings=0,externalTargets=0,depthCounterexamples=0;let control,linkControl,contextControl,edgeControl;
 for await(const x of sources()){
  const value=x.data.declaration.rootPaths.indexOf('root.value'),requests=[],refinements=[],rejectedRefinements=[];
  for(const policy of ['proof-first','proof-focus','source-order'])for(const group of ['none','introductions','context'])for(const fallback of [false,true]){
   const scene=J.create(x.data,x.record,x.resolve,{judgmentRoute:{root:value<0?0:value,slots:[]},maxNodes:13,maxDepth:3,policy,foldIntroductions:group==='introductions',foldContextFrames:group==='context',sourceFallback:fallback});J.validate(scene,x.data,x.record,x.resolve);
   const certificate=C.create(scene,x.data,x.record);inspect(certificate,scene,x.data,x.record);if(scene.links.length)linkControl??={x,scene};if(scene.edges.length)edgeControl??={x,scene};if(scene.nodes.some(n=>n.context.length))contextControl??={x,scene};const baseIndex=requests.length;requests.push(certificate);initialCuts++;control??={x,scene,certificate};
   const state=R.start(scene,x.data,x.record);
   for(const row of state.ledger.rows.slice(0,2)){
    const options={judgmentRoute:row.route,maxNodes:4,maxDepth:1,policy,sourceFallback:fallback,foldIntroductions:group==='introductions',foldContextFrames:group==='context',...(row.typeReference?{rootInterface:{node:row.node,path:row.path,route:row.route,role:row.role,reference:row.typeReference}}:{})};
    const child=J.create(x.data,x.record,x.resolve,options),next=R.expand(state,row.path,child,x.data,x.record),c=C.create(next.scene,x.data,x.record);inspect(c,next.scene,x.data,x.record);C.refinement(certificate,c);refinements.push([baseIndex,requests.length]);requests.push(c);refinedCuts++;
   }
  }
  for(const selected of x.routes.values()){
   const scene=J.create(x.data,x.record,x.resolve,{judgmentRoute:selected,maxNodes:13,maxDepth:3,policy:'proof-focus',foldContextFrames:true,sourceFallback:true});
   const certificate=C.create(scene,x.data,x.record);inspect(certificate,scene,x.data,x.record);requests.push(certificate);selectedCuts++;
  }
  if(['JacobiCore.E_pos','AtlasExamples.nat_self'].includes(x.record.name)){
   const options={judgmentRoute:{root:value,slots:[]},policy:'proof-focus',sourceFallback:x.record.name==='JacobiCore.E_pos',maxNodes:8},a=J.create(x.data,x.record,x.resolve,{...options,maxDepth:2}),b=J.create(x.data,x.record,x.resolve,{...options,maxDepth:3}),ca=C.create(a,x.data,x.record),cb=C.create(b,x.data,x.record);
   inspect(ca,a,x.data,x.record);inspect(cb,b,x.data,x.record);assert.throws(()=>C.refinement(ca,cb),/visible source path/);depthCounterexamples++;
   const pair=[requests.length,requests.length+1];requests.push(ca,cb);rejectedRefinements.push(pair);
  }
  for(const c of requests){entries+=c.entries.length;bindings+=c.stats.boundVariables;externalTargets+=c.entries.filter(e=>e.binding?.target?.external!==undefined).length;}
  const input={expected:{name:x.record.name,indexSha256:x.record.indexSha256,sourceSha256:x.record.sourceSha256,uniqueNodes:x.record.uniqueNodes},packetFile:path.resolve('.'+x.record.indexFile),records:requests,refinements,rejectedRefinements};fs.writeFileSync(path.join(folder,'source-'+inventories+'.json'),JSON.stringify(input));inventories++;
 }
 const scopeSource={serialization:'ExprDAG/1',declaration:{name:'AtlasCutControls.shared_domain',rootPaths:['root.value'],kernelCheck:'not-claimed'},kind:[3,0,6,6],children:[[],[],[1,1],[0,2]],payloads:[{level:{kind:'zero'}},{index:0},{binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},{binderName:'A',binderNameParts:[{str:'A'}],binderInfo:'default'}],expanded:['1','1','3','5'],neededScope:[0,1,1,0],roots:[3]};
 const scopeBytes=Buffer.from(JSON.stringify(scopeSource)),hash=b=>crypto.createHash('sha256').update(b).digest('hex'),scopeRecord={name:scopeSource.declaration.name,indexSha256:hash(scopeBytes),sourceSha256:hash(fs.readFileSync(__filename)),uniqueNodes:4};
 const scopeScene=J.create(scopeSource,scopeRecord,()=>null,{judgmentRoute:{root:0,slots:[]},maxNodes:8,maxDepth:3,sourceFallback:true}),scopeCert=C.create(scopeScene,scopeSource,scopeRecord);inspect(scopeCert,scopeScene,scopeSource,scopeRecord);
 const uses=scopeCert.entries.filter(e=>e.constructor==='bvar');assert.equal(uses.length,2);assert.equal(uses[0].node,uses[1].node);assert.deepEqual(uses[0].binding.target,{entry:0});assert.deepEqual(uses[1].binding.target,{entry:2});
 entries+=scopeCert.entries.length;bindings+=scopeCert.stats.boundVariables;
 const scopeFile=path.join(folder,'scope-packet.json.gz');fs.writeFileSync(scopeFile,z.gzipSync(scopeBytes));fs.writeFileSync(path.join(folder,'source-scope-control.json'),JSON.stringify({expected:scopeRecord,packetFile:scopeFile,records:[scopeCert],refinements:[]}));
 const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/boundary-controls-manifest.js','utf8'),{window:w});const bc=w.PROOF_ATLAS_BOUNDARY_CONTROLS,T=require('../public/js/proof-atlas-occurrence-types'),P=require('../public/js/proof-atlas-projections'),read=d=>JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file))),bd={...read(bc.packet),serialization:'ExprDAG/1'},bp=P.provider(read(bc.types),bd,bc.record,bc.types.sha256,bc.types.file),bw=T.provider(read(bc.witness),bd,bc.record,bc.witness),resolve=r=>bw.get(r)?bw:bp;
 const bs=J.create(bd,bc.record,resolve,{judgmentRoute:{root:1,slots:[1]},maxNodes:1,maxDepth:0,policy:'proof-focus'}),before=C.create(bs,bd,bc.record),state=R.start(bs,bd,bc.record),region=state.ledger.rows[0];
 const part=J.create(bd,bc.record,resolve,{judgmentRoute:region.route,maxNodes:4,maxDepth:1,policy:'proof-focus',rootInterface:{node:region.node,path:region.path,route:region.route,role:region.role,reference:region.typeReference}}),next=R.expand(state,region.path,part,bd,bc.record),after=C.create(next.scene,bd,bc.record);inspect(before,bs,bd,bc.record);inspect(after,next.scene,bd,bc.record);C.refinement(before,after);assert.equal(after.stats.represented,'9671406556917033397649412');
 entries+=before.entries.length+after.entries.length;bindings+=before.stats.boundVariables+after.stats.boundVariables;
 fs.writeFileSync(path.join(folder,'source-value-control.json'),JSON.stringify({expected:{name:bc.record.name,indexSha256:bc.record.indexSha256,sourceSha256:bc.record.sourceSha256,uniqueNodes:bc.record.uniqueNodes},packetFile:path.resolve('.'+bc.packet.file),records:[before,after],refinements:[[0,1]]}));
 assert.equal(inventories,35);assert.equal(initialCuts,630);assert.equal(refinedCuts,1260);const {x,scene,certificate}=control;let negativeControls=0;
 for(const change of [c=>c.source.indexSha256='0'.repeat(64),c=>c.root.node=-1,c=>c.entries[0].node=-1,c=>c.entries[0].constructor='other',c=>c.entries[0].owner=31,c=>c.stats.retained='0',c=>c.stats.hidden='0',c=>c.entries.pop(),c=>c.cards[0].retained='0']){const c=structuredClone(certificate);change(c);assert.throws(()=>C.validate(c,scene,x.data,x.record));negativeControls++;}
 for(const bad of [()=>C.create(scene,x.data,{...x.record,sourceSha256:'0'.repeat(64)}),()=>C.create(scene,x.data,x.record,{maxEntries:1}),()=>C.create(scene,x.data,x.record,{maxBytes:1024}),()=>C.create({...scene,root:{...scene.root,namespace:'type-expression'}},x.data,x.record)]){assert.throws(bad);negativeControls++;}
 assert(linkControl&&contextControl&&edgeControl);
 for(const change of [s=>s.links[0].namespace='computed-term',s=>s.links[0].relation='implies',s=>s.links[0].to='wrong-source-path']){const s=structuredClone(linkControl.scene);change(s);assert.throws(()=>C.create(s,linkControl.x.data,linkControl.x.record));negativeControls++;}
 const badContext=structuredClone(contextControl.scene);badContext.nodes.find(n=>n.context.length).context[0].node=-1;assert.throws(()=>C.create(badContext,contextControl.x.data,contextControl.x.record));negativeControls++;
 const badEdge=structuredClone(edgeControl.scene);badEdge.edges[0].scopeExtension++;assert.throws(()=>C.create(badEdge,edgeControl.x.data,edgeControl.x.record));negativeControls++;
 const report={status:'PASS',inventories,initialCuts,refinedCuts,selectedCuts,syntheticScopeControls:1,hugeValueControlRecords:2,selectedHugeOccurrences:after.stats.represented,depthCounterexamples,entries,bindings,externalTargets,negativeControls,packetRequests:folder,limits:C.limits,scope:'Structural source records of bounded displayed cuts, including lexical targets. No native typing, formally verified decoder or comprehension claim.'};fs.writeFileSync('/tmp/atlas-cut-certificate.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
