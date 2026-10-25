'use strict';
const fs=require('fs'),z=require('zlib'),F=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const item=F.inventory().find(i=>i.edition==='published-15'&&i.record.name==='JacobiData.slope_bound_abs'),d=item.descriptors.find(p=>p.kind==='case').descriptor,e=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file)));
const routes=e.entries.filter(q=>q.eliminationJudgment?.status==='checked').map(q=>q.route);
process.stdout.write(JSON.stringify({record:item.record,routes,previousEvidence:d}));
