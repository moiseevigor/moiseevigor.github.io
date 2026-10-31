'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const F=require('./model.cjs'),old=require('../frontier-functions/model.cjs'),base='research/proof-atlas/corpus-frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const native=JSON.parse(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz'))),report={format:'ProofAtlasStoredNodeHashCheck/1',status:'PASS',storedNodes:0,roots:0,shiftComparisons:0};
// A separate bottom-up reference ignores lexical depth for literal syntax.
for(const p of native.profiles)for(const item of p.cases){const data=JSON.parse(z.gunzipSync(fs.readFileSync(base+item.output.file))),g=data.case.graph,hashes=[];
 for(let n=0;n<g.kind.length;n++){assert(g.children[n].every(c=>c<n));hashes.push(sha(Buffer.from(JSON.stringify(canonical([g.kind[n],g.payloads[n],g.children[n].map(c=>hashes[c])])))));}
 const actual=F.keys(g);for(const r of g.roots){assert.equal(actual(r),hashes[r]);report.roots++;}report.storedNodes+=g.kind.length;
}
const small=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/frontier-functions/native-check.json.gz')));
for(const p of small.profiles)for(const c of p.output.cases){const graphs=c.status==='PASS'?[c.graph,c.sourceGraph,...c.parameterTypes,...c.holes.flatMap(h=>[h.original,h.originalType])]:[c.rejectedFunctionGraph,...c.parameterTypes];for(const g of graphs)for(const shift of[0,1,3])for(const cutoff of[0,1])for(const root of g.roots){assert.equal(F.keys(g,shift,cutoff)(root),old.keys(g,shift,cutoff)(root));report.shiftComparisons++;}}
report.scope='Literal hashing matches a separate bottom-up reference at every joint root. Shifted hashing matches the preceding scope-aware implementation on finite controls. Binding identity is not a syntax hash and remains component/path qualified.';
report.files=Object.fromEntries([base+'model.cjs',base+'check-hashes.cjs','research/proof-atlas/frontier-functions/model.cjs'].map(f=>[f,sha(fs.readFileSync(f))]));
if(process.argv.includes('--freeze'))fs.writeFileSync(base+'hash-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(base+'hash-check.json.gz'))),report);
console.log(JSON.stringify(report));
