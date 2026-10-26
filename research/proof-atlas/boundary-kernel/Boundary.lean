import Std

/-! General reference laws for a finite boundary projection.
Roles and source keys are supplied data. No theorem here infers a Lean type or binder. -/
namespace ProofAtlas.Boundary

inductive Role where
  | proof | type | value | unobserved
  deriving DecidableEq, Repr, BEq

def Role.isProof : Role → Bool
  | .proof => true
  | _ => false

@[simp] theorem Role.isProof_eq_true (role : Role) : role.isProof = true ↔ role = .proof := by
  cases role <;> simp [Role.isProof]

@[simp] theorem Role.isProof_eq_false (role : Role) : role.isProof = false ↔ role ≠ .proof := by
  cases role <;> simp [Role.isProof]

structure Cell (Source : Type u) (Payload : Type v) where
  slot : Nat
  role : Role
  source : Source
  payload : Payload
  deriving Repr

variable {Source : Type u} {Payload : Type v} {n : Nat}
abbrev Table (n : Nat) (Source : Type u) (Payload : Type v) := Fin n → Cell Source Payload

def heads (table : Table n Source Payload) : List (Fin n) :=
  (List.finRange n).filter fun i => (table i).slot == 0

def rest (table : Table n Source Payload) : List (Fin n) :=
  (List.finRange n).filter fun i => !((table i).slot == 0)

def arguments (table : Table n Source Payload) : List (Fin n) :=
  (rest table).filter fun i => (table i).role.isProof

def others (table : Table n Source Payload) : List (Fin n) :=
  (rest table).filter fun i => !(table i).role.isProof

/-- Supplied proof arguments precede proof-valued heads in the source-pool key order. -/
def proofRefs (table : Table n Source Payload) : List (Fin n) :=
  arguments table ++ (heads table).filter fun i => (table i).role.isProof

@[simp] theorem mem_heads (table : Table n Source Payload) (i : Fin n) :
    i ∈ heads table ↔ (table i).slot = 0 := by
  simp [heads, List.mem_filter, List.mem_finRange]

@[simp] theorem mem_arguments (table : Table n Source Payload) (i : Fin n) :
    i ∈ arguments table ↔ (table i).slot ≠ 0 ∧ (table i).role = .proof := by
  simp [arguments, rest, List.mem_filter, List.mem_finRange, and_comm]

@[simp] theorem mem_others (table : Table n Source Payload) (i : Fin n) :
    i ∈ others table ↔ (table i).slot ≠ 0 ∧ (table i).role ≠ .proof := by
  simp [others, rest, List.mem_filter, List.mem_finRange, and_comm]

@[simp] theorem mem_proofRefs (table : Table n Source Payload) (i : Fin n) :
    i ∈ proofRefs table ↔ (table i).role = .proof := by
  by_cases h : (table i).slot = 0 <;> simp [proofRefs, List.mem_filter, h]

/-- Every original position occurs exactly once in the three role lanes. -/
theorem partition_perm (table : Table n Source Payload) :
    (heads table ++ (arguments table ++ others table)).Perm (List.finRange n) := by
  exact (List.Perm.append_left (heads table)
    (List.filter_append_perm (fun i => (table i).role.isProof) (rest table))).trans
    (List.filter_append_perm (fun i => (table i).slot == 0) (List.finRange n))

theorem partition_nodup (table : Table n Source Payload) :
    (heads table ++ (arguments table ++ others table)).Nodup :=
  (partition_perm table).nodup_iff.mpr (List.nodup_finRange n)

theorem position_once (table : Table n Source Payload) (i : Fin n) :
    (heads table ++ (arguments table ++ others table)).count i = 1 := by
  rw [(partition_nodup table).count]
  have h := (partition_perm table).mem_iff.mpr (List.mem_finRange i)
  simp [h]

theorem position_conservation (table : Table n Source Payload) :
    (heads table).length + ((arguments table).length + (others table).length) = n := by
  simpa using (partition_perm table).length_eq

/-- Proof support includes both supplied arguments and proof-valued function heads. -/
theorem proofRefs_perm (table : Table n Source Payload) :
    (proofRefs table).Perm ((List.finRange n).filter fun i => (table i).role.isProof) := by
  have h := List.Perm.filter (fun i => (table i).role.isProof) (partition_perm table)
  have ha : (arguments table).filter (fun i => (table i).role.isProof) = arguments table := by
    apply List.filter_eq_self.mpr
    intro i hi
    exact (Role.isProof_eq_true _).mpr ((mem_arguments table i).mp hi).2
  have ho : (others table).filter (fun i => (table i).role.isProof) = [] := by
    apply List.filter_eq_nil_iff.mpr
    intro i hi hp
    exact ((mem_others table i).mp hi).2 ((Role.isProof_eq_true _).mp hp)
  simp only [List.filter_append, ha, ho, List.append_nil] at h
  exact List.perm_append_comm.trans h

theorem proof_position_conservation (table : Table n Source Payload) :
    (arguments table).length + ((heads table).filter fun i => (table i).role.isProof).length =
      ((List.finRange n).filter fun i => (table i).role.isProof).length := by
  simpa [proofRefs] using (proofRefs_perm table).length_eq

variable [BEq Source] [LawfulBEq Source]

def sourceKeys (table : Table n Source Payload) : List Source :=
  ((proofRefs table).map fun i => (table i).source).eraseDups

