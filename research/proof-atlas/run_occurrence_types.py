"""Private bounded type extraction against existing compiled environments; no rebuild.

Requests and resource logs stay outside the public website. Only reviewed compiled
type evidence may be projected into public assets.
"""
import argparse, hashlib, json, os, resource, shutil, subprocess, time
from pathlib import Path

def main():
    p=argparse.ArgumentParser()
    p.add_argument('--snapshot',type=Path,required=True);p.add_argument('--requests',type=Path,required=True)
    p.add_argument('--output',type=Path,required=True);p.add_argument('--lean',type=Path,required=True)
    p.add_argument('--timeout',type=int,default=240)
    a=p.parse_args();assert not any(x.exists()for x in [a.output,a.output.with_suffix('.entry.lean'),a.output.with_suffix('.log'),a.output.with_suffix('.resources.json')]),'Do not overwrite extraction evidence'
    lean_path=(a.snapshot/'lean-env-path.txt').read_text().strip()
    compiler=subprocess.check_output([str(a.lean),'--version'],text=True).strip()
    assert 'version 4.33.1,' in compiler,'Compiler differs from the published packet version'
    manifest_bytes=(a.snapshot/'lake-manifest.json').read_bytes()
    packages={x['name']:x['rev'] for x in json.loads(manifest_bytes)['packages']}
    dependencies={}
    for entry_path in lean_path.split(os.pathsep):
        compiled=Path(entry_path)
        if not str(compiled).endswith('/.lake/build/lib/lean'):continue
        package=compiled.parents[3]
        if package.name not in packages:continue
        revision=subprocess.check_output(['git','rev-parse','HEAD'],cwd=package,text=True).strip()
        assert revision==packages[package.name],'Dependency revision mismatch: '+package.name
        dependencies[package.name]=revision
    assert 'mathlib'in dependencies,'Compiled Mathlib must have a pinned revision'
    environment={'compiler':compiler,'lakeManifestSha256':hashlib.sha256(manifest_bytes).hexdigest(),
                 'dependencyRevisions':dependencies,'pinnedDependenciesNotOnSearchPath':sorted(set(packages)-set(dependencies))}
    queries=json.loads(a.requests.read_text());assert len(queries)<=32,'Declaration query bound'
    for query in queries:
        assert len(query['routes'])<=512 and all(len(r['slots'])<=512 for r in query['routes']),'Occurrence query bound'
        raw=Path(query['packetFile']).read_bytes()
        assert hashlib.sha256(raw).hexdigest()==query['source']['indexSha256'],'Stale request packet'
        declaration=json.loads(raw)['declaration']
        source_file=a.snapshot/Path(*declaration['module'].split('.')).with_suffix('.lean')
        assert hashlib.sha256(source_file.read_bytes()).hexdigest()==query['source']['sourceSha256'],'Source module hash mismatch'
    tools=Path(__file__).parent
    source=(tools/'ExportLibrary.lean').read_text()+'\nset_option maxHeartbeats 5000000\nset_option maxRecDepth 8192\n'+(tools/'ExportOccurrenceTypes.lean').read_text().replace('import ExportLibrary','')
    source+='\n#atlas_occurrence_types '+json.dumps(str(a.requests.resolve()))+' => '+json.dumps(str(a.output.resolve()))+'\n'
    entry=a.output.with_suffix('.entry.lean');entry.write_text(source)
    env=dict(os.environ,LEAN_PATH=lean_path)
    samples=[];start=time.monotonic();reason=None
    def limits():
        resource.setrlimit(resource.RLIMIT_FSIZE,(64*1024**2,64*1024**2))
    with a.output.with_suffix('.log').open('w') as log:
        proc=subprocess.Popen([str(a.lean),str(entry)],cwd=a.snapshot,env=env,stdout=log,stderr=subprocess.STDOUT,preexec_fn=limits)
        try:
            while proc.poll() is None:
                rss_result=subprocess.run(['ps','-o','rss=','-p',str(proc.pid)],text=True,capture_output=True)
                if rss_result.returncode and proc.poll() is None: reason='Memory monitor unavailable';break
                rss=int(rss_result.stdout.strip()or 0)*1024
                free=shutil.disk_usage(a.output.parent).free
                elapsed=time.monotonic()-start
                samples.append({'seconds':round(elapsed,2),'rssBytes':rss,'freeBytes':free})
                if rss>8*1024**3:reason='8 GiB memory bound'
                elif free<30*1024**3:reason='30 GiB free-space reserve'
                elif elapsed>a.timeout:reason='Time bound'
                if reason:break
                time.sleep(.5)
        finally:
            if proc.poll() is None:
                proc.terminate()
                try:proc.wait(timeout=15)
                except subprocess.TimeoutExpired:proc.kill();proc.wait(timeout=5)
    audit={'exitCode':proc.returncode,'stopReason':reason,'seconds':round(time.monotonic()-start,2),
           'maxRssBytes':max((s['rssBytes']for s in samples),default=0),'samples':samples,
           'generatorSha256':hashlib.sha256(source.encode()).hexdigest(),
           'environment':environment}
    a.output.with_suffix('.resources.json').write_text(json.dumps(audit,indent=2)+'\n')
    print(json.dumps({k:v for k,v in audit.items()if k!='samples'}))
    if reason or proc.returncode:raise SystemExit(1)
    result=json.loads(a.output.read_text());assert all(r['nativeDagMatchesPacket']for r in result)
    for record in result:
        record['environment']=environment
        record['sourceModuleHashVerified']=True
    a.output.write_text(json.dumps(result,separators=(',',':'))+'\n')
    print(json.dumps({'status':'EXTRACTED','declarations':len(result),'checked':sum(x['status']=='checked'for r in result for x in r['entries']),'unavailable':sum(x['status']!='checked'for r in result for x in r['entries'])}))
if __name__=='__main__':main()
