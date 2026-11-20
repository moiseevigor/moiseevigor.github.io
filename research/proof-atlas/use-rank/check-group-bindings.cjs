// Count occurrences by sending incoming multiplicities down the source DAG.
// At a bound-variable leaf, subtract only the binders entered inside the group.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const groups=JSON.parse(html.match(/^const groupBindings=(.*);$/m)[1]);
const flows=JSON.parse(html.match(/^const flows=(.*);$/m)[1]);
function count(data,root){
  const pending=new Map([[root,new Map([[0,1n]])]]),out=new Map();
  for(let node=root;node>=0;node--){
    const depths=pending.get(node);
    if(!depths)continue;
    pending.delete(node);
    for(const [depth,mass] of depths){
      if(data.kind[node]===0){
        const index=data.payloads[node].index-depth;
        if(index>=0)out.set(index,(out.get(index)||0n)+mass);
      }
      data.children[node].forEach((child,i)=>{
        const next=depth+Number(atlas.fields[atlas.kinds[data.kind[node]]][i]==='body');
        if(!pending.has(child))pending.set(child,new Map());
        const counts=pending.get(child);counts.set(next,(counts.get(next)||0n)+mass);
      });
    }
  }
  return out;
}
const typeContexts=JSON.parse(html.match(/^const typeContexts=(.*);$/m)[1]);
const results=[];
for(const [hash,bindings] of Object.entries(groups)){
  const {record}=inventory().find(x=>x.record.indexSha256===hash);
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  const data=atlas.validateIndex(JSON.parse(bytes),record);
  const result={name:record.name,hash,uniqueGroups:0,multipleBinders:0,largestInterface:0,displayedGroups:0,unavailable:0,groupsWithTypeAdditions:0,typeAdditions:0};
  const visited=new Set();
  for(const clause of flows[hash])for(const branch of clause.coverage.branches.largest)for(const part of branch.frontier){
    const {node,route}=part.anchor,key=route.slots.join('.'),refs=bindings[key];
    result.displayedGroups++;
    if(!visited.has(key)){
      visited.add(key);result.uniqueGroups++;
      if(refs===null){result.unavailable++;continue;}
      const scope=context(data,route).binders.reverse(),expected=count(data,node);
      assert.equal(expected.size,refs.length);
      for(const ref of refs){
        const index=scope.findIndex(b=>JSON.stringify(b.route)===JSON.stringify(ref.binder.route));
        assert.equal(expected.get(index),BigInt(ref.count));
        expected.delete(index);
        assert.equal(ref.use.route.root,route.root);
        assert(route.slots.every((v,i)=>ref.use.route.slots[i]===v));
        assert.equal(atlas.walk(data,ref.use.route),ref.use.node);
        assert.deepEqual(atlas.binding(data,ref.use.route),{node:ref.binder.node,route:ref.binder.route});
      }
      assert.equal(expected.size,0);
      const identify = r => r.root + ':' + r.slots.join('.');
      const direct = new Set(refs.map(ref=>identify(ref.binder.route)));
      const needed = new Set(direct);
      const owners = new Set();
      // From innermost to outermost: a binder domain can use only earlier binders.
      for(const binder of scope){
        if(!needed.has(identify(binder.route)))continue;
        const domain = {root:binder.route.root,slots:binder.route.slots.concat(0)};
        owners.add(identify(domain));
        const before = context(data,domain).binders.reverse();
        for(const index of count(data,atlas.walk(data,domain)).keys())needed.add(identify(before[index].route));
      }
      const extra = typeContexts[hash][key];
      assert.deepEqual(extra.map(e=>identify(e.binder.route)).sort(),[...needed].filter(k=>!direct.has(k)).sort());
      for(const e of extra){
        assert(owners.has(identify(e.domain.route)));
        assert.equal(atlas.walk(data,e.domain.route),e.domain.node);
        assert.equal(e.use.route.root,e.domain.route.root);
        assert.deepEqual(e.use.route.slots.slice(0,e.domain.route.slots.length),e.domain.route.slots);
        assert.equal(atlas.walk(data,e.use.route),e.use.node);
        assert.deepEqual(atlas.binding(data,e.use.route),{node:e.binder.node,route:e.binder.route});
      }
      if(extra.length)result.groupsWithTypeAdditions++;
      result.typeAdditions+=extra.length;
      if(refs.length>1)result.multipleBinders++;
      result.largestInterface=Math.max(refs.length,result.largestInterface);
    }
    if(refs){
      const selected=clause.domain.route.slots.slice(0,-1);
      assert.equal(refs.find(r=>JSON.stringify(r.binder.route.slots)===JSON.stringify(selected)).count,part.count);
    }
  }
  assert.deepEqual([...visited].sort(),Object.keys(bindings).sort());
  results.push(result);
}
console.log(JSON.stringify(results,null,2));
