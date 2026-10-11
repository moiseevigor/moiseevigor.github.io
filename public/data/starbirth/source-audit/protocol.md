# PPMAP implementation uncertainty audit

Human-requested continued research, 11 October 2026. The documentation now
identifies the maintained source repository at https://github.com/ahoward-cf/ppmap.
Directory names/installation guidance were inspected, but uncertainty source
contents have not been read for this unit. Freeze these rules before that readout.

Question: does the maintained or included legacy implementation provide a
source-traceable route to integrated-column uncertainty, and can it be bound to
our archived Hi-GAL products sufficiently to justify a new validation protocol?
This is distinct from the finished cached-product audit. The 333/800 gate and
all requested identities remain unchanged; no MIR source rows may be read.

1. Fetch the current master commit and recursive file-tree metadata from the
   documented GitHub repository, then pin that exact commit for every content
   request. Do not clone or install anything. Select relevant source files from
   the actual tree; retain current/legacy roles and complete source hashes.
2. Trace the uncertainty calculation, any integrated-error/covariance output,
   prior/normalisation units and the relationship to published equations 15–17.
   Use bounded reads of complete saved files with line citations. Do not execute
   third-party code, simulate new maps or download observations/PSFs.
3. Independently verify cited statements against the frozen complete bytes.
   State whether errors derive from a diagonal approximation, full inverse,
   covariance propagation or another formula; do not infer a formula by filename.
4. Establish release binding if possible from explicit source/version/product
   evidence. Similar variable names and ETA=10 do not prove the 2017/2018 archive
   used the currently inspected implementation. If that binding is absent, report
   the implementation result separately and leave real-clump covariance unknown.

Positive outcome: a traceable, release-bound integrated-error route motivates a
separately registered validation, not immediate relaxation of the primary gate.
Negative/insufficient outcome: missing covariance or missing release binding ends
this unit with exact requirements for progress. Source retrieval, byte counts and
successful hashes are not scientific findings. Preserve earlier negative results.

Acquisition: <=20 HTTPS GET requests total to api.github.com and
raw.githubusercontent.com for this single repository; <=256 KiB per response,
<=512 KiB response bodies cumulatively; <=30 seconds per request, no redirects
or automatic retries. Stop on a failed/truncated response or limit exhaustion;
preserve its journal. No full Git history, archives, Git LFS or binary products.
Resource limits: <=10 minutes, <=2 MiB outputs including source copies and journals,
<=256 MiB monitored worker RSS, one numerical thread, lowered priority and >=5 GiB
free disk. Use the live guard and preserve its receipt. Commit this protocol and
bounded fetcher before readout; snapshot verified findings separately.

Primary context: https://ppmap.readthedocs.io/en/latest/installation.html and
https://arxiv.org/html/1509.08699v1, equations 15–17. No private Atlas/E155/E121
action or archived generic-star experiment is authorized by this unit.
