// Original occurrence routes, with source-child order and one-based ordinals.
'use strict';
const atlas = require('../../../public/js/proof-atlas-library-data');
const multiplicity = require('../free-index-multiplicity/model.cjs');
const binds = (kind,slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);

function open(data, binder, options = {}) {
  const at = {root:binder.root, slots:[...binder.slots]};
  const id = atlas.walk(data,at), kind = data.kind[id];
  if (![6,7,8].includes(kind)) throw Error('Expected original binder');
  const bodySlot = kind === 8 ? 2 : 1;
  const prefix = [...at.slots,bodySlot];
  const body = data.children[id][bodySlot];
  const queries = [], indices = new Map();
  function add(node,index) {
    if (index >= data.neededScope[node]) return;
    const key = node + ':' + index;
    if (indices.has(key)) return;
    if (queries.length === multiplicity.limits.queryRows) throw Error('Ordinal query state bound');
    indices.set(key,queries.length);
    queries.push({node,index});
  }
  add(body,0);
  for (let i=0; i<queries.length; i++) {
    const {node,index} = queries[i];
    data.children[node].forEach((child,slot) => add(child,index + Number(binds(data.kind[node],slot))));
  }
  const table = multiplicity.evaluate(data,queries,options);
  if (table.status !== 'complete') throw Error('Ordinal count unavailable: '+table.reason);
  function count(node,index) {
    return index >= data.neededScope[node] ? 0n : BigInt(table.rows[indices.get(node+':'+index)].count);
  }
  const total = count(body,0);
  function select(ordinal) {
    if (typeof ordinal !== 'bigint' || ordinal < 1n || ordinal > total) throw RangeError('Ordinal outside binder uses');
    const slots = [...prefix];
    let node = body, index = 0;
    while (data.kind[node] !== 0) {
      const parent = node;
      for (const [slot,child] of data.children[parent].entries()) {
        const next = index + Number(binds(data.kind[parent],slot));
        const size = count(child,next);
        if (ordinal <= size) { slots.push(slot); node=child; index=next; break; }
        ordinal -= size;
      }
      if (node === parent) throw Error('Inconsistent use counts');
    }
    if (data.payloads[node].index !== index) throw Error('Unexpected variable');
    return {node,route:{root:at.root,slots}};
  }
  function rank(route) {
    if (route.root !== at.root || prefix.length > route.slots.length ||
        !prefix.every((slot,i) => slot === route.slots[i])) throw Error('Outside binder body');
    let ordinal = 1n, node = body, index = 0;
    for (const slot of route.slots.slice(prefix.length)) {
      const children = data.children[node], kind = data.kind[node];
      if (!Number.isInteger(slot) || slot < 0 || slot >= children.length) throw Error('Invalid field slot');
      for (let j=0; j<slot; j++) ordinal += count(children[j],index + Number(binds(kind,j)));
      index += Number(binds(kind,slot));
      node = children[slot];
      if (count(node,index) === 0n) throw Error('No use of this binder on this path');
    }
    if (data.kind[node] !== 0 || data.payloads[node].index !== index) throw Error('Expected use of selected binder');
    return ordinal;
  }
  return {select,rank,total,states:queries.length};
}
module.exports = {open};
