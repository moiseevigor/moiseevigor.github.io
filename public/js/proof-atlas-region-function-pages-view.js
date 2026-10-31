/* Checked conditional functions beside their original application region. */
(function(host) {
  'use strict';
  const P = host.ProofAtlasRegionFunctionPages, V = host.ProofAtlasComputedTypeNeighborhoodView;
  const el = (tag, text, cls) => { const value = document.createElement(tag); if (text !== undefined) value.textContent = text; if (cls) value.className = cls; return value; };
  const button = (text, action) => { const value = el('button', text); value.type = 'button'; value.onclick = action; return value; };
  function mount(root, { descriptor, selectedCall = null, onCalls = () => {}, onSource = () => {} }) {
    const box = el('section', undefined, 'fp-reader'); box.dataset.regionFunctionReader = ''; root.replaceChildren(box);
    box.append(el('h3', 'A source-use region as a checked function'));
    const profile = [...(host.PROOF_ATLAS_REGION_FUNCTION_PAGES?.profiles || []), ...(host.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES?.profiles || [])].find(item => P?.sourceEqual(item.source, descriptor.source));
    if (!P || !V || !profile) {
      box.append(el('p', 'No checked region function is recorded for this source packet. Original source geometry remains available.'));
      return { markCall: () => {}, state: () => ({ status: 'unavailable' }), dispose: () => root.replaceChildren() };
    }
    const controls = el('div', undefined, 'an-controls'), label = el('label', 'Recorded input policy '), select = el('select');
    select.dataset.regionFunctionCase = ''; label.append(select);
    const componentLabel = el('label', 'Computed component '), componentSelect = el('select'); componentSelect.dataset.regionFunctionComponent = ''; componentLabel.append(componentSelect);
    const retry = button('Retry region function', () => choose(wanted)); controls.append(label, componentLabel, retry);
    const status = el('p'), ports = el('div', undefined, 'fp-ports'), fields = el('div'), sourceBox = el('div'), evidence = el('details');
    const bindingList = el('details'), bindingSummary = el('summary', 'Inputs, computations and source portals'), bindingDescription = el('p');
    bindingList.dataset.regionFunctionBindings = ''; bindingList.append(bindingSummary, bindingDescription, ports);
    const loadCalls = button('Load recorded region calls', () => { if (!disposed && lease) onCalls([...profile.members]); });
    status.setAttribute('role', 'status'); status.dataset.regionFunctionStatus = '';
    box.append(el('p', 'Recorded region: calls ' + profile.members.join(', ') + '. Original, reduced and closed scopes remain separate. Inspecting a field adds no new typing judgment and supplies no new source-use edge.'), controls, status, loadCalls, fields, bindingList, sourceBox, evidence);
    const labels = { 'proof-arguments': 'Proof arguments', 'proof-and-function-inputs': 'Proof arguments and proof-valued heads', 'all-boundary-positions': 'All boundary positions' };
    for (const item of profile.cases) { const option = el('option', labels[item.id] + (item.status === 'KERNEL_REJECTED' ? ' · kernel rejected' : '')); option.value = item.id; select.append(option); }
    let disposed = false, lease = null, wanted = null, current = null, controller = null, fieldController = null;
    let version = 0, fieldVersion = 0, activeCall = selectedCall, requestedCall = selectedCall, loading = false, scene = null, sourceTarget = null;
    const live = value => !disposed && value === version;
    function retire() {
      version++; fieldVersion++; controller?.abort(); fieldController?.abort(); lease?.dispose(); lease = null; current = null; scene = null; sourceTarget = null;
      ports.replaceChildren(); fields.replaceChildren(); sourceBox.replaceChildren(); evidence.replaceChildren(); componentSelect.replaceChildren();
      bindingList.hidden = true; loadCalls.disabled = true;
    }
    function sourceLink(address, text = 'Open exact original occurrence', call = activeCall ?? profile.members[0], slot = 0, result = false) {
      const explorer = ['published-15', 'working-26', 'goedel-sample-4331'].includes(profile.source.edition);
      const ownerVersion = version;
      const link = explorer ? el('a', text) : button('Select exact occurrence in source inspector', () => { if (live(ownerVersion)) onSource(call, slot, address, result); });
      link.dataset.regionFunctionSource = JSON.stringify(address); link.dataset.regionFunctionSourceMode = explorer ? 'explorer' : 'inline';
      if (explorer) link.href = '/projects/proof-atlas/library/?loading=paged&edition=' + encodeURIComponent(profile.source.edition) + '&proof=' + encodeURIComponent(profile.source.name) + '&route=' + encodeURIComponent(address.route.root + ':' + address.route.slots.join('.')) + '#expr-' + address.node;
      return link;
    }
    function showSource(address) {
      sourceTarget = address;
      sourceBox.replaceChildren(el('h4', 'Original context binder'), el('p', 'This binder belongs to the original context, outside the computed component.'), sourceLink(address));
    }
    async function navigate(component, slots = [], focus = false) {
      if (!lease?.neighborhood || disposed) return;
      fieldController?.abort(); fieldController = new AbortController();
      const value = version, field = ++fieldVersion, owner = lease;
      loading = true; scene = null; sourceTarget = null; fields.replaceChildren(); sourceBox.replaceChildren(); componentSelect.value = component;
      status.textContent = 'Checking the computed component path and its lexical scope…';
      try {
        const cut = await owner.neighborhood(component, slots, { signal: fieldController.signal });
        if (!live(value) || field !== fieldVersion || owner !== lease) return;
        scene = cut;
        const view = V.create(cut, address => {
          if (!live(value) || field !== fieldVersion || owner !== lease) return;
          if (address.namespace === 'source-expression') showSource(address);
          else navigate(address.component, address.route.slots, true);
        });
        const detail = el('details'); detail.append(el('summary', 'Exact computed address'), el('pre', JSON.stringify(cut.root.address, null, 2)));
        fields.replaceChildren(view, detail);
        const m = owner.manifest;
        status.textContent = 'Recorded closed typing and source recovery: PASS. ' + m.independentInputs + ' supplied inputs; ' + (m.boundaryPositions - m.independentInputs) + ' fixed boundary positions. Original Γ' + m.context.original.length + ' → retained Γ' + m.context.reduced.length + '. Fields show syntax and binding only.';
        if (focus) view.focus({ preventScroll: true });
      } catch (error) { if (live(value) && field === fieldVersion) { scene = null; status.textContent = 'Computed fields unavailable: ' + error.message + '. Retry preserves the original source graph.'; } }
      finally { if (live(value) && field === fieldVersion) loading = false; }
    }
    function markPorts() {
      for (const row of ports.querySelectorAll('[data-region-function-call]')) row.classList.toggle('fp-active', Number(row.dataset.regionFunctionCall) === activeCall);
    }
    async function choose(id) {
      if (disposed) return; retire(); wanted = id;
      const item = profile.cases.find(item => item.id === id), value = version;
      if (!item) return;
      current = item; select.value = id; loading = true; controller = new AbortController(); retry.disabled = true;
      status.textContent = 'Checking the recorded region function and scope owners…';
      try {
        const loaded = await P.open(item, descriptor.source, { signal: controller.signal });
        if (!live(value)) { loaded.dispose(); return; } lease = loaded;
        loadCalls.disabled = false;
        const m = loaded.manifest;
        evidence.append(el('summary', 'Native owner and limits'), el('pre', JSON.stringify({ source: m.source, nativeInventorySha256: m.nativeInventorySha256, nativeCaseSha256: m.nativeCaseSha256, manifestSha256: item.sha256, judgments: m.judgments || m.rejection }, null, 2)), el('p', 'Finite recorded candidates in a common source context after source-let unfolding. Supplied facts are not a minimal premise set. General dependent-region interfaces and human comprehension remain unproved.'));
        if (m.status === 'KERNEL_REJECTED') {
          loading = false;
          status.textContent = 'This input policy was rejected by kernel type conversion at call ' + m.rejection.call + ', input ' + m.rejection.slot + '. The original proof is not rejected. No previous computed fields are retained.';
          const address = loaded.rejectionAddress();
          bindingList.hidden = false; bindingSummary.textContent = 'Rejected candidate source input'; bindingDescription.textContent = 'The original input remains available; this policy has no checked function component.';
          ports.append(sourceLink(address, 'Open original input ' + m.rejection.call + ':' + m.rejection.slot, m.rejection.call, m.rejection.slot), button('Inspect original input ' + m.rejection.call + ':' + m.rejection.slot, () => { if (live(value)) onSource(m.rejection.call, m.rejection.slot, address, false); }));
          return;
        }
        for (const component of m.components) { const option = el('option', component.component + ' · ' + component.scope + ' Γ' + m.context[component.scope].length); option.value = component.component; componentSelect.append(option); }
        const inputs = loaded.bindings.filter(binding => binding.kind === 'input');
        bindingList.hidden = false; bindingSummary.textContent = inputs.length + ' supplied inputs · ' + m.members.length + ' result computations';
        bindingDescription.textContent = inputs.length ? inputs.length + ' independent input positions. Their domains are inspected inside the recorded function, with earlier binders retained.' : 'This policy supplies no new inputs; it is a fixed-input closure.';
        for (const [i, binding] of loaded.bindings.entries()) {
          const input = binding.kind === 'input', row = el('div', undefined, 'fp-port');
          row.dataset.regionFunctionCall = String(binding.call); row.dataset.regionFunctionBinding = String(i);
          row.append(el('strong', input ? 'Input ' + binding.call + ':' + binding.slot : 'Result call ' + binding.call),
            button('Inspect ' + (input ? 'input' : 'result') + ' binder ' + i, () => { if (live(value)) navigate(binding.binder.component, binding.binder.route.slots, true); }),
            button('Inspect domain ' + i, () => { if (live(value)) navigate(binding.domain.component, binding.domain.route.slots, true); }));
          if (!input) row.append(button('Inspect computation ' + binding.call, () => { if (live(value)) navigate(binding.value.component, binding.value.route.slots, true); }));
          row.append(button('Select original ' + (input ? 'input ' + binding.call + ':' + binding.slot : 'result ' + binding.call), () => { if (live(value)) onSource(binding.call, input ? binding.slot : 0, binding.original, !input); }), sourceLink(binding.original, 'Open exact original occurrence', binding.call, input ? binding.slot : 0, !input));
          ports.append(row);
        }
        markPorts();
        await navigate('function.reduced');
      } catch (error) { if (live(value)) { loading = false; current = null; status.textContent = 'Region function unavailable: ' + error.message + '. Original source geometry remains available.'; } }
      finally { if (live(value)) retry.disabled = false; }
    }
    function markCall(call) {
      if (disposed || call === requestedCall) return; requestedCall = call; activeCall = call;
      if (profile.members.includes(call)) { if (current) markPorts(); else choose('proof-arguments'); }
      else { retire(); wanted = null; loading = false; select.selectedIndex = -1; retry.disabled = true; status.textContent = 'No recorded region contains source call ' + call + '. Choose an input policy explicitly; the previous computed component is cleared.'; }
    }
    select.onchange = () => choose(select.value); componentSelect.onchange = () => navigate(componentSelect.value);
    requestedCall = undefined; markCall(selectedCall);
    return { markCall, async selectCase(id, index = null, field = 'domain', tail = []) {
      const opening=choose(id),ownVersion=version;await opening; if(!live(ownVersion) || !lease) return false;
      if(index === null) return true;
      const binding = Number.isSafeInteger(index) && index >= 0 ? lease.bindings?.[index] : null;
      const address = ['binder','domain','value'].includes(field) ? binding?.[field] : null;
      if(!address){scene=null;fields.replaceChildren();sourceBox.replaceChildren();sourceTarget=null;status.textContent='The requested computed binding field is unavailable in this record.';return false;}
      if(!Array.isArray(tail)||tail.length+address.route.slots.length>512||!tail.every(slot=>Number.isInteger(slot)&&slot>=0&&slot<3)){scene=null;fields.replaceChildren();sourceBox.replaceChildren();sourceTarget=null;status.textContent='The requested computed field path is outside its bounds.';return false;}
      await navigate(address.component,[...address.route.slots,...tail]);return !disposed && !!scene;
    }, state: () => ({ status: disposed ? 'disposed' : lease ? lease.manifest.status === 'PASS' ? 'ready' : 'kernel-rejected' : current ? 'loading' : 'unavailable', loading, case: current?.id || null, activeCall, selection: scene?.root.address || null, sourceTarget, lease: lease?.state() || null }),
      dispose: () => { if (disposed) return; retire(); disposed = true; root.replaceChildren(); } };
  }
  host.ProofAtlasRegionFunctionPagesView = { mount };
})(window);
