/- Authored kernel-expression control. The family contains a large balanced
   expression referring to an outer variable. No private proof source is used. -/
namespace AtlasTransportStress
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
syntax "#atlas_transport_stress " str : command
elab_rules : command
 | `(#atlas_transport_stress $output:str) => do
  let n := mkConst ``Nat
  let zero := mkNatLit 0
  let mut terms := (Array.range 4096).map fun i => mkApp2 (mkConst ``Nat.add) (.bvar 0) (mkNatLit i)
  while terms.size > 1 do
   let mut next := #[]
   for i in [:terms.size/2] do
    next := next.push (mkApp2 (mkConst ``Nat.add) terms[2*i]! terms[2*i+1]!)
   terms := next
  let sum := terms[0]!
  let prop := mkApp3 (mkConst ``Eq [.succ .zero]) n sum sum
  let family := .lam `index n (prop.liftLooseBVars 0 1) .default
  let value := mkApp2 (mkConst ``Eq.refl [.succ .zero]) n sum
  let equality := mkApp2 (mkConst ``Eq.refl [.succ .zero]) n zero
  let body := mkAppN (mkConst ``Eq.ndrec [.zero,.succ .zero]) #[n,zero,family,value,zero,equality]
  let proof := .lam `offset n body .default
  let type := .forallE `offset n prop .default
  liftTermElabM fun _ => kernelAs proof type
  let (t,s) := intern type {}
  let (v,s) := intern proof s
  let packet := obj [("declaration",obj [("name",str "AtlasTransportStress.balanced"),
   ("kind",str "authored-kernel-proof"),("kernelCheck",str "PASS"),
   ("module",str "AtlasTransportStressFixture"),("rootPaths",toJson #["root.type","root.value"])]),
   ("serialization",str "ExprDAG/1"),("roots",toJson #[t,v])]
  liftIO <| IO.FS.writeFile output.getString (packet.mergeObj (graphJson s)).compress
end AtlasTransportStress
