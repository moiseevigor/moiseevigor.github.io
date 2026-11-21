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
function audit(record) {
  const bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=A.validateIndex(JSON.parse(bytes),record);
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
    delete g.bytes;
  }
  const total=inputs.reduce((n,i)=>n+i.count,0);
  if (!published) assert.equal(total,prior.find(r=>r.indexSha256===record.indexSha256).lambdaUses.leading);
  return {record,inputs,total};
}
const reports=edition.declarations.filter(r=>r.kind==='theorem').map(audit);
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
