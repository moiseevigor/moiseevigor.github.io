"""Explicit refinement of the frozen port observer's let bridge.

The old observer is retained unchanged. A source let is checked against direct
zeta substitution; optional lambda/application probes are reported separately.
"""
OLD = '''   let expanded := (mkApp (.lam n t b .default) v).instantiateRev (xs.extract 0 pos)
   let type ← kernelType closed
   kernelAs expanded type
   convert closed expanded'''

NEW = '''   let sourceXs := xs.extract 0 pos
   let reduced := (b.instantiate1 v).instantiateRev sourceXs
   let lambda := (Expr.lam n t b .default).instantiateRev sourceXs
   let beta := mkApp lambda (v.instantiateRev sourceXs)
   let type ← kernelType closed
   kernelAs reduced type
   convert closed reduced
   let env ← getEnv
   let ctx ← getLCtx
   let lambdaStatus := match Kernel.check env ctx lambda with
     | .ok _ => "CHECKED" | .error _ => "REJECTED"
   let betaStatus := match Kernel.check env ctx beta with
     | .ok _ => "CHECKED" | .error _ => "REJECTED"
   let betaConversion := match Kernel.isDefEq env ctx closed beta with
     | .ok true => "TRUE" | .ok false => "FALSE" | .error _ => "ERROR"
   let mut probeGraph : Shared := {}
   let mut probeRoots : Array Nat := #[]
   for expression in #[closed,reduced,lambda,beta,type] do
    let (root,next) ← internScoped expression sourceXs probeGraph 65536
    probeGraph := next
    probeRoots := probeRoots.push root
   zetaChecks := zetaChecks.push <| obj [("sourceBinder",binder),
    ("contextLength",nat pos),("nondep",toJson nondep),
    ("kernelLetTyping",str "PASS"),("kernelZetaTyping",str "PASS"),
    ("kernelZetaConversion",str "PASS"),("betaLambdaTyping",str lambdaStatus),
    ("betaApplicationTyping",str betaStatus),("rawBetaConversion",str betaConversion),
    ("graph",(graphJson probeGraph).mergeObj (obj [("roots",toJson probeRoots)]))]'''

def refine(source):
    replacements = [
        (' let mut hops : Array Json := #[]', ' let mut hops : Array Json := #[]\n let mut zetaChecks : Array Json := #[]'),
        (OLD, NEW),
        ('("format",str "ProofAtlasApplicationPort/1")', '("format",str "ProofAtlasApplicationPort/2")'),
        ('("kernelBindingAbstractionConversions",str "PASS")', '("kernelBindingZetaConversions",str "PASS")'),
        ('("definitionBoundary",toJson boundary),("openTermConversion",toJson openTermConversion)',
         '("definitionBoundary",toJson boundary),("openTermConversion",toJson openTermConversion),\n  ("bindingConversionRule",str "direct-zeta/1"),("bindingZetaChecks",toJson zetaChecks)')
    ]
    for before, after in replacements:
        assert source.count(before) == 1, 'Frozen observer patch boundary changed'
        source = source.replace(before, after)
    return source
