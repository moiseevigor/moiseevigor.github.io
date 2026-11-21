// Follow recorded lambda bodies and explicit proof arguments in one compiled declaration.
'use strict';
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const packed = require('../../../public/js/proof-atlas-packed-routes');

async function main() {
  const [edition,name,token] = process.argv.slice(2);
  const item = union.inventory().find(row=>row.edition===edition && row.record.name===name);
  if (!item || !token) throw Error('Expected edition, declaration and packed root.depth.slots');
  const [root,depth,slots] = token.split('.');
  const start = {format:'ProofAtlasPackedRoute/1',root:Number(root),depth:Number(depth),slots};
  packed.parse(start);
  const profile = (await union.open(item)).case, graph = profile.data;
  let remaining=32;
  function visit(route,node,level,statement) {
    assert(remaining>0);
    remaining--;
    const position=packed.resolve(graph,route);
    assert.equal(position.node,node);
    const entry=profile.get(route);
    if (entry) assert.equal(entry.node,node);
    const rule=typing.construction(entry,graph);
    const result={node,route,statement:entry?.typeText ?? statement ?? null};
    const query=new URLSearchParams({view:'occurrence',loading:'paged',diagram:'construction',edition,proof:name});
    result.href='/projects/proof-atlas/library/?'+query+'#occurrence='+[item.record.indexSha256,route.root,route.depth,route.slots].join('.');
    if (position.binding) result.binding=position.binding;
    if (!rule || level===4) return {...result,boundary:rule?'depth limit':'construction unavailable'};
    const children=[];
    if (graph.kind[node]===6 && rule.premises?.[1]) {
      const body=graph.children[node][1];
      assert.equal(body,rule.premises[1].node);
      children.push({field:'body',route:packed.append(route,[1]),node:body,statement:rule.premises[1].typeText});
      result.binder=graph.payloads[node].binderName;
    } else if (rule.rule==='Pi-application') {
      let stage=node, address=route;
      const reverse=[];
      while (graph.kind[stage]===5) {
        const observed=profile.get(address);
        const application=typing.construction(observed,graph);
        if (application?.rule!=='Pi-application') return {...result,boundary:'incomplete application record'};
        assert.equal(observed.node,stage);
        const premise=application.premises[1], [fn,arg]=graph.children[stage];
        assert.equal(premise.node,arg);
        const mode=observed.typeData.payloads[application.components.pi].binderInfo;
        reverse.push({mode,role:premise.role,node:arg,statement:premise.typeText,route:packed.append(address,[1])});
        stage=fn;
        address=packed.append(address,[0]);
      }
      result.head=graph.payloads[stage].name ?? null;
      result.arity=reverse.length;
      for (const [i,input] of reverse.reverse().entries())
        if(input.mode==='default' && input.role==='proof') children.push({...input,field:'argument '+(i+1)});
    } else return {...result,boundary:rule.rule};
    result.inputs=[];
    for (const child of children) {
      if (!remaining) {result.boundary='node limit';break;}
      result.inputs.push({field:child.field,...visit(child.route,child.node,level+1,child.statement)});
    }
    return result;
  }
  const source=profile.get(start);
  if (!source) throw Error('No recorded observation at starting route');
  console.log(JSON.stringify({edition,name,indexSha256:item.record.indexSha256,outline:visit(start,source.node,0)},null,2));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
