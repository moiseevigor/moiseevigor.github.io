'use strict';

// Preserve the separate occurrence paths even when adjacent hops reuse a row.
module.exports=function definitionPath(data,entry){
  const definitions=entry.definitionHops.map(h=>({use:h.use,binder:h.binder,value:h.value,name:data.payloads[h.binder.node].declName}));
  return definitions.length ? {definitions,inputTerm:entry.display.inputTerm,valueTerm:entry.display.producerTerm,
    inputContext:entry.consumer.context.length,valueContext:entry.producer.context.length,boundary:entry.definitionBoundary} : null;
};
