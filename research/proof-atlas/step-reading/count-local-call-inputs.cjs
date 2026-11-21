// Count application-valued argument positions, independently of native role availability.
'use strict';
const assert=require('node:assert/strict');
const {inventory,raw}=require('../recorded-union.cjs');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {measure}=require('./call-destinations.cjs');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const results=[];
function records(){
  const editionId=process.argv.includes('--working')?'working-26':process.argv.includes('--published')?'published-15':null;
  if(!editionId)return inventory().filter(i=>i.edition==='goedel-sample-4331').map(i=>i.record);
  const context={window:{}};
  require('node:vm').runInNewContext(require('node:fs').readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),context);
  const edition=context.window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===editionId);
  return edition.declarations.filter(d=>d.kind==='theorem' && d.bodyAvailable);
}
for(const record of records()){
  const bytes=raw(record.indexFile);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const g=atlas.validateIndex(JSON.parse(bytes),record);
  let positions=0,expanded=0n,local=0,expandedLocal=0n,maxLocalWidth=0;
  const heads={}, lambdaParents=new Set();
  const destinations=measure(g,g.roots[1],new Set(),(node,weight)=>{
    for(const arg of spine(g,node).args){
      if(atlas.kinds[g.kind[arg]]!=='app')continue;
      positions++;expanded+=weight;
      const call=spine(g,arg);
      const kind=atlas.kinds[g.kind[call.head]];
      const summary=heads[kind]??={positions:0,expanded:0n,beyond32:0,maxWidth:0};
      summary.positions++;summary.expanded+=weight;
      summary.maxWidth=Math.max(summary.maxWidth,call.args.length);
      if(call.args.length>32)summary.beyond32++;
      if(kind==='lam')lambdaParents.add(node);
      if(kind!=='bvar')continue;
      local++;expandedLocal+=weight;
      maxLocalWidth=Math.max(maxLocalWidth,call.args.length);
    }
  });
  assert.equal(expanded,destinations.counts.argument||0n);
  assert.equal(Object.values(heads).reduce((sum,h)=>sum+h.positions,0),positions);
  assert.equal(Object.values(heads).reduce((sum,h)=>sum+h.expanded,0n),expanded);
  let lambdaUses=0,identityUses=0;
  const replayLambda=!process.argv.includes('--counts-only');
  if(replayLambda && lambdaParents.size){
    const relevant=[];
    for(let i=0;i<g.kind.length;i++)relevant.push(lambdaParents.has(i)||g.children[i].some(c=>relevant[c]));
    const slots=[];
    function replay(node,partial){
      if(!partial && lambdaParents.has(node)){
        const args=spine(g,node).args;
        args.forEach((arg,i)=>{
          const fn=spine(g,arg);
          if(!fn.args.length || g.kind[fn.head]!==6)return;
          const headRoute={root:1,slots:slots.concat(Array(args.length-1-i).fill(0),1,Array(fn.args.length).fill(0))};
          assert.equal(atlas.walk(g,headRoute),fn.head);
          const body={root:1,slots:headRoute.slots.concat(1)},id=atlas.walk(g,body);
          assert.equal(id,g.children[fn.head][1]);
          if(g.kind[id]===0 && g.payloads[id].index===0){
            assert.deepEqual(atlas.binding(g,body),{node:fn.head,route:headRoute});
            identityUses++;
          }
          lambdaUses++;
        });
      }
      g.children[node].forEach((child,slot)=>{
        if(!relevant[child])return;
        slots.push(slot);replay(child,g.kind[node]===5 && slot===0);slots.pop();
      });
    }
    replay(g.roots[1],false);
  }
  if(replayLambda)assert.equal(BigInt(lambdaUses),heads.lam?.expanded||0n);
  results.push({proof:record.name,indexSha256:record.indexSha256,positions,expanded:String(expanded),
    local,expandedLocal:String(expandedLocal),maxLocalWidth,heads,...(replayLambda?{lambdaUses,identityUses}:{})});
}
console.log(JSON.stringify(results,(_,v)=>typeof v==='bigint'?String(v):v,2));