/-- Uses inside a source bucket retain the original boundary order. -/
def bundle (table : Table n Source Payload) (key : Source) : List (Fin n) :=
  (List.finRange n).filter fun i => (table i).role.isProof && (table i).source == key

@[simp] theorem mem_bundle (table : Table n Source Payload) (key : Source) (i : Fin n) :
    i ∈ bundle table key ↔ (table i).role = .proof ∧ (table i).source = key := by
  simp [bundle, List.mem_filter, List.mem_finRange]

@[simp] theorem mem_sourceKeys (table : Table n Source Payload) (key : Source) :
    key ∈ sourceKeys table ↔ ∃ i : Fin n, (table i).role = .proof ∧ (table i).source = key := by
  simp [sourceKeys, List.mem_map]

/-- `eraseDups` leaves exactly one key for each original equality class. -/
theorem eraseDups_nodup (keys : List Source) : keys.eraseDups.Nodup := by
  cases keys with
  | nil => simp
  | cons key tail =>
    rw [List.eraseDups_cons]
    apply List.nodup_cons.mpr
    constructor
    · intro h
      have h' := List.mem_eraseDups.mp h
      simp at h'
    · exact eraseDups_nodup (tail.filter fun other => !(other == key))
termination_by keys.length
decreasing_by
  simp only [List.length_cons]
  exact Nat.lt_succ_of_le (List.length_filter_le _ _)

theorem sourceKeys_nodup (table : Table n Source Payload) : (sourceKeys table).Nodup :=
  eraseDups_nodup _

omit [LawfulBEq Source] in
theorem bundle_original_order (table : Table n Source Payload) (key : Source) :
    (bundle table key).Sublist (List.finRange n) := List.filter_sublist

omit [LawfulBEq Source] in
theorem bundle_nodup (table : Table n Source Payload) (key : Source) :
    (bundle table key).Nodup :=
  (bundle_original_order table key).nodup (List.nodup_finRange n)

theorem unique_proof_source (table : Table n Source Payload) (i : Fin n)
    (hi : (table i).role = .proof) :
    ∃ key, (key ∈ sourceKeys table ∧ i ∈ bundle table key) ∧
      ∀ other, other ∈ sourceKeys table ∧ i ∈ bundle table other → other = key := by
  refine ⟨(table i).source, ⟨(mem_sourceKeys table _).mpr ⟨i, hi, rfl⟩,
    (mem_bundle table _ i).mpr ⟨hi, rfl⟩⟩, ?_⟩
  intro key hk
  exact ((mem_bundle table key i).mp hk.2).2.symm

structure Projection (n : Nat) (Source : Type u) where
  heads : List (Fin n)
  arguments : List (Fin n)
  others : List (Fin n)
  groups : List (Source × List (Fin n))
  deriving Repr, DecidableEq

def project (table : Table n Source Payload) : Projection n Source :=
  ⟨heads table, arguments table, others table,
    (sourceKeys table).map fun key => (key, bundle table key)⟩

/-- Reuse the immutable original table; only admitted original references can be read. -/
def recoverAt (table : Table n Source Payload) (projection : Projection n Source)
    (i : Fin n) : Option (Cell Source Payload) :=
  if i ∈ projection.heads ++ (projection.arguments ++ projection.others)
  then some (table i) else none

omit [LawfulBEq Source] in
theorem recoverAt_project (table : Table n Source Payload) (i : Fin n) :
    recoverAt table (project table) i = some (table i) := by
  have h := (partition_perm table).mem_iff.mpr (List.mem_finRange i)
  simp [recoverAt, project, h]

/-- Canonical position enumeration restores the exact ordered cells, including all payloads. -/
def recoverOrdered (table : Table n Source Payload) (projection : Projection n Source) :=
  List.ofFn fun i => recoverAt table projection i

omit [LawfulBEq Source] in
theorem ordered_metadata_recovery (table : Table n Source Payload) :
    recoverOrdered table (project table) = List.ofFn (fun i => some (table i)) := by
  simp [recoverOrdered, recoverAt_project]

theorem group_membership (table : Table n Source Payload) (key : Source) (i : Fin n) :
    (key, bundle table key) ∈ (project table).groups ∧ i ∈ bundle table key ↔
      (table i).role = .proof ∧ (table i).source = key := by
  constructor
  · intro h; exact (mem_bundle table key i).mp h.2
  · intro h
    constructor
    · simp only [project, List.mem_map, Prod.mk.injEq]
      exact ⟨key, (mem_sourceKeys table key).mpr ⟨i, h⟩, rfl, rfl⟩
    · exact (mem_bundle table key i).mpr h

theorem same_source_iff_shared_bucket (table : Table n Source Payload) (i j : Fin n)
    (hi : (table i).role = .proof) (hj : (table j).role = .proof) :
    (∃ key, i ∈ bundle table key ∧ j ∈ bundle table key) ↔
      (table i).source = (table j).source := by
  constructor
  · rintro ⟨key, hki, hkj⟩
    exact (mem_bundle table key i).mp hki |>.2 |>.trans ((mem_bundle table key j).mp hkj).2.symm
  · intro h
    exact ⟨(table i).source, (mem_bundle table _ i).mpr ⟨hi, rfl⟩,
      (mem_bundle table _ j).mpr ⟨hj, h.symm⟩⟩

end ProofAtlas.Boundary
