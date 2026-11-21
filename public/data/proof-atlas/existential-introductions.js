window.PROOF_ATLAS_EXISTENTIAL_INTRODUCTIONS=[
  {
    "declaration": "lean_workbook_49456",
    "edition": "goedel-sample-4331",
    "indexSha256": "66459f55804e8ae09fc9a8615191fba8f5277f1fb0831c1bb132e1bc60552b38",
    "node": 39,
    "root": 1,
    "slots": [
      1,
      1
    ],
    "goal": "∃ k, ↑k = ↑(n.choose r)",
    "obligation": "↑(n.choose r) = ↑(n.choose r)",
    "witness": "n.choose r",
    "inputs": [
      0,
      20,
      28,
      38
    ]
  },
  {
    "declaration": "lean_workbook_plus_68616",
    "edition": "goedel-sample-4331",
    "indexSha256": "2f1f6523063a579076448d2a6caa42d496003a1be382692e8747442b1d9aef83",
    "node": 358,
    "root": 1,
    "slots": [
      1,
      1,
      1
    ],
    "goal": "∃ a, (∀ (i : ℕ), 1 ≤ i ∧ i ≤ k → ↑(a i) ≡ ↑i [ZMOD 2] ∧ a i < a (i + 1)) ∧ a k ≤ n",
    "obligation": "(∀ (i : ℕ), 1 ≤ i ∧ i ≤ k → ↑((fun i => i) i) ≡ ↑i [ZMOD 2] ∧ (fun i => i) i < (fun i => i) (i + 1)) ∧\n  (fun i => i) k ≤ n",
    "witness": "fun i => i",
    "inputs": [
      10,
      76,
      84,
      357
    ],
    "conjunction": {
      "declaration": "lean_workbook_plus_68616",
      "edition": "goedel-sample-4331",
      "indexSha256": "2f1f6523063a579076448d2a6caa42d496003a1be382692e8747442b1d9aef83",
      "node": 357,
      "root": 1,
      "slots": [
        1,
        1,
        1,
        1
      ],
      "left": {
        "node": 346,
        "expected": "(∀ (i : ℕ), 1 ≤ i ∧ i ≤ k → ↑((fun i => i) i) ≡ ↑i [ZMOD 2] ∧ (fun i => i) i < (fun i => i) (i + 1)) = True"
      },
      "right": {
        "node": 353,
        "expected": "((fun i => i) k ≤ n) = True"
      }
    }
  }
];
