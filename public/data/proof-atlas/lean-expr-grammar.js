/* Version-pinned constructor reference. Examples are illustrative, not exporter output. */
window.PROOF_ATLAS_GRAMMAR={
  "format": "ProofAtlasLeanExprGrammar",
  "version": "2.0",
  "scope": "The twelve Lean.Expr constructors serialized by the CoreGIR exporter; distinct from Lean surface syntax and tactics.",
  "source": "Lean v4.33.1 Expr.lean; semantic constructor arguments only. Cached computed Expr.data is excluded.",
  "kinds": [
    {
      "kind": "bvar",
      "title": "Bound variable",
      "category": "Reference",
      "explanation": "The de Bruijn index points to a surrounding binder; 0 denotes the nearest binder.",
      "example": "fun x : Nat => x",
      "form": "0",
      "ports": "variable occurrence",
      "caution": "Binder scope is essential: a bare leaf ID cannot identify which x it denotes.",
      "meaning": "Bound variable occurrence",
      "role": "scope",
      "diagram": [
        [
          "Binder: λx",
          "Reference: x"
        ],
        [
          "x ↳ index 0",
          "points back to λ"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "deBruijnIndex",
          "type": "Nat",
          "link": "scope",
          "note": "0 → nearest enclosing binder"
        }
      ],
      "rawExample": ".bvar 0",
      "reading": "In fun x => fun y => x, x is index 1 and y would be index 0. Only binder bodies extend the scope: the binder type does not bind its own parameter.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "fvar",
      "title": "Free variable",
      "category": "Reference",
      "explanation": "A local free-variable identifier used during elaboration or in open expressions, with its type and declaration held in a local context.",
      "example": "-- Open context Γ contains x : Nat\n-- The occurrence x is a free variable here.",
      "form": "x",
      "ports": "local context",
      "caution": "A closed kernel declaration should not have unresolved free variables.",
      "meaning": "Local variable → expression",
      "role": "scope",
      "diagram": [
        [
          "Γ : x : Nat",
          "free x"
        ],
        [
          "local context",
          "uses declaration"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "fvarId",
          "type": "FVarId",
          "link": "context",
          "note": "lookup name, type and value in Γ"
        }
      ],
      "rawExample": ".fvar localId",
      "reading": "A local ID is not the printed name x. Abstracting a local variable into a closed lambda converts its occurrences to bound indices. A final closed declaration cannot retain free variables.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "mvar",
      "title": "Metavariable",
      "category": "Hole",
      "explanation": "A placeholder that elaboration must solve before a kernel-checkable closed proof is accepted.",
      "example": "by\n  refine ?_",
      "form": "?m",
      "ports": "to be solved",
      "caution": "Not a theorem and not accepted as an unresolved proof hole in a completed certificate.",
      "meaning": "Unsolved goal (elaboration only)",
      "role": "state",
      "diagram": [
        [
          "Goal T",
          "?m"
        ],
        [
          "open obligation",
          "must be resolved"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "mvarId",
          "type": "MVarId",
          "link": "context",
          "note": "lookup goal, context and assignment"
        }
      ],
      "rawExample": ".mvar goalId",
      "reading": "A goal has a target type and its own local context; an assigned metavariable must be instantiated before submission. The illustrated hole is intentionally incomplete.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "sort",
      "title": "Sort / universe",
      "category": "Type",
      "explanation": "A universe-level sort, including Prop and Type; this is how types themselves are typed.",
      "example": "Prop",
      "form": "Sort u",
      "ports": "universe level",
      "caution": "The kernel tracks levels, so treating every Type as the same type is unsound.",
      "meaning": "Sort universe level",
      "role": "type",
      "diagram": [
        [
          "Sort u",
          "Sort (u+1)"
        ],
        [
          "Sort universe",
          "level, not an Expr child"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "u",
          "type": "Level",
          "link": "level",
          "note": "Prop → zero; Type u → succ u"
        }
      ],
      "rawExample": ".sort .zero",
      "reading": "Sort u itself has type Sort (u + 1). Prop is Sort 0; Type u is Sort (u + 1). The level is not an Expr child.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "const",
      "title": "Constant",
      "category": "Reference",
      "explanation": "A reference to a named declaration in the environment, with universe instantiations. That declaration can be a theorem, definition, axiom, inductive type, or constructor.",
      "example": "Nat.zero; Nat.succ; Nat.add",
      "form": "c.{u}",
      "ports": "environment name",
      "caution": "Do not label every constant as a lemma: inspect the referenced declaration kind.",
      "meaning": "Named declaration",
      "role": "reference",
      "diagram": [
        [
          "Environment",
          "c.{u}"
        ],
        [
          "named declaration",
          "universe instances"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "declName",
          "type": "Name",
          "link": "reference",
          "note": "lookup declaration in environment"
        },
        {
          "name": "us",
          "type": "List Level",
          "link": "level",
          "note": "ordered universe instantiations"
        }
      ],
      "rawExample": ".const `Nat.succ []",
      "reading": "The environment stores the declaration’s type and, where applicable, its value. A const node stores neither. Universe arguments instantiate the declaration’s universe parameters.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "app",
      "title": "Application",
      "category": "Operation",
      "explanation": "Apply a function expression to an argument expression. Nested applications encode calls with multiple arguments.",
      "example": "Nat.succ Nat.zero",
      "form": "f · a",
      "ports": "function + argument",
      "caution": "An application is an operation, not a new mathematical theorem.",
      "meaning": "Apply f to a",
      "role": "operation",
      "diagram": [
        [
          "Function f",
          "Argument a"
        ],
        [
          "f(a)",
          "application result"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "fn",
          "type": "Expr",
          "link": "expr",
          "note": "the function, e.g. Nat.succ"
        },
        {
          "name": "arg",
          "type": "Expr",
          "link": "expr",
          "note": "the argument, e.g. Nat.zero"
        }
      ],
      "rawExample": ".app (.const `Nat.succ [])\n     (.const `Nat.zero [])",
      "reading": "If Γ ⊢ f : (x : A) → B x and Γ ⊢ a : A, then Γ ⊢ f a : B a. f a b is app (app f a) b; order matters.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "lam",
      "title": "Lambda abstraction",
      "category": "Binder",
      "explanation": "Build a function by binding a variable with a domain type and an expression body.",
      "example": "fun x : Nat => x",
      "form": "λ x : A, b",
      "ports": "binder + body",
      "caution": "Bound-variable occurrences in the body refer back to the lambda.",
      "meaning": "Function constructor",
      "role": "binder",
      "diagram": [
        [
          "Domain A",
          "Body b(x)"
        ],
        [
          "λx : A. b",
          "function"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "binderName",
          "type": "Name",
          "link": "payload",
          "note": "display name; not binding identity"
        },
        {
          "name": "binderType",
          "type": "Expr",
          "link": "expr",
          "note": "parameter domain, e.g. Nat"
        },
        {
          "name": "body",
          "type": "Expr",
          "link": "expr",
          "note": "under one additional binder"
        },
        {
          "name": "binderInfo",
          "type": "BinderInfo",
          "link": "payload",
          "note": "explicit / implicit / strict / instance"
        }
      ],
      "rawExample": ".lam `x (.const `Nat []) (.bvar 0) .default",
      "reading": "The domain is checked in Γ, the body in Γ with a new parameter. A lambda proves an implication only when its domain and body types are propositions.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "forallE",
      "title": "Dependent function / ∀",
      "category": "Binder",
      "explanation": "Lean's Pi expression: it represents dependent function types, universal quantification, and implication when the domain is a proposition.",
      "example": "Nat → Nat",
      "form": "Π x : A, B x",
      "ports": "domain + codomain",
      "caution": "For propositions A and B, A → B is represented by a Pi binder; not every Pi is a quantifier in informal mathematics.",
      "meaning": "Pi / forall / implication",
      "role": "binder",
      "diagram": [
        [
          "Domain A",
          "Codomain B(x)"
        ],
        [
          "Π x : A, B(x)",
          "dependent type"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "binderName",
          "type": "Name",
          "link": "payload",
          "note": "display name for the parameter"
        },
        {
          "name": "binderType",
          "type": "Expr",
          "link": "expr",
          "note": "domain, e.g. Nat"
        },
        {
          "name": "body",
          "type": "Expr",
          "link": "expr",
          "note": "codomain under one additional binder"
        },
        {
          "name": "binderInfo",
          "type": "BinderInfo",
          "link": "payload",
          "note": "argument visibility / instance synthesis"
        }
      ],
      "rawExample": ".forallE `x (.const `Nat [])\n         (.const `Nat []) .default",
      "reading": "This constructs a type, not an inhabitant of it. If the domain is Sort u and codomain Sort v, the dependent function type lives in Sort (imax u v).",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "letE",
      "title": "Let expression",
      "category": "Binder",
      "explanation": "Name an intermediate value inside an expression, with a declared type, a value and a body.",
      "example": "let n : Nat := 2; Nat.succ n",
      "form": "let x := v; b",
      "ports": "type + value + body",
      "caution": "The body may use both n and its defining value for type checking. The nondep flag records the elaborator’s nondependent have treatment; it is not a proof of independence.",
      "meaning": "Local definition",
      "role": "binder",
      "diagram": [
        [
          "Type A; value v",
          "Body b(x)"
        ],
        [
          "let x := v",
          "value of b"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "declName",
          "type": "Name",
          "link": "payload",
          "note": "display name for the local definition"
        },
        {
          "name": "type",
          "type": "Expr",
          "link": "expr",
          "note": "type of the bound value"
        },
        {
          "name": "value",
          "type": "Expr",
          "link": "expr",
          "note": "outside the new binder’s scope"
        },
        {
          "name": "body",
          "type": "Expr",
          "link": "expr",
          "note": "inside the new binder’s scope"
        },
        {
          "name": "nondep",
          "type": "Bool",
          "link": "payload",
          "note": "elaborator have flag; kernel does not check it"
        }
      ],
      "rawExample": ".letE `n (.const `Nat []) (.lit (.natVal 2))\n      (.app (.const `Nat.succ []) (.bvar 0)) false",
      "reading": "The body may use both n and its defining value for type checking. The nondep flag records the elaborator’s nondependent have treatment; it is not a proof of independence.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "lit",
      "title": "Literal",
      "category": "Atom",
      "explanation": "A compact natural-number or string payload. Surface numerals may additionally use OfNat instance synthesis; a negative integer is not a third Literal variant.",
      "example": "(42 : Nat); \"hello\"",
      "form": "42",
      "ports": "literal value",
      "caution": "The literal value is exact but usually not a mathematical assertion by itself.",
      "meaning": "Number or string",
      "role": "atom",
      "diagram": [
        [
          "42",
          "literal"
        ],
        [
          "intrinsic atom",
          "no children"
        ]
      ],
      "observed": true,
      "fields": [
        {
          "name": "literal",
          "type": "Literal",
          "link": "payload",
          "note": "natVal : Nat or strVal : String"
        }
      ],
      "rawExample": ".lit (.natVal 42)",
      "reading": "There are exactly two Literal variants here: natural numbers and strings. Negative numbers, characters, rational values and overloaded numerals need other elaborated constructions.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "mdata",
      "title": "Metadata",
      "category": "Wrapper",
      "explanation": "An expression wrapped with elaboration metadata. The metadata is relevant for tooling, but the kernel's mathematical meaning comes from the wrapped expression.",
      "example": "Lean syntax annotations (internal)",
      "form": "meta(e)",
      "ports": "metadata + inner expression",
      "caution": "Metadata is not a mathematical premise, and it may be absent after elaboration.",
      "meaning": "Annotated subexpression",
      "role": "wrapper",
      "diagram": [
        [
          "Metadata",
          "Inner expression e"
        ],
        [
          "mdata(e)",
          "same kernel meaning"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "data",
          "type": "MData",
          "link": "payload",
          "note": "key-value annotations"
        },
        {
          "name": "expr",
          "type": "Expr",
          "link": "expr",
          "note": "the wrapped expression"
        }
      ],
      "rawExample": ".mdata {} (.const `Nat.zero [])",
      "reading": "mdata data e is definitionally equal to e. An annotation may aid tooling, but cannot establish a premise or guarantee recovery of source text.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    },
    {
      "kind": "proj",
      "title": "Structure projection",
      "category": "Operation",
      "explanation": "Access one field of a structure value by specifying the structure type and field position.",
      "example": "fun p : Nat × Bool => p.1",
      "form": "πᵢ(s)",
      "ports": "record + field index",
      "caution": "Projection is an operation on structure values, not a generic connection between independent theorems.",
      "meaning": "Field extraction",
      "role": "operation",
      "diagram": [
        [
          "Structure s",
          "Field index i"
        ],
        [
          "πᵢ(s)",
          "field value"
        ]
      ],
      "observed": false,
      "fields": [
        {
          "name": "typeName",
          "type": "Name",
          "link": "reference",
          "note": "one-constructor inductive type"
        },
        {
          "name": "idx",
          "type": "Nat",
          "link": "payload",
          "note": "zero-based constructor-field position"
        },
        {
          "name": "struct",
          "type": "Expr",
          "link": "expr",
          "note": "the structure value being projected"
        }
      ],
      "rawExample": ".proj `Prod 0 pairExpr",
      "reading": "The index counts constructor fields, excluding parameters. Lean checks the structure type, index and allowed elimination; dot notation can also elaborate to a named projection application.",
      "source": "https://github.com/leanprover/lean4/blob/v4.33.1/src/Lean/Expr.lean#L296-L467"
    }
  ],
  "leanVersion": "4.33.1"
};
