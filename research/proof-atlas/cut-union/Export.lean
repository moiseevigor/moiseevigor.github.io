/- Loaded after Cut, References, LocalContext and Union. -/
namespace ProofAtlas.SourceCut.Union.Export
open Lean Elab Command

syntax "#atlas_cut_union_export " str : command
elab_rules : command
  | `(#atlas_cut_union_export $output:str) => do
    let mut laws := #[]
    for name in [``join_hole, ``join_idempotent, ``join_commutative,
        ``join_associative, ``visible_join, ``visible_meet,
        ``retained_inclusion_exclusion, ``hidden_inclusion_exclusion,
        ``join_left, ``join_right, ``join_least,
        ``visible_reference_inclusion_exclusion, ``hidden_reference_inclusion_exclusion,
        ``join_context, ``frontier_join] do
      let .thmInfo info ← getConstInfo name | throwError "Expected union theorem"
      let env ← getEnv
      for e in [info.type, info.value,
          mkApp (mkLambda `expected .default info.type (.bvar 0)) info.value] do
        unless (Kernel.check env {} e).isOk do throwError "Union kernel check failed: {name}"
      let axioms ← collectAxioms name
      unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do
        throwError "Unexpected axiom: {name}"
      laws := laws.push <| Json.mkObj [
        ("name", toJson name.toString), ("axioms", toJson (axioms.map Name.toString)),
        ("kernelType", toJson "PASS"), ("kernelProof", toJson "PASS"),
        ("kernelExpectedType", toJson "PASS")]
    liftIO <| IO.FS.writeFile output.getString <| (Json.mkObj [
      ("format", toJson "ProofAtlasCutUnionNative/1"), ("laws", toJson laws)]).compress
end ProofAtlas.SourceCut.Union.Export
