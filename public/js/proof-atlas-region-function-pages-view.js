/* Checked conditional functions beside their original application region. */
(function(host) {
  'use strict';
  const P = host.ProofAtlasRegionFunctionPages, V = host.ProofAtlasComputedTypeNeighborhoodView;
  const el = (tag, text, cls) => { const value = document.createElement(tag); if (text !== undefined) value.textContent = text; if (cls) value.className = cls; return value; };
  const button = (text, action) => { const value = el('button', text); value.type = 'button'; value.onclick = action; return value; };
  function mount(root, { descriptor, selectedCall = null, onCalls = () => {}, onSource = () => {} }) {
    const box = el('section', undefined, 'fp-reader'); box.dataset.regionFunctionReader = ''; root.replaceChildren(box);
    box.append(el('h3', 'A source-use region as a checked function'));
    const directProfile = [...(host.PROOF_ATLAS_REGION_FUNCTION_PAGES?.profiles || []), ...(host.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES?.profiles || [])].find(item => P?.sourceEqual(item.source, descriptor.source));
    const adapterProfile = host.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES?.profiles.find(item => P?.sourceEqual(item.source, descriptor.source));
    const specializingProfile = host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES?.profiles.find(item => P?.sourceEqual(item.source, descriptor.source));
    const ruleProfiles = new Map([['direct',directProfile],['adapters',adapterProfile],['source-specializing',specializingProfile]]);
    let profile = directProfile;
    if (!P || !V || !profile) {
      box.append(el('p', 'No checked region function is recorded for this source packet. Original source geometry remains available.'));
      return { markCall: () => {}, state: () => ({ status: 'unavailable' }), dispose: () => root.replaceChildren() };
    }
    const ruleLabel=el('label','Interface rule '),ruleSelect=el('select');ruleSelect.dataset.regionFunctionRule='';ruleLabel.append(ruleSelect);
    for(const [id,text] of [['direct','Direct inputs'],...(adapterProfile?[['adapters','Additional adapter inputs']]:[]),...(specializingProfile?[['source-specializing','Source-specializing inputs']]:[])]){const option=el('option',text);option.value=id;ruleSelect.append(option);}
    const controls = el('div', undefined, 'an-controls'), label = el('label', 'Recorded input policy '), select = el('select');
    select.dataset.regionFunctionCase = ''; label.append(select);
    const componentLabel = el('label', 'Computed component '), componentSelect = el('select'); componentSelect.dataset.regionFunctionComponent = ''; componentLabel.append(componentSelect);
    const retry = button('Retry region function', () => choose(wanted)); controls.append(ruleLabel, label, componentLabel, retry);
    const status = el('p'), ports = el('div', undefined, 'fp-ports'), fields = el('div'), sourceBox = el('div'), evidence = el('details');
    const bindingList = el('details'), bindingSummary = el('summary', 'Inputs, computations and source portals'), bindingDescription = el('p');
    bindingList.dataset.regionFunctionBindings = '';
    const bindingControls=el('div',undefined,'an-controls'),orderLabel=el('label','Binding list order '),orderSelect=el('select');
    orderSelect.dataset.regionFunctionOrder='';orderLabel.append(orderSelect);
    for(const [value,text]of [['declaration','Computed declaration order'],['creation','Port creation order']]){const option=el('option',text);option.value=value;orderSelect.append(option);}
    const previousBindings=button('Previous bindings',()=>{bindingOffset=Math.max(0,bindingOffset-4);renderBindings();}),nextBindings=button('Next bindings',()=>{bindingOffset+=4;renderBindings();}),bindingRange=el('span');
    bindingRange.setAttribute('role','status');bindingRange.dataset.regionFunctionBindingRange='';bindingControls.append(orderLabel,previousBindings,nextBindings,bindingRange);
    const ordering=el('details');ordering.dataset.regionFunctionPermutations='';
    bindingList.append(bindingSummary,bindingDescription,bindingControls,ordering,ports);
    const loadCalls = button('Load recorded region calls', () => { if (!disposed && lease) onCalls([...profile.members]); });
    status.setAttribute('role', 'status'); status.dataset.regionFunctionStatus = '';
    box.append(el('p', 'Recorded region: calls ' + profile.members.join(', ') + '. Original, reduced and closed scopes remain separate. Inspecting a field adds no new typing judgment and supplies no new source-use edge.'), controls, status, loadCalls, fields, bindingList, sourceBox, evidence);
    const labels = { 'proof-arguments': 'Proof arguments', 'proof-and-function-inputs': 'Proof arguments and proof-valued heads', 'all-boundary-positions': 'All boundary positions' };
    function policyOptions(){select.replaceChildren();for (const item of profile.cases) { const option = el('option', labels[item.id] + (item.status === 'KERNEL_REJECTED' ? ' · kernel rejected' : '')); option.value = item.id; select.append(option); }}
    policyOptions();
    bindingControls.hidden=true;ordering.hidden=true;
    let disposed = false, lease = null, wanted = null, current = null, controller = null, fieldController = null;
    let bindingOffset=0, bindingOrder='declaration', renderedOrder=null, selectedBindingKey=null, sourceMatch=null, lastSource=null;
    let version = 0, fieldVersion = 0, activeCall = selectedCall, requestedCall = selectedCall, loading = false, scene = null, sourceTarget = null;
    let notationWanted = false, notationCursor = null, notationScene = null, notationController = null, notationVersion = 0, notationLoading = false, readCurrentNotation = null;
    const live = value => !disposed && value === version;
    function retireNotation() {
      notationVersion++; notationController?.abort(); notationController = null; notationCursor?.dispose(); notationCursor = null; notationScene = null; notationLoading = false;
    }
    function retire() {
      retireNotation();
      readCurrentNotation = null;
      version++; fieldVersion++; controller?.abort(); fieldController?.abort(); lease?.dispose(); lease = null; current = null; scene = null; sourceTarget = null;
      ports.replaceChildren(); ordering.replaceChildren(); bindingControls.hidden=true; ordering.hidden=true; selectedBindingKey=null; sourceMatch=null; fields.replaceChildren(); sourceBox.replaceChildren(); evidence.replaceChildren(); componentSelect.replaceChildren();
      bindingList.hidden = true; loadCalls.disabled = true;
    }
    function clearField(message){fieldController?.abort();retireNotation();readCurrentNotation=null;fieldVersion++;loading=false;scene=null;selectedBindingKey=null;sourceMatch=null;sourceTarget=null;fields.replaceChildren();sourceBox.replaceChildren();status.textContent=message;}
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
    async function navigate(component, slots = [], focus = false, expectedAddress = null) {
      if (!lease?.neighborhood || disposed) return;
      retireNotation();
      readCurrentNotation = null;
      fieldController?.abort(); fieldController = new AbortController();
      const value = version, field = ++fieldVersion, owner = lease;
      loading = true; scene = null; sourceTarget = null; fields.replaceChildren(); sourceBox.replaceChildren(); componentSelect.value = component;
      status.textContent = 'Checking the computed component path and its lexical scope…';
      try {
        const cut = await owner.neighborhood(component, slots, { signal: fieldController.signal });
        if(expectedAddress && JSON.stringify(cut.root.address)!==JSON.stringify(expectedAddress))throw Error('Computed counterpart path does not match its recorded address');
        if (!live(value) || field !== fieldVersion || owner !== lease) return;
        scene = cut;
        const view = V.create(cut, address => {
          if (!live(value) || field !== fieldVersion || owner !== lease) return;
          if (address.namespace === 'source-expression') showSource(address);
          else navigate(address.component, address.route.slots, true);
        });
        const detail = el('details'); detail.append(el('summary', 'Exact computed address'), el('pre', JSON.stringify(cut.root.address, null, 2)));
        const modes = el('div', undefined, 'an-controls'), notation = el('div'), notationStatus = el('p');
        const readNotation = button('Read field notation', () => openNotation()), constructors = button('Constructor fields', () => {
          if (!currentField()) return;
          notationWanted = false; retireNotation(); notation.hidden = true; notationStatus.textContent = ''; view.hidden = false;
          readNotation.disabled = false; constructors.disabled = true; view.focus({ preventScroll: true });
        });
        notation.dataset.regionFunctionNotation = ''; notation.hidden = true; notationStatus.dataset.regionFunctionNotationStatus = ''; notationStatus.setAttribute('role', 'status');
        modes.append(readNotation, constructors); constructors.disabled = true;
        fields.replaceChildren(modes, notationStatus, notation, view, detail);
        const currentField = () => live(value) && field === fieldVersion && owner === lease;
        function drawNotation(next, request) {
          notationScene = next; notation.replaceChildren();
          host.ProofAtlasTypeNotationView.draw(notation, { scene: next, occurrenceLabel: 'computed',
            isCurrent: () => currentField() && notationWanted && !notationLoading && request === notationVersion,
            onSelect: path => navigate(component, path, true),
            onExpand: path => expandNotation(path) });
        }
        async function expandNotation(path) {
          if (!currentField() || notationLoading || !notationCursor || !notationScene) return;
          const request = ++notationVersion, previous = notationScene, cursor = notationCursor; notationLoading = true;
          notationStatus.textContent = 'Opening the selected notation frontier…';
          try {
            const next = await cursor.expand(previous, path, { signal: notationController.signal });
            if (!currentField() || request !== notationVersion) return;
            drawNotation(next, request); notationStatus.textContent = 'The surrounding inspected expression is retained. Counts belong to this computed component.';
          } catch (error) {
            if (currentField() && request === notationVersion) { drawNotation(previous, request); notationStatus.textContent = 'Frontier unchanged: ' + error.message; }
          } finally {
            if (currentField() && request === notationVersion) {
              notationLoading = false;
              [...notation.querySelectorAll('[data-tn-pick]')].find(button => button.dataset.tnPick === JSON.stringify(path))?.focus({ preventScroll: true });
            }
          }
        }
        async function openNotation() {
          if (!currentField() || notationLoading) return;
          notationWanted = true; const request = ++notationVersion; notationLoading = true;
          notationController?.abort(); notationController = new AbortController();
          notationCursor?.dispose(); notationCursor = null; notationScene = null; notation.replaceChildren();
          readNotation.disabled = true; constructors.disabled = false; notation.hidden = false; view.hidden = true;
          notationStatus.textContent = 'Loading recoverable notation through bounded pages…';
          try {
            if (!host.ProofAtlasTypeNotationView || !owner.openNotation) throw Error('Optional notation component unavailable');
            const cursor = await owner.openNotation(component, slots, { signal: notationController.signal });
            if (!currentField() || request !== notationVersion) { cursor.dispose(); return; }
            notationCursor = cursor; drawNotation(cursor.scene, request);
            notationStatus.textContent = 'Notation of the recorded expression. Type and instance arguments remain available; no new typing judgment.';
          } catch (error) {
            if (currentField() && request === notationVersion) { notationWanted = false; notation.hidden = true; view.hidden = false; readNotation.disabled = false; constructors.disabled = true; notationStatus.textContent = 'Notation unavailable: ' + error.message + '. Constructor fields remain available.'; }
          } finally { if (currentField() && request === notationVersion) notationLoading = false; }
        }
        readCurrentNotation = openNotation;
        const m = owner.manifest;
        status.textContent = m.constraintRule ? 'Recorded closed typing and source recovery: PASS. '+m.independentInputs+' independent inputs; '+m.derivedInputs+' derived boundary definitions; '+(m.boundaryPositions-m.independentInputs-m.derivedInputs)+' fixed boundary positions. Original Γ'+m.context.original.length+' → retained Γ'+m.context.reduced.length+'. Fields show syntax and binding only.' : 'Recorded closed typing and source recovery: PASS. ' + (m.boundaryInputs ?? m.independentInputs) + ' supplied inputs; ' + (m.adapterInputs ? m.adapterInputs + ' additional adapter functions; ' : '') + (m.boundaryPositions - (m.boundaryInputs ?? m.independentInputs)) + ' fixed boundary positions. Original Γ' + m.context.original.length + ' → retained Γ' + m.context.reduced.length + '. Fields show syntax and binding only.';
        if (notationWanted) await openNotation();
        if (focus) (notationWanted && !notation.hidden ? notation.querySelector('.tn-expression') : view)?.focus({ preventScroll: true });
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
        for (const component of m.components) { const option = el('option', (component.label||component.component) + ' · ' + component.scope + ' Γ' + m.context[component.scope].length); option.value = component.component; componentSelect.append(option); }
        const inputs = loaded.bindings.filter(binding => binding.kind === 'input'), adapters = loaded.bindings.filter(binding => binding.kind === 'adapter');
        bindingList.hidden = false; bindingSummary.textContent = inputs.length + ' supplied inputs · ' + (adapters.length ? adapters.length + ' additional adapters · ' : '') + m.members.length + ' result computations';
        bindingDescription.textContent = inputs.length ? inputs.length + ' independent input positions. Their domains are inspected inside the recorded function, with earlier binders retained.' : 'This policy supplies no new inputs; it is a fixed-input closure.';
        if(adapters.length)bindingDescription.textContent+=' Adapters are supplied functions from produced types to required types. Their existence is not inferred. Identity specialization recovers the original source.';
        bindingOffset=0;bindingOrder='declaration';orderSelect.value=bindingOrder;
        if(m.constraintRule){bindingSummary.textContent=m.independentInputs+' independent inputs · '+m.derivedInputs+' derived definitions · '+m.members.length+' results';bindingDescription.textContent='Source call and slot identities stay fixed. Port creation order and computed declaration order are separate. Four bindings are shown at a time.';
          ordering.hidden=!m.permutations.length;if(m.permutations.length){ordering.append(el('summary','Recorded declaration order changes'));for(const permutation of m.permutations){const target=loaded.bindings.find(b=>b.key===permutation.cause);ordering.append(el('p',bindingLabel(target)+': declaration '+(permutation.old.indexOf(target.key)+1)+' → '+(permutation.new.indexOf(target.key)+1)+'. Original source port unchanged.'),button('Inspect moved '+bindingLabel(target),()=>inspectBinding(target,'value')));}}
        }
        renderBindings();
        markPorts();
        await navigate('function.reduced');
        if(m.constraintRule&&lastSource)await markSource(lastSource.call,lastSource.slot,lastSource.address);
      } catch (error) { if (live(value)) { loading = false; current = null; status.textContent = 'Region function unavailable: ' + error.message + '. Original source geometry remains available.'; } }
      finally { if (live(value)) retry.disabled = false; }
    }
    function bindingLabel(binding){return binding.kind==='result'?'result call '+binding.call:'input '+binding.call+':'+binding.slot;}
    function orderedBindings(){const all=lease?.bindings||[];return bindingOrder==='creation'&&lease?.manifest.creationOrder?lease.manifest.creationOrder.map(key=>all.find(b=>b.key===key)):all;}
    function showBinding(binding){const ordered=orderedBindings(),index=ordered.indexOf(binding),offset=Math.floor(Math.max(0,index)/4)*4;
      const visible=[...ports.querySelectorAll('[data-region-function-key]')].some(row=>row.dataset.regionFunctionKey===binding.key);
      if(offset!==bindingOffset||renderedOrder!==bindingOrder||!visible){bindingOffset=offset;renderBindings();}
    }
    function inspectBinding(binding,field){if(!lease?.bindings.includes(binding)||!binding?.[field])return false;selectedBindingKey=binding.key||null;sourceMatch=null;if(lease.manifest.constraintRule)showBinding(binding);return navigate(binding[field].component,binding[field].route.slots,true);}
    function renderBindings(){
      if(!lease?.bindings)return;ports.replaceChildren();renderedOrder=bindingOrder;const specialized=!!lease.manifest.constraintRule,all=orderedBindings();
      bindingControls.hidden=!specialized;bindingOffset=Math.min(bindingOffset,Math.floor(Math.max(0,all.length-1)/4)*4);
      const visibleBindings=(specialized?all.slice(bindingOffset,bindingOffset+4):all).map(binding=>[lease.bindings.indexOf(binding),binding]),value=version;
      previousBindings.disabled=bindingOffset===0;nextBindings.disabled=bindingOffset+4>=all.length;bindingRange.textContent='Bindings '+(all.length?bindingOffset+1:0)+'–'+Math.min(bindingOffset+4,all.length)+' of '+all.length;
        for (const [i, binding] of visibleBindings) {
          const input = binding.kind === 'input', adapter = binding.kind === 'adapter', derived = binding.kind === 'derived-input', boundary = input || derived, row = el('div', undefined, 'fp-port');
          row.dataset.regionFunctionCall = String(binding.call); row.dataset.regionFunctionBinding = String(i);
          row.append(el('strong', adapter ? 'Adapter for input ' + binding.call + ':' + binding.slot : derived ? 'Derived input ' + binding.call + ':' + binding.slot : input ? 'Input ' + binding.call + ':' + binding.slot : 'Result call ' + binding.call),
            button('Inspect ' + (adapter ? 'adapter' : derived ? 'derived input' : input ? 'input' : 'result') + ' binder ' + i, () => { if (live(value)) inspectBinding(binding,'binder'); }),
            button('Inspect domain ' + i, () => { if (live(value)) inspectBinding(binding,'domain'); }));
          if(adapter){row.append(button('Produced type for adapter '+i,()=>{if(live(value))navigate(binding.domain.component,[...binding.domain.route.slots,0],true);}),button('Required type for adapter '+i,()=>{if(live(value))navigate(binding.domain.component,[...binding.domain.route.slots,1],true);}),button('Select source input for adapter '+i,()=>{if(live(value))onSource(binding.call,binding.slot,binding.originalInput,false);}),sourceLink(binding.originalInput,'Open source input requiring this adapter',binding.call,binding.slot));}
          if (!input && !adapter) row.append(button(derived ? 'Inspect definition ' + binding.call + ':' + binding.slot : 'Inspect computation ' + binding.call, () => { if (live(value)) inspectBinding(binding,'value'); }));
          if(!adapter)row.append(button('Select original ' + (boundary ? 'input ' + binding.call + ':' + binding.slot : 'result ' + binding.call), () => { if (live(value)) onSource(binding.call, boundary ? binding.slot : 0, binding.original, !boundary); }), sourceLink(binding.original, 'Open exact original occurrence', binding.call, boundary ? binding.slot : 0, !boundary));
          if(binding.key){row.dataset.regionFunctionKey=binding.key;row.prepend(el('p','Declaration '+(i+1)+' · '+binding.key,'an-caption'));}
          if(derived){
            const record=lease.manifest.derivations[binding.constraint],extra=el('details');extra.append(el('summary','Recorded source recovery'));
            for(const [label,component]of [['Original source value',record.components.original],['Specialized definition',record.components.specialized],['Source-recovery equality',record.components.equality],['Source-recovery witness',record.components.witness]])extra.append(button(label,()=>{if(live(value)){selectedBindingKey=binding.key;navigate(component,[],true);}}));
            extra.append(el('p','Assignment and complete source-value recovery: recorded PASS. Current fields use declaration order; the native assignment keeps its own predecessor context.'));
            const context=el('details');context.append(el('summary','Native assignment owner'),el('pre',JSON.stringify({bindingKey:record.bindingKey,trigger:record.trigger,predecessorKeys:record.predecessorKeys,nativeInventorySha256:lease.manifest.nativeInventorySha256,nativeCaseSha256:lease.manifest.nativeCaseSha256},null,2)));extra.append(context);row.append(extra);
            const template=lease.manifest.templates.find(t=>t.bindingKey===binding.key);
            if(template){const captures=el('details');captures.append(el('summary','Source-lambda correspondence'),el('p','Derived constructor rewrite. Captured values retain their binding identities; this is not an original source-use edge.'),button('Complete original lambda',()=>{if(live(value)){selectedBindingKey=binding.key;navigate(template.originalComponent,[],true);}}),button('Rebuilt lambda in declaration context',()=>inspectBinding(binding,'value')));
              for(const pattern of template.patterns){const group=el('p');group.append(button('Original captured value '+pattern.group,()=>{if(live(value))navigate(pattern.sourceComponent,[],true);}));for(const key of pattern.targets){const target=lease.bindings.find(b=>b.key===key);group.append(button('Captured '+bindingLabel(target),()=>inspectBinding(target,'binder')));}captures.append(group);}row.append(captures);
            }
          }
          ports.append(row);
        }
      markPorts();
    }
    orderSelect.onchange=()=>{bindingOrder=orderSelect.value;bindingOffset=0;const selected=lease?.bindings.find(b=>b.key===selectedBindingKey);if(selected)showBinding(selected);else renderBindings();};
    async function markSource(call,slot,address){
      lastSource={call,slot,address:JSON.parse(JSON.stringify(address))};
      if(!lease?.manifest.constraintRule)return false;
      const equal=(a,b)=>a&&b&&a.namespace===b.namespace&&a.name===b.name&&a.indexSha256===b.indexSha256&&a.sourceSha256===b.sourceSha256&&a.node===b.node&&JSON.stringify(a.route)===JSON.stringify(b.route);
      const result=lease.bindings.find(b=>b.kind==='result'&&b.call===call&&equal(b.original,address));
      const port=lease.portMap.find(p=>p.call===call&&p.slot===slot&&equal(p.original,address));
      const producer=lease.bindings.find(b=>b.kind==='result'&&equal(b.original,address));
      const target=result?.value||port?.counterpart||producer?.value,binding=result||lease.bindings.find(b=>b.key===port?.bindingKey)||producer;
      if(!target){clearField('No recorded function counterpart for this selection. The previous component is cleared.');return false;}
      selectedBindingKey=binding?.key||null;if(binding)showBinding(binding);
      const expected={source:JSON.parse(JSON.stringify(address)),counterpart:target,relation:port?.relation||'result',call,slot,bindingKey:binding?.key||null};sourceMatch=expected;
      await navigate(target.component,target.route.slots,false,target);
      return !!scene&&JSON.stringify(scene.root.address)===JSON.stringify(target);
    }
    function markCall(call) {
      if (disposed || call === requestedCall) return; requestedCall = call; activeCall = call;
      if (profile.members.includes(call)) { if (current) {if(lease?.manifest.constraintRule){const binding=lease.bindings.find(b=>b.call===call);if(binding)showBinding(binding);}markPorts();} else choose('proof-arguments'); }
      else { retire(); wanted = null; loading = false; select.selectedIndex = -1; retry.disabled = true; status.textContent = 'No recorded region contains source call ' + call + '. Choose an input policy explicitly; the previous computed component is cleared.'; }
    }
    ruleSelect.onchange=()=>{profile=ruleProfiles.get(ruleSelect.value);policyOptions();choose('all-boundary-positions');};
    select.onchange = () => choose(select.value); componentSelect.onchange = () => navigate(componentSelect.value);
    requestedCall = undefined; markCall(selectedCall);
    return { markCall, markSource, async showNotation() { if (!scene || !readCurrentNotation) return false; await readCurrentNotation(); return !!notationScene; }, async selectCase(id, index = null, field = 'domain', tail = [], rule = null) {
      if(rule!==null){const next=ruleProfiles.get(rule)||null;if(!next){retire();loading=false;status.textContent='The requested interface rule is unavailable.';return false;}profile=next;ruleSelect.value=rule;policyOptions();}
      const opening=choose(id),ownVersion=version;await opening; if(!live(ownVersion) || !lease) return false;
      if(index === null) return true;
      const binding = typeof index==='string'?lease.bindings?.find(b=>b.key===index):Number.isSafeInteger(index) && index >= 0 ? lease.bindings?.[index] : null;
      if(binding?.key){selectedBindingKey=binding.key;showBinding(binding);}
      let address = ['binder','domain','value'].includes(field) ? binding?.[field] : null;
      if(binding?.kind==='adapter'&&['actual','required'].includes(field))address={...binding.domain,route:{...binding.domain.route,slots:[...binding.domain.route.slots,field==='actual'?0:1]}};
      if(!address){clearField('The requested computed binding field is unavailable in this record.');return false;}
      if(!Array.isArray(tail)||tail.length+address.route.slots.length>512||!tail.every(slot=>Number.isInteger(slot)&&slot>=0&&slot<3)){clearField('The requested computed field path is outside its bounds.');return false;}
      await navigate(address.component,[...address.route.slots,...tail]);return !disposed && !!scene;
    }, state: () => ({ status: disposed ? 'disposed' : lease ? lease.manifest.status === 'PASS' ? 'ready' : 'kernel-rejected' : current ? 'loading' : 'unavailable', loading, rule:ruleSelect.value, case: current?.id || null, activeCall, selection: scene?.root.address || null, sourceTarget, bindingKey:selectedBindingKey,bindingOrder,bindingOffset,sourceMatch:sourceMatch&&scene&&JSON.stringify(sourceMatch.counterpart)===JSON.stringify(scene.root.address)?sourceMatch:null, lease: lease?.state() || null,
      notation: notationWanted ? { loading: notationLoading, owner: notationScene?.root.origin || null, stats: notationScene?.stats || null, lease: notationCursor?.state() || null } : null }),
      dispose: () => { if (disposed) return; retire(); disposed = true; root.replaceChildren(); } };
  }
  host.ProofAtlasRegionFunctionPagesView = { mount };
})(window);
