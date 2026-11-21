// Pair actual arguments with literal leading lambda binders in a separately owned body.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/article-proof-steps');
const article = window.PROOF_ATLAS_PROOF_STEPS;
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === article.edition);
const owners = new Map(edition.declarations.map(r => [r.name,r]));

function load(owner) {
  const bytes = gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  return atlas.validateIndex(JSON.parse(bytes),owner);
}

function leadingParameters(term) {
  let node = term.roots[1];
  const parameters = [];
  const slots = [];
  while (atlas.kinds[term.kind[node]] === 'lam') {
    parameters.push({node,slots:slots.slice(),count:0,first:null});
    slots.push(1);
    node = term.children[node][1];
  }
  // Traverse the proof body, including binder domains, so later parameter types
  // can reference earlier parameters. The stack holds only the current path.
  const scope = [], path = [];
  function visit(id, leading) {
    const kind = atlas.kinds[term.kind[id]];
    if (kind === 'bvar') {
      const parameter = scope.at(-1-term.payloads[id].index);
      if (parameter) {
        parameter.count++;
        if (!parameter.first) {
          const route = {root:1,slots:path.slice()};
          assert.deepEqual(atlas.binding(term,route),{node:parameter.node,route:{root:1,slots:parameter.slots}});
          parameter.first = {node:id,slots:route.slots};
        }
      }
    }
    term.children[id].forEach((child,slot)=>{
      const binds = (kind==='lam'||kind==='forallE') && slot===1 || kind==='letE' && slot===2;
      const parameter = binds && leading ? parameters[path.length] : null;
      if (binds) scope.push(parameter);
      path.push(slot);
      visit(child,Boolean(parameter));
      path.pop();
      if (binds) scope.pop();
    });
  }
  visit(term.roots[1],true);
  // Independent count from each binder body, using de Bruijn indices and
  // shared row/index states instead of the occurrence traversal's scope stack.
  const memo = new Map();
  function count(id,index) {
    const key=id+'/'+index;
    if(memo.has(key)) return memo.get(key);
    const kind=atlas.kinds[term.kind[id]];
    let total=Number(kind==='bvar' && term.payloads[id].index===index);
    term.children[id].forEach((child,slot)=>{
      const nested=['lam','letE','forallE'].includes(kind) && atlas.fields[kind][slot]==='body';
      total+=count(child,index+Number(nested));
    });
    assert(Number.isSafeInteger(total));
    memo.set(key,total);
    return total;
  }
  for (const p of parameters) assert.equal(count(term.children[p.node][1],0),p.count);
  return parameters;
}

function link(owner,node,slots,label) {
  const params = new URLSearchParams({edition:edition.id,proof:owner.name,route:'1:'+slots.join('.')});
  return '['+label+'](https://moiseevigor.github.io/projects/proof-atlas/library/?'+params+'#expr-'+node+')';
}

const cache = new Map(), rows=[];
let calls=0, inputs=0, matched=0, unused=0;
for (const anchor of article.anchors.filter(a=>a.kind==='app' && a.callee)) {
  const caller=owners.get(anchor.declaration), term=load(caller);
  let node=term.roots[1];
  const path=[];
  const fields=anchor.path.split('.');
  assert.equal(fields.splice(0,2).join('.'),term.declaration.rootPaths[1]);
  for (const field of fields) {
    const slot=atlas.fields[atlas.kinds[term.kind[node]]].indexOf(field);
    assert(slot>=0);
    path.push(slot);node=term.children[node][slot];
  }
  assert.equal(node,anchor.node);
  const callee=owners.get(anchor.callee);
  if (callee?.bodyAvailable && !cache.has(callee.name)) cache.set(callee.name,leadingParameters(load(callee)));
  const parameters=cache.get(anchor.callee);
  const entries=[];
  for(let slot=anchor.arity;slot>=1;slot--) {
    assert.equal(atlas.kinds[term.kind[node]],'app');
    const [fn,arg]=term.children[node];
    const actual=link(caller,arg,path.concat(1),'input '+slot);
    const parameter=parameters?.[slot-1];
    if(parameter){
      matched++;
      const binder=link(callee,parameter.node,parameter.slots,'parameter '+slot);
      const uses=parameter.first ? link(callee,parameter.first.node,parameter.first.slots,'first of '+parameter.count) : '0 uses';
      if (!parameter.count) unused++;
      entries.unshift(actual+' → '+binder+' → '+uses);
    } else entries.unshift(actual+' · '+(parameters?'outside leading lambdas':'body unavailable'));
    path.push(0);node=fn;inputs++;
  }
  assert.equal(atlas.kinds[term.kind[node]],'const');
  assert.equal(term.payloads[node].name,anchor.callee);
  rows.push('| '+anchor.declaration+' | '+anchor.callee+' | '+entries.join('<br>')+' |');
  calls++;
}
console.log('# Inside the called lemma\n');
console.log(calls+' article-linked applications, '+inputs+' supplied inputs, '+matched+' matched callee body parameters, '+unused+' matched parameters with zero references.\n');
console.log('Each row starts in the caller. Following a parameter opens its binder in the called declaration. Counts include every bound-variable occurrence in its compiled body, including in subsequent binder domains. The first use follows source field order. Counts measure syntax and include shared subterms once per occurrence.\n');
console.log('| Caller | Callee | From supplied input to original binder and first use |\n|---|---|---|');
console.log(rows.join('\n'));
