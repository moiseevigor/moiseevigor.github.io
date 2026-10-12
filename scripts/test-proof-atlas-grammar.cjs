/* Actual Chromium validation of all 12 Lean.Expr visual constructors. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shots=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-browser';
  fs.mkdirSync(shots,{recursive:true});
  try{
    await page.goto('http://127.0.0.1:8833/projects/proof-atlas/grammar/index.html',{waitUntil:'networkidle'});
    const tags=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
    for(const t of tags){
      const b=page.locator('[data-tag="'+t+'"]');
      if(await b.count()!==1)throw Error('Missing constructor '+t);
      await b.click();
      const title=await page.locator('#pa-g-name').textContent();
      if(!title.startsWith(t+' — '))throw Error('Wrong selected constructor '+t+': '+title);
      if(await page.locator('#pa-grammar-svg rect').count()<2)throw Error('Missing graphical nodes for '+t);
      const statement=await page.locator('#pa-g-example').textContent();
      if(!statement.trim())throw Error('Missing code example for '+t);
      const description=await page.locator('#pa-g-description').textContent();
      if(description.length<40)throw Error('Missing meaningful explanation for '+t);
      const pressed=await b.getAttribute('aria-pressed');
      if(pressed!=='true')throw Error('Broken keyboard-friendly selection state '+t);
    }
    await page.locator('[data-tag="lam"]').click();
    await page.screenshot({path:path.join(shots,'lean-constructor-lambda.png'),fullPage:true});
    await page.setViewportSize({width:390,height:850});
    await page.locator('[data-tag="proj"]').click();
    const dimension=await page.evaluate(()=>({
      body:document.documentElement.scrollWidth,available:document.documentElement.clientWidth,
      diagram:document.querySelector('#pa-grammar-svg').getBoundingClientRect().width
    }));
    if(dimension.body>dimension.available+4)throw Error('Mobile page horizontal overflow '+JSON.stringify(dimension));
    await page.screenshot({path:path.join(shots,'lean-constructor-mobile.png'),fullPage:true});
    if(errors.length)throw Error(errors.join('; '));
    console.log(JSON.stringify({status:'PASS',constructors:tags.length,mobileWidth:dimension.available,mobileScrollWidth:dimension.body}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
