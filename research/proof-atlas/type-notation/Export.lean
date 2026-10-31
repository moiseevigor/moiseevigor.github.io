/- Driver prepends the production serializer, exact decoder and Spines.lean. -/
namespace AtlasNotationExport
open Lean Elab Command Meta AtlasLibrary AtlasNotation

def checkAt (type body : Expr) : CommandElabM Unit := do
  let env ← getEnv
  for e in [type,body,mkApp (mkLambda `expected .default type (.bvar 0)) body] do
    unless (Kernel.check env {} e).isOk do throwError "Native notation check failed"

def framesJson (frames : List Frame) : Json := toJson <| frames.toArray.map fun f =>
  match f with
  | .argument a => obj [("kind",str "argument"),("graph",AtlasPacketReplay.graph #[a])]
  | .metadata m => obj [("kind",str "metadata"),("payload",(classify (.mdata m (.bvar 0))).2)]

syntax "#atlas_notation_export " str : command
elab_rules : command
  | `(#atlas_notation_export $output:str) => do
    let mut laws := #[]
    for name in [``AtlasNotation.reconstruct,``AtlasNotation.lossless,
        ``AtlasNotation.reconstruction_count,``AtlasNotation.spine_count,
        ``AtlasNotation.left_result,``AtlasNotation.right_result,``AtlasNotation.glyph_collision] do
      let .thmInfo info ← getConstInfo name | throwError "Expected notation theorem"
      checkAt info.type info.value
      let axioms ← collectAxioms name
      unless axioms.all (fun a => a == ``propext || a == ``Quot.sound) do throwError "Unexpected axiom"
      laws := laws.push <| obj [("name",str name.toString),("axioms",toJson (axioms.map Name.toString)),
        ("kernelType",str "PASS"),("kernelProof",str "PASS"),("kernelExpectedType",str "PASS")]
    let mut signatures := #[]
    for name in [``Eq,``HEq,``And,``Or,``Iff,``Not,``LE.le,``LT.lt,``HAdd.hAdd,
        ``HMul.hMul,``HSub.hSub,``HDiv.hDiv,``HMod.hMod,``HPow.hPow,
        ``Sub.sub,``Neg.neg,``OfNat.ofNat,``Nat.cast,``Int.cast,``Exists] do
      let info ← getConstInfo name
      unless (Kernel.check (← getEnv) {} info.type).isOk do throwError "Signature check"
      let mut type := info.type
      let mut binders := #[]
      while let .forallE name _ body bi := type do
        binders := binders.push <| obj [("name",str name.toString),("nameParts",toJson (nameParts name)),("binderInfo",str (AtlasLibrary.bi bi))]
        type := body
      signatures := signatures.push <| obj [("name",str name.toString),("nameParts",toJson (nameParts name)),
        ("levelParams",toJson (info.levelParams.map nameParts)),("arity",toJson binders.size),
        ("binders",toJson binders),("graph",AtlasPacketReplay.graph #[info.type]),("kernelSignature",str "PASS")]
    let mut controls := #[]
    for name in [``AtlasNotation.leftValue,``AtlasNotation.rightValue] do
      let info ← getConstInfo name
      let some body := info.value? true | throwError "Missing authored value"
      checkAt info.type body
      let (head,frames) := peel body
      unless (⟨rebuild head frames⟩ : ExprStructEq) == ⟨body⟩ do throwError "Control inverse"
      let result ← liftTermElabM <| whnf body
      controls := controls.push <| obj [("name",str name.toString),("kernelTyping",str "PASS"),
        ("graph",AtlasPacketReplay.graph #[body,info.type,result]),
        ("head",AtlasPacketReplay.graph #[head]),("frames",framesJson frames)]
    -- Interspersed metadata is a structural control, not another typed theorem.
    let metadata := KVMap.empty.setBool `annotation true
    let structural := Expr.mdata metadata (.app (.mdata metadata (.app (.const ``HAdd.hAdd [.zero,.zero,.zero]) (.bvar 0))) (.bvar 1))
    let (head,frames) := peel structural
    unless (⟨rebuild head frames⟩ : ExprStructEq) == ⟨structural⟩ do throwError "Metadata inverse"
    liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasNotationNative/1"),
      ("laws",toJson laws),("signatures",toJson signatures),("controls",toJson controls),
      ("structural",obj [("graph",AtlasPacketReplay.graph #[structural]),
        ("head",AtlasPacketReplay.graph #[head]),("frames",framesJson frames),("typingClaim",toJson false)])]).compress
end AtlasNotationExport
