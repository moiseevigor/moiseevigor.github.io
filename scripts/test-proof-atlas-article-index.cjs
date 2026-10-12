/* Independently verify literal excerpts, source identity, reverse links and stale-map rejection. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const c={window:{}};
for(const f of ['crossing-structure','crossing-terms','crossing-declarations','crossing-article-index'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),c);
const S=c.window.PROOF_ATLAS_DATA,T=c.window.PROOF_ATLAS_TERMS,I=c.window.PROOF_ATLAS_ARTICLE_INDEX;
const decoder=require('../public/js/proof-atlas-term-reader').create(S,T),create=require('../public/js/proof-atlas-article-index').create;
const index=create(S,T,decoder,I),source=fs.readFileSync('public/research/se2/conjugate_times_se2.tex','utf8');
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
assert(index.valid);assert.equal(sha(source),I.source.sha256);
assert.equal(index.passages.length,6);assert.equal(new Set(index.passages.flatMap(p=>p.declarations)).size,10);
const names=new Set(c.window.PROOF_ATLAS_DECLARATIONS.nodes.map(d=>d.name));
for(const p of index.passages){assert(source.includes(p.raw));assert.equal(sha(p.raw),p.excerptSha256);for(const d of p.declarations)assert(names.has(d));assert(source.split('\n').slice(p.sourceLines[0]-1,p.sourceLines[1]).join('\n').includes(p.raw));}
assert(source.split('\n')[I.source.tableLine-1].includes('\\texttt{crossing} (\\texttt{Crossing})'));
assert.equal(index.resolve({type:'expr',id:1852}).passage.id,'phase-equation');
assert.equal(index.resolve({type:'expr',id:1856}).inherited,true);
assert.equal(index.resolve({type:'expr',id:203}).passage.id,'counting');
assert.equal(index.resolve({type:'decl',id:'crossing'}).passage.id,'counting');
assert.equal(index.resolve({type:'decl',id:'exists_branch'}).passage.id,'arcs');
assert.equal(index.resolve({type:'decl',id:'CrossingData'}),null);
assert.equal(index.resolve({type:'expr',id:999999}),null);
assert(index.reverse('phase-equation').anchors.some(a=>a.occurrence===1852));
assert.equal(index.reverse('analytic-scope').declarations.length,0);
const bad=JSON.parse(JSON.stringify(I));bad.lean.coregirSha256='wrong';assert.equal(create(S,T,decoder,bad).valid,false);
bad.lean.coregirSha256=I.lean.coregirSha256;bad.anchors[2].path='wrong';assert.equal(create(S,T,decoder,bad).valid,false);
console.log(JSON.stringify({status:'PASS',passages:6,declarations:10,exactAnchors:3,excerpts:'literal source matches',staleMaps:'rejected'}));
