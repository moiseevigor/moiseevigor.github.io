// Input: the compiled packet from build-shared-case.py --separated-assumptions.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const {checkScopes} = require('./check-repeated-proof-scopes.cjs');

const graph = JSON.parse(fs.readFileSync(0, 'utf8'));
const branches = [[1,0,1], [1,1]];
const calls = [];
for (const slots of branches) {
  const binder = atlas.walk(graph,{root:1,slots});
  assert.equal(atlas.kinds[graph.kind[binder]],'lam');
  const body = atlas.walk(graph,{root:1,slots:slots.concat(1)});
  const {head,args} = spine(graph,body);
  assert.equal(graph.payloads[head].name,'And.intro');
  assert.equal(args.length,4);
  assert.equal(args[2],args[3]);
  for (const suffix of [[1,0,1],[1,1]]) {
    const use = {root:1,slots:slots.concat(suffix)};
    assert.equal(atlas.walk(graph,use),args[2]);
    assert.deepEqual(atlas.binding(graph,use),{node:binder,route:{root:1,slots}});
  }
  calls.push({binder,body,arg:args[2]});
}
assert.deepEqual(calls[0],calls[1]);
const {body,arg} = calls[0];
const checked = checkScopes(graph,'separatedAssumptions',
  [{node:body,weight:'2',repeated:[[arg,[3,4]]]}]);
assert.deepEqual(checked.results,[{proof:'separatedAssumptions',call:body,arg,count:2,
  externalIndices:1,distinctBindings:2}]);
assert.equal(checked.sharedArguments[0].bindings,2);
console.log(JSON.stringify({branches,calls,checked}));
