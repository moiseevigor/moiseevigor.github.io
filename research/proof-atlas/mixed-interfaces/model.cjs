/* Local next-rule prototype. Frozen release sources are read-only inputs. */
'use strict';
const path = require('path'), repo = path.resolve(__dirname,'../../..');
const T = require(path.join(repo,'public/js/proof-atlas-deep-context'));
const CF = require(path.join(repo,'public/js/proof-atlas-occurrence-context-frame'));
const U = require(path.join(repo,'public/js/proof-atlas-local-definition-unit'));
const C = require(path.join(repo,'public/js/proof-atlas-recorded-captions'));
const P = require(path.join(repo,'public/js/proof-atlas-packed-routes'));
const limits = Object.freeze({units:8,unitBytes:32768,frameBytes:524288});
const demand = (v,m) => {if (!v) throw Error('Mixed interface: ' + m);};
const canonical = v => JSON.stringify(v,(_,x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k,x[k]])) : x);
const freeze = v => {if (v && typeof v === 'object' && !Object.isFrozen(v)) {Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const size = v => Buffer.byteLength(JSON.stringify(v));
function open(c,captions,edition) {
  const source = {...T.sourceIdentity(c.data,c.record),edition,packetFile:c.record.indexFile};
  const frames = CF.open(c), lets = U.open(c,captions,edition), cache = new Map(), issued = new WeakSet();
  const original = (p,contextLength=p.contextLength) => ({namespace:'original-source',route:p.route,node:p.node,contextLength,expanded:c.data.expanded[p.node]});
  async function introduction(entry) {
    const rule = T.construction(entry,c.data); demand(rule?.rule === 'Pi-introduction','recorded introduction');
    const owner = rule.entry, g = owner.typeData, root = g.roots[0], [domain,body] = rule.premises, n = owner.contextLength;
    demand(g.kind[root] === 7,'recorded Pi result'); const [a,d] = g.children[root];
    demand(T.expressionEqual(c.data,domain.node,g,a) && T.expressionEqual(g,rule.components.domainExpression,g,a),'source and Pi domain');
    demand(T.expressionEqual(g,rule.components.expectedBody,g,d),'recorded expected codomain');
    demand(domain.contextLength === n && body.contextLength === n+1,'introduction contexts');
    const payload = c.data.payloads[owner.node], pi = g.payloads[root];
    demand(payload.binderName === pi.binderName && payload.binderInfo === pi.binderInfo,'recorded binder payload agreement');
    demand(g.neededScope[d] <= n+1 && g.neededScope[body.typeRoot] <= n+1,'codomain/body scope');
    const rootPoint = original(owner), domainPoint = original(domain), bodyPoint = original(body), bundle = await captions.create(entry);
    const normalized = {...rule,entry:{...owner,root}};
    await C.validate(bundle.sourceHeader,C.origin(source,normalized,'binderType','recorded-source-expression'));
    for (const field of ['conclusion','binderType','body']) await C.validate(bundle.inferredTypes[field],C.origin(source,normalized,field));
    const binding = {namespace:'original-source-context-extension',kind:'assumption',sourceBinder:rootPoint,name:payload.binderName,binderInfo:payload.binderInfo,from:n,to:n+1,countContribution:'0',variableRole:'not-recorded-by-this-interface'};
    const context = {sourceIndexSha256:source.indexSha256,length:n,binderRoute:owner.route};
    const typed = (field,typeRoot,anchor,length,caption) => ({namespace:'computed-native-type',field,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:typeRoot,context:{...context,length,...(length===n+1?{extension:'selected-introduction'}:{})},sourceAnchor:anchor,caption});
    const recordedOwner = {sourceIndexSha256:source.indexSha256,sourceRoute:owner.route,sourceNode:owner.node,contextLength:n,recording:rule.recording};
    const ports = {
      domain:{...domainPoint,caption:bundle.sourceHeader},
      domainSort:typed('binderType',domain.typeRoot,domainPoint,n,bundle.inferredTypes.binderType),
      bodyType:typed('body',body.typeRoot,bodyPoint,n+1,bundle.inferredTypes.body),
      expectedBody:{namespace:'computed-native-expressions',component:'expectedBody',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:rule.components.expectedBody,context:{sourceIndexSha256:source.indexSha256,length:n+1,sourceBinder:rootPoint,extension:'selected-introduction'},status:'recorded-expression-not-an-additional-typing-judgment'},
      codomain:{namespace:'computed-native-type',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:d,enclosingRecordedTypeRoot:root,typeRoute:P.encode(0,[1]),context:{sourceIndexSha256:source.indexSha256,ambientLength:n,typeLocalBinders:1,mappedSourceContextLength:n+1,correspondence:'recorded-lambda-domain-to-Pi-binder'},status:'type-syntax-only'},
      conclusionType:typed('conclusion',root,rootPoint,n,bundle.inferredTypes.conclusion)
    };
    const binderCorrespondence = {relation:'recorded-lambda-domain-to-Pi-binder',sourceBinder:rootPoint,typeBinder:{namespace:'computed-native-type',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root,typeRoute:P.encode(0,[])},expectedBodyRoot:rule.components.expectedBody,codomainRoot:d,sourceExtendedContextLength:n+1,ambientContextLength:n,countContribution:'0',scope:'The original lambda binder and computed Pi binder remain different objects. Expected D is interpreted under the source extension through this explicit correspondence.'};
    const regions = [{field:'binderType',...domainPoint},{field:'body',...bodyPoint}], hidden = regions.reduce((sum,p)=>sum+BigInt(p.expanded),0n);
    demand(hidden+1n === BigInt(rootPoint.expanded),'introduction source partition');
    const value = freeze({format:'ProofAtlasIntroductionInterfacePrototype/1',source,root:rootPoint,rule:'Pi-introduction',wholeRole:owner.role,recording:rule.recording,evidenceFile:owner.evidenceFile,context,binding,
      body:{...bodyPoint,role:body.role},ports,binderCorrespondence,
      bodyConversion:{actualRoot:body.typeRoot,expectedRoot:rule.components.expectedBody,structuralEquality:T.expressionEqual(g,body.typeRoot,g,rule.components.expectedBody),check:'kernelBodyConversion',status:rule.checks.kernelBodyConversion,contextLength:n+1,interpretation:'Apply the recorded source-lambda/Pi binder correspondence; the namespaces are not identified.',shareDisplay:false},
      resultRelation:{kind:'recorded-function-conversion',domainRoot:a,expectedCodomainRoot:rule.components.expectedBody,observedCodomainRoot:d,normalizedPiRoot:rule.components.pi,resultRoot:root,check:'kernelFunctionConversion',status:rule.checks.kernelFunctionConversion},
      nativeComponents:{namespace:'computed-native-expressions',evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,roots:rule.components,status:'recorded-expressions-not-new-typing-judgments'},checks:rule.checks,partition:{retainedSourceConstructors:'1',regions,hidden:String(hidden),represented:rootPoint.expanded},
      scope:'One source lambda and its recorded typing interfaces. The native body type C and expected Pi codomain D remain distinct, including when convertible or structurally equal. No fresh variable judgment, namespace identification or new native check.'});
    demand(size(value)<=limits.unitBytes,'unit metadata bound'); return value;
  }
  async function unit(route) {
    const key = route.root+':'+route.depth+':'+route.slots;if (cache.has(key)) return cache.get(key);
    const e = c.get(route), rule = e && T.construction(e,c.data);
    demand(rule && ['Pi-introduction','let-binding'].includes(rule.rule),'recorded context unit');
    const v = rule.rule === 'let-binding' ? await lets.create(e) : await introduction(e);cache.set(key,v);return v;
  }
  async function create(route,{maxUnits=4}={}) {
    demand(Number.isInteger(maxUnits)&&maxUnits>=1&&maxUnits<=limits.units,'unit budget');
    const frame = frames.create(route,{maxMembers:maxUnits}), units = [], joins = [];
    for (let i=0;i<frame.members.length;i++) {
      const u = await unit(frames.resolve(frame,{member:i})); units.push(u);
      if(i){const before=units[i-1],a=T.construction(c.get(before.root.route),c.data),b=T.construction(c.get(u.root.route),c.data);demand(canonical(before.body.route)===canonical(u.root.route)&&before.body.node===u.root.node&&before.body.contextLength===u.root.contextLength&&before.body.role===u.wholeRole,'exact mixed source/context/role join');demand(T.expressionEqual(a.entry.typeData,a.premises.at(-1).typeRoot,b.entry.typeData,b.entry.typeData.roots[0]),'actual body/next conclusion types');joins.push({from:i-1,to:i,sourcePosition:u.root,parentActualBodyType:before.ports.bodyType,childConclusionType:u.ports.conclusionType,preservesDistinctOrigins:true});}
    }
    const value = freeze({format:'ProofAtlasMixedInterfaceFramePrototype/1',source,root:units[0].root,options:{maxUnits},units,joins,frame,
      sourcePartition:{retained:frame.stats.retained,hidden:frame.stats.hidden,represented:frame.stats.represented,regions:[...frame.headers,frame.continuation].map(p=>({route:frames.resolve(frame,p.address),node:p.node,contextLength:p.contextLength,expanded:p.expanded})),scope:'One disjoint context-frame cut; overlapping unit subtree sizes are not added.'},
      continuation:{...frame.continuation,route:frames.resolve(frame,frame.continuation.address),stop:frame.stop},
      scope:'Finite composition through actual recorded body types. Pi expected codomains are separate conversion components, not replacements for actual body judgments. No new typing, reduction or comprehension result.'});
    demand(size(value)<=limits.frameBytes,'frame metadata bound');issued.add(value);return value;
  }
  async function validate(v) {demand(v?.format==='ProofAtlasMixedInterfaceFramePrototype/1'&&canonical(v)===canonical(await create(v.root.route,v.options)),'changed native interface or namespace correspondence');return true;}
  function resolve(v,index) {demand(issued.has(v)&&Number.isInteger(index)&&index>=0&&index<v.units.length,'issued unit');return v.units[index].root.route;}
  return Object.freeze({create,validate,resolve});
}
module.exports={open,limits};
