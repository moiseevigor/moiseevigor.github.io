/* Browser tests for actual selected terms, complete occurrence coverage,
   scope navigation and downloads. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833';
 const dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-subtree';fs.mkdirSync(dir,{recursive:true});
 try{
  await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
  await page.goto(base+'/projects/proof-atlas/app/#expr-1852');
  check(await page.evaluate(()=>window.ProofAtlasAPI.getSnapshot().selected)===1852,'Shared occurrence link failed');
  const select=async id=>{await page.locator('#pa-search').fill(String(id));await page.locator('#pa-find').click();};
  await select(1852);
  check(await page.locator('[data-pa-reader-tab="language"]').count()===0,'Tutorial tab still present');
  check(await page.locator('.pr-rule-svg').count()===0,'Generic constructor illustration still present');
  check((await page.locator('#pa-subtree-text').textContent()).includes('C.branch σ p ='),'Actual selected equality not decoded');
  check((await page.locator('#pa-reader-content').textContent()).includes('105 occurrences'),'Wrong exact subtree size');
  await page.locator('.pr-context').filter({hasText:'Variables and assumptions'}).locator('summary').click();
  check((await page.locator('.pr-context-list').textContent()).includes('p ∈ [C.lo, C.hi]'),'Local hypothesis incorrectly rendered');
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const audit=await page.evaluate(()=>axe.run(document.querySelector('#pa-reader'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
  fs.writeFileSync(path.join(dir,'subtree-accessibility.json'),JSON.stringify(audit,null,2));
  check(!audit.violations.length,'Reader accessibility: '+audit.violations.map(v=>v.id).join(', '));
  await page.screenshot({path:path.join(dir,'selected-1852-readable.png')});
  await page.locator('[data-pa-reader-tab="lean"]').click();
  check(await page.locator('.pr-term-row').count()===105,'Incomplete occurrence listing for screenshot subtree');
  check((await page.locator('#pa-subtree-text').textContent()).includes('Real.instAdd'),'Instance arguments lost from full term');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download entire subtree',exact:true}).click();
  const download=await downloadPromise,downloadPath=await download.path();
  const text=fs.readFileSync(downloadPath,'utf8');
  check(text.includes('ALL 105 OCCURRENCES'),'Download omits subtree rows');
  const lines=text.split('\n').filter(s=>/^\s*#\d+ /.test(s));
  check(lines.length===105,'Download row count mismatch');
  check(lines.some(s=>s.includes('#1956 ')),'Download drops final descendant');
  check(text.includes('root.value.body.body.arg.body.body.arg.body.body.fn.fn.fn.arg.body.arg.arg.body'),'Lost source path');
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const fullAudit=await page.evaluate(()=>axe.run(document.querySelector('#pa-reader'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   check(!fullAudit.violations.length,'Full-term accessibility '+theme+': '+fullAudit.violations.map(v=>v.id).join(', '));
  }
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.locator('#pa-reader-scroll').evaluate(n=>n.scrollTop=0);
  await page.screenshot({path:path.join(dir,'selected-1852-full-term.png')});
  await page.locator('.pr-term-row[data-occurrence="1855"]').click();
  check((await page.locator('#pa-reader-title').textContent()).includes('1855'),'Text-to-graph selection did not update reader');
  check(await page.evaluate(()=>window.ProofAtlasAPI.getSnapshot().selected)===1855,'Text-to-graph selection did not update canvas');
  await page.getByRole('button',{name:'← Back to subtree #1852',exact:true}).click();
  check((await page.locator('#pa-reader-title').textContent()).includes('1852'),'Subtree return navigation failed');
  await select(203);
  check(await page.locator('.pr-term-row').count()===200,'Large subtree should begin with bounded row rendering');
  await page.locator('.pr-term-more').click();
  check(await page.locator('.pr-term-row').count()===400,'Large subtree continuation failed');
  const fullDownload=page.waitForEvent('download');await page.getByRole('button',{name:'Download entire subtree',exact:true}).click();
  const full=await fullDownload,fullPath=await full.path();
  const fullText=fs.readFileSync(fullPath,'utf8');
  check(fullText.includes('ALL 7085 OCCURRENCES'),'Large proof download truncated');
  check(fullText.split('\n').filter(s=>/^\s*#\d+ /.test(s)).length===7085,'Full proof occurrence coverage failed');
  await page.locator('[data-pa-reader-tab="explain"]').click();await select(810);
  check((await page.locator('#pa-reader-content').textContent()).includes('exists_branch'),'Named leaf not decoded');
  await select(1852);await page.locator('[data-pa-reader-tab="explain"]').click();
  await page.setViewportSize({width:390,height:850});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+3),'Mobile overflow');
  await page.locator('#pa-reader').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(dir,'selected-subtree-mobile.png'),fullPage:true});
  check(!errors.length,'Browser errors '+errors.join('; '));
  console.log(JSON.stringify({status:'PASS',selectedSubtree:105,proofDownload:7085,textGraphSelection:true,noTutorial:true,mobile:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
