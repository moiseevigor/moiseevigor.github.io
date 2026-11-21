// Match terminal proof bodies after opening the four premise binders.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto'),A=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
require('../../../public/data/proof-atlas/transport-domain-index');
const index=window.PROOF_ATLAS_TRANSPORT_DOMAINS;
const owner=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(d=>d.indexSha256===index.indexSha256);
const raw=gunzipSync(fs.readFileSync('.'+owner.indexFile));
assert.equal(createHash('sha256').update(raw).digest('hex'),index.indexSha256);
const term=A.validateIndex(JSON.parse(raw),owner);
const route=path=>({root:1,slots:[...path].map(Number)});
const at=path=>A.walk(term,route(path));
const rows=[];
for(const t of index.records.filter(r=>!index.records.some(s=>s.parent===r.node))){
  const labels=[];
  for(let r=t;r;r=index.records.find(s=>s.node===r.parent))labels.unshift(r.equality);
  const triple=labels.map((eq,i)=>{
    const match=/^(0|1 \/ 2) = ([abc])$/.exec(eq);
    assert(match && match[2]==='abc'[i]);
    return match[1]==='0'?0:1; // exact units of one half
  });
  assert.equal(triple.length,3);
  const [a,b,c]=triple;
  // Multiply each equation by four before evaluating.
  const equalities=[a*a+a*b===2*c,b*b+b*c===2*a,c*c+c*a===2*b];
  const path=t.path+'0000001';
  for(let i=0;i<4;i++)assert.equal(term.kind[at(path+'1'.repeat(i))],6);
  const closing=path+'1111',node=at(closing),{head,args}=spine(term,node);
  const rule=term.payloads[head].name;
  assert.equal(args.length,2);
  const row={transport:t.node,triple,closing,node,rule,equalities};
  if(rule==='False.elim'){
    const cast=closing+'1',application=spine(term,at(cast));
    assert.equal(term.payloads[application.head].name,'Eq.mp');
    assert.equal(application.args.length,4);
    assert.equal(term.payloads[application.args[1]].name,'False');
    const source=cast+'1',binding=A.binding(term,route(source));
    const premise=[1,2,3].find(j=>binding.route.slots.join('')===path+'1'.repeat(j));
    assert(premise && !equalities[premise-1]);
    Object.assign(row,{cast,castNode:at(cast),source,sourceNode:at(source),premise});
  }else{
    assert.equal(rule,'of_eq_true');assert(equalities.every(Boolean));
    assert.equal(term.payloads[spine(term,args[0]).head].name,'Or');
  }
  rows.push(row);
}
assert.equal(new Set(rows.map(r=>r.triple.join(''))).size,8);
console.log(JSON.stringify(rows,null,2));
