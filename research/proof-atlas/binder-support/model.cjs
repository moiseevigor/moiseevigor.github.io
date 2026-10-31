/* Exact syntactic reference multiplicities. No type inference or let reduction. */
'use strict';
const assert = require('assert/strict');
const B = require('../binder-block-exchange/model.cjs');
const binds = (kind, slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);
const serial = stats => ({ occurrences: String(stats.occurrences), localReferences: String(stats.localReferences), free: [...stats.free].sort((a,b)=>a[0]-b[0]).map(([index,count])=>({ index, count:String(count) })) });

// Bottom-up sparse coefficients: binding removes index 0, then lowers outer indices.
function counter(g, { maxStates = 262144, maxSupport = 512, maxCoefficients = 1048576, maxTotalDigits = 8388608, maxDigits = 4096 } = {}) {
  const memo = new Map();let coefficients=0,totalDigits=0;
  function visit(node) {
    if (memo.has(node)) return memo.get(node);
    assert(memo.size < maxStates, 'support state bound');
    const kind = g.kind[node], free = new Map();
    let occurrences = 1n, localReferences = 0n;
    if (kind === 0) free.set(g.payloads[node].index, 1n);
    g.children[node].forEach((child, slot) => {
      const s = visit(child), binding = binds(kind,slot);
      occurrences += s.occurrences;
      localReferences += s.localReferences;
      for (const [index,count] of s.free) {
        if (binding && index === 0) localReferences += count;
        else { const target = index-Number(binding); free.set(target,(free.get(target)||0n)+count); }
      }
    });
    assert(free.size <= maxSupport, 'support coefficient bound');
    const values=[occurrences,localReferences,...free.values()];let digits=0;for(const v of values){const n=String(v).length;assert(n<=maxDigits,'support integer digit bound');digits+=n;}
    coefficients+=free.size;totalDigits+=digits;assert(coefficients<=maxCoefficients&&totalDigits<=maxTotalDigits,'support retained coefficient bound');
    const result = { occurrences, localReferences, free };
    assert(memo.size < maxStates, 'support state bound');
    memo.set(node,result);
    return result;
  }
  return { at: node => serial(visit(node)), state: () => ({ states:memo.size, coefficients,totalDigits }) };
}

// Independent top-down oracle: count weighted visits to (stored row, binder depth).
// A shared row at different depths is deliberately a different state.
function weighted(g, root, { maxStates = 262144, maxDepth = 512, maxPendingDigits = 8388608, maxDigits = 4096, maxSupport = 512 } = {}) {
  const pending = new Map([[root,new Map([[0,1n]])]]), free = new Map();
  let occurrences = 0n, localReferences = 0n, states = 0,pendingStates=1,pendingDigits=1;
  assert(pendingDigits<=maxPendingDigits,'weighted retained digit bound');
  for (let node=root; node>=0; node--) {
    const depths = pending.get(node); if (!depths) continue;
    for (const [depth,weight] of depths) {
      assert(++states <= maxStates && depth <= maxDepth, 'weighted support bound');
      occurrences += weight;
      if (g.kind[node]===0) {
        const index=g.payloads[node].index;
        if (index<depth) localReferences += weight;
        else free.set(index-depth,(free.get(index-depth)||0n)+weight);
      }
      assert(free.size<=maxSupport&&String(occurrences).length<=maxDigits&&String(localReferences).length<=maxDigits,'weighted result bound');
      g.children[node].forEach((child,slot)=>{
        assert(Number.isInteger(child)&&child>=0&&child<node,'postorder source');
        if (!pending.has(child)) pending.set(child,new Map());
        const at=depth+Number(binds(g.kind[node],slot)), row=pending.get(child);
        const previous=row.get(at)||0n,next=previous+weight;if(!row.has(at))pendingStates++;const digits=String(next).length;assert(digits<=maxDigits,'weighted integer digit bound');pendingDigits+=digits-(previous?String(previous).length:0);assert(pendingStates<=maxStates&&pendingDigits<=maxPendingDigits,'weighted retained state bound');row.set(at,next);
      });
    }
    pendingStates-=depths.size;for(const weight of depths.values())pendingDigits-=String(weight).length;pending.delete(node);
  }
  return serial({occurrences,localReferences,free});
}

