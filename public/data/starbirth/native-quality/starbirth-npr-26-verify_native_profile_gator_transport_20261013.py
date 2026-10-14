"""Independent original VO strings / CSV bindings, or terminal-stop verification. No network."""
import argparse,csv,hashlib,json,math,xml.dom.minidom as DOM
from pathlib import Path
from urllib.parse import parse_qs,urlsplit
ROOT=Path(__file__).resolve().parents[1];OLD='artifacts/native_profile_quality_registration_20261013.json';AMEND='artifacts/native_profile_gator_amendment_20261013.json'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def local(node):return node.localName or node.tagName
def children(node,name):return [x for x in node.childNodes if x.nodeType==x.ELEMENT_NODE and local(x)==name]
def content(node):
 assert not any(x.nodeType==x.ELEMENT_NODE for x in node.childNodes)
 return ''.join(x.data for x in node.childNodes if x.nodeType in (x.TEXT_NODE,x.CDATA_SECTION_NODE))
def compare_vo(raw,columns,normalized):
 data=raw.read_bytes();assert b'<!DOCTYPE' not in data.upper() and b'<!ENTITY' not in data.upper()
 dom=DOM.parseString(data);assert local(dom.documentElement)=='VOTABLE'
 tables=[n for n in dom.getElementsByTagName('*') if local(n)=='TABLE'];assert len(tables)==1
 table=tables[0];fields=children(table,'FIELD');names=[x.getAttribute('name') for x in fields]
 assert len(names)==len(set(names)) and all(c in names for c in columns)
 infos=[x for x in dom.getElementsByTagName('*') if local(x)=='INFO' and x.getAttribute('name').upper()=='QUERY_STATUS'];assert all(x.getAttribute('value').upper() not in ('OVERFLOW','ERROR') for x in infos)
 td=[n for n in table.getElementsByTagName('*') if local(n)=='TABLEDATA'];assert len(td)==1
 original=[]
 for tr in children(td[0],'TR'):
  cells=children(tr,'TD');assert len(cells)==len(names)
  mapping=dict(zip(names,[content(x) for x in cells]));original.append({c:mapping[c] for c in columns})
 with normalized.open(newline='') as f:r=csv.DictReader(f);assert r.fieldnames==columns;saved=list(r)
 assert original==saved and len(saved)<5001
 # Check exact string fidelity including counters above 2^53 and zero-padded flags.
 assert len({x['source_id'] for x in saved})==len(saved) and len({x['cntr'] for x in saved})==len(saved)
 return len(saved)
def main(acq,stage):
 old=json.loads((ROOT/OLD).read_text());amend=json.loads((ROOT/AMEND).read_text());r=json.loads((acq/'acquisition.json').read_text());guard=json.loads((acq/'resource_monitor.json').read_text())
 for x in amend['inputs']:
  p=ROOT/x['path'];assert p.stat().st_size==x['bytes'] and sha(p)==x['sha256']
 assert r['registration_sha256']==amend['original_registration_sha256']==sha(ROOT/OLD) and r['transport_amendment_sha256']==sha(ROOT/AMEND)
 assert r['literal_url_retries']==0 and r['deliberate_amended_resumptions']==1 and r['coordinate_list_uploads']==0
 assert 1<=len(r['requests'])<=3 and guard['samples'][-1]['workers']==[] and guard['minimum_observed_free_bytes']>5*1024**3 and guard['elapsed_seconds']<=amend['remaining_acquisition_wall_seconds']+2
 count=0;rawsum=0;csvsum=0
 for case,plan,req in zip(old['cases'],amend['requests'],r['requests']):
  assert all(req[k]==plan[k] for k in plan) and req['case_id']==case['id']
  query=parse_qs(urlsplit(req['url']).query);assert query=={k:[v] for k,v in plan['parameters'].items()}
  assert query['radius']==['12'] and query['radunits']==['arcsec'] and query['outrows']==['5001'] and query['outfmt']==['3'] and query['objstr']==[case['ra']+' '+case['dec']]
  raw=acq/req['raw_response_file'];csvpath=acq/req['response_file']
  if raw.exists():assert sha(raw)==req['raw_sha256'] and raw.stat().st_size==req['raw_bytes'];rawsum+=raw.stat().st_size
  if csvpath.exists():assert sha(csvpath)==req['sha256'] and csvpath.stat().st_size==req['bytes'];csvsum+=csvpath.stat().st_size
  if req['status']=='complete_native_csv':
   assert req['http_status']==200;rows=compare_vo(raw,old['columns'],csvpath);assert rows==req['rows'];count+=rows
  else:
   assert req['status']=='stopped' and req.get('error_type')
   assert req is r['requests'][-1] and not r['complete']
 assert csvsum==r['normalized_csv_bytes']==r['response_bytes']
 if r['complete']:
  assert len(r['requests'])==3 and all(x['status']=='complete_native_csv' for x in r['requests']) and guard['completed'] and guard['child_exit_code']==0 and guard['stop_reason'] is None
 else:assert not guard['completed'] and guard['child_exit_code']!=0
 # Prefix receipts may exceed a response ceiling by at most one sentinel byte.
 assert rawsum<=6*1024**2+1 and csvsum<=6*1024**2 and sum(p.stat().st_size for p in acq.iterdir() if p.is_file())<=8*1024**2+1024
 result={'schema':'native-profile-gator-independent-transport-verification/1','verified':True,'registration_sha256':sha(ROOT/OLD),'amendment_sha256':sha(ROOT/AMEND),'acquisition_sha256':sha(acq/'acquisition.json'),'complete_delivery':r['complete'],'native_vo_rows_byte_field_equivalent_to_csv':count,'requests_attempted':len(r['requests']),'raw_retained_bytes':rawsum,'normalized_csv_bytes':csvsum,'original_science_rules_unchanged':True,'stop_is_not_scientific_negative':not r['complete'],'cause_beyond_observed_error':'unknown' if not r['complete'] else None,'measurement_analyzer_allowed':r['complete'],'physical_validation':False}
 (stage/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('acquisition',type=Path);p.add_argument('stage',type=Path);a=p.parse_args();main(a.acquisition,a.stage)
