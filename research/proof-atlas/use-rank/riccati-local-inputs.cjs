// Trace the local definitions encountered on the main proof body's binding spine.
'use strict';
const lexicalInputs = require('./lexical-inputs.cjs');
module.exports = function localInputs(data) {
  const steps = [];
  const prior = new Map();
  function uses(refs) {
    if (!refs) return null;
    return refs.flatMap(r => {
      const producer = prior.get(r.binder.route.slots.join('.'));
      return producer === undefined ? [] : [{producer,count:r.count,use:r.use}];
    });
  }
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
      const index = steps.length;
      steps.push({name:data.payloads[node].declName, type,value,extra,uses:uses(valueRefs)});
      prior.set(slots.join('.'),index);
    }
    const body = local ? 2 : 1;
    slots.push(body);
    node = data.children[node][body];
  }
  const value = {node,route:{root:1,slots}};
  return {localSteps:steps,finalBody:{value,uses:uses(lexicalInputs(data,value))}};
};
