// Test full-statement queries under the reader's case-insensitive substring search.
'use strict';
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const inputHead = require('./input-head.cjs');
const {inventory} = require('../recorded-union.cjs');
const {measure} = require('./ai-inference-traces.cjs');
const normalize = text=>text.normalize('NFC').replace(/\s+/g,' ').trim().toLowerCase();

async function main() {
  const editions={};
  for (const item of inventory()) {
    const stats=editions[item.edition]??={calls:0, proofSlots:0, directBound:0, withText:0, ambiguous:0,
      argumentKinds:{},appHeads:{},appMaxArity:0,appExamples:{},identical:0, differentTerm:0, binderKinds:{}, letChains:{}, distinctDefinitions:0, definitionsUsedMoreThanOnce:0, letExamples:[], examples:[]};
    const definitions=new Map();
    await measure(item,null,(inputs,n,args,graph)=>{
      stats.calls++;
      const proof=inputs.filter(p=>p.role==='proof');
      const searchable=proof.filter(p=>typeof p.statement==='string' && normalize(p.statement));
      stats.proofSlots+=proof.length;
      for(const input of proof){
        const id=args[input.position-1];
        const kindName=atlas.kinds[graph.kind[id]];
        stats.argumentKinds[kindName]=(stats.argumentKinds[kindName]||0)+1;
        if(kindName==='app'){
          const route={root:1,slots:input.route};
          const head=inputHead(graph,{node:id,route});
          assert.equal(atlas.walk(graph,head.route),head.node);
          stats.appHeads[head.kind]=(stats.appHeads[head.kind]||0)+1;
          stats.appMaxArity=Math.max(stats.appMaxArity,head.route.slots.length-route.slots.length);
          if(!stats.appExamples[head.kind])stats.appExamples[head.kind]={proof:item.record.name,slot:input.position,n,route,head};
        }
        if(atlas.kinds[graph.kind[id]]!=='bvar')continue;
        const route={root:1,slots:input.route};
        assert.equal(atlas.walk(graph,route),id);
        const binder=atlas.binding(graph,route);
        assert(binder);
        assert.equal(atlas.walk(graph,binder.route),binder.node);
        const kind=atlas.kinds[graph.kind[binder.node]];
        stats.binderKinds[kind]=(stats.binderKinds[kind]||0)+1;
        if(kind==='letE'){
          const ownerPath=binder.route.slots.join('.');
          definitions.set(ownerPath,(definitions.get(ownerPath)||0)+1);
          let owner=binder,value,steps=0;
          do{
            const slots=owner.route.slots.concat(1);
            assert(slots.length<route.slots.length || steps===0);
            value={node:graph.children[owner.node][1],route:{root:1,slots}};
            assert.equal(atlas.walk(graph,value.route),value.node);
            steps++;
            if(atlas.kinds[graph.kind[value.node]]!=='bvar')break;
            const next=atlas.binding(graph,value.route);
            assert(next && next.route.slots.length<owner.route.slots.length);
            owner=next;
          }while(atlas.kinds[graph.kind[owner.node]]==='letE');
          stats.letChains[steps]=(stats.letChains[steps]||0)+1;
          if(stats.letExamples.length<3)stats.letExamples.push({proof:item.record.name,arity:n,slot:input.position,
            input:route,binder,value,steps});
        }
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
    stats.distinctDefinitions+=definitions.size;
    stats.definitionsUsedMoreThanOnce+=[...definitions.values()].filter(n=>n>1).length;
  }
  console.log(JSON.stringify(editions,null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
