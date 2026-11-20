// Follow the common outer telescope of a theorem statement and its proof.
(function (host) {
  'use strict';
  function* selectRows(data, route) {
    if (data.declaration.kind !== 'theorem' || data.roots.length !== 2) return null;
    const fromStatement = route.root === 0;
    if (!fromStatement && route.root !== 1) return null;
    let [type, proof] = data.roots;
    let depth = 0;
    while (true) {
      const statement = yield type;
      if (statement.kind !== 7) break;
      const value = yield proof;
      const paired = value.kind === 6 && statement.children[0] === value.children[0];
      const atBinder = route.slots.length === depth;
      const inDomain = route.slots[depth] === 0;
      if (!paired || atBinder || inDomain) {
        if (!fromStatement && !paired && !atBinder) return null;
        return {
          node: fromStatement ? proof : type,
          route: {root: fromStatement ? 1 : 0, slots: Array(depth).fill(1)},
          label: fromStatement
            ? (paired ? 'Open proof binder' : 'Open proof of remaining statement')
            : (paired ? 'Open statement binder' : 'Open remaining statement')
        };
      }
      if (route.slots[depth] !== 1) return null;
      type = statement.children[1];
      proof = value.children[1];
      depth++;
    }
    if (route.slots.length !== depth) return null;
    return {
      node: fromStatement ? proof : type,
      route: {root: fromStatement ? 1 : 0, slots: Array(depth).fill(1)},
      label: fromStatement ? 'Open proof of conclusion' : 'Open conclusion'
    };
  }

  function row(data, id) {
    return {kind: data.kind[id], children: data.children[id]};
  }
  function destination(data, route) {
    const steps = selectRows(data, route);
    let step = steps.next();
    while (!step.done) step = steps.next(row(data, step.value));
    return step.value;
  }
  async function pagedDestination(cursor, route, options = {}) {
    const steps = selectRows(cursor.data, route);
    let step = steps.next();
    while (!step.done) {
      const id = step.value;
      const next = await cursor.run(() => row(cursor.data, id), options);
      step = steps.next(next);
    }
    return step.value;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {destination, pagedDestination};
    return;
  }
  host.ProofAtlasClauseNavigation = {destination, pagedDestination};
  host.addEventListener('proof-atlas:compiled-selection', () => {
    const reader = host.ProofAtlasLibrary;
    const selection = reader?.getSnapshot();
    const panel = document.getElementById('pl-expression');
    if (!selection || !panel) return;
    panel.querySelector('[data-clause-navigation]')?.remove();
    const target = destination(reader.getData(), selection.route);
    if (!target) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.clauseNavigation = '';
    button.textContent = target.label + ' · #' + target.node;
    button.onclick = async () => {
      if (reader.getSnapshot()?.indexSha256 !== selection.indexSha256) return;
      button.disabled = true;
      try {
        await reader.selectOccurrence(target.node, true, true, target.route);
        if (reader.getSnapshot()?.indexSha256 === selection.indexSha256) {
          panel.querySelector('[data-clause-navigation]')?.focus();
        }
      } catch (error) {
        button.textContent = 'Selection unavailable · ' + error.message;
        button.disabled = false;
      }
    };
    panel.querySelector('.pl-actions')?.append(button);
  });
})(globalThis);
