// Classify every reference in each AI proof body by its binder and destination.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const A = require('../../../public/js/proof-atlas-library-data');
const B = require('../../../public/js/proof-atlas-binding-uses');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});

function audit(record) {
  const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data = A.validateIndex(JSON.parse(bytes),record);
  const root = data.roots[1], stack = [], slots = [], definitions = [], edges = new Map();
  const binderUses = {lam:0,forallE:0,letE:0};
  const destinations = {type:0,value:0,remaining:0};
  const lambdaUses = {leading:0,applied:0,other:0};
  let visited = 0;
  function walk(node,owner,leading,pending) {
    visited++;
    const kind = A.kinds[data.kind[node]];
    let local;
    if (kind === 'letE') {
      const route = {root:1,slots:[...slots]};
      local = {id:definitions.length,node,route,count:0};
      definitions.push(local);
    }
    if (kind === 'bvar') {
      const source = stack.at(-1-data.payloads[node].index);
      assert(source);
      binderUses[source.kind]++;
      if (source.kind==='lam') lambdaUses[source.role]++;
      if (source.local) {
        const from = source.local;
        const route = {root:1,slots:[...slots]};
        assert.deepEqual(A.binding(data,route),{node:from.node,route:from.route});
        from.count++;
        const field = owner?.field ?? 'remaining';
        destinations[field]++;
        if (owner) {
          const target = owner.local;
          const targetField = target.route.slots.concat(field==='type'?0:1);
          assert.deepEqual(slots.slice(0,targetField.length),targetField);
          const key = [from.id,target.id,field].join('/');
          const edge = edges.get(key) || {from:from.route,to:target.route,field,firstUse:route,count:0};
          edge.count++;
          edges.set(key,edge);
        }
      }
    }
    data.children[node].forEach((child,i) => {
      const field = A.fields[kind][i];
      const binds = field==='body' && ['letE','forallE','lam'].includes(kind);
      if (binds) stack.push({kind,local,role:leading?'leading':pending>0?'applied':'other'});
      slots.push(i);
      // A literal function-position spine supplies one argument per application;
      // a lambda consumes one when entering its body. Other fields end the spine.
      const lambdaBody = kind==='lam' && field==='body';
      const childPending = kind==='app' && i===0 ? pending+1 : lambdaBody ? Math.max(0,pending-1) : 0;
      walk(child,local && field!=='body' ? {local,field} : owner,leading && lambdaBody,childPending);
      slots.pop();
      if (binds) stack.pop();
    });
  }
  walk(root,null,true,0);
  assert.equal(Object.values(lambdaUses).reduce((a,b)=>a+b,0),binderUses.lam);
  assert.equal(BigInt(visited),BigInt(data.expanded[root]));
  for (const d of definitions) {
    const refs = B.describe(data,record,d.route).references;
    assert.equal(refs.status,'counted');
    assert.equal(BigInt(d.count),BigInt(refs.occurrences));
  }
  return {name:record.name,indexSha256:record.indexSha256,bodyOccurrences:visited,localDefinitions:definitions.length,
    binderUses,lambdaUses,destinations,edges:[...edges.values()]};
}

const result = window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.map(audit);
const prior = require('./proof-body-references.json').ai;
for (const r of result) {
  const baseline = prior.find(p => p.source === r.indexSha256);
  assert.equal(BigInt(Object.values(r.binderUses).reduce((a,b)=>a+b,0)),BigInt(baseline.total));
}
console.log(JSON.stringify(result,null,2));
