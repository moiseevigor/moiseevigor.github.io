/* Fold an actual curried application; lexical use is separate from source use. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const limits = Object.freeze({ arguments: 64, visibleArguments: 4, vertices: 6, path: 512, metadataBytes: 1048576, previewCharacters: 96 });
  const demand = (ok, message) => { if (!ok) throw Error('Application collar: ' + message); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b), copy = value => JSON.parse(JSON.stringify(value));
  // One literal-spine rule for both source expressions and computed values.
  // The owner supplies exact addresses, lexical interpretation and row delivery.
  async function spine(root, { row, point, port }) {
    const argumentsReversed = [], wrappers = []; let at = root;
    for (;;) {
      const tuple = await row(at.node);
      if (tuple[0] !== 5) break;
      demand(wrappers.length < limits.arguments, 'application spine exceeds 64 positions; constructor fields remain available');
      wrappers.push(at); argumentsReversed.push(point(tuple[1][1], [...at.route.slots, 1])); at = point(tuple[1][0], [...at.route.slots, 0]);
    }
    const ports = [];
    for (const [slot, address] of [at, ...argumentsReversed.reverse()].entries()) ports.push(await port(slot, address));
    const tuple = await row(root.node), sum = BigInt(wrappers.length) + ports.reduce((n, p) => n + BigInt(p.expanded), 0n);
    demand(sum === BigInt(tuple[3]), 'application occurrence partition');
    return { wrappers, ports, expanded: tuple[3] };
  }
  async function read(lease, index, { signal } = {}) {
    const all = lease?.bindings, m = lease?.manifest;
    demand(m?.status === 'PASS' && Number.isSafeInteger(index) && index >= 0 && index < all?.length && all[index].value, 'no recorded value');
    const binding = all[index], root = binding.value;
    demand(root.namespace === 'region-input-components' && root.component === 'function.original' && root.route.root === root.component && root.sourceIndexSha256 === m.source.indexSha256 && root.nativeInventorySha256 === m.nativeInventorySha256 && root.nativeCaseSha256 === m.nativeCaseSha256 && root.case === m.id && root.manifestSha256 === binding.binder.manifestSha256, 'foreign component owner');
    let budgetBytes = 0;
    const account = value => { budgetBytes += new TextEncoder().encode(JSON.stringify(value)).length; demand(budgetBytes <= limits.metadataBytes, 'metadata bound'); };
    account(root);
    const live = () => { if (signal?.aborted) throw signal.reason || Error('Cancelled'); demand(!lease.state().disposed, 'retired function'); };
    const point = (id, slots) => { demand(slots.length <= limits.path, 'component path bound'); const result = { ...copy(root), node: id, route: { root: root.component, slots: [...slots] } }; account(result); return result; };
    async function row(id) { live(); const tuple = await lease.readNode(id, { signal }); live(); return tuple; }
    const header = await row(binding.binder.node);
    demand(header[0] === 8 && header[1][1] === root.node && same(root.route.slots, [...binding.binder.route.slots, 1]), 'value field occurrence');
    const { wrappers, ports, expanded } = await spine(root, { row, point, port: async (slot, address) => {
      const tuple = await row(address.node), kind = A.kinds[tuple[0]], payload = tuple[2]; let reference = null;
      if (tuple[0] === 0) {
        const n = payload.index;
        if (n < index) { const targetIndex = index - 1 - n; reference = { relation: 'computed-binder-use', use: address, target: all[targetIndex].binder, targetIndex }; }
        else {
          const ordinal = m.commonContext.length - 1 - (n - index), frame = ordinal >= 0 ? m.commonContext[ordinal] : null; demand(frame, 'unresolved original binder');
          reference = { relation: 'original-context-use', use: address, targetIndex: null, ordinal, target: { namespace: 'source-expression', name: m.source.name, indexSha256: m.source.indexSha256, sourceSha256: m.source.sourceSha256, node: frame.node, route: copy(frame.route) } };
        }
      }
      let label = reference?.relation === 'computed-binder-use' ? 'declaration ' + (reference.targetIndex + 1) : reference ? 'original Γ slot ' + (reference.ordinal + 1) : tuple[0] === 4 ? payload.name : tuple[0] === 9 ? String(payload.value) : kind;
      label = String(label); const port = { slot, address, kind, expanded: tuple[3], label: label.slice(0, 96), labelTruncated: label.length > 96, reference }; account(port); return port;
    } });
    if (binding.kind === 'result' && lease.portMap) {
      const mapped = lease.portMap.filter(p => p.call === binding.call); demand(mapped.length === ports.length, 'source input count');
      for (const port of ports) {
        const source = mapped.find(p => p.slot === port.slot); demand(source && same(source.counterpart, port.address), 'source input occurrence');
        if (source.bindingKey) demand(port.reference?.relation === 'computed-binder-use' && all[port.reference.targetIndex].key === source.bindingKey, 'source input binder');
        port.original = copy(source.original); port.sourceRelation = source.relation;
        account(port.original);
      }
    }
    live();
    const data = { format: 'ProofAtlasApplicationCollar/1', rule: 'curried-application-ports/1', index, bindingKey: binding.key || null, bindingKind: binding.kind, root, wrappers, ports,
      arguments: ports.length - 1, expanded, originalContext: m.context.original.length, application: wrappers.length > 0,
      scope: 'Literal app spine inside the recorded function. Metadata and all other constructors remain opaque endpoints. Root-variable links are lexical uses; inner references and logical necessity are not inferred. No new typing judgments.' };
    const metadataBytes = new TextEncoder().encode(JSON.stringify(data)).length; demand(metadataBytes <= limits.metadataBytes, 'metadata bound');
    return { ...data, metadataBytes };
  }
  function page(data, offset = 0) {
    demand(data?.format === 'ProofAtlasApplicationCollar/1' && Number.isInteger(offset) && offset >= 0 && offset % 4 === 0 && (offset === 0 || offset < data.arguments), 'argument page');
    const ports = [data.ports[0], ...data.ports.slice(offset + 1, offset + 5)], retained = BigInt(data.wrappers.length + ports.length);
    return { offset, ports, arguments: data.arguments, previous: offset ? offset - 4 : null, next: offset + 4 < data.arguments ? offset + 4 : null,
      vertices: data.application ? ports.length + 1 : 1, retained: String(retained), hidden: String(BigInt(data.expanded) - retained), represented: data.expanded };
  }
  function mount(root, { lease, index, isCurrent, onField, onBinder, sourceLink, beforePreview = () => {},
    readModel = signal => read(lease, index, { signal }),
    openPreview = (address, signal) => lease.openNotation(address.component, address.route.slots, { signal }),
    previewAddress = (origin, address) => host.ProofAtlasDeclarationWindow.componentAddress(origin, address),
    resultLabel = value => 'Value of declaration ' + (value.index + 1),
    resultNote = 'The declared result type is above.' }) {
    const el = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
    let disposed = false, controller = null, version = 0, pageVersion = 0, data = null, currentPage = null, loading = false;
    let previewVersion = 0, previewController = null, previewCursor = null, previewLoading = false, previews = [], previewError = null;
    const box = el('section', undefined, 'ac-reader'), status = el('p'), tools = el('div', undefined, 'dw-tools'), drawing = el('div'); root.replaceChildren(box);
    box.dataset.applicationCollar = String(index); status.setAttribute('role', 'status'); status.dataset.acStatus = '';
    const button = (text, action) => { const e = el('button', text); e.type = 'button'; e.onclick = () => { if (!disposed && isCurrent()) action(); }; return e; };
    const retry = button('Read application inputs', load), previous = button('Previous arguments', () => changePage(currentPage.previous, previous)), next = button('Next arguments', () => changePage(currentPage.next, next));
    tools.append(previous, next, retry); box.append(status, tools, drawing);
    function draw(offset = 0) {
      if (!data || disposed || !isCurrent()) return;
      cancelPreviews(); previews = []; previewError = null;
      const revision = ++pageVersion, pickCurrent = (text, action) => button(text, () => { if (revision === pageVersion) action(); });
      currentPage = page(data, offset); drawing.replaceChildren(); previous.disabled = currentPage.previous === null; next.disabled = currentPage.next === null;
      status.textContent = data.application ? 'Function + ' + data.arguments + ' ordered arguments. Showing slots ' + (data.arguments ? offset + 1 : 0) + '–' + Math.min(offset + 4, data.arguments) + '. All supplied positions, including implicit positions, remain in the record.' : 'The value root is ' + data.ports[0].kind + '; it has no outer application spine.';
      const diagram = el('div', undefined, data.application ? 'ac-diagram' : 'ac-atomic'), inputs = el('div', undefined, 'ac-inputs');
      for (const port of currentPage.ports) {
        const card = el('div', undefined, 'ac-port'); card.dataset.acPort = String(port.slot);
        card.append(el('strong', port.slot === 0 ? data.application ? 'Function · slot 0' : 'Value root' : 'Argument · slot ' + port.slot));
        const pick = pickCurrent(port.label + (port.labelTruncated ? '…' : ''), () => onField(port.address)); pick.dataset.acInspect = ''; pick.dataset.acAddress = JSON.stringify(port.address); card.append(pick);
        if (port.reference) { const ref = port.reference, target = pickCurrent(ref.label || (ref.relation === 'computed-binder-use' ? 'Uses declaration ' + (ref.targetIndex + 1) : 'Uses original context binder'), () => onBinder(ref)); target.dataset.acReference = ref.relation; card.append(target); }
        else if (['app', 'lam', 'forallE', 'letE', 'mdata', 'proj'].includes(port.kind)) card.append(el('small', 'Nested references remain in the exact field inspector.'));
        if (port.original) { const link = sourceLink(port.original, port.slot, data); link.dataset.acOriginal = ''; link.addEventListener('click', event => { if (disposed || !isCurrent() || revision !== pageVersion) { event.preventDefault(); event.stopImmediatePropagation(); } }, true); card.append(link, el('small', port.sourceRelation === 'internal-source-use' ? 'Recorded original source-use position' : 'Original specialization position · ' + port.sourceRelation)); }
        inputs.append(card);
      }
      diagram.append(inputs);
      if (data.application) {
        const join = el('div', undefined, 'ac-join'); join.append(el('span', '→'), el('small', 'apply in order'));
        const output = el('div', undefined, 'ac-output'), pick = pickCurrent(resultLabel(data), () => onField(data.root)); pick.dataset.acResult = ''; output.append(pick, el('small', data.wrappers.length + ' app occurrences folded into this join. ' + resultNote));
        diagram.append(join, output);
      }
      drawing.append(diagram, el('p', currentPage.retained + ' occurrence records + ' + currentPage.hidden + ' collapsed = ' + currentPage.represented + '. ' + (data.arguments - (currentPage.ports.length - 1)) + ' argument positions outside this page. Binder links are references, not implication arrows.', 'dw-scope'), el('p', 'Expression previews abbreviate the shared notation. Inspect a port for its complete fields and hidden type/instance arguments.', 'dw-scope'));
      previewArguments(revision, currentPage.ports);
    }
    function cancelPreviews() { previewVersion++; previewController?.abort(); previewCursor?.dispose(); previewCursor = null; previewLoading = false; }
    async function previewArguments(revision, ports) {
      const composite = ports.filter(port => ['app', 'mdata', 'proj', 'lam', 'forallE', 'letE'].includes(port.kind));
      if (!composite.length) return;
      const request = ++previewVersion; previewController = new AbortController(); previewLoading = true; beforePreview();
      const live = () => !disposed && isCurrent() && revision === pageVersion && request === previewVersion;
      try {
        for (const port of composite) {
          if (!live()) return;
          const cursor = await openPreview(port.address, previewController.signal);
          if (!live()) { cursor.dispose(); return; } previewCursor = cursor;
          try {
            demand(same(previewAddress(cursor.scene.root.origin, port.address), port.address), 'preview occurrence');
            const temporary = el('div'); host.ProofAtlasTypeNotationView.draw(temporary, { scene: cursor.scene, onSelect: () => {}, isCurrent: () => false });
            // Field captions use block layout in the full notation. Preserve
            // those boundaries when taking a short text-only port preview.
            for (const caption of temporary.querySelectorAll('.tn-binder-field > small')) { caption.append(': '); caption.parentElement.prepend(document.createTextNode(' · ')); }
            const full = temporary.querySelector('.tn-expression').textContent, text = full.slice(0, limits.previewCharacters), truncated = full.length > limits.previewCharacters;
            const pick = drawing.querySelector('[data-ac-port="' + port.slot + '"] [data-ac-inspect]');
            if (pick && live()) { pick.textContent = text + (truncated ? '…' : ''); pick.classList.add('ac-preview'); previews.push({ slot: port.slot, address: port.address, text, truncated, objects: cursor.scene.stats.nodes, notationRows: cursor.state().peakRows, notationBytes: cursor.state().peakBytes }); }
          } finally { cursor.dispose(); if (previewCursor === cursor) previewCursor = null; }
        }
      } catch (error) { if (live()) { previewError = error.message; drawing.append(el('p', 'Some expression previews are unavailable; exact constructor fields remain available.', 'dw-scope')); } }
      finally { if (live()) previewLoading = false; }
    }
    function changePage(offset, control) {
      const focused = document.activeElement === control; draw(offset);
      if (focused) (control.disabled ? previous.disabled ? retry : previous : control).focus({ preventScroll: true });
    }
    async function load() {
      if (disposed || !isCurrent()) return; controller?.abort(); controller = new AbortController(); const request = ++version;
      cancelPreviews(); previews = []; previewError = null;
      const focused = tools.contains(document.activeElement) ? document.activeElement : null; pageVersion++;
      loading = true; data = null; currentPage = null; drawing.replaceChildren(); previous.disabled = next.disabled = retry.disabled = true; status.textContent = 'Reading the value’s exact application spine…';
      try { const result = await readModel(controller.signal); if (disposed || request !== version || !isCurrent()) return; data = result; draw(); }
      catch (error) { if (!disposed && request === version && isCurrent()) status.textContent = 'Value structure unavailable: ' + error.message + '. Exact constructor fields remain available.'; }
      finally { if (!disposed && request === version && isCurrent()) { loading = false; retry.disabled = false; if (focused && [document.body, focused].includes(document.activeElement)) (focused.disabled ? retry : focused).focus({ preventScroll: true }); } }
    }
    function cancel() { cancelPreviews(); if (!loading) return; version++; pageVersion++; controller?.abort(); loading = false; data = null; currentPage = null; drawing.replaceChildren(); retry.disabled = false; status.textContent = 'Value reading cancelled. Retry to reopen the application inputs.'; }
    load();
    return { cancel, state: () => ({ loading, index, offset: currentPage?.offset ?? 0, data, page: currentPage, previewLoading, previews, previewError }), dispose: () => { if (disposed) return; disposed = true; version++; controller?.abort(); cancelPreviews(); data = null; currentPage = null; root.replaceChildren(); } };
  }
  const api = { spine, read, page, mount, limits }; if (node) module.exports = api; else host.ProofAtlasApplicationCollar = api;
})(typeof window === 'undefined' ? globalThis : window);
