# Declared-type windows in checked proof regions

In the [paged reader](/projects/proof-atlas/manual/paged-network/#ns-lab), open **Inspect checked region functions**, choose a recorded policy, then **Read declarations together**. The same four-row rule applies to supplied inputs, derived local definitions and result computations. It reads the type annotation of each declaration inside the checked function. It does not infer a fresh type for an arbitrary selected descendant.

## Representation

The vertical line denotes telescope order. At declaration i, the context consists of the original context and the preceding i declarations. A local computation may occur before a later supplied input whose type uses it; inputs are therefore not moved to a separate assumption column. This window always uses final computed declaration order. The separate port-creation list remains available with its stable binding keys.

Each type uses the existing recoverable notation. Literal operator signatures, hidden type/instance arguments and constructor ports retain their exact records. Select a symbol or **Inspect declared type** for the full field inspector. **Inspect computation** opens a result or definition value. The original occurrence link keeps the source packet identity and path, separately from the computed component/native owner.

Visible variable occurrences link to their actual earlier declaration, a binder inside the type, or an original-context binder. These targets come from de Bruijn scope resolution and qualified addresses, never matching printed names. Only references exposed by the current notation cut are listed. Hidden arguments and frontiers can contain further references. No link denotes a necessary mathematical premise, tactic history or logical implication.

## Bounds and checks

The consumer retains four immutable, unexpanded scenes, each at most 48 notation objects / 4 MiB of serialized scene metadata. Only one page-fed notation cache is borrowed at a time and it is disposed before reading the next type. The existing provider retains its separate 64-row / two-index cache. These are component bounds, not a whole-browser heap measurement. Opening an exact field uses the existing single-field cursor rather than expanding four scenes simultaneously.

The model check compares every window of the 30 recorded source-specializing candidates against complete native graphs: two corpus regions and eight authored controls. It independently resolves visible lexical targets and rejects wrong owners, wrong type roots, forward references, invalid offsets, cancelled reads and retired readers. The original native evidence and compiled data are unchanged. Production browser checks exercise type/computation/source links, scope references, paging, cancellation and theme/layout behavior. Reports describe their actual finite scope; no comprehension improvement or general typing-preservation result is claimed.

The [model report](model-check.json.gz) checks **66 windows and 222 declarations** across overlapping policies: 106 supplied inputs, 23 derived definitions and 93 result computations. Its 641 visible variable occurrences resolve to 387 original-context binders, 87 earlier declarations and 167 binders inside a type. The largest window has 179 notation objects and 886,686 bytes of serialized scene metadata. These are finite maxima below the stated caps, not whole-process memory measurements.

The [production browser report](browser-check.json.gz) checks all 34 all-position windows in ten profiles, 118 declared-type selections, 54 computation selections and all three binder-link classes. It also checks exact symbol selection, an actual source-packet jump, supplied-adapter typing, cancellation/retry, retired handlers and keyboard focus. Four scoped axe audits cover 1500/390-pixel layouts in light/dark themes. The [compatibility replay](compatibility.json.gz) retains the previous direct, adapter, notation and source-specializing assertions, including all 113 inventoried original ports and 31 results. Their reports are copied here; historical records remain unchanged.

```sh
node research/proof-atlas/declaration-window/check.cjs
# Build the actual production site and serve it; no application-file overlays.
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/declaration-window/browser.cjs
ATLAS_ORIGIN=http://127.0.0.1:8877 node research/proof-atlas/declaration-window/compatibility.cjs
node research/proof-atlas/declaration-window/verify.cjs --write
```

`--check` on the model checker compares its deterministic report with the saved report. Browser screenshots and raw logs remain local. This technical record extends the earlier [source-specializing reader](../source-template-pages/README.md); its historical browser evidence remains tied to the runtime hashes it recorded.
