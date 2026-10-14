"""One deliberately amended three-cone delivery; preserves raw VO text and exact CSV fields."""
import argparse,csv,hashlib,io,json,math,re,shutil,ssl,time,xml.etree.ElementTree as ET
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,HTTPSHandler,HTTPRedirectHandler,build_opener
ROOT=Path(__file__).resolve().parents[1]
OLD='artifacts/native_profile_quality_registration_20261013.json'
AMEND='artifacts/native_profile_gator_amendment_20261013.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
class NoRedirect(HTTPRedirectHandler):
 def redirect_request(self,*args,**kwargs):return None
def decode(data,columns):
 assert b'<!DOCTYPE' not in data.upper() and b'<!ENTITY' not in data.upper()
 root=ET.fromstring(data);tag=lambda x:x.tag.rsplit('}',1)[-1]
 assert tag(root)=='VOTABLE'
 for node in root.iter():
  if tag(node)=='INFO' and node.get('name','').upper()=='QUERY_STATUS':assert node.get('value','').upper() not in ['ERROR','OVERFLOW'],ET.tostring(node,encoding='unicode')[:300]
 tables=[x for x in root.iter() if tag(x)=='TABLE'];assert len(tables)==1
 table=tables[0];fields=[dict(x.attrib) for x in table if tag(x)=='FIELD'];names=[x.get('name') for x in fields]
 assert None not in names and len(names)==len(set(names)) and all(c in names for c in columns)
 blocks=[x for x in table.iter() if tag(x)=='TABLEDATA'];assert len(blocks)==1
 native=[]
 for row in blocks[0]:
  assert tag(row)=='TR';values=[x.text if x.text is not None else '' for x in row]
  assert all(tag(x)=='TD' and len(x)==0 for x in row) and len(values)==len(names)
  mapping=dict(zip(names,values));native.append({c:mapping[c] for c in columns})
 assert len(native)<5001,'Maximum-row truncation sentinel'
 return native,fields

def main(stage):
 old=json.loads((ROOT/OLD).read_text());amend=json.loads((ROOT/AMEND).read_text())
 assert amend['original_registration_sha256']==sha(ROOT/OLD)
 for x in amend['inputs']:
  p=ROOT/x['path'];assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256']
 assert not (stage/'acquisition.json').exists()
 receipt={'schema':'native-profile-gator-amended-acquisition/1','registration_sha256':sha(ROOT/OLD),'transport_amendment_sha256':sha(ROOT/AMEND),'requests':[],'complete':False,'raw_response_bytes':0,'response_bytes':0,'normalized_csv_bytes':0,'literal_url_retries':0,'deliberate_amended_resumptions':1,'previous_terminal_attempt_preserved':True,'coordinate_list_uploads':0,'physical_validation':False,'new_stars':0,'new_births':0}
 opener=build_opener(NoRedirect,HTTPSHandler(context=ssl.create_default_context(cafile='/etc/ssl/cert.pem')));start=time.monotonic()
 try:
  for plan in amend['requests']:
   assert time.monotonic()-start<amend['remaining_acquisition_wall_seconds'] and shutil.disk_usage(stage).free>5*1024**3+8*1024**2
   r=dict(plan,status='requesting',requested_utc=datetime.now(timezone.utc).isoformat());receipt['requests'].append(r)
   raw=stage/plan['raw_response_file'];target=stage/plan['response_file'];assert not raw.exists() and not target.exists()
   try:
    with opener.open(Request(plan['url'],headers={'User-Agent':'Starbirth-native-quality-deliberate-Gator-amendment/1','Accept-Encoding':'identity'}),timeout=90) as response:
     assert response.status==200 and response.geturl()==plan['url'];r.update(http_status=response.status,content_type=response.headers.get('Content-Type',''))
     with raw.open('xb') as f:
      count=0
      while count<=2*1024**2:
       b=response.read(min(65536,2*1024**2+1-count))
       if not b:break
       f.write(b);count+=len(b);receipt['raw_response_bytes']+=len(b)
       assert receipt['raw_response_bytes']<=6*1024**2 and sum(p.stat().st_size for p in stage.iterdir() if p.is_file())<8*1024**2 and shutil.disk_usage(stage).free>5*1024**3
     r.update(raw_bytes=raw.stat().st_size,raw_sha256=sha(raw));assert r['raw_bytes']<=2*1024**2
    rows,fields=decode(raw.read_bytes(),old['columns'])
    assert len({x['source_id'] for x in rows})==len(rows) and len({x['cntr'] for x in rows})==len(rows)
    for x in rows:
     m=re.fullmatch(r'([0-9]{5}[a-z])([0-9]{3})-([0-9]{6})',x['source_id']);assert m
     scan,frame,n=m.groups();assert x['scan_id']==scan and int(x['frame_num'])==int(frame) and x['frame_num'].isdigit()
     assert x['cntr'].isdigit() and int(x['cntr'])==int(scan[:5]+f'{ord(scan[-1])-96:02d}'+frame+n)
     assert all(math.isfinite(float(x[k])) for k in ['ra','dec','mjd'])
    stream=io.StringIO(newline='');w=csv.DictWriter(stream,fieldnames=old['columns'],lineterminator='\n');w.writeheader();w.writerows(rows)
    normalized=stream.getvalue().encode();assert len(normalized)<=2*1024**2
    target.write_bytes(normalized);receipt['normalized_csv_bytes']+=len(normalized);receipt['response_bytes']+=len(normalized)
    r.update(bytes=len(normalized),sha256=sha(target),rows=len(rows),native_field_metadata=fields,status='complete_native_csv')
    assert receipt['normalized_csv_bytes']<=6*1024**2 and sum(p.stat().st_size for p in stage.iterdir() if p.is_file())<8*1024**2
   except Exception as error:
    r.update(status='stopped',error_type=type(error).__name__,error=str(error)[:500])
    if raw.exists():r.update(raw_bytes=raw.stat().st_size,raw_sha256=sha(raw))
    if target.exists():r.update(bytes=target.stat().st_size,sha256=sha(target))
    raise
  receipt['complete']=len(receipt['requests'])==3 and all(x['status']=='complete_native_csv' for x in receipt['requests'])
 finally:
  receipt['elapsed_seconds']=time.monotonic()-start
  (stage/'acquisition.json').write_text(json.dumps(receipt,indent=2)+'\n')
  print(json.dumps({k:v for k,v in receipt.items() if k!='requests'},indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('stage',type=Path);a=p.parse_args();main(a.stage)
