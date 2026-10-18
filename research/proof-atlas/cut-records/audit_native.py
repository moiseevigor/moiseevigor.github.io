"""Independently recompute every emitted native binder target from original DAG paths.

No browser or native-checker code is imported. Expected packet hashes are supplied
by the caller. Whole source/record/result files have bounded reads, one packet at a time.
"""
import argparse,gzip,hashlib,json
from pathlib import Path

def sha(raw):return hashlib.sha256(raw).hexdigest()
def source_at(packet,root,slots):
 node=packet['roots'][root];context=[]
 for depth,slot in enumerate(slots):
  kind=packet['kind'][node]
  if kind in [6,7]and slot==1 or kind==8 and slot==2:context.append((node,slots[:depth]))
  node=packet['children'][node][slot]
 return node,context

def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--report',type=Path,required=True);p.add_argument('--requests',type=Path,nargs='+',required=True);p.add_argument('--output',type=Path);a=p.parse_args();assert a.report.stat().st_size<=16*1024**2;report=json.loads(a.report.read_text());assert report['status']=='PASS' and len(report['rows'])==len(a.requests)<=4096
 bindings=variables=external=0;source_cases=[]
 for request_file,row in zip(a.requests,report['rows']):
  assert request_file.stat().st_size<=64*1024**2;request=json.loads(request_file.read_text());assert request['expected']==row['source']
  with gzip.open(request['packetFile'],'rb')as f:raw=f.read(64*1024**2+1)
  assert len(raw)<=64*1024**2 and sha(raw)==request['expected']['indexSha256'];packet=json.loads(raw)
  native_file=a.report.parent/row['observationFile'];assert native_file.stat().st_size<=64*1024**2;raw=native_file.read_bytes();assert sha(raw)==row['nativeOutputSha256'];native=json.loads(raw);assert len(native['bindings'])==len(request['records'])
  for record,observed in zip(request['records'],native['bindings']):
   root=record['root']['route']['root'];base=record['root']['route']['slots'];expected=[]
   for entry in record['entries']:
    if entry['tag']!='node':continue
    absolute=base+entry['slots'];node,context=source_at(packet,root,absolute);assert node==entry['node']
    if packet['kind'][node]!=0:continue
    index=packet['payloads'][node]['index'];target=context[-1-index]if index<len(context)else None
    target_slots=target[1]if target else None;outside=bool(target and len(target_slots)<len(base));expected.append({'node':node,'root':root,'slots':absolute,'target':target_slots,'external':outside});variables+=1;bindings+=int(target is not None);external+=int(outside)
    if row['source']['name']=='JacobiCore.E_pos'and node==17 and absolute in [[1,1,0,0,0,1],[1,2,1]]:
     example={'node':node,'root':root,'slots':absolute,'binderNode':target[0],'binderSlots':target_slots}
     if example not in source_cases:source_cases.append(example)
   assert expected==observed,'Native output target mismatch at '+row['source']['name']
 assert len(source_cases)==2 and {e['binderNode']for e in source_cases}=={72,73}
 result={'status':'PASS','requests':len(a.requests),'records':sum(r['native']['records']for r in report['rows']),'variables':variables,'bindings':bindings,'externalTargets':external,'actualSharedNodeExamples':source_cases,'nativeOrBrowserCodeImported':False,'scope':'Independent source-path comparison of native emitted data; no mathematical proof typing, verified decoder or comprehension claim.'}
 if a.output:a.output.write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps(result))
if __name__=='__main__':main()
