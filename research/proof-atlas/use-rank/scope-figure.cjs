// Render recorded occurrence groups without merging distinct binder routes.
'use strict';
const assert = require('node:assert/strict');
const rows = require('./local-function-scopes.json');
const escape = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function link(source, target, label) {
  const query = new URLSearchParams({edition:source.edition,proof:source.name,route:target.route.root + ':' + target.route.slots.join('.')});
  return '<a href="https://moiseevigor.github.io/projects/proof-atlas/library/?' + escape(query) + '#expr-' + target.node + '">' + escape(label) + '</a>';
}
console.log(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local functions and binding in Lean proofs</title>
<style>*{box-sizing:border-box}body{font:1.05rem/1.55 Georgia,serif;color:#242424;background:#faf9f6;max-width:48rem;margin:3rem auto;padding:0 1rem}h1{line-height:1.15}h2{font:600 1.1rem system-ui;overflow-wrap:anywhere}a{color:#194978;text-underline-offset:.16em}h3{overflow-wrap:anywhere}fieldset{min-inline-size:0}label{margin-inline-end:.75rem}summary{cursor:pointer;padding:.5rem 0}section{margin:2rem 0}li{margin:.6rem 0}meter{width:min(8rem,25vw);vertical-align:middle}small{color:#474747}</style>
<main><h1>Where local function calls lead</h1>
<p>Each group starts at one binder in a compiled proof. Expand it to inspect the expressions that use the binder as a function. Counts include repeated occurrences of a shared expression.</p>`);
for (const r of rows.filter(r => r.positions)) {
  const scopes = new Map();
  for (const targets of r.groups) for (const w of targets) {
    const key = JSON.stringify(w.head.binder.route);
    if (!scopes.has(key)) scopes.set(key,[]);
    scopes.get(key).push(w);
  }
  console.log('<section><h2>' + escape(r.source.name) + '</h2>');
  for (const uses of scopes.values()) {
    uses.sort((a,b) => b.uses-a.uses || a.input.node-b.input.node);
    const total = uses.reduce((n,w) => n+w.uses,0);
    const binder = uses[0].head.binder;
    console.log('<p>Binder ' + link(r.source,binder,binder.name) + ' · ' + total + ' occurrences</p><details><summary>' + uses.length + ' distinct argument rows</summary><ol>');
    for (const w of uses) {
      console.log('<li>' + link(r.source,w.input,'Argument '+w.input.node) + ' → ' + link(r.source,w.head,'function '+w.head.node) + ' · ' + w.uses + ' of ' + total + ' <meter aria-label="Share of occurrences" min="0" max="' + total + '" value="' + w.uses + '"></meter></li>');
    }
    console.log('</ol></details>');
  }
  console.log('</section>');
}
console.log('<p><small>Each argument link opens one representative occurrence. Four of the six proof bodies contain no compound argument with a bound-variable head. The grouping records lexical binding.</small></p>');

const aliases = require('./fold-aliases.json');
console.log('<section id="scope-pairs"><h2>One expression in two scopes</h2><p>In each example, the two arguments have the same compiled row. Follow each occurrence through its function to the binder in scope there.</p>');
for (const name of ['JacobiCore.Sol.mk.inj','CrossingData.mk.inj']) {
  const result = aliases.results.find(r => r.name === name);
  const source = {name,edition:aliases.edition};
  console.log('<h3>' + escape(name) + '</h3><ol>');
  for (const w of result.pair) {
    console.log('<li>' + link(source,w.input,'Argument ' + w.input.node) + ' → ' +
      link(source,w.head,'function ' + w.head.node) + ' → ' +
      link(source,w.head.binder,w.head.binder.name + ' (binder ' + w.head.binder.node + ')') + '</li>');
  }
  console.log('</ol>');
}
console.log('</section><section id="repeated-scope"><h2>One binder row in two places</h2>');
for (const result of aliases.results.filter(r => r.repeatedBinder)) {
  const source = {name:result.name,edition:aliases.edition};
  console.log('<h3>' + escape(result.name) + '</h3><p>The two paths first separate at ' +
    link(source,result.fork,'application ' + result.fork.node) +
    '. Select a field to follow its binding links.</p><fieldset><legend>Path from the shared ancestor</legend>');
  for (const [i,w] of result.repeatedBinder.entries()) {
    const field = result.fork.branches[i];
    console.log('<label><input type="radio" name="' + escape(result.name) + '" ' + (i ? '' : 'checked ') +
      'value="' + i + '">' + escape(field === 'arg' ? 'Argument' : 'Function') + '</label>');
  }
  const first = result.repeatedBinder[0];
  const toInput = first.input.route.slots.slice(first.head.binder.route.slots.length);
  const toHead = first.head.route.slots.slice(first.input.route.slots.length);
  for (const [i,w] of result.repeatedBinder.entries()) {
    const base = w.head.binder.route;
    const input = {node:first.input.node, route:{root:base.root,slots:base.slots.concat(toInput)}};
    const head = {node:first.head.node, route:{root:base.root,slots:input.route.slots.concat(toHead)}};
    assert.deepEqual(input,w.input);
    assert.deepEqual(head.route,w.head.route);
    assert.equal(head.node,w.head.node);
    console.log('<p data-branch="' + i + '"' + (i ? ' hidden' : '') + '>' +
      link(source,input,'Argument ' + input.node) + ' → ' + link(source,head,'function ' + head.node) +
      ' → ' + link(source,w.head.binder,w.head.binder.name + ' (binder ' + w.head.binder.node + ')') +
      '<br><small>Binder depth ' + base.slots.length + ' from the proof root</small></p>');
  }
  console.log('<p>From either binder, child slots <code>' + toInput.join('.') +
    '</code> reach the argument. Slot <code>' + toHead.join('.') + '</code> then reaches its function.</p>');
  console.log('</fieldset>');
}
console.log(`</section></main><script>document.querySelectorAll('fieldset').forEach(group => {
  group.addEventListener('change', event => {
    for (const branch of group.querySelectorAll('[data-branch]')) branch.hidden = branch.dataset.branch !== event.target.value;
  });
});</script></html>`);
