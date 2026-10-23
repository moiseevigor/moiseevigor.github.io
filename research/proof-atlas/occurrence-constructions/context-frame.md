# Context frames over recorded introduction and definition chains

Status: context-frame lens in the complete and paged occurrence readers.
Existing primitive cut and application-group formats retain their previous
meanings and limits.

The numerical audits below describe the released 25-profile baseline. The
[additional Riccati context records](riccati-continuation.md) extend the local
inventory to 26 profiles and 269 recorded chain starts; their native provenance,
checks and remaining boundaries are documented separately.

## Representation problem

A binary or ternary constructor cut spends one retained vertex on each binder.
The existing finite native profiles contain 251 possible introduction/definition
chain starts. Of these, 61 continue beyond thirteen constructors. The longest
recorded compatible chain has 57 introductions in `SBracket.mk.inj`. An attributed
AI-sample declaration, `lean_workbook_plus_54159`, contains a chain of 30 local
definitions. These counts concern exact recorded occurrence paths, including
overlapping suffixes, rather than all occurrences or all proofs in the library.

A context frame retains the ordered introductions and definitions in one
compound source construction. Each member is still identifiable and selectable.
Its type/domain and, for a definition, its value remain separate original source
fields. The continuation is the original body after the last retained member.

For member i, with initial context Γ of length g:

```
domain/type and value: Γ(g+i)
member's original body: Γ(g+i+1)
frame continuation:   Γ(g+k), after k retained members
```

An introduction adds an assumption. A local definition adds x : A := v and
retains both its value and `nondep` flag. Names do not identify binders; source
member positions and original routes do. A repeated or shadowed name cannot
redirect a reference. A header never acquires its own binder.

## Protocol and composition

`ProofAtlasOccurrenceContextFrame/1` uses `context-member-relative/1`. There is
one full selected packed source route. Member i appends the first i original body
fields: slot 1 for an introduction, slot 2 for a local definition. A member's
named field appends that field's original slot. Member k denotes the continuation.
An external original context reference uses an ancestor prefix depth. Recording
query addresses use an explicit common prefix and bounded source-field suffix;
they are evidence locations, not fabricated frame members.

The producer follows only the original body premise. It requires the following
record to have the same role, the extended original context and a structurally
equal recorded type. Equality uses each construction's own shared type table;
an old overlapping observation can use a different table. Missing records,
different interfaces, other rule families and the member budget stop the frame
and remain explicit continuation statuses.

`expand` recovers the ordered individual constructors and their exact header/body
ports. The source frontier consists of all retained members' headers and the
continuation. These regions are pairwise disjoint, with:

```
size(selected source) = member count + sum(size(headers)) + size(continuation)
```

Original Γ links contribute zero. This is a source partition, not a semantic
equivalence claim or a rewriting operation. No β or ζ result replaces the source.

The frame has its own explicit bounds: at most 64 members, 129 frontier regions
and 128 KiB serialized metadata. It does not reinterpret the existing
thirteen-constructor/five-field primitive format. Source and computed-type tables
remain shared inputs. Type evidence/table identities are interned within the
frame, and Γ is represented by its original length and member extensions rather
than by copying each context prefix. This bounds the frame metadata, not the
whole browser or arbitrary source-table delivery. A frame exceeding the byte
bound is refused.

Computed type references identify the evidence file/table, type root and exact
original context address. Introduction `expectedBody` expressions use the extended
body context. Other introduction components, let components and conclusions use
the member's preceding context. Component expression roots are recorded syntax,
not new inferred judgments. `typeFor` returns the original recorded conclusion
or field typing observation, using its original source route.

## General laws and finite adapter audit

`ContextFrame.lean` proves seven laws on actual `Lean.Expr` values:

- bounded peeling followed by reassembly gives the identical original term;
- the retained member count is at most the requested fuel;
- reassembly and peeling satisfy exact expanded-occurrence accounting;
- each member's headers use the preceding context and its body uses the extension;
- reassembly and peeling preserve the corresponding telescope scope predicate.

The scope predicate checks bound-variable indices through all kernel expression
constructors. It does not check free-variable environments, metavariables or
typing. Printed axioms contain only `propext` and `Quot.sound`, without `sorryAx`.
These theorems do not verify the JavaScript adapter, serialized protocol, native
typing records or a renderer. The checked summary pins the theorem source hash.

The independent adapter audit visits every recorded chain start at budgets
1, 4, 13, 32 and 64, plus the existing native introduction controls. It resolves
all members, headers, body edges and visible binder targets independently against
the original packed source, checks structural type origins and context lengths,
checks every maximum-budget boundary and member type action, and rejects changed
origins, fields, order, contexts and external identities. The report gives the
observed counts and byte maximum; overlapping appearances are not new proofs.

The checked run has 1,262 frames, including seven native control frames, 9,563
header appearances, 6,293 recorded type actions and 26 refusal controls. The
largest frame is 61,251 bytes. The deep control starts in an original context of
10,000 binders. Across the overlapping cuts, 5,806 expected-body component
appearances require the extended context rather than the member's preceding Γ.
Twenty displayed reference appearances point to local definitions. No reduced
term pool is loaded and no new native judgment is produced.

