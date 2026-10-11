/* UI-state checks for an illustration; no physical solver is being tested. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const {phases, stateAt} = require(path.join(root,'public/js/starbirth-formation.js'));
assert.equal(phases.length,9);
assert.equal(phases[4].title,'Embedded protostar');
assert.equal(phases[8].title,'Main-sequence star');
assert.equal(stateAt(-40).position,0);
assert.equal(stateAt(900).position,800);
assert.equal(stateAt(NaN).position,0);
const fields=['cloudRadius','cloudOpacity','coreRadius','diskRadius','jet','infall'];
for(let value=0;value<=800;value++) {
  const state=stateAt(value);
  assert.equal(state.index,Math.min(8,Math.floor(value/100)));
  for(const key of fields)assert(Number.isFinite(state[key])&&state[key]>=0);
  assert(state.cloudOpacity<=1&&state.jet<=1&&state.infall<=1);
}
for(let index=1;index<8;index++) {
  const before=stateAt(index*100-.0001),after=stateAt(index*100+.0001);
  for(const key of fields)assert(Math.abs(before[key]-after[key])<.001);
}
assert.equal(stateAt(0).coreRadius,0);
assert.equal(stateAt(800).cloudRadius,0);
assert.equal(stateAt(800).diskRadius,0);
const include=fs.readFileSync(path.join(root,'_includes/starbirth-formation.html'),'utf8');
assert.deepEqual(Array.from(include.matchAll(/data-phase="(\d+)"/g),m=>Number(m[1])),[0,1,2,3,4,5,6,7,8]);
assert(include.includes('not a calibrated clock'));
assert(include.includes('Read all nine milestones'));
assert(include.includes('second-core formation'));
assert(include.includes('2,000 K'));
if(process.argv[2]) {
  const site=path.resolve(process.argv[2]);
  const page=fs.readFileSync(path.join(site,'astrophysics/2026/10/11/hidden-protostars-research-program/index.html'),'utf8');
  assert(!page.includes('{% include'));
  assert(page.includes('id="star-formation"'));
  assert(page.includes('aria-describedby="sbf-time-note"'));
  for(const asset of ['public/js/starbirth-formation.js','public/css/starbirth-formation.css']) {
    assert(page.includes('/'+asset));
    assert(fs.readFileSync(path.join(site,asset)).equals(fs.readFileSync(path.join(root,asset))));
  }
}
console.log('PASS: nine milestones, 801 bounded finite slider states, continuity, cloud/star endpoints, accessible static sequence and rendered assets. Illustration only.');
