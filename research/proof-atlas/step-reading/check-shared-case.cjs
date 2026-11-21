// Run against the packet emitted by build-shared-case.py.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const g=JSON.parse(fs.readFileSync(process.argv[2]));
const prefix=[1,1,0,1,1],body=A.walk(g,{root:0,slots:prefix});
const binder=prefix.slice(0,-1),total=1n<<60n;
const ranks=[1n,2n,(1n<<53n),(1n<<53n)+1n,(1n<<53n)+2n,total/2n,total/2n+1n,total-1n,total];
let maxStates=0;
for(const ordinal of ranks){
 const r=countReferences(g,body,0,{maxStates:8192,maxWork:16384,maxDepth:512,useSupport:false,ordinal});
 assert.equal(r.occurrences,total.toString());
 // In f x x, left follows app.fn.arg, right follows app.arg.
 const bits=(ordinal-1n).toString(2).padStart(60,'0');
 const suffix=[...bits].flatMap(bit=>bit==='0'?[0,1]:[1]);
 assert.deepEqual(r.witness.slots,suffix);
 const route={root:0,slots:prefix.concat(suffix)};
 assert.equal(A.walk(g,route),r.witness.node);
 assert.deepEqual(A.binding(g,route).route.slots,binder);
 maxStates=Math.max(maxStates,r.states);
}
console.log({uniqueRows:g.kind.length,expanded:g.expanded[g.roots[0]],references:total.toString(),checkedRanks:ranks.length,maxStates});
