/- Raw expressions retain lets that surface elaboration may simplify. -/
run_meta do
 let nat := mkConst ``Nat
 let truth := mkConst ``True
 let yes := mkConst ``True.intro
 let z := Expr.bvar 0
 let lam := fun n t b => Expr.lam n t b .default
 let localDef := fun n t v b => Expr.letE n t v b false
 let proof := localDef `h truth yes z
 let value := localDef `x nat (mkNatLit 2) (mkApp (mkConst ``Nat.succ) z)
 let dependent := localDef `n nat (mkNatLit 2) (mkApp2 (mkConst ``Eq.refl [.succ .zero]) nat z)
 let capture := lam `z nat (localDef `x nat z (lam `z nat (.bvar 1)))
 let duplicate := lam `z nat (localDef `x nat (mkApp (mkConst ``Nat.succ) z) (mkAppN (mkConst ``Prod.mk [.zero,.zero]) #[nat,nat,z,z]))
 let natFn ← mkArrow nat nat
 let boundValue := lam `z nat (localDef `f natFn (lam `y nat (.bvar 1)) (lam `z nat (mkApp (.bvar 1) z)))
 let beforeValue := lam `z nat (localDef `x nat (localDef `z nat z z) z)
 let domain := localDef `n nat (mkNatLit 2) (lam `h (mkAppN (mkConst ``Eq [.succ .zero]) #[nat,z,z]) z)
 let typeLevel := localDef `A (mkSort (.succ .zero)) nat (Expr.forallE `x z (.bvar 1) .default)
 let unused := Expr.letE `x nat (mkNatLit 2) (mkNatLit 3) true
 let shadow := localDef `x nat (mkNatLit 2) (localDef `x nat (mkNatLit 3) (.bvar 1))
 let projection := localDef `p (mkApp2 (mkConst ``Prod [.zero,.zero]) nat nat) (mkAppN (mkConst ``Prod.mk [.zero,.zero]) #[nat,nat,mkNatLit 2,mkNatLit 3]) (.proj ``Prod 0 z)
 let annotation := localDef `x nat (mkNatLit 2) (.mdata {} z)
 let poly := lam `A (mkSort (.param `u)) (lam `x z (localDef `y (.bvar 1) z z))
 let sharedLet := localDef `x nat z z
 let pairFn := mkApp2 (mkConst ``Prod [.zero,.zero]) natFn natFn
 let rightPair := mkAppN (mkConst ``Prod.mk [.zero,.zero]) #[natFn,natFn,lam `q nat sharedLet,lam `r nat sharedLet]
 let sharedContexts := mkAppN (mkConst ``Prod.mk [.zero,.zero]) #[natFn,pairFn,lam `p nat sharedLet,rightPair]
 let proofIrrelevance := lam `p truth (lam `q truth (localDef `h truth (.bvar 1) z))
 let mut proposition := truth
 let mut body := Expr.bvar 1
 for _ in [:80] do
  body := mkAppN (mkConst ``And.intro) #[proposition,proposition,body,body]
  proposition := mkApp2 (mkConst ``And) proposition proposition
 let shared := lam `p truth (localDef `unused nat (mkNatLit 2) body)
 for (name,term) in #[(`AtlasLet.proof,proof),(`AtlasLet.value,value),(`AtlasLet.dependent,dependent),(`AtlasLet.capture,capture),(`AtlasLet.duplicate,duplicate),(`AtlasLet.boundValue,boundValue),(`AtlasLet.beforeValue,beforeValue),(`AtlasLet.domain,domain),(`AtlasLet.typeLevel,typeLevel),(`AtlasLet.unused,unused),(`AtlasLet.shadow,shadow),(`AtlasLet.proofIrrelevance,proofIrrelevance),(`AtlasLet.shared,shared),(`AtlasLet.projection,projection),(`AtlasLet.annotation,annotation),(`AtlasLet.poly,poly),(`AtlasLet.sharedContexts,sharedContexts)] do
  let type ← AtlasOccurrenceTypes.kernelType term
  addDecl (.defnDecl {name,levelParams:=(if name == `AtlasLet.poly then [`u] else []),type,value:=term,hints:=.abbrev,safety:=.safe})
 let mut rejected := false
 try
  let _ ← AtlasOccurrenceTypes.kernelType (localDef `x nat yes z)
 catch _ => rejected := true
 unless rejected do throwError "Wrong-typed let value accepted"
 withLocalDecl `p .default truth fun p => withLocalDecl `q .default truth fun q => do
  match Kernel.isDefEq (← getEnv) (← getLCtx) p q with
  | .ok true => pure () | _ => throwError "Expected proof irrelevance control"
 match Kernel.isDefEq (← getEnv) (← getLCtx) (mkNatLit 2) (mkNatLit 3) with
 | .ok false => pure () | _ => throwError "Unequal values accepted"
