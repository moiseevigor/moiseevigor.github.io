/- Finite comparisons, not proofs of these memoized executors. In particular,
   never evaluate the tree-recursive specification on a shared 2^80 fixture. -/
namespace ProofAtlas.SourceRecoveryNative
open Lean

def fields : Expr → Array Expr
  | .app f a => #[f,a]
  | .lam _ t b _ | .forallE _ t b _ => #[t,b]
  | .letE _ t v b _ => #[t,v,b]
  | .mdata _ b | .proj _ _ b => #[b]
  | _ => #[]

structure PlugWork where
  memo : ExprStructMap Expr := {}
  deriving Inhabited

partial def memoPlug (σ : FVarId → Expr) (e : Expr) (depth : Nat := 0) :
    StateT PlugWork (Except String) Expr := do
  if let some value := (← get).memo.get? ⟨e⟩ then return value
  unless depth ≤ 512 && (← get).memo.size < 262144 do throw "Recovery work bound"
  let recurse := fun c => memoPlug σ c (depth+1)
  let value ← match e with
    | .fvar id => pure (σ id)
    | .app f a => pure <| .app (← recurse f) (← recurse a)
    | .lam n t b bi => pure <| .lam n (← recurse t) (← recurse b) bi
    | .forallE n t b bi => pure <| .forallE n (← recurse t) (← recurse b) bi
    | .letE n t v b nd => pure <| .letE n (← recurse t) (← recurse v) (← recurse b) nd
    | .mdata data b => pure <| .mdata data (← recurse b)
    | .proj n i b => pure <| .proj n i (← recurse b)
    | e => pure e
  modify fun s => {s with memo := s.memo.insert ⟨e⟩ value}
  return value

def samePayload : Expr → Expr → Bool
  | .bvar i,.bvar j => i == j
  | .fvar i,.fvar j => i == j
  | .mvar i,.mvar j => i == j
  | .sort i,.sort j => i == j
  | .const n us,.const m vs => n == m && us == vs
  | .app ..,.app .. => true
  | .lam n _ _ bi,.lam m _ _ bj | .forallE n _ _ bi,.forallE m _ _ bj => n == m && bi == bj
  | .letE n _ _ _ nd,.letE m _ _ _ md => n == m && nd == md
  | .lit a,.lit b => a == b
  | .mdata a _,.mdata b _ => a.entries == b.entries
  | .proj n i _,.proj m j _ => n == m && i == j
  | _,_ => false

structure CompareWork where
  memo : Std.HashMap (ExprStructEq × ExprStructEq) Bool := {}
  deriving Inhabited

partial def compare (a b : Expr) (depth : Nat := 0) :
    StateT CompareWork (Except String) Bool := do
  if let some value := (← get).memo.get? (⟨a⟩,⟨b⟩) then return value
  unless depth ≤ 512 && (← get).memo.size < 262144 do throw "Comparison work bound"
  let mut same := samePayload a b
  if same then
    let as := fields a
    let bs := fields b
    unless as.size == bs.size do throw "Ordered constructor arity"
    for i in [:as.size] do
      same := same && (← compare as[i]! bs[i]! (depth+1))
  modify fun s => {s with memo := s.memo.insert (⟨a⟩,⟨b⟩) same}
  return same

structure CountWork where
  memo : Std.HashMap (Bool × ExprStructEq) Nat := {}
  deriving Inhabited

partial def memoCount (σ : FVarId → Expr) (weighted : Bool) (e : Expr) (depth : Nat := 0) :
    StateT CountWork (Except String) Nat := do
  if let some value := (← get).memo.get? (weighted,⟨e⟩) then return value
  unless depth ≤ 512 && (← get).memo.size < 262144 do throw "Count work bound"
  let value ← match weighted,e with
    | true,.fvar id => memoCount σ false (σ id) (depth+1)
    | _,e => do
      let mut count := 1
      for c in fields e do count := count + (← memoCount σ weighted c (depth+1))
      pure count
  modify fun s => {s with memo := s.memo.insert (weighted,⟨e⟩) value}
  return value

def required {α} : Except String α → IO α
  | .ok a => pure a
  | .error e => throw (IO.userError e)

def graph (rows : Array Expr) : Json := Id.run do
  let mut state : AtlasLibrary.Shared := {}
  let mut roots := #[]
  for e in rows do
    let (root,next) := AtlasLibrary.intern e state
    state := next
    roots := roots.push root
  return Json.mkObj [("kind",toJson state.kind),("children",toJson state.children),
    ("payloads",toJson state.payloads),("expanded",toJson (state.expanded.map toString)),
    ("neededScope",toJson state.neededScope),("roots",toJson roots)]

def check (index : Nat) (σ : FVarId → Expr) (original template : Expr)
    (variables images : Array Expr) (rawSource rawTemplate : Expr)
    (sourceContext templateContext rows : Array Expr)
    (sourceCount templateCount expectedRecoveryStates : Nat) : IO Json := do
  unless variables.size == images.size && images.all (! ·.hasLooseBVars) do
    throw (IO.userError "Image scope/arity")
  IO.eprintln s!"case {index}: source opening"
  let (sourceOpening,_) ← required ((compare (rawSource.instantiateRev sourceContext) original).run {})
  let (templateOpening,_) ← required ((compare (rawTemplate.instantiateRev templateContext) template).run {})
  unless sourceOpening && templateOpening do throw (IO.userError "Native context opening mismatch")
  IO.eprintln s!"case {index}: memo recovery"
  let (restored,work) ← required ((memoPlug σ template).run {})
  unless work.memo.size == expectedRecoveryStates do
    throw (IO.userError "Recovery cache does not cover every reachable template node")
  let (same,comparison) ← required ((compare restored original).run {})
  unless same do throw (IO.userError "Memoized recovery does not match original")
  IO.eprintln s!"case {index}: primitive recovery"
  let primitive := template.replaceFVars variables images
  let (same,primitiveComparison) ← required ((compare primitive original).run {})
  unless same do throw (IO.userError "Native replaceFVars does not match original")
  IO.eprintln s!"case {index}: occurrence accounting"
  let (source,sourceWork) ← required ((memoCount σ false original).run {})
  let (size,templateWork) ← required ((memoCount σ false template).run {})
  let (weighted,countWork) ← required ((memoCount σ true template).run {})
  unless source == sourceCount && size == templateCount && weighted == source do
    throw (IO.userError "Native occurrence accounting")
  IO.eprintln s!"case {index}: row serialization"
  return Json.mkObj [("index",toJson index),("rows",graph rows),("contextOpening",toJson "PASS"),("memoRecovery",toJson "PASS"),
    ("nativeReplaceFVars",toJson "PASS"),("sourceOccurrences",toJson (toString source)),
    ("templateOccurrences",toJson (toString size)),("weightedOccurrences",toJson (toString weighted)),
    ("recoveryStates",toJson work.memo.size),("comparisonStates",toJson comparison.memo.size),
    ("primitiveComparisonStates",toJson primitiveComparison.memo.size),
    ("sourceCountStates",toJson sourceWork.memo.size),("templateCountStates",toJson templateWork.memo.size),
    ("weightedCountStates",toJson countWork.memo.size)]

end ProofAtlas.SourceRecoveryNative
