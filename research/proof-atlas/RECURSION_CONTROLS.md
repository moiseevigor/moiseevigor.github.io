# Recursive-premise controls

These are assistant-authored synthetic examples, not an independently sourced
AI theorem-solving benchmark. The Python fixture generates a core-only module
and three theorem terms with deliberate structural sharing. It does not read
or publish either private SE(2) source snapshot.

Use Lean 4.33.1, Python 3 and Node.js:

```sh
python3 research/proof-atlas/build_recursion_examples.py --workdir /tmp/AtlasRecursionExamples
node scripts/test-proof-atlas-recursion-examples.cjs /tmp/AtlasRecursionExamples
```

The work directory must not exist. The driver requires a 30 GiB free-space
reserve, limits each compiler stage to 8 GiB resident memory and 120 seconds,
and limits each output file to 64 MiB. It stops on a failed monitor or exceeded
budget. CI uses an explicit 5 GiB disk reserve on its disposable runner.
Compiler logs and resource records remain in the private work directory.

The rebuild compiles the fixture, exports every declaration owned by its
module, and checks native type queries against the exact exported DAG.
A separate oracle reads native `Expr` objects before serialization. It checks
minor-input roles and counts references in the small source branch bodies
with a separate occurrence traversal capped at 100,000 visits. Its comparisons
with the browser model cover exact routes and source contexts; proof
irrelevance is not used to establish source wiring.

The public audit checks all 85 declaration packet hashes and native judgments.
With a rebuild directory, it also compares all fresh packet hashes, packed
judgment structures and the oracle's 38 minor inputs. The compiled module hash
is environment provenance rather than a cross-path byte-reproducibility claim.
The module generator's SHA and generated source SHA are in the public manifest.

To replace the public compiled controls after the audits pass:

```sh
node research/proof-atlas/publish_recursion_examples.cjs /tmp/AtlasRecursionExamples
```

This writes only compiled packets, checked judgments and provenance to the
website. The reproduction fixture and extraction tools are public test code.
Original project sources, compiler logs and source archives are not copied.

`shared_induction_d` duplicates the induction proof through `d` nested
conjunctions while retaining a shared expression DAG. Its statement and body
together have `(10*d + 60)*2^d + 2` occurrences and `6*d + 37` stored nodes.
The body's references to its outer natural-number input equal
`(1 + 2*d)*2^d`. The tests compare these independent closed forms with the
exported exact counts and a scoped DAG counter. These are tests of sharing
and representation, not theorem difficulty or performance on arbitrary proofs.

The rule classifier accepts direct fields and same-recursor calls whose major
is a field, optionally through a lambda family. Parameters, motives and minor
premises must be forwarded unchanged. Other schemes are unclassified. Rule
nodes live in a separate `kernel-rule` namespace. They never acquire source
proof routes or execution-event meaning. Source usage is unavailable if an
exact lambda prefix was not queried or a bounded traversal fails.
