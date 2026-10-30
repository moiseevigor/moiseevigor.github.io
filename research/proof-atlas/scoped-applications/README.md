# Application flow in exact lexical scope bands

Status: experimental layout model. It is not installed in the website. No reader or blog changes are included.

The existing raw application cut places calls by source-use rank. This model adds a second coordinate: the exact ordered lexical context at each original call. Calls with identical binder occurrence sequences share a band. Equal depth or equal binder names do not identify a context. Horizontal rank still follows the original retained source uses; distances have no mathematical meaning.

Each retained wire is checked through the existing input-context source witness. Its endpoints, actual ordered input, added lexical binders, local-definition hops and unresolved definition boundary remain separate. Wires may be bundled by original producer, consumer and source-use relation, but every input position remains in the bundle. Other boundary inputs and outgoing uses remain in the original cut accounting. The model creates no composite region, common-context typing judgment or logical implication.

## Finite checks

The [model check](check-model.cjs) compares 55 cuts with original checksum-verified compiled archives. These cuts contain 212 call appearances and 89 retained use appearances, including all 201 calls in the 42 installed native profiles. Original native context records provide an additional oracle. The checks compare ordered binder occurrences, context groups, each bundled input position, source-use direction, nonoverlapping card coordinates and exact original cut recovery. Equal-depth distinct-context pairs remain separate. There are 114 rejection/lifecycle checks, including changed source identities, changed call records, invalid accounting, duplicate records, pre-aborted and interrupted source requests, and use after disposal.

- The seven-call Riccati cut has two contexts and six retained uses. Input `25:4` crosses three lexical binders and follows one local definition.
- The four-call source-only cut contains the actual use `6241` → `193239:7`. It crosses 29 binders and follows one definition. Its per-call native types remain unobserved.

The runtime retains at most eight call records, capped at 4 MiB. Source context derivation and the sequential input witnesses use their existing bounded source-page protocols; no complete source archive or native type graph is fetched by the model. The independent test oracle reads complete compiled archives directly. The largest completed scene in this test is 129,812 serialized bytes; the observed source fetch cache reaches its 256-row bound. These component counters are not a total heap measurement. The full scene is capped at 8 MiB.

`open` authenticates call records and source witnesses before returning a scene. `restore` recovers the original call cut from retained records and accounting; it does not independently authenticate modified layout coordinates or recheck source pages. The report pins the tested implementation hashes. Original source packet, native owner, inventory header and occurrence routes remain distinct.

This checks the data model and coordinates. A browser renderer, bounded visible wire pages, source selection integration, accessibility checks and measured inspection tasks remain outstanding. No improvement in comprehension or semantic compression is claimed. Earlier research records are unchanged.

## Reproduction

```sh
node research/proof-atlas/scoped-applications/check-model.cjs
```

The [compressed report](model-check.json.gz) contains the finite checks, two complete example scenes and implementation hashes. It contains compiled term metadata, not original Lean or tactic scripts. The general geometric-language research goal remains active. This iteration does not merge or deploy the feature branch.
