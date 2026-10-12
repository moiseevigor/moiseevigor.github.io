import Lean

/- Proof Atlas: kernel-checked application ascription. -/
open Lean Meta Elab Command

namespace ProofAtlas.ContextProbe
theorem fact (n : Nat) : n = n := rfl
theorem useFact (n : Nat) : n = n := fact n
end ProofAtlas.ContextProbe

#eval liftTermElabM do
  let f := mkApp (.const (Name.str (Name.str (.str .anonymous "ProofAtlas") "ContextProbe") "fact") []) (mkNatLit 3)
  let result ← inferType f
  let asserted := mkApp (mkLambda (.str .anonymous "w") result (mkBVar 0) .default) f
  checkWithKernel asserted
  IO.println s!"ATLAS_CONTEXT_WITNESS {← ppExpr result}"
