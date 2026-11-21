// Load edition registrations in their declared order before starting the reader.
(() => {
  'use strict';
  const query = new URLSearchParams(location.search);
  const pagedAI = query.get('view') === 'occurrence' && query.get('loading') === 'paged' &&
    query.get('edition') === 'goedel-sample-4331' && !query.has('control');
  const scripts = document.getElementById('proof-library-scripts').content;
  for (const entry of scripts.querySelectorAll('script[src]')) {
    if (pagedAI && entry.hasAttribute('data-project-inventory')) {
      window.PROOF_ATLAS_LIBRARY = {editions:[]};
      continue;
    }
    const script = document.createElement('script');
    script.async = false;
    script.src = entry.src;
    document.head.appendChild(script);
  }
})();
