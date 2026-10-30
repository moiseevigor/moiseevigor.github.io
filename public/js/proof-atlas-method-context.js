/* Beta/alpha correspondence in an existing computed input context. No delta,
   arithmetic, annotation erasure, proof irrelevance or new kernel judgment. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const M = node ? require('./proof-atlas-method-interfaces') : host.ProofAtlasMethodInterfaces;
  const I = node ? require('./proof-atlas-branch-instantiation') : host.ProofAtlasBranchInstantiation;
  const owned = new WeakMap(), copy = x => JSON.parse(JSON.stringify(x));
  const limits = Object.freeze({cells: 16384, keyBytes: 4194304, keyWorkBytes: 16777216, countDigits: 524288, memo: 4096, frontier: 4096, work: 262144, calls: 512, reductions: 1024, renamings: 64, bytes: 262144});
  const demand = (ok, m) => {if (!ok) throw Error('Method context: ' + m);};
  const freeze = x => {if (x && typeof x === 'object' && !Object.isFrozen(x)) {Object.values(x).forEach(freeze); Object.freeze(x);} return x;};
  const bodySlot = (k, s) => ((k === 6 || k === 7) && s === 1 || k === 8 && s === 2) ? 1 : 0;
  function normalizePair(expected, expectedRoot, actual, actualRoot, count, focus, outer, options = {}) {
    const b = {...limits, ...options.bounds}, signal = options.signal;
    demand(Object.keys(b).length === Object.keys(limits).length, 'unknown bound');
    for (const k of Object.keys(limits)) demand(Number.isInteger(b[k]) && b[k] > 0 && b[k] <= limits[k], 'bound ' + k);
    demand(Number.isInteger(count) && count >= 0 && count <= 128 && Number.isInteger(outer) && outer >= 0, 'context inputs');
    const port = focus.kind === 'body' ? count : focus.ordinal;
    demand(focus.kind === 'body' || focus.kind === 'input' && Number.isInteger(port) && port >= 0 && port < count, 'selected port');
    for (const g of [expected, actual]) demand(g?.kind?.length > 0 && g.kind.length <= 65536, 'native graph bound');
    const g = {kind: [], children: [], payloads: [], neededScope: [], expanded: []};
    const intern = new Map(), caches = Array.from({length: 5}, () => new Map()), reductions = [];
    const state = {operations: 0, peakCalls: 0, peakMemo: 0, memoEvictions: 0, betaSteps: 0, keyBytes: 0, keyWorkBytes: 0, countDigits: 0};
    let calls = 0;
    function tick() {
      if (signal?.aborted) throw signal.reason || Error('Context comparison cancelled');
      demand(++state.operations <= b.work, 'work bound');
      state.peakCalls = Math.max(state.peakCalls, calls);
      demand(calls <= b.calls, 'call depth bound'); options.onProgress?.(state.operations);
    }
    function remember(cache, key, value) {
      if (cache.size === b.memo && !cache.has(key)) {cache.delete(cache.keys().next().value); state.memoEvictions++;}
      cache.set(key, value); state.peakMemo = Math.max(state.peakMemo, cache.size); return value;
    }
    function cached(cache, key, action) {
      calls++; try {tick(); if (cache.has(key)) {const v = cache.get(key); cache.delete(key); cache.set(key, v); return v;} return remember(cache, key, action());}
      finally {calls--;}
    }
    function add(kind, payload, children = []) {
      tick(); const key = kind + ':' + A.payloadKey(kind, payload) + ':' + children.join(',');
      const bytes=new TextEncoder().encode(key).length;state.keyWorkBytes+=bytes;demand(state.keyWorkBytes<=b.keyWorkBytes,'payload work byte bound');
      if (intern.has(key)) return intern.get(key);
      demand(state.keyBytes+bytes<=b.keyBytes,'interned key byte bound');state.keyBytes+=bytes;
      demand(g.kind.length < b.cells, 'derived cell bound'); const id = g.kind.length;
      g.kind.push(kind); g.payloads.push(payload); g.children.push(children);
      g.neededScope.push(kind === 0 ? payload.index + 1 : Math.max(0, ...children.map((c,s) => g.neededScope[c] - bodySlot(kind,s))));
      const expanded=(1n+children.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString();
      demand(state.countDigits+expanded.length<=b.countDigits,'count digit bound');state.countDigits+=expanded.length;g.expanded.push(expanded);
      intern.set(key,id); return id;
    }
    function source(which, id) {
      const from = which ? actual : expected;
      return cached(caches[which], id, () => {
        const kind = from.kind[id], cs = from.children[id];
        demand(Number.isInteger(kind) && kind >= 0 && kind < 12 && Array.isArray(cs) && cs.every(c => Number.isInteger(c) && c >= 0 && c < id), 'native postorder row');
        return add(kind, from.payloads[id], cs.map(c => source(which,c)));
      });
    }
    function lift(id, amount, depth = 0) {
      return cached(caches[2], [id,amount,depth].join(':'), () => g.kind[id] === 0
        ? add(0, {...g.payloads[id], index: g.payloads[id].index + (g.payloads[id].index >= depth ? amount : 0)})
        : add(g.kind[id], g.payloads[id], g.children[id].map((c,s) => lift(c,amount,depth+bodySlot(g.kind[id],s)))));
    }
    function substitute(id, argument, depth = 0) {
      return cached(caches[3], [id,argument,depth].join(':'), () => {
        const kind = g.kind[id], p = g.payloads[id];
        if (kind === 0) return p.index === depth ? lift(argument,depth) : add(0,{...p,index:p.index-(p.index>depth?1:0)});
        return add(kind,p,g.children[id].map((c,s) => substitute(c,argument,depth+bodySlot(kind,s))));
      });
    }
    function normal(id, context) {
      return cached(caches[4], id + ':' + context, () => {
        const kind = g.kind[id], cs = g.children[id].map((c,s) => normal(c,context+bodySlot(kind,s)));
        if (kind !== 5 || g.kind[cs[0]] !== 6) return add(kind,g.payloads[id],cs);
        demand(reductions.length < b.reductions, 'beta trace bound');
        const before = add(5,g.payloads[id],cs), after = substitute(g.children[cs[0]][1],cs[1]);
        demand(g.neededScope[before] <= context && g.neededScope[after] <= context, 'beta context escape');
        reductions.push({before,lambda:cs[0],argument:cs[1],after,contextLength:context}); state.betaSteps++;
        return normal(after,context);
      });
    }
    try {
      const whole = normal(source(0,expectedRoot),outer); let at = whole;
      for (let i=0;i<port;i++) {demand(g.kind[at]===7,'expected telescope after beta'); at=g.children[at][1];}
      if (focus.kind === 'input') {demand(g.kind[at]===7,'expected input after beta'); at=g.children[at][0];}
      const other = normal(source(1,actualRoot),outer+port);
      demand(g.neededScope[at] <= outer+port && g.neededScope[other] <= outer+port, 'port context escape');
      const renamings = [], renamed = new Set(), pending = [[at,other,[]]], seen = new Set(); let mismatch = null;
      while (pending.length) {
        tick(); demand(pending.length <= b.frontier,'comparison frontier bound');
        const [x,y,path] = pending.pop(), key=x+':'+y; if(seen.has(key))continue;
        if(seen.size===b.memo)seen.delete(seen.values().next().value);seen.add(key);
        const kind=g.kind[x];let p=g.payloads[x],q=g.payloads[y];
        if (kind!==g.kind[y] || g.children[x].length!==g.children[y].length) {mismatch={path,left:x,right:y,reason:'constructor'};break;}
        if ([6,7,8].includes(kind)) {
          const name=kind===8?'declName':'binderName', parts=name+'Parts';
          if (JSON.stringify([p[name],p[parts]])!==JSON.stringify([q[name],q[parts]])) {
            if(!renamed.has(key)){demand(renamings.length < b.renamings,'binder-name witness bound');renamed.add(key);
            renamings.push({left:x,right:y,path,from:{name:p[name],nameParts:copy(p[parts])},to:{name:q[name],nameParts:copy(q[parts])}});}
            p={...p};q={...q};delete p[name];delete p[parts];delete q[name];delete q[parts];
          }
        }
        if (A.payloadKey(kind,p)!==A.payloadKey(kind,q)) {mismatch={path,left:x,right:y,reason:'payload'};break;}
        g.children[x].forEach((c,s)=>pending.push([c,g.children[y][s],[...path,s]]));
      }
      if(signal?.aborted)throw signal.reason||Error('Context comparison cancelled');
      return {graph:g,expectedRoot:at,actualRoot:other,wholeExpectedRoot:whole,reductions,
        status:mismatch?'unavailable':'checked',relation:mismatch?'beta-normal-forms-differ':renamings.length?'beta-and-explicit-binder-renaming':'beta-normal-forms-identical',
        renamings:mismatch?[]:renamings,mismatch,state:{...state,derivedCells:g.kind.length,bounds:b}};
    } finally {caches.forEach(c=>c.clear());intern.clear();}
  }
  function compare(data, parent, focus = {kind:'body'}, options = {}) {
    demand(M.isFlowData(data),'validated method'); I.accepts(parent,data);
    const c=M.signatureContext(data), n=data.inputs.length, count=focus.kind==='body'?n:focus.ordinal;
    const actualRoot=focus.kind==='body'?data.body.address.root:data.inputs[count]?.domain.root;
    demand(Number.isInteger(actualRoot),'recorded computed type');
    let remaining=options.bounds?.work??limits.work,totalOperations=0;const prefix=[];
    function run(root,at){demand(remaining>0,'total work bound');const value=normalizePair(c.expected,c.expectedRoot,c.computed,root,n,at,data.context.length,{...options,bounds:{...options.bounds,work:remaining}});totalOperations+=value.state.operations;remaining-=value.state.operations;return value;}
    for(let j=0;j<count;j++) {demand(data.inputs[j].domain.contextLength===data.context.length+j,'recorded input context');const prior=run(data.inputs[j].domain.root,{kind:'input',ordinal:j});let binder=prior.wholeExpectedRoot;for(let k=0;k<j;k++)binder=prior.graph.children[binder][1];const bp=prior.graph.payloads[binder];prefix.push({ordinal:j,status:prior.status,relation:prior.relation,renamings:prior.renamings.length,binderNameWitnesses:prior.renamings.map(({path,from,to})=>({path,from,to})),expectedBinder:{name:bp.binderName,nameParts:copy(bp.binderNameParts),binderInfo:bp.binderInfo},computedBinder:{address:copy(data.inputs[j].address),name:data.inputs[j].name,binderInfo:data.inputs[j].binderInfo},computedRoot:data.inputs[j].domain.root});if(prior.status!=='checked')break;}
    const value=run(actualRoot,focus),contextChecked=prefix.length===count&&prefix.every(p=>p.status==='checked');
    const status=contextChecked?value.status:'unavailable',relation=contextChecked?value.relation:'context-prefix-not-established';

    const owner={evidenceSha256:data.evidenceSha256,query:copy(data.source.query),minor:data.kernelRule.minor};
    const receipt=freeze({format:'ProofAtlasMethodContext/1',status,relation,
      source:copy(data.source),focus:copy(focus),context:{original:data.context.length,computedInputs:count,length:data.context.length+count,status:contextChecked?'checked':'unavailable',prefix},
      expected:{namespace:'recorded-parent-type',...owner,root:c.expectedRoot,projection:{openedInputs:count,field:focus.kind==='body'?'result':'domain'}},
      computed:{namespace:'computed-method-interface',...owner,root:actualRoot,contextLength:data.context.length+count},
      derived:{namespace:'beta-method-type',...owner,expectedRoot:value.expectedRoot,actualRoot:value.actualRoot},
      renamings:value.renamings,mismatch:value.mismatch,state:{...value.state,totalOperations},
      guarantee:'Beta normalization in the aligned recorded context; binder-name changes are explicit. Metadata, binder flags and other payloads remain exact. '
        +'No arithmetic, delta reduction, annotation erasure, proof irrelevance or new kernel conversion. An unavailable local comparison does not contradict the recorded whole-method conversion.'});
    demand(new TextEncoder().encode(JSON.stringify(receipt)).length<=limits.bytes,'receipt bytes');
    owned.set(receipt,{data,parent,value});return receipt;
  }
  function accepts(receipt,data,parent) {const v=owned.get(receipt);demand(v&&v.data===data&&v.parent===parent,'foreign or cloned context receipt');I.accepts(parent,data);return true;}
  function details(receipt) {const v=owned.get(receipt);demand(v,'owned context receipt');return v;}
  // Exact endpoints only. The caller separately validates the native record's
  // owner and context; matching forms alone do not establish kernel conversion.
  function matchNativeEndpoints(receipt, graph) {
    const {value}=details(receipt),g=value.graph,n=graph?.kind?.length;
    demand(Number.isInteger(n)&&n>0&&n<=2048,'native endpoint graph bound');
    demand(new TextEncoder().encode(JSON.stringify(graph)).length<=262144,'native endpoint bytes');
    demand(graph.serialization==='ExprDAG/1'&&Array.isArray(graph.kind)&&Object.keys(graph).every(k=>['serialization','kind','children','payloads','neededScope','expanded','roots'].includes(k))&&Array.isArray(graph.roots)&&graph.roots.length===2&&
      ['children','payloads','neededScope','expanded'].every(k=>Array.isArray(graph[k])&&graph[k].length===n),'native endpoint shape');
    for(let i=0;i<n;i++)demand(Number.isInteger(graph.kind[i])&&graph.kind[i]>=0&&graph.kind[i]<12&&
      Array.isArray(graph.children[i])&&graph.children[i].every(c=>Number.isInteger(c)&&c>=0&&c<i),'native endpoint postorder');
    const seen=new Set(),reached=new Set(),todo=[[value.expectedRoot,graph.roots[0]],[value.actualRoot,graph.roots[1]]];
    while(todo.length){demand(todo.length<=8192&&seen.size<8192,'native endpoint comparison bound');
      const [a,b]=todo.pop(),key=a+':'+b;demand(Number.isInteger(b)&&b>=0&&b<n,'native endpoint root');
      if(seen.has(key))continue;seen.add(key);reached.add(b);
      demand(g.kind[a]===graph.kind[b]&&g.children[a].length===graph.children[b].length&&
        A.payloadKey(g.kind[a],g.payloads[a])===A.payloadKey(graph.kind[b],graph.payloads[b])&&
        g.neededScope[a]===graph.neededScope[b]&&g.expanded[a]===graph.expanded[b],'native endpoint differs');
      g.children[a].forEach((c,s)=>todo.push([c,graph.children[b][s]]));
    }
    demand(reached.size===n,'unreachable native endpoint row');return true;
  }
  function inspect(receipt,side,slots=[]) {
    const {value,data}=details(receipt),g=value.graph,root=side==='expected'?value.expectedRoot:side==='computed'?value.actualRoot:null;
    demand(root!==null&&Array.isArray(slots)&&slots.length<=512&&slots.every(s=>Number.isInteger(s)&&s>=0&&s<=2),'normal-form selection');
    let id=root;for(const s of slots){demand(s<g.children[id].length,'normal-form field');id=g.children[id][s];}
    const context=[...data.context.map(b=>b.name||'_'),...data.inputs.slice(0,receipt.context.computedInputs).map(b=>b.name)];
    const bindings=[...data.context.map((b,ordinal)=>({namespace:'source-expression',indexSha256:data.source.indexSha256,sourceSha256:data.source.sourceSha256,...copy(b),ordinal})),...data.inputs.slice(0,receipt.context.computedInputs).map(b=>({...copy(b.address),ordinal:b.ordinal}))];
    let nodeId=root;for(const [j,s]of slots.entries()){if(bodySlot(g.kind[nodeId],s)){bindings.push({...receipt.derived,side,root,node:nodeId,route:{root:0,slots:slots.slice(0,j)},contextLength:context.length});context.push(g.payloads[nodeId].binderName||g.payloads[nodeId].declName||'_');}nodeId=g.children[nodeId][s];}
    let visits=0;
    function term(at,env,depth=0) {
      if(++visits>96||depth>12)return '…';const k=g.kind[at],p=g.payloads[at],cs=g.children[at];
      if(k===0){const ordinal=env.length-1-p.index;return ordinal>=0?(env[ordinal]||'_').slice(0,80)+'⟨'+(ordinal<receipt.context.original?'Γ'+(ordinal+1):ordinal<receipt.context.length?'ι'+(ordinal-receipt.context.original+1):'ν'+(ordinal-receipt.context.length+1))+'⟩':'bvar '+p.index;}
      if(k===4)return p.name.slice(0,100);if(k===3)return 'Sort '+A.levelText(p.level);
      if(k===5)return '('+term(cs[0],env,depth+1)+' '+term(cs[1],env,depth+1)+')';
      if(k===6||k===7)return '('+(k===6?'λ ':'Π ')+(p.binderName||'_').slice(0,80)+' : '+term(cs[0],env,depth+1)+', '+term(cs[1],[...env,p.binderName||'_'],depth+1)+')';
      if(k===8)return '(let '+(p.declName||'_').slice(0,80)+' : '+term(cs[0],env,depth+1)+' := '+term(cs[1],env,depth+1)+'; '+term(cs[2],[...env,p.declName||'_'],depth+1)+')';
      return A.describe(g,at).slice(0,200);
    }
    const text=term(id,context);
    const result={address:{...receipt.derived,side,root,node:id,route:{root:0,slots:copy(slots)},contextLength:context.length},
      kind:A.kinds[g.kind[id]],payload:copy(g.payloads[id]),binding:g.kind[id]===0?copy(bindings[bindings.length-1-g.payloads[id].index]):null,preview:text.length>1400?text.slice(0,1399)+'…':text,
      fields:g.children[id].map((_,slot)=>({field:A.fields[A.kinds[g.kind[id]]][slot],slots:[...slots,slot]}))};
    demand(new TextEncoder().encode(JSON.stringify(result)).length<=limits.bytes,'selection bytes');return freeze(result);
  }
  let conversionJob=null;
  async function conversionReady(){if(host.ProofAtlasMethodConversion)return host.ProofAtlasMethodConversion;
    if(!conversionJob)conversionJob=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='/public/js/proof-atlas-method-conversion.js?v=1';
      script.onload=()=>{if(host.ProofAtlasMethodConversion)resolve(host.ProofAtlasMethodConversion);else{conversionJob=null;reject(Error('Kernel record component unavailable'));}};
      script.onerror=()=>{script.remove();conversionJob=null;reject(Error('Kernel record component unavailable'));};document.head.append(script);});return conversionJob;}
  function mount(container,{data,parent,onInput=()=>{},onSource=()=>{},live=()=>true}) {
    I.accepts(parent,data);let focus={kind:'body'},first=0,disposed=false,serial=0,receipt=null,nativeController=null;
    const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
    const button=(text,action)=>{const b=el('button',text),epoch=serial;b.type='button';b.onclick=()=>{if(!disposed&&live()&&epoch===serial)action();};return b;};
    container.className='pl-method-context';
    function draw(){if(disposed||!live())return;nativeController?.abort();nativeController=null;const epoch=++serial;
      const controls=el('div');controls.className='pl-actions';
      const body=button('Compare computed body type',()=>{focus={kind:'body'};draw();});body.dataset.contextBody='';body.setAttribute('aria-pressed',String(focus.kind==='body'));controls.append(body);
      for(const input of data.inputs.slice(first,first+4)){const b=button('Compare input '+(input.ordinal+1)+' · '+input.name,()=>{focus={kind:'input',ordinal:input.ordinal};draw();});b.dataset.contextFocus=String(input.ordinal);b.setAttribute('aria-pressed',String(focus.kind==='input'&&focus.ordinal===input.ordinal));controls.append(b);}
      if(data.inputs.length>4){const previous=button('Previous context inputs',()=>{first=Math.max(0,first-4);draw();}),next=button('Next context inputs',()=>{first+=4;draw();});previous.disabled=first===0;next.disabled=first+4>=data.inputs.length;controls.append(previous,next);}
      container.replaceChildren(el('h4','Method types in the recorded computed context'),controls);
      try {receipt=compare(data,parent,focus);}catch(error){receipt=null;container.append(el('p','Context comparison unavailable: '+error.message));return;}
      const r=receipt,valid=()=>!disposed&&live()&&epoch===serial;
      container.append(el('p','Original Γ'+r.context.original+' + '+r.context.computedInputs+' computed input binders. '+r.context.prefix.filter(p=>p.status==='checked').length+' preceding input domains checked by this rule; '+r.context.prefix.reduce((n,p)=>n+p.renamings,0)+' prefix binder-name witness(es).'));
      const pair=el('div');pair.className='pl-context-pair';pair.dataset.contextStatus=r.status;
      const inspection=el('section');inspection.className='pl-context-inspection';
      let selectionSerial=0;
      function inspectAt(side,slots=[]){if(!valid())return;const selected=++selectionSerial;try{const x=inspect(r,side,slots),pre=el('pre',x.preview);pre.tabIndex=0;pre.setAttribute('aria-label','Selected derived expression');inspection.replaceChildren(el('strong',x.kind+' · derived β syntax'),pre);const fields=el('div');fields.className='pl-actions';for(const f of x.fields){const b=button('Field '+f.field,()=>{if(valid()&&selected===selectionSerial)inspectAt(side,f.slots);});b.dataset.contextField=JSON.stringify({side,slots:f.slots});fields.append(b);}const details=el('details');details.append(el('summary','Exact derived address and payload'),el('pre',JSON.stringify(x,null,2)));details.dataset.contextSelection='';inspection.append(fields,details);if(x.binding){const at=x.binding,b=button(at.namespace==='beta-method-type'?'Follow derived binder':at.namespace==='computed-method-interface'?'Open computed binder '+(at.ordinal+1):'Open original Γ binder '+(at.ordinal+1),()=>{if(!valid()||selected!==selectionSerial)return;if(at.namespace==='beta-method-type')inspectAt(side,at.route.slots);else if(at.namespace==='computed-method-interface')onInput(at.ordinal);else onSource(at);});b.dataset.contextBinding=JSON.stringify(at);inspection.append(b);}}catch(error){inspection.replaceChildren(el('p','Derived selection unavailable: '+error.message));}}
      for(const side of ['expected','computed']){if(side==='computed'){const relation=el('p',r.status==='unavailable'?'No β/α correspondence':r.renamings.length?'β + binder-name correspondence':'β-normal forms agree');relation.className='pl-context-relation';pair.append(relation);}
        const item=el('section'),label=(side==='expected'?'Expected ':'Recorded computed ')+(focus.kind==='body'?'result':'input domain')+' after β';
        const value=inspect(r,side),pre=el('pre',value.preview);pre.tabIndex=0;pre.setAttribute('aria-label',label);const b=button('Inspect '+side+' normal form',()=>{if(valid())inspectAt(side);});b.dataset.contextSide=side;
        item.append(el('strong',label),pre,b);pair.append(item);}
      container.append(pair);
      const kernel=el('section');kernel.className='pl-context-kernel';kernel.dataset.contextKernelState='idle';
      const kernelStatus=el('p',focus.kind==='body'?'Separate native evidence has not been loaded.':'No separate kernel record for this input domain.');kernelStatus.setAttribute('role','status');
      kernel.append(el('h5','Recorded kernel conversion'),kernelStatus);
      if(focus.kind==='body'){
        const nativeButton=button('Check recorded kernel conversion',async()=>{
          if(!valid())return;nativeButton.disabled=true;nativeController?.abort();const controller=new AbortController();nativeController=controller;
          kernel.dataset.contextKernelState='loading';kernelStatus.textContent='Loading native evidence for this selected pair…';
          try{const N=await conversionReady();if(!valid()||controller.signal.aborted)return;
            const result=await N.load(data,parent,r,{signal:controller.signal});if(!valid()||controller.signal.aborted)return;
            if(result.status==='unavailable'){kernel.dataset.contextKernelState='unavailable';kernelStatus.textContent=result.reason;return;}
            N.accepts(result,data,parent,r);kernel.dataset.contextKernelState='checked';
            kernelStatus.textContent='Recorded kernel conversion and typed-term check passed in Γ'+result.context.original+' + '+result.context.computedInputs+' computed input binders. The β/α result above is unchanged.';
            const bridge=el('div');bridge.className='pl-context-kernel-link';
            const left=button('Inspect expected endpoint',()=>{if(valid())inspectAt('expected');}),right=button('Inspect computed endpoint',()=>{if(valid())inspectAt('computed');});
            left.dataset.contextKernelEndpoint='expected';right.dataset.contextKernelEndpoint='computed';
            bridge.append(left,el('strong','≡ · recorded kernel conversion'),right);
            const details=el('details');details.dataset.contextKernelReceipt='';details.append(el('summary','Exact conversion endpoints and native evidence owner'),el('pre',JSON.stringify(result,null,2)));
            kernel.replaceChildren(el('h5','Recorded kernel conversion'),kernelStatus,bridge,details,el('p',result.guarantee));
          }catch(error){if(valid()&&!controller.signal.aborted){kernel.dataset.contextKernelState='error';kernelStatus.textContent='Kernel record unavailable: '+error.message;}}
          finally{if(valid()&&!controller.signal.aborted)nativeButton.disabled=false;}
        });nativeButton.dataset.contextKernelLoad='';kernel.append(nativeButton);
      }
      container.append(kernel);
      if(r.status==='unavailable')container.append(el('p','This local β/α comparison is unavailable. The existing whole-method kernel conversion remains a separate observation.'));
      else if(r.renamings.length)container.append(el('p',r.renamings.length+' distinct binder-node pair(s) differ only in names. Their names and occurrence witnesses are retained.'));
      const actions=el('div');actions.className='pl-actions';
      if(r.mismatch){const b=button('Inspect differing fields',()=>{if(valid()){inspectAt('expected',r.mismatch.path);const right=inspect(r,'computed',r.mismatch.path);inspection.append(el('p','Computed-side mismatch payload'),el('pre',JSON.stringify(right,null,2)));}});b.dataset.contextMismatch='';actions.append(b);}
      if(focus.kind==='input'){const ordinal=focus.ordinal,b=button('Open recorded computed input '+(ordinal+1),()=>{if(valid())onInput(ordinal);});b.dataset.contextRecordedInput=String(ordinal);actions.append(b);}
      const details=el('details');details.append(el('summary','Exact original and derived type owners'),el('pre',JSON.stringify(r,null,2)));details.dataset.contextReceipt='';container.append(actions,inspection,details,el('p',r.guarantee));
    }
    draw();return{getReceipt:()=>receipt,dispose:()=>{disposed=true;serial++;nativeController?.abort();receipt=null;container.replaceChildren();}};
  }
  const api={normalizePair,compare,accepts,inspect,matchNativeEndpoints,mount,limits};
  if(node){api.exportRecord=receipt=>copy(details(receipt).value);module.exports=api;}else host.ProofAtlasMethodContext=api;
})(typeof window==='undefined'?globalThis:window);
