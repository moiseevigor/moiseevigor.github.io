# Proof Atlas — public research record

**Introduction:** [The Geometry of a Formal Proof](https://moiseevigor.github.io/mathematics/2026/10/11/proof-atlas-research-program/)  
**Interactive visualization:** [Proof Atlas](https://moiseevigor.github.io/projects/proof-atlas/)  
**Public structural data:** [crossing-structure.js](../../public/data/proof-atlas/crossing-structure.js)

## What is public

This directory documents a measurable experiment converting a real Lean 4 theorem's elaborated **type and proof expression** into a structural graph. The anonymized dataset exposes expression occurrence topology and direct reference counts, not proof-term payloads or the Lean source of the private SE(2) manuscript.

The measured benchmark:

| Statistic | Value |
|:--|--:|
| Expression occurrences | 7,288 |
| Structural child edges | 7,286 |
| Bound variable to binder links | 431 |
| Constant-reference occurrences | 2,892 |
| Distinct directly referenced declarations | 42 |
| Longest root-to-expression path | 49 |

The private Lean exporter and validation workflow regenerated the benchmark directly from the theorem. This public projection alone is **not a standalone formal proof certificate**, and a public reader cannot fully reproduce Lean kernel validity from it.

Run `python3 research/proof-atlas/verify_public_data.py` from the site repository root to audit graph topology independently.

## Data contract

The public `crossing-structure.js` assigns a single `window.PROOF_ATLAS_DATA` object. Fields:

- `parent[i]` is the parent occurrence index, or -1 for one of two roots.
- `kind[i]` is a one-character index into `kinds`, retaining the Lean constructor class but omitting payload.
- `size[i]` is the number of occurrences below and including occurrence `i`.
- `binder` contains directed pairs from each bound-variable occurrence to its enclosing binder occurrence.
- `deps` contains direct declaration-use counts and occurrence indices, with most declaration names anonymized.
- `stats` is a verified summary from the original exporter.

The index is **not** a stable Lean source location. Internal provenance remains private until a deliberate release.

## Scope and next research step

- The expression graph is real, but its layout (radial coordinates and node colors) is not a mathematical invariant.
- A dependency appearing as one constant reference does not reveal the structure of the referenced lemma's internal proof.
- The diagram `endpoint coverage + monotonicity → existence + uniqueness` is manually annotated and must not be presented as an automatically certified compression.
- Structural fingerprints are counts of similar serialized syntax shapes, not mathematical equivalences.
- The next step is to export transitive local lemma certificates, preserve binder/assumption scope, and test certified semantic module boundaries.

This directory is intended for **significant research artifacts** and stable methodology, not a daily experiment log.
