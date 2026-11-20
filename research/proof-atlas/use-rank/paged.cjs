// The caller owns one authenticated source cursor throughout a query's lifetime.
'use strict';
const pages=require('../../../public/js/proof-atlas-source-pages');
const {limits}=require('../free-index-multiplicity/model.cjs');
const {makeSplits,binds}=require('./model.cjs');

async function open(cursor,binder,{signal}={}) {
  const source=pages.identity(cursor), data=cursor.data;
  if (data.kind.length>limits.sourceNodes) throw Error('Ordinal source row bound');
  const at={root:binder.root,slots:[...binder.slots]};
  const read=node=>cursor.run(()=>({kind:data.kind[node],children:data.children[node],
    scope:data.neededScope[node],index:data.payloads[node].index}),{signal});
  if (!Number.isInteger(at.root) || data.roots[at.root]===undefined) throw Error('Unknown proof root');
  let id=data.roots[at.root];
  for (const slot of at.slots) {
    const row=await read(id);
    if (!Number.isInteger(slot) || slot<0 || slot>=row.children.length) throw Error('Invalid binder route');
    id=row.children[slot];
  }
  const intro=await read(id);
  if (![6,7,8].includes(intro.kind)) throw Error('Expected original binder');
  const field=intro.kind===8?2:1, body=intro.children[field], prefix=[...at.slots,field];
  const key=(node,index)=>node+':'+index;
  const requested=new Map(), refs=new Map();
  let scheduled=0, evaluated=0;
  function schedule(node,index) {
    let indices=requested.get(node);
    if (!indices) { indices=new Set(); requested.set(node,indices); }
    if (indices.has(index)) return;
    if (scheduled>=limits.queryRows) throw Error('Ordinal query state bound');
    indices.add(index);scheduled++;
  }
  schedule(body,0);
  // Children have lower row numbers. All demands on a row are known when
  // reached, including several depths inherited through different parents.
  for (let node=body;node>=0;node--) {
    const indices=requested.get(node);
    if (!indices) continue;
    const row=await read(node);
    for (const index of indices) {
      if (index>=row.scope) { indices.delete(index); continue; }
      evaluated++;
      row.children.forEach((child,slot)=>{
        const depth=index+Number(binds(row.kind,slot)), address=key(child,depth);
        schedule(child,depth);
        refs.set(address,(refs.get(address)||0)+1);
      });
    }
    if (!indices.size) requested.delete(node);
  }
  const table=makeSplits(refs,limits);
  for (let node=0;node<=body;node++) {
    const indices=requested.get(node);
    if (!indices) continue;
    const row=await read(node);
    for (const index of indices) {
      const children=row.children.map((child,slot)=>key(child,index+Number(binds(row.kind,slot))));
      table.consume(key(node,index),children,row.kind===0 && row.index===index);
    }
    requested.delete(node);
  }
  if (refs.size) throw Error('Unconsumed field references');
  const total=table.totalAt(key(body,0));
  async function select(ordinal) {
    if (typeof ordinal!=='bigint' || ordinal<1n || ordinal>total) throw RangeError('Ordinal outside binder uses');
    const slots=[...prefix];
    let node=body,index=0,mass=total;
    while (true) {
      const row=await read(node);
      if (row.kind===0) {
        if (row.index!==index) throw Error('Unexpected variable');
        return {node,route:{root:at.root,slots}};
      }
      const weights=table.weights(key(node,index),row.children,mass);
      let slot=0;
      while (slot<weights.length && ordinal>weights[slot]) ordinal-=weights[slot++];
      if (slot===weights.length) throw Error('Inconsistent use counts');
      node=row.children[slot];index+=Number(binds(row.kind,slot));mass=weights[slot];slots.push(slot);
    }
  }
  async function rank(route) {
    if (route.root!==at.root || prefix.length>route.slots.length ||
        !prefix.every((slot,i)=>slot===route.slots[i])) throw Error('Outside binder body');
    let node=body,index=0,mass=total,ordinal=1n;
    for (const slot of route.slots.slice(prefix.length)) {
      const row=await read(node);
      if (!Number.isInteger(slot) || slot<0 || slot>=row.children.length) throw Error('Invalid field slot');
      const weights=table.weights(key(node,index),row.children,mass);
      for (let i=0;i<slot;i++) ordinal+=weights[i];
      mass=weights[slot];
      if (mass===0n) throw Error('No use of this binder on this path');
      node=row.children[slot];index+=Number(binds(row.kind,slot));
    }
    const leaf=await read(node);
    if (leaf.kind!==0 || leaf.index!==index) throw Error('Expected use of selected binder');
    return ordinal;
  }
  return {select,rank,source,total,scheduled,evaluated,...table.stats()};
}
module.exports={open};
