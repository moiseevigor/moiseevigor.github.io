/* Independent original-cell encoder; the runtime supplies only the projected references. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto');
const repo=path.resolve(__dirname,'../../..');process.chdir(repo);
const Q=require('../../../public/js/proof-atlas-network-stream-pages'),R=require('../../../public/js/proof-atlas-application-regions'),S=require('../../../public/js/proof-atlas-rule-support');
const canonical=x=>JSON.stringify(x&&typeof x==='object'?Array.isArray(x)?x.map(v=>JSON.parse(canonical(v))):Object.fromEntries(Object.keys(x).sort().map(k=>[k,JSON.parse(canonical(x[k]))])):x);
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x));
const files=['network-streaming-manifest','application-region-controls-manifest','inventory-region-controls-manifest','premise-source-controls-manifest','rule-support-controls-manifest'],h={};
for(const f of files)vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window:h});
const descriptors=[...h.PROOF_ATLAS_NETWORK_STREAMING.records,...h.PROOF_ATLAS_APPLICATION_REGION_CONTROLS.records,...h.PROOF_ATLAS_INVENTORY_REGION_CONTROLS.records,...h.PROOF_ATLAS_PREMISE_SOURCE_CONTROLS.records,...h.PROOF_ATLAS_RULE_SUPPORT_CONTROLS.records];
const forbidden=new Set(descriptors.flatMap(d=>[d.owner?.file,d.record.indexFile]).filter(Boolean)),loaded=new Map();
global.fetch=async f=>{assert(!forbidden.has(f),'whole archive requested');assert(typeof f==='string'&&f.startsWith('/public/data/proof-atlas/')&&!f.includes('..'),'local compiled data only');const data=fs.readFileSync('.'+f);loaded.set(f,sha(data));return new Response(data);};
function qualifier(m){return{source:m.identity.source,nativeOwner:m.identity.nativeOwner,inventory:m.identity.inventory};}
function originalSource(m,p){const a=p.externalBinder||p.producer;return canonical({...qualifier(m),origin:{kind:p.externalBinder?'original-binder':'original-producer',node:a.node,root:a.route.root,slots:a.route.slots,context:p.externalBinder?null:p.producerContextLength}});}
function projectedSource(m,s){const a=s.address;assert.equal(a.namespace,'source-expression');for(const k of['name','sourceSha256','indexSha256'])assert.equal(a[k],m.identity.source[k]);return canonical({...qualifier(m),origin:{kind:s.kind,node:a.node,root:a.route.root,slots:a.route.slots,context:s.contextLength}});}
async function grow(s){while(s.getScene().nodes.length<8){const e=(await s.connections()).rows.find(e=>e.direction!=='internal');if(!e)break;await s.expand(e.direction==='incoming'?e.from:e.to);}}
async function fromSession(s,label){
 const scene=s.getScene(),records=scene.nodes.map(n=>s.getCall(n.id)),m=await R.create(scene,records,[records.map(c=>c.index)],s.getIdentity()),u=m.units[0],support=await S.create(m,u.id),byId=new Map(m.records.map(c=>[c.index,c])),ordinals=new Map(u.inputs.map((r,i)=>[r.call+':'+r.slot,i]));
 const cells=u.inputs.map(ref=>{const c=byId.get(ref.call),p=c.ports[ref.slot];assert(['proof','type','value','unobserved'].includes(p.role));return{slot:ref.slot,role:p.role,source:originalSource(m,p),payload:canonical({identity:m.identity,mode:m.mode,ref,callAnchor:c.anchor,result:c.result,port:p})};});
 const ordinal=r=>{const i=ordinals.get(r.call+':'+r.slot);assert.notEqual(i,undefined);return i;};
 const projection={heads:support.heads.map(ordinal),arguments:support.proofArguments.map(ordinal),others:support.otherArguments.map(ordinal),groups:support.proofGroups.map(g=>[projectedSource(m,g.source),g.uses.map(ordinal)])};
 assert.deepEqual(await S.expand(m,support),u.inputs);
 if(m.mode==='source-only')for(const k of['proofSupportPositions','proofHeadPositions','proofSources'])assert.equal(support.counts[k],null);
 return{label,mode:m.mode,identity:copy(m.identity),members:u.members,cells,projection,runtimeCounts:support.counts,originalTableSha256:sha(canonical(cells)),runtimeProjectionSha256:sha(canonical(projection))};
}
function scalar(label,cells){const heads=[],args=[],others=[],keys=[];cells.forEach((c,i)=>{(c.slot===0?heads:c.role==='proof'?args:others).push(i);});for(const i of[...args,...heads.filter(i=>cells[i].role==='proof')])if(!keys.includes(cells[i].source))keys.push(cells[i].source);const projection={heads,arguments:args,others,groups:keys.map(k=>[k,cells.flatMap((c,i)=>c.role==='proof'&&c.source===k?[i]:[])])};return{label,mode:'authored-scalar',cells,projection,originalTableSha256:sha(canonical(cells)),runtimeProjectionSha256:sha(canonical(projection))};}
(async()=>{
 const cases=[];let profiles=0;
 for(const d of descriptors.filter(d=>d.mode==='native')){const s=await Q.open(d);try{const seeds=d.counts.calls<=8?Array.from({length:d.counts.calls},(_,i)=>i):d.source.name==='JacobiData.slope_bound_abs'?[75,0,20,50]:[d.focus,0];for(const seed of seeds){await s.focus(seed);await grow(s);cases.push(await fromSession(s,d.source.edition+'/'+d.source.name+'/'+seed));}profiles++;}finally{s.dispose();}}
 const d=descriptors.find(d=>d.mode==='source-only');for(const focus of[4061,100000,d.focus]){const s=await Q.open(d,{focus});try{await grow(s);cases.push(await fromSession(s,d.source.name+'/'+focus));}finally{s.dispose();}}
 cases.push(scalar('empty',[]));
 cases.push(scalar('role-and-order-controls',[
  {slot:0,role:'proof',source:'f',payload:'head Γ4'},
  {slot:1,role:'proof',source:'f',payload:'same original f, argument Γ7'},
  {slot:2,role:'value',source:'f',payload:'opaque value role remains separate'},
  {slot:0,role:'value',source:'value-function',payload:'callable value'},
  {slot:3,role:'type',source:'Type',payload:'type'},
  {slot:4,role:'unobserved',source:'unknown',payload:'not an absence of proofs'},
  {slot:5,role:'proof',source:'shadowed-f',payload:'same printed f, different original binder'},
  {slot:6,role:'proof',source:'f',payload:'second supplied proof argument'}]));
 cases.push(scalar('512-position-scalar',Array.from({length:512},(_,i)=>({slot:i%7===0?0:i%7,role:['proof','type','value','unobserved'][i%4],source:'source-'+i%13,payload:canonical({ordinal:i,context:i%19,metadata:'arbitrary opaque metadata'})}))));
 const producers=['public/js/proof-atlas-library-data.js','public/js/proof-atlas-network-stream-pages.js','public/js/proof-atlas-network-streaming.js','public/js/proof-atlas-application-regions.js','public/js/proof-atlas-premise-sources.js','public/js/proof-atlas-rule-support.js',...files.map(f=>'public/data/proof-atlas/'+f+'.js'),'research/proof-atlas/boundary-kernel/export-cases.cjs'];
 const result={format:'ProofAtlasBoundaryKernelCases/1',nativeProfiles:profiles,nativeCuts:cases.filter(c=>c.mode==='native').length,sourceOnlyCuts:cases.filter(c=>c.mode==='source-only').length,authoredScalarCases:cases.filter(c=>c.mode==='authored-scalar').length,producerHashes:Object.fromEntries(producers.map(f=>[f,sha(fs.readFileSync(f))])),loadedAssetHashes:Object.fromEntries([...loaded].sort()),cases};
 assert(process.argv[2],'output filename required');fs.writeFileSync(process.argv[2],JSON.stringify(result)+'\n');console.log(JSON.stringify({nativeProfiles:profiles,cases:cases.length,positions:cases.reduce((n,c)=>n+c.cells.length,0),loadedAssets:loaded.size}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
