// Compare every recorded application label with the binder of its observed function type.
'use strict';
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const fold = require('../../../public/js/proof-atlas-occurrence-application-fold');
(async()=>{
  const counts = {};
  for (const item of union.inventory()) {
    const {case:profile} = await union.open(item);
    const model = fold.open(profile);
    const totals = counts[item.edition] ||= {recorded:0,named:0,proofInputs:0,shortStatements:0};
    for (const entry of profile.entries) {
      const construction = typing.construction(entry,profile.data);
      if (construction?.rule !== 'Pi-application') continue;
      const scene = model.create(entry.route,{maxNodes:1,maxDepth:0},3);
      const group = scene.nodes[0];
      if (!group) throw Error('Missing application at '+entry.node);
      const member = group.members.at(-1);
      assert.deepEqual(model.routeFor(scene,group.id,member.id),entry.route);
      const pi = construction.components.pi;
      const payload = entry.typeData.payloads[pi];
      const expected = entry.typeData.kind[pi] === 7 && payload.binderName &&
        payload.binderName !== '_' && payload.binderNameParts?.length === 1 &&
        payload.binderNameParts[0].str === payload.binderName ? payload.binderName : null;
      assert.equal(model.parameterFor(scene,group.id,member.id),expected);
      const stage=model.stageFor(scene,group.id,member.id);
      const premise=construction.premises[1];
      assert.equal(stage.roles.argument,premise.role);
      assert.equal(stage.texts.argument,premise.typeText);
      if(premise.role==='proof'){
        totals.proofInputs++;
        if(premise.typeText && premise.typeText.length<=120)totals.shortStatements++;
      }
      totals.recorded++;
      if (expected) totals.named++;
    }
  }
  console.log(JSON.stringify(counts,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