Run from the repository root:

```sh
node scripts/test-proof-atlas-occurrence-context-frame.cjs
node scripts/test-proof-atlas-occurrence-context-frame-browser.cjs
python3 research/proof-atlas/occurrence-constructions/verify_context_frame.py \
  --lean /absolute/path/to/lean-4.33.1/bin/lean \
  --workdir /private/workdir/context-frame --check
```

The corpus retains its existing provenance: four project profiles in
published-15, one in working-26, and twenty publisher-attributed AI declarations.
Only seven AI declarations currently have the supplementary native let records.
No declaration name or shared node identifier extends coverage to another source
hash or unrecorded occurrence. Original mathematical source modules are not read
or published by this work.

## Remaining evaluation

The optional **Context frame** control uses the same occurrence construction
reader, expression glyphs, source/type inspection and explicit Γ boundaries. A
frame has an independent member limit of 1, 4, 13, 32 or 64; source node/depth
controls do not change its meaning. Frame mode and the limit are saved in the
URL. Selecting a member/header changes the original source inspector; **Focus
source** refines the root and provides a shareable occurrence link. A body without
a context-chain record shows its available primitive construction with an
explicit notice. Source mode and application grouping remain available.

The browser audit compares all 251 chain starts across 25 profiles, makes 99
source selections and opens 48 recorded type views. It follows an original local
definition, checks the 57-member frame and budgeted continuation, reloads a saved
frame URL, checks both themes at phone/desktop widths, and verifies missing and
delayed optional scripts. Four accessibility audits pass. These finite checks do
not prove general renderer correctness. The article default and blog are unchanged.

General native-consumer correctness, paged synthetic/deep profile adapters, other
rule families, semantic abstraction and measured proof-inspection tasks remain open. Frame size
reduction does not by itself establish improved comprehension. The general
geometric-language program remains active; the blog is unchanged.


## Paged source, construction and type transport

The optional `loading=paged&diagram=construction&group=contexts` lens uses the
same frame protocol and renderer. `ProofAtlasCursorContextFrame` reads source
rows and native construction records through separate bounded cursors. It
compares each proposed member and premise with the actual source fields and
original context depth. Composition compares type syntax fingerprints computed
in each construction's own type table. A missing record or incompatible type
interface leaves the original continuation visible. No complete source or native
archive is fetched by the consumer.

The model retains at most 64 members and 129 frontiers within the existing
128 KiB frame bound. Browser cache limits remain 4,096 source rows, eight native
records of at most 64 KiB, four index pages of at most 128 KiB and one active type
table with a 512-row cache. Constructor previews retain at most 240 characters
per source point and have a separate 256 KiB presentation bound. These are
representation and cache limits, not a total browser-memory bound.

The paged audit compares all 251 chain starts in 25 profiles at member budgets
1, 4, 13, 32 and 64: 1,255 frames, 26,226 source-address actions, 8,985 recorded
type selections and 6,270 constructor previews agree with the complete reader.
The largest observed frame is 61,251 bytes; the largest preview packet is
8,608 bytes. The one-page audit retains at most 256 source rows, 64 type rows and
7,005 decoded native-record bytes. It includes 33 mixed introduction/definition
chains and five displayed links to original local definitions. These counts
include overlapping chain suffixes, not distinct proofs.

A parent's body and its child's conclusion have the same source occurrence but
can come from distinct recorded type components. All 2,464 such joins in the
maximum-budget audit retain their original recording identities. Selecting one
must not silently select the other. Four rehashed-transport refusal controls
check altered source nodes/fields and disposal during a load. Two altered type
interfaces remain explicit uncomposed continuations. These are synthetic
transport controls, not newly discovered mathematical counterexamples.

The browser compares all 251 frames across the 25 profiles, selects 101 source
points and opens 48 exact recorded type diagrams. It checks the 57-member chain,
budgeted continuation, an original local-definition jump, the two recording
identities at a shared body route, missing/delayed frame components and a stale
type selection. Four accessibility audits cover both themes at phone/desktop
widths. No complete source or native archive request occurs.

For `JacobiData.slope_bound_abs`, the proof-root frame exposes six introductions
and then stops at the original local-definition occurrence at depth six, for
which this finite profile has no construction record. Its remaining source
region contains 165,476 occurrences. The frame does not claim to expose or type
that definition's proof steps. Broader native query coverage is still needed to
reach the interior Riccati argument through this lens.

```sh
node scripts/test-proof-atlas-cursor-context-frame.cjs
node scripts/test-proof-atlas-cursor-context-frame-controls.cjs
node scripts/test-proof-atlas-cursor-context-frame-browser.cjs
```

The Lean structural laws above remain separate evidence. Complete-reference
agreement does not prove the JavaScript consumer, a source-module hash or a new
kernel typing judgment. The article and blog are unchanged.
