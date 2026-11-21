// Synthetic expression DAG: both arguments of each pair reuse the same child row.
const assert=require('node:assert/strict');
const {constantArgumentIndex}=require('../../../public/js/proof-atlas-role-occurrences');
const data={kind:[],children:[],payloads:[],neededScope:[]};
function row(kind,children,payload={},scope=0){
 const id=data.kind.length;
 data.kind.push(kind);data.children.push(children);data.payloads.push(payload);data.neededScope.push(scope);
 return id;
}
const f=row(4,[],{name:'f'}),pair=row(4,[],{name:'pair'}),x=row(0,[],{index:0},1);
const app=(fn,arg)=>row(5,[fn,arg],{},Math.max(data.neededScope[fn],data.neededScope[arg]));
let child=app(f,x);
for(let level=0;level<64;level++)child=app(app(pair,child),child);
const binder={node:row(6,[f,child]),route:{root:1,slots:[]}};
const index=constantArgumentIndex(data,binder,{name:'f',arity:1,slot:1});
assert.equal(index.total,2n**64n);
for(const ordinal of [1n,2n**53n,2n**53n+1n,2n**63n+1n,index.total]){
 const expected=[1];
 for(const bit of (ordinal-1n).toString(2).padStart(64,'0'))expected.push(...(bit==='0'?[0,1]:[1]));
 expected.push(1);
 assert.deepEqual(index.occurrence(ordinal),{node:x,route:{root:1,slots:expected}});
}
assert.throws(()=>index.occurrence(index.total+1n),RangeError);
console.log(data.kind.length+' rows, '+index.total+' occurrences, '+index.states+' count states, '+index.spines+' cached spines');
