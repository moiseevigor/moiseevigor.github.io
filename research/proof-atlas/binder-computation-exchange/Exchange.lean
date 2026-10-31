/- Included after the exact packet decoder and original context tools. -/
namespace AtlasBinderExchange
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes AtlasResultClosures

def swapPair (e : Expr) : Expr :=
 (e.liftLooseBVars 2 2).instantiateRev #[.bvar 0,.bvar 1]

def exchange (original : Expr) (domainMode := true) (bodyMode := true) : Except String (Expr × Expr × Bool) := do
 let .letE x a t (.lam y b r bi) nondep := original | throw "Expected adjacent let/lambda"
 let domain := if domainMode then b.instantiate1 t else b
 let body := if bodyMode then swapPair r else r
 return (.lam y domain (.letE x (a.liftLooseBVars 0 1) (t.liftLooseBVars 0 1) body false) bi,b,nondep)

def inverse (after residual : Expr) (sourceNondep : Bool) : Except String Expr := do
 let .lam y domain (.letE x a t r nondep) bi := after | throw "Expected exchanged lambda/let"
 unless !a.hasLooseBVar 0 && !t.hasLooseBVar 0 do throw "Moved definition captures new input"
 unless !nondep do throw "Derived let must not retain an uncertified nondep annotation"
 let oldA := a.lowerLooseBVars 1 1
 let oldT := t.lowerLooseBVars 1 1
 unless (⟨residual.instantiate1 oldT⟩ : ExprStructEq) == ⟨domain⟩ do throw "Residual/domain mismatch"
 return .letE x oldA oldT (.lam y residual (swapPair r) bi) sourceNondep

