# Source occurrence windows

The existing proof reader and native query transport use literal child paths
limited to 512 slots. This optional mode of the same library uses compact
original occurrence addresses. It displays a finite source cut, rather than
rebasing a selected subtree as a new source root. The proof reader remains
available for its recorded type and construction queries.

[Compiled example](/projects/proof-atlas/library/?view=occurrence&edition=published-15&proof=JacobiCore.E_pos) ·
[Deep syntax control](/projects/proof-atlas/library/?view=occurrence&control=deep-syntax)
The control's stored node 3 is the variable at depth 10,001.

An address contains the original root index, exact depth and two bits per
ordered child slot. Share links additionally bind that address to its immutable
packet hash. The address stays in the URL fragment, so a deep path is not sent
as a long HTTP request. Noncanonical encodings, slot 3, nonzero padding and a
different packet hash are rejected.

Each retained occurrence contributes one. A collapsed child contributes its
original expanded size. The retained count plus the collapsed counts equals the
selected subtree's original size. The glyphs and structural roles use the existing geometric vocabulary.
Constructor fields retain their slot order;
`domain` is the exporter's alias for Lean's `binderType`. Solid edges follow
source fields. Dashed edges target the original lexical binder. External binder
references are drawn in a separate context region and excluded from the subtree
count. Universe and other payloads stay in the original packet; this mode does
not give them an additional geometric interpretation.
Kernel reduction-rule roots retain their original labels and separate metadata
namespace. Their binders are rule parameters, not source proof steps.

Variable lookup first follows the path to count entered binder bodies and read
the de Bruijn index. A second source pass locates the corresponding binder's
ordinal. It returns the binder's original compact prefix, without storing a
copied ancestor path for every binder. Lambda/forall domains and let
types/values do not enter the new binder.

Five kernel-checked statements over actual `Lean.Expr` establish path-segment
composition, recovery of the original lexical target, segmented target
agreement, preservation of the original endpoint path, and agreement between
nearest-first indices and oldest-first ordinals. They use `propext`; segmented
target composition also uses `Quot.sound`. These are structural model laws.
They do not verify the JavaScript codec, source decoder, renderer or memory use.

## Finite evidence

The independent source walker checks 4,267 cuts over 2,123 hash-checked packets:
2,098 project snapshot packets, twenty publisher-attributed Goedel source
packets, and five existing large/deep controls. It checks 273 retained binder
links and 11,861 collapsed child boundaries. These are selected cuts, not all
expanded occurrences. Separate small controls exercise all twelve constructor
kinds, shared-node occurrences and 10,000 shadowed binders. Twenty-two changed scenes or
invalid addresses are refused, including a genuine outer binder substituted for
the correct inner binder and an invented proof role; 129 codec lengths exercise prefix/append and
reverse-path construction.

The deep syntax control's variable is directly selectable at depth 10,001 with
2,501 packed bytes. Its binder is the original root. This control has no kernel
typing claim. The browser checks actual source-field and binder navigation,
the two differently bound uses of `JacobiCore.E_pos` node 17, complete/paged
entry links, history, wrong-packet refusal and desktop/phone themes. Source-only
cards do not acquire proof or value roles from shared node identifiers.

## Bounds and limits

- Source: one complete, hash-checked packet, at most 262,144 stored nodes and
  64 MiB decoded JSON. This mode does not page its input source.
- Address: at most 262,144 slots and 65,536 packed bytes. Resolving a binding
  uses two source walks; parsing and encoding have their separate linear work.
- Scene: at most 32 retained occurrences, depth six and four retained nodes per
  layer. Metadata has an 8 MiB limit; reducing the display budget can be needed
  for long addresses. At most 32 external context references can accompany it.
- Optional node-number index: ten bytes per stored source node in typed arrays,
  plus at most one byte per source node to construct a selected reverse path.
  It chooses one representative route. Shared nodes can have other uses.
- Native typing queries and source-cut record format 1 retain their existing
  512-slot bound. Deep navigation adds no unrecorded typing judgment or native
  certificate. Mathematical meaning and measured comprehension remain open.

These are input, data-structure and display bounds, not a whole-browser heap
theorem or arbitrary-size guarantee. The source-module bytes are not verified
by this view. Publisher attribution of the Goedel sample is retained separately
from the synthetic controls; this is not an AI theorem-solving benchmark.

## Reproduction

From the repository root:

```sh
node --max-old-space-size=256 scripts/test-proof-atlas-occurrence-window.cjs
python3 research/proof-atlas/occurrence-focus/verify.py \
  --lean /absolute/path/to/lean-4.33.1 --workdir /tmp/atlas-occurrence-laws \
  --compare research/proof-atlas/occurrence-focus/compiled-laws.json
docker compose --profile build run --rm build
# Serve _site_production, then set ATLAS_ORIGIN and ATLAS_CHROMIUM_PATH as needed.
node scripts/test-proof-atlas-occurrence-window-browser.cjs
```

The compact law summary pins the model, runner and dependencies. Raw compiler
logs and process resource records remain in the private work directory.

[Lean model](Focus.lean) · [Compiled law summary](compiled-laws.json) ·
[Independent source audit](/scripts/test-proof-atlas-occurrence-window.cjs) ·
[Address codec](/public/js/proof-atlas-packed-routes.js) ·
[Scene model](/public/js/proof-atlas-occurrence-window.js)
