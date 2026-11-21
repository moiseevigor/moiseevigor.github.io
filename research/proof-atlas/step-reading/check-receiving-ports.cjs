// Browser check against a preview built from the same checkout.
'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8866';
async function check(page,proof,edition,node,route,examples) {
  const query = new URLSearchParams({proof,edition,route});
  await page.goto(origin+'/projects/proof-atlas/library/?'+query+'#expr-'+node);
  await page.locator('#pl-binding-toggle').click();
  const form = page.locator('#pl-binding-uses form').first();
  const output = page.locator('.pl-located-use');
  for (const [ordinal,role,slot,arity] of examples) {
    await form.getByRole('textbox').fill(String(ordinal));
    await form.getByRole('button').click();
    assert.equal(await output.getByRole('link',{name:role,exact:true}).count(),1);
    const selected = output.locator('[aria-current="true"]');
    if (slot===null) {
      assert.equal(await selected.count(),0);
      continue;
    }
    assert.equal(await selected.textContent(),slot===0?'fn':String(slot));
    assert.equal(await selected.getAttribute('href'),await output.getByRole('link').first().getAttribute('href'));
    const ports = output.getByRole('group');
    assert.equal(await ports.getByRole('link').count(),arity+1);
    assert(await output.evaluate(e=>e.scrollWidth<=e.clientWidth+1));
  }
}
async function checkWideCall(page) {
  const proof='lean_workbook_20418',edition='goedel-sample-4331';
  await page.goto(origin+'/projects/proof-atlas/library/?'+new URLSearchParams({edition,proof,route:'1:1.1'})+'#expr-86584');
  await page.locator('#pl-binding-toggle').click();
  const form=page.locator('#pl-binding-uses form').first();
  await form.getByRole('textbox').fill('49479');
  await form.getByRole('button').click();
  const output=page.locator('.pl-located-use'),ports=output.getByRole('group');
  const call=new URL(await output.getByRole('link',{name:'Mathlib.Tactic.Ring.Common.mul_pow_mul',exact:true}).getAttribute('href'),origin);
  const route=call.searchParams.get('route'),selected=await ports.locator('[aria-current]').getAttribute('href');
  const nodes=[0,839,1932,1932,877,904,904,159,1936,1936,2111,2124,2143,2180],seen=new Set();
  for(const range of [null,'Show arguments 2–5','Show arguments 9–13']){
    if(range)await ports.getByRole('button',{name:range,exact:true}).click();
    const links=ports.getByRole('link');
    assert(await links.count()<=9);
    assert.equal(await ports.locator('[aria-current]').getAttribute('href'),selected);
    for(const a of await links.all()){
      const slot=await a.textContent();
      if(slot==='fn')continue;
      const u=new URL(await a.getAttribute('href'),origin),index=Number(slot);
      assert.equal(u.hash,'#expr-'+nodes[index-1]);
      assert.equal(u.searchParams.get('route'),route+'.0'.repeat(14-index)+'.1');
      seen.add(index);
    }
  }
  assert.equal(seen.size,14);
  await output.getByText('Declared type of argument 8',{exact:true}).click();
  const signature=output.locator('details');
  await signature.getByText('xa₁ : R',{exact:true}).waitFor();
  const dependent=signature.getByRole('link',{name:'Argument 13',exact:true});
  assert.match(await dependent.getAttribute('href'),/#expr-2143$/);
  assert.equal(await signature.locator('p code').textContent(),'xa₁ ^ c₁ * Nat.rawCast 1 = c₃');
  await signature.getByText('c ^ Nat.rawCast 2 * Nat.rawCast 1 = c ^ Nat.rawCast 2 * Nat.rawCast 1',{exact:true}).waitFor();
  await page.goto(call.href);
  const comparison=page.locator('[data-caller-domains]');
  await comparison.locator('summary').click();
  await comparison.getByText(/Lean also checked the two subterms/).waitFor();
  assert.equal(await comparison.getByRole('combobox').inputValue(),'11');
  assert.match(await comparison.innerText(),/instMulNat/);
  assert.match(await comparison.innerText(),/Distrib.toMul/);
  await comparison.getByRole('combobox').selectOption('13');
  assert.match(await comparison.innerText(),/share the same compiled expression/);
  assert.match(await comparison.getByRole('link').getAttribute('href'),/#expr-2143$/);

}
async function checkReturnedFunction(page){
  const query=new URLSearchParams({edition:'goedel-sample-4331',proof:'lean_workbook_20418',route:'1:1.1.1'});
  const rootQuery=new URLSearchParams(query);rootQuery.set('route','1:');
  await page.goto(origin+'/projects/proof-atlas/library/?'+rootQuery+'#expr-86586');
  const endings=page.locator('#pl-expression details').filter({has:page.getByText('How the eight cases close',{exact:true})}).first();
  await endings.locator('summary').click();
  assert.equal(await endings.locator('tbody tr').count(),8);
  assert.equal(await endings.getByRole('link',{name:'False.elim',exact:true}).count(),6);
  assert.equal(await endings.getByRole('link',{name:'of_eq_true',exact:true}).count(),2);
  assert.equal(await endings.getByRole('link').count(),14);
  const facts=page.locator('#pl-expression details').filter({has:page.getByText('Disjunctions used in the proof',{exact:true})}).first();
  await facts.locator('summary').click();
  const factRows=facts.locator('li');
  assert.equal(await factRows.count(),3);
  for(const [i,count] of [1,2,4].entries())assert.equal(await factRows.nth(i).getByRole('link').count(),count+1);
  const outline=page.locator('#pl-expression details').filter({has:page.getByText('Nested equality transports in this proof',{exact:true})}).first();
  await outline.locator('summary').first().click();
  assert.equal(await outline.getByRole('link').count(),14);
  assert.equal(await outline.locator('li:not(:has(ul))').count(),8);
  await outline.getByRole('link',{name:'0 = a',exact:true}).click();
  await page.locator('[data-caller-domains] summary').first().waitFor();
  await page.goto(origin+'/projects/proof-atlas/library/?'+query+'#expr-86583');
  await page.locator('#pl-binding-toggle').click();
  const form=page.locator('#pl-binding-uses form').first();
  await form.getByRole('textbox').fill('43');
  await form.getByRole('button').click();
  const output=page.locator('.pl-located-use');
  await output.locator('summary').click();
  await output.getByText('Premise of the function returned by Eq.ndrec',{exact:true}).waitFor();
  await output.getByText('0 ≤ a ∧ 0 ≤ b ∧ 0 ≤ c',{exact:true}).waitFor();
  await output.getByRole('link',{name:'Eq.ndrec',exact:true}).click();
  const panel=page.locator('[data-caller-domains]');
  await panel.locator('summary').click();
  await panel.getByRole('link',{name:'Eq.ndrec after 6 arguments'}).waitFor();
  assert.equal(await panel.getByRole('combobox').inputValue(),'7');
  for(const [i,id] of [159,86,80,78].entries()){
    await panel.getByRole('combobox').selectOption(String(i+7));
    const link=panel.getByRole('link',{name:'Supplied argument '+(i+7)+' · e'+id});
    assert.match(await link.getAttribute('href'),new RegExp('#expr-'+id+'$'));
  }
}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await check(page,'JacobiData.T1_T2_same_sign','published-15',3733,'1:1.1',[
      [1,'letE.value',null],[2,'Eq.mp',4,4],[3,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7],
      [4,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7],[5,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7]]);
    await check(page,'lean_workbook_plus_6206','goedel-sample-4331',91421,'1:1.1',[[48463,'HPow.hPow',5,6]]);
    await checkWideCall(page);
    await checkReturnedFunction(page);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
