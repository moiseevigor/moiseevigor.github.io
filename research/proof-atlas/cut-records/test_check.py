"""Alter source-cut records without calling the JavaScript producer or checker."""
import argparse,copy,gzip,json
from pathlib import Path
from check import check,graph

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('requests',type=Path,nargs='+');args=p.parse_args();chosen=None
    for file in args.requests:
        request=json.loads(file.read_bytes())
        for record in request['records']:
            if record['external'] and any(e['tag']=='hole' for e in record['entries']) and any(e.get('binding',{}).get('target') for e in record['entries']) and len(record['cards'])>1:
                chosen=request,record;break
        if chosen:break
    assert chosen,'A source selection with holes and enclosing binders is required'
    request,record=chosen;packet=json.loads(gzip.decompress(Path(request['packetFile']).read_bytes()));expected=request['expected'];counts=graph(packet,expected);check(record,packet,expected,counts)
    variable=next(i for i,e in enumerate(record['entries'])if e.get('binding',{}).get('target'))
    hole=next(i for i,e in enumerate(record['entries'])if e['tag']=='hole')
    def field(*path,value):
        def change(c):
            at=c
            for key in path[:-1]:at=at[key]
            at[path[-1]]=value
        return change
    changes=[field('format',value='other'),field('scope',value='All proofs kernel verified'),field('kernelCheck',value='PASS'),
        field('source','indexSha256',value='0'*64),field('source','sourceSha256',value='0'*64),field('root','namespace',value='type-expression'),field('root','namespace',value='source-expression' if record['root']['namespace']=='kernel-rule' else 'kernel-rule'),
        field('root','node',value=-1),field('entries',0,'node',value=-1),field('entries',0,'node',value=True),field('entries',0,'owner',value=-1),
        field('entries',0,'constructor',value='unknown'),field('entries',0,'children',value=[0]),field('entries',0,'slots',value=[True]),
        field('entries',variable,'binding','index',value=True),field('entries',variable,'binding','target',value={'external':9999}),
        field('entries',hole,'occurrences',value='0'),field('cards',0,'retained',value='0'),field('cards',0,'id',value='forged'),
        field('external',0,'node',value=-1),field('stats','retained',value='0'),field('stats','represented',value='0'),field('stats','boundVariables',value=True),
        field('limits','entries',value=4096),field('limits','encodedBytes',value=16777216),lambda c:c['entries'].append(copy.deepcopy(c['entries'][-1]))]
    for change in changes:
        altered=copy.deepcopy(record);change(altered)
        try:check(altered,packet,expected,counts)
        except (ValueError,KeyError,IndexError,TypeError):pass
        else:raise AssertionError('Altered record accepted')
    result={'status':'PASS','independentNegativeControls':len(changes),'producerImported':False,'sourceTypingClaim':False};Path('/tmp/atlas-cut-record-negative-controls.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))

if __name__=='__main__':main()
