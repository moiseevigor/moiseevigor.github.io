# Result-use path folding

A general bounded fold for the existing application-cut reader. It uses exact source-use identities and recorded roles; no callee-name or type-text heuristic chooses a mathematical step. No new private source or native Lean record is exported.

## Rule

Start at a selected inventoried application occurrence. Follow its result only when the reverse index records **one input position** using that result. Stop when there are no further inventoried uses, more than one use, or the selected call budget is reached. Two ports of the same consumer count as two uses. At a branch, the reader must choose an exposed connection instead of silently discarding another use.

A consumer can have other inputs. They become side inputs of the folded path. Retain every function head, supplied argument, visibility, recorded role, original producer/use address, local-definition hop, nondependent flag and original context. Function heads are counted separately from proof arguments, even when their native type classifies them as proofs.

For k calls, the fold follows k−1 particular input positions. The exact input partition is:

    actual input positions = followed path uses + side inputs.

Every constituent result remains an exposed portal with its own source address and context. The first and last type summaries are convenient endpoints, not a claim that intermediate results are unused elsewhere. The application inventory is finite and incomplete; a degree of one is **one inventoried use**, not globally single-use syntax or a proof of premise necessity.

The inverse reconstructs the original retained cut, including all calls, inputs, side connections, source-use witnesses and global cut accounting. The visual module has a separate `source-use-path` identity. Its derivation SHA-256 covers the rule, inventory header/scope, ordered original call records and stopping boundary. It never acquires a fabricated Lean expression address. The module is not itself a newly checked Lean typing judgment.

## Riccati case and a rejected shortcut

Filtering to proof-producing calls removes **zero of the 87** calls in the selected Riccati inventory. Proof/type/value classification alone is insufficient for useful compression here.

The unique-use rule instead follows the AM–GM result through calls **75 → 25 → 26 → 27**, ending at the recorded inequality

    2 * (J.d p * |J.s p| * √(J.z p * (1 - J.z p) * J.Dz p)) ≤ |J.T1 p| + |J.T2 p|.

The first result is `2 * √(|J.T1 p| * |J.T2 p|) ≤ |J.T1 p| + |J.T2 p|`. The intermediate results and equality evidence remain selectable. The fold has 20 actual inputs: 3 followed uses and 17 side inputs. The latter include 4 function heads, 5 proof arguments, 6 type arguments and 2 value arguments. The contexts are Γ10, Γ13, Γ13 and Γ13. The first connection retains its original nondependent local-definition hop; these contexts are not silently identified.

This folds four boxes into one reversible module. It does not establish that a person understands the argument faster. It also does not recover the entire Riccati proof: the last result has no further **inventoried** consumer in this finite application graph.

## Delivery and scope

The fold uses the same source, native evidence and paged topology as the application cut. It retains at most 8 calls, at most 4 MiB of original call records, one four-row call-page cache, one 32-row reverse-page cache and two branch records per cursor. Following a unique use reads one reverse row directly, with one separate successor ticket. There is no scan of all consumers. The derivation input is capped at 4 MiB and the serialized derived model at 8 MiB. Source/native inspectors retain their existing separate bounds. These are component/serialization limits, not a total JavaScript heap measurement.

Source-only paths use the same structural rule but keep every role and per-call type unobserved. Their type controls remain disabled. Their module contains no native typing owner. A continuation starts at the next consumer; its incoming source reference retains the preceding result without caching an unbounded history.

The runtime refuses stale continuations, damaged pages, inconsistent reverse/input witnesses, missing fields and exceeded budgets. Missing optional path code leaves the ordinary application cut available. Expanding or collapsing an ordinary cut retires its saved fold; merely switching folded/separate presentation preserves the current native selection.

## Checks

`model-check.json` records checks against the complete earlier finite topology, every native seed and multiple budgets, independent input partitions, inverse round trips, original native result selections, altered-record refusals, stale reverse-row requests and samples from the 201,340-call source-only index. The original native source/type evidence remains immutable. Browser and delivery checks are recorded separately after a production build. No blog publication or general comprehension claim is part of this experiment.
