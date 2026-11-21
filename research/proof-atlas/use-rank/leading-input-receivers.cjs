// Group references to leading lambda inputs by literal constant head and source port.
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const A = require('../../../public/js/proof-atlas-library-data');
const {applicationAtUse} = require('../../../public/js/proof-atlas-omitted-references');
const {sourceInput} = require('../../../public/js/proof-atlas-application-ports');
const E = require('../../../public/js/proof-atlas-elimination');
const {countReferences} = require('../../../public/js/proof-atlas-recursive-inputs');
const roles=require('../../../public/js/proof-atlas-role-occurrences');
const prior = require('./ai-local-flow.json');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
const published=process.argv.includes('--published');
if (published) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window});
const edition=published ? window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15') : window.PROOF_ATLAS_AI_SAMPLE.edition;
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window});
const catalog=window.PROOF_ATLAS_TYPE_NOTATION;
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/branch-core-signatures.js','utf8'),{window});
for(const s of window.PROOF_ATLAS_CORE_SIGNATURES.entries){
  const sha=createHash('sha256').update(JSON.stringify([s.nameParts,s.levelParams,s.graph])).digest('hex');
  assert.equal(s.signatureSha256,sha);
}
const native=JSON.parse(zlib.gunzipSync(fs.readFileSync('research/proof-atlas/type-notation/native.json.gz')));
assert.deepEqual(catalog.entries.filter(e=>roles.importedSignature(catalog,'goedel-sample-4331',e.name,catalog.compiler)).map(e=>e.name).sort().join('|'),native.signatures.map(s=>s.name).sort().join('|'));
for(const f of ['occurrence-types-manifest','eliminations-manifest'])
 vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window});
