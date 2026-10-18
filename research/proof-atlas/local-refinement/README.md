# Local source-region refinement

**Expand here** replaces one hidden source region in the current proof diagram.
It preserves the original selected root, packet identity, retained source paths
and existing native records. **Undo local expansion** returns the exact previous
cut. The original library/article selection and URL stay fixed until an explicit
source jump or a new view is selected.

## Composition rule

The input is an existing validated judgment scene and an exact hidden-root row.
A child scene is prepared at that same source node and full occurrence route.
Replacing the row gives:

```
new retained = old retained + child retained
new hidden   = old hidden - selected region size + child hidden
```

Every remaining hidden root must lie inside an old hidden region. Unselected
hidden roots keep their node, route, role, size, native type reference and source
origin. Retained nodes keep their original context, type, checks and attestation.
An opaque source node gains only literal kernel child ports; their types remain
unrecorded unless a separate native observation exists. A source layout does not
become a checked construction through expansion.

A recorded parent type is recovered from its immutable query and component.
When the child has its own type record, the existing judgment producer checks
its role, original context and structural type agreement. Otherwise the original
parent observation is retained. No additional kernel typing or conversion check
is supplied by this JavaScript operation. An unmatched interface withholds the
expansion and preserves the earlier diagram.

Bound-variable targets stay at their original absolute source paths. Presentation
links are remapped to retained binders and folded frame slots. The paged reader
reattaches available source-scope interfaces to the combined cut; missing evidence
has an explicit unavailable state. If an expansion would lose an available scope
layer, it is withheld and the earlier cut is preserved. Computed type/reduction namespaces do not enter
this source-only operation. Positions remain presentation choices; fitting a
larger diagram can move its retained cards.

`ProofAtlasRefinedJudgmentScene/1` records the combined cut and exact opened roots.
Owned immutable state shares unchanged metadata with earlier cuts. Disjoint
replacements give the same canonical scene when both fit the bounds; undo follows
the actual operation order. Changing the initial depth, policy, grouping or focused
root selects a fresh cut and clears local expansion history.

## Bounds

A click adds at most four displayed regions, with one local level of selection;
existing compound rules may retain several source constructors per region. The
combined view has at most 32 vertices, 31 local history steps, 4,096 hidden roots
and 512 slots per source route. Recovering a parent interface visits at most 64
recorded construction interfaces along the selected source path.

The source/native/scope caches retain their existing bounds. The refinement
component also limits its metadata/history accounting to 16 MiB. Shared objects
are counted once; UTF-8 field payloads and fixed object/property charges contribute
to this accounting. This is an implementation budget, not a measurement of total
JavaScript heap or browser memory. A limit refusal leaves the earlier cut intact.
No expanded occurrence tree is built.

## Evidence and limits

The independent audit checks 1,224 expansions across 612 initial cuts in 34
inventories, including 654 recorded type interfaces and 325 opaque source regions.
It also checks 148 expansions at 150 current native-query cuts; the other two cuts
have no hidden region. Literal source paths, contexts and native fields are
reconstructed independently. Disjoint replacements commute, a large-count cut
reaches the 32-vertex limit through 29 operations, and full undo restores its
original object. Thirteen changed-input or bound controls reject.

The core-only projection control has a value input containing a proof application.
Expanding that input exposes its separately checked witness at route `1:1.0.1`,
while preserving the selected count of 9,671,406,556,917,033,397,649,412 source
occurrences. This extends access beyond a proof-premise-only traversal. It does
not establish the mathematical importance of that reflexivity proof.

Browser checks cover complete and paged readers, actual expansion/undo controls,
exact original-source jumps, selection/URL preservation, bounded caches, optional
module failure, stale cancellation and both themes at phone/desktop widths.
The existing [formal cut laws](../cut-refinement/README.md) specify the pointwise
preservation criterion. These finite implementation checks do not constitute a
formal proof of the JavaScript or a measured comprehension benefit. General
semantic abstraction and complete native construction coverage remain open.

The [independent recorded-type interface audit](../type-interfaces/README.md)
resolves parent and child records directly from their hash-pinned packages. It
checks source contexts and full stored type syntax without importing the judgment
producer or its comparator; it does not add a kernel typing judgment.

```sh
node scripts/test-proof-atlas-local-refinement.cjs
# After the production site is built and served:
node scripts/test-proof-atlas-local-refinement-browser.cjs
```
