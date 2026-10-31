# Functions over selected source-use regions

The seven-call Riccati AM–GM region now has a kernel-checked conditional
function over its five boundary proof arguments. All seven original results
are returned. The retained original context reduces from ten entries to the
data variables `J : JacobiData` and `p : Real`. The other thirty boundary
positions retain their fixed source expressions and original addresses.

[![Checked Riccati region function](riccati-module.svg)](riccati-module.svg)

[Open source-linked SVG](riccati-module.svg) · [PNG](riccati-module.png) ·
[Native terms](native.json.gz) · [Verification](verification.json.gz) ·
[Independent reconstruction](model.json.gz) ·
[Production source links and layouts](production-check.json.gz) ·
[Paged-network regression](network-regression.json.gz) ·
[Complete evidence manifest](evidence.json.gz).

`A`, `B`, `D` and `Q` are display aliases defined in the figure. They shorten
fixed compiled expressions. The arrows are six actual internal input uses;
all five input cards and seven result cards select exact original source
occurrences. Layout is schematic and carries no mathematical metric. The
compiled function is not yet a computed component in the interactive folded
region reader. This result adds a typed artifact and a source-linked schematic.

## Construction

Select exact application occurrences with an acyclic order of internal source
uses. Keep every function/argument position, source owner, lexical context and
local-definition path. A separate complete-inventory quotient check applies
to graph grouping; kernel typing does not supply that graph guarantee.

Reconstruct each application in topological order. An internal input uses the
already computed producer, including repeated uses of that producer. Boundary
positions are either supplied parameters or retained source expressions,
according to one of three predetermined policies:

1. **All boundary positions:** introduce parameters for heads, types, values and
   proofs. Later argument domains come from the rebuilt function's literal Pi
   telescope. There is no speculative type equality or unification.
2. **Proof arguments:** supply boundary arguments with native proof roles;
   function heads, type arguments and values remain fixed source expressions.
3. **Proof and function inputs:** additionally supply proof-valued heads.

Every call result becomes a local definition. A nested `PProd` returns every
original result in inventory order. Newly constructed local definitions use
explicit computed annotations; original source annotations stay in the records.

The construction uses one exact common original prefix. Suffix source lets are
unfolded by their actual definitions. A needed suffix lambda remains
`UNSUPPORTED_SCOPE`; callable types without a literal exposed Pi remain
`UNSUPPORTED_TYPE_FORM`. Neither is a kernel-negative verdict.

The complete function and its inferred type determine a syntactic context
support closure, including retained header dependencies. Projecting to that
closure and closing the retained prefix must pass a new empty-context kernel
check. Supplying the original source values must recover the complete original
result tuple, and each original result portal must separately type-check and
convert in its original context. A closed typed equality witness records the
specialization relation. Conversion remains separate from literal source
reconstruction.

## Predetermined candidates and outcomes

The regions were fixed before checking. No failed candidate is replaced with
an easier region. The AI region is the connected neighborhood reached from its
existing inventory focus; that component has only two calls.

| Source region | Calls | Boundary positions | All positions | Proof arguments | Proofs and heads |
|---|---:|---:|---|---|---|
| Riccati bound | 7 | 35 | Rejected at `25:3` | 5 inputs; context 10 → 2 | 12 inputs; context 10 → 2 |
| `lean_workbook_plus_6206` | 2 | 11 | Rejected at `0:3` | 3 inputs; context 13 → 3 | 5 inputs; context 13 → 3 |
| Authored diamond | 4 | 5 | 5 inputs | Fixed-input closure | Fixed-input closure |
| Authored shortcut | 3 | 4 | 4 inputs | Fixed-input closure | Fixed-input closure |
| Authored repeated result | 2 | 3 | 3 inputs | Fixed-input closure | Fixed-input closure |
| Authored proof shortcut | 3 | 4 | 4 inputs | 1 input | 4 inputs |

Sixteen candidates pass. Ten have new independent inputs; six are fixed-input
closures. The two rejected candidates have explicit kernel **non-conversion**
verdicts between the actual and expected input types, not comparison errors
or resource stops. Their partial construction records remain available.

The rejected cases show a limitation of this parameterization rule. Acyclic
source-use edges and original per-call typing do not make every boundary
position freely replaceable. Type/value positions can constrain the types of
internally produced proofs. Other constructions with inferred fields,
transported types or additional constraints are not ruled out.

The Riccati five-input function uses the five facts already visible in the
proof-input projection: nonnegativity of `A` and `B`, the product identity,
the square-root product identity and the square-root square identity. The new
result is a typed common-context function and source specialization, beyond
that earlier presentation projection. These inputs are not asserted to be
mathematically necessary, minimal or the original theorem's assumptions. The
selected result is an intermediate inequality before the theorem's remaining
division steps.

