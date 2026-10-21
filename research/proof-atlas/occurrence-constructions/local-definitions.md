# Local definitions in construction cuts

The occurrence construction reader retains `Expr.letE` as one local-definition
rule with three ordered source fields: `type`, `value`, `body`. Type and value
are in Γ. The body is in Γ, x : A := v. A local definition retains its value;
it is distinct from an ordinary lambda assumption x : A.

The conclusion keeps the original native let type in Γ. The recorded body type
is in the extended context. Native conversion checks and type-expression roots
for the declared type, expected value type, substituted body type and reduced
term type remain attached to their original metadata table. They are not new
source occurrences or additional typing judgments. **Native rule record** exposes
these references and links to the compiled metadata. Source, premise-type and
conclusion-type actions retain the exact original field and context.

This view draws the original local definition. It does not perform ζ reduction
or load the separately pooled reduced terms. The existing complete reader's
reduction view and bounded pool transport retain their own contracts.

## Source and type provenance

The adapter reuses 48 native let records in seven declarations from the existing
20-declaration publisher-attributed AI sample. These are the original producer's
finite records at one source occurrence per stored let node, not records for
all expanded occurrences of shared nodes or an independently verified model
generation history. Project snapshots without these metadata remain explicit
construction boundaries.

The supplement validates the existing bounded-result index, native scope flags,
conversion checks, source fields, type-table scope and source/evidence hashes.
It retains the original packing and native environment provenance. It does not
read original mathematical source modules or create new native judgments.

All 43 overlaps with the already loaded occurrence profile have the same source
node, role, ordered context and structurally identical recorded type. The merge
refuses disagreement and commits construction attachments only after all overlap
checks pass. Existing source/type observations stay in their original shared
storage. The independent let type table is stored once per declaration. Merging
adds 108 distinct recorded source positions across the seven declarations.

A matching declaration name or DAG node number is insufficient to attach a
record. The exact edition, source index and source provenance must match.
Neither snapshot nor unrecorded source paths acquire inferred coverage.

## Versioned representation

`ProofAtlasOccurrenceConstructionCut/2` uses `selected-source-relative/2`.
Descendant suffixes have at most five fields, each 0, 1 or 2. Original ancestor
references retain their prefix depths; a shortened prefix cannot acquire an
invented descendant suffix. Field 2 is the let body. The earlier binary format
still rejects it. Cases without recorded let constructions keep version 1.

The cut retains at most thirteen constructors and depth four, with a 64 KiB
serialized metadata cap. Up to 27 frontier regions account for a ternary cut.
For each local definition:

```
1 + size(type) + size(value) + size(body) = size(original let)
```

Retained constructors and the exact, disjoint frontier regions account for the
selected original subtree. Original Γ references contribute zero to this count.
The body binds x; the type and value do not. Links to a let binder are labelled
as local-definition references, including references from computed types back
to the original source context.

Application grouping uses `ProofAtlasApplicationSpineCut/2` for these cases.
A local definition remains a single member with its three original ports.
Application groups can occur in its value or body when compatible native records
exist. Unfolding still recovers the full primitive construction cut. Display
order follows source-field order. Opening the rule metadata reflows cards and
connectors; it does not alter source addresses or occurrence counts.

The metadata and type cuts are bounded. Complete source/type tables remain
resident under the existing profile limits; this is not a whole-browser or
arbitrary-proof memory bound.

## Finite checks and remaining scope

The independent adapter audit checks all 48 records and 144 premise types,
432 source cuts and 1,296 reversible grouped cuts. It checks 865 typed-point
origins, 93 binder-link appearances including 20 links to local definitions,
43 matching old observations and sixteen refusal controls. The largest tested
primitive scene is 34,285 bytes. These are overlapping cut/check appearances,
not additional native proof certificates.

The browser checks select every let and each of its three source/type fields,
compare grouped scenes in all seven declarations, follow the body's local binder,
reload a saved ternary route, check both themes at phone and desktop widths,
and exercise corrupt and delayed optional metadata. No reduced-result pool is
requested. The declared type's type label is explicitly marked as a constructor
summary where the existing record does not contain native pretty text.

Run from the repository root:

```sh
node scripts/test-proof-atlas-occurrence-let-bindings.cjs
node scripts/test-proof-atlas-occurrence-let-bindings-browser.cjs
```

The scope remains finite recorded local definitions, Π introductions and Π
applications. Other rule families, deeper local-definition controls, general
consumer/renderer verification, paged construction delivery and measured human
inspection tasks remain separate work. No semantic-compression or complete
formalization claim follows from these checks.


## Further native queries

`run_occurrence_types.py --kind let` runs the existing exact-route let checker
against a private pinned compiled environment. The request retains the original
packet hash, source-module hash and explicit occurrence routes. The driver
imports only the requested modules, checks available dependency revisions,
compares the complete native DAG with the packet, and checks source and selected
compiled-module bytes again after extraction. It accepts an explicit
`--search-path-file` when the private snapshot has no saved search-path file.
It does not download dependencies or rebuild a project. Native jobs are limited
to 120 seconds, 8 GiB RSS and a 64 MiB output file, retaining a 30 GiB disk reserve.
Requests and extraction logs stay outside the public website; publication is a
separate reviewed compiled-data projection.

A recorded body type does not supply that body's constructor rule. To compose
an introduction or local definition, query that exact constructor or retain an
explicit boundary. In particular, one query at a function root is not a record
for every introduction in its binder prefix.

## Construction-owned type tables in sparse projections

The selected position record and its native construction can come from different
extraction tables at the same source route. Position precedence must not replace
the construction's table. The type-page producer accepts additional attested
table owners without adding position observations. The construction-page
producer supplies these owners explicitly. Tables retain their original
evidence and type-table identities; component roots are never interpreted in a
neighbouring observation's table.

`test-proof-atlas-construction-owner-tables.cjs` projects one existing public
position whose let construction owns a different table. It retains one position
observation, delivers both tables, compares the recorded type, conclusion and
three field types, and compares the complete and paged one-member frame.
Unattested, foreign-source and unbounded owner inputs are refused. This is a
transport/provenance regression, not an additional kernel judgment.
