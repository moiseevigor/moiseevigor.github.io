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
    const totals = counts[item.edition] ||= {recorded:0,named:0};
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
      totals.recorded++;
      if (expected) totals.named++;
    }
  }
  console.log(JSON.stringify(counts,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
