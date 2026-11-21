// Compare reverse-edge accounting with explicit binding at every occurrence in a shared term.
'use strict';
const assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const scopes=require('./receiver-scopes.cjs');
const g={kind:[],children:[],payloads:[],roots:[]};
function add(kind,children,p={}){
 g.kind.push(kind);g.children.push(children);g.payloads.push(p);return g.kind.length-1;
}
const constant=add(4,[]),v0=add(0,[],{index:0}),v1=add(0,[],{index:1});
const call0=add(5,[constant,v0]),call1=add(5,[constant,v1]),pair=add(5,[call0,call1]);
const nested=add(6,[call0,pair]),local=add(8,[call0,call0,nested]),forall=add(7,[call0,local]);
const twice=add(5,[add(5,[constant,forall]),forall]);
g.roots=[constant,add(6,[constant,twice])];
const partition=scopes(g);
for(const [receiver,index] of [[call0,0],[call1,1]]){
 const instances=new Map();let total=0n;
 function visit(node,slots,complete){
  if(node===receiver && complete){
   const binder=A.binding(g,{root:1,slots:slots.concat(1)}),key=JSON.stringify(binder.route.slots);
   if(!instances.has(key))instances.set(key,{node:binder.node,count:0n});
   instances.get(key).count++;total++;
  }
  g.children[node].forEach((child,k)=>visit(child,slots.concat(k),g.kind[node]!==5||k!==0));
 }
 visit(g.roots[1],[],true);
 const result=partition(receiver,index);
 assert.equal(result.total,total);assert.equal(result.instances,BigInt(instances.size));
 const rows=new Set();
 for(const {node,count} of instances.values()){assert.equal(result.binders.get(node),count);rows.add(node);}
 assert.equal(result.binders.size,rows.size);
}
console.log('Reverse counts match expanded binder instances for lambda, forall, let, and partial calls.');
