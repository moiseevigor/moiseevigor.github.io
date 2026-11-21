// Test full-statement queries under the reader's case-insensitive substring search.
'use strict';
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {inventory} = require('../recorded-union.cjs');
const {measure} = require('./ai-inference-traces.cjs');
const normalize = text=>text.normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();

async function main() {
  const editions={};
  for (const item of inventory()) {
    const stats=editions[item.edition]??={calls:0, proofSlots:0, directBound:0, withText:0, ambiguous:0,
      identical:0, differentTerm:0, examples:[]};
    await measure(item,null,(inputs,n,args,graph)=>{
      stats.calls++;
      const proof=inputs.filter(p=>p.role==='proof');
      const searchable=proof.filter(p=>typeof p.statement==='string' && normalize(p.statement));
      stats.proofSlots+=proof.length;
      for(const input of proof){
        const id=args[input.position-1];
        if(atlas.kinds[graph.kind[id]]!=='bvar')continue;
        const route={root:1,slots:input.route};
        assert.equal(atlas.walk(graph,route),id);
        const binder=atlas.binding(graph,route);
        assert(binder);
        assert.equal(atlas.walk(graph,binder.route),binder.node);
        stats.directBound++;
      }
      stats.withText+=searchable.length;
      for(const input of searchable){
        const query=normalize(input.statement);
        const hits=searchable.filter(p=>normalize(p.statement).includes(query));
        assert(hits.includes(input));
        if(hits.length===1)continue;
        stats.ambiguous++;
        const others=hits.filter(p=>p!==input);
        if(others.some(p=>normalize(p.statement)===query))stats.identical++;
        if(others.some(p=>args[p.position-1]!==args[input.position-1]))stats.differentTerm++;
        if(stats.examples.length<3)stats.examples.push({
          proof:item.record.name,indexSha256:item.record.indexSha256,arity:n,statement:input.statement,
          queried:input.position,hits:hits.map(p=>({slot:p.position,node:args[p.position-1],route:p.route,statement:p.statement}))
        });
      }
    });
  }
  console.log(JSON.stringify(editions,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
