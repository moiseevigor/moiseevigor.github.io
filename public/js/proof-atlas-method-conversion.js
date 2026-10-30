/* Recorded native conversion for exact selected method-port endpoints.
   The browser checks provenance and syntax, not Lean conversion itself. */
(function(host) {
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
  const B=node?require('./proof-atlas-method-context'):host.ProofAtlasMethodContext;
  const owned=new WeakMap(),copy=x=>JSON.parse(JSON.stringify(x));
  const demand=(ok,message)=>{if(!ok)throw Error('Method kernel record: '+message);};
  const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
  const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
  const freeze=x=>{if(x&&typeof x==='object'&&!Object.isFrozen(x)){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
  let manifestJob=null;
  async function inventory() {
    if(host.PROOF_ATLAS_METHOD_PORT_KERNEL)return host.PROOF_ATLAS_METHOD_PORT_KERNEL;
    if(!manifestJob)manifestJob=new Promise((resolve,reject)=>{
      const script=document.createElement('script');script.src='/public/data/proof-atlas/method-conversion-manifest.js?v=1';
      script.onload=()=>resolve(host.PROOF_ATLAS_METHOD_PORT_KERNEL);
      script.onerror=()=>{script.remove();manifestJob=null;reject(Error('Kernel record inventory unavailable'));};document.head.append(script);
    });
    return manifestJob;
  }
  function descriptor(data,receipt,list) {
    demand(list?.format==='ProofAtlasMethodPortKernelInventory/1'&&Array.isArray(list.records)&&list.records.length<=64,'inventory');
    return list.records.find(d=>d.name===data.source.name&&d.indexSha256===data.source.indexSha256&&
      d.sourceSha256===data.source.sourceSha256&&d.originalEvidenceSha256===data.evidenceSha256&&
      Array.isArray(d.queries)&&d.queries.length<=128&&d.queries.some(q=>same(q.route,data.source.query)&&
        Array.isArray(q.minors)&&q.minors.length<=128&&q.minors.includes(receipt.derived.minor)));
  }
  function validate(raw,data,parent,receipt,d) {
    B.accepts(receipt,data,parent);
    demand(receipt.focus.kind==='body'&&receipt.context.status==='checked','selected body context');
    demand(raw.format==='ProofAtlasMethodPortKernelRecord/1','record format');
    const output=raw.output,v=raw.verification,s=output.source;
    demand(s.name===data.source.name&&s.indexSha256===data.source.indexSha256&&s.sourceSha256===data.source.sourceSha256,'source identity');
    demand(output.originalNativeOwner===data.evidenceSha256&&output.originalNativeOwner===d.originalEvidenceSha256,'original evidence owner');
    demand(output.status==='PASS'&&output.leanVersion==='4.33.1'&&output.originalDeclarationKernelTyping==='PASS'&&
      ['originalTheoremAbsent','originalModuleAbsent','privateResearchModulesAbsent'].every(k=>output[k]===true),'native declaration checks');
    demand(v.originalEnvironmentIdentityVerified===false&&v.originalProofSourcesRead===false&&v.originalProofModulesImported===false&&
      v.dependencyRecovery?.allBinaryHashesVerified===true&&v.dependencyRecovery.independentlyRebuilt===false&&
      v.dependencyRecovery.originalGitCheckoutsVerified===false,'environment attribution');
    demand(Array.isArray(output.queries)&&output.queries.length<=128,'query bound');
    const queries=output.queries.filter(q=>same(q.source.route,data.source.query));demand(queries.length===1,'exact selected query');
    const query=queries[0];demand(Array.isArray(query.ports)&&query.ports.length<=128,'port bound');
    const ports=query.ports.filter(p=>p.minor===receipt.derived.minor);demand(ports.length===1,'exact selected minor');
    const port=ports[0],context=data.context.map(({name,...binder})=>binder);
    demand(same(port.originalContext,context)&&port.originalContextLength===receipt.context.original&&
      port.computedInputs===receipt.context.computedInputs&&port.contextLength===receipt.context.length,'exact original/computed context');
    demand(Array.isArray(port.prefixChecks)&&port.prefixChecks.length===port.computedInputs&&
      port.prefixChecks.every((p,i)=>p.ordinal===i&&p.kernelDomainConversion==='PASS'&&p.termAtExpectedDomain==='PASS'),'preceding domains');
    demand(same(port.checks,{expectedIsType:'PASS',computedIsType:'PASS',kernelTypeConversion:'PASS',
      kernelTermAtExpectedType:'PASS',exactContextRoundtrip:true,wrongTypeRejected:true}),'native port checks');
    B.matchNativeEndpoints(receipt,port.graph);
    const result=freeze({format:'ProofAtlasMethodPortKernelBridge/1',status:'recorded-kernel-conversion',
      source:copy(receipt.source),context:{original:receipt.context.original,computedInputs:receipt.context.computedInputs,length:receipt.context.length},
      betaAlpha:{status:receipt.status,relation:receipt.relation},
      expected:{...copy(B.inspect(receipt,'expected').address),nativeRoot:port.graph.roots[0]},
      computed:{...copy(B.inspect(receipt,'computed').address),nativeRoot:port.graph.roots[1]},
      native:{namespace:'kernel-method-port',file:d.file,recordSha256:d.sha256,originalEvidenceSha256:data.evidenceSha256,
        query:copy(data.source.query),minor:port.minor,compiler:v.compiler,dependencyRecovery:copy(v.dependencyRecovery),
        originalEnvironmentIdentityVerified:false,nativeBundleSha256:v.nativeBundleSha256},
      checks:copy(port.checks),guarantee:'Recorded Lean kernel conversion and typed-term check for these exact body-type endpoints in this context. '
        +'The browser verifies hashes, ownership, context and expression fields. It does not run Lean or infer source use, literal equality or premise necessity. '
        +'Cache-attributed dependency binaries; original environment identity and an independent rebuild are not established.'});
    owned.set(result,{data,parent,receipt});return result;
  }
  async function load(data,parent,receipt,options={}) {
    B.accepts(receipt,data,parent);const check=()=>{if(options.signal?.aborted)throw options.signal.reason||Error('Kernel record load cancelled');};check();
    if(receipt.focus.kind!=='body')return freeze({status:'unavailable',reason:'No separate kernel record for this input domain.'});
    const list=options.inventory||await inventory();check();const d=descriptor(data,receipt,list);
    if(!d)return freeze({status:'unavailable',reason:'No kernel conversion record for this selected body type.'});
    demand(/^[a-f0-9]{64}$/.test(d.sha256)&&d.file==='/public/data/proof-atlas/method-conversion/'+d.sha256+'.json.gz'&&
      Number.isInteger(d.bytes)&&d.bytes>0&&d.bytes<=262144,'bounded record descriptor');
    const raw=await A.compressed(d.file,d.sha256,{signal:options.signal,maxBytes:262144,expectedBytes:d.bytes});check();
    const result=validate(raw,data,parent,receipt,d);check();return result;
  }
  function accepts(result,data,parent,receipt) {
    const entry=owned.get(result);demand(entry&&entry.data===data&&entry.parent===parent&&entry.receipt===receipt,'owned bridge');
    B.accepts(receipt,data,parent);return true;
  }
  const api={load,accepts};if(node){api.validate=validate;api.descriptor=descriptor;module.exports=api;}else host.ProofAtlasMethodConversion=api;
})(typeof window==='undefined'?globalThis:window);
