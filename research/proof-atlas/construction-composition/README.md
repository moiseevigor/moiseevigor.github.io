# Typed source-input composition

A construction is more useful than an isolated typed box when its input can be traced to the exact fragment that supplied it. The new collar uses three source boxes: a selected equality transport and the producers of its original value and equality arguments. It is integrated into the existing [transport reader](/projects/proof-atlas/manual/equality-transport/) and paged proof explorer under **Trace source inputs**.

The rule is deliberately local. It covers two ordered application ports of the recorded transport cores. It does not reconstruct tactics, decide mathematical premise necessity or provide a whole-proof semantic summary.

## Rule and provenance

For a consumer occurrence `c` in context ΓB and an original argument occurrence `u`, the producer is either `u` itself or the exact value reached through at most sixteen lexical local bindings. Every hop retains the original use, binder and value routes, De Bruijn index, context position and `nondep` flag. The final producer has its original context ΓA, a prefix of ΓB. A remaining local definition at the limit is an explicit boundary.

The native observer checks:

1. The entire proof body against its declared type. The Riccati packet is compared field by field with the pinned compiled module. Other packets are checked without their original declaration, original proof module or private Riccati modules.
2. The expected domain at the actual ordered application slot, by checking the successive function applications against their Π types.
3. The producer in ΓA, and again in ΓB. The serialized type weakening preserves literal syntax and lexical indices.
4. Kernel typing and type conversion at the input domain.
5. The literal source argument, original local declaration values and final producer occurrence. For bindings, each original closed `letE` is checked against its lambda-application expansion by kernel typing and conversion.

Nondependent bindings need explicit access to their original values: `LocalDecl.value?` hides them by default. Their values are recovered only from the original, kernel-checked source context and checked against the literal source. The native kernel's open-term conversion result is retained as a **diagnostic**, never used to choose a producer. No Meta-level unfolding behavior is inferred from that result.

Source addresses retain name, source hash, packet hash, node and full occurrence route. Computed type addresses use a separate `construction-composition` namespace with the new native evidence owner, input ID, root and route. The earlier transport's native owner remains separate. Stored-node identity never replaces occurrence identity.

## Observations

The finite inventory contains **23 profiles, 71 transport cores and 142 input ports**. It includes the 34 recorded Riccati cores, the earlier packet-only AI-source sample and controls, the dependent-family stress fixture, and eight new authored controls. Four additional selected application suffixes retain the same core and input geometry.

- **Fifteen direct Riccati transport-to-transport uses** are identified by exact source occurrence. The AM–GM input at core 25 follows a nondependent local binding to its original source application instead of inventing a direct transport edge.
- Twenty input producers across the full inventory are separately inventoried transport outputs. Seven ports use local-binding paths, five of those include nondependent bindings. Forty-seven are context inputs. These categories can overlap; fragments and occurrence counts are not disjoint partitions of the proof.
- In `parallel`, the wrong earlier proof has the expected type and passes kernel proof conversion, yet it is not the source occurrence used by the consumer. The connector rejects it.
- In `shared`, the wrong occurrence has the **same stored node**, type and converted term. Its route differs. The connector rejects it.
- In `crossContext`, the two uses have the same stored node but distinct branch binders. The alternative's context is incompatible; no cross-context conversion is claimed.
- In `samePorts`, the value and equality have the same stored node but different source argument routes and ordered roles.
- `aliases` and `weakening` exercise two binding hops and a producer outside an additional consumer binder. `nondepValue` exercises a nondependent binding with a data value, rather than relying solely on proof irrelevance.

The sixteen-binding limit has a separately labelled structural control; it is not an additional kernel replay fixture.

## Geometry and bounds

Solid wires mean direct source argument use. Dashed wires pass through recorded source bindings. Dotted producer boxes denote context inputs. Argument numbers, role labels and original-use/binder/value buttons remain visible; color carries no independent meaning. A type button opens a computed address without moving the proof explorer's source selection. Clicking a source box or binding hop selects its exact original occurrence.

The client first validates the selected transport query, then releases that temporary lease before loading the collar's source paths. Its source-path retention is capped at 4,096 rows and 4 MiB of serialized row content, with a separate one-page / 256-row fetch cache and two source-index pages. Each collar has two computed graphs, each capped at 65,536 nodes; the selected pair loads fully within an 8 MiB page limit. Other collars remain unvisited. The enclosing transport reader owns its own separate lease. These are component residency and traversal bounds, not measurements of total browser heap.

All 71 paged scenes match complete-data scenes in the model checks. The observed maximum is 73 retained source-path rows and 69,658 computed nodes across one pair. Complete source and native archives are blocked during selected-page tests. Unavailable data, malformed pages, wrong hashes, incompatible source owners and exceeded bounds fail explicitly.

## Reproduction

Native verification requires the pinned Lean 4.33.1 compiler, the verified Mathlib checking cache and the previously pinned compiled Riccati modules. Original private source files are not read. The dependency recovery and compiled-module hashes are recorded in `native-verification.json`.

```
python3 research/proof-atlas/construction-composition/verify.py \
  --lean /absolute/path/to/lean \
  --cache /absolute/path/to/verified-cache \
  --riccati-build /absolute/path/to/pinned-compiled-modules \
  --workdir /new/verification-directory
node research/proof-atlas/construction-composition/publish.cjs /new/verification-directory
node scripts/test-proof-atlas-construction-composition.cjs
```

After the production build, run `scripts/test-proof-atlas-construction-composition-browser.cjs`. Unit/native observations, browser interaction checks and unchanged historical evidence are recorded separately. Only compiled term data, derived observations and authored synthetic control source are included. Private original Lean/tactic scripts are excluded.

The general research program remains active. General construction ports, context interfaces beyond a lexical prefix, whole-proof layout and measured inspection tasks remain open.
