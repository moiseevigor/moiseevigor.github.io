'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),vm=require('vm'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const S=require('../../../public/js/proof-atlas-substitution-geometry'),A=require('../../../public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x));
const w={},manifestFile='public/data/proof-atlas/substitution-geometry-manifest.js';vm.runInNewContext(fs.readFileSync(manifestFile,'utf8'),{window:w});const manifest=copy(w.PROOF_ATLAS_SUBSTITUTION_GEOMETRY),assets=new Set();
function decode(ref,kind){const f='.'+S.base+ref.sha256+'.'+kind+'.gz',b=z.gunzipSync(fs.readFileSync(f));assert.equal(b.length,ref.bytes);assert.equal(sha(b),ref.sha256);assets.add(f);return JSON.parse(b);}
function entries(directory,kind){const all=[];function visit(ref,level,first){const v=decode(ref,'index');assert.equal(v.format,'ProofAtlasSubstitutionIndex/1');assert.equal(v.level,level);assert.equal(v.first,first);assert.equal(v.children.length,Math.min(64,Math.ceil((directory.count-first)/64**level)));for(const [j,c]of v.children.entries())if(level)visit(c,level-1,first+j*64**level);else all.push(decode(c,kind));}visit(directory.root,directory.level,0);assert.equal(all.length,directory.count);return all;}
const pages=entries(manifest.table,'page'),rows=[];for(const p of pages){assert.equal(p.start,rows.length);assert.equal(p.rows.length,Math.min(64,manifest.nodeCount-rows.length));rows.push(...p.rows);}assert.equal(rows.length,255233);
const queries=entries(manifest.catalogue,'query'),nativeFile='research/proof-atlas/certified-substitution/native.json.gz',native=JSON.parse(z.gunzipSync(fs.readFileSync(nativeFile))),inputsFile='research/proof-atlas/certified-substitution/inputs.json.gz',inputs=JSON.parse(z.gunzipSync(fs.readFileSync(inputsFile)));
assert.equal(manifest.inputManifestSha256,sha(fs.readFileSync(inputsFile)));assert.equal(manifest.nativeSha256,sha(fs.readFileSync(nativeFile)));assert.equal(queries.length,2835);
const arities=[0,0,0,0,0,2,2,2,3,0,1,1],binds=(k,j)=>(k===6||k===7)?j===1:k===8&&j===2,kinds=new Set();
for(const [i,r]of rows.entries()){const[k,cs,p,count,scope]=r;kinds.add(k);assert.equal(cs.length,arities[k]);assert(cs.every(c=>Number.isSafeInteger(c)&&c>=0&&c<i));assert.equal(BigInt(count),1n+cs.reduce((n,c)=>n+BigInt(rows[c][3]),0n));assert.equal(scope,k===0?p.index+1:Math.max(0,...cs.map((c,j)=>rows[c][4]-Number(binds(k,j)))));}
assert.equal(kinds.size,12);
let relationStates=0,renamingStates=0,scenes=0,visibleVertices=0,localBinderLinks=0,imageLinks=0,queryReads=0;
// Independent whole-table relation checker: compare every reachable row/depth
// pair to the expected result, including all fields. It does not call the view's
// correspondence function or its shallow-reference helper.
function entire(q){const done=new Set(),renamed=new Set(),images=q.transport.images;
 function rename(a,b,local,shift){const key=[a,b,local,shift].join(':');if(renamed.has(key))return;assert(renamed.size<262144);renamed.add(key);renamingStates++;
  const x=rows[a],y=rows[b];assert.equal(x[0],y[0]);if(x[0]===0)assert.equal(y[2].index,x[2].index+(x[2].index<local?0:shift));else{assert.deepEqual(x[2],y[2]);assert.equal(x[1].length,y[1].length);for(let j=0;j<x[1].length;j++)rename(x[1][j],y[1][j],local+Number(binds(x[0],j)),shift);}}
 function subst(a,b,depth){const key=[a,b,depth].join(':');if(done.has(key))return;assert(done.size<262144);done.add(key);relationStates++;
  const x=rows[a],y=rows[b];if(x[0]===0&&x[2].index>=depth){const outside=x[2].index-depth;if(outside<images.length){rename(images[images.length-outside-1],b,0,depth);return;}assert.equal(y[0],0);assert.equal(y[2].index,x[2].index-images.length);return;}
  assert.equal(x[0],y[0]);assert.deepEqual(x[2],y[2]);assert.equal(x[1].length,y[1].length);for(let j=0;j<x[1].length;j++)subst(x[1][j],y[1][j],depth+Number(binds(x[0],j)));}
 subst(q.transport.root,q.transport.expected,0);
}
const memory={async row(i){assert(Number.isSafeInteger(i)&&i>=0&&i<rows.length);return rows[i];}};
function independentAddress(q,part,image,path){let i=part==='source'?q.transport.root:part==='result'?q.transport.expected:q.transport.images[image];const frames=[];for(let n=0;n<path.length;n++){const r=rows[i],j=path[n];assert(j<r[1].length);if(binds(r[0],j))frames.push(path.slice(0,n));i=r[1][j];}return{id:i,frames};}
async function inspect(q,selection){const scene=await S.scene(memory,q,selection);scenes++;assert(scene.visibleVertices<=12);visibleVertices+=scene.visibleVertices;
 for(const [part,p]of Object.entries(scene.panes)){if(!p)continue;assert(p.vertices.length<=4);assert.equal(BigInt(p.expanded),BigInt(p.visible)+BigInt(p.hidden));
  for(const v of p.vertices){assert.equal(v.address.inputSha256,q.inputSha256);assert.equal(v.address.query,q.query.index);const original=independentAddress(q,part,p.image,v.address.path);assert.equal(v.id,original.id);assert.deepEqual(v.row,rows[original.id]);
   if(v.binding?.kind==='local'){const index=v.row[2].index;assert.deepEqual(v.binding.address.path,original.frames[original.frames.length-1-index]);assert.equal(v.binding.address.component,part);localBinderLinks++;}
   if(v.binding?.kind==='substitution-input')imageLinks++;
   if(v.binding?.kind==='target-context'){const outside=v.row[2].index-original.frames.length,relative=outside-(part==='source'?q.transport.images.length:0);assert.equal(v.binding.relativeIndex,relative);assert.equal(v.binding.slot,relative<q.query.targetScope?q.query.targetScope-1-relative:null);if(part==='source')assert.equal(v.binding.sourceRelativeIndex,outside);}
  }
 }return scene;}
