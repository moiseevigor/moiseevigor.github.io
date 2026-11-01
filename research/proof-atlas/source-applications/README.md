# Original source application inputs

The compiled library can display the function and every supplied argument at an
original application occurrence, including occurrences without recorded internal
types. In the complete library's local term view, select an application and open
**Read ordered source application inputs**. The paged library offers the same
reader when that exact occurrence has no native application-port record. Existing
typed application records retain their separate view.

[Complete source example: SBracket.exact_time](/projects/proof-atlas/library/?edition=published-15&proof=SBracket.exact_time&route=1:1.1.1#expr-11987).
Its five supplied inputs belong to the literal `Exists.casesOn` call. This is not
a mathematical interpretation of that elimination or a proof-step annotation.

## Rule and scope

The original and computed-value readers now use one literal application-spine
extractor and one renderer. Ordered nested `Expr.app` fields fold into a join
whose endpoints are the actual head and supplied argument occurrences. Metadata
and other constructors remain opaque endpoints. No normalization is performed.
The inverse reassembles the exact original head/argument sequence. Application
wrappers plus endpoint subtree counts equal the selected subtree count; each
four-argument page retains the visible roots and counts every other occurrence
as collapsed. Distinct slots remain distinct when they reference the same stored
row. This is the existing structural application law applied to original source,
not a new typing theorem.

Every port carries the source packet hashes, declaration, original root, ordered
path and stored node. A root `bvar` resolves through that original path's binder
stack. Lambda/Pi bodies and let bodies extend scope; domains, declared types and
let values do not. The declared name is presentation only: links use the exact
binder occurrence, including when names or stored rows repeat. Inner references
of composite ports remain uninspected.

Both source adapters borrow the library's authenticated packet/page owner. The
complete adapter assumes the caller used the existing hash-validating loader;
it does not authenticate arbitrary JSON supplied to its public function. Fetched
source rows retain the existing page-hash and producer-attestation contract.
Visited rows additionally check local count/scope recurrence and lexical closure.
This is not a fresh Lean compiler replay. Source adapters accept `root.type` and
`root.value` only. Reduction-rule roots have a separate context and remain outside
this reader. Their existing constructor and rule tools remain available.

Preview text uses the same recoverable notation grammar in the actual enclosing
source context. Its operator-signature catalogue is empty: the source manifest
does not bind the general corpus to the finite recorded notation environment.
Generic applications and declaration names therefore remain literal. Matching a
name is insufficient to import an operator alias. The source join neither infers
proof/type/instance roles nor supplies an internal type or necessary-premise edge.

## Delivery and evidence

The join has at most 64 arguments; a page has a head, four arguments and a result
join, at most six vertices. A model has a 512-slot path limit, 8,192 row-read limit
and 1 MiB serialized-metadata limit. Refusals preserve constructor inspection.
The paged adapter borrows the parent's bounded source cache; the audit uses one
256-row page and two index pages. The browser's parent library retains its own,
separately declared cache limits. Complete packets remain fully resident.
Visible compound previews use tables of at most 262,144 stored rows. They borrow
one notation cursor at a time, at most 8,192
rows / 4 MiB and 48 scene objects, and retain only 96 text characters per endpoint.
These component bounds are not whole-browser heap measurements.

`check.cjs` authenticates all 2,127 input packets and audits their 2,096,774 stored
rows. There are 1,883,973 stored applications, of which 234 occur only in reduction
rules. The largest stored application spine has 59 supplied arguments; none
exceeds the reader's 64-argument limit. The largest original root-to-leaf path
is 267 fields, below the 512-field route limit. These static censuses are distinct from
the selected-path checks.

The path checks select original roots, one representative reachable occurrence
per present constructor, a call beneath the leading proof binders (or the first
let value), each packet's largest original application, alternate variable scopes,
and a longest original path from each of the 4,206 type/body roots. They
exercise 31,349 distinct cuts, 59,055 endpoint ports, 13,606 lexical references and 35,449
argument pages. The checks include 6,421 alternate original paths where the same
stored variable row resolves to a different binder occurrence. Complete and paged models agree on 566 selected cuts across all
35 paged packets, including all 20 attributed AI-source proofs. All 35 selected
paged preview scenes agree with complete-data notation in their actual source
contexts. The maximum observed model is 106,994 serialized bytes and 808 row
reads. The two project snapshots and authored controls are inventoried separately;
they are not independent samples of the same proof population.

These checks do not enumerate every expanded occurrence path, prove the runtime
implementation, supply missing internal types, or measure comprehension and
semantic compression. Browser and compatibility checks are separate gates.

The production browser checks exercise proof-body calls in all 35 paged packets,
73 argument pages, exact source/binder jumps, stale controls, optional failure and
four theme/layout audits. Prior native interfaces retain all 207 argument windows
and 115 recorded library call selections. The complete-library check separately
authenticates all 2,237 served packets, including additional controls outside the
2,127-packet application-model inventory. Its dependency-list and local-tree
assertions follow the current bounded reader, rather than a removed global graph.
Earlier direct, adapter, notation, source-specializing and declaration-window
assertions were replayed without replacing their historical native observations.

```sh
node research/proof-atlas/source-applications/check.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/source-applications/browser.cjs
node research/proof-atlas/application-collar/check.cjs
node scripts/test-proof-atlas-local-reader.cjs
node research/proof-atlas/source-applications/verify.cjs --write
```

Only compiled data and reproduction tooling are used. Original proof scripts,
private projects and native execution logs are not published by this work.
