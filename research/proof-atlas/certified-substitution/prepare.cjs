'use strict';
// Reuse every preceding module probe; add the complete frozen template openings.
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x));
const option=n=>{const i=process.argv.indexOf(n);assert(i>=0,'Missing '+n);return path.resolve(process.argv[i+1]);},source=option('--source'),output=option('--output');
fs.mkdirSync(output+'/queries',{recursive:true});
const read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f),{maxOutputLength:64*1024*1024})),parent=read('research/proof-atlas/context-instantiation/inputs.json.gz');
const binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2,shards=[],counts={moduleUses:1376,previousAuthoredCases:7,templateOpenings:0,riccatiOpenings:0,newControls:0,queries:0,letQueries:0,rows:0,previouslyBudgetedCases:0};
function table(g){const map=new Map();for(let i=0;i<g.kind.length;i++){const k=JSON.stringify([g.kind[i],A.payloadKey(g.kind[i],g.payloads[i]),g.children[i]]);assert(!map.has(k));map.set(k,i);}
 function lookup(k,p,cs=[]){const key=JSON.stringify([k,A.payloadKey(k,p),cs]);assert(map.has(key),'Expected row is absent');return map.get(key);}
 function shift(root,by){if(!by)return root;const memo=new Map();function walk(i,d){const key=i+':'+d;if(memo.has(key))return memo.get(key);const k=g.kind[i],p=g.payloads[i],out=k===0&&p.index>=d?lookup(0,{index:p.index+by}):lookup(k,p,g.children[i].map((c,j)=>walk(c,d+Number(binds(k,j)))));memo.set(key,out);return out;}return walk(root,0);}
 function subst(root,images){const memo=new Map();function walk(i,d){const key=i+':'+d;if(memo.has(key))return memo.get(key);assert(memo.size<262144&&d<=512);const k=g.kind[i],p=g.payloads[i];let out;if(k===0&&p.index>=d){const j=p.index-d;out=j<images.length?shift(images[images.length-1-j],d):lookup(0,{index:p.index-images.length});}else out=lookup(k,p,g.children[i].map((c,j)=>walk(c,d+Number(binds(k,j)))));memo.set(key,out);return out;}return walk(root,0);}
 return {subst};}
function emit(graph,queries,owner){const packet={format:'ProofAtlasCertifiedSubstitutionInput/1',graph,queries,owner};const bytes=Buffer.from(JSON.stringify(packet)+'\n');assert(bytes.length<=64*1024*1024);assert(graph.kind.length<=262144);const file='queries/'+String(shards.length).padStart(3,'0')+'.json.gz';fs.writeFileSync(output+'/'+file,z.gzipSync(bytes,{level:9,mtime:0}));shards.push({file,sha256:sha(bytes),bytes:bytes.length,rows:graph.kind.length,queries:queries.length,owner});counts.rows+=graph.kind.length;}
function query(list,root,images,expected,targetScope,owner){list.push({index:counts.queries++,root,images:[...images],expected,targetScope,owner});}
for(const s of parent.shards){const raw=z.gunzipSync(fs.readFileSync(source+'/'+s.file),{maxOutputLength:64*1024*1024});assert.equal(sha(raw),s.sha256);const p=JSON.parse(raw),g=p.graph,model=table(g),queries=[];
 for(const c of p.cases){const env=[];let a=0;const owner={...c.owner,caseIndex:c.index,priorInputSha256:s.sha256,recursiveSpecificationPreviouslyEvaluated:c.runSpecification};if(!c.runSpecification)counts.previouslyBudgetedCases++;
  for(const [position,h]of c.headers.entries())if('value'in h){const expected=model.subst(h.value,env);query(queries,h.value,env,expected,c.targetScope,{...owner,part:'let-value',position,originalHeader:c.owner.originalSlots?.[position]||null});env.push(expected);counts.letQueries++;}else env.push(c.args[a++]);
  assert.equal(a,c.args.length);assert.equal(model.subst(c.body,env),c.expectedTerm);assert.equal(model.subst(c.bodyType,env),c.expectedType);
  query(queries,c.body,env,c.expectedTerm,c.targetScope,{...owner,part:'term-body'});query(queries,c.bodyType,env,c.expectedType,c.targetScope,{...owner,part:'expected-type-body'});
 }emit(g,queries,{kind:'previous-module-probes',priorInputSha256:s.sha256});
}
assert.equal(counts.previouslyBudgetedCases,29);
const templateFile='research/proof-atlas/source-template-laws/instances.json.gz',templates=read(templateFile),templateSha256=sha(fs.readFileSync(templateFile));
for(const [i,c]of templates.instances.entries()){const queries=[],g=c.graph;for(const [part,root,images,expected]of[['source',c.opening.rawSource,c.opening.sourceContext,g.roots[0]],['template',c.opening.rawTemplate,c.opening.templateContext,g.roots[1]]]){
 query(queries,root,images,expected,0,{kind:'recorded-template-opening',templateSha256,instance:i,part,bindingKey:c.bindingKey,originalOwner:c.owner});counts.templateOpenings++;if(c.owner.source?.name==='JacobiData.slope_bound_abs')counts.riccatiOpenings++;
 }emit(g,queries,{kind:'template-openings',instance:i,templateSha256});}
