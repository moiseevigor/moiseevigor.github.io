/- Authored Lean-core controls, independent of the private mathematical project. -/
namespace AtlasScopeNative

def dependentDomain (p : Nat) : True :=
  let f : ∀ x : Fin (p+1), x.val = x.val := fun x => rfl
  let guard : Nat := p
  (fun (_h : ∀ x : Fin (p+1), x.val = x.val) (_g : Nat) => True.intro) f guard

def dependentLet (p : Nat) : True :=
  let f : ∀ x : Nat, (let y := p; x+y) = (let y := p; x+y) := fun x => rfl
  let guard : Nat := p
  (fun (_h : ∀ x : Nat, (let y := p; x+y) = (let y := p; x+y)) (_g : Nat) => True.intro) f guard

end AtlasScopeNative

/- Build a closed, well-typed shared proposition and its proof. The closed
   subexpressions are reused under Unit binders without expanding occurrences. -/
run_cmd do
  let nat := Lean.mkConst ``Nat
  let unit := Lean.mkConst ``Unit
  let truth := Lean.mkConst ``True
  let x := Lean.Expr.bvar 0
  let mut proposition := Lean.mkForall `x .default nat
    (Lean.mkApp3 (Lean.mkConst ``Eq [Lean.Level.one]) nat x x)
  let mut proof := Lean.mkLambda `x .default nat
    (Lean.mkApp2 (Lean.mkConst ``Eq.refl [Lean.Level.one]) nat x)
  for _ in [:512] do
    let quantified := Lean.mkForall `u .default unit proposition
    proof := Lean.mkApp4 (Lean.mkConst ``And.intro) proposition quantified proof
      (Lean.mkLambda `u .default unit proof)
    proposition := Lean.mkApp2 (Lean.mkConst ``And) proposition quantified
  let call := Lean.mkApp2 (Lean.mkLambda `h .default proposition
    (Lean.mkLambda `g .default nat (Lean.mkConst ``True.intro))) (.bvar 1) (.bvar 0)
  let body := Lean.Expr.letE `f proposition proof
    (.letE `guard nat (.bvar 1) call false) false
  liftTermElabM fun _ => Lean.addDecl (.defnDecl {name:=`AtlasScopeNative.sharedLocal,levelParams:=[],type:=Lean.mkForall `p .default nat truth,value:=Lean.mkLambda `p .default nat body,hints:=.abbrev,safety:=.safe})