async function main(){
 for(const [i,q]of queries.entries()){
  assert.equal(q.query.index,i);assert.equal(q.native.descendantTyping,false);assert.equal(q.native.proofsErasedDuringExecution,true);assert.equal(q.inputSha256,native.queries[i].inputSha256);assert(inputs.shards.some(s=>s.sha256===q.inputSha256));
  for(const k of['root','images','expected','owner'])assert.deepEqual(q.query[k],native.queries[i][k]);entire(q);
  await inspect(q,{part:'source',path:[]});for(let j=0;j<rows[q.transport.root][1].length;j++)await inspect(q,{part:'source',path:[j]});
  const first=await S.firstExternal(memory,q);if(first){const s=await inspect(q,{part:'source',path:first});assert.equal(s.link.relation,'inserted-image');const image=s.link.insertion.image,external=await S.firstExternal(memory,q,{part:'image',image});if(external)await inspect(q,{part:'image',image,path:external,insertion:s.link.insertion});}
  if(q.transport.images.length){const s=await inspect(q,{part:'image',image:q.transport.images.length-1,path:[]});assert.equal(s.panes.source,null);assert.equal(s.panes.result,null);}
 }
 const q=queries[2833],external=await inspect(q,{part:'source',path:[0]}),local=await inspect(q,{part:'source',path:[1,1]});assert.equal(external.panes.source.vertices[0].id,local.panes.source.vertices[0].id);assert.equal(external.link.relation,'inserted-image');assert.equal(local.link.relation,'preserved-local-reference');assert.deepEqual(local.panes.result.vertices[0].binding.address.path,[1]);
 const big=queries[2834],use=(await inspect(big,{part:'source',path:[1]})).link.insertion,externalImage=await S.firstExternal(memory,big,{part:'image',image:0}),s=await inspect(big,{part:'image',image:0,path:externalImage,insertion:use});assert.equal(s.panes.image.vertices[0].row[2].index,1);assert.equal(s.panes.result.vertices[0].row[2].index,2);assert.equal(s.panes.result.vertices[0].binding.kind,'target-context');
 const own=[...externalImage.slice(0,-1),1],ownScene=await inspect(big,{part:'image',image:0,path:own,insertion:use});assert.equal(ownScene.panes.image.vertices[0].row[2].index,0);assert.equal(ownScene.panes.result.vertices[0].row[2].index,0);assert.deepEqual(ownScene.panes.result.vertices[0].binding.address.path,[1]);assert.equal(rows[big.transport.expected][3],(2n**92n+3n).toString());
 const residualRows=[[0,[],{index:0},'1',1],[4,[],{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},'1',0],[0,[],{index:1},'1',2],[0,[],{index:2},'1',3],[6,[1,3],{binderName:'x',binderInfo:'default'},'3',2],[5,[2,4],{},'5',2],[6,[1,2],{binderName:'x',binderInfo:'default'},'3',1],[5,[0,6],{},'5',1]],residual={inputSha256:'0'.repeat(64),query:{index:2837,targetScope:1},transport:{root:5,images:[1],expected:7}};
 for(const path of[[0],[1,1]]){const s=await S.scene({row:async i=>residualRows[i]},residual,{part:'source',path}),before=s.panes.source.vertices[0].binding,after=s.panes.result.vertices[0].binding;assert.equal(before.kind,'target-context');assert.equal(before.sourceRelativeIndex,1);assert.equal(before.relativeIndex,0);assert.equal(before.slot,0);assert.equal(after.relativeIndex,0);assert.equal(after.slot,0);}
 const fetcher=async file=>new Response(fs.readFileSync('.'+file));const store=await S.open(manifest,{fetcher});for(let i=0;i<queries.length;i++){const q=await store.query(i);assert.deepEqual(q.query,queries[i].query);assert.equal(q.asset.sha256,sha(z.gunzipSync(fs.readFileSync('.'+q.asset.file))));await store.row(q.transport.root);queryReads++;}
 for(const p of manifest.presets){const q=await store.query(p.index);const scene=await S.scene(store,q,{part:'source',path:await S.firstExternal(store,q)||[]});assert(scene.visibleVertices<=12);}
 const cache=store.stats();assert(cache.peakCachedRows<=64);assert(cache.peakIndexPages<=2);store.dispose();await assert.rejects(()=>store.query(0),/released/);
 let refusals=0;async function refuse(f,match){await assert.rejects(f,match);refusals++;}
 await refuse(()=>S.scene(memory,big,{part:'source',path:[0,0]}),/field|path/);
 await refuse(()=>S.scene(memory,big,{part:'image',image:1,path:[]}),/image/);
 await refuse(()=>S.scene(memory,big,{part:'image',image:0,path:[],insertion:{image:0,path:[]}}),/anchor/);
 await refuse(()=>S.scene(memory,big,{part:'source',path:Array(513).fill(1)}),/path/);
 await refuse(()=>S.scene({row:async i=>{const r=copy(rows[i]);if(i===q.transport.root)r[3]='1';return r;}},q,{part:'source',path:[]}),/accounting/);
 const altered=copy(big);altered.transport.expected=big.transport.root;await refuse(()=>S.scene(memory,altered,{part:'source',path:[1]}),/correspondence/);
 let failPage=true;const retry=await S.open(manifest,{fetcher:async file=>file.endsWith('.page.gz')&&failPage?(failPage=false,new Response('',{status:503})):fetcher(file)});const loaded=await retry.query(2834);await refuse(()=>S.scene(retry,loaded,{part:'source',path:[]}),/503/);await S.scene(retry,loaded,{part:'source',path:[]});retry.dispose();
 const corrupt=await S.open(manifest,{fetcher:async file=>{const b=fs.readFileSync('.'+file);if(file.endsWith('.page.gz')){const raw=z.gunzipSync(b);raw[raw.length-2]^=1;return new Response(z.gzipSync(raw));}return new Response(b);}});const c=await corrupt.query(2834);await refuse(()=>S.scene(corrupt,c,{part:'source',path:[]}),/hash/);corrupt.dispose();
 const controller=new AbortController();controller.abort();const cancelled=await S.open(manifest,{fetcher});await refuse(()=>cancelled.query(0,controller.signal));cancelled.dispose();
 const producerFiles={};for(const f of[manifestFile,'public/js/proof-atlas-library-data.js','public/js/proof-atlas-geometry-core.js','public/js/proof-atlas-substitution-geometry.js','research/proof-atlas/substitution-geometry/pack.cjs','research/proof-atlas/substitution-geometry/check.cjs','research/proof-atlas/substitution-geometry/view.js','research/proof-atlas/substitution-geometry/view.css','research/proof-atlas/substitution-geometry/index.html',nativeFile,inputsFile])producerFiles[f]=sha(fs.readFileSync(f));
 const report={format:'ProofAtlasSubstitutionGeometryAudit/1',status:'PASS',queries:queries.length,pooledRows:rows.length,checkedAssets:assets.size,kernelKinds:kinds.size,relationStates,renamingStates,selectedScenes:scenes,visibleVertices,localBinderLinks,imageLinks,transportQueries:queryReads,refusals,residualContextControl:true,cache,producerFiles,scope:'Independent complete stored row/depth substitution relation for every recorded query; selected source/image/result cuts, original query ownership, local binder targets and bounded hash-checked transport. A separate authored residual-context control calibrates source-to-target remainder indices. Not all expanded occurrence paths, new kernel typing, or measured comprehension.'};
 const out=__dirname+'/audit.json.gz';if(process.argv.includes('--write'))fs.writeFileSync(out,z.gzipSync(Buffer.from(JSON.stringify(report)+'\n'),{level:9,mtime:0}));else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(out))),report);
 if(process.argv.includes('--integration')){
  const integration=JSON.parse(z.gunzipSync(fs.readFileSync(__dirname+'/integration.json.gz'))),b=integration.browser;
  assert.equal(integration.status,'PASS');assert.equal(integration.modelAuditSha256,sha(fs.readFileSync(out)));assert.equal(integration.productionBuild.exitCode,0);assert.equal(integration.htmlProofer.exitCode,0);
  for(const r of[integration.productionBuild,integration.htmlProofer])assert(/^[a-f0-9]{64}$/.test(r.logSha256));
  assert.equal(b.status,'PASS');assert.equal(b.riccatiOpenings,6);assert.equal(b.originalContextLinks,60);assert.equal(b.checkerSha256,sha(fs.readFileSync(__dirname+'/browser.cjs')));assert.equal(b.manualSourceSha256,sha(fs.readFileSync(__dirname+'/index.html')));
  assert.equal(queries[b.aiQuery].query.owner.kind,'public-packet-reduced-context');for(const flag of['residualContextModelInBrowser','boundedLocalContextStrips','sharedRowDistinctBindings','shiftedExternalAndPreservedImageLocal','savedAddressRoundtrip','unanchoredImageClearsCounterparts','failedRequestClearsAndRetries','obsoleteRequestCannotRestoreSelection','staleInputHashRefused','keyboardBinderPortal','releaseClearsReader','evidenceAnchorOpens'])assert.equal(b[flag],true);
  for(const[f,h]of Object.entries(b.files))assert.equal(sha(fs.readFileSync(f)),h,f);assert.deepEqual(b.audits.map(a=>[a.width,a.theme]),[[1500,'light'],[1500,'dark'],[390,'light'],[390,'dark']]);assert(b.audits.every(a=>a.violations===0));
 }
 console.log(JSON.stringify({...report,producerFiles:undefined}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
