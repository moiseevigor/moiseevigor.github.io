// Structural control: fun (A : Type) (P : A → Prop) (x : A) (h : P x) => h.
'use strict';
const assert = require('node:assert/strict');
const lexicalInputs = require('./lexical-inputs.cjs');
const groupTypeContext = require('./group-type-context.cjs');
const data = {
  kind:[3,3,0,0,7,5,6,6,6,6], children:[[],[],[],[],[2,0],[3,2],[5,2],[3,6],[4,7],[1,8]],
  neededScope:[0,0,1,2,1,2,2,2,1,0], roots:[9], declaration:{rootPaths:['term']},
  payloads:[{level:{kind:'zero'}}, {level:{kind:'succ',of:{kind:'zero'}}}, {index:0}, {index:1}, {}, {}, {binderName:'h'}, {binderName:'x'}, {binderName:'P'}, {binderName:'A'}]
};
const refs = lexicalInputs(data,{node:2,route:{root:0,slots:[1,1,1,1]}});
assert.deepEqual(refs.map(r=>r.name),['h']);
const {control} = groupTypeContext(data,{control:refs});
assert.deepEqual(control.map(r=>[r.name,r.owner]),[['P','h'],['x','h'],['A','P']]);
console.log('Two-hop type dependency recovered; shared prerequisite A listed once.');
