/* Exact declaration-use navigation. No inferred proof edges or type claims. */
(function () {
  'use strict';
  const root = document.getElementById('proof-atlas');
  const box = document.getElementById('pa-reader-content');
  const api = window.ProofAtlasAPI;
  if (!root || !box || !api || !window.ProofAtlasTermReader || !window.ProofAtlasApplicationMap) return;
  const S = window.PROOF_ATLAS_DATA, T = window.PROOF_ATLAS_TERMS;
  const declarations = window.PROOF_ATLAS_DECLARATIONS?.nodes || [];
  const named = new Map(declarations.map(d => [d.short, d]));
  const byName = new Map(declarations.map(d => [d.name, d]));
  let D, A;
  try {
    D = window.ProofAtlasTermReader.create(S, T);
    A = window.ProofAtlasApplicationMap.create(S, T, D);
  } catch (_) {
    A = {valid: false, count: 0};
  }
  // The main reader restores shared #expr links before this script executes.
  const snapshot = api.getSnapshot();
  let selection = snapshot.mode === 'map' ? {type: 'decl', id: snapshot.namedSelected} :
    {type: 'expr', id: snapshot.selected};
  function element(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function annotate() {
    if (box.querySelector('[data-application-bridge]') ||
        root.querySelector('[data-pa-reader-tab="article"].active')) return;
    if (!['decl', 'expr'].includes(selection.type)) return;
    const section = element('section', 'pr-context');
    section.dataset.applicationBridge = '1';
    section.setAttribute('aria-label', 'Exact application references');
    if (!A.valid) {
      section.append(element('p', 'pr-disclaimer',
        'Exact application links are unavailable: the released expression data and reference index do not agree. No application links are inferred.'));
      box.prepend(section);
      return;
    }
    const declaration = selection.type === 'decl' ? named.get(selection.id) : null;
    const list = declaration ? A.forDeclaration(declaration.name) : [];
    const occurrence = selection.type === 'expr' ?
      (D.kind(selection.id) === 'const' ? A.forOccurrence(selection.id) : A.forApplication(selection.id)) : null;
    if (!list.length && !occurrence) return;
    section.append(element('h3', 'pr-heading', 'Exact application references'));
    section.append(element('p', 'pr-body',
      'Exact Expr.const uses and Expr.app arguments; not inferred propositions or proof steps.'));
    const buttons = element('div', 'pr-actions');
    section.append(buttons);
    function action(label, fn) {
      const b = element('button', '', label); b.type = 'button';
      b.addEventListener('click', fn); buttons.append(b); return b;
    }
    function select(i) { api.selectExpression(i); window.ProofAtlasReader?.open(); }
    if (list.length) {
      const count = element('p', 'pr-detail');
      section.insertBefore(count, buttons);
      let shown = 0;
      const more = element('button', '', 'Show more exact uses'); more.type = 'button';
      function append() {
        for (const r of list.slice(shown, shown + 8)) {
          const label = r.arguments.length ? 'Application #' + r.application + ' · ' + r.arguments.length + ' arguments' :
            'Reference #' + r.constant + ' · no arguments';
          const b = action(label, () => select(r.application));
          b.title = r.position + ' · ' + r.applicationPath;
        }
        shown = Math.min(shown + 8, list.length);
        count.textContent = shown + ' / ' + list.length + ' exact uses shown · ' +
          list.filter(r => r.position === 'type').length + ' in type · ' +
          list.filter(r => r.position === 'value').length + ' in proof body';
        more.hidden = shown === list.length;
      }
      more.addEventListener('click', append); append(); section.append(more);
    }
    if (occurrence) {
      const r = occurrence;
      section.insertBefore(element('p', 'pr-detail', r.name + ' · ' +
        (r.position === 'type' ? 'theorem type' : 'proof body') + ' · ' + r.arguments.length + ' supplied arguments'), buttons);
      if (selection.id !== r.application) action('Enclosing application #' + r.application, () => select(r.application));
      if (selection.id !== r.constant) action('Exact reference #' + r.constant, () => select(r.constant));
      const d = byName.get(r.name);
      if (d) action('Open named ' + (d.kind === 'def' ? 'definition ' : 'declaration ') + d.short,
        () => api.selectDeclaration(d.short));
      if (selection.id === r.application) r.arguments.forEach((i, j) =>
        action('Argument ' + (j + 1) + ' → #' + i, () => select(i)));
    }
    box.prepend(section);
  }
  window.addEventListener('proof-atlas:selection', e => {selection = e.detail; queueMicrotask(annotate);});
  new MutationObserver(annotate).observe(box, {childList: true});
  window.ProofAtlasApplicationNavigation = Object.freeze({valid: A.valid, count: A.count});
  annotate();
})();
