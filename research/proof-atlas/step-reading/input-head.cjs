// Follow only function fields. Preserve the occurrence even when the DAG shares its row.
'use strict';
const {kinds, binding} = require('../../../public/js/proof-atlas-library-data');
module.exports = function inputHead(term, input) {
  let node = input.node;
  const route = {root: input.route.root, slots: [...input.route.slots]};
  while (kinds[term.kind[node]] === 'app') {
    node = term.children[node][0];
    route.slots.push(0);
  }
  const kind = kinds[term.kind[node]];
  const head = {kind, label: kind === 'const' ? term.payloads[node].name : kind, node, route};
  if (kind === 'bvar') {
    const binder = binding(term, route);
    if (binder) head.binder = {...binder, name: term.payloads[binder.node].binderName};
  }
  if (kind === 'lam') head.body = {node: term.children[node][1], route: {root: route.root, slots: route.slots.concat(1)}};
  return head;
};
