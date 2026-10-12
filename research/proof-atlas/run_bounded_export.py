"""Run the lossless shared-term exporter with resource and free-space guards.

One declaration at a time; log free space, output bytes, RSS and elapsed time.
Stops safely before exceeding the configured budget. No package caches are removed.
"""
import argparse,json,os,resource,shutil,subprocess,time
from pathlib import Path

def main():
 p=argparse.ArgumentParser();p.add_argument('--snapshot',type=Path,required=True);p.add_argument('--output',type=Path,required=True);p.add_argument('--lean',required=True)
 p.add_argument('--max-output-mib',type=int,default=1024);p.add_argument('--min-free-gib',type=int,default=30);p.add_argument('--max-rss-mib',type=int,default=8192);p.add_argument('--timeout',type=int,default=1800);a=p.parse_args()
 if a.output.exists():raise SystemExit('Use a fresh output directory; existing evidence is never overwritten.')
 a.output.mkdir(parents=True);code=Path(__file__).with_name('ExportLibrary.lean').read_text();entry=a.snapshot/'AtlasBoundedExport.lean'
 entry.write_text(code+'\n#atlas_library '+json.dumps(str(a.output.resolve()))+'\n')
 env=dict(os.environ,LEAN_PATH=(a.snapshot/'lean-env-path.txt').read_text().strip());started=time.monotonic();samples=[];reason=None
 def limits():resource.setrlimit(resource.RLIMIT_FSIZE,(256*1024**2,256*1024**2))
 with (a.output/'export.log').open('w')as log:
  proc=subprocess.Popen([a.lean,str(entry)],env=env,stdout=log,stderr=subprocess.STDOUT,preexec_fn=limits)
  try:
   while True:
    free=shutil.disk_usage(a.output).free;size=sum(f.stat().st_size for f in a.output.iterdir()if f.is_file())
    r=subprocess.run(['ps','-o','rss=','-p',str(proc.pid)],capture_output=True,text=True);rss=int(r.stdout.strip()or 0)*1024
    sample={'seconds':round(time.monotonic()-started,2),'freeBytes':free,'outputBytes':size,'rssBytes':rss};samples.append(sample)
    (a.output/'resource-audit.json').write_text(json.dumps({'limits':vars(a)|{'snapshot':str(a.snapshot),'output':str(a.output)},'samples':samples},indent=2))
    code=proc.poll()
    if r.returncode and code is None:raise RuntimeError('Memory monitor unavailable; refusing to run unmonitored.')
    if free<a.min_free_gib*1024**3:reason='free disk reserve'
    elif size>a.max_output_mib*1024**2:reason='export byte budget'
    elif rss>a.max_rss_mib*1024**2:reason='memory budget'
    elif sample['seconds']>a.timeout:reason='time budget'
    if reason:
     if code is None:proc.terminate();proc.wait(timeout=15)
     break
    if code is not None:break
    time.sleep(5)
  finally:
   if proc.poll()is None:proc.kill();proc.wait()
 result={'limits':{'maxOutputBytes':a.max_output_mib*1024**2,'minFreeBytes':a.min_free_gib*1024**3,'maxRssBytes':a.max_rss_mib*1024**2,'timeoutSeconds':a.timeout,'maxFileBytes':256*1024**2},'exitCode':proc.returncode,'stopReason':reason,'maxRssBytes':max(s['rssBytes']for s in samples),'minFreeBytes':min(s['freeBytes']for s in samples),'maxOutputBytes':max(s['outputBytes']for s in samples),'seconds':round(time.monotonic()-started,2),'samples':samples}
 (a.output/'resource-audit.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k!='samples'}))
 if reason or proc.returncode:raise SystemExit(1)
 if not(a.output/'inventory.json').exists():raise SystemExit('No completed inventory; export is incomplete.')
if __name__=='__main__':main()
