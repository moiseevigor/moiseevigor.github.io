/* Preserve the complete former technical record while changing its navigation. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const source=fs.readFileSync('docs/proof-atlas-evidence.md','utf8'),program=fs.readFileSync('docs/proof-atlas-research-program.md','utf8');
// Read preserved blocks first: newer entries need not contain a historical block.
// An unbounded match from a newer entry could otherwise consume the following one.
const rows=[...source.matchAll(/<!-- atlas-original-start -->\n([\s\S]*?)<!-- atlas-original-end -->/g)].map(m=>{const start=source.lastIndexOf('<details class="atlas-evidence-entry"',m.index),tag=source.slice(start,source.indexOf('>',start)+1),order=tag.match(/data-evidence-order="(\d+)"/);assert(order,'original block has an evidence entry');return{order:+order[1],text:m[1]};}).sort((a,b)=>a.order-b.order);
assert.equal(rows.length,63);assert.deepEqual(rows.map(r=>r.order),Array.from({length:63},(_,i)=>i));
const sha=crypto.createHash('sha256').update(rows.map(r=>r.text).join('')).digest('hex');assert.equal(sha,'f467d72dbda2e3f853c9dcd69715ee37f41b8e55ac192db87162fd59213ba2f7');assert(source.includes('data-original-sha256="'+sha+'"'));
const aliases=[...program.matchAll(/<a id="([^"]+)" data-evidence-anchor href="([^"]+)"/g)];assert.equal(aliases.length,75);assert.equal(new Set(aliases.map(m=>m[1])).size,75);for(const m of aliases)assert.equal(m[2],'/projects/proof-atlas/evidence/#'+m[1]);
const project=fs.readFileSync('projects.markdown','utf8');assert.equal((project.match(/class="project-entry"/g)||[]).length,4);assert(!project.includes('<hr'));assert(!project.includes('github-button'));assert(!project.includes('<style>'));
const manual=fs.readFileSync('projects/proof-atlas/manual/index.html','utf8');assert.equal((manual.match(/class="pm-math"/g)||[]).length,9);
console.log(JSON.stringify({status:'PASS',preservedSections:rows.length,formerTechnicalRecordSha256:sha,stableAnchors:aliases.length,researchLayers:5,projectEntries:4,mathFigures:9,scope:'Verbatim technical evidence retained and original program anchors mapped; presentation and navigation only.'}));
