'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
process.chdir(path.resolve(__dirname, '../../..'));
const A = require('../../../public/js/proof-atlas-library-data'), S = require('../../../public/js/proof-atlas-source-applications'), C = require('../../../public/js/proof-atlas-application-collar'), P = require('../../../public/js/proof-atlas-source-pages'), N = require('../../../public/js/proof-atlas-type-notation');
const base = 'research/proof-atlas/source-applications/', h = {}, sha = b => crypto.createHash('sha256').update(b).digest('hex'), copy = x => JSON.parse(JSON.stringify(x));
for (const name of ['library-manifest', 'goedel-sample-manifest', 'source-pages-manifest', 'application-ports-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), { window: h });
const pages = h.PROOF_ATLAS_SOURCE_PAGES.records, read = file => JSON.parse(z.gunzipSync(fs.readFileSync('.' + file)));
const inputs = h.PROOF_ATLAS_LIBRARY.editions.flatMap(e => e.declarations.map(record => ({ edition: e.id, record })));
inputs.push(...h.PROOF_ATLAS_AI_SAMPLE.edition.declarations.map(record => ({ edition: h.PROOF_ATLAS_AI_SAMPLE.edition.id, record })));
for (const d of pages) if (!inputs.some(x => x.edition === d.edition && x.record.name === d.name)) inputs.push({ edition: d.edition, record: read(d.file).record });
const files = [base + 'check.cjs', 'public/js/proof-atlas-source-applications.js', 'public/js/proof-atlas-application-collar.js', 'public/js/proof-atlas-library-data.js', 'public/js/proof-atlas-source-pages.js', 'public/js/proof-atlas-type-notation.js', 'public/js/proof-atlas-paged-notation.js', 'public/js/proof-atlas-notation-refinement.js', 'public/data/proof-atlas/library-manifest.js', 'public/data/proof-atlas/goedel-sample-manifest.js', 'public/data/proof-atlas/source-pages-manifest.js', 'public/data/proof-atlas/application-ports-manifest.js'];
const fingerprint = () => Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))])), initial = fingerprint();
const out = { format: 'ProofAtlasSourceApplicationCheck/1', status: 'RUNNING', packets: 0, storedNodes: 0, storedApplications: 0, originalStoredApplications: 0, ruleOnlyStoredNodes: 0, ruleOnlyStoredApplications: 0, unsupportedRuleRoots: 0, spinesOver64: 0, maxStoredArity: 0, maxOriginalPathDepth: 0, originalRootsBeyondPathBound: 0, alternateScopePaths: 0, deepestOriginalPaths: 0, models: 0, pages: 0, ports: 0, lexicalReferences: 0, repeatedRows: 0, pathRefusals: 0, pagedPackets: 0, pagedModels: 0, aiPagedPackets: 0, previewScenes: 0, peakMetadataBytes: 0, peakModelReads: 0, peakSourceCachedNodes: 0, peakNotationRows: 0, refusals: 0, editions: {}, inventory: [], browserCases: [] };
const binds = (k, slot) => (k === 6 || k === 7) && slot === 1 || k === 8 && slot === 2;
const fetcher = async file => { assert(file.startsWith('/public/data/proof-atlas/source-pages/')); return new Response(fs.readFileSync('.' + file)); };
async function refuse(task, pattern) { await assert.rejects(task, pattern); out.refusals++; }
function compare(g, model) {
 assert.equal(A.walk(g, model.root.route), model.root.node); assert.equal(model.typing, 'not-queried'); assert(model.sourceOnly);
 let current = model.ports[0].address.node;
 for (const port of model.ports) {
  assert.equal(A.walk(g, port.address.route), port.address.node); assert.equal(port.expanded, g.expanded[port.address.node]);
  if (port.slot) { const wrapper = model.wrappers.at(-port.slot); assert.equal(g.kind[wrapper.node], 5); assert.deepEqual(g.children[wrapper.node], [current, port.address.node]); current = wrapper.node; }
  if (port.kind === 'bvar') { const target = A.binding(g, port.address.route); assert(target); assert.equal(port.reference.target.node, target.node); assert.deepEqual(port.reference.target.route, target.route); out.lexicalReferences++; }
  else assert.equal(port.reference, null);
  assert.equal(port.role, undefined); assert.equal(port.inputType, undefined); out.ports++;
 }
 assert.equal(current, model.root.node);
 for (const wrapper of model.wrappers) assert.equal(A.walk(g, wrapper.route), wrapper.node);
 for (let offset = 0; offset < Math.max(1, model.arguments); offset += 4) { const page = C.page(model, offset); assert(page.vertices <= 6); assert.equal(BigInt(page.retained) + BigInt(page.hidden), BigInt(g.expanded[model.root.node])); out.pages++; }
 const unique = new Set(model.ports.map(p => p.address.node)); out.repeatedRows += model.ports.length - unique.size;
 out.peakMetadataBytes = Math.max(out.peakMetadataBytes, model.metadataBytes); out.peakModelReads = Math.max(out.peakModelReads, model.rowReads); out.models++;
}
function expectedNotation(g, record, at) {
 const owner = { namespace: 'source-expression', name: record.name, indexSha256: record.indexSha256, sourceSha256: record.sourceSha256, typeRoot: at.route.root }, origin = (node, slots) => ({ ...owner, node, slots }), context = [];
 let id = g.roots[at.route.root];
 for (const [depth, slot] of at.route.slots.entries()) { if (binds(g.kind[id], slot)) context.push({ name: g.payloads[id].binderName || g.payloads[id].declName || '_', address: origin(id, at.route.slots.slice(0, depth)) }); id = g.children[id][slot]; }
 return N.scene(g, id, { format: 'ProofAtlasNotationCatalog/1', entries: [] }, { slots: at.route.slots, context, address: origin });
}
async function main() {
 for (const { edition, record } of inputs) {
  const bytes = z.gunzipSync(fs.readFileSync('.' + record.indexFile)); assert.equal(sha(bytes), record.indexSha256); const g = JSON.parse(bytes); A.validateIndex(g, record);
  const parent=new Int32Array(g.kind.length).fill(-2),slots=new Uint8Array(g.kind.length),roots=new Uint16Array(g.kind.length),queue=[];
  const chosen=new Set();for(const[root,id]of g.roots.entries())if(['root.type','root.value'].includes(g.declaration.rootPaths[root])){if(parent[id]===-2){parent[id]=-1;roots[id]=root;queue.push(id);}chosen.add(id);}else out.unsupportedRuleRoots++;
  const bodyRoot=g.declaration.rootPaths.indexOf('root.value');if(bodyRoot>=0){let id=g.roots[bodyRoot];while([6,7].includes(g.kind[id]))id=g.children[id][1];if(g.kind[id]===8)id=g.children[id][1];chosen.add(id);}
  for(let i=0;i<queue.length;i++){const id=queue[i];g.children[id].forEach((c,slot)=>{if(parent[c]===-2){parent[c]=id;slots[c]=slot;roots[c]=roots[id];queue.push(c);}});}
  const routes={route(id){const path=[];while(parent[id]>=0){path.push(slots[id]);id=parent[id];}return{root:roots[id],slots:path.reverse()};}},arities=new Uint32Array(g.kind.length),heights=new Uint32Array(g.kind.length),byKind=new Set();let maxApp=null;
  for (let id = 0; id < g.kind.length; id++) {
   heights[id]=g.children[id].length?1+Math.max(...g.children[id].map(c=>heights[c])):0;
   if(parent[id]===-2){out.ruleOnlyStoredNodes++;if(g.kind[id]===5)out.ruleOnlyStoredApplications++;}
   else if (!byKind.has(g.kind[id])) { chosen.add(id); byKind.add(g.kind[id]); }
   if (g.kind[id] === 5) { arities[id] = arities[g.children[id][0]] + 1; out.storedApplications++; if (arities[id] > 64) out.spinesOver64++; if(parent[id]!==-2){out.originalStoredApplications++;if (maxApp === null || arities[id] > arities[maxApp]) maxApp = id;} out.maxStoredArity = Math.max(out.maxStoredArity, arities[id]); }
  }
  if (maxApp !== null) chosen.add(maxApp);
  for(const[root,id]of g.roots.entries())if(['root.type','root.value'].includes(g.declaration.rootPaths[root])){out.maxOriginalPathDepth=Math.max(out.maxOriginalPathDepth,heights[id]);out.originalRootsBeyondPathBound+=Number(heights[id]>512);}
  // One stored variable row can occur under different actual binders. Probe
  // alternate original paths, not just the DAG's chosen representative path.
  const firstUses=new Map(),alternate=[];
  for(let parentId=0;parentId<g.kind.length&&alternate.length<4;parentId++)if(parent[parentId]!==-2)for(const[slot,id]of g.children[parentId].entries())if(g.kind[id]===0){
   const prefix=routes.route(parentId),route={root:prefix.root,slots:[...prefix.slots,slot]};if(route.slots.length>512)continue;const target=A.binding(g,route);assert(target);const previous=firstUses.get(id);if(previous&&JSON.stringify(previous.target)!==JSON.stringify(target)){alternate.push({id,route});out.alternateScopePaths++;}else if(!previous)firstUses.set(id,{target,route});if(alternate.length===4)break;
  }

  const deepest=[];for(const[root,start]of g.roots.entries())if(['root.type','root.value'].includes(g.declaration.rootPaths[root])){let id=start;const slots=[];while(g.children[id].length){const children=g.children[id],slot=children.reduce((best,c,j)=>heights[c]>heights[children[best]]?j:best,0);slots.push(slot);id=children[slot];}deepest.push({id,route:{root,slots}});out.deepestOriginalPaths++;}
  const owner = S.complete(g, record), descriptor = pages.find(d => d.edition === edition && d.name === record.name), cursor = descriptor ? await P.open(descriptor, record, { fetcher, pageLimit: 1, indexLimit: 2 }) : null, paged = cursor ? S.paged(cursor) : null;
  for(const[root]of g.roots.entries())if(!['root.type','root.value'].includes(g.declaration.rootPaths[root]))await refuse(()=>S.read(owner,{root,slots:[]}),/original source route/);
  const browserCandidates=[];let preview = false;
  for (const {id,route} of new Map([...[...chosen].map(id=>({id,route:routes.route(id)})),...alternate,...deepest].map(x=>[JSON.stringify(x.route),x])).values()) {
   if (route.slots.length > 512 || route.slots.length + arities[id] > 512) { await refuse(() => S.read(owner, route), /route\/bound|path bound/); out.pathRefusals++; continue; }
   if (arities[id] > 64) { await refuse(() => S.read(owner, route), /spine exceeds/); continue; }
   let model;try{model=await S.read(owner,route);}catch(error){error.message+=' ['+edition+' '+record.name+' root '+g.declaration.rootPaths[route.root]+' node '+id+']';throw error;}compare(g,model);
   if (paged) {
    const other = await S.read(paged, route); for (const key of ['root', 'wrappers', 'ports', 'arguments', 'expanded', 'originalContext', 'application', 'rowReads']) assert.deepEqual(other[key], model[key]); out.pagedModels++;
    const composite = model.ports.find(p => ['app', 'mdata', 'proj', 'lam', 'forallE', 'letE'].includes(p.kind));
    if (!preview && composite) { const notation = await S.openNotation(paged, composite.address); try { assert.deepEqual(notation.scene, expectedNotation(g, record, composite.address)); assert(notation.scene.stats.nodes <= 48); out.peakNotationRows = Math.max(out.peakNotationRows, notation.state().peakRows); out.previewScenes++; } finally { notation.dispose(); } preview = true; }
    if(model.application&&model.arguments>1)browserCandidates.push({edition,record:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},route,node:id,arguments:model.arguments});
   }
  }
  if(paged){const typed=h.PROOF_ATLAS_APPLICATION_PORTS.records.find(p=>p.source.edition===edition&&p.record.name===record.name),eligible=browserCandidates.filter(c=>!typed?.calls.some(x=>JSON.stringify(x.anchor.route)===JSON.stringify(c.route))),chosen=eligible.find(c=>c.route.root===bodyRoot)||eligible[0];assert(chosen,record.name);out.browserCases.push(chosen);}
  const cancelled = new AbortController(); cancelled.abort(Error('test cancellation')); await refuse(() => S.read(owner, { root: 0, slots: [] }, { signal: cancelled.signal }), /cancellation/);
  owner.dispose(); await refuse(() => S.read(owner, { root: 0, slots: [] }), /retired/);
  if (cursor) { const state = cursor.state(); assert(state.peakCachedNodes <= 256 && state.indexPages <= 2); out.peakSourceCachedNodes = Math.max(out.peakSourceCachedNodes, state.peakCachedNodes); paged.dispose(); cursor.dispose(); out.pagedPackets++; out.aiPagedPackets += Number(edition === 'goedel-sample-4331'); }
  out.inventory.push({ edition, name: record.name, indexSha256: record.indexSha256, sourceSha256: record.sourceSha256, nodes: record.uniqueNodes }); out.editions[edition] = (out.editions[edition] || 0) + 1; out.packets++; out.storedNodes += g.kind.length;
 }
 assert.equal(out.pagedPackets, 35); assert.equal(out.aiPagedPackets, 20); assert.equal(out.packets, 2127); assert(out.lexicalReferences && out.repeatedRows && out.previewScenes);
 await refuse(() => S.read({}, { root: 0, slots: [] }), /foreign reader/); assert.throws(() => S.paged({}), /foreign source cursor/); out.refusals++;
 assert.deepEqual(fingerprint(), initial); out.files = initial; out.status = 'PASS';
 out.scope = 'Authenticated full stored-node inventories; bounded representative models per present constructor plus original roots, leading proof-body calls and largest stored application, plus alternate stored-variable scopes and a longest original path from each type/body root, with exact scope/reassembly checks. All 35 paged packets including all 20 attributed AI-source samples have complete/paged model comparisons. This does not enumerate every expanded occurrence path or establish inferred types, semantic compression or comprehension.';
 const file = base + 'model-check.json.gz'; if (process.argv.includes('--check')) assert.deepEqual(read('/' + file), out); else fs.writeFileSync(file, z.gzipSync(Buffer.from(JSON.stringify(out, null, 2) + '\n'), { mtime: 0 }));
 console.log(JSON.stringify({ ...out, inventory: undefined, browserCases: undefined, files: undefined }));
}
main().catch(error => { console.error(error); process.exit(1); });
