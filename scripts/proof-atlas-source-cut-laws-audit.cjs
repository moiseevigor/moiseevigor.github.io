/* Independent finite shape/path comparison; it does not verify theorem proof terms. */
'use strict';
const assert=require('assert/strict');
const ports={bvar:[],fvar:[],mvar:[],sort:[],const:[],app:['fn','arg'],lam:['domain','body'],forallE:['domain','body'],letE:['type','value','body'],lit:[],mdata:['expr'],proj:['struct']};
const laws=['partition','reflexive','retained_monotone','hidden_antitone','visible_monotone','exact_transfer'].map(n=>'ProofAtlas.SourceCut.'+n);
module.exports=function audit(data){
 assert.equal(data.format,'ProofAtlasSourceCutLaws/1');assert.equal(data.leanVersion,'4.33.1');assert.deepEqual(data.theorems.map(t=>t.name),laws);
 for(const t of data.theorems){assert(t.axioms.every(a=>['propext','Quot.sound'].includes(a)));for(const k of ['kernelType','kernelProof','kernelExpectedTypeConversion'])assert.equal(t[k],'PASS');assert.equal(typeof t.type,'string');assert(t.type.length>0);}
 assert.equal(data.cases.length,19);const kinds=new Set();let cuts=0,visibilityChecks=0,totalPaths=0;
 for(const [i,c]of data.cases.entries()){
  assert.equal(c.proofTypingClaim,false);if(i<12)assert.equal(c.label,c.source.kind);const paths=[];
  function walk(n,path){assert(Object.hasOwn(ports,n.kind));kinds.add(n.kind);assert.equal(n.children.length,ports[n.kind].length);assert(paths.length<4096);paths.push(path);n.children.forEach((v,slot)=>walk(v,[...path,slot]));}walk(c.source,[]);assert.equal(c.occurrences,paths.length);totalPaths+=paths.length;
  assert.equal(c.rows.length,5);let previous=[];
  for(const [depth,row]of c.rows.entries()){
   assert.equal(row.depth,depth);const expected=paths.filter(p=>p.length<depth);assert.deepEqual(row.paths,expected);assert.equal(row.retained,expected.length);assert.equal(row.hidden,paths.length-expected.length);assert.equal(row.hidden+row.retained,c.occurrences);
   const index=new Set(expected.map(p=>p.join('.')));assert(previous.every(p=>index.has(p.join('.'))));previous=expected;
   const tests=[...paths,[99],[0,99],[2,99]];assert.deepEqual(row.visibility.map(t=>t.path),tests);
   for(const t of row.visibility){assert.equal(t.visible,index.has(t.path.join('.')));visibilityChecks++;}cuts++;
  }
 }
 assert.deepEqual([...kinds].sort(),Object.keys(ports).sort());return{status:'PASS',kernelTheorems:6,syntacticCases:data.cases.length,constructorKinds:kinds.size,cuts,visibilityChecks,totalPaths,scope:'Finite source-shape and path comparison for the formal cut model. Native theorem checks are separate. These synthetic expressions have no claimed proof typing; the browser selector is not thereby verified.'};
};
