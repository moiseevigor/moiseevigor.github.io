// Render recorded occurrence groups without merging distinct binder routes.
'use strict';
const rows = require('./local-function-scopes.json');
const escape = x => String(x).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function link(source, target, label) {
  const query = new URLSearchParams({edition:source.edition,proof:source.name,route:target.route.root + ':' + target.route.slots.join('.')});
  return '<a href="https://moiseevigor.github.io/projects/proof-atlas/library/?' + escape(query) + '#expr-' + target.node + '">' + escape(label) + '</a>';
}
console.log(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local functions in six Lean proofs</title>
<style>*{box-sizing:border-box}body{font:1.05rem/1.55 Georgia,serif;color:#242424;background:#faf9f6;max-width:48rem;margin:3rem auto;padding:0 1rem}h1{line-height:1.15}h2{font:600 1.1rem system-ui;overflow-wrap:anywhere}a{color:#194978;text-underline-offset:.16em}summary{cursor:pointer;padding:.5rem 0}section{margin:2rem 0}li{margin:.6rem 0}meter{width:min(8rem,25vw);vertical-align:middle}small{color:#474747}</style>
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
console.log('<p><small>Each argument link opens one representative occurrence. Four of the six proof bodies contain no compound argument with a bound-variable head. The grouping records lexical binding.</small></p></main></html>');
