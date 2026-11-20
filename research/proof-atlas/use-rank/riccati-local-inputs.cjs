// Trace the local definitions encountered on the main proof body's binding spine.
'use strict';
const lexicalInputs = require('./lexical-inputs.cjs');
module.exports = function localInputs(data) {
  const steps = [];
  let node = data.roots[1];
  const slots = [];
  while (data.kind[node] === 6 || data.kind[node] === 8) {
    const local = data.kind[node] === 8;
    if (local) {
      const field = i => ({node:data.children[node][i],route:{root:1,slots:slots.concat(i)}});
      const type = field(0), value = field(1);
      const typeRefs = lexicalInputs(data,type), valueRefs = lexicalInputs(data,value);
      let extra = null;
      if (typeRefs && valueRefs) {
        const mentioned = new Set(typeRefs.map(r => r.binder.route.slots.join('.')));
        extra = valueRefs.filter(r => !mentioned.has(r.binder.route.slots.join('.')));
      }
      steps.push({name:data.payloads[node].declName, type,value,extra});
    }
    const body = local ? 2 : 1;
    slots.push(body);
    node = data.children[node][body];
  }
  return steps;
};
