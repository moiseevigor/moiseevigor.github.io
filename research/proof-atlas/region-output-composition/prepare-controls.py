"""Build only the three authored core Lean controls; logs remain temporary."""
import argparse,hashlib,json,os,sys
from pathlib import Path
BASE=Path(__file__).resolve().parent;RESEARCH=BASE.parent
sys.path.insert(0,str(RESEARCH))
from build_recursion_examples import run_checked
from evaluate_goedel import sandbox_profile
p=argparse.ArgumentParser();p.add_argument('--lean',type=Path,required=True);p.add_argument('--workdir',type=Path,required=True);a=p.parse_args()
folder=a.workdir.resolve();folder.mkdir(exist_ok=False);lean=a.lean.resolve();raw=(BASE/'Controls.lean').read_bytes();(folder/'CompositionControls.lean').write_bytes(raw);(folder/'scratch').mkdir()
env={'PATH':str(lean.parent)+':/usr/bin:/bin','LEAN_PATH':str(folder),'LANG':'en_US.UTF-8','TMPDIR':str(folder/'scratch')};prefix=['/usr/bin/sandbox-exec','-p',sandbox_profile(lean,folder,[folder]),str(lean),'-j1','-M2048']
run_checked(prefix+['-o',str(folder/'CompositionControls.olean'),str(folder/'CompositionControls.lean')],folder,'compile',env)
exporter=(RESEARCH/'ExportLibrary.lean').read_text().replace('import SE2Conjugate','import CompositionControls').replace('startsWith "SE2Conjugate."','startsWith "CompositionControls"');entry=folder/'Export.lean';entry.write_text(exporter+'\n#atlas_library '+json.dumps(str(folder/'packets'))+'\n');run_checked(prefix+[str(entry)],folder,'export',env)
assert len(json.loads((folder/'packets/inventory.json').read_bytes()))==3;assert raw==(BASE/'Controls.lean').read_bytes();print(json.dumps({'status':'PASS','sourceSha256':hashlib.sha256(raw).hexdigest()}))
