// Add the enclosing variables mentioned by binder types, following types transitively.
'use strict';
const lexicalInputs = require('./lexical-inputs.cjs');
module.exports = function groupTypeContext(data,groups) {
  const domains = new Map();
  const output = {};
  const key = binder => binder.route.root + ':' + binder.route.slots.join('.');
  for (const [group,refs] of Object.entries(groups)) {
    if (!refs) { output[group] = null; continue; }
    const pending = refs.map(r => ({binder:r.binder,name:r.name}));
    const seen = new Set(pending.map(r => key(r.binder)));
    const additions = [];
    let complete = true;
    for (let i = 0; i < pending.length && complete; i++) {
      const owner = pending[i];
      const id = key(owner.binder);
      if (!domains.has(id)) {
        const {node,route} = owner.binder;
        const domain = {node:data.children[node][0],route:{root:route.root,slots:route.slots.concat(0)}};
        domains.set(id,{domain,references:lexicalInputs(data,domain)});
      }
      const {domain,references} = domains.get(id);
      if (!references) { complete = false; break; }
      for (const ref of references) {
        if (seen.has(key(ref.binder))) continue;
        seen.add(key(ref.binder));
        additions.push({name:ref.name,binder:ref.binder,use:ref.use,owner:owner.name,domain});
        pending.push(ref);
      }
    }
    output[group] = complete ? additions : null;
  }
  return output;
};
