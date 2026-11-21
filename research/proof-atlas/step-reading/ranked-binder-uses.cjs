// Select an occurrence by rank without expanding earlier shared subtrees.
'use strict';
const atlas = require('../../../public/js/proof-atlas-library-data');

module.exports = function rankedBinderUses(term, route) {
  const binder = atlas.walk(term, route);
  const kind = id => atlas.kinds[term.kind[id]];
  const bodySlot = atlas.fields[kind(binder)].indexOf('body');
  if (!['lam', 'forallE', 'letE'].includes(kind(binder))) throw Error('Expected a binder');
  const body = term.children[binder][bodySlot];
  const cache = new Map();
  function nestedIndex(id, slot, index) {
    const k = kind(id);
    const binds = ['lam', 'forallE', 'letE'].includes(k) && atlas.fields[k][slot] === 'body';
    return index + Number(binds);
  }
  function count(id, index) {
    const key = id + '/' + index;
    if (cache.has(key)) return cache.get(key);
    let total = BigInt(kind(id) === 'bvar' && term.payloads[id].index === index);
    term.children[id].forEach((child, slot) => {
      total += count(child, nestedIndex(id, slot, index));
    });
    cache.set(key, total);
    return total;
  }
  const total = count(body, 0);
  function select(rank) {
    if (typeof rank !== 'bigint' || rank < 0n || rank >= total) throw RangeError('Invalid use rank');
    let id = body, index = 0;
    const slots = route.slots.concat(bodySlot);
    while (kind(id) !== 'bvar') {
      for (const [slot, child] of term.children[id].entries()) {
        const next = nestedIndex(id, slot, index);
        const size = count(child, next);
        if (rank < size) {
          slots.push(slot);
          id = child;
          index = next;
          break;
        }
        rank -= size;
      }
    }
    return {node:id, route:{root:route.root, slots}};
  }
  return {total, select};
};
