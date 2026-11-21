// Follow recorded lambda bodies and explicit proof arguments in one compiled declaration.
'use strict';
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const packed = require('../../../public/js/proof-atlas-packed-routes');

const arithmetic = require('../../../public/js/proof-atlas-arithmetic');
const rankedUses = require('./ranked-binder-uses.cjs');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');

function contraryClosure(graph,route,node) {
  const bytes=packed.parse(route);
  const slots=Array.from({length:route.depth},(_,i)=>(bytes[i>>2]>>((i%4)*2))&3);
  const site={node,route:{root:route.root,slots}};
  const field=(s,i)=>({node:graph.children[s.node][i],route:{root:s.route.root,slots:s.route.slots.concat(i)}});
  function matches(s,name,arity) {
    const {head,args}=spine(graph,s.node);
    return graph.kind[head]===4 && graph.payloads[head].name===name && args.length===arity;
  }
  if (!matches(site,'Not.intro',2)) return null;
  const lambda=field(site,1);
  if (graph.kind[lambda.node]!==6 || graph.children[lambda.node][0]!==graph.children[graph.children[node][0]][1]) return null;
  const close=field(lambda,1);
  if (!matches(close,'Mathlib.Tactic.Linarith.lt_irrefl',4)) return null;
  const operand=field(field(close,0),1), evidence=field(close,1);
  const rewrite=arithmetic.formulaTransport(graph,evidence);
  if (rewrite?.after.name!=='LT.lt' || rewrite.after.left.site.node!==operand.node) return null;
  const references=arithmetic.contraryUses(graph,{close,evidence});
  for (const s of [lambda,close,operand,evidence,rewrite.after.left.site,rewrite.after.right.site])
    assert.equal(atlas.walk(graph,s.route),s.node);
  if (!references.limited) {
    const count=rankedUses(graph,lambda.route);
    assert.equal(String(count.total),references.total);
    for (const [i,witness] of references.uses.entries()) assert.deepEqual(count.select(BigInt(i)),witness.site);
  }
  function numeral(s) {
    if (!matches(s,'OfNat.ofNat',3)) return null;
    const literal=field(field(s,0),1), payload=graph.payloads[literal.node];
    if (graph.kind[literal.node]!==9 || payload.literalKind!=='natVal') return null;
    return {value:payload.value,instance:field(s,1),type:field(field(field(s,0),0),1)};
  }
  function trace(witness) {
    let input=witness.site;
    const steps=[];
    for (const {call,head,label,arity,slot} of witness.chain) {
      const application=spine(graph,call.node);
      assert.equal(application.head,head.node);
      assert.equal(application.args.length,arity);
      const suffix=Array(slot===0 ? arity : arity-slot).fill(0);
      if (slot!==0) suffix.push(1);
      assert.deepEqual(input.route,{root:call.route.root,slots:call.route.slots.concat(suffix)});
      assert.equal(atlas.walk(graph,input.route),input.node);
      const inference=arithmetic.arithmeticInference(graph,call);
      const index=inference?.proofs.findIndex(s=>s.node===input.node &&
        String(s.route.slots)===String(input.route.slots)) ?? -1;
      steps.push({call,label,slot,arity,...(index>=0 ? {premise:inference.premises[index],conclusion:inference.conclusion} : {})});
      input=call;
    }
    if (witness.reached) assert.deepEqual(input,evidence);
    return {site:witness.site,receiver:witness.first?.label??null,steps,reachedTransport:witness.reached};
  }
  return {basis:'compiled structure',lambda,close,operand,evidence,
    transportTarget:[rewrite.after.left.site,rewrite.after.right.site].map(s=>({...s,numeral:numeral(s)})),
    uses:references.total??null,witnesses:references.uses.map(trace),
    limited:references.limited};
}

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
    if (!rule) {
      const closure=contraryClosure(graph,route,node);
      if (closure) result.contradiction=closure;
    }
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
