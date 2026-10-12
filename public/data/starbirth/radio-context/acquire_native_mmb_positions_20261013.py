"""Once-only small static MMB catalogue retrieval; no coordinate query or retry."""
import argparse,hashlib,json,shutil,ssl,time
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import build_opener,HTTPSHandler,HTTPRedirectHandler,Request
ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/native_mmb_position_registration_20261013.json'
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
def main(stage):
 reg=json.loads(REG.read_text())
 for item in reg['inputs']:
  p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and digest(p)==item['sha256']
 target=stage/'catalog.dat';assert not target.exists() and not (stage/'acquisition.json').exists()
 receipt={'schema':'native-mmb-position-acquisition/1','registration_sha256':digest(REG),
          'url':reg['url'],'started_utc':datetime.now(timezone.utc).isoformat(),
          'complete':False,'response_bytes':0,'retries':0,'coordinate_uploads':0}
 start=time.monotonic()
 try:
  assert shutil.disk_usage(stage).free>5*1024**3+1024**2
  context=ssl.create_default_context(cafile='/etc/ssl/cert.pem')
  opener=build_opener(NoRedirect,HTTPSHandler(context=context))
  with opener.open(Request(reg['url'],headers={'Accept-Encoding':'identity','User-Agent':'Starbirth-three-case-native-radio-association/1'}),timeout=60) as response:
   assert response.status==200 and response.geturl()==reg['url']
   receipt.update(http_status=response.status,content_type=response.headers.get('Content-Type',''))
   with target.open('xb') as f:
    while receipt['response_bytes']<=131072:
     data=response.read(min(16384,131073-receipt['response_bytes']))
     if not data:break
     f.write(data);receipt['response_bytes']+=len(data)
     assert shutil.disk_usage(stage).free>5*1024**3
   receipt['sha256']=digest(target)
   assert receipt['response_bytes']<=131072,'Response ceiling'
  rows=target.read_bytes().decode('ascii').splitlines()
  assert len(rows)==707 and all(39<=len(row)<=114 for row in rows),'Native catalogue size/schema contract'
  for row in rows:
   assert row[:14].strip() and row[14:15] in (' ','+','a')
   assert row[28] in '+-' and row[16:18].strip().isdigit() and row[19:21].strip().isdigit()
   assert 0<=int(row[16:18])<24 and 0<=int(row[19:21])<60 and 0<=float(row[22:27])<60
   assert 0<=int(row[29:31])<=90 and 0<=int(row[32:34])<60 and 0<=float(row[35:39])<60
  receipt.update(complete=True,native_rows=len(rows))
 except Exception as error:
  receipt.update(error_type=type(error).__name__,error=str(error)[:500])
  if target.exists():receipt.update(response_bytes=target.stat().st_size,sha256=digest(target))
  raise
 finally:
  receipt['elapsed_seconds']=time.monotonic()-start
  with (stage/'acquisition.json').open('x') as f:json.dump(receipt,f,indent=2);f.write('\n')
  print(json.dumps(receipt,indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=Path);a=p.parse_args();main(a.stage)
