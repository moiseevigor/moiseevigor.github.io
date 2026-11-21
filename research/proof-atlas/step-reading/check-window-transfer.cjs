// Evaluate the fixed five-argument window on every other edition with recorded applications.
'use strict';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const geometry = require('../../../public/js/proof-atlas-geometry-core');
const union = require('../recorded-union.cjs');
const {measure} = require('./ai-inference-traces.cjs');

async function main() {
  const rows=[];
  for (const item of union.inventory().filter(item=>item.edition!=='goedel-sample-4331')) {
    const row={edition:item.edition,name:item.record.name,indexSha256:item.record.indexSha256,
      complete:0,wide:0,ports:0,first:0,last:0,best:0,losses:[]};
    const report=await measure(item,null,(inputs,n)=>{
      row.complete++;
      if (n>5) row.wide++;
      const proof=inputs.filter(p=>p.role==='proof');
      row.ports+=proof.length;
      const score=offset=>proof.filter(p=>offset<p.position && p.position<=offset+5).length;
      const end=Math.max(0,n-5);
      row.first+=score(0);
      row.last+=score(end);
      row.best+=Math.max(...Array.from({length:end+1},(_,offset)=>score(offset)));
      for (const p of proof.filter(p=>p.position<=end)) {
        row.losses.push({arity:n,slot:p.position,statement:p.statement,route:p.route});
      }
    });
    assert.equal(row.complete,report.complete);
    assert.equal(row.ports-row.last,row.losses.length);
    if (row.losses.length) {
      const bytes=union.raw(item.record.indexFile);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.record.indexSha256);
      const graph=atlas.validateIndex(JSON.parse(bytes),item.record);
      const scenes=new Map();
      for (const loss of row.losses) {
        const suffix=Array(loss.arity-loss.slot).fill(0).concat(1);
        assert.deepEqual(loss.route.slice(-suffix.length),suffix);
        const route={root:1,slots:loss.route.slice(0,-suffix.length)};
        let offset=loss.arity-5;
        for (let moves=0;;moves++) {
          const key=route.slots.join('.')+'/'+offset;
          if (!scenes.has(key)) scenes.set(key,geometry.create(graph,item.record,{route,foldApplications:true,rootArgumentOffset:offset}));
          const scene=scenes.get(key), call=scene.nodes[0], arg=call.arguments[loss.slot-1];
          assert.deepEqual(arg.route.slots,loss.route);
          if (scene.edges.some(e=>e.from===call.id && e.to===arg.path)) {
            assert.equal(moves,Math.ceil((loss.arity-5-loss.slot+1)/5));
            loss.earlierMoves=moves;
            loss.head=graph.payloads[call.head.node].name || atlas.kinds[graph.kind[call.head.node]];
            break;
          }
          assert(offset>0);
          offset=Math.max(0,offset-5);
        }
      }
    }
    row.recordedMaximal=report.maximal;
    rows.push(row);
  }
  console.log(JSON.stringify(rows,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
