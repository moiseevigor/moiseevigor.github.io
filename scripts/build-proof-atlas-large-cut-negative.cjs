/* Select a real large-graph variable with another genuine enclosing binder. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),J=require('../public/js/proof-atlas-judgment-geometry'),C=require('../public/js/proof-atlas-cut-certificate');
const folder=process.env.ATLAS_LARGE_CUT_REQUESTS||'/tmp/atlas-large-source-cuts',request=JSON.parse(fs.readFileSync(path.join(folder,'source-3.json'))),manifest=fs.readFileSync(path.join(__dirname,'../public/data/proof-atlas/source-references-manifest.js'),'utf8'),inventory=JSON.parse(manifest.slice(manifest.indexOf('=')+1).trim().replace(/;$/,'')),record=inventory.edition.declarations.find(r=>r.name===request.expected.name),raw=z.gunzipSync(fs.readFileSync(request.packetFile));
assert(record&&record.indexSha256===request.expected.indexSha256&&record.sourceSha256===request.expected.sourceSha256&&record.uniqueNodes===request.expected.uniqueNodes);
assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),record.indexSha256);const data=A.validateIndex(JSON.parse(raw),record),variable=request.records.findLast(r=>r.entries.some(e=>e.binding)&&r.external.length>=2);assert(variable);
const route={root:variable.root.route.root,slots:variable.root.route.slots.slice(0,-1)},scene=J.create(data,record,()=>null,{judgmentRoute:route,maxNodes:4,maxDepth:1,sourceFallback:true,policy:'source-order'}),positive=C.create(scene,data,record);
assert(positive.external.length>=2&&positive.entries.some(e=>e.binding)&&positive.entries.some(e=>e.tag==='node'&&!e.binding));
const output={...request,records:[positive],refinements:[]};fs.writeFileSync(path.join(folder,'negative-source.json'),JSON.stringify(output));console.log(JSON.stringify({status:'PASS',sourceNodes:record.uniqueNodes,selectedRoute:route,externalBinders:positive.external.length}));
