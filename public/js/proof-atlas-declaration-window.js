/* A bounded telescope window. Reference links are lexical, not logical necessity. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const limits = Object.freeze({ declarations: 4, notationObjects: 192, sceneBytes: 16777216 });
  const demand = (ok, message) => { if (!ok) throw Error('Declaration window: ' + message); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const copy = value => JSON.parse(JSON.stringify(value));
  const fields = ['sourceIndexSha256', 'nativeInventorySha256', 'nativeCaseSha256', 'manifestSha256', 'case', 'component'];
  function componentAddress(origin, domain) {
    demand(origin?.namespace === 'region-input-notation' && fields.every(key => origin[key] === domain[key]), 'foreign notation owner');
    demand(Number.isSafeInteger(origin.node) && Array.isArray(origin.slots), 'notation occurrence');
    return { ...copy(domain), node: origin.node, route: { root: domain.component, slots: [...origin.slots] } };
  }
  async function read(lease, start = 0, options = {}) {
    const m = lease?.manifest, all = lease?.bindings;
    demand(m?.status === 'PASS' && Array.isArray(all), 'no accepted telescope');
    demand(Number.isSafeInteger(start) && start >= 0 && start < all.length && start % 4 === 0, 'declaration window offset');
    const live = () => { if (options.signal?.aborted) throw options.signal.reason || Error('Cancelled'); demand(!lease.state().disposed, 'retired telescope'); };
    const entries = [], stats = { objects: 0, sceneBytes: 0, peakNotationRows: 0, peakNotationBytes: 0, activeNotationCursors: 0 };
    for (let i = start; i < Math.min(start + limits.declarations, all.length); i++) {
      live(); const binding = all[i]; let cursor;
      try {
        // The provider owns one notation cursor. Release its cache before the
        // next type; only four immutable, unexpanded scenes survive this loop.
        cursor = await lease.openNotation(binding.domain.component, binding.domain.route.slots, options); live();
        const scene = cursor.scene, state = cursor.state(), references = [];
        demand(scene.stats.nodes <= 48 && scene.stats.metadataBytes <= 4194304, 'type scene bound');
        demand(same(componentAddress(scene.root.origin, binding.domain), binding.domain), 'wrong declared type');
        function visit(term) {
          if (term.kind === 'reference') {
            const target = term.head.target.address || term.head.target.origin;
            let address, relation, declaration = null;
            if (target?.namespace === 'source-expression') {
              demand(target.name === m.source.name && target.indexSha256 === m.source.indexSha256 && target.sourceSha256 === m.source.sourceSha256 && m.commonContext.some(frame => frame.node === target.node && same(frame.route, target.route)), 'foreign original binder');
              address = copy(target); relation = 'original-context';
            } else {
              address = componentAddress(target, binding.domain);
              const index = all.findIndex(b => same(b.binder, address));
              if (index >= 0) {
                demand(index < i, 'forward type reference'); declaration = index; relation = 'earlier-declaration';
              } else {
                demand(address.route.slots.length >= binding.domain.route.slots.length && same(address.route.slots.slice(0, binding.domain.route.slots.length), binding.domain.route.slots), 'binder outside declared type');
                relation = 'type-local';
              }
            }
            references.push({ use: componentAddress(term.origin, binding.domain), target: address, relation, declaration, label: term.label });
          }
          for (const child of term.children) visit(child.value);
        }
        visit(scene.root);
        entries.push({ index: i, binding, role: binding.kind === 'input' ? 'Supplied input' : binding.kind === 'adapter' ? 'Supplied adapter' : binding.kind === 'derived-input' ? 'Derived definition' : 'Result computation', scene, references });
        stats.objects += scene.stats.nodes; stats.sceneBytes += scene.stats.metadataBytes;
        stats.peakNotationRows = Math.max(stats.peakNotationRows, state.peakRows);
        stats.peakNotationBytes = Math.max(stats.peakNotationBytes, state.peakBytes);
      } finally { cursor?.dispose(); }
    }
    live(); demand(stats.objects <= limits.notationObjects && stats.sceneBytes <= limits.sceneBytes, 'combined scene bound');
    return { format: 'ProofAtlasDeclarationWindow/1', start, end: start + entries.length, total: all.length, originalContext: m.context.original.length, entries, stats,
      scope: 'Declared annotations inside the recorded function, in computed declaration order. Only references exposed by these notation cuts are listed; collapsed arguments may contain others. No new typing or premise-necessity judgment.' };
  }
  function draw(root, { window: data, onField, onBinder, sourceLink, isCurrent, onValue = () => {}, onCloseValue = () => {} }) {
    const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
    const button = (text, action) => { const b = el('button', text); b.type = 'button'; b.onclick = () => { if (isCurrent()) action(); }; return b; };
    root.replaceChildren();
    root.append(el('p', 'Declaration order · original Γ' + data.originalContext + ' · ' + data.start + ' earlier declarations outside this window. The line marks scope order, not implication.', 'dw-scope'));
    const list = el('ol', undefined, 'dw-list'); list.start = data.start + 1;
    for (const entry of data.entries) {
      const b = entry.binding, card = el('li', undefined, 'dw-card'); card.dataset.dwDeclaration = String(entry.index);
      const sourceName = b.kind === 'result' ? 'call ' + b.call : 'call ' + b.call + ' · input ' + b.slot;
      card.append(el('h4', entry.role + ' · ' + sourceName), el('p', 'Declared type in original Γ + ' + entry.index + ' preceding declarations', 'dw-scope'));
      const temporary = el('div'), formula = el('div', undefined, 'dw-formula');
      host.ProofAtlasTypeNotationView.draw(temporary, { scene: entry.scene, isCurrent, occurrenceLabel: 'computed', onSelect: path => onField(entry, { ...b.domain, route: { root: b.domain.component, slots: path } }) });
      // Compact formula uses the shared renderer. Full ports, residuals and
      // expansion remain in the existing exact-field inspector below.
      formula.append(temporary.querySelector('.tn-expression')); card.append(formula);
      const tools = el('div', undefined, 'dw-tools');
      tools.append(button('Inspect declared type', () => onField(entry, b.domain)));
      if (b.value) tools.append(button('Inspect computation', () => onField(entry, b.value)));
      tools.append(sourceLink(b)); card.append(tools);
      if (b.value) {
        const detail = el('details'), valueRoot = el('div'); detail.dataset.dwValue = String(entry.index);
        detail.append(el('summary', 'Show value structure'), valueRoot);
        detail.ontoggle = () => { if (!isCurrent()) return; if (detail.open) onValue(entry, valueRoot, detail); else onCloseValue(valueRoot); };
        card.append(detail);
      }
      const references = el('div', undefined, 'dw-references'), distinct = [];
      for (const ref of entry.references) if (!distinct.some(old => same(old.target, ref.target))) distinct.push(ref);
      references.append(el('span', 'Visible type references: '));
      for (const ref of distinct.slice(0, 4)) references.append(button(ref.relation === 'earlier-declaration' ? 'declaration ' + (ref.declaration + 1) : ref.relation === 'original-context' ? ref.label + ' · original context' : ref.label + ' · type-local binder', () => onBinder(ref)));
      if (!distinct.length) references.append(el('span', 'none in this notation cut.'));
      if (distinct.length > 4) references.append(el('span', ' + ' + (distinct.length - 4) + ' other visible binders; inspect the type.'));
      card.append(references, el('p', entry.scene.stats.hidden + ' occurrences collapsed, including retained implicit arguments. Select a symbol for exact fields.', 'dw-scope'));
      list.append(card);
    }
    root.append(list, el('p', (data.total - data.end) + ' later declarations outside this window. Result computations retain their separate original source occurrences.', 'dw-scope'));
  }
  const api = { read, componentAddress, limits, draw };
  if (node) module.exports = api; else host.ProofAtlasDeclarationWindow = api;
})(typeof window === 'undefined' ? globalThis : window);
