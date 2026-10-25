"""Run the unchanged single-recursor observer on the freshly checked mutual controls."""
import argparse,hashlib,importlib.util,json,os,sys,subprocess
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent;ROOT=RESEARCH.parents[1];sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
def sha(b):return hashlib.sha256(b).hexdigest()
def module(name,path):
 s=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
def main():
 p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--cache',type=Path,required=True);p.add_argument('--native-dir',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args();folder=a.workdir.resolve();folder.mkdir(exist_ok=False);(folder/'scratch').mkdir();v=json.loads((a.native_dir/'verification.json').read_bytes());runtime=(a.native_dir/'Runtime.lean').read_bytes();assert sha(runtime)==v['runtimeSha256'];core=runtime.decode().rsplit('#atlas_branch_interfaces ',1)[0];paths,recovery=module('mutual_legacy_cache',RESEARCH/'use-sites/verify.py').recovered(a.cache.resolve());assert recovery==v['dependencyRecovery'];request=[{'name':r['record']['name'],'route':r['route']} for r in v['records']];(folder/'request.json').write_text(json.dumps(request))
 probe=r'''
namespace AtlasMutualLegacy
open Lean Elab Command Meta AtlasLibrary AtlasOccurrenceTypes
def observe (original term : Expr) (xs : Array Expr) (_context : Array Json) (shared : Shared) (root : Nat) (slots : Array Nat) (path : String) : MetaM Json := do
 try
  let result ← eliminationJudgment original term (← kernelType term) xs shared {} root slots path
  return obj [("status",str (if result.isSome then "checked" else "not-recognized"))]
 catch error => return obj [("status",str "unavailable"),("reason",str (← error.toMessageData.toString))]
run_cmd do
 let cases ← readJson REQUEST
 let mut rows : Array Json := #[]
 let queries ← match cases.getArr? with | .ok values => pure values | .error error => throwError error
 for query in queries do
  let name ← string query "name"
  let route ← field query "route"
  let root := (route.getObjValAs? Nat "root").toOption.get!
  let slots := (route.getObjValAs? (Array Nat) "slots").toOption.get!
  let info ← getConstInfo name.toName
  let some value := info.value? true | throwError "No mutual body"
  let (_,s) := AtlasLibrary.intern info.type {}
  let (_,s) := AtlasLibrary.intern value s
  let row ← liftTermElabM fun _ => atRouteWith value slots.toList #[] #[] s root #[] "root.value" observe
  rows := rows.push (obj [("name",str name),("query",route),("observation",row)])
 liftIO <| IO.FS.writeFile OUTPUT (toJson rows).compress
end AtlasMutualLegacy
'''.replace('REQUEST',json.dumps(str(folder/'request.json'))).replace('OUTPUT',json.dumps(str(folder/'legacy.json')))
 entry=folder/'Legacy.lean';entry.write_text(core+probe);lean=a.lean.resolve();env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':os.pathsep.join(map(str,paths)),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};run_checked(['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,paths),str(lean),str(entry)],folder,'legacy',env,timeout=120);rows=json.loads((folder/'legacy.json').read_bytes());assert len(rows)==3 and all(r['observation']['status']=='unavailable' and 'Some minor premises have no mapped constructor rule' in r['observation']['reason'] for r in rows)
 report={'format':'ProofAtlasMutualLegacyBoundary/1','status':'PASS','nativeOutputSha256':v['nativeOutputSha256'],'baselineSourceSha256':sha((RESEARCH/'ExportOccurrenceTypes.lean').read_bytes()),'producerSha256':sha(Path(__file__).read_bytes()),'runtimeSha256':sha(entry.read_bytes()),'observations':rows,'scope':'The unchanged single-recursor observer refuses these three valid mutual calls because its own rules do not cover all family methods. This is a representation boundary, not an invalid proof or a general impossibility result.'};(folder/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
if __name__=='__main__':main()
