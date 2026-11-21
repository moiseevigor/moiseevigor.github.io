// Group references to leading lambda inputs by literal constant head and source port.
'use strict';
const fs = require('node:fs'), vm = require('node:vm'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const A = require('../../../public/js/proof-atlas-library-data');
const {applicationAtUse} = require('../../../public/js/proof-atlas-omitted-references');
const E = require('../../../public/js/proof-atlas-elimination');
const {countReferences} = require('../../../public/js/proof-atlas-recursive-inputs');
const prior = require('./ai-local-flow.json');
const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
const edition = window.PROOF_ATLAS_AI_SAMPLE.edition;
function audit(record) {
  const bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=A.validateIndex(JSON.parse(bytes),record);
  const inputs=[], slots=[], parents=[], scope=[], spines=new Map();
  function classify(node,input) {
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
      }
    } else {
      const kind=A.kinds[data.kind[parent]];
      label=kind+' · '+A.fields[kind][slots.at(-1)];
    }
    if (!input.groups.has(label)) {
      const witness={root:1,slots:[...slots]};
      assert.deepEqual(A.binding(data,witness),{node:input.node,route:input.route});
      input.groups.set(label,{count:0,node,route:witness});
    }
    input.groups.get(label).count++;
    input.count++;
  }
  function walk(node,leading) {
    if (!leading && data.neededScope[node]===0) return;
    const kind=A.kinds[data.kind[node]];
    let input=null;
    if (leading && kind==='lam') {
      input={name:data.payloads[node].binderName,node,route:{root:1,slots:[...slots]},groups:new Map(),count:0};
      inputs.push(input);
    }
    if (kind==='bvar') {
      const binder=scope.at(-1-data.payloads[node].index);
      if (binder) classify(node,binder);
    }
    parents.push(node);
    data.children[node].forEach((child,i)=>{
      const body=A.fields[kind][i]==='body' && ['lam','forallE','letE'].includes(kind);
      if (body) scope.push(input);
      slots.push(i);
      walk(child,leading && kind==='lam' && body);
      slots.pop();
      if (body) scope.pop();
    });
    parents.pop();
  }
  walk(data.roots[1],true);
  for (const input of inputs) {
    const refs=countReferences(data,data.children[input.node][1],0);
    assert.equal(refs.status,'counted');
    assert.equal(BigInt(refs.occurrences),BigInt(input.count));
    assert.equal([...input.groups.values()].reduce((sum,g)=>sum+g.count,0),input.count);
  }
  const total=inputs.reduce((n,i)=>n+i.count,0);
  assert.equal(total,prior.find(r=>r.indexSha256===record.indexSha256).lambdaUses.leading);
  return {record,inputs,total};
}
const reports=edition.declarations.map(audit);
const groups=reports.flatMap(r=>r.inputs.map(i=>i.groups.size));
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
