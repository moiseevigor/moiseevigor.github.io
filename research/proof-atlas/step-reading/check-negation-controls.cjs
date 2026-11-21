// Check the four additional declarations containing fully applied Not.intro terms.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const union=require('../recorded-union.cjs');
const {compareStatement}=require('./compare-compiled-statement.cjs');
const controls=[
  ['lean_workbook_20418','cyclicStatement','8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d'],
  ['lean_workbook_plus_6206','cyclicStatement','2e5bbcebb8129c823d4640a7c17f06b1a073c8a2df20889e65f4efc61f213bd6'],
  ['lean_workbook_plus_39831','modularStatement','f596c3ecdbe411dbee9539b59d1010f6a711ff31f1e3eda778e45ac070641f02'],
  ['lean_workbook_plus_62755','quadraticStatement','6ddad1d9f4c6c2be27a802c254e8cff3a33443735e6672ce906fd6466ee7cbe0']
];
let source=fs.readFileSync(path.join(__dirname,'NegationControls.lean'),'utf8')+'\n';
for(const [name,target,digest] of controls){
  const record=union.inventory().find(i=>i.edition==='goedel-sample-4331' && i.record.name===name).record;
  const bytes=union.raw(record.indexFile);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),digest);
  source+=compareStatement(JSON.parse(bytes),'ProofAtlas.NegationControls.'+target);
}
const run=spawnSync(process.env.LEAN_BIN||'lean',['--stdin'],{input:source,encoding:'utf8'});
if(run.error)throw run.error;
process.stdout.write(run.stdout);process.stderr.write(run.stderr);
assert.equal(run.status,0);
assert(!run.stdout.includes('sorryAx'));
console.log('Lean checked all four compiled statements and their premise certificates.');
