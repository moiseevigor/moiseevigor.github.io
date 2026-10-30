'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha}=require('../method-context/catalogue.cjs'),base='research/proof-atlas/region-result-closures/';let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const p=await browser.newPage({viewport:{width:1040,height:750}});await p.setContent('<!doctype html><html lang="en"><head><title>Typed output tuples</title><style>body{margin:0;background:#faf9f6}</style></head><body>'+fs.readFileSync(base+'output-tuples.svg','utf8')+'</body></html>');
 const errors=await p.evaluate(()=>{const vb=document.querySelector('svg').viewBox.baseVal;return [...document.querySelectorAll('text')].map(n=>({text:n.textContent,box:n.getBBox()})).filter(({box:b})=>b.x<0||b.y<0||b.x+b.width>vb.width||b.y+b.height>vb.height).map(x=>x.text);});
 assert.deepEqual(errors,[]);assert(await p.locator('svg[role="img"]').count());assert.match(await p.locator('svg>title').textContent(),/Typed output tuples/);
 await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 const violations=await p.evaluate(async()=>(await axe.run(document.querySelector('svg'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);
 const file=base+'output-tuples.png';await p.screenshot({path:file,fullPage:true});
 const report={status:'PASS',svgSha256:sha(fs.readFileSync(base+'output-tuples.svg')),pngSha256:sha(fs.readFileSync(file)),checkerSha256:sha(fs.readFileSync(base+'render-figure.cjs')),clippedLabels:errors,accessibilityViolations:violations,scope:'Static scientific SVG rendered in an HTML wrapper in Chromium; label bounds and SVG accessible name checked. No interactive reader or comprehension measurement.'};
 fs.writeFileSync(base+'presentation-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e.stack);await browser?.close();process.exitCode=1;});
