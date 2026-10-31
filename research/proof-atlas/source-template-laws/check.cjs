'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),{collect}=require('./prepare.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-laws/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x)),data=JSON.parse(z.gunzipSync(fs.readFileSync(base+'instances.json.gz')));
const binds=(k,s)=>((k===6||k===7)&&s===1)||(k===8&&s===2),same=(a,b)=>assert.deepEqual(a,b);
function check(instance){
 const g=instance.graph,n=g.kind.length;assert(n>0&&n<=8192);assert.equal(g.roots.length,4);assert.equal(g.children.length,n);assert.equal(g.payloads.length,n);assert.equal(g.expanded.length,n);assert.equal(g.neededScope.length,n);
 for(let i=0;i<n;i++){
  const k=g.kind[i],cs=g.children[i],p=g.payloads[i];assert(Number.isInteger(k)&&k>=0&&k<12);assert.equal(cs.length,(A.fields[A.kinds[k]]||[]).length);assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<i));
  const count=1n+cs.reduce((sum,c)=>sum+BigInt(g.expanded[c]),0n);assert.equal(g.expanded[i],String(count));
  const needed=k===0?p.index+1:Math.max(0,...cs.map((c,s)=>Math.max(0,g.neededScope[c]-Number(binds(k,s)))));assert.equal(g.neededScope[i],needed);
 }
 const[original,template,rawSource,rawTemplate]=g.roots;assert.equal(instance.opening.rawSource,rawSource);assert.equal(instance.opening.rawTemplate,rawTemplate);
 assert.equal(instance.opening.sourceContext.length,instance.prefixLength);assert.equal(instance.opening.templateContext.length,instance.prefixLength+instance.contextKeys.length);
 same(instance.opening.templateContext.slice(0,instance.prefixLength),instance.opening.sourceContext);
 for(const list of[instance.opening.sourceContext,instance.opening.templateContext]){assert.equal(new Set(list).size,list.length);assert(list.every(node=>g.kind[node]===1));}
 function opening(raw,opened,context){const seen=new Set(),todo=[{raw,opened,depth:0}];for(let i=0;i<todo.length;i++){const p=todo[i],key=p.raw+':'+p.opened+':'+p.depth;if(seen.has(key))continue;seen.add(key);assert(seen.size<=262144);
  if(g.kind[p.raw]===0&&g.payloads[p.raw].index>=p.depth){const index=context.length-1-(g.payloads[p.raw].index-p.depth);assert(index>=0&&index<context.length);assert.equal(p.opened,context[index]);continue;}
  assert.equal(g.kind[p.raw],g.kind[p.opened]);same(g.payloads[p.raw],g.payloads[p.opened]);assert.equal(g.children[p.raw].length,g.children[p.opened].length);
  for(const [slot,child]of g.children[p.raw].entries())todo.push({raw:child,opened:g.children[p.opened][slot],depth:p.depth+Number(binds(g.kind[p.raw],slot))});
 }return seen.size;}
 const openingStates=opening(rawSource,original,instance.opening.sourceContext)+opening(rawTemplate,template,instance.opening.templateContext);
 const groups=instance.groups;assert.equal(new Set(groups.map(r=>r.source)).size,groups.length);const images=new Map();
 for(const i of instance.selectedGroups){const group=groups[i];assert.equal(group.index,i);assert.equal(group.chosen,group.targets[0]);assert.equal(g.kind[group.target],1);assert.equal(g.neededScope[group.source],0);assert(!images.has(group.target));images.set(group.target,group.source);}
 const seen=new Map(),used=new Set();
 for(const [i,r]of instance.records.entries()){
  assert(!seen.has(r.source));assert(r.source>=0&&r.source<n&&r.output>=0&&r.output<n);seen.set(r.source,i);
  if(r.rule==='capture'){const group=groups[r.group];assert(group);assert.equal(r.source,group.source);assert.equal(r.output,group.target);assert.equal(g.neededScope[r.source],0);assert.equal(images.get(r.output),r.source);used.add(r.group);}
  else{assert.equal(r.rule,'frame');assert.equal(g.kind[r.source],g.kind[r.output]);same(g.payloads[r.source],g.payloads[r.output]);assert.equal(r.children.length,g.children[r.source].length);assert.equal(r.children.length,g.children[r.output].length);
   if(g.kind[r.source]===1)assert(!images.has(r.source),'An unchanged source variable must have an identity recovery image');
   for(const[slot,c]of r.children.entries()){assert(Number.isInteger(c)&&c>=0&&c<i);assert.equal(instance.records[c].source,g.children[r.source][slot]);assert.equal(instance.records[c].output,g.children[r.output][slot]);}
  }
 }
 same([...used],instance.selectedGroups);const root=instance.records[instance.rootRecord];assert(root);assert.equal(root.source,original);assert.equal(root.output,template);
 const weighted=[];for(let node=0;node<n;node++)weighted.push(images.has(node)?BigInt(g.expanded[images.get(node)]):1n+g.children[node].reduce((sum,c)=>sum+weighted[c],0n));
 assert.equal(instance.counts.source,g.expanded[original]);assert.equal(instance.counts.template,g.expanded[template]);assert.equal(instance.counts.weighted,String(weighted[template]));assert.equal(instance.counts.source,instance.counts.weighted);assert.equal(instance.counts.storedRows,n);assert.equal(instance.counts.certificateRows,instance.records.length);const reached=new Set(),stack=[template];while(stack.length){const node=stack.pop();if(reached.has(node))continue;reached.add(node);stack.push(...g.children[node]);}assert.equal(instance.counts.templateDAGRows,reached.size);
 return{kind:instance.owner.kind,name:instance.owner.name||instance.bindingKey,rows:n,proofNodes:instance.records.length,openingStates,kinds:[...new Set(g.kind)].sort((a,b)=>a-b),source:instance.counts.source,template:instance.counts.template,weighted:instance.counts.weighted};
}
same(data,collect());const results=data.instances.map(check);assert.equal(results.length,8);same(results.at(-1).kinds,Array.from({length:12},(_,i)=>i));
let refused=0;function damaged(index,change){const instance=copy(data.instances[index]);change(instance);assert.throws(()=>check(instance));refused++;}
damaged(0,x=>x.groups[x.selectedGroups[0]].source=x.graph.roots[0]);
damaged(0,x=>x.opening.sourceContext.reverse());
damaged(0,x=>x.opening.templateContext.reverse());
damaged(0,x=>x.counts.source=String(BigInt(x.counts.source)+1n));
damaged(0,x=>x.counts.weighted=String(BigInt(x.counts.weighted)+1n));
damaged(0,x=>x.rootRecord=0);
damaged(0,x=>{const row=x.records.find(r=>r.rule==='frame'&&r.children.length);row.children[0]=x.records.indexOf(row);});
damaged(0,x=>{const row=x.records.find(r=>r.rule==='frame'&&r.source!==r.output&&x.graph.kind[r.source]===6);x.graph.payloads[row.output].binderInfo='instImplicit';});
damaged(0,x=>{const row=x.records.find(r=>r.rule==='capture');row.output=x.graph.roots[0];});
damaged(6,x=>{const group=x.groups[x.selectedGroups[0]];assert(group.targets.length>1);group.chosen=group.targets[1];});
damaged(7,x=>{const row=x.records.find(r=>r.rule==='frame'&&r.source!==r.output&&x.graph.kind[r.source]===10);x.graph.payloads[row.output].metadata[0].value.repr='Lean.DataValue.ofBool true';});
const report={format:'ProofAtlasSourceRecoveryCertificateModel/1',status:'PASS',instances:results,refusals:refused,
 files:Object.fromEntries(['prepare.cjs','Recovery.lean','Native.lean','check.cjs','instances.json.gz'].map(f=>[base+f,sha(fs.readFileSync(base+f))])),
 scope:'Independent finite row accounting, lexical context opening and local recovery-certificate validation. This is not a native compilation result, authentication of imported Lean dependencies, general codec/executor refinement or mathematical typing of the represented source terms.'};
if(process.argv.includes('--check'))same(JSON.parse(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz'))),report);else fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