assert.equal(counts.templateOpenings,16);assert.equal(counts.riccatiOpenings,6);
// A shared source row has distinct binder meanings. A separate shared open image
// tests capture avoidance beneath both destination and image-local lambdas.
const g={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},seen=new Map();function add(k,p,cs=[]){const key=JSON.stringify([k,A.payloadKey(k,p),cs]);if(seen.has(key))return seen.get(key);const i=g.kind.length;g.kind.push(k);g.children.push(cs);g.payloads.push(p);g.expanded.push((1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());g.neededScope.push(k===0?p.index+1:Math.max(0,...cs.map((c,j)=>g.neededScope[c]-Number(binds(k,j)))));seen.set(key,i);return i;}
const nat=add(4,{name:'Nat',nameParts:[{str:'Nat'}],levels:[]}),bv=i=>add(0,{index:i}),ap=(f,a)=>add(5,{},[f,a]),payload={binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},lam=b=>add(6,payload,[nat,b]);
const fixture=templates.instances[0].graph,fvar=add(1,fixture.payloads[fixture.kind.indexOf(1)]),queries=[];
query(queries,ap(bv(0),lam(bv(0))),[fvar],ap(fvar,lam(bv(0))),0,{kind:'authored-cache-control',name:'shared-row-distinct-depth',mathematicalTyping:false});counts.newControls++;
let imageBody=ap(bv(1),bv(0)),shiftedBody=ap(bv(2),bv(0));for(let i=0;i<90;i++){imageBody=ap(imageBody,imageBody);shiftedBody=ap(shiftedBody,shiftedBody);}
const image=lam(imageBody),root=lam(bv(1)),expected=lam(lam(shiftedBody));
query(queries,root,[image],expected,1,{kind:'authored-cache-control',name:'shared-open-image-under-two-binders',mathematicalTyping:false,imageOccurrences:g.expanded[image],resultOccurrences:g.expanded[expected]});counts.newControls++;
emit(g,queries,{kind:'authored-cache-controls'});
const manifest={format:'ProofAtlasCertifiedSubstitutionInputs/1',parentInputManifestSha256:sha(fs.readFileSync('research/proof-atlas/context-instantiation/inputs.json.gz')),templateFileSha256:templateSha256,shards,counts};
assert(shards.reduce((n,s)=>n+s.bytes,0)<=128*1024*1024);
const bytes=Buffer.from(JSON.stringify(manifest)+'\n'),file=__dirname+'/inputs.json.gz';if(process.argv.includes('--write'))fs.writeFileSync(file,z.gzipSync(bytes,{level:9,mtime:0}));else assert.equal(z.gunzipSync(fs.readFileSync(file)).toString(),bytes.toString());
console.log(JSON.stringify({status:'PASS',...counts,shards:shards.length,maxRows:Math.max(...shards.map(s=>s.rows))}));
