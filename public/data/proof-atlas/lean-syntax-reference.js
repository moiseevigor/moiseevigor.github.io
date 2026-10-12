/* Curated reference: finite constructor sets + explicitly bounded families. */
window.PROOF_ATLAS_SYNTAX_REFERENCE={
  "version": "1.0",
  "leanVersion": "4.33.1",
  "layers": [
    {
      "id": "expr",
      "title": "Expressions",
      "coverage": "12 / 12 constructors",
      "scope": "Closed constructor set. Open Expr values may contain local variables and metavariables; completed declarations must be closed and have no metavariables."
    },
    {
      "id": "level",
      "title": "Universe levels",
      "coverage": "6 / 6 constructors",
      "scope": "A separate recursive type. Level children are never Expr children. Universe metavariables must be solved before kernel checking."
    },
    {
      "id": "syntax",
      "title": "Syntax trees",
      "coverage": "4 / 4 constructors",
      "scope": "The Syntax container is finite; its node kinds are extensible. Four containers do not mean four kinds of source code."
    },
    {
      "id": "surface",
      "title": "Surface terms",
      "coverage": "Major families",
      "scope": "Readable terms elaborate to expressions. The paths below are conceptual: exact expansion depends on types, instances, notation and Lean version."
    },
    {
      "id": "tactic",
      "title": "Tactics",
      "coverage": "Major families",
      "scope": "Tactics transform goals and build terms. These are representative tactic families, not a complete tactic registry or captured execution trace."
    },
    {
      "id": "command",
      "title": "Commands",
      "coverage": "Major families",
      "scope": "Commands change environments, scopes or diagnostics. Many commands have no corresponding proof expression."
    },
    {
      "id": "macro",
      "title": "Macros & notation",
      "coverage": "Major families",
      "scope": "Syntax is extensible through parsers, quotations and hygienic expansion. Extensions supplied by libraries are outside this curated inventory."
    },
    {
      "id": "elab",
      "title": "Elaborator data",
      "coverage": "Selected structures",
      "scope": "Contexts, assignments and info trees connect source and expressions when retained. This is a field summary, not a complete dump of every internal structure."
    }
  ],
  "entries": [
    {
      "id": "level-zero",
      "layer": "level",
      "title": "Level.zero",
      "explanation": "The bottom universe level, written 0.",
      "example": "Prop",
      "reading": "Prop = Sort zero. This is the level, not the proposition or a proof.",
      "flow": [],
      "fields": [],
      "rawExample": "Lean.Level.zero",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "level-succ",
      "layer": "level",
      "title": "Level.succ",
      "explanation": "The successor of a universe level.",
      "example": "Type 0",
      "reading": "Type 0 = Sort (succ zero). Sort u : Sort (succ u).",
      "flow": [],
      "fields": [
        {
          "name": "level",
          "type": "Level",
          "link": "level",
          "note": "the level being raised"
        }
      ],
      "rawExample": "Lean.Level.succ level",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "level-max",
      "layer": "level",
      "title": "Level.max",
      "explanation": "The larger of two universe levels.",
      "example": "universe u v\n#check Prod.{u, v}",
      "reading": "For type-valued components, products use the maximum of their Type indices. max 0 u simplifies to u.",
      "flow": [],
      "fields": [
        {
          "name": "left",
          "type": "Level",
          "link": "level",
          "note": "first universe"
        },
        {
          "name": "right",
          "type": "Level",
          "link": "level",
          "note": "second universe"
        }
      ],
      "rawExample": "Lean.Level.max left right",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "level-imax",
      "layer": "level",
      "title": "Level.imax",
      "explanation": "The impredicative maximum used for dependent function sorts.",
      "example": "-- (x : A) → B x\n-- A : Sort u; B x : Sort v",
      "reading": "imax u 0 = 0; when v is nonzero, imax u v = max u v. Thus quantifying over data can still produce a proposition.",
      "flow": [],
      "fields": [
        {
          "name": "domain",
          "type": "Level",
          "link": "level",
          "note": "sort level of the domain"
        },
        {
          "name": "codomain",
          "type": "Level",
          "link": "level",
          "note": "sort level of the result"
        }
      ],
      "rawExample": "Lean.Level.imax domain codomain",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "level-param",
      "layer": "level",
      "title": "Level.param",
      "explanation": "A named universe parameter, instantiated by constant uses.",
      "example": "universe u\ndef identity {α : Sort u} (x : α) := x",
      "reading": "The universe declaration introduces a level name. It is distinct from a local term variable.",
      "flow": [],
      "fields": [
        {
          "name": "name",
          "type": "Name",
          "link": "payload",
          "note": "universe parameter identifier"
        }
      ],
      "rawExample": "Lean.Level.param name",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "level-mvar",
      "layer": "level",
      "title": "Level.mvar",
      "explanation": "A universe-level unknown managed by elaboration.",
      "example": "#check List",
      "reading": "The elaborator infers universe instantiations. A Level.mvar is distinct from an Expr.mvar goal; it cannot survive unresolved in a checked declaration.",
      "flow": [],
      "fields": [
        {
          "name": "id",
          "type": "LMVarId",
          "link": "context",
          "note": "universe assignment lookup"
        }
      ],
      "rawExample": "Lean.Level.mvar id",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Level.lean#L90-L96"
    },
    {
      "id": "syntax-missing",
      "layer": "syntax",
      "title": "Syntax.missing",
      "explanation": "A missing syntax fragment, used by error recovery and out-of-bounds indexing.",
      "example": "-- An unfinished source fragment: \n-- fun x =>",
      "reading": "Missing syntax is a parser/tooling condition, not an expression metavariable or a proof of anything.",
      "flow": [],
      "fields": [],
      "rawExample": "Lean.Syntax.missing",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Init/Prelude.lean#L4975-L5023"
    },
    {
      "id": "syntax-node",
      "layer": "syntax",
      "title": "Syntax.node",
      "explanation": "An ordered collection of syntax children labeled by a node kind.",
      "example": "Nat.succ 0",
      "reading": "The kind describes a parser form or internal grouping. It is a Name, not necessarily a declaration reference.",
      "flow": [],
      "fields": [
        {
          "name": "info",
          "type": "SourceInfo",
          "link": "payload",
          "note": "original / synthetic / none"
        },
        {
          "name": "kind",
          "type": "SyntaxNodeKind",
          "link": "payload",
          "note": "parser or grouping name"
        },
        {
          "name": "args",
          "type": "Array Syntax",
          "link": "syntax",
          "note": "ordered Syntax children"
        }
      ],
      "rawExample": "Lean.Syntax.node info kind args",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Init/Prelude.lean#L4975-L5023"
    },
    {
      "id": "syntax-atom",
      "layer": "syntax",
      "title": "Syntax.atom",
      "explanation": "A non-identifier token, such as a keyword, delimiter or literal.",
      "example": "fun (x : Nat) => x",
      "reading": "fun, (, : and => are atoms. A numeral token is a Syntax.atom; its elaborated numeric value need not be a literal Expr.",
      "flow": [],
      "fields": [
        {
          "name": "info",
          "type": "SourceInfo",
          "link": "payload",
          "note": "source span information"
        },
        {
          "name": "val",
          "type": "String",
          "link": "payload",
          "note": "token text"
        }
      ],
      "rawExample": "Lean.Syntax.atom info val",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Init/Prelude.lean#L4975-L5023"
    },
    {
      "id": "syntax-ident",
      "layer": "syntax",
      "title": "Syntax.ident",
      "explanation": "An identifier with source spelling, parsed name and possible pre-resolutions.",
      "example": "Nat.succ",
      "reading": "Macro scopes may be part of the parsed Name. A source identifier may elaborate to a local variable, constant or more complex expression.",
      "flow": [],
      "fields": [
        {
          "name": "info",
          "type": "SourceInfo",
          "link": "payload",
          "note": "source span information"
        },
        {
          "name": "rawVal",
          "type": "Substring.Raw",
          "link": "payload",
          "note": "literal spelling"
        },
        {
          "name": "val",
          "type": "Name",
          "link": "payload",
          "note": "name including macro scopes"
        },
        {
          "name": "preresolved",
          "type": "List Syntax.Preresolved",
          "link": "reference",
          "note": "namespace or declaration candidates"
        }
      ],
      "rawExample": "Lean.Syntax.ident info rawVal val preresolved",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Init/Prelude.lean#L4975-L5023"
    },
    {
      "id": "surface-names",
      "layer": "surface",
      "title": "Names, qualified names & escaped identifiers",
      "explanation": "Identifiers resolve using local context, namespaces and the environment.",
      "example": "Nat.succ 0\n-- «a name with spaces» is an escaped identifier.",
      "reading": "The spelling is syntax; resolution decides fvar or const. Printed names alone do not preserve binding identity.",
      "flow": [
        "identifier",
        "name resolution",
        "fvar / const"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-calls",
      "layer": "surface",
      "title": "Application & explicit arguments",
      "explanation": "Juxtaposition calls a function; @ exposes implicit arguments and named arguments select parameters.",
      "example": "@id Nat 2\nNat.add (n := 1) 2",
      "reading": "Inserted implicit and instance arguments become actual app children. Parentheses group parsing; they are not Expr nodes.",
      "flow": [
        "f x y",
        "insert arguments",
        "app (app f x) y"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-binders",
      "layer": "surface",
      "title": "Functions & binder visibility",
      "explanation": "fun introduces functions; (), {}, ⦃⦄ and [] control explicit, implicit, strict implicit and instance parameters.",
      "example": "#check (fun (x : Nat) => x)\n#check (fun {α : Type} (x : α) => x)",
      "reading": "Each parameter becomes a lam; BinderInfo has exactly default, implicit, strictImplicit and instImplicit. Scope extends into the body.",
      "flow": [
        "fun + binders",
        "abstract locals",
        "lam + bvar"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-pi",
      "layer": "surface",
      "title": "Arrows, ∀ & dependent types",
      "explanation": "The result type can depend on a parameter; an ordinary arrow is the nondependent special case.",
      "example": "(n : Nat) → Fin (n + 1)\n∀ n : Nat, n = n",
      "reading": "Both forms use forallE. The type itself is not a proof of every instance.",
      "flow": [
        "dependent arrow",
        "bind parameter",
        "forallE"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-locals",
      "layer": "surface",
      "title": "let, have, show & suffices",
      "explanation": "Local terms name intermediate values, assert a desired type or introduce a sufficient subgoal.",
      "example": "let n : Nat := 2; n\nexample : True := by\n  have h : True := True.intro\n  exact h",
      "reading": "let often becomes letE; have and suffices may become local bindings or lambda applications. show constrains a type. No unique expansion is promised.",
      "flow": [
        "local assertion",
        "check type and scope",
        "letE / lam / app"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-holes",
      "layer": "surface",
      "title": "Placeholders, type ascription & inference",
      "explanation": "_ requests inference; (e : T) gives an expected type; named holes expose goals.",
      "example": "(id 2 : Nat)\n-- ?goal is intentionally unfinished.",
      "reading": "An ascription is not an extra Expr constructor. A hole creates elaboration obligations that must be resolved.",
      "flow": [
        "term : type",
        "unification",
        "typed Expr"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-literals",
      "layer": "surface",
      "title": "Numerals, strings, characters & collections",
      "explanation": "Surface literal notation is interpreted using the expected type and notation rules.",
      "example": "(2 : Nat)\n(-2 : Int)\n\"Lean\"\n[1, 2, 3]",
      "reading": "OfNat interprets numerals. Lists expand into constructors, negatives use negation, and character notation has no third Literal variant.",
      "flow": [
        "literal notation",
        "notation + instances",
        "lit / const / app"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-operators",
      "layer": "surface",
      "title": "Operators, tuples & constructors",
      "explanation": "Infix notation and constructor notation expand to applications selected by types.",
      "example": "(1, true)\n(2 : Nat) + 3\nexample : True ∧ True := ⟨True.intro, True.intro⟩",
      "reading": "+ may involve HAdd and instances. Tuple and angle-bracket notation use constructor applications; there is no tuple Expr constructor.",
      "flow": [
        "operator / tuple",
        "resolve notation",
        "constructor applications"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-logic",
      "layer": "surface",
      "title": "Equality, connectives & quantifiers",
      "explanation": "Logical notation denotes types and constructions, not special Expr tags.",
      "example": "example : ∃ n : Nat, n = 0 := ⟨0, rfl⟩",
      "reading": "And and Exists are inductive declarations. Equality uses Eq; rfl uses reflexivity with definitional equality. Iff, Or, Not and False also use declarations and functions.",
      "flow": [
        "∃ n, P n",
        "witness + proof",
        "Exists.intro application"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-records",
      "layer": "surface",
      "title": "Structure literals, updates & field access",
      "explanation": "Record notation builds structures; updates fill fields and dot syntax selects fields or methods.",
      "example": "{ fst := 1, snd := true : Nat × Bool }\n(1, true).1",
      "reading": "A literal uses constructor applications. Dot syntax can use proj or named functions; an update is rebuilt data, not mutation of a kernel term.",
      "flow": [
        "record syntax",
        "constructor / projection",
        "app / proj"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-match",
      "layer": "surface",
      "title": "Pattern matching & case analysis",
      "explanation": "Patterns bind names and choose branches according to an inductive value.",
      "example": "fun n : Nat =>\n  match n with\n  | 0 => 0\n  | k + 1 => k",
      "reading": "Matchers and recursors implement elimination. Branch binders have separate scopes. A match expression is not an Expr constructor.",
      "flow": [
        "match + branches",
        "matcher elaboration",
        "recursor applications"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-conditionals",
      "layer": "surface",
      "title": "if & dependent if",
      "explanation": "Conditionals use a Decidable instance; a dependent branch can receive evidence for the condition.",
      "example": "fun n : Nat => if h : n = 0 then 0 else n",
      "reading": "ite chooses a result; dite passes a proof or refutation into branch functions. The instance argument is real elaborated data.",
      "flow": [
        "if h : P",
        "decide + branch lambdas",
        "ite / dite applications"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-do",
      "layer": "surface",
      "title": "do, monadic bind & loops",
      "explanation": "do notation sequences computations and expands control flow in a chosen monad.",
      "example": "def pureOne : Option Nat := do\n  let x ← some 1\n  pure x",
      "reading": "Bind.bind and generated lambdas connect steps. for, while, mutable locals, break and continue require additional expansion; the picture is a family summary.",
      "flow": [
        "do statements",
        "control-flow expansion",
        "bind + lambdas"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-calc",
      "layer": "surface",
      "title": "calc & chained reasoning",
      "explanation": "A calc block chains relations through available transitivity instances and proofs.",
      "example": "example (a b c : Nat) (h : a = b) (k : b = c) : a = c := by\n  calc a = b := h\n       _ = c := k",
      "reading": "Each step has a type and evidence. Transitivity builds a term; the final Expr does not preserve the original line layout.",
      "flow": [
        "typed calc steps",
        "transitivity synthesis",
        "composed proof term"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-recursion",
      "layer": "surface",
      "title": "Recursion, termination & mutual definitions",
      "explanation": "Recursive equations elaborate with recursors or well-founded recursion; termination is an obligation.",
      "example": "def countdown : Nat → Nat\n  | 0 => 0\n  | n + 1 => countdown n",
      "reading": "Structural descent is checked; termination_by and decreasing_by guide other termination proofs. partial and unsafe definitions need separate execution/trust treatment.",
      "flow": [
        "recursive equations",
        "termination + elaboration",
        "declarations + recursors"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "surface-coercions",
      "layer": "surface",
      "title": "Coercions & type classes",
      "explanation": "The elaborator can insert coercions and synthesize instance arguments.",
      "example": "def asInt (n : Nat) : Int := n",
      "reading": "Inserted conversion functions and dictionaries appear in the term. Their source syntax may be absent; attribution needs elaboration info.",
      "flow": [
        "expected type",
        "coercion / synthesis",
        "inserted applications"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Terms/"
    },
    {
      "id": "tactic-intro",
      "layer": "tactic",
      "title": "intro & revert",
      "explanation": "Introduce parameters into the local context or move them back into the target.",
      "example": "example (P : Prop) : P → P := by\n  intro h\n  exact h",
      "reading": "intro contributes lambdas to the final proof. Reverting must also move dependent hypotheses.",
      "flow": [
        "Π goal",
        "introduce local h",
        "body goal"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-exact",
      "layer": "tactic",
      "title": "exact, apply & refine",
      "explanation": "Supply a proof, use a function with the target as result, or create holes for missing pieces.",
      "example": "example : True ∧ True := by\n  apply And.intro\n  · exact True.intro\n  · exact True.intro",
      "reading": "apply creates argument goals; refine lets syntax determine holes. exact checks the supplied term against the goal.",
      "flow": [
        "goal A ∧ B",
        "apply constructor",
        "goals A and B"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-assumptions",
      "layer": "tactic",
      "title": "assumption & constructor",
      "explanation": "Search the local context for a matching proof or apply an inductive constructor.",
      "example": "example (P : Prop) (h : P) : P := by\n  assumption",
      "reading": "These tactics depend on the current context and unification. A constructor may leave multiple goals.",
      "flow": [
        "context Γ",
        "match / construct",
        "proof or subgoals"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-rewrite",
      "layer": "tactic",
      "title": "rw & simp",
      "explanation": "Rewrite with equalities or simplify using a configurable lemma set and procedures.",
      "example": "example (a b : Nat) (h : a = b) : a + 0 = b := by\n  rw [h]\n  simp",
      "reading": "Rewriting creates equality transport evidence. simp is an algorithm, not a kernel constructor; its lemma set and generated term matter.",
      "flow": [
        "equality / simp lemmas",
        "rewrite target",
        "transport proof"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-conversion",
      "layer": "tactic",
      "title": "rfl, change & dsimp",
      "explanation": "Use definitional equality or change the presentation of a definitionally equal goal.",
      "example": "example (n : Nat) : n = n := by\n  rfl",
      "reading": "Definitional equality is computed by the checker, rather than a stored graph edge. change needs a convertible target; dsimp unfolds definitions.",
      "flow": [
        "target",
        "definitional conversion",
        "same obligation / reflexivity"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-cases",
      "layer": "tactic",
      "title": "cases, rcases & obtain",
      "explanation": "Eliminate inductive data or proofs and expose constructor-specific branches and witnesses.",
      "example": "example (P : Nat → Prop) (h : ∃ n, P n) : ∃ n, P n := by\n  rcases h with ⟨n, hn⟩\n  exact ⟨n, hn⟩",
      "reading": "rcases and obtain offer convenient patterns. The generated eliminator term governs which assumptions enter each branch.",
      "flow": [
        "inductive hypothesis",
        "elimination",
        "scoped branch goals"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-induction",
      "layer": "tactic",
      "title": "induction",
      "explanation": "Apply an induction principle, opening constructor cases and appropriate induction hypotheses.",
      "example": "example (n : Nat) : n = n := by\n  induction n with\n  | zero => rfl\n  | succ k ih => rfl",
      "reading": "The induction hypothesis is a typed assumption in the step case. A drawn loop does not license circular reasoning.",
      "flow": [
        "inductive goal",
        "recursor + motive",
        "base / step + ih"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-contradiction",
      "layer": "tactic",
      "title": "by_contra, contradiction & exfalso",
      "explanation": "Introduce a negated target, close inconsistent contexts or reduce a target to False.",
      "example": "example (P : Prop) (h : False) : P := by\n  exfalso\n  exact h",
      "reading": "False elimination is constructive. by_contra generally uses classical reasoning; inspect axiom dependencies rather than inferring them from the diagram.",
      "flow": [
        "target P",
        "False elimination",
        "goal False"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-splits",
      "layer": "tactic",
      "title": "by_cases & split",
      "explanation": "Branch on a decidable proposition or on branching terms in a goal.",
      "example": "example (P : Prop) : P ∨ ¬ P := by\n  classical\n  by_cases h : P\n  · exact Or.inl h\n  · exact Or.inr h",
      "reading": "The two branches carry h : P and h : ¬P. classical supplies noncomputable decision infrastructure.",
      "flow": [
        "decidable P",
        "case split",
        "P / ¬P branches"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-combinators",
      "layer": "tactic",
      "title": "Goal selectors, bullets & tactic combinators",
      "explanation": "Control which goals receive a tactic and how branches are sequenced or retried.",
      "example": "example : True ∧ True := by\n  constructor <;> exact True.intro",
      "reading": "<;> applies a tactic to all generated goals. Bullets, case, all_goals, first and try organize execution; they are not new proof rules.",
      "flow": [
        "goal list",
        "select / sequence tactics",
        "new goal list"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "tactic-automation",
      "layer": "tactic",
      "title": "decide, arithmetic & library automation",
      "explanation": "Automation constructs evidence using computation, search or domain-specific procedures.",
      "example": "example : 2 < 3 := by\n  decide",
      "reading": "decide uses decidability. omega, ring, norm_num, aesop and library tactics have their own imports and proof procedures. native_decide has a separate compiler trust path; no uniform trace is inferred.",
      "flow": [
        "goal + procedure",
        "search / computation",
        "proof + dependencies"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Tactic-Proofs/"
    },
    {
      "id": "command-declarations",
      "layer": "command",
      "title": "def, abbrev, theorem, lemma & example",
      "explanation": "Declare named values, proofs or an anonymous checked example.",
      "example": "def double (n : Nat) := n + n\ntheorem selfEq (n : Nat) : n = n := rfl",
      "reading": "Definitions and theorems store a type and a value in the environment. A theorem is opaque to normal reduction; abbrev marks a reducible definition.",
      "flow": [
        "name + type + value",
        "check declaration",
        "environment entry"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-axioms",
      "layer": "command",
      "title": "axiom, opaque & trust boundaries",
      "explanation": "An axiom declares an assumed constant; an opaque definition hides reduction of its value.",
      "example": "axiom selectedAssumption : Prop\n#print axioms Nat.add_comm",
      "reading": "axiom has no defining proof. sorry introduces sorryAx rather than an unresolved mvar; acceptance alone does not imply an axiom-free theorem.",
      "flow": [
        "constant declaration",
        "environment / axiom audit",
        "explicit dependencies"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-inductive",
      "layer": "command",
      "title": "inductive & mutual inductives",
      "explanation": "Declare a type with constructors and generated elimination principles.",
      "example": "inductive Flag where\n  | on\n  | off",
      "reading": "Positivity and type formation are checked. Constructors and recursors are declarations used by const/app; inductive is not an Expr node.",
      "flow": [
        "type + constructors",
        "inductive checking",
        "type / constructors / recursors"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-structure",
      "layer": "command",
      "title": "structure & class",
      "explanation": "Declare record types; a class additionally participates in instance synthesis.",
      "example": "structure Point where\n  x : Nat\n  y : Nat",
      "reading": "Records produce constructor and projection declarations. extends and deriving can add generated definitions, instances and obligations.",
      "flow": [
        "record fields",
        "declaration generation",
        "constructor + projections"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-instance",
      "layer": "command",
      "title": "instance & deriving",
      "explanation": "Register instance candidates or ask handlers to derive instances for a declaration.",
      "example": "instance : Inhabited Nat := ⟨0⟩",
      "reading": "Synthesis chooses a typed term from scoped candidates. deriving depends on registered handlers; neither is a new kernel rule.",
      "flow": [
        "class target",
        "instance registration",
        "synthesis candidate"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-scope",
      "layer": "command",
      "title": "namespace, section, end & open",
      "explanation": "Control name qualification, local scopes and name resolution.",
      "example": "namespace Demo\nsection\nvariable (n : Nat)\n#check n\nend\nend Demo",
      "reading": "section variables used by declarations may become parameters. open affects resolution; it does not prove relationships between declarations.",
      "flow": [
        "scope commands",
        "name/context changes",
        "subsequent elaboration"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-universes",
      "layer": "command",
      "title": "universe & variable",
      "explanation": "Introduce universe parameters and section-local term parameters or hypotheses.",
      "example": "universe u\nvariable {α : Type u} (x : α)",
      "reading": "Only relevant section variables are abstracted into resulting declarations. Universe parameters are separate from term binders.",
      "flow": [
        "parameters",
        "local scope",
        "abstracted declaration"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-imports",
      "layer": "command",
      "title": "import & module headers",
      "explanation": "Load compiled modules before processing their declarations.",
      "example": "import Lean",
      "reading": "Imports extend the environment and parser/elaborator extensions. Module/public visibility syntax is version-sensitive; the picture does not describe every header form.",
      "flow": [
        "module dependencies",
        "load .olean environment",
        "available declarations"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-attributes",
      "layer": "command",
      "title": "attribute & declaration modifiers",
      "explanation": "Change registered behavior such as simplification, reducibility and instance priority.",
      "example": "@[simp] theorem zeroAdd (n : Nat) : 0 + n = n := Nat.zero_add n",
      "reading": "Attributes operate on declarations and extension tables. local/scoped attributes constrain visibility; simp membership is not mathematical truth.",
      "flow": [
        "attribute + declaration",
        "extension registration",
        "tool behavior"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-options",
      "layer": "command",
      "title": "set_option & local settings",
      "explanation": "Configure diagnostics, resource limits and elaborator behavior in a scope.",
      "example": "set_option pp.universes true in\n#check List",
      "reading": "Options can affect printing and elaboration. They are not children of the final proof term.",
      "flow": [
        "option value",
        "scoped configuration",
        "elaboration / display"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-diagnostics",
      "layer": "command",
      "title": "#check, #print, #eval & #reduce",
      "explanation": "Request a type, inspect declarations, execute code or reduce terms.",
      "example": "#check Nat.succ\n#print Nat\n#eval 2 + 3\n#reduce Nat.add 2 3",
      "reading": "#eval executes generated code; #reduce uses reduction. Diagnostic output is not a theorem certificate.",
      "flow": [
        "query command",
        "inspection / evaluation",
        "message output"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-extensions",
      "layer": "command",
      "title": "notation, syntax, macro & elaborator commands",
      "explanation": "Register new syntax and interpretation procedures for later input.",
      "example": "notation \"ℕ₀\" => Nat",
      "reading": "A command can extend how later commands, terms and tactics are parsed. There is no finite list of all downstream syntax node kinds.",
      "flow": [
        "extension declaration",
        "register parser/handler",
        "extended language"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "command-termination",
      "layer": "command",
      "title": "where, mutual, termination_by & decreasing_by",
      "explanation": "Group helpers or recursive declarations and provide termination guidance.",
      "example": "def down : Nat → Nat\n  | 0 => 0\n  | n + 1 => down n",
      "reading": "where binds helpers; mutual groups declarations. Measures and decreasing proofs depend on the recursion strategy. partial/unsafe are separate execution modes.",
      "flow": [
        "recursive declaration group",
        "elaboration obligations",
        "checked or restricted declarations"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Declarations/"
    },
    {
      "id": "macro-parser",
      "layer": "macro",
      "title": "syntax & declare_syntax_cat",
      "explanation": "Define parsers in term, command, tactic or custom syntax categories.",
      "example": "syntax \"oneNat\" : term",
      "reading": "A parser yields Syntax, not an Expr. Precedence, associativity and antiquotation categories govern how the tree is built.",
      "flow": [
        "tokens",
        "registered parser",
        "Syntax.node"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "macro-notation",
      "layer": "macro",
      "title": "notation, infix, prefix & scoped notation",
      "explanation": "Provide readable spellings and precedence rules for existing terms.",
      "example": "infixl:65 \" ⊕ₙ \" => Nat.add",
      "reading": "local/scoped controls visibility. Overloaded notation still needs expected types and elaboration to choose declarations.",
      "flow": [
        "notation tokens",
        "expansion",
        "ordinary term syntax"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "macro-expansion",
      "layer": "macro",
      "title": "macro & macro_rules",
      "explanation": "Transform syntax using hygienic rules before elaboration.",
      "example": "macro \"oneNat\" : term => `((1 : Nat))",
      "reading": "Expansion produces Syntax and carries macro scopes to avoid variable capture. A macro is not itself a trusted logical inference.",
      "flow": [
        "input Syntax",
        "hygienic expansion",
        "output Syntax"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "macro-quotation",
      "layer": "macro",
      "title": "Quotations & antiquotations",
      "explanation": "Construct syntax templates and splice existing syntax into them.",
      "example": "macro \"twiceNat \" t:term : term =>\n  `(Nat.add $t $t)",
      "reading": "The backtick template is syntax quotation. $t splices syntax; it is distinct from a bound kernel variable or expression metavariable.",
      "flow": [
        "template + splice",
        "quotation hygiene",
        "Syntax tree"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "macro-elaborators",
      "layer": "macro",
      "title": "elab & elaboration rules",
      "explanation": "Interpret syntax in a context using the metaprogramming API.",
      "example": "elab \"zeroNat\" : term =>\n  return Lean.mkNatLit 0",
      "reading": "A term elaborator returns an expression and may create constraints. Command and tactic elaborators perform other stateful work; kernel checking remains the final proof boundary.",
      "flow": [
        "Syntax + context",
        "elaborator handler",
        "Expr / command effects"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "macro-delaboration",
      "layer": "macro",
      "title": "Pretty printing & delaboration",
      "explanation": "Reconstruct readable syntax from elaborated expressions for display.",
      "example": "#check @id",
      "reading": "A pretty-printed term is not necessarily the original source. Implicit arguments, coercions and sugar can be hidden; store source/info evidence for faithful correspondence.",
      "flow": [
        "Expr + environment",
        "delaborator",
        "readable Syntax"
      ],
      "fields": [],
      "rawExample": null,
      "source": "https://lean-lang.org/doc/reference/latest/Notations-and-Macros/"
    },
    {
      "id": "elab-local-context",
      "layer": "elab",
      "title": "LocalContext & local declarations",
      "explanation": "The local context maps free-variable IDs to their declaration information.",
      "example": "-- Γ: x : Nat, h : x = x",
      "reading": "Names are presentation; FVarId is identity. A local let declaration also stores a value. Context dependencies must be retained when a subterm is extracted.",
      "flow": [],
      "fields": [
        {
          "name": "fvarId",
          "type": "FVarId",
          "link": "context",
          "note": "identity of local declaration"
        },
        {
          "name": "userName",
          "type": "Name",
          "link": "payload",
          "note": "displayed local name"
        },
        {
          "name": "type",
          "type": "Expr",
          "link": "expr",
          "note": "local declaration type"
        },
        {
          "name": "value?",
          "type": "Option Expr",
          "link": "expr",
          "note": "value for a local let"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/LocalContext.lean"
    },
    {
      "id": "elab-metavars",
      "layer": "elab",
      "title": "MetavarContext & goals",
      "explanation": "Metavariable declarations store the context and target of an obligation; assignments live in related maps.",
      "example": "-- Γ ⊢ ?m : Nat",
      "reading": "A goal is not just a question mark. Term assignments, delayed assignments and universe assignments must be instantiated consistently.",
      "flow": [],
      "fields": [
        {
          "name": "mvarId",
          "type": "MVarId",
          "link": "context",
          "note": "goal lookup"
        },
        {
          "name": "lctx",
          "type": "LocalContext",
          "link": "context",
          "note": "allowed local variables"
        },
        {
          "name": "type",
          "type": "Expr",
          "link": "expr",
          "note": "target type"
        },
        {
          "name": "assignment",
          "type": "Expr (if assigned)",
          "link": "expr",
          "note": "separate assignment map"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/MetavarContext.lean"
    },
    {
      "id": "elab-source-info",
      "layer": "elab",
      "title": "SourceInfo",
      "explanation": "Records original token spans, synthetic spans or the absence of source information.",
      "example": "-- original source → pos … endPos",
      "reading": "SourceInfo.original stores leading/trailing text and positions; synthetic stores positions and a canonical flag. Synthetic code need not literally occur in the file.",
      "flow": [],
      "fields": [
        {
          "name": "original",
          "type": "leading, pos, trailing, endPos",
          "link": "payload",
          "note": "source text span"
        },
        {
          "name": "synthetic",
          "type": "pos, endPos, canonical",
          "link": "payload",
          "note": "generated syntax span"
        },
        {
          "name": "none",
          "type": "no fields",
          "link": "payload",
          "note": "no source position"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Init/Prelude.lean#L4859-L4904"
    },
    {
      "id": "elab-info-tree",
      "layer": "elab",
      "title": "InfoTree & tactic information",
      "explanation": "Elaboration information can relate syntax to expressions and record goal states before and after a tactic.",
      "example": "example : True := by\n  exact True.intro",
      "reading": "These are retained tooling records, not encoded by the final Expr. A source span or info tree must be exported to claim bidirectional source/graph alignment.",
      "flow": [],
      "fields": [
        {
          "name": "stx",
          "type": "Syntax",
          "link": "syntax",
          "note": "syntax linked by an info record"
        },
        {
          "name": "expr",
          "type": "Expr (term info)",
          "link": "expr",
          "note": "elaborated expression"
        },
        {
          "name": "goalsBefore/After",
          "type": "List MVarId (tactic info)",
          "link": "context",
          "note": "goal snapshots"
        },
        {
          "name": "children",
          "type": "InfoTree collection",
          "link": "reference",
          "note": "nested elaboration information"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Elab/InfoTree/Types.lean"
    },
    {
      "id": "elab-environment",
      "layer": "elab",
      "title": "Environment & ConstantInfo",
      "explanation": "The environment stores declarations and extension state. ConstantInfo distinguishes definitions, theorems, axioms, inductives, constructors, recursors, opaque values and quotients.",
      "example": "#print Nat.succ",
      "reading": "A const occurrence references this table. Type, level parameters and optional value belong to the declaration; not every kind has a value.",
      "flow": [],
      "fields": [
        {
          "name": "name",
          "type": "Name",
          "link": "reference",
          "note": "declaration key"
        },
        {
          "name": "levelParams",
          "type": "List Name",
          "link": "level",
          "note": "universe parameter names"
        },
        {
          "name": "type",
          "type": "Expr",
          "link": "expr",
          "note": "declaration type"
        },
        {
          "name": "value?",
          "type": "Expr where applicable",
          "link": "expr",
          "note": "definition / theorem / opaque value"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Declaration.lean"
    },
    {
      "id": "elab-constraints",
      "layer": "elab",
      "title": "Unification, synthesis & postponed work",
      "explanation": "Elaboration solves term and universe constraints, synthesizes instances and may postpone work awaiting more information.",
      "example": "def inferred := id 2",
      "reading": "Definitional equality helps solve constraints; it is not an independent equality proof. Errors and pending tasks need explicit states in a live visualizer.",
      "flow": [],
      "fields": [
        {
          "name": "term constraints",
          "type": "Expr pairs",
          "link": "expr",
          "note": "expected and inferred types"
        },
        {
          "name": "universe constraints",
          "type": "Level relations",
          "link": "level",
          "note": "universe compatibility"
        },
        {
          "name": "instances",
          "type": "class goals",
          "link": "context",
          "note": "synthesis obligations"
        }
      ],
      "rawExample": null,
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Meta/Basic.lean"
    }
  ]
};
