const { chromium } = require('playwright');
(async () => {
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1500,height:900}});
  page.on('pageerror',e=>console.log('PAGE ERROR',e.message));
  try {
    await page.goto('http://127.0.0.1:8833/projects/proof-atlas/app/index.html',{waitUntil:'networkidle'});
    const out=await page.evaluate(()=>{
      const D=window.PROOF_ATLAS_DECLARATIONS, node=D?.nodes?.find(n=>n.short==='crossing');
      const ui=document.querySelector('.pa-lean-statement');
      return {present:!!D,nodes:D?.nodes?.length,source:node?.statement, rendered:ui?.textContent,
        childCount:document.querySelector('#pa-inspector-actions')?.children?.length,
        mode:document.querySelector('#pa-view-title')?.textContent};
    });
    console.log('DIAGNOSTICS', JSON.stringify(out));
    await page.screenshot({path:'/tmp/proof-atlas-named-diagnostics.png'});
    if(out.nodes!==26 || out.source!==out.rendered)throw Error('Named declaration mismatch');
    console.log('NAMED PROOF MAP PASS');
  }finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
