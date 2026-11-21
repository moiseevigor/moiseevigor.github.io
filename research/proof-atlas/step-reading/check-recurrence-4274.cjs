// Run from the repository root with Lean 4.33.1 and an existing Mathlib on LEAN_PATH.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const union = require('../recorded-union.cjs');
const item = union.inventory().find(i=>i.edition==='goedel-sample-4331' && i.record.name==='lean_workbook_4274');
const sha256=crypto.createHash('sha256').update(union.raw(item.record.indexFile)).digest('hex');
assert.equal(sha256,item.record.indexSha256);
assert.equal(sha256,'4738e6bbc69dc2ee6d52f05f1c8e39f0509d2ee051ffab8ecd3587f9025c73b9');
const certificate=fs.readFileSync(path.join(__dirname,'Recurrence4274.lean'),'utf8');
// Reconstruct the kernel type directly. Pretty-printed coercions omit their target type.
const graph=JSON.parse(union.raw(item.record.indexFile));
function name(parts){
  return parts.reduce((parent,p)=>p.str!==undefined ? '(Lean.Name.str '+parent+' '+JSON.stringify(p.str)+')' :
    '(Lean.Name.num '+parent+' '+BigInt(p.num)+')','Lean.Name.anonymous');
}
function level(l){
  if(l.kind==='zero')return 'Lean.Level.zero';
  assert.equal(l.kind,'succ');
  return '(Lean.Level.succ '+level(l.of)+')';
}
const rows=[];
for(let id=0;id<=graph.roots[0];id++){
  const p=graph.payloads[id], children=graph.children[id].map(child=>'e'+child);
  let expr;
  switch(graph.kind[id]){
    case 0: expr='Lean.Expr.bvar '+p.index;break;
    case 4: expr='Lean.Expr.const '+name(p.nameParts)+' ['+p.levels.map(level).join(',')+']';break;
    case 5: expr='Lean.Expr.app '+children.join(' ');break;
    case 7:
      assert.equal(p.binderInfo,'default');
      expr='Lean.Expr.forallE '+name(p.binderNameParts)+' '+children.join(' ')+' .default';break;
    case 9:
      assert.equal(p.literalKind,'natVal');
      expr='Lean.Expr.lit (.natVal '+BigInt(p.value)+')';break;
    default: throw Error('Unsupported constructor at '+id);
  }
  rows.push('  let e'+id+' := '+expr);
}
const source=certificate+'\ndef atlasExpectedStatement : Prop := ∀ (n : ℕ) (b : ℕ → ℝ), '+
  'ProofAtlas.Recurrence4274.Recurrence b → b 0 = 1 → b n = ((n : ℝ)+2)*((n : ℝ)+3)/6\n'+
  'open Lean Meta in\nrun_meta do\n'+rows.join('\n')+'\n'+
  '  let .defnInfo declared ← getConstInfo \`atlasExpectedStatement | throwError "definition missing"\n'+
  '  unless ← isDefEq e'+graph.roots[0]+' declared.value do throwError "compiled statement differs"\n';
const run=spawnSync(process.env.LEAN_BIN||'lean',['--stdin'],{input:source,encoding:'utf8'});
if(run.error)throw run.error;
process.stdout.write(run.stdout);
process.stderr.write(run.stderr);
assert.equal(run.status,0);
assert(!run.stdout.includes('sorryAx'));
console.log('Checked stored statement, contradiction, and both single-premise witnesses for '+sha256);
