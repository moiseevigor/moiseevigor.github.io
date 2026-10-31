/- Executable entry point: the elaboration environment is not kept resident. -/
def main (args : List String) : IO Unit := do
  match args with
  | [root,input,output] =>
    Lean.initSearchPath root
    AtlasRegionKernel.run input output
  | _ => throw <| IO.userError "Expected system root, input and output"
