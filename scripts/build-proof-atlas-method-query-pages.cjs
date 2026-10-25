/* Immutable page epoch; reproduce the emitter at e5c893485. */
'use strict';
if(!process.argv.includes('--check'))throw Error('Frozen page epoch: use the emitter at e5c893485 to reproduce; --check revalidates current semantics without rewriting historical reports.');
require('./check-proof-atlas-method-query-pages.cjs');
