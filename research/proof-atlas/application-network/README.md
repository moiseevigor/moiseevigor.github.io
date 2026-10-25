# Connected application cuts

This experiment composes the earlier typed application ports into a navigable source-use graph. It tests a general rule on the entire **explicitly selected** application inventory, including the Riccati bound and the separately attributed AI-source samples. It adds no new private source exports or kernel observations. The prior native evidence remains immutable.

[Visual experiment](/projects/proof-atlas/manual/application-network/) · [model checks (gzip)](/public/data/proof-atlas/application-network-audit.json.gz) · [combined evidence (gzip)](/public/data/proof-atlas/application-network-evidence.json.gz)

## Composition rule

A consumer port is identified by a source packet, exact consumer occurrence and ordered slot. The function is slot 0; supplied arguments are slots 1 through n. Following that port's recorded source-use path gives one producer occurrence in its original lexical context. If and only if that exact producer occurrence is another inventoried call, its result box may be shared with the consumer port.

The new derivation checks every native port against the original compiled packet. It also checks that each linked producer's inferred type is literally the same serialized expression as the result type observed at that occurrence, in the same original context. The existing native evidence checks typing, context extension, application-domain conversion and any local-definition abstraction conversions. These are distinct checks; the new graph does not replace them with a same-name, same-type or same-stored-node test.

Two inputs can refer to one producer, but they retain two port identities. Equal stored nodes at different occurrence routes remain separate boxes. A dashed source wire retains every recorded local-definition hop, including its nondependent flag and original binder/value/use routes. Unrecorded fragments, context inputs and a stopped definition path are explicit boundaries. No equation, implication, tactic or premise-necessity interpretation is inferred from an arrow.

## Cut and refinement law

For a retained call set S, every actual port lies in exactly one class:

1. Known producer and consumer both in S: internal use.
2. Known producer outside S, consumer in S: incoming port.
3. Known producer in S, consumer outside S: outgoing port.
4. Both known endpoints outside S: hidden use.
5. Unrecorded producer, consumer in S: visible boundary input.
6. Unrecorded producer, consumer outside S: hidden boundary input.

These six counts sum to every actual input position of the inventoried calls. Retained plus hidden calls sum to the inventoried call count. Adding one adjacent call refines the cut; removing that same call reconstructs the earlier scene exactly. No additive expression-subtree size law is claimed: source regions may overlap. Layout ranks are presentation choices, not a mathematical metric or proof order.

## Finite result

The derivation covers **31 profiles, 162 calls and 787 ports**. It identifies **101 exact application-to-application uses**, seven through local definitions. The Riccati profile supplies **87 calls and 68 uses**, including the AM–GM result feeding a later equality transport through its nondependent binding. All 101 literal producer/result type bridges pass.

One result in the separately attributed `lean_workbook_4274` sample feeds two distinct consumer occurrences. The `samePorts` control instead has two producers with one stored node ID and different source routes; they remain separate. The `shared` control tests rejection of a wrong occurrence with the same stored node ID.

The other **686 ports** do not have an inventoried application producer. They remain explicit inputs; they are not failed typing checks or absent source terms. This inventory was inherited from transport cores, their application producers and the earlier authored controls. It is not complete coverage of every application, hypothesis, elimination, introduction or proof step in these declarations.

Model checks cover 1,122 cuts, 476 expansion/collapse round trips, all 787 selected native input windows, 1,604 exact source selections and 2,361 computed-type selections. Small inventories are checked exhaustively over their nonempty call subsets; every call also seeds deterministic local growth. An independent port-partition implementation checks the scene's accounting. Negative controls include wrong occurrence endpoints, malformed cuts, reordered ports, changed source identities, damaged assets, budget refusal and a delayed selection after changing focus. Browser checks pass for all 162 call-box selections and 101 source-use wire selections. They also cover the eight-box budget, shared-result and distinct-occurrence controls, keyboard selection, four accessibility audits across desktop/mobile and light/dark themes, release, delayed data and damaged topology/native pages. Whole source/native archives are blocked throughout. These are interface and provenance checks, not an evaluation of human comprehension.

## Memory and navigation scope

At most eight call boxes are retained. Connection lists and input lists show at most eight rows per page without merging ports. One selected native four-argument window remains resident; inspecting another releases it. Producer-type inspection uses the producer’s original context, while expected-input and result types use the consumer context. These are displayed separately even when their type expressions convert. Original source-path and computed-graph bounds are inherited from the application-port reader and are checked again.

One complete compact topology is loaded with explicit limits of **128 inventoried calls, 1,024 ports and 2 MiB decoded bytes**. The observed maximum is 212,804 decoded bytes. This is a bound for this finite topology layer, not a measurement of total browser heap and not a solution for arbitrarily large application networks. Paged global topology, reusable region interfaces and whole-proof layout remain open. The complete source and native archives are blocked in selected-window tests.

## Reproduction

```
node research/proof-atlas/application-network/build.cjs --check
node scripts/test-proof-atlas-application-network.cjs --check
node scripts/build-proof-atlas-application-network-evidence.cjs --check
```

The first command authenticates the earlier complete native records and compiled packets offline, validates the ports, reconstructs the topology and checks every linked type bridge. The second uses authenticated pages, with whole-source and whole-native archive requests blocked, to test cuts and selected windows. It does not rerun Lean; the exact pinned Lean 4.33.1 observations and environment hashes remain in the [earlier evidence](/research/proof-atlas/application-ports/application-ports-evidence.json).

Build the production site and run `scripts/test-proof-atlas-application-network-browser.cjs` with the documented local browser dependencies. The experiment is a local manual chapter; it does not alter the published blog, claim semantic compression or measure human comprehension.
