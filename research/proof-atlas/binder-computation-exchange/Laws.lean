import Lean

namespace AtlasExchangeLaws
universe u v w

/- A typed dependent rule, not a theorem about the Expr transformer below. -/
theorem let_input_exchange {A : Sort u} {B : A → Sort v}
    {C : (x : A) → B x → Sort w} (t : A)
    (r : (x : A) → (y : B x) → C x y) :
    (let x := t; fun y : B x => r x y) =
    (fun y : B t => let x := t; r x y) := rfl

theorem let_input_exchange_recovery {A : Sort u} {B : A → Sort v}
    {C : (x : A) → B x → Sort w} (t : A)
    (r : (x : A) → (y : B x) → C x y) (y : B t) :
    (fun y : B t => let x := t; r x y) y = r t y := rfl

end AtlasExchangeLaws
