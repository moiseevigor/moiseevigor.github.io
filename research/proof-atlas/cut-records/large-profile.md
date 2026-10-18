# Larger source-table profile

The original native verifier retains its 131,072-node bound and frozen decoder.
`verify_large.py` is an explicit 262,144-node profile. It uses the same name,
universe, binder and Boolean-metadata helpers, six-array native roundtrip,
expression-indexed cuts and lexical checks. It does not import the original
mathematical modules or reconstruct their tactic histories.

Two kernel-checked compatibility statements relate the profiles. If a packet's
kind table parses and has at most 131,072 entries, their pure `decode` results
are equal. Their `exact` roundtrip results are equal under the same condition,
including errors. These statements use `propext`, `Classical.choice` and
`Quot.sound`. They establish legacy behavior agreement, not general decoder
correctness or mathematical typing.

## Checked inputs

Four existing public synthetic packets contain 196,617, 196,626, 196,627 and
196,634 stored nodes. They exceed the original table bound. The larger profile
reconstructs their complete native graphs and checks 25 sparse cuts. A separate
10,005-node syntax control has a 10,000-application chain under a binder; its four
cuts test deep source reconstruction without drawing the chain. The control is
not registered as a kernel-checked mathematical declaration.

The five inputs yield 29 cuts, 16 refinements and three retained variable uses.
An independent original-path walk agrees with every emitted native target. A
valid focused cut in the largest packet supplies the positive for 22 native
changed-record controls, including a reference redirected to another genuine
enclosing binder. The mutations bypass the Python validator. Three separate
table-bound controls exercise raw decoder tables at 131,072, 262,144 and 262,145
entries; these tables are policy controls, not canonical proof graphs.

Selected routes remain limited to 512 slots. The deep control's terminal
variable lies beyond that limit and receives no direct variable-cut claim. Its
original expression remains inside a hole. This distinguishes complete source
reconstruction from complete occurrence navigation.

The compiler processes are serial, terminate on observed RSS above eight GiB or
elapsed time above 120 seconds, and have a 64 MiB output-file limit. Source and
request reads have 64 MiB bounds. The local default free-space reserve is 30 GiB.
These are process/input checks, not a proof of total-memory behavior or support
for arbitrary source sizes. Other metadata payloads, elaborator environments,
mathematical source typing, verified rendering and comprehension remain outside
this profile.

## Reproduction

Run from the repository root with core Lean 4.33.1. No mathematical project or
dependency rebuild is required. Requests use the original source-cut wire format
and separately supplied trusted inventory metadata.

```sh
node scripts/test-proof-atlas-large-cut-inputs.cjs
node scripts/build-proof-atlas-large-cut-negative.cjs
python3 research/proof-atlas/cut-records/verify_large.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-large-native \
  --requests /tmp/atlas-large-source-cuts/source-[0-4].json
python3 research/proof-atlas/cut-records/audit_large.py \
  --report /tmp/atlas-large-native/verification.json \
  --requests /tmp/atlas-large-source-cuts/source-[0-4].json \
  --output /tmp/atlas-large-native/audit.json
python3 research/proof-atlas/cut-records/verify_large_controls.py \
  --lean /absolute/path/to/lean-4.33.1 \
  --workdir /tmp/atlas-large-native-negatives \
  --request /tmp/atlas-large-source-cuts/negative-source.json
python3 research/proof-atlas/cut-records/build_large_evidence.py \
  --positive /tmp/atlas-large-native/verification.json \
  --negative /tmp/atlas-large-native-negatives/verification.json \
  --audit /tmp/atlas-large-native/audit.json \
  --requests /tmp/atlas-large-source-cuts/source-[0-4].json --check
```

The public summary retains source and code hashes, exact native-output hashes,
cut/refinement counts, compatibility theorem axioms and rejection results.
Resource records and raw native logs remain outside the published summary. The
deep control is labelled serialized syntax without a mathematical typing claim.

[Profile decoder and compatibility proofs](LargePacket.lean) ·
[Indexed-cut adapter](LargeNativeCut.lean) · [Native controls](LargeRejects.lean) ·
[Compiled evidence](/public/data/proof-atlas/large-source-cuts-manifest.js)
