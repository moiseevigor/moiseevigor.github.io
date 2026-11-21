// Find equal argument rows supplied to two formally propositional parameter domains.
'use strict';
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
const union=require('../recorded-union.cjs');
const {measure}=require('./call-destinations.cjs');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');

async function main(){
  const rows=[],names=new Set(['And.intro','id']);
  for(const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')){
    const g=(await union.open(item)).case.data;
    measure(g,g.roots[1],new Set(),(node,weight)=>{
      const {head,args}=spine(g,node);
      if(new Set(args).size===args.length)return;
      const payload=g.payloads[head];
      const name=g.kind[head]===4 && payload.nameParts.every(p=>typeof p.str==='string' && !p.str.includes('.')) ?
        payload.nameParts.map(p=>p.str).join('.') : null;
      if(name){assert.equal(name,payload.name);names.add(name);}
      rows.push({proof:item.record.name,node,weight,args,name});
    });
  }
  const commands=`import Mathlib
open Lean Meta in
run_meta do
  let env ← getEnv
  for text in [`+[...names].sort().map(n=>JSON.stringify(n)).join(',')+`] do
    if let some info := env.find? text.toName then
      forallTelescope info.type fun xs _ => do
        let mut slots : Array Nat := #[]
        for i in [:xs.size] do
          if ← isProp (← inferType xs[i]!) then slots := slots.push (i+1)
        IO.println (toJson (text, xs.size, slots)).compress
`;
  const run=spawnSync(process.env.LEAN_BIN||'lean',['--stdin'],{input:commands,encoding:'utf8'});
  if(run.error)throw run.error;
  if(run.status!==0)throw Error(run.stdout+run.stderr);
  const signatures=new Map();
  for(const line of run.stdout.trim().split('\n')){
    const [name,[arity,slots]]=JSON.parse(line);
    signatures.set(name,{arity,slots});
  }
  assert.deepEqual(signatures.get('And.intro'),{arity:4,slots:[3,4]});
  assert.deepEqual(signatures.get('id'),{arity:2,slots:[]});
  const hits=[];
  let covered=0, matchedOccurrences=0n;
  for(const row of rows){
    const signature=signatures.get(row.name);
    if(!signature)continue;
    if(row.args.length<=signature.arity)covered++;
    const groups=new Map();
    for(const slot of signature.slots){
      if(slot>row.args.length)continue;
      const arg=row.args[slot-1];
      if(!groups.has(arg))groups.set(arg,[]);
      groups.get(arg).push(slot);
    }
    const repeated=[...groups].filter(([,slots])=>slots.length>1);
    if(repeated.length){
      matchedOccurrences+=row.weight;
      hits.push({proof:row.proof,node:row.node,head:row.name,weight:String(row.weight),repeated});
    }
  }
  // Replay one maximal occurrence and every reported input address for each hit.
  for(const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')){
    const pending=new Map(hits.filter(h=>h.proof===item.record.name).map(h=>[h.node,h]));
    if(!pending.size)continue;
    const graph=(await union.open(item)).case.data,seen=new Set(),slots=[];
    function visit(node,partial){
      const hit=pending.get(node);
      if(hit && !partial){
        hit.route={root:1,slots:slots.slice()};
        hit.indexSha256=item.record.indexSha256;
        const args=spine(graph,node).args;
        for(const [arg,positions] of hit.repeated)for(const pos of positions){
          const route={root:1,slots:slots.concat(Array(args.length-pos).fill(0),1)};
          assert.equal(atlas.walk(graph,route),arg);
        }
        pending.delete(node);
      }
      if(seen.has(node) || !pending.size)return;
      seen.add(node);
      for(const [slot,child] of graph.children[node].entries()){
        slots.push(slot);visit(child,graph.kind[node]===5 && slot===0);slots.pop();
      }
    }
    visit(graph.roots[1],false);
    assert.equal(pending.size,0);
  }
  console.log(JSON.stringify({repeatedRows:rows.length,covered,matchedRows:hits.length,
    matchedOccurrences:String(matchedOccurrences),hits},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
