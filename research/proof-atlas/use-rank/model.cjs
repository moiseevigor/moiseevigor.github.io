// Original occurrence routes, with source-child order and one-based ordinals.
'use strict';
const atlas = require('../../../public/js/proof-atlas-library-data');
const multiplicity = require('../free-index-multiplicity/model.cjs');
const binds = (kind,slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);

function open(data, binder, options = {}) {
  const limits = {...multiplicity.limits,...options};
  for (const [key,value] of Object.entries(limits)) {
    if (!Object.hasOwn(multiplicity.limits,key) || !Number.isSafeInteger(value) ||
        value < 1 || value > multiplicity.limits[key]) throw Error('Invalid ordinal limit: '+key);
  }
  if (data.kind.length > limits.sourceNodes) throw Error('Ordinal source row bound');
  const at = {root:binder.root, slots:[...binder.slots]};
  const id = atlas.walk(data,at), kind = data.kind[id];
  if (![6,7,8].includes(kind)) throw Error('Expected original binder');
  const bodySlot = kind === 8 ? 2 : 1;
  const prefix = [...at.slots,bodySlot];
  const body = data.children[id][bodySlot];
  const queries = [], seen = new Set();
  function add(node,index) {
    if (index >= data.neededScope[node]) return;
    const key = node + ':' + index;
    if (seen.has(key)) return;
    if (queries.length === limits.queryRows) throw Error('Ordinal query state bound');
    seen.add(key);
    queries.push({node,index});
  }
  add(body,0);
  for (let i=0; i<queries.length; i++) {
    const {node,index} = queries[i];
    data.children[node].forEach((child,slot) => add(child,index + Number(binds(data.kind[node],slot))));
  }
  // Store subtree totals until their final consumer. For navigation retain a
  // field mask and only the counts before the last positive field, whose size
  // follows from the parent total. Unary paths therefore need no coefficients.
  queries.sort((a,b) => a.node-b.node);
  const refs = new Map(), live = new Map(), splits = new Map();
  const keyOf = (node,index) => node+':'+index;
  function childKeys(node,index) {
    return data.children[node].map((child,slot) =>
      keyOf(child,index + Number(binds(data.kind[node],slot))));
  }
  for (const {node,index} of queries) {
    for (const key of childKeys(node,index)) {
      if (seen.has(key)) refs.set(key,(refs.get(key) || 0)+1);
    }
  }
  let cells=0, digits=0, peakCells=0, peakDigits=0, total=0n;
  function account(value,direction) {
    cells+=direction;
    digits+=direction*value.toString().length;
    if (cells>limits.coefficientCells) throw Error('Ordinal count unavailable: coefficient-cell-bound');
    if (digits>limits.decimalDigits) throw Error('Ordinal count unavailable: decimal-digit-bound');
    peakCells=Math.max(peakCells,cells);
    peakDigits=Math.max(peakDigits,digits);
  }
  for (const {node,index} of queries) {
    const key=keyOf(node,index), children=childKeys(node,index);
    let value=data.kind[node]===0 && data.payloads[node].index===index ? 1n : 0n;
    let mask=0;
    const parts=[];
    for (const [slot,child] of children.entries()) {
      const weight=live.get(child);
      if (weight!==undefined) {
        mask |= 1<<slot;
        value+=weight;
        parts.push(weight);
      }
    }
    if (value>0n) {
      account(value,1);
      live.set(key,value);
      if (children.length) {
        parts.pop();
        for (const part of parts) account(part,1);
        splits.set(key,{mask,parts});
      }
    }
    for (const child of children) {
      if (!refs.has(child)) continue;
      const remaining=refs.get(child)-1;
      if (remaining) refs.set(child,remaining);
      else {
        refs.delete(child);
        if (live.has(child)) { account(live.get(child),-1); live.delete(child); }
      }
    }
  }
  total=live.get(keyOf(body,0)) ?? 0n;
  function weights(node,index,parentTotal) {
    const split=splits.get(keyOf(node,index));
    let offset=0,remainder=parentTotal;
    return data.children[node].map((_,slot)=>{
      if (!split || !(split.mask & (1<<slot))) return 0n;
      const weight=offset<split.parts.length ? split.parts[offset++] : remainder;
      remainder-=weight;
      return weight;
    });
  }
  function select(ordinal) {
    if (typeof ordinal !== 'bigint' || ordinal < 1n || ordinal > total) throw RangeError('Ordinal outside binder uses');
    const slots = [...prefix];
    let node = body, index = 0, mass = total;
    while (data.kind[node] !== 0) {
      const parent = node, sizes = weights(node,index,mass);
      for (const [slot,child] of data.children[parent].entries()) {
        const next = index + Number(binds(data.kind[parent],slot));
        const size = sizes[slot];
        if (ordinal <= size) { slots.push(slot); node=child; index=next; mass=size; break; }
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
    let ordinal = 1n, node = body, index = 0, mass = total;
    for (const slot of route.slots.slice(prefix.length)) {
      const children = data.children[node], kind = data.kind[node];
      if (!Number.isInteger(slot) || slot < 0 || slot >= children.length) throw Error('Invalid field slot');
      const sizes = weights(node,index,mass);
      for (let j=0; j<slot; j++) ordinal += sizes[j];
      mass=sizes[slot];
      index += Number(binds(kind,slot));
      node = children[slot];
      if (mass === 0n) throw Error('No use of this binder on this path');
    }
    if (data.kind[node] !== 0 || data.payloads[node].index !== index) throw Error('Expected use of selected binder');
    return ordinal;
  }
  return {select,rank,total,states:queries.length,peakCells,peakDigits,splitStates:splits.size};
}
module.exports = {open};
