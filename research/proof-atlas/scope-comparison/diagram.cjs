/* Authored syntax control. Figure labels come from its checked graph rows. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),C=require('./model.cjs'),K=require('./certificate.cjs');
const source={kind:[0,4,6,5],payloads:[{index:0},{name:'P',levels:[]},{binderName:'x',binderInfo:'default'},{}],children:[[],[],[1,0],[0,2]]};
const target={kind:[0,4,0,6,5],payloads:[{index:1},{name:'P',levels:[]},{index:0},{binderName:'x',binderInfo:'default'},{}],children:[[],[],[],[1,2],[0,3]]};
const result=C.compare(source,3,target,4,1,{includeCertificate:true});assert.equal(result.status,'same');K.check(source,3,target,4,1,result.certificate);
const leaves=result.certificate.rows.filter(row=>source.kind[row.left]===0);assert.deepEqual(leaves.map(row=>[row.left,row.right,row.minimum,row.maximum]),[[0,0,0,0],[0,2,1,1]]);
const font='font-family="system-ui, sans-serif"',mono='font-family="ui-monospace, monospace"';
function box(x,y,width,label){return`<rect x="${x}" y="${y}" width="${width}" height="44" rx="5" fill="#fff" stroke="#424c57" stroke-width="1.5"/><text x="${x+width/2}" y="${y+28}" text-anchor="middle" ${mono} font-size="18" fill="#18232f">${label}</text>`;}
function wire(d,label,x,y){return`<path d="${d}" fill="none" stroke="#53677a" stroke-width="2" marker-end="url(#arrow)"/><text x="${x}" y="${y}" ${font} font-size="17" fill="#334a60">${label}</text>`;}
const variable=(g,id)=>`e${id}: bvar ${g.payloads[id].index}`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 520" role="img" aria-labelledby="title description">
<title id="title">Uniform context extension preserves local binder references</title>
<desc id="description">One stored source variable e0 is reached directly at depth zero and through a lambda body at depth one. Extension by one maps the first occurrence to bvar one and preserves the second as bvar zero. The two paired rows retain different target rows and depth ranges; storage reuse does not identify occurrences.</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#53677a"/></marker></defs>
<rect width="1120" height="520" fill="#faf9f6"/>
<text x="36" y="35" ${font} font-size="22" font-weight="600" fill="#18232f">Same storage row, different scope paths</text>
<text x="36" y="65" ${font} font-size="17" fill="#424c57">Authored syntax control · uniform external-context extension +1 · no typing claim</text>
<path d="M555 90V340" stroke="#ccd0d5"/>
<text x="36" y="110" ${font} font-size="20" font-weight="600" fill="#18232f">Original graph</text>
<text x="590" y="110" ${font} font-size="20" font-weight="600" fill="#18232f">Lifted graph</text>
${wire('M190 170L125 285','fn · depth 0',36,218)}
${wire('M300 170L355 210','arg',327,190)}
${wire('M310 254Q230 280 190 290','body · +1 binder',210,269)}
${wire('M410 254L465 290','domain · +0',440,270)}
${box(155,126,180,'e3: app')}${box(280,210,160,'e2: lam')}${box(48,290,180,variable(source,0))}${box(430,290,100,'e1: P')}
${wire('M735 170L660 285','fn · depth 0',585,218)}
${wire('M845 170L900 210','arg',872,190)}
${wire('M855 254L820 285','body · +1',725,265)}
${wire('M955 254L1010 290','domain · +0',985,270)}
${box(700,126,180,'e4: app')}${box(825,210,160,'e3: lam')}${box(585,290,180,variable(target,0))}${box(785,290,180,variable(target,2))}${box(990,290,100,'e1: P')}
<text x="36" y="382" ${font} font-size="20" font-weight="600" fill="#18232f">Variable-pair certificates</text>
${leaves.map((row,index)=>`<text x="36" y="${419+index*36}" ${mono} font-size="18" fill="#18232f">source e${row.left} ↔ target e${row.right}    depths [${row.minimum}, ${row.maximum}]</text><text x="650" y="${419+index*36}" ${font} font-size="18" fill="#334a60">${index?'local reference · index unchanged':'external reference · index increases by 1'}</text>`).join('')}
<text x="36" y="495" ${font} font-size="17" fill="#424c57">A shared storage node does not merge occurrence paths or binder owners.</text></svg>\n`;
const data=JSON.stringify({format:'ProofAtlasScopeIllustration/1',source,sourceRoot:3,target,targetRoot:4,shift:1,result,mathematicalTyping:'not-asserted'},null,2)+'\n';
if(process.argv[2]==='--check'){
 assert.equal(fs.readFileSync(path.join(__dirname,'scope-sharing.svg'),'utf8'),svg);
 assert.equal(fs.readFileSync(path.join(__dirname,'scope-sharing.json'),'utf8'),data);
 assert.equal(z.gunzipSync(fs.readFileSync(path.join(__dirname,'scope-sharing.json.gz'))).toString(),data);
}else{
 const folder=process.argv[2]?path.resolve(process.argv[2]):__dirname;
 fs.writeFileSync(path.join(folder,'scope-sharing.svg'),svg);fs.writeFileSync(path.join(folder,'scope-sharing.json'),data);
 fs.writeFileSync(path.join(folder,'scope-sharing.json.gz'),z.gzipSync(data));
}
console.log(JSON.stringify({status:'PASS',pairedRows:result.pairs,variablePairs:leaves.length}));
