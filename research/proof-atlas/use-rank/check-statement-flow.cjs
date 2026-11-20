// Recover the forward display from source scopes and backward input edges.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {evaluate}=require('../free-index-multiplicity/model.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const examples=JSON.parse(html.match(/^const examples=(.*);$/m)[1]);
const flows=JSON.parse(html.match(/^const flows=(.*);$/m)[1]);
const report=[];
for(const [hash,clauses] of Object.entries(flows)){
  const calls=examples.filter(c=>c.source.indexSha256===hash);
  const {record}=inventory().find(x=>x.record.indexSha256===hash);
  const data=atlas.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+record.indexFile))),record);
  const summary={name:record.name,hash,clauses:clauses.length,direct:0,subsequent:0,onlyNested:0,noReference:0,coverage:[]};
  for(const clause of clauses){
    const binder={root:1,slots:clause.domain.route.slots.slice(0,-1)};
    const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
    const direct=[],containing=[],reached=new Set();
    for(const c of calls){
      const scope=context(data,c.call.route).binders.reverse();
      const index=scope.findIndex(a=>equal(a.route,binder));
      assert(index>=0);
      const oracle=evaluate(data,[{node:c.call.node,index}]);
      assert.equal(oracle.status,'complete');
      if(BigInt(oracle.rows[0].count)){containing.push(c.callId);assert.equal(clause.containing.find(x=>x.call===c.callId).count,oracle.rows[0].count);}
      for(const p of c.ports){
        const bound=atlas.binding(data,p.input.route);
        if(equal(bound?.route,binder)){direct.push({call:c.callId,slot:p.slot});reached.add(c.callId);}
      }
    }
    // A second union rule removes nested call roots by original occurrence path.
    const outer=calls.filter(c=>!calls.some(a=>a!==c && a.call.route.root===c.call.route.root &&
      a.call.route.slots.every((v,k)=>c.call.route.slots[k]===v)));
    const covered=clause.containing.filter(c=>outer.some(a=>a.callId===c.call))
      .reduce((sum,c)=>sum+BigInt(c.count),0n);
    const node=atlas.walk(data,{root:1,slots:[...binder.slots,1]});
    const body=evaluate(data,[{node,index:0}]);
    assert.equal(body.status,'complete');
    assert.equal(clause.coverage.total,body.rows[0].count);
    assert.equal(clause.coverage.covered,String(covered));
    const outside=clause.coverage.firstOutside;
    assert.equal(Boolean(outside),covered<BigInt(body.rows[0].count));
    if(outside){
      assert.deepEqual(atlas.binding(data,outside.route).route,binder);
      assert.equal(atlas.walk(data,outside.route),outside.node);
      assert(!calls.some(c=>c.call.route.root===outside.route.root && c.call.route.slots.every((v,k)=>outside.route.slots[k]===v)));
      // Every field preceding the witness must have all its uses covered.
      let parent=node,depth=0;
      const path=[...binder.slots,1],prior=[];
      for(const field of outside.route.slots.slice(path.length)){
        const names=atlas.fields[atlas.kinds[data.kind[parent]]];
        for(let k=0;k<field;k++)prior.push({slots:[...path,k],node:data.children[parent][k],index:depth+Number(names[k]==='body')});
        depth+=Number(names[field]==='body');parent=data.children[parent][field];path.push(field);
      }
      const key=q=>q.node+':'+q.index;
      const queries=[...new Map(prior.map(q=>[key(q),{node:q.node,index:q.index}])).values()];
      const earlier=evaluate(data,queries);
      assert.equal(earlier.status,'complete');
      const counts=new Map(earlier.rows.map(q=>[key(q),BigInt(q.count)]));
      for(const q of prior){
        const inside=outer.filter(c=>q.slots.every((v,k)=>c.call.route.slots[k]===v));
        const mass=inside.reduce((n,c)=>n+BigInt(clause.containing.find(x=>x.call===c.callId)?.count||0),0n);
        assert.equal(counts.get(key(q)),mass);
      }
    }
    summary.coverage.push({binder,name:clause.name,total:clause.coverage.total,covered:String(covered),
      summed:String(clause.containing.reduce((n,c)=>n+BigInt(c.count),0n)),firstOutside:outside});
    assert.deepEqual(containing,clause.containing.map(c=>c.call));
    for(const c of clause.containing){
      const parent=calls.find(x=>x.callId===c.call).call.route;
      assert(parent.slots.every((v,k)=>v===c.first.route.slots[k]) && parent.root===c.first.route.root);
      assert.deepEqual(atlas.binding(data,c.first.route).route,binder);
      assert.equal(atlas.walk(data,c.first.route),c.first.node);
    }
    assert.deepEqual(direct,clause.direct);
    // Compute the fixed point from incoming ports; the view walks outgoing uses.
    let previous;
    do{
      previous=reached.size;
      for(const c of calls)if(c.ports.some(p=>p.origin&&reached.has(p.origin.callId)))reached.add(c.callId);
    }while(previous!==reached.size);
    const next=calls.flatMap(c=>c.ports.filter(p=>p.origin&&reached.has(p.origin.callId))
      .map(p=>({from:p.origin.callId,call:c.callId,slot:p.slot})));
    const order=(a,b)=>a.from-b.from || a.call-b.call || a.slot-b.slot;
    assert.deepEqual(next.sort(order),[...clause.subsequent].sort(order));
    summary.direct+=direct.length;summary.subsequent+=next.length;
    if(!direct.length && containing.length)summary.onlyNested++;
    if(!containing.length)summary.noReference++;
  }
  report.push(summary);
}
console.log(JSON.stringify(report,null,2));
