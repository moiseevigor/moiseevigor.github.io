// Emit a standalone reader. Check every emitted Riccati address against the packet.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),path=require('node:path'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const example=require('./results.json').maxima['published-15'];
const {edition,record}=inventory().find(x=>x.record.indexSha256===example.packet);
const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(createHash('sha256').update(bytes).digest('hex'),example.packet);
const data=atlas.validateIndex(JSON.parse(bytes),record);
const model=require('./model.cjs').open(data,example.binder);
const table=model.branchTable();
const select=require('./select-branch.js');
for(let n=1n;n<=model.total;n++) {
  const expected=model.select(n),found=select(table,n);
  assert.deepEqual(found.slots,expected.route.slots);assert.equal(found.node,expected.node);
  assert.deepEqual(atlas.binding(data,expected.route).route,example.binder);
  assert.equal(model.rank(expected.route),n);
}
const packet={localSteps:require('./riccati-local-inputs.cjs')(data),edition,name:record.name,hash:example.packet,root:example.binder.root,inference:require("./riccati-call.cjs")(data,model,example.packet),table,fields:atlas.kinds.map(k=>atlas.fields[k]||[])};
const html=fs.readFileSync(path.join(__dirname,'riccati-template.html'),'utf8');
process.stdout.write(html.replace('/* INSERT SELECTOR */',()=>fs.readFileSync(path.join(__dirname,'select-branch.js'),'utf8'))
  .replace('/* INSERT PACKET */',()=>JSON.stringify(packet).replaceAll('<','\\u003c')));
