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
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    await check(page,'JacobiData.T1_T2_same_sign','published-15',3733,'1:1.1',[
      [1,'letE.value',null],[2,'Eq.mp',4,4],[3,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7],
      [4,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7],[5,'Mathlib.Tactic.Linarith.sub_neg_of_lt',7,7]]);
    await check(page,'lean_workbook_plus_6206','goedel-sample-4331',91421,'1:1.1',[[48463,'HPow.hPow',5,6]]);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
