/* Audit published claims and source recurrences without importing the renderer. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function manifest(file){const s=fs.readFileSync(path.join(root,file),'utf8');return JSON.parse(s.slice(s.indexOf('=')+1).trim().replace(/;$/,''));}
function read(file,expected){assert(file.startsWith('/public/data/proof-atlas/'));const raw=z.gunzipSync(fs.readFileSync(root+file),{maxOutputLength:64*1024**2});assert(raw.length<=64*1024**2);assert.equal(sha(raw),expected);return JSON.parse(raw);}
const d=manifest('public/data/proof-atlas/large-source-cuts-manifest.js'),e=read(d.file,d.sha256),known=manifest('public/data/proof-atlas/source-references-manifest.js').edition.declarations;
assert.equal(d.sourceNodeLimit,262144);assert.equal(d.largestCheckedSourceNodes,196634);assert.equal(e.positive.packets,5);assert.equal(e.positive.records,29);assert.equal(e.positive.refinements,16);
for(const flag of ['sourceModuleBytesVerified','mathematicalTypingChecked','individualKernelCertificates','schemaDecoderFormallyVerified','browserRendererVerified'])assert.equal(e[flag],false,flag);
assert.equal(e.negative.nativeRejections,22);assert.equal(e.negative.tableBoundaryControls,3);assert(e.negative.rejected.includes('wrong-genuine-enclosing-binder'));
assert.equal(e.independentTargetAudit.nativeOrBrowserCodeImported,false);assert.equal(e.independentTargetAudit.bindings,3);
assert.equal(e.legacyCompatibility.kindTableBound,131072);
for(const name of ['AtlasLargePacketReplay.legacy_decode_agrees','AtlasLargePacketReplay.legacy_exact_agrees'])assert.deepEqual(e.legacyCompatibility.theorems[name],['Classical.choice','Quot.sound','propext']);
for(const [file,expected]of Object.entries(e.producer.sourceFiles)){assert(file.startsWith('research/proof-atlas/')||file.startsWith('scripts/'));assert.equal(sha(fs.readFileSync(path.join(root,file))),expected,file);}
let nodes=0,deepControls=0;
for(const r of e.positive.rows){
 const g=read(r.sourcePacket,r.source.indexSha256),n=g.kind.length;assert.equal(n,r.sourceNodes);assert(n<=d.sourceNodeLimit);assert.equal(g.declaration.name,r.source.name);
 assert.equal(g.children.length,n);assert.equal(g.payloads.length,n);assert.equal(g.expanded.length,n);assert.equal(g.neededScope.length,n);
 if(r.origin==='published-compiled-synthetic-control'){const native=known.find(k=>k.name===r.source.name);assert(native);assert.equal(native.indexSha256,r.source.indexSha256);assert.equal(native.sourceSha256,r.source.sourceSha256);assert.equal(native.indexFile,r.sourcePacket);}
 else{assert.equal(r.origin,'own-serialized-syntax-control-no-typing-claim');assert.equal(g.declaration.kernelCheck,'not-claimed');assert(!known.some(k=>k.name===r.source.name));deepControls++;}
 const scopes=[],sizes=[],depths=[],arity=[0,0,0,0,0,2,2,2,3,0,1,1];
 for(let i=0;i<n;i++){
  const k=g.kind[i],cs=g.children[i];assert(Number.isInteger(k)&&k>=0&&k<12);assert.equal(cs.length,arity[k]);assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<i));
  const count=1n+cs.reduce((s,c)=>s+sizes[c],0n),scope=k===0?g.payloads[i].index+1:k===6||k===7?Math.max(scopes[cs[0]],Math.max(0,scopes[cs[1]]-1)):k===8?Math.max(scopes[cs[0]],scopes[cs[1]],Math.max(0,scopes[cs[2]]-1)):Math.max(0,...cs.map(c=>scopes[c]));
  assert.equal(String(count),g.expanded[i]);assert.equal(scope,g.neededScope[i]);sizes.push(count);scopes.push(scope);depths.push(cs.length?1+Math.max(...cs.map(c=>depths[c])):0);
 }
 assert.deepEqual(r.sourceRootOccurrences,g.roots.map(i=>g.expanded[i]));if(r.origin.startsWith('own-'))assert.equal(Math.max(...depths),10001);nodes+=n;
}
assert.equal(deepControls,1);console.log(JSON.stringify({status:'PASS',sourceGraphs:5,sourceNodes:nodes,cuts:29,refinements:16,nativeRejections:22,tableBoundaryControls:3,legacyCompatibilityLaws:2,untypedControlNotRegisteredAsTheorem:true,scope:'Published bytes, recurrences and scope labels; fresh native runs are a separate CI check.'}));
