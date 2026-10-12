/* Verify exact occurrence coverage and conservative resugaring against the
   released payloads; never infer theorem status from mere application shape. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const context={window:{}};
const root=path.resolve(__dirname,'..');
for(const [key,file]of [['structure','public/data/proof-atlas/crossing-structure.js'],['terms',process.env.ATLAS_TERM_DATA||'public/data/proof-atlas/crossing-terms.js']])vm.runInNewContext(fs.readFileSync(path.isAbsolute(file)?file:path.join(root,file),'utf8'),context);
const S=context.window.PROOF_ATLAS_DATA,T=context.window.PROOF_ATLAS_TERMS;
const D=require('../public/js/proof-atlas-term-reader.js').create(S,T);
assert(D.complete);assert.equal(T.source.coregirSha256,'43fbca52cefe9158d5859de6c8ef0e7f379ffce18015e3577d1a3a168bdfbfc8');
assert.equal(D.rows(1852).length,105);
assert.equal(D.format(1852),'(C.branch σ p = (ψ + (((2 : Real) * C.K) * (↑n : Real))))');
assert(D.describe(1852).includes('equality proposition'));
assert(D.context(1852).some(x=>x.name==='hp'&&x.type==='(p ∈ [C.lo, C.hi])'),'Membership argument order is reversed');
assert(D.context(1852).some(x=>x.name==='n'&&x.type==='Int'));
assert(D.format(1852,false).includes('Eq.{(0 + 1)} Real'));
assert(D.format(1852,false).includes('HAdd.hAdd'));
assert(D.format(1852,false).includes('bvar 0 [n @#1850]'));
assert(!D.context(205).some(x=>x.id===205),'Binder extends into its own domain');
assert(D.context(206).every(x=>x.id!==205),'Binder domain has the new parameter in scope');
assert.equal(D.path(1852),'root.value.body.body.arg.body.body.arg.body.body.fn.fn.fn.arg.body.arg.arg.body');
for(let i=0;i<S.parent.length;i++){
 assert.equal(D.rows(i).length,S.size[i],'Incomplete subtree #'+i);
 const rows=D.rows(i);assert.equal(rows[0].id,i);assert.equal(rows.at(-1).id,i+S.size[i]-1);
 assert(D.format(i).length>0);assert(D.format(i,false).length>0);
 if(D.kind(i)==='bvar')assert(D.format(i,false).includes('bvar '));
}
assert.equal(D.rows(203).length,7085);
for(let i=0;i<S.parent.length;i++)if(D.kind(i)==='app'){const sp=D.spine(i);if(D.constant(sp.head)==='Exists.casesOn'&&sp.args.length===1)assert(D.describe(i).startsWith('Partial application'),'Partial eliminator mistaken for a completed proof step');}
const fallback=require('../public/js/proof-atlas-term-reader.js').create(S,null);
assert.equal(fallback.complete,false);assert.equal(fallback.rows(1852).length,105);
assert.throws(()=>D.format(-1),RangeError);assert.throws(()=>D.rows(7288),RangeError);
// Independent tiny cases: partial application must not be presented as a
// completed proposition. Missing payloads must remain explicitly unknown.
const simple={parent:[-1,0,1,1,0],kinds:['app','const'],kind:'00111',roots:[0],binder:[],deps:[],size:[5,3,1,1,1]};
const terms={payloads:[{}, {},{name:'Eq',levels:[]},{name:'Nat',levels:[]},{name:'Nat.zero',levels:[]}],rootPaths:['root.type']};
const tiny=require('../public/js/proof-atlas-term-reader.js').create(simple,terms);
assert.equal(tiny.format(0),'(Eq Nat Nat.zero)','Partial Eq application was falsely rendered as equality');
console.log(JSON.stringify({status:'PASS',occurrences:7288,screenshotSubtree:105,proofSubtree:7085,scope:'All subtree lengths, payloads, indices, paths and readable/exact formatting; no kernel checking in JS'}));