def candidateStatus (candidate expected correct : Expr) : MetaM Json := do
 let env ← getEnv
 let context ← getLCtx
 let own := match Kernel.check env context candidate with | .ok _ => true | _ => false
 let assigned := if own then (Kernel.check env context
   (mkApp (mkLambda `expected .default expected (.bvar 0)) candidate)).isOk else false
 let conv := if assigned then (Kernel.isDefEq env context candidate correct).toOption.getD false else false
 return obj [("selfTyping",str (if own then "PASS" else "KERNEL_REJECTED")),
  ("atOriginalType",str (if assigned then "PASS" else "KERNEL_REJECTED")),
  ("conversion",toJson conv),("literalEqualsCorrect",toJson ((⟨candidate⟩ : ExprStructEq) == ⟨correct⟩))]

def observe (request : Json) (source : Array Expr)
    (original term : Expr) (xs : Array Expr) (ctx : Array Json) (shared : Shared)
    (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 let anchor := obj [("node",nat (← sourceId shared original)),("route",routeJson root slots)]
 unless (← fieldM request "anchor") == anchor && (← fieldM request "context") == toJson ctx do
  throwError "Exact exchange source/context mismatch"
 let .ok (raw,residual,sourceNondep) := exchange original | throwError "Expected adjacent let/lambda"
 let .ok restored := inverse raw residual sourceNondep | throwError "Exchange inverse failed"
 structural restored original "literal exchange inverse"
 let .letE letName letType letValue (.lam _ inputDomain _ _) nondep := term | throwError "Exchange term shape"
 let oldDomainText ← withLetDecl letName letType letValue (nondep := nondep) fun x => prettyType (inputDomain.instantiate1 x)
 let newDomainText ← prettyType (inputDomain.instantiate1 letValue)
 let valueText ← prettyType letValue
 let .letE _ _ _ (.lam inputName _ originalBody inputInfo) _ := term | throwError "Original body shape"
 let bodyBeforeText ← withLetDecl letName letType letValue (nondep := nondep) fun x =>
  withLocalDecl inputName inputInfo (inputDomain.instantiate1 x) fun y => prettyType (originalBody.instantiateRev #[x,y])
 let beforeType ← kernelType term
 let after := raw.instantiateRev xs
 let afterType ← kernelType after
 kernelAs after beforeType
 conversion beforeType afterType
 conversion after term
 kernelAs (← mkEqRefl after) (← mkEq after term)
 let (closed,closedType,_) ← closeSuffix source original after beforeType xs ctx 0
 kernelAtPrefix xs 0 closed closedType
 let .ok (rawNaive,_,_) := exchange original false true | throwError "Naive exchange"
 let .ok (rawUnswapped,_,_) := exchange original true false | throwError "Unswapped exchange"
 let naive := rawNaive.instantiateRev xs
 let unswapped := rawUnswapped.instantiateRev xs
 let .lam inputName inputType (.letE valueName valueType value body _) inputInfo := raw | throwError "Exchanged shape"
 let expanded := .lam inputName inputType (mkApp (.lam valueName valueType body .default) value) inputInfo
 let expandedTerm := expanded.instantiateRev xs
 let opened := raw.instantiateRev xs
 let .lam yn yd (.letE xn xa xv xb _) yi := opened | throwError "Opened after body"
 let bodyAfterText ← withLocalDecl yn yi yd fun y =>
  withLetDecl xn (xa.instantiate1 y) (xv.instantiate1 y) (nondep := false) fun x => prettyType (xb.instantiateRev #[y,x])

 let graph := AtlasPacketReplay.graph #[original,beforeType.abstract xs,raw,afterType.abstract xs,
   residual,closed,closedType,rawNaive,rawUnswapped,expanded]
 return obj [("source",← fieldM request "source"),("anchor",anchor),("context",toJson ctx),
  ("path",str path),("status",str "PASS"),("namespace",str "binder-computation-exchange"),
  ("sourceNondep",toJson sourceNondep),("derivedNondep",toJson false),("letExpansion",← candidateStatus expandedTerm beforeType after),
  ("graph",graph),("components",toJson (#["before.term","before.type","after.term","after.type","residual.domain","closed.term","closed.type","naiveDomain.term","unswappedBody.term","letExpansion.term"].map str)),
  ("termTyping",str "PASS"),("originalTypeAssignment",str "PASS"),("typeConversion",str "PASS"),
  ("termConversion",str "PASS"),("equalityWitness",str "PASS"),("literalInverse",str "PASS"),("closedTyping",str "PASS"),
  ("naiveDomain",← candidateStatus naive beforeType after),("unswappedBody",← candidateStatus unswapped beforeType after),
  ("bodyBeforeText",str bodyBeforeText),("bodyAfterText",str bodyAfterText),("domainBeforeText",str oldDomainText),("domainAfterText",str newDomainText),("definitionText",str valueText),
  ("beforeText",str (← prettyType term)),("afterText",str (← prettyType after)),
  ("beforeTypeText",str (← prettyType beforeType)),("afterTypeText",str (← prettyType afterType))]

syntax "#atlas_binder_exchange " str " => " str : command
elab_rules : command
 | `(#atlas_binder_exchange $input:str => $output:str) => do
  let request ← readJson input.getString
  let .ok profiles := (← field request "profiles").getArr? | throwError "Exchange profiles"
  let mut rows : Array Json := #[]
  for p in profiles do
   let packet ← readJson (← string p "packetFile")
   let .ok (source,roots) := AtlasPacketReplay.exact packet | throwError "Exact exchange packet"
   let sourceInfo ← field p "source"
   let name ← string sourceInfo "name"
   unless (← string (← field packet "declaration") "name") == name do throwError "Exchange declaration identity mismatch"
   unless ((← getEnv).find? name.toName).isNone do throwError "Original declaration imported"
   liftTermElabM fun _ => do
    checkDomain source[roots[0]!]!
    kernelAs source[roots[1]!]! source[roots[0]!]!
   let (_,start) := intern source[roots[0]!]! {}
   let (_,shared) := intern source[roots[1]!]! start
   let anchor ← field p "anchor"
   let route ← field anchor "route"
   let .ok root := route.getObjValAs? Nat "root" | throwError "Exchange root"
   let .ok slots := route.getObjValAs? (Array Nat) "slots" | throwError "Exchange slots"
   let result ← liftTermElabM fun _ => atRouteWith source[roots[root]!]! slots.toList #[] #[] shared root #[] "root.value" (observe p source)
   rows := rows.push (obj [("source",sourceInfo),("closedPacketTyping",str "PASS"),("originalDeclarationImported",toJson false),("result",result)])
  let mut laws : Array Json := #[]
  for n in [`AtlasExchangeLaws.let_input_exchange,`AtlasExchangeLaws.let_input_exchange_recovery] do
   let info ← getConstInfo n
   let some value := info.value? true | throwError "Law has no value"
   liftTermElabM fun _ => kernelAs value info.type
   let axioms ← collectAxioms n
   unless axioms.isEmpty do throwError "Unexpected exchange-law axiom"
   laws := laws.push (obj [("name",str n.toString),("kernelTyping",str "PASS"),("axioms",toJson (axioms.map Name.toString))])
  liftIO <| IO.FS.writeFile output.getString (obj [("format",str "ProofAtlasBinderExchangeNative/1"),("profiles",toJson rows),("laws",toJson laws)]).compress
end AtlasBinderExchange
