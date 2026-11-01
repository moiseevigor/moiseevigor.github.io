'use strict';
// Derive finite address requests from every preceding query and scene. The
// native checker resolves the addresses independently on actual Lean.Expr.
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
process.chdir(path.resolve(__dirname,'../../..'));
const S=require('../../../public/js/proof-atlas-substitution-geometry'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const outOption=process.argv.indexOf('--output');assert(outOption>=0);const output=path.resolve(process.argv[outOption+1]);fs.mkdirSync(output+'/queries',{recursive:true});
let input;const option=process.argv.indexOf('--inputs');if(option>=0)input=path.resolve(process.argv[option+1]);else{
 const scratch=fs.mkdtempSync(path.join(require('os').tmpdir(),'atlas-substitution-paths-'));
 cp.execFileSync(process.execPath,['research/proof-atlas/context-instantiation/prepare.cjs','--output',scratch+'/parent'],{stdio:'inherit'});
 cp.execFileSync(process.execPath,['research/proof-atlas/certified-substitution/prepare.cjs','--source',scratch+'/parent','--output',scratch+'/base'],{stdio:'inherit'});input=scratch+'/base';
}
const parentFile='research/proof-atlas/certified-substitution/inputs.json.gz',parent=read(parentFile),prior=read('research/proof-atlas/certified-substitution/native.json.gz'),shards=[];
const counts={legacyQueries:0,newQueries:0,queries:0,rows:0,scenes:0,vertices:0,sourceRelations:0,imageRelations:0,resultOrigins:0,localOwners:0,invalidPaths:0,riccatiQueries:0,legacyScenes:0,legacyVertices:0};
function walk(g,root,p){let id=root;for(const s of p){assert(s<g.children[id].length);id=g.children[id][s];}return id;}
async function packet(original,sourceSha,legacy){const g=original.graph,rows=g.kind.map((k,i)=>[k,g.children[i],g.payloads[i],g.expanded[i],g.neededScope[i]]),store={row:async i=>rows[i]},queries=[];
 for(const q of original.queries){
  if(legacy){const old=prior.queries[q.index];assert.equal(old.inputSha256,sourceSha);for(const k of['root','images','expected','owner'])assert.deepEqual(q[k],old[k]);counts.legacyQueries++;}else counts.newQueries++;
  const wrapper={query:q,inputSha256:sourceSha,transport:{root:q.root,images:q.images,expected:q.expected}},observations=[],invalidPaths=[];
  async function inspect(selection){const scene=await S.scene(store,wrapper,selection);counts.scenes++;counts.vertices+=scene.visibleVertices;if(legacy){counts.legacyScenes++;counts.legacyVertices+=scene.visibleVertices;}
   for(const [part,p]of Object.entries(scene.panes))if(p)for(const v of p.vertices){const a=v.address;assert.equal(a.query,q.index);assert.equal(a.inputSha256,sourceSha);
    const observation={part,image:p.image,path:a.path,node:v.id,depth:v.binders.length,binding:v.binding};
    if(part==='source'){observation.resultPath=a.path;observation.resultNode=walk(g,q.expected,a.path);counts.sourceRelations++;}
    else if(part==='image'&&scene.link.insertion){const use=scene.link.insertion;observation.usePath=use.path;observation.shift=use.shift;observation.resultPath=[...use.path,...a.path];observation.resultNode=walk(g,q.expected,observation.resultPath);counts.imageRelations++;}
    else if(part==='result'){const link=await S.correspondence(store,wrapper,{part:'result',path:a.path});observation.origin=link.insertion?{kind:'image',usePath:link.insertion.path,image:link.insertion.image,imagePath:link.image.path,shift:link.insertion.shift}:{kind:'source',path:a.path};counts.resultOrigins++;}
    if(v.binding?.kind==='local'){assert.equal(v.binding.address.query,q.index);assert.equal(v.binding.address.inputSha256,sourceSha);counts.localOwners++;}
    observations.push(observation);
   }return scene;
  }
  await inspect({part:'source',path:[]});for(let j=0;j<g.children[q.root].length;j++)await inspect({part:'source',path:[j]});
  const first=await S.firstExternal(store,wrapper);if(first){const scene=await inspect({part:'source',path:first}),image=scene.link.insertion.image,external=await S.firstExternal(store,wrapper,{part:'image',image});if(external)await inspect({part:'image',image,path:external,insertion:scene.link.insertion});}
  if(q.images.length)await inspect({part:'image',image:q.images.length-1,path:[]});
  if(q.index===2833){await inspect({part:'source',path:[0]});await inspect({part:'source',path:[1,1]});}
  if(q.index===2834){const use=(await inspect({part:'source',path:[1]})).link.insertion,p=await S.firstExternal(store,wrapper,{part:'image',image:0});await inspect({part:'image',image:0,path:p,insertion:use});await inspect({part:'image',image:0,path:[...p.slice(0,-1),1],insertion:use});}
  if(q.owner.name==='created-image-field'){await inspect({part:'result',path:[0]});invalidPaths.push({part:'source',image:null,path:[0]});counts.invalidPaths++;}
  if(q.owner.name==='repeated-image-uses'){await inspect({part:'result',path:[0,0]});await inspect({part:'result',path:[1,0]});}
  if(q.owner.name==='residual-target-context')await inspect({part:'source',path:[1,1]});
  if(q.owner.originalOwner?.source?.name==='JacobiData.slope_bound_abs')counts.riccatiQueries++;
  queries.push({...q,observations,invalidPaths});counts.queries++;
 }
 const value={format:'ProofAtlasSubstitutionPathInput/1',parentInputSha256:sourceSha,graph:g,queries},bytes=Buffer.from(JSON.stringify(value)+'\n');assert(bytes.length<=64*1024*1024);assert(g.kind.length<=262144);
 const file='queries/'+String(shards.length).padStart(3,'0')+'.json.gz';fs.writeFileSync(output+'/'+file,z.gzipSync(bytes,{level:9,mtime:0}));shards.push({file,sha256:sha(bytes),bytes:bytes.length,parentInputSha256:sourceSha,rows:g.kind.length,queries:queries.length,observations:queries.reduce((n,q)=>n+q.observations.length,0)});counts.rows+=g.kind.length;
}
async function main(){
 for(const s of parent.shards){const raw=z.gunzipSync(fs.readFileSync(input+'/'+s.file));assert.equal(raw.length,s.bytes);assert.equal(sha(raw),s.sha256);await packet(JSON.parse(raw),s.sha256,true);}
 const graph={kind:[0,4,5,5,5],children:[[],[],[1,1],[0,0],[2,2]],payloads:[{index:0},{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},{},{},{}],expanded:['1','1','3','3','7'],neededScope:[1,0,0,1,0]},queries=[{index:2835,root:0,images:[2],expected:2,targetScope:0,owner:{kind:'authored-path-control',name:'created-image-field',mathematicalTyping:false}},{index:2836,root:3,images:[2],expected:4,targetScope:0,owner:{kind:'authored-path-control',name:'repeated-image-uses',mathematicalTyping:false}}];
 const binder={binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'};
 graph.kind.push(0,0,6,5,6,5);graph.children.push([],[],[1,6],[5,7],[1,5],[0,9]);graph.payloads.push({index:1},{index:2},binder,{},binder,{});graph.expanded.push('1','1','3','5','3','5');graph.neededScope.push(2,3,2,2,1,1);
 queries.push({index:2837,root:8,images:[1],expected:10,targetScope:1,owner:{kind:'authored-path-control',name:'residual-target-context',mathematicalTyping:false}});
 const own={graph,queries};await packet(own,sha(Buffer.from(JSON.stringify(own))),false);
 assert.equal(counts.legacyQueries,2835);assert.equal(counts.newQueries,3);assert.equal(counts.legacyScenes,7410);assert.equal(counts.legacyVertices,26761);assert.equal(counts.riccatiQueries,6);
 const files={};for(const f of[parentFile,'research/proof-atlas/certified-substitution/native.json.gz','public/js/proof-atlas-substitution-geometry.js','public/js/proof-atlas-library-data.js','research/proof-atlas/substitution-path-laws/prepare.cjs'])files[f]=sha(fs.readFileSync(f));
 const manifest={format:'ProofAtlasSubstitutionPathInputs/1',files,shards,counts},bytes=Buffer.from(JSON.stringify(manifest)+'\n'),file=__dirname+'/inputs.json.gz';if(process.argv.includes('--write'))fs.writeFileSync(file,z.gzipSync(bytes,{level:9,mtime:0}));else assert(z.gunzipSync(fs.readFileSync(file)).equals(bytes));
 console.log(JSON.stringify({status:'PASS',...counts,batches:shards.length,maxBytes:Math.max(...shards.map(s=>s.bytes))}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
