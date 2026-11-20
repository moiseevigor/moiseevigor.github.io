/* Verify saved finite reports and current source identities. Fresh execution
 * is a separate step; this checker never substitutes metadata for a test run. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const record=process.argv[2]==='--record',folder=record?path.resolve(process.argv[3]):__dirname;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const reports={};
for(const name of ['model','corpus','browser']){
  const bytes=record?fs.readFileSync(path.join(folder,name+'.json')):z.gunzipSync(fs.readFileSync(path.join(folder,name+'.json.gz')));
  const r=JSON.parse(bytes);assert.equal(r.status,'PASS');
  for(const[file,digest]of Object.entries(r.files))assert.equal(sha(fs.readFileSync(file)),digest,file);
  reports[name]=r;
  if(record)fs.writeFileSync(path.join(__dirname,name+'.json.gz'),z.gzipSync(bytes));
}
const {model,corpus,browser}=reports;
assert.equal(model.roots,27);assert.equal(model.nativeProfiles.length,3);
assert.equal(model.shadowedBinderOccurrencesRemainDistinct,true);
assert.equal(model.constructorControls.length,12);assert.equal(model.unresolvedInterfaceMarkedUnavailable,true);
for(const label of ['mixed-table-cut','portal-source-path','portal-count','missing-residual',
  'duplicate-residual','ancestor-accounting','foreign-family','invalid-use-page',
  'concurrent-operation','dispose-pending','cancelled-operation','foreign-source-context'])
  assert(model.refusals.includes(label),label);
assert.equal(corpus.nativeProfiles.length,42);assert.equal(corpus.roots,126);
assert.equal(corpus.availableFamilies,48);assert.equal(corpus.roundTrips,48);
assert.deepEqual(corpus.unavailableRoots,[]);
assert.equal(browser.typeRoots,9);assert.equal(browser.axeAudits,16);
assert.equal(browser.libraryTypeRoots,3);assert.equal(browser.libraryComputedSourcePreserved,1);
assert.equal(browser.libraryBinderJumps,1);
assert.equal(browser.useSelections,4);assert.equal(browser.relativeSelections,4);
assert.equal(browser.binderSelections,3);assert.equal(browser.focusSelections,2);
assert.equal(browser.sourceOverrides,false);assert.equal(browser.dataOverrides,false);
assert.equal(browser.publicDeployment,false);
for(const r of Object.values(reports))assert.equal(r.wholeArchiveRequests,0);
const sources=['.github/workflows/proof-atlas-scope-comparison.yml','.github/workflows/proof-atlas-browser.yml',
  'public/js/proof-atlas-type-sharing.js','public/js/proof-atlas-type-sharing-view.js',
  'public/css/proof-atlas-type-sharing.css','public/js/proof-atlas-application-ports.js',
  'public/js/proof-atlas-application-type-pages.js','public/js/proof-atlas-application-port-view.js',
  'public/js/proof-atlas-application-port-manual.js','public/js/proof-atlas-input-type-bridge-view.js',
  'public/css/proof-atlas-input-type-bridge.css','public/js/proof-atlas-type-notation.js',
  'public/js/proof-atlas-paged-notation.js','public/js/proof-atlas-notation-refinement.js',
  'public/js/proof-atlas-source-cut-union.js','public/data/proof-atlas/formal-support-controls-manifest.js',
  'research/proof-atlas/formal-support/evidence.json.gz',
  'research/proof-atlas/type-sharing/figures/shared-type.png',
  'research/proof-atlas/type-sharing/figures/variable-use.png',
  'research/proof-atlas/type-sharing/figures/riccati-type.png'];
for(const name of fs.readdirSync(__dirname))if(name!=='evidence.json.gz'&&/\.(cjs|md|gz)$/.test(name))sources.push('research/proof-atlas/type-sharing/'+name);
const evidence={format:'ProofAtlasTypeSharingEvidence/1',status:'PASS',
  files:Object.fromEntries([...new Set(sources)].sort().map(f=>[f,sha(fs.readFileSync(f))])),
  nativeControlRoots:27,selectedCorpusProfiles:42,selectedCorpusRoots:126,
  selectedCorpusAvailableFamilies:48,browserControlTypeRoots:9,browserRiccatiTypeRoots:3,
  browserRiccatiBinderJumps:1,axeAudits:16,
  nativeTypingQueriesAdded:0,generalJavaScriptRefinementProved:false,
  totalHeapBoundProved:false,semanticCompressionMeasured:false,humanComprehensionMeasured:false,
  publicDeployment:false,privateMathematicalSourcesPublished:false,
  scope:'Reversible cut-local syntax sharing, with exact per-use lexical assignments and original native owners. Explicit finite sample; not every recorded input or a global use inventory.'};
const output=path.join(__dirname,'evidence.json.gz');
if(record)fs.writeFileSync(output,z.gzipSync(Buffer.from(JSON.stringify(evidence,null,2)+'\n')));
else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(output))),evidence);
console.log(JSON.stringify({status:'PASS',nativeControlRoots:27,corpusRoots:126,
  corpusAvailableFamilies:48,browserTypeRoots:12,axeAudits:16,files:sources.length}));
