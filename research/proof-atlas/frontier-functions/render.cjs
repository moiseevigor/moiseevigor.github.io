'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});try{
 const page=await browser.newPage({viewport:{width:1200,height:790}}),svg=fs.readFileSync(base+'frontier-functions.svg','utf8');
 await page.setContent('<!doctype html><html lang="en"><title>Typed source frontiers</title><body style="margin:0"><main>'+svg+'</main></body></html>');
 const overflow=await page.locator('svg text').evaluateAll(rows=>rows.map(e=>{const b=e.getBBox();return{text:e.textContent,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height};}).filter(b=>b.x<0||b.y<0||b.right>1200||b.bottom>790));assert.deepEqual(overflow,[]);
 await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('svg'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
 await page.locator('svg').screenshot({path:base+'frontier-functions.png'});
 const report={format:'ProofAtlasFrontierPresentation/1',status:'PASS',svgSha256:sha(Buffer.from(svg)),pngSha256:sha(fs.readFileSync(base+'frontier-functions.png')),textOverflow:0,accessibilityViolations:0,files:{[base+'render.cjs']:sha(fs.readFileSync(base+'render.cjs'))},scope:'Static data-bound notation schematic, with SVG accessible name/description and text bounds. No interactive application or comprehension evaluation.'};
 fs.writeFileSync(base+'presentation-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e.stack);process.exitCode=1;});
