// Read the original binder domain in the context preceding that binder.
'use strict';
const assert=require('node:assert/strict');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {destination}=require('../../../public/js/proof-atlas-clause-navigation');
const lexicalInputs=require('./lexical-inputs.cjs');

module.exports=function declaredDomain(data,anchor){
  const route={root:anchor.route.root,slots:[...anchor.route.slots,0]};
  const node=atlas.walk(data,route);
  assert(['lam','forallE','letE'].includes(atlas.kinds[data.kind[anchor.node]]));
  const domain={node,route};
  const pair=destination(data,anchor.route);
  let statement=null;
  if(pair && anchor.route.root===1 && anchor.route.slots.every(slot=>slot===1) &&
      pair.route.root===0 && pair.route.slots.length===anchor.route.slots.length &&
      data.kind[pair.node]===7 && data.kind[anchor.node]===6 && data.children[pair.node][0]===node){
    statement={node,route:{root:0,slots:[...pair.route.slots,0]}};
  }
  return {domain,statement,references:lexicalInputs(data,domain)};
};
