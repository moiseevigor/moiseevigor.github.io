/* Stable expression-shape fingerprints, independent of DAG node numbering. */
'use strict';
const crypto=require('crypto'),assert=require('assert/strict');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
function roots(graph,selected){const hashes=[];for(let i=0;i<graph.kind.length;i++){assert(graph.children[i].every(c=>Number.isInteger(c)&&c>=0&&c<i));const data=[graph.kind[i],canonical(graph.payloads[i]),graph.children[i].map(c=>hashes[c]),graph.expanded[i],graph.neededScope[i]];hashes.push(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'));}return selected.map(i=>{assert(Number.isInteger(i)&&i>=0&&i<hashes.length);return hashes[i];});}
module.exports={roots};
