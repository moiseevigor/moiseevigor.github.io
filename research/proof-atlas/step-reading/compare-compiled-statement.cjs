'use strict';
const assert=require('node:assert/strict');
function name(parts){
  return parts.reduce((parent,p)=>p.str!==undefined ? '(Lean.Name.str '+parent+' '+JSON.stringify(p.str)+')' :
    '(Lean.Name.num '+parent+' '+BigInt(p.num)+')','Lean.Name.anonymous');
}
function level(l){
  if(l.kind==='zero')return 'Lean.Level.zero';
  assert.equal(l.kind,'succ');
  return '(Lean.Level.succ '+level(l.of)+')';
}
function compareStatement(graph,expected){
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
  return 'open Lean Meta in\nrun_meta do\n'+rows.join('\n')+'\n'+
    '  let .defnInfo declared ← getConstInfo `'+expected+' | throwError "definition missing"\n'+
    '  unless ← isDefEq e'+graph.roots[0]+' declared.value do throwError "compiled statement differs"\n';
}
module.exports={compareStatement};
