"""Once-only bounded public catalogue excerpt; no uploads, retries or fitting."""
import argparse,csv,hashlib,io,json,shutil,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,build_opener,HTTPRedirectHandler
ROOT=Path(__file__).resolve().parents[1];REG=ROOT/'artifacts/native_glimpse_registration_20261012.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*a,**k):return None
def run(stage):
 reg=json.loads(REG.read_text())
 for r in reg['inputs']:
  p=ROOT/r['path'];assert p.stat().st_size==r['bytes'] and sha(p)==r['sha256'],p
 opener=build_opener(NoRedirect);log=[];total=0;began=time.monotonic()
 try:
  for plan in reg['requests']:
   assert time.monotonic()-began<600 and shutil.disk_usage(stage).free>5*1024**3+8*1024**2
   p=stage/plan['response_file'];assert not p.exists();item=dict(plan,status='requesting',requested_utc=datetime.now(timezone.utc).isoformat());log.append(item)
   try:
    with opener.open(Request(plan['url'],headers={'User-Agent':'Starbirth-native-GLIMPSE-fixed-three-cases/1','Accept-Encoding':'identity'}),timeout=90) as response:
     assert response.status==200 and response.geturl()==plan['url'];item['http_status']=response.status;item['content_type']=response.headers.get('Content-Type','');chunks=[];count=0
     while True:
      b=response.read(min(65536,1024**2+1-count))
      if not b:break
      chunks.append(b);count+=len(b)
      if count>1024**2:break
     data=b''.join(chunks);p.write_bytes(data);total+=len(data);item.update(bytes=len(data),sha256=sha(p))
     assert count<=1024**2 and total<=6*1024**2,'response cap'
    text=data.decode('utf-8-sig');reader=csv.DictReader(io.StringIO(text));assert reader.fieldnames==reg['columns'],'native schema'
    rows=list(reader);assert len(rows)<1001,'truncation sentinel'
    assert len({r['cntr'] for r in rows})==len(rows) and len({r['designation'] for r in rows})==len(rows),'duplicate native ID'
    item.update(status='complete_native_csv',rows=len(rows))
   except Exception as error:
    item.update(status='stopped',error_type=type(error).__name__,error=str(error)[:500]);raise
 finally:
  record=dict(schema='bounded-native-glimpse-acquisition/1',registration_sha256=sha(REG),complete=len(log)==6 and all(x['status']=='complete_native_csv' for x in log),requests=log,total_response_bytes=total,elapsed_seconds=time.monotonic()-began,coordinate_uploads=0,retries=0,model_fitted=False)
  with (stage/'acquisition.json').open('x') as f:json.dump(record,f,indent=2);f.write('\n')
  print(json.dumps({k:v for k,v in record.items() if k!='requests'},indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path,required=True);a=p.parse_args();assert a.stage.is_dir();run(a.stage)
