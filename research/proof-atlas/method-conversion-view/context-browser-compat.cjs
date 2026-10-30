'use strict';
// Run the unchanged complete/paged/manual/stress checker, redirecting only its
// final report so the earlier frozen checkpoint is not rewritten.
const fs=require('fs'),path=require('path');
const original=fs.writeFileSync;
const target=path.resolve(__dirname,'../method-context/browser-check.json.gz');
fs.writeFileSync=function(file,...args){return original.call(this,path.resolve(String(file))===target?path.join(__dirname,'context-browser.json.gz'):file,...args);};
require('../method-context/check-browser.cjs');