## Independent checks and provenance

The JavaScript model reconstructs all sixteen complete raw, projected and
closed functions, source specializations and original result tuples. It also
reconstructs the complete failing applications in both rejected cases. The
audit checks 128 binding records, 165 visited boundary positions and 52
internal-use appearances across the overlapping candidates. Native-observed
binder domains and tuple universe annotations are inputs to this constructor
audit; it does not independently infer Lean types. An independent fixed-point
closure agrees with every retained-context selection.

Original source/native ownership and complete call records are checked against
the existing authenticated pages. A separate DFS agrees with the inventory-wide
quotient checks. Forty model mutations reject changed input positions, binding
order and context selection. Eight malformed requests fail in fresh native
processes, with ordinary input refusals. One well-formed lower-prefix probe
reports an unsupported local-lambda requirement rather than inventing a type.

Fresh native checking uses Lean 4.33.1 and hash-inventoried kernel constant
data with `loadExts=false`. The Riccati declaration's complete type and body
match the pinned compiled packet. Original AI and authored declarations/modules
are absent from their replay environments. The dataset publisher supplies AI
generation attribution; this is not an independently observed generation run.

Dependency binaries and shared kernel libraries are fingerprinted. Cache
attribution is distinguished from an independent dependency rebuild. Only
authored tooling, compiled terms and verification records are added. Original
private proof scripts and raw logs are excluded. The temporary recovered
constant data are retired after terminal native checking; cache archives and
existing support modules stay unchanged.

## Bounds and remaining questions

The experiment accepts at most eight calls, 64 supplied arguments per call and
512 source path fields. Original support and projection operations retain their
262,144-state guards. Public computed graphs have at most 131,072 rows; native
processes retain allocation/RSS/time/output and disk-reserve guards. These are
component limits, not a whole-program memory theorem. The offline model and
native checker hold complete selected source graphs; the 91,424-row AI source
is not paged by this construction.

General dependent-region interfaces, required local-lambda closure, automatic
boundary constraints, normalization of callable type aliases, general
evaluator/codec refinement, semantic compression and measured human benefit
remain open. The accepted functions are finite checked artifacts, not a
general typing-preservation theorem. The article and blog are unchanged; the
general research goal remains active.

## Reproduction

Frozen structural checks require Node:

```sh
node --max-old-space-size=2048 research/proof-atlas/region-input-functions/check.cjs --check
node research/proof-atlas/region-input-functions/figure.cjs --check
node research/proof-atlas/region-input-functions/evidence.cjs --check
```

After the actual production build, serve `_site_production` and run
`check-production.cjs` with Playwright and axe-core available through
`NODE_PATH`, and `ATLAS_ORIGIN` / `ATLAS_CHROMIUM_PATH` set for that server
and browser. The production audit checks all thirteen exact source portals,
four desktop/mobile and light/dark layouts, horizontal keyboard panning,
program links and source/build/served byte identity. The original paged
network browser suite writes its separate current regression report in this
folder; preceding frozen reports stay unchanged. These are interface and
delivery checks, not new native typing or comprehension evidence.

For fresh native checks, use new private work directories:

```sh
node research/proof-atlas/region-input-functions/prepare.cjs /private/tmp/new-region-input-plan
python3 research/proof-atlas/region-input-functions/build.py \
  --lean /path/to/lean-4.33.1 --workdir /private/tmp/new-region-input-build
python3 research/proof-atlas/region-native-types/recover.py \
  --lean /path/to/lean-4.33.1 --reference /path/to/pinned/restoration.json \
  --index /path/to/pinned/cache-index.json --workdir /private/tmp/new-kernel-data
python3 research/proof-atlas/region-input-functions/verify.py \
  --lean /path/to/lean-4.33.1 --build /private/tmp/new-region-input-build \
  --plan /private/tmp/new-region-input-plan --runtime /private/tmp/new-kernel-data \
  --support /path/to/previously-checked-riccati-support \
  --workdir /private/tmp/new-region-input-native
python3 research/proof-atlas/region-input-functions/check-negative.py \
  --lean /path/to/lean-4.33.1 --build /private/tmp/new-region-input-build \
  --plan /private/tmp/new-region-input-plan --workdir /private/tmp/new-region-input-refusals
```

`--publish` on the native verifier deliberately regenerates the frozen compiled
records. Runtime archive recovery is owned by its fresh work directory. Current
public artifacts do not require restoring the original private sources.
