# Recovery certificates for captured expressions

Twelve structural laws, three typed control declarations and eight finite certificate instances pass Lean 4.33.1 compilation. The [native verification](verification.json.gz) records 39 proof declarations, with no axiom dependencies beyond `propext`, 1,557 exact constructor-row roundtrips and three refused altered certificates. This is a structural result about actual `Lean.Expr` values. It does not retype the represented mathematical proofs.

## Rule

A source expression may be represented by a fresh capture variable together with its recovery image. The image must contain no loose de Bruijn variables. It may retain named free variables belonging to an explicitly supplied external context. Thus `ClosedImages` in [Recovery.lean](Recovery.lean) means closed against surrounding expression binders, not a closed kernel proof.

Fresh names and external-context ownership are supplied by the producer and checked for these inputs; the algebraic relation does not encode a Lean `LocalContext`. An opened constructor preserves its kind, payload and ordered children. A capture records the complete source subtree and the exact identity of its replacement variable. An unchanged source free variable must have an identity recovery image. Those are the premises of `Rewrite σ source template`, indexed by actual `Lean.Expr` values. Bound references, function/argument order, binder annotations, let flags, universes and metadata remain distinct data.

For a certificate `h : Rewrite σ E T`, the general law is

\[
\operatorname{plug}_{\sigma}(T)=E.
\]

The map is simultaneous: it does not recursively apply itself to an inserted image. Images without loose de Bruijn references preserve lexical scope under enclosing binders. This is why a source pattern depending on an enclosing bound variable cannot simply become an argument-free capture. `open_cut_refused` proves the simplest refusal; `open_image_breaks_scope` shows that an unrestricted substitution need not preserve scope.

The module also proves composition of recovery maps, recovery through two successive certificates, uniqueness of the recovered source for a fixed map, and exact weighted occurrence accounting. Each capture port contributes the occurrence count of its complete image:

\[
W_{\sigma}(T)=|E|.
\]

These are structural statements. A proof of `Scoped` checks explicit binder depth only. A retained free-variable or metavariable identifier does not establish the validity of its external context or assignment. No mathematical typing or semantic interpretation is inferred from the certificate.

## Connection to recorded terms

[instances.json.gz](instances.json.gz) contains three recorded Riccati templates, four preceding authored native controls, and one additional authored vocabulary control. The vocabulary control retains all twelve constructors, including unresolved identifiers as data; it is not a mathematical proof.

Each recorded case retains the parent inventory/case or control-record hash, original context order and stable binding keys. `prepare.cjs` opens recorded outer references into fresh, named context variables and reconstructs the maximal recorded rewrite. Its certificate is a DAG with named child proofs, rather than an expanded occurrence tree. A coherent duplicate group records both available targets and the producer's chosen first target; it does not claim that the template uses both variables.

The shared control has 14,507,109,835,375,550,096,474,115 source occurrences, 502 stored rows in the combined raw/opened input, and 167 certificate nodes. It is deterministic authored amplification, not a large AI proof benchmark. The logical `plug` specification must not be evaluated by naive tree recursion on this control. The native replay uses separate bounded memoized executors and comparisons; its recovery cache contains exactly the 167 reachable template nodes.

[The independent model check](model-check.json.gz) validates row accounting, lexical opening, local certificate premises and weighted counts for all eight inputs, and refuses eleven damaged records. It does not replace Lean compilation.

The native gate checks the generated proof module, its axiom dependencies, complete row reserialization, context opening with Lean's `instantiateRev`, and recovery with Lean's `replaceFVars`. All eight inputs pass. Three altered certificate assumptions fail Lean certification: a wrong recovery image, a changed binder annotation and a wrong source root. These are compiler refusals with nonzero exits and diagnostics, not resource-limit stops. Generated instance sources and raw diagnostics stay in the temporary run directory; published inputs remain compiled-term data and authored tooling.

## Exact accounting in the Riccati example

The first source lambda has 105 expanded occurrences. Its template has 81, including two capture variables, each used once. Each recovery image has 13 occurrences:

\[
81-2+13+13=105.
\]

This count includes implicit arguments, types and instances. It is not a visible-glyph count or a measure of mathematical proof compression. The other recorded lambdas recover 103 and 191 occurrences from templates with 79 and 167 respectively. Original source ownership and computed-template ownership remain separate in the [existing visual rule](/projects/proof-atlas/manual/paged-network/#source-lambdas).

The [evidence check](evidence.cjs) binds the saved verification, model, native rows and documentation to their current bytes. Run `node research/proof-atlas/source-template-laws/evidence.cjs --write` after verification to produce [the evidence bundle](evidence.json.gz); omit `--write` to check it. Recorded compiler/library identities are an identity sample, not independent authentication of the complete toolchain.

## Trust and remaining work

- `Recovery.lean` proves laws for the explicit constructor relation and map. It does not prove refinement of the stateful source matcher, the memoized native executors or the JSON codec.
- The finite bridge covers the complete current eight-input package, including the all-constructor data control. It does not prove producer or executor refinement for arbitrary inputs.
- Scope preservation and literal recovery do not imply mathematical typing preservation, minimal premises, semantic compression or improved comprehension.
- A recovery map is necessary evidence. The typed Nat control `capturedFunction a x = x+a` has the same parameterized template at `a=17` and `a=18`, but different values at zero. An unqualified template cannot identify its source.
- The current driver targets the pinned macOS Lean toolchain. It records selected compiler/library identities; it does not independently rebuild the compiler or all core dependencies.

The [production browser check](browser-check.json.gz) checks rendered equations, exact download bytes, evidence search and one recorded source-lambda selection at its original native address. Four desktop/phone and light/dark audits have no WCAG A/AA violations; this is a finite check, not a complete accessibility assessment.

## Reproduction

From the repository root:

```sh
node research/proof-atlas/source-template-laws/prepare.cjs
node research/proof-atlas/source-template-laws/check.cjs --check
python3 research/proof-atlas/source-template-laws/verify.py \
  --lean /path/to/lean-4.33.1/bin/lean \
  --workdir /path/to/a/new-run-directory
```

After building and serving the production site, run `ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/source-template-laws/check-browser.cjs` with Playwright and axe-core available. `ATLAS_CHROMIUM_PATH` may select an installed browser.

The native driver is an installed-core-only macOS check with no network or dependency restoration. It requires 20 GiB free space and confines writes to a fresh run directory, monitored at 256 MiB total scratch and 64 MiB per file. Each command has a 120-second and 8 GiB process-group RSS ceiling. Full-corpus restoration protocols keep their separate reserves. It writes public native/verification records only with `--publish` after every gate succeeds. Keep operational diagnostics out of research posts.
