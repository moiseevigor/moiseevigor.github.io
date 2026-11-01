/* Production range engine versus the frozen model, with real paged delivery.
 * Authored scale controls carry no invented native typing attestations. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const W=require('../../../public/js/proof-atlas-scope-comparison'),O=require('../../../public/js/proof-atlas-paged-type-operations'),M=require('../../../public/js/proof-atlas-application-ports'),L=require('../../../public/js/proof-atlas-type-pages'),T=require('../../../public/js/proof-atlas-occurrence-types'),E=require('../../../public/js/proof-atlas-equality-transport'),C=require('./model.cjs'),K=require('./certificate.cjs'),S=require('../network-streaming/pack.cjs');
const fields=['kind','children','payloads','expanded','neededScope'],copy=x=>JSON.parse(JSON.stringify(x)),encode=x=>Buffer.from(JSON.stringify(x)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const graph=()=>Object.fromEntries(fields.map(f=>[f,[]]));
function add(g,kind,payload,children=[]){const id=g.kind.length;g.kind.push(kind);g.children.push(children);g.payloads.push(payload);g.expanded.push((1n+children.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());g.neededScope.push(kind===0?payload.index+1:Math.max(0,...children.map((c,s)=>g.neededScope[c]-((kind===6||kind===7)&&s===1||kind===8&&s===2?1:0))));return id;}
function append(target,source){const offset=target.kind.length;for(let id=0;id<source.kind.length;id++)add(target,source.kind[id],copy(source.payloads[id]),source.children[id].map(child=>child+offset));return offset;}
function scale(index){
 const source=graph();let root=index===null?add(source,4,{name:'P',levels:[]}):add(source,0,{index});const type=add(source,4,{name:'T',levels:[]});
 for(let level=0;level<512;level++)root=add(source,5,{},[root,add(source,6,{binderName:'x',binderInfo:'default'},[type,root])]);
 const target=graph(),memo=new Map();
 function lift(id,depth){depth=Math.min(depth,source.neededScope[id]);const tag=id+':'+depth;if(memo.has(tag))return memo.get(tag);const kind=source.kind[id],payload=copy(source.payloads[id]);if(kind===0&&payload.index>=depth)payload.index++;
  const children=source.children[id].map((child,slot)=>lift(child,depth+((kind===6||kind===7)&&slot===1||kind===8&&slot===2?1:0))),result=add(target,kind,payload,children);memo.set(tag,result);return result;}
 let lifted;
 if(index===512){for(let id=0;id<source.kind.length;id++){const payload=copy(source.payloads[id]);if(source.kind[id]===0)payload.index++;add(target,source.kind[id],payload,[...source.children[id]]);}lifted=root;}
 else lifted=lift(root,0);
 const combined=graph();append(combined,source);const offset=append(combined,target);return{g:combined,original:root,lifted:offset+lifted,leaf:index===null?'closed constant':'bvar '+index};
}
// Uses the actual hash-checking type-page cursor and one 64-row cache.
async function pages(g){
 const files=new Map(),table=sha(encode(g)),owner=sha(Buffer.from('Authored scope scale: no native typing')),base='/public/data/proof-atlas/type-pages/'+table+'/',indexSizes={};
 const put=(suffix,value)=>{const bytes=encode(value),sha256=sha(bytes),file=base+sha256+suffix;files.set(file,bytes);return{file,sha256,bytes:bytes.length};};
 let level=0,span=1,leaves=[];
 for(let start=0;start<g.kind.length;start+=64){const nodes=[];for(let id=start;id<Math.min(start+64,g.kind.length);id++)nodes.push(fields.map(f=>g[f][id]));const part=put('.page.gz',{format:'ProofAtlasTypePage/1',typeTableSha256:table,start,nodes});leaves.push({sha256:part.sha256,bytes:part.bytes});}
 const pageCount=leaves.length;
 for(;;){const next=[];for(let start=0;start<leaves.length;start+=64){const part=put('.index.gz',{format:'ProofAtlasTypeIndex/1',level,first:start*span,children:leaves.slice(start,start+64)});indexSizes[part.sha256]=part.bytes;next.push({sha256:part.sha256,bytes:part.bytes});}if(next.length===1){leaves=next;break;}leaves=next;span*=64;level++;}
 const source={name:'AuthoredScopeScale',indexSha256:sha(Buffer.from('authored index')),sourceSha256:sha(Buffer.from('authored syntax'))};
 const manifest=put('.manifest.gz',{format:'ProofAtlasTypePages/1',typeTableSha256:table,evidenceSha256:owner,nodeCount:g.kind.length,pageCount,pageSize:64,indexLevel:level,indexRoot:leaves[0].sha256,indexSizes,source,typeDeclaration:{name:source.name+' / recorded type',rootPaths:['computed.native.type']}});
 let requests=0;
 const cursor=await L.open({...manifest,typeTableSha256:table,evidenceSha256:owner,nodes:g.kind.length},{pageLimit:1,indexLimit:2,fetcher:async file=>{assert(files.has(file),'unlisted or whole-archive request');requests++;return new Response(z.gzipSync(files.get(file)));}});
 return{cursor,requests:()=>requests};
}
const report={format:'ProofAtlasScopeRuntimeCheck/1',status:'RUNNING',execution:{node:process.version,execArgv:process.execArgv,heapLimitScope:'V8 flag, not a total process-RSS bound'},nativeInputs:0,nativeProfiles:0,nativeOwners:[],contextExtensions:0,extensionCoverage:{withShiftedExternalReferences:0,withPreservedLocalReferences:0,withoutBoundVariableReferences:0},certificateRows:0,scales:[],refusals:[]};
(async()=>{
 const host={};for(const name of ['network-streaming-manifest','application-region-controls-manifest','inventory-region-controls-manifest','premise-source-controls-manifest','rule-support-controls-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:host});
 const records=[...host.PROOF_ATLAS_NETWORK_STREAMING.records,...host.PROOF_ATLAS_APPLICATION_REGION_CONTROLS.records,...host.PROOF_ATLAS_INVENTORY_REGION_CONTROLS.records,...host.PROOF_ATLAS_PREMISE_SOURCE_CONTROLS.records,...host.PROOF_ATLAS_RULE_SUPPORT_CONTROLS.records];
 for(const record of records.filter(row=>row.mode==='native')){const batch=S.read(record.owner);report.nativeProfiles++;report.nativeOwners.push({owner:record.owner.sha256,file:record.owner.file,source:record.source,inputs:batch.entries.length});
  for(const entry of batch.entries){const j=entry.junction,g=j.graph,left=j.roots.producerType,right=j.roots.producerTypeInConsumer,shift=j.consumer.context.length-j.producer.context.length;
   const result=W.compare(g,left,g,right,shift,{includeCertificate:true});assert.deepEqual(result,C.compare(g,left,g,right,shift,{includeCertificate:true}));K.check(g,left,g,right,shift,result.certificate);assert.equal(M.validateWeakening(g,left,right,shift).status,'same');report.nativeInputs++;report.certificateRows+=result.certificate.rows.length;if(shift)report.contextExtensions++;
   if(shift){const variables=result.certificate.rows.filter(row=>g.kind[row.left]===0);if(!variables.length)report.extensionCoverage.withoutBoundVariableReferences++;if(variables.some(row=>g.payloads[row.left].index!==g.payloads[row.right].index))report.extensionCoverage.withShiftedExternalReferences++;if(variables.some(row=>g.payloads[row.left].index===g.payloads[row.right].index))report.extensionCoverage.withPreservedLocalReferences++;}
  }
 }
 assert.equal(report.nativeInputs,877);assert.equal(report.nativeProfiles,42);assert.equal(report.contextExtensions,37);
 assert.deepEqual(report.extensionCoverage,{withShiftedExternalReferences:36,withPreservedLocalReferences:0,withoutBoundVariableReferences:1});
 {
  const record=records.find(row=>row.mode==='native'&&row.source.name==='JacobiData.slope_bound_abs'),entry=S.read(record.owner).entries.find(row=>row.junction.producer.context.length>1),j=entry.junction;
  const data=S.read({file:record.record.indexFile,sha256:record.record.indexSha256}),call={anchor:j.consumer.anchor,arguments:j.consumer.arguments};
  assert.equal(M.validatePort(j,data,call,j.consumer.slot),true);
  assert(Number.isInteger(j.producer.context[0].node)&&Number.isInteger(j.producer.context[1].node));assert.notEqual(j.producer.context[0].node,j.producer.context[1].node);
  const foreign=copy(j);foreign.producer.context[0]=copy(j.producer.context[1]);
  assert.equal(W.compare(foreign.graph,foreign.roots.producerType,foreign.graph,foreign.roots.producerTypeInConsumer,foreign.consumer.context.length-foreign.producer.context.length).status,'same');
  assert.throws(()=>M.validatePort(foreign,data,call,j.consumer.slot),/exact source-use and original context/);report.refusals.push('foreign-original-context-owner-with-equal-type-graphs');
 }
 for(const index of [null,0,512]){const fixture=scale(index),{g,original,lifted}=fixture;T.validateExpressionGraph(g,[original,lifted],514,65536);
  const expected=C.compare(g,original,g,lifted,1,{includeCertificate:true}),actual=W.compare(g,original,g,lifted,1,{includeCertificate:true});assert.deepEqual(actual,expected);K.check(g,original,g,lifted,1,actual.certificate);
  assert.throws(()=>E.equal(g,original,g,lifted,1),/comparison work bound/);assert.equal(M.validateWeakening(g,original,lifted,1).status,'same');
  const {cursor,requests}=await pages(g);try{
   const result=await O.equalShifted(cursor.readNode,g.kind.length,original,lifted,1,{includeCertificate:true});assert.deepEqual(result,expected);K.check(g,original,g,lifted,1,result.certificate);
   assert.equal((await O.equalShifted(cursor.readNode,g.kind.length,original,lifted,1,{pairLimit:8})).status,'unavailable');assert.throws(()=>M.validateWeakening(g,original,lifted,1,{pairLimit:8}),/unavailable/);
   const controller=new AbortController();let reads=0;await assert.rejects(()=>O.equalShifted(async(id,options)=>{const row=await cursor.readNode(id,options);if(++reads===3)controller.abort(Error('mid-read cancellation'));return row;},g.kind.length,original,lifted,1,{signal:controller.signal}),/mid-read cancellation/);assert.equal(reads,3);
   let missing=0;await assert.rejects(()=>O.equalShifted(async id=>{if(++missing===3)throw Error('missing comparison row');return cursor.readNode(id);},g.kind.length,original,lifted,1),/missing comparison row/);
   const cache=cursor.state();assert.equal(cache.peakCachedNodes,64);assert.equal(cache.completeTableResident,false);assert.equal(cache.fullTableArchiveRequests,0);assert(cache.evictions>0);
   report.scales.push({leaf:fixture.leaf,storedRows:g.kind.length,expandedOccurrences:g.expanded[original],pairs:result.pairs,maximumLocalDepth:result.maximumLocalDepth,certificateSha256:sha(encode(result.certificate)),legacy:'work-budget-exceeded',cache,requests:requests(),reducedBudget:'unavailable',midReadCancellation:true,missingRowRejected:true,mathematicalTyping:'not-asserted'});
  }finally{cursor.dispose();assert.equal(cursor.state().cachedNodes,0);}
 }
 const tiny=graph();add(tiny,0,{index:0});
 await assert.rejects(()=>O.equalShifted(async()=>[5,[0,0],{}],1,0,0,1),/postorder child/);report.refusals.push('cyclic-page-row');
 for(const options of [{pairLimit:0},{pairLimit:262145},{pairLimit:NaN}]){assert.throws(()=>W.compare(tiny,0,tiny,0,0,options));await assert.rejects(()=>O.equalShifted(async()=>[0,[],{index:0}],1,0,0,0,options));}report.refusals.push('invalid-bounds-complete-and-paged');
 const witness=JSON.parse(fs.readFileSync(path.join(__dirname,'scope-sharing.json'))),mixed=graph();append(mixed,witness.source);
 for(const wrong of [0,1]){const target=copy(witness.source);target.payloads[0].index=wrong;const bad=W.compare(witness.source,3,target,3,1);assert.equal(bad.status,'different');assert.deepEqual(bad,C.compare(witness.source,3,target,3,1));}report.refusals.push('one-shift-for-mixed-scope-uses');
 report.files=Object.fromEntries(['public/js/proof-atlas-scope-comparison.js','public/js/proof-atlas-application-ports.js','public/js/proof-atlas-paged-type-operations.js','public/js/proof-atlas-type-pages.js','research/proof-atlas/scope-comparison/model.cjs','research/proof-atlas/scope-comparison/certificate.cjs','research/proof-atlas/scope-comparison/check-runtime.cjs'].map(file=>[file,sha(fs.readFileSync(file))]));
 for(const name of ['network-streaming-manifest','application-region-controls-manifest','inventory-region-controls-manifest','premise-source-controls-manifest','rule-support-controls-manifest']){const file='public/data/proof-atlas/'+name+'.js';report.files[file]=sha(fs.readFileSync(file));}
 report.status='PASS';report.scope='Production complete and row-paged uniform weakening agree with the frozen scope model and separate local certificate gate. Existing original source/context and kernel attestations remain separate. Scale fixtures are syntax data; no native typing, arbitrary context-map, total heap or comprehension claim.';
 assert(process.argv[2]);fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,files:undefined}));
})().catch(error=>{console.error(error.stack);process.exit(1);});