function describe(g, root, identities, counterInstance=counter(g)) {
  const spine=B.spine(g,root).rows;
  assert.equal(spine.length,identities.length,'spine identities');
  assert.equal(new Set(identities).size,identities.length,'distinct source binders');
  function field(node,prefix) {
    const result=counterInstance.at(node);
    assert.equal(result.occurrences,g.expanded[node],'expression occurrence count');
    return {...result, references:result.free.map(({index,count})=>{
      assert(index<prefix,'closed original context');
      return {binder:identities[prefix-1-index],count};
    }).sort((a,b)=>a.binder-b.binder)};
  }
  const frames=spine.map((row,i)=>{
    const [domain,value]=g.children[row.node], p=g.payloads[row.node];
    return {binder:identities[i], ordinal:i, path:row.slots, kind:row.kind===6?'lam':'letE',name:row.kind===6?p.binderName:p.declName, domain:field(domain,i),...(row.kind===8?{value:field(value,i)}:{})};
  });
  const last=spine.at(-1), tail=last?g.children[last.node][last.kind===8?2:1]:root;
  return {frames,tail:field(tail,spine.length),tailPath:last?[...last.slots,last.kind===8?2:1]:[]};
}

function swapIdentities(g, beforeRoot, path, ids) {
  const rows=B.spine(g,beforeRoot).rows, at=rows.findIndex(r=>JSON.stringify(r.slots)===JSON.stringify(path));
  assert(at>=0&&rows[at].kind===8&&rows[at+1]?.kind===6,'adjacent exchange identity');
  const next=ids.slice(); [next[at],next[at+1]]=[next[at+1],next[at]];
  return {at,next};
}

function exchangeLaw(g, beforeRoot, afterRoot, path, ids, c=counter(g)) {
  const {at,next}=swapIdentities(g,beforeRoot,path,ids), before=describe(g,beforeRoot,ids,c), after=describe(g,afterRoot,next,c);
  const y=before.frames[at], x=before.frames[at+1], moved=after.frames[at], letAfter=after.frames[at+1];
  const yUses=BigInt(x.domain.references.find(r=>r.binder===y.binder)?.count||'0');
  const original=new Map(x.domain.references.map(r=>[r.binder,BigInt(r.count)])); original.delete(y.binder);
  for (const r of y.value.references) original.set(r.binder,(original.get(r.binder)||0n)+yUses*BigInt(r.count));
  const expected=[...original].filter(([,n])=>n!==0n).sort((a,b)=>a[0]-b[0]).map(([binder,count])=>({binder,count:String(count)}));
  assert.deepEqual(moved.domain.references,expected,'substituted input type support');
  assert.equal(BigInt(moved.domain.occurrences),BigInt(x.domain.occurrences)+yUses*(BigInt(y.value.occurrences)-1n),'substitution size law');
  assert.deepEqual(y.domain.references,letAfter.domain.references,'definition domain support');
  assert.deepEqual(y.value.references,letAfter.value.references,'definition value support');
  for(let i=0;i<before.frames.length;i++) if(i!==at&&i!==at+1){
    const a=before.frames[i], b=after.frames.find(f=>f.binder===a.binder);
    assert.deepEqual(a.domain.references,b.domain.references,'unaffected domain binding');
    assert.deepEqual(a.value?.references,b.value?.references,'unaffected value binding');
  }
  assert.deepEqual(before.tail.references,after.tail.references,'tail binding support');
  return {next,record:{definition:y.binder,input:x.binder,sourceTypeReferences:x.domain.references,definingValueReferences:y.value.references,computedTypeReferences:moved.domain.references,replacedReferences:String(yUses),sourceTypeOccurrences:x.domain.occurrences,computedTypeOccurrences:moved.domain.occurrences}};
}
module.exports={counter,weighted,describe,swapIdentities,exchangeLaw};
