/- Inserted inside AtlasPacketReplay before decode. The older experiment's
   Boolean-only metadata decoder remains unchanged. No repr is elaborated. -/
def refinementMetadata (p : Json) : Except String KVMap := do
  let entries ← p.getObjValAs? (Array Json) "metadata"
  let mut data := KVMap.empty
  for e in entries do
    let n ← name e "keyNameParts" "key"
    let value ← field e "value"
    let kind ← value.getObjValAs? String "kind"
    let repr ← value.getObjValAs? String "repr"
    if kind == "ofBool" then
      if repr == "Lean.DataValue.ofBool true" then data := data.setBool n true
      else if repr == "Lean.DataValue.ofBool false" then data := data.setBool n false
      else throw "Boolean metadata representation"
    else if kind == "ofString" then
      let marker := "Lean.DataValue.ofString "
      unless repr.startsWith marker do throw "String metadata prefix"
      let literal := (repr.drop marker.length).toString
      let text ← (← Json.parse literal).getStr?
      unless reprStr (DataValue.ofString text) == repr do throw "Noncanonical string metadata"
      data := data.setString n text
    else throw "Unsupported metadata constructor: finite replay supports Boolean and canonical JSON-compatible string reprs"
  return data
