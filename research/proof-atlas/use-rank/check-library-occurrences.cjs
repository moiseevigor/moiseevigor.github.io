// Exercise the complete library entry page with the checked-in workspace include.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {index}=require('../../../public/js/proof-atlas-row-occurrences');
const sample=require('./shared-application-contexts.json').find(s=>s.middleWitness);
const record=inventory().find(i=>i.record.indexSha256===sample.source.indexSha256).record;
const data=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
const w=sample.middleWitness;
const table=index(data,w.row,{root:1,slots:w.first});
assert.equal(table.total,113n);
const html=fs.readFileSync('projects/proof-atlas/library/index.html','utf8').replace(/^---[\s\S]*?---\n/,'')
 .replace('{% include proof-atlas-compiled-workspace.html %}',fs.readFileSync('_includes/proof-atlas-compiled-workspace.html','utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try{
  for(const width of [320,1280]){
   const page=await browser.newPage({viewport:{width,height:800}});
   page.on('pageerror',error=>console.error(error.message));
   await page.route('http://localhost/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/projects/proof-atlas/library/')return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
    if(!u.pathname.startsWith('/public/'))return route.fulfill({status:404,body:''});
    const file=path.resolve('.'+u.pathname);
    return route.fulfill({path:file});
   });
   const base='http://localhost/projects/proof-atlas/library/?edition='+sample.source.edition+'&proof='+record.name;
   await page.goto(base+'&route=1:'+w.first.join('.')+'#expr-'+w.row);
   const choose=page.locator('#pl-expression details').filter({has:page.getByText('Find occurrences of this application',{exact:true})});
   await choose.locator('summary').click();
   await choose.getByLabel('Occurrence number').waitFor();
   assert.match(await choose.innerText(),/Occurrence 1 of 113/);
   await choose.getByLabel('Occurrence number').fill('114');
   await choose.getByRole('button',{name:'Go to occurrence'}).click();
   assert.equal(await choose.locator('input').evaluate(i=>i.checkValidity()),false);
   await choose.getByLabel('Occurrence number').fill('57');
   await choose.getByRole('button',{name:'Go to occurrence'}).click();
   const picked=table.select(57n),variable={root:1,slots:picked.slots.concat(w.relative)};
   await page.waitForFunction(r=>new URL(location).searchParams.get('route')===r,'1:'+picked.slots.join('.'));
   await choose.locator('summary').click();
   await choose.getByLabel('Occurrence number').waitFor();
   assert.match(await choose.innerText(),/Occurrence 57 of 113/);
   await page.locator('#pl-expression').getByRole('button',{name:/^arg ·/}).click();
   const binder=atlas.binding(data,variable);
   await page.locator('#pl-expression').getByRole('button',{name:new RegExp('^Enclosing binder #'+binder.node+' ')}).click();
   await page.waitForFunction(r=>new URL(location).searchParams.get('route')===r,'1:'+binder.route.slots.join('.'));
   assert.equal(new URL(page.url()).hash,'#expr-'+binder.node);
   await page.close();
  }
  console.log('Library application → occurrence 57 → variable → binder passed at 320 and 1280 pixels.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
