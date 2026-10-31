'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/source-template-inputs/', sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = name => JSON.parse(z.gunzipSync(fs.readFileSync(base + name + '.json.gz')));
const native = read('native'), model = read('model-check'); assert.equal(model.status, 'PASS');
const profile = native.profiles.find(p => p.source.name === 'JacobiData.slope_bound_abs');
const candidate = profile.native.cases.find(c => c.policy === 'all-boundary-positions');
assert.equal(candidate.status, 'PASS'); assert.equal(candidate.independentInputs, 17); assert.equal(candidate.derivedInputs, 18);
assert.equal(candidate.templates.length, 3); assert.equal(candidate.permutations.length, 1); assert.deepEqual(candidate.keptContextSlots, [0, 1]);
const source = JSON.parse(z.gunzipSync(fs.readFileSync('.' + profile.record.indexFile)));
const prefix = profile.commonContext.map(frame => source.payloads[frame.node].binderName);
assert.deepEqual(prefix.slice(0, 2), ['J', 'p']);
const aliases = new Map([['atlasRegionInput.1', 'a'], ['atlasRegionInput.2', 'b']]);
const links = [], fields = [], edges = [];
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const caseHash = sha(Buffer.from(JSON.stringify(candidate))), nativeHash = sha(z.gunzipSync(fs.readFileSync(base + 'native.json.gz')));
function sourceLink(bindingKey) {
  const row = candidate.bindings.find(row => row.key === bindingKey); assert(row);
  const port = row.port;
  const query = new URLSearchParams({source:profile.source.indexSha256, edition:profile.source.edition, proof:profile.source.name, call:String(port.call), input:String(port.slot)});
  const href = '/projects/proof-atlas/manual/paged-network/?' + query + '#ns-lab';
  links.push({bindingKey, href, source:port.source.input, sourceOwner:profile.source});
  return escape(href);
}
function application(graph, id) {
  const args = [];
  while (graph.kind[id] === 5) { args.unshift(graph.children[id][1]); id = graph.children[id][0]; }
  assert.equal(graph.kind[id], 4); return {head:id, name:graph.payloads[id].name, args};
}
function literal(graph, id) {
  if (graph.kind[id] === 4) return graph.payloads[id].name;
  if (graph.kind[id] === 9) return '#' + graph.payloads[id].value;
  const call = application(graph, id);
  return call.name + '(' + call.args.map(arg => literal(graph, arg)).join(',') + ')';
}
const hidden = [];
let component = null, componentRoot = null;
const fieldOwner = () => ({component, root:componentRoot});
function formula(graph, id, context, path = []) {
  const kind = graph.kind[id], payload = graph.payloads[id], children = graph.children[id];
  fields.push({...fieldOwner(), node:id, slots:path});
  if (kind === 0) { assert(payload.index < context.length); return context[context.length - 1 - payload.index]; }
  if (kind === 4) { assert.equal(payload.name, 'Real'); return 'ℝ'; }
  if (kind === 6) {
    assert.equal(formula(graph, children[0], context, [...path, 0]), 'ℝ');
    return 'λ x : ℝ, ' + formula(graph, children[1], [...context, 'x'], [...path, 1]);
  }
  const call = application(graph, id), args = call.args;
  function child(index) {
    const slots = [...path, ...Array(args.length - 1 - index).fill(0), 1];
    return formula(graph, args[index], context, slots);
  }
  const binary = {
    'LE.le': [2, '≤', ['Real','Real.instLE']],
    'HMul.hMul': [4, '·', ['Real','Real','Real','instHMul(Real,Real.instMul)']],
    'HAdd.hAdd': [4, '+', ['Real','Real','Real','instHAdd(Real,Real.instAdd)']],
    'HSub.hSub': [4, '−', ['Real','Real','Real','instHSub(Real,Real.instSub)']]
  }[call.name];
  if (binary) {
    const [offset, glyph, expected] = binary;
    assert.equal(args.length, offset + 2); assert.deepEqual(args.slice(0, offset).map(arg => literal(graph, arg)), expected);
    hidden.push({...fieldOwner(), node:id, head:call.head, argumentNodes:args.slice(0, offset), kind:'literal-real-operator-prefix'});
    const left = child(offset), right = child(offset + 1);
    return call.name === 'LE.le' ? left + ' ≤ ' + right : '(' + left + ' ' + glyph + ' ' + right + ')';
  }
  if (call.name === 'Real.sqrt') { assert.equal(args.length, 1); return '√' + child(0); }
  if (call.name === 'abs') {
    assert.equal(args.length, 4); assert.deepEqual(args.slice(0, 3).map(arg => literal(graph, arg)), ['Real','Real.lattice','Real.instAddGroup']);
    hidden.push({...fieldOwner(), node:id, head:call.head, argumentNodes:args.slice(0, 3), kind:'literal-real-abs-prefix'});
    return '|' + child(3) + '|';
  }
  if (call.name === 'OfNat.ofNat') {
    assert.equal(args.length, 3); assert.equal(literal(graph, args[0]), 'Real'); assert.equal(graph.kind[args[1]], 9);
    const number = graph.payloads[args[1]].value;
    const instances = {
      '1':'One.toOfNat1(Real,Real.instOne)',
      '2':'instOfNatAtLeastTwo(Real,#2,Real.instNatCast,Nat.instAtLeastTwoHAddOfNat(OfNat.ofNat(Nat,#1,instOfNatNat(#1)),Nat.instNeZeroSucc(OfNat.ofNat(Nat,#0,instOfNatNat(#0)))))'
    };
    assert.equal(literal(graph, args[2]), instances[number]); assert(instances[number]);
    hidden.push({...fieldOwner(), node:id, head:call.head, argumentNodes:[args[0],args[2]], kind:'literal-real-numeral'});
    return number;
  }
  const projections = {'JacobiData.T1':'T₁','JacobiData.T2':'T₂','JacobiData.z':'z','JacobiData.Dz':'Dz'};
  assert(call.name in projections, 'unreviewed formula head: ' + call.name);
  assert.equal(args.length, 2); assert.equal(child(0), 'J'); assert.equal(child(1), 'p');
  return projections[call.name] + '(J,p)';
}
const expectedSources = [
  'λ x : ℝ, (2 · √x) ≤ (|T₁(J,p)| + |T₂(J,p)|)',
  'λ x : ℝ, (2 · x) ≤ (|T₁(J,p)| + |T₂(J,p)|)',
  'λ x : ℝ, (2 · (x · √((z(J,p) · (1 − z(J,p))) · Dz(J,p)))) ≤ (|T₁(J,p)| + |T₂(J,p)|)'
];
const expectedTargets = expectedSources.map(value => value.replace('(|T₁(J,p)| + |T₂(J,p)|)', '(a + b)'));
const templates = candidate.templates.map((plan, index) => {
  const fieldStart = fields.length, hiddenStart = hidden.length;
  component = 'original'; componentRoot = plan.graph.roots[0];
  const original = formula(plan.graph, plan.graph.roots[0], prefix);
  component = 'rewritten'; componentRoot = plan.graph.roots[1];
  const computed = formula(plan.graph, plan.graph.roots[1], [...prefix, ...plan.contextBindingKeys.map(key => aliases.get(key) || key)]);
  assert.equal(original, expectedSources[index]); assert.equal(computed, expectedTargets[index]); assert.deepEqual(plan.usedGroups, [1, 2]);
  return {bindingKey:plan.bindingKey, source:original, computed, originalRoot:plan.graph.roots[0], computedRoot:plan.graph.roots[1], contextBindingKeys:plan.contextBindingKeys,
    groups:plan.usedGroups.map(group => plan.groups[group]), fields:fields.slice(fieldStart), hiddenArguments:hidden.slice(hiddenStart), nativeCaseSha256:caseHash,
    namespace:'source-template-pattern-components', template:index, relation:plan.relation,
    displayBinder:{alias:'x', originalPayload:plan.graph.payloads[plan.graph.roots[0]], relation:'presentation-name-alias'}};
});
const permutation = candidate.permutations[0], moved = permutation.old.map((key, from) => ({key, from, to:permutation.new.indexOf(key)})).filter(row => row.from !== row.to);
assert.equal(permutation.cause, 'atlasRegionInput.22'); assert.equal(moved.length, 12);
assert(permutation.old.indexOf('atlasRegionInput.22') < permutation.old.indexOf('atlasRegionInput.33'));
assert(permutation.new.indexOf('atlasRegionInput.33') < permutation.new.indexOf('atlasRegionInput.22'));
const assigned = candidate.constraints.find(row => row.bindingKey === permutation.cause);
const dependencyKeys = new Set(), seen = new Set();
function dependencies(id, depth = 0) {
  const cache = id + ':' + depth; if (seen.has(cache)) return; seen.add(cache);
  const graph = assigned.graph, kind = graph.kind[id], payload = graph.payloads[id];
  if (kind === 0 && payload.index >= depth) {
    const index = prefix.length + assigned.contextBindingKeys.length - 1 - payload.index + depth;
    if (index >= prefix.length) dependencyKeys.add(assigned.contextBindingKeys[index - prefix.length]);
  }
  for (const [slot, child] of graph.children[id].entries()) dependencies(child, depth + Number((kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2));
}
dependencies(assigned.graph.roots[0]); assert.deepEqual([...dependencyKeys], ['atlasRegionInput.33']);
const parts = [], text = (x,y,value,cls='math') => `<text x="${x}" y="${y}" class="${cls}">${escape(value)}</text>`;
parts.push(text(24,36,'Rebuild source lambdas without adding proof adapters','title'));
parts.push(text(24,66,'Riccati region: 17 independent inputs + 18 derived positions. Retain J,p and all seven results.','caption'));
for (const [key, label, x] of [['atlasRegionInput.1','a : ℝ · source |T₁(J,p)|',24], ['atlasRegionInput.2','b : ℝ · source |T₂(J,p)|',580]]) {
  assert.equal(candidate.bindings.find(row => row.key === key).port.kind, 'input');
  parts.push(`<a href="${sourceLink(key)}" tabindex="0" aria-label="Inspect original captured value ${escape(label)}"><rect x="${x}" y="88" width="530" height="50" class="box"/>${text(x+12,119,label,'math')}</a>`);
}
parts.push(text(24,175,'Original source lambda','label'), text(650,175,'Derived lambda with captured inputs','label'));
for (const [index, template] of templates.entries()) {
  const y = 193 + index * 139, link = sourceLink(template.bindingKey), plan = candidate.templates[index];
  parts.push(`<a href="${link}" tabindex="0" aria-label="Inspect original lambda ${index+1}"><rect x="24" y="${y}" width="530" height="115" class="box"/>${text(38,y+26,'F'+(index+1)+' · original port '+candidate.bindings.find(row=>row.key===template.bindingKey).port.call+':5','label')}`);
  // The third formula uses the explicitly declared C alias.
  const sourceLine = index === 2 ? 'λ x : ℝ, 2 · (x · √C) ≤ |T₁(J,p)| + |T₂(J,p)|' : template.source;
  parts.push(text(38,y+67,sourceLine,'formula'), '</a>');
  parts.push(`<path data-edge="${index}" d="M565 ${y+61} H632" class="rewrite" marker-end="url(#arrow)"/>`);
  edges.push({relation:plan.relation, template:index, from:{component:'original',root:template.originalRoot}, to:{component:'rewritten',root:template.computedRoot}, groups:plan.usedGroups});
  const rightLine = index === 2 ? 'λ x : ℝ, 2 · (x · √C) ≤ a + b' : template.computed;
  parts.push(`<a href="${sourceLink(template.bindingKey)}" tabindex="0" aria-label="Inspect source of reconstructed lambda ${index+1}"><rect x="650" y="${y}" width="460" height="115" class="box derived"/>${text(664,y+26,'F'+(index+1)+' := source-template definition','label')}${text(664,y+67,rightLine,'formula')}${text(664,y+97,'Recovery at original a,b gives F'+(index+1)+'.','caption')}</a>`);
}
parts.push(text(24,647,'C := z(J,p) · (1 − z(J,p)) · Dz(J,p). Type and instance arguments remain in the native record.','caption'));
parts.push(text(24,680,'A dependent definition also changes declaration order','label'));
parts.push(`<a href="${sourceLink('atlasRegionInput.22')}" tabindex="0" aria-label="Inspect original port 77:4"><rect x="24" y="697" width="530" height="86" class="box"/>${text(38,724,'Original port order remains 77:4 before 78:3.','formula')}${text(38,756,'The reconstructed value at 77:4 references input 78:3.','caption')}</a>`);
parts.push(`<a href="${sourceLink('atlasRegionInput.33')}" tabindex="0" aria-label="Inspect original port 78:3"><rect x="650" y="697" width="460" height="86" class="box derived"/>${text(664,724,'Declaration: input 78:3 before definition 77:4.','formula')}${text(664,756,'Check domain and value dependencies; refuse cycles.','caption')}</a>`);
parts.push(text(24,824,'Dashed arrows: derived constructor rewrites, not original proof-use wires. Layout has no metric.','caption'));
parts.push(text(24,853,'Links open original compiled occurrences. This policy is not yet in the interactive function selector.','caption'));
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1140 880" role="group" aria-labelledby="title desc"><title id="title">Source-lambda reconstruction and dependent declaration order</title><desc id="desc">Three original Riccati lambdas are reconstructed by replacing two captured source values with independent inputs a and b. Complete original functions recover under specialization. A later input must precede an earlier port's derived definition in the declaration order, while original source port order remains intact. Ten keyboard links open original compiled expressions. Rewrites are derived syntax relations, not source-use edges.</desc><style>svg{--paper:#fff;--ink:#202124;--muted:#535d68;--line:#697785;--accent:#285a86;--pale:#f2f5f8;background:var(--paper)}@media(prefers-color-scheme:dark){svg{--paper:#191b1e;--ink:#eceff2;--muted:#b7c1ca;--line:#9aa9b7;--accent:#9bc8ef;--pale:#252a30}}text{fill:var(--ink)}.title{font:26px Georgia,serif}.math{font:21px Georgia,serif}.formula{font:18px Georgia,serif}.label{font:16px Arial,sans-serif}.caption{font:15px Arial,sans-serif;fill:var(--muted)}.box{fill:var(--pale);stroke:var(--line);stroke-width:1.4}.derived{stroke:var(--accent);stroke-dasharray:4 3}.rewrite{fill:none;stroke:var(--accent);stroke-width:1.8;stroke-dasharray:4 4}a:focus .box,a:hover .box{stroke:var(--accent);stroke-width:3}a:focus{outline:2px solid var(--accent)}</style><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill="var(--accent)"/></marker></defs>${parts.join('\n')}</svg>\n`;
const report = {format:'ProofAtlasSourceTemplateFigure/1', status:'PASS', source:profile.source, nativeSha256:nativeHash, nativeCaseSha256:caseHash,
  templates, permutation:{cause:permutation.cause, moved, originalOrder:permutation.old, declarationOrder:permutation.new}, links, edges,
  svgSha256:sha(Buffer.from(svg)), producerSha256:sha(fs.readFileSync(__filename)),
  scope:'Three exact source/reconstructed lambda formulas with checked literal Real operator, numeral and instance aliases; type/instance fields retain native node identities. Three dashed relations are derived source-pattern rewrites, not original source-use edges. Original port order and the explicit declaration permutation are separate. Ten source links do not invent support for new computed fields in the old reader. No comprehension or general higher-order solving claim.'};
if (process.argv.includes('--check')) { assert.equal(fs.readFileSync(base+'source-lambdas.svg','utf8'),svg); assert.deepEqual(read('figure'),report); }
else { fs.writeFileSync(base+'source-lambdas.svg',svg); fs.writeFileSync(base+'figure.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0})); }
console.log(JSON.stringify({status:'PASS',templates:templates.length,sourceLinks:links.length,rewrites:edges.length,reorderedDeclarations:moved.length}));
