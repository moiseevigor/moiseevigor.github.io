'use strict';
const fs=require('node:fs');
const {gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const heads=new Map();
for(const owner of edition.declarations.filter(d=>d.kind==='theorem' && d.bodyAvailable)){
  const bytes=gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  const term=atlas.validateIndex(JSON.parse(bytes),owner);
  for(const node of atlas.reachable(term,term.roots[1])){
    if(term.kind[node]!==5)continue;
    const {head,args}=spine(term,node);
    if(args.length<8 || term.kind[head]!==4)continue;
    const name=term.payloads[head].name;
    assert.deepEqual(term.payloads[head].nameParts,name.split('.').map(str=>({str})));
    heads.set(name,Math.max(args.length,heads.get(name)||0));
  }
}
console.log(JSON.stringify(Object.fromEntries([...heads].sort(([a],[b])=>a<b?-1:1)),null,2));
