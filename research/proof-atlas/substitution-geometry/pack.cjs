'use strict';
// Pool exact wire syntax, never occurrence identities or query evidence.
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
process.chdir(path.resolve(__dirname,'../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),base='/public/data/proof-atlas/substitution-geometry/',files=new Map();
const nativeBase='research/proof-atlas/certified-substitution/',manifestBytes=fs.readFileSync(nativeBase+'inputs.json.gz'),manifest=read(nativeBase+'inputs.json.gz'),native=read(nativeBase+'native.json.gz'),nativeSha256=sha(fs.readFileSync(nativeBase+'native.json.gz'));
assert.equal(native.status,'PASS');assert.equal(native.queries.length,2835);
let input;
const option=process.argv.indexOf('--inputs');
if(option>=0)input=path.resolve(process.argv[option+1]);
else{
 const scratch=fs.mkdtempSync(path.join(require('os').tmpdir(),'atlas-substitution-geometry-'));
 input=path.join(scratch,'queries');
 cp.execFileSync(process.execPath,['research/proof-atlas/context-instantiation/prepare.cjs','--output',scratch+'/parent'],{stdio:'inherit'});
 cp.execFileSync(process.execPath,[nativeBase+'prepare.cjs','--source',scratch+'/parent','--output',input],{stdio:'inherit'});
}
function put(kind,value){const bytes=Buffer.from(JSON.stringify(value)),sha256=sha(bytes),file=base+sha256+'.'+kind+'.gz';assert(bytes.length<=(kind==='page'?1048576:kind==='query'?65536:16384));if(files.has(file))assert(files.get(file).equals(bytes));files.set(file,bytes);return{sha256,bytes:bytes.length};}
function directory(refs){let level=0,span=1;const count=refs.length;while(true){const next=[];for(let i=0;i<refs.length;i+=64)next.push(put('index',{format:'ProofAtlasSubstitutionIndex/1',level,first:i*span,children:refs.slice(i,i+64)}));if(next.length===1)return{count,level,root:next[0]};refs=next;level++;span*=64;}}
const rows=[],seen=new Map(),queries=[],presets=[];let batchRows=0;
for(const s of manifest.shards){const bytes=z.gunzipSync(fs.readFileSync(path.join(input,s.file)),{maxOutputLength:64*1024*1024});assert.equal(sha(bytes),s.sha256);assert.equal(bytes.length,s.bytes);const p=JSON.parse(bytes),g=p.graph,map=[];assert.equal(g.kind.length,s.rows);
 for(let i=0;i<g.kind.length;i++){
  assert(g.children[i].every(c=>Number.isInteger(c)&&c>=0&&c<i));
  const cs=g.children[i].map(c=>map[c]),key=JSON.stringify([g.kind[i],g.payloads[i],cs]);let id=seen.get(key);
  const row=[g.kind[i],cs,g.payloads[i],g.expanded[i],g.neededScope[i]];
  const binds=j=>((row[0]===6||row[0]===7)&&j===1)||(row[0]===8&&j===2);
  assert.equal(BigInt(row[3]),1n+cs.reduce((n,c)=>n+BigInt(rows[c][3]),0n));
  assert.equal(row[4],row[0]===0?row[2].index+1:Math.max(0,...cs.map((c,j)=>rows[c][4]-Number(binds(j)))));
  if(id===undefined){id=rows.length;seen.set(key,id);rows.push(row);}else assert.deepEqual(rows[id],row);
  map.push(id);
 }
 batchRows+=s.rows;
 for(const q of p.queries){assert.equal(q.index,queries.length);const n=native.queries[q.index];assert.equal(n.inputSha256,s.sha256);assert.equal(n.status,'PASS');assert.equal(n.primitive,'PASS');for(const k of['root','images','expected','owner'])assert.deepEqual(q[k],n[k]);
  const record={format:'ProofAtlasSubstitutionQuery/1',inputManifestSha256:sha(manifestBytes),nativeSha256,inputSha256:s.sha256,batchFile:s.file,query:q,transport:{root:map[q.root],images:q.images.map(i=>map[i]),expected:map[q.expected]},native:{status:n.status,primitive:n.primitive,proof:n.proof,proofsErasedDuringExecution:true,descendantTyping:false},addressRule:'Input hash + query index + component + occurrence path; pooled rows do not identify occurrences.'};
  queries.push(record);
  if(q.owner.kind==='recorded-template-opening'&&q.owner.originalOwner.source?.name==='JacobiData.slope_bound_abs')presets.push({index:q.index,label:'Riccati opening '+(q.owner.instance+1)+' · '+q.owner.part});
  if(q.owner.kind==='authored-cache-control')presets.push({index:q.index,label:q.owner.name==='shared-row-distinct-depth'?'One stored variable, two scopes':'Open image under two binders'});
 }
}
assert.equal(batchRows,3331136);assert.equal(queries.length,2835);
// Include the largest recorded mathematical query as a scale preset, distinctly
// from the authored exponential open-image control.
const ai=queries.filter(q=>q.query.owner.kind==='public-packet-reduced-context'&&q.query.owner.part==='term-body').sort((a,b)=>BigInt(rows[a.transport.expected][3])>BigInt(rows[b.transport.expected][3])?-1:1)[0];
assert(ai);presets.push({index:ai.query.index,label:'AI-attributed packet · recorded term'});
const pages=[];for(let start=0;start<rows.length;start+=64)pages.push(put('page',{format:'ProofAtlasSubstitutionPage/1',start,rows:rows.slice(start,start+64)}));
const table=directory(pages),catalogue=directory(queries.map(q=>put('query',q)));
const inventory={format:'ProofAtlasSubstitutionGeometry/1',inputManifestSha256:sha(manifestBytes),nativeSha256,nodeCount:rows.length,pageSize:64,table,catalogue,presets,batchRows,scope:'Exact syntax transport for all certified-substitution queries. Browser navigation is not kernel replay or new typing.'};
const js='window.PROOF_ATLAS_SUBSTITUTION_GEOMETRY = '+JSON.stringify(inventory)+';\n',jsFile='public/data/proof-atlas/substitution-geometry-manifest.js';
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(jsFile,'utf8'),js);for(const[f,b]of files)assert(z.gunzipSync(fs.readFileSync('.'+f)).equals(b),f);}
else{fs.mkdirSync('.'+base,{recursive:true});for(const[f,b]of files)fs.writeFileSync('.'+f,z.gzipSync(b,{level:9,mtime:0}));fs.writeFileSync(jsFile,js);}
console.log(JSON.stringify({status:'PASS',queries:queries.length,batchRows,pooledRows:rows.length,assets:files.size,decodedBytes:[...files.values()].reduce((n,b)=>n+b.length,0)}));
