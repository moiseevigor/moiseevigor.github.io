// Produce an occurrence-linked diagram from the complete, small Riccati proof body.
'use strict';
const fs = require('node:fs');
const zlib = require('node:zlib');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const A = require('../../../public/js/proof-atlas-library-data');
const {applicationAtUse} = require('../../../public/js/proof-atlas-omitted-references');
const {sourceInput} = require('../../../public/js/proof-atlas-application-ports');
const B = require('../../../public/js/proof-atlas-binding-uses');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'), {window});
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === 'published-15');
const record = edition.declarations.find(r => r.name === 'JacobiData.slope_bound_abs');
const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(createHash('sha256').update(bytes).digest('hex'), record.indexSha256);
const data = A.validateIndex(JSON.parse(bytes),record);
const definitions = new Map(), uses = [];
const key = slots => slots.join('.');
function walk(node, slots, owner) {
  const kind = A.kinds[data.kind[node]];
  const route = {root:1, slots};
  let local;
  if (kind === 'letE') {
    const scene = B.describe(data,record,route);
    assert.equal(scene.references.status,'counted');
    local = {id:'d'+definitions.size, name:scene.selection.name, node, slots, count:BigInt(scene.references.occurrences)};
    definitions.set(key(slots),local);
  }
  if (kind === 'bvar') {
    const binder = A.binding(data,route);
    if (A.kinds[data.kind[binder.node]] === 'letE') {
      const source = definitions.get(key(binder.route.slots));
      assert.equal(source.node,binder.node);
      const receiving = applicationAtUse(data,{node,route});
      if (receiving) assert.deepEqual(sourceInput(data,receiving.call,receiving.slot),{node,route});
      uses.push({source,owner,node,slots,receiving});
    }
  }
  data.children[node].forEach((child,i) => {
    const field = A.fields[kind][i];
    const next = local && field !== 'body' ? {local,field} : owner;
    walk(child,slots.concat(i),next);
  });
}
walk(data.roots[1],[],null);
const url = (node,slots) => 'https://moiseevigor.github.io/projects/proof-atlas/library/?edition=published-15&proof='+record.name+'&route=1%3A'+key(slots)+'#expr-'+node;
const lines = ['# Local definitions in the Riccati bound','','Each arrow counts explicit references to a let-bound variable. Its destination is the innermost local definition whose type or value contains the reference. References outside those fields lead to the remaining proof term. Counts include implicit arguments and annotations.','','```mermaid','flowchart LR'];
for (const d of definitions.values()) {
  assert.equal(BigInt(uses.filter(u => u.source===d).length),d.count);
  lines.push('  '+d.id+'["'+d.name+'"]');
}
const edges = new Map();
for (const u of uses) {
  const edge = u.source.id+' -->|FIELD| '+(u.owner?.local.id || 'rest');
  const label = u.owner?.field || u.receiving?.label || 'use';
  const k = edge.replace('FIELD',label);
  edges.set(k,(edges.get(k)||0)+1);
  // Independently locate the destination by walking upwards from the use.
  let destination = null;
  for (let i=u.slots.length-1;i>=0;i--) {
    const prefix=u.slots.slice(0,i), parent=A.walk(data,{root:1,slots:prefix});
    if (A.kinds[data.kind[parent]]==='letE' && u.slots[i]<2) {
      destination={local:definitions.get(key(prefix)),field:['type','value'][u.slots[i]]};break;
    }
  }
  assert.deepEqual(destination,u.owner);
}
lines.push('  rest["Remaining proof term"]');
for (const [edge,n] of edges) lines.push('  '+edge.replace(/\|([^|]+)\|/,(_,field)=>'|'+field+' × '+n+'|'));
lines.push('```','','| Definition | Destination | Receiving call | Compiled reference |','|---|---|---|---|');
for (const [i,u] of uses.entries()) {
  const d=u.source,t=u.owner,c=u.receiving;
  const receiving=c?'['+c.label+']('+url(c.call.node,c.call.route.slots)+') · '+(c.slot===0?'function':'argument '+c.slot+' of '+c.arity):'Direct structural field';
  lines.push('| ['+d.name+']('+url(d.node,d.slots)+') | '+(t?'['+t.local.name+']('+url(t.local.node,t.local.slots)+') · '+t.field:'Remaining proof term')+' | '+receiving+' | [Use '+(i+1)+', row '+u.node+']('+url(u.node,u.slots)+') |');
}
lines.push('','Compiled index SHA-256: `'+record.indexSha256+'`. The diagram covers references to local definitions. Other binders, constant dependencies and the mathematical interpretation require separate views.');
console.log(lines.join('\n'));