const nativeInventories=[
 ...(published?window.PROOF_ATLAS_OCCURRENCE_TYPES.records:window.PROOF_ATLAS_AI_SAMPLE.types).map(d=>({d,kind:'primary'})),
 ...(published?window.PROOF_ATLAS_ELIMINATIONS.records:window.PROOF_ATLAS_AI_SAMPLE.eliminations).map(d=>({d,kind:'case'}))
];
const formalCache=new Map(),missingSignatures=new Map();
const splitStats={groups:0,twoChildren:0,threeChildren:0,nineTenthsInOneChild:0,applicationSplits:0,threeOrMoreOccupiedPorts:0,maxOccupiedPorts:0,occupiedArguments:0,formalSlots:0,dependentSlots:0,parameterEdges:0,recordedCallTypes:0,lambdaResultUnused:0,withDeclaredAndRecorded:0,resultTypes:0,dependentResults:0,resultEdges:0,residualForalls:0,formalSplits:0,importedSlots:0,externalConstantArguments:0,otherHeadArguments:0,beyondLiteralPrefix:0};
function audit(record) {
  const bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=A.validateIndex(JSON.parse(bytes),record);
  const observations=[];
  if(process.argv.includes('--branch-summary')){
    for(const {d,kind} of nativeInventories.filter(x=>x.d.edition===edition.id && x.d.indexSha256===record.indexSha256)){
      const bytes=zlib.gunzipSync(fs.readFileSync('.'+d.file));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),d.sha256);
      const packet=JSON.parse(bytes);
      observations.push(kind==='case'?E.provider(packet,data,record,d.sha256,d.file):
       require('../../../public/js/proof-atlas-occurrence-types').provider(packet,data,record,d));
    }
  }
  const inputs=[], slots=[], parents=[], scope=[], spines=new Map();
  function classify(node,input,offset) {
    let depth=slots.length-1;
    const parent=parents[depth];
    let label;
    if (data.kind[parent]===5) {
      const position=slots[depth];
      while(depth>0 && slots[depth-1]===0 && data.kind[parents[depth-1]]===5) depth--;
      const call=parents[depth];
      if (!spines.has(call)) spines.set(call,E.spine(data,call));
      const {head,args}=spines.get(call);
      const slot=position===0 ? 0 : args.length-(slots.length-1-depth);
      const headKind=A.kinds[data.kind[head]];
      const name=headKind==='const'?data.payloads[head].name:'('+headKind+' head)';
      label=name+' · '+(slot===0?'function':'argument '+slot)+' / '+args.length;
      if (!input.groups.has(label)) {
        const actual=applicationAtUse(data,{node,route:{root:1,slots}});
        assert.equal(actual.call.node,call);
        assert.deepEqual(actual.call.route.slots,slots.slice(0,depth));
        assert.equal(actual.head.node,head);assert.equal(actual.slot,slot);
        assert.deepEqual(sourceInput(data,actual.call,slot),{node,route:{root:1,slots}});
      }
    } else {
      const kind=A.kinds[data.kind[parent]];
      label=kind+' · '+A.fields[kind][slots.at(-1)];
    }
    if (!input.groups.has(label)) {
      const witness={root:1,slots:[...slots]};
      assert.deepEqual(A.binding(data,witness),{node:input.node,route:input.route});
      input.groups.set(label,{count:0,node,route:witness,bytes:[],last:0});
    }
    const group=input.groups.get(label);
    roles.addOffset(group.bytes,offset-group.last);group.last=offset;group.count++;
    input.count++;
  }
  function walk(node,leading,offset) {
    if (!leading && data.neededScope[node]===0) return;
    const kind=A.kinds[data.kind[node]];
    let input=null;
    if (leading && kind==='lam') {
      input={name:data.payloads[node].binderName,node,route:{root:1,slots:[...slots]},groups:new Map(),count:0};
      inputs.push(input);
    }
    if (kind==='bvar') {
      const binder=scope.at(-1-data.payloads[node].index);
      if (binder) classify(node,binder,offset);
    }
    parents.push(node);
    let childOffset=offset+1;
    data.children[node].forEach((child,i)=>{
      const body=A.fields[kind][i]==='body' && ['lam','forallE','letE'].includes(kind);
      if (body) scope.push(input);
      slots.push(i);
      walk(child,leading && kind==='lam' && body,childOffset);
      childOffset+=Number(data.expanded[child]);
      slots.pop();
      if (body) scope.pop();
    });
    parents.pop();
  }
  walk(data.roots[1],true,0);
  for (const input of inputs) {
    const refs=countReferences(data,data.children[input.node][1],0);
    assert.equal(refs.status,'counted');
    assert.equal(BigInt(refs.occurrences),BigInt(input.count));
    assert.equal([...input.groups.values()].reduce((sum,g)=>sum+g.count,0),input.count);
  }
  for(const input of inputs)for(const [label,g] of input.groups){
    g.offsets=Buffer.from(g.bytes).toString('base64');
    let index=null;
    if(g.bytes.length>=4096){
      const app=applicationAtUse(data,{node:g.node,route:g.route});
      if(app && app.slot>0 && data.kind[app.head.node]===4){
        g.role={name:data.payloads[app.head.node].name,arity:app.arity,slot:app.slot};
        try { index=roles.constantArgumentIndex(data,input,g.role); }
        catch(error){
          if(!(error instanceof RangeError) || !['Role count state limit','Application spine limit'].includes(error.message))throw error;
          delete g.role;
        }
        if(index)assert.equal(index.total,BigInt(g.count));
      }
    }
    const ordinals=new Set([1,Math.ceil(g.count/2),g.count]);
    if(index)for(let j=1;j<32;j++)ordinals.add(Math.ceil(g.count*j/32));
    for(const ordinal of ordinals){
      const hit=roles.select(data,g,ordinal);
      if(index)assert.deepEqual(index.occurrence(BigInt(ordinal)),hit);
      if(ordinal===1)assert.deepEqual(hit,{node:g.node,route:g.route});
      assert.deepEqual(A.binding(data,hit.route),{node:input.node,route:input.route});
      const app=applicationAtUse(data,hit);
      if(app){
        const kind=A.kinds[data.kind[app.head.node]];
        const name=kind==='const'?app.label:'('+kind+' head)';
        assert.equal(label,name+' · '+(app.slot===0?'function':'argument '+app.slot)+' / '+app.arity);
      }else{
        const slots=hit.route.slots,parent=A.walk(data,{root:1,slots:slots.slice(0,-1)}),kind=A.kinds[data.kind[parent]];
        assert.equal(label,kind+' · '+A.fields[kind][slots.at(-1)]);
      }
    }
    if(g.count>1 && process.argv.includes('--branch-summary')){
      const at=n=>index?index.occurrence(n):roles.select(data,g,Number(n));
      const part=roles.partition(at,1n,BigInt(g.count));
      assert([2,3].includes(part.branches.length));
      let next=1n,largest=0n;
      for(const branch of part.branches){
        assert.equal(branch.first,next);
        for(const n of [branch.first,branch.last]){
          const hit=roles.select(data,g,Number(n));
          assert.deepEqual(hit.route.slots.slice(0,part.route.slots.length+1),part.route.slots.concat(branch.slot));
        }
        const size=branch.last-branch.first+1n;
        if(largest<size)largest=size;
        next=branch.last+1n;
      }
      assert.equal(next,BigInt(g.count)+1n);
      const flat=roles.partition(at,1n,BigInt(g.count),data);
      if(flat.call){
        splitStats.applicationSplits++;
        if(flat.branches.length>=3)splitStats.threeOrMoreOccupiedPorts++;
        splitStats.maxOccupiedPorts=Math.max(splitStats.maxOccupiedPorts,flat.branches.length);
        const head=flat.call.head;
        const callee=data.kind[head]===4 && edition.declarations.find(d=>d.name===data.payloads[head].name);
        const imported=!callee && data.kind[head]===4 && roles.importedSignature(catalog,edition.id,data.payloads[head].name,window.PROOF_ATLAS_AI_SAMPLE.provenance.compiler,window.PROOF_ATLAS_CORE_SIGNATURES);
        let params=[],formalData;
        if(callee){
          if(!formalCache.has(callee.indexSha256)){
            const bytes=zlib.gunzipSync(fs.readFileSync('.'+callee.indexFile));
            assert.equal(createHash('sha256').update(bytes).digest('hex'),callee.indexSha256);
            formalCache.set(callee.indexSha256,A.validateIndex(JSON.parse(bytes),callee));
          }
          formalData=formalCache.get(callee.indexSha256);
          params=roles.formalParameters(formalData,{root:0,slots:[]},flat.call.arity);
        }else if(imported){
          formalData=imported.graph;
          params=roles.formalParameters(formalData,{root:0,slots:[]},flat.call.arity);
        }else if(data.kind[head]===0){
          const headRoute=sourceInput(data,{node:flat.call.node,route:flat.route},0).route;
          const bound=A.binding(data,headRoute);
          formalData=data;
          params=roles.formalParameters(data,{root:1,slots:bound.route.slots.concat(0)},flat.call.arity);
        }
        const result=formalData && roles.declaredResult(formalData,params,flat.call.arity);
        const native=observations.map(p=>p.get(flat.route)).find(o=>o?.status==='checked');
        if(native){
          assert.equal(native.node,flat.call.node);assert.deepEqual(native.route,flat.route);
          assert.equal(native.kernelCheck,'PASS');
          splitStats.recordedCallTypes++;
          const graph=native.typeGraph,root=native.typeRoot;
          if(graph.kind[root]===5 && graph.kind[graph.children[root][0]]===6){
            const body=graph.children[graph.children[root][0]][1];
            const deps=require('../../../public/js/proof-atlas-application-ports').dependencies(graph,body,1);
            const count=countReferences(graph,body,0);
            assert.equal(count.status,'counted');assert.equal(count.occurrences==='0',!deps.length);
            if(!deps.length)splitStats.lambdaResultUnused++;
          }
          if(result)splitStats.withDeclaredAndRecorded++;
          if(process.env.ATLAS_FORMAL_EXAMPLE && !splitStats.nativeExample)
           splitStats.nativeExample={proof:record.name,binder:input.name,depth:input.route.slots.length,label,type:native.typeText};
        }
        if(result){
          splitStats.resultTypes++;
          if(result.references.length)splitStats.dependentResults++;
          if(formalData.kind[result.node]===7)splitStats.residualForalls++;
          splitStats.resultEdges+=result.references.length;
          assert.equal(A.walk(formalData,result.route),result.node);
          const expected=require('../../../public/js/proof-atlas-application-ports').dependencies(formalData,result.node,params.length);
          assert.deepEqual(result.references.map(ref=>ref.slot),expected);
          for(const ref of result.references){
            const f=params[ref.slot-1];
            assert.deepEqual(A.binding(formalData,ref.route),{node:f.node,route:f.route});
            const actual=sourceInput(data,{node:flat.call.node,route:flat.route},ref.slot);
            assert.equal(A.walk(data,actual.route),actual.node);
          }
        }
        let next=1n,previous=-1,hasFormal=false;
        for(const b of flat.branches){
          if(b.slot){
            splitStats.occupiedArguments++;
            const f=params[b.slot-1];
            if(f){
              assert.equal(A.walk(formalData,f.route),f.node);
              assert.equal(formalData.kind[f.node],7);
              const deps=roles.domainReferences(formalData,params,b.slot);
              const oracle=require('../../../public/js/proof-atlas-application-ports').dependencies;
              const domain=formalData.children[f.node][0];
              assert.deepEqual(deps.map(d=>d.slot),oracle(formalData,domain,b.slot-1));
              for(const d of deps){
                const prev=params[d.slot-1];
                assert.deepEqual(A.binding(formalData,d.route),{node:prev.node,route:prev.route});
                const actual=sourceInput(data,{node:flat.call.node,route:flat.route},d.slot);
                assert.equal(A.walk(data,actual.route),actual.node);
              }
              if(deps.length)splitStats.dependentSlots++;
              splitStats.parameterEdges+=deps.length;
              splitStats.formalSlots++;hasFormal=true;
              if(imported){
                splitStats.importedSlots++;
                assert.equal(f.name,imported.binders[b.slot-1].name);
                assert.equal(f.info,imported.binders[b.slot-1].binderInfo);
                if(process.env.ATLAS_FORMAL_EXAMPLE && !splitStats.importExample)splitStats.importExample={proof:record.name,depth:input.route.slots.length,label,name:imported.name,slot:b.slot,parameter:f.name};
              }
              if(process.env.ATLAS_FORMAL_EXAMPLE && !splitStats.example && f.name && f.name!=='_'){
                splitStats.example={proof:record.name,binder:input.name,depth:input.route.slots.length,label,callee:callee?.name??imported?.name??'bound function',slot:b.slot,formal:f};
              }
            }else if(formalData)splitStats.beyondLiteralPrefix++;
            else if(data.kind[head]===4){
              splitStats.externalConstantArguments++;
              const name=data.payloads[head].name;
              missingSignatures.set(name,(missingSignatures.get(name)||0)+1);
            }
            else splitStats.otherHeadArguments++;
          }
          assert.equal(b.first,next);assert(b.slot>previous);
          previous=b.slot;next=b.last+1n;
          const operand=sourceInput(data,{node:flat.call.node,route:flat.route},b.slot);
          assert.deepEqual(b.route,operand.route);
          for(const n of [b.first,b.last]){
            const path=roles.select(data,g,Number(n)).route.slots;
            assert.deepEqual(path.slice(0,operand.route.slots.length),operand.route.slots);
          }
        }
        assert.equal(next,BigInt(g.count)+1n);
        if(hasFormal)splitStats.formalSplits++;
      }
      splitStats.groups++;
      if(part.branches.length===2)splitStats.twoChildren++;else splitStats.threeChildren++;
      if(10n*largest>=9n*BigInt(g.count))splitStats.nineTenthsInOneChild++;
    }
    delete g.bytes;
  }
  const total=inputs.reduce((n,i)=>n+i.count,0);
  if (!published) assert.equal(total,prior.find(r=>r.indexSha256===record.indexSha256).lambdaUses.leading);
  return {record,inputs,total};
}
const reports=edition.declarations.filter(r=>r.kind==='theorem').map(audit);
if(process.argv.includes('--branch-summary')){
  const missing=[...missingSignatures].sort((a,b)=>b[1]-a[1]);
  console.log(JSON.stringify({edition:edition.id,...splitStats,missingNames:missing.length,mostFrequentMissing:process.argv.includes('--all-missing')?missing:missing.slice(0,5)}));return;
}
if (process.argv.includes('--write-packets')) {
  const dir='public/data/proof-atlas/input-roles';
  fs.mkdirSync(dir,{recursive:true});
  for (const {record,inputs} of reports) {
    if (!inputs.length) continue;
    const entries=inputs.map(input=>({
      node:input.node,depth:input.route.slots.length,count:input.count,
      groups:[...input.groups].sort((a,b)=>b[1].count-a[1].count).map(([label,g])=>({
        label,count:g.count,node:g.node,slots:g.route.slots.join('.'),...(g.role?{role:g.role}:g.count>1?{offsets:g.offsets}:{})
      }))
    }));
    fs.writeFileSync(dir+'/'+record.indexSha256+'.json',JSON.stringify({indexSha256:record.indexSha256,entries})+'\n');
  }
}
const groups=reports.flatMap(r=>r.inputs.map(i=>i.groups.size));
if (published) {
  const inputs=reports.flatMap(r=>r.inputs);
  const result={edition:edition.id,theorems:reports.length,withLeadingInputs:reports.filter(r=>r.inputs.length).length,
    inputs:inputs.length,usedInputs:inputs.filter(i=>i.count>0).length,references:reports.reduce((n,r)=>n+r.total,0),
    groups:groups.reduce((n,k)=>n+k,0),largestInputGroups:Math.max(...groups),
    riccati:reports.find(r=>r.record.name==='JacobiData.slope_bound_abs').inputs.map(i=>({name:i.name,count:i.count,groups:i.groups.size}))};
  console.log(JSON.stringify(result,null,2));
  return;
}
const lines=['# Receiving calls for leading proof inputs','',
  'Each group belongs to one binder in one compiled proof. A literal constant is grouped by its declaration name, argument position and arity. Other function heads are grouped by constructor kind. Direct structural uses are grouped by parent field. Each link opens the first reference in its group. Counts include implicit arguments and repeated subtrees.','',
  reports.reduce((n,r)=>n+r.total,0)+' references across '+reports.length+' proofs give '+groups.reduce((a,b)=>a+b,0)+' groups. The largest input has '+Math.max(...groups)+' groups.',''];
for (const {record,inputs,total} of reports) {
  const link=(node,route)=>'https://moiseevigor.github.io/projects/proof-atlas/library/?edition='+edition.id+'&proof='+encodeURIComponent(record.name)+'&route=1%3A'+route.slots.join('.')+'#expr-'+node;
  lines.push('## '+record.name,'',total+' references · compiled index `'+record.indexSha256+'`','');
  for (const input of inputs) {
    lines.push('<details><summary>'+input.name.replaceAll('&','&amp;').replaceAll('<','&lt;')+' · '+input.count+' references · '+input.groups.size+' groups</summary>','',
      '[Open binder]('+link(input.node,input.route)+')','');
    for (const [label,g] of [...input.groups].sort((a,b)=>b[1].count-a[1].count))
      lines.push('- `'+label+'` · '+g.count+' · [First occurrence]('+link(g.node,g.route)+')');
    lines.push('','</details>','');
  }
}
console.log(lines.join('\n').trimEnd());
