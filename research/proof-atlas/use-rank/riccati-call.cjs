// Join one recorded application to variable-use ordinals by original occurrence path.
'use strict';
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');

module.exports = function riccatiCall(data, model, packetHash) {
  const owner = '7a995a4a5559be0a3f1778357ac9a9b696cc0bf446e7513f6a3d52822035af35';
  const bytes = gunzipSync(readFileSync('public/data/proof-atlas/application-ports/' + owner + '.json.gz'));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), owner);
  const native = JSON.parse(bytes);
  assert.equal(native.source.indexSha256, packetHash);
  const ports = native.entries.filter(entry => entry.id.startsWith('75:')).map(entry => entry.junction);
  const call = ports[0].consumer.anchor;
  function within(route, parent) {
    return route.root === parent.root && parent.slots.every((slot, i) => route.slots[i] === slot);
  }
  function checkAnchor(anchor) {
    const id = anchor.route.slots.reduce((node, slot) => data.children[node][slot], data.roots[anchor.route.root]);
    assert.equal(id, anchor.node);
  }
  checkAnchor(call);
  const inputs = ports.map((port, slot) => {
    assert.equal(port.consumer.slot, slot);
    assert.deepEqual(port.consumer.anchor, call);
    checkAnchor(port.consumer.input);
    return {anchor: port.consumer.input, term: port.display.inputTerm, type: port.display.inputType, uses: []};
  });
  for (let n = 1n; n <= model.total; n++) {
    const {route} = model.select(n);
    if (!within(route, call.route)) continue;
    const matches = inputs.filter(input => within(route, input.anchor.route));
    assert.equal(matches.length, 1);
    matches[0].uses.push(String(n));
  }
  return {owner, call, conclusion: ports[0].display.consumerType, inputs};
};
