// Original occurrence routes, with source-child order and one-based ordinals.
'use strict';
const atlas = require('../../../public/js/proof-atlas-library-data');
const multiplicity = require('../free-index-multiplicity/model.cjs');
const binds = (kind,slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);

function makeSplits(refs,limits) {
  const live=new Map(), splits=new Map();
  let cells=0, digits=0, peakCells=0, peakDigits=0;
  function account(value,direction) {
    cells+=direction;
    digits+=direction*value.toString().length;
    if (cells>limits.coefficientCells) throw Error('Ordinal count unavailable: coefficient-cell-bound');
    if (digits>limits.decimalDigits) throw Error('Ordinal count unavailable: decimal-digit-bound');
    peakCells=Math.max(peakCells,cells);
    peakDigits=Math.max(peakDigits,digits);
  }
  function consume(key,children,isUse) {
    let value=isUse ? 1n : 0n;
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
  function totalAt(key) {return live.get(key) ?? 0n;}
  function weights(key,children,parentTotal) {
    const split=splits.get(key);
    let offset=0,remainder=parentTotal;
    return children.map((_,slot)=>{
      if (!split || !(split.mask & (1<<slot))) return 0n;
      const weight=offset<split.parts.length ? split.parts[offset++] : remainder;
      remainder-=weight;
      return weight;
    });
  }
  return {consume,weights,totalAt,stats:()=>({peakCells,peakDigits,splitStates:splits.size})};
}

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
  const refs = new Map();
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
  const table=makeSplits(refs,limits);
  for (const {node,index} of queries) {
    table.consume(keyOf(node,index),childKeys(node,index),data.kind[node]===0 && data.payloads[node].index===index);
  }
  const total=table.totalAt(keyOf(body,0));
  const weights=(node,index,mass)=>table.weights(keyOf(node,index),data.children[node],mass);
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
  function interval(route) {
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

    }
    return {node, first:mass ? ordinal : null, count:mass};
  }
  function rank(route) {
    const hit = interval(route);
    if (hit.count !== 1n || data.kind[hit.node] !== 0) throw Error('Expected use of selected binder');
    return hit.first;
  }
  function branchTable() {
    const rows=[], ids=new Map(), pending=[];
    function intern(node,index,mass) {
      const key=keyOf(node,index);
      if (ids.has(key)) return ids.get(key);
      const id=pending.length;
      ids.set(key,id);pending.push({node,index,mass});return id;
    }
    if (total) intern(body,0,total);
    for (let i=0;i<pending.length;i++) {
      const {node,index,mass}=pending[i], kind=data.kind[node], children=data.children[node];
      const edges=[];
      weights(node,index,mass).forEach((size,slot)=>{
        if (size>0n) edges.push([slot,intern(children[slot],index+Number(binds(kind,slot)),size),String(size)]);
      });
      const p=data.payloads[node];
      rows.push([node,kind,p.binderName||p.declName||'',edges]);
    }
    return {prefix,total:String(total),rows};
  }
  return {select,rank,interval,branchTable,total,states:queries.length,...table.stats()};
}
module.exports = {open,makeSplits,binds};
