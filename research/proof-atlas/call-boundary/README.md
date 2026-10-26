# Reading the boundary of the selected construction

The folded region initially showed pooled proof inputs. That is useful for finding repeated sources, but it does not explain the arguments of a selected construction. The default boundary sheet now follows the selected call and retains every boundary role, including the function, implicit types, values and instances. The earlier pooled projections remain selectable.

## View rule

For a selected call in a retained region, its ordered input positions split into two disjoint sets: internal source-use wires and boundary inputs. Their union is exactly the original call's function and argument slots. The boundary sheet shows the latter, four positions per page. It does not repeat the internal wires or claim that the boundary list alone is the complete call.

Each native row presents the actual input term and its recorded expected type in the consumer's original context. A collapsed original-producer detail retains the producer term, its type in the producer's original context, source kind, local-definition hops and source identity. These contexts can differ. The expected type is the instantiated function domain, not a type guessed from printed term text. Inspecting an input selects its original consumer slot. Reading another call cancels the old page; inspecting another slot of the same call preserves paging.

The observer checks the immutable region, inventory, source packet, native owner, call, input slot, role, visibility, original routes, binding hops and contexts before returning a row. Computed producer-type and expected-type addresses retain separate components and their original query owner. Proof-valued functions and arguments share the existing source-pool identity when they have the same original source. Binder identity uses its qualified node and route; display metadata remains separate. Repeated names and shadowed binders do not establish identity.

Source-only rows expose original structural addresses and known use links. They contain no inferred term text, type or native owner and make no native-inspector requests. Selecting a call outside the folded region clears this region-local sheet.

## Riccati example

In the seven-call region of `JacobiData.slope_bound_abs`, selected call 25 has five actual input positions. Its equality argument `25:3` comes from call 76 and its inequality argument `25:4` comes from call 75. The remaining boundary positions are the function `Eq.mp` and its two implicit proposition arguments. Showing only proof arguments omitted both proposition inputs; showing only the enclosing region's pooled sources obscured which inputs belonged to this call.

The two proposition arguments have expected type `Prop`. The function row retains the recorded telescope `∀ {α β : Prop}, α = β → α → β`. These displays come from the pinned native observation, not a new mathematical interpretation. Reading 26 or 27 updates the boundary to that construction's own inputs while retaining the original source-use wires.

## Bounds and checks

The summary retains at most four primitive rows and 4 MiB. It leases one existing native inspector at a time and disposes it after extracting and validating the row. No completed native graph is retained by this summary. The call, proof-input and rule-head sheets share one summary-loader slot. Existing source/native inspectors retain their separate bounds; this change does not make every underlying computed graph paged.

The [model checker](check-model.cjs) compares 983 boundary-position appearances across 282 call appearances in 106 cuts from 42 native profiles with the original native batches. It checks the complete slot partition, exact terms, expected and producer types, roles, contexts and source identities without modifying the cut. The largest observed summary is 75,292 bytes; the peak is four rows and one native lease. A source-only cut contributes 25 structural boundary positions and zero native requests. Seventeen negative controls reject mismatched evidence, invalid pages, concurrent requests and disposed or cancelled leases.

The [browser checker](check-browser.cjs) checks all seven Riccati calls, ordered boundary paging, exact input selections, a producer/consumer context difference, literal type aliases, one proof source used as both argument and function, shadowed binders, late-page cancellation, source-only behavior and missing-provider fallback. Desktop and phone layouts in both themes have accessibility and document-overflow checks. Existing region, step-reading, proof-input, rule-head, inventory, streaming and result-path suites provide compatibility checks.

- [Model report](model-check.json.gz).
- [Production browser report](browser-check.json.gz).
- [Compatibility reports](compatibility.json.gz).
- [Evidence identities](evidence.json.gz).

These are finite structural, native-reference and interaction checks. They do not establish minimal premises, a common-context typing judgment, improved human comprehension or general semantic compression. The production build precedes the final static report copies; the served application assets are compared with the tested source. Historical reports remain unchanged. This is a local prototype, with no new blog result or public deployment.
