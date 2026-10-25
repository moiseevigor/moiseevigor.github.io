# General application ports

The source-use rule now covers ordinary applications, beyond the value and equality ports of transport. Each selected call keeps its exact source function field, every supplied argument in order, and the typed result. The viewer retains the function and at most four argument observations at once. It uses the same component in the [manual experiment](/projects/proof-atlas/manual/equality-transport/#application-ports) and the paged proof explorer under **Show application ports**.

## What is checked

The native observer starts with a closed compiled term. For the Riccati proof it compares all serialized fields and roots with the pinned compiled module. Other records are checked by packet replay without their original declaration, original proof module or private Riccati modules. Original private source files are not read.

For each inventoried call, it checks the function input and every actual argument slot. The expected argument domain comes from the successive kernel-checked applications of the actual source function. Producer expressions are checked in their original contexts, then after context extension to the caller. A source argument, or an explicit chain of local-definition values, chooses the producer. Type equality, proof conversion and stored-node identity do not choose a connection.

Input role and binder visibility are independent:

- **Proof / type / value** is recorded from Lean's typing observation. A proposition expression is a type; an inhabitant of that proposition is a proof.
A type family can have a function type rather than a sort as its inferred type. Such an input is labelled value and callable under this recorded classification; these labels are not a complete semantic taxonomy.

- **Callable** means the checked normalized input type is a Π expression. A proof can also be callable. A callable result does not imply that an argument is missing from the source.
- **Explicit / implicit / strict implicit / instance** comes from the Π binder at that actual application slot. Implicit and instance arguments remain actual compiled fields.

The function is port 0, separate from argument slots 1 through n. No source argument is dropped when it is implicit, repeated, apparently administrative or unused by the function body. No saturation or mathematical-strategy classification is inferred from a name.

## Type references and source uses are different relations

When the source function's type has a literal Π prefix, the observer records each formal domain's references to earlier arguments. It checks a separate bridge: substitute the actual preceding arguments into that formal domain, then kernel-check the current argument against it and compare it with the domain at the actual call.

The client independently walks the serialized formal domain and checks its binder indices, domain route, visibility and earlier-slot references. A type-reference address belongs to the **function input's computed type graph**, not the argument's source subtree. It keeps the native owner hash, call route, input ID, root and computed child route.

A link `arg i → type of arg j` means a literal reference in this formal type, with the recorded instantiation bridge. It says neither that argument j's value uses argument i nor that either is a mathematically necessary premise. The nine-argument lambda control returns only its last argument even though every supplied argument remains a checked source field.

If the raw function type is a local type alias, the literal Π prefix can be unavailable while application typing succeeds after normalization. The `aliasType` control tests this distinction. The interface marks that boundary and offers the separately checked normalized function type. It does not pretend that normalized binders were original source fields.

## Finite observations

The inventory contains **31 profiles, 162 application occurrences and 787 ports**: the function and every actual argument at these occurrences. It includes 87 Riccati applications, source producers from the previous transport-composition inventory, the separately attributed AI-source sample, the earlier controls and eight fresh authored controls.

The native roles comprise **353 proof, 252 type and 182 value inputs**. Argument visibility includes **272 explicit, 328 implicit, one strict implicit and 24 instance positions**. There are 191 callable inputs and three callable results in this finite inventory. These are typing classifications, not a semantic decomposition of the entire proof.

All **207 four-argument windows** match complete-data scenes. The formal domains expose 589 earlier-argument references; 205 refer to arguments outside their current display window. One literal-prefix boundary is recorded. The model verifies every source and computed address and retains all actual ports across window changes.

The authored controls test dependent proof domains, higher-order functions, repeated type arguments sharing a stored node, all four binder visibilities, nondependent local bindings, a callable result, a nine-argument call across three windows and the type-alias boundary. The old transport and source-use evidence remains immutable and separately identified.

## Geometry and resource boundaries

Solid edges connect exact source function/argument fields to the application result. A dashed first segment passes through an explicitly recorded binding path. Context inputs retain their original binder buttons. The separate, labelled formal-type references follow the manual's bound-reference convention. Off-window source arguments are identified without assigning them unvisited type observations. At most eight type-reference rows are shown at a time.

A window contains at most six expression boxes: result, function and four arguments. The source path store is capped at 4,096 rows and 4 MiB of serialized rows, with a separate 256-row fetch cache. At most five computed graphs load fully, each capped at 65,536 nodes and an 8 MiB decoded page. These are component bounds, not measurements of total browser heap.

The observed maxima are 115 retained source rows, 204,885 computed nodes and 6,495,537 decoded native-page bytes in one window. The large computed example is an authored dependent-family stress control. It is not evidence of human comprehension or performance across massive AI-generated proofs. Complete source and native archives are blocked in selected-page tests; exceeded bounds fail explicitly.

## Reproduction and limits

```
python3 research/proof-atlas/application-ports/verify.py \
  --lean /absolute/path/to/pinned/lean \
  --cache /absolute/path/to/verified-checking-cache \
  --riccati-build /absolute/path/to/pinned-compiled-modules \
  --workdir /new/verification-directory
node research/proof-atlas/application-ports/publish.cjs /new/verification-directory
node scripts/test-proof-atlas-application-ports.cjs
```

The native verification records Lean 4.33.1, dependency hashes, compiled-module hashes, producer hashes and separate compiled/replay environments. Only compiled term data, derived observations and authored synthetic control source are included. Private original Lean/tactic scripts remain excluded.

After the production build, run `scripts/test-proof-atlas-application-ports-browser.cjs`. Model, browser and historical-compatibility evidence are separate. The inventory is selected and explicit; it is not all applications in all project or AI-source proofs. Literal type-prefix normalization, general construction composition beyond application fields, whole-proof layout and measured inspection tasks remain open research.
