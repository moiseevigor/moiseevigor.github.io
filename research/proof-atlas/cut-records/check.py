"""Independent sparse-cut and lexical-scope checker; does not import browser code.

The caller pins expected packet/source hashes from a trusted inventory. This
checks serialized structural correspondence, not native typing or a Lean proof.
"""
import argparse,gzip,hashlib,json
from pathlib import Path

KINDS=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj']
FIELDS={5:['fn','arg'],6:['domain','body'],7:['domain','body'],8:['type','value','body'],10:['expr'],11:['struct']}
LIMITS={'entries':3072,'cards':32,'routeDepth':512,'encodedBytes':8388608,'countDigits':4096}
SCOPE='Structural source cut and lexical links of a previously validated scene. Native typing and semantic interpretation are not checked by this record.'

def demand(ok,message):
    if not ok:raise ValueError(message)

def natural(value):return isinstance(value,int) and not isinstance(value,bool) and 0<=value<=9007199254740991
def decimal(value):
    demand(isinstance(value,str) and len(value)<=4096 and value.isascii() and value.isdecimal() and (value=='0' or not value.startswith('0')),'decimal count')
    return int(value)
def extends(kind,slot):return kind in [6,7] and slot==1 or kind==8 and slot==2
def route(value):
    demand(isinstance(value,dict) and set(value)=={'root','slots'} and natural(value['root']),'source route')
    slots=value['slots'];demand(isinstance(slots,list) and len(slots)<=512 and all(natural(s) and s<=2 for s in slots),'route bound')
    return value['root'],tuple(slots)

def graph(packet,expected):
    kinds,children,payloads=packet['kind'],packet['children'],packet['payloads'];size=len(kinds)
    demand(size==expected['uniqueNodes'] and 0<size<=1000000,'packet node bound/identity')
    demand(len(children)==size and len(payloads)==size and len(packet['expanded'])==size and len(packet['neededScope'])==size,'packet arrays')
    counts=[];scopes=[]
    for i,(kind,cs,p) in enumerate(zip(kinds,children,payloads)):
        demand(natural(kind) and kind<12 and len(cs)==len(FIELDS.get(kind,[])) and all(natural(c) and c<i for c in cs),'constructor slots and acyclic order')
        count=1+sum(counts[c] for c in cs);demand(decimal(packet['expanded'][i])==count,'packet count recurrence');counts.append(count)
        if kind==0:demand(natural(p['index']),'exact bound-variable index');needed=p['index']+1
        else:needed=max([0]+[max(0,scopes[c]-(1 if extends(kind,s) else 0)) for s,c in enumerate(cs)])
        demand(natural(packet['neededScope'][i]) and packet['neededScope'][i]==needed,'packet scope recurrence');scopes.append(needed)
    demand(packet['declaration']['name']==expected['name'],'packet declaration')
    demand(len(packet['roots'])==len(packet['declaration']['rootPaths']) and all(natural(i) and i<size for i in packet['roots']),'packet roots')
    return counts

def occurrence(packet,root,slots):
    demand(root<len(packet['roots']),'source root index');node=packet['roots'][root];name=packet['declaration']['rootPaths'][root];binders=[]
    for depth,slot in enumerate(slots):
        kind=packet['kind'][node];fields=FIELDS.get(kind,[]);demand(slot<len(fields),'source field')
        if extends(kind,slot):binders.append({'node':node,'kind':KINDS[kind],'route':{'root':root,'slots':list(slots[:depth])}})
        name+='.'+fields[slot];node=packet['children'][node][slot]
    return node,name,binders

def check(record,packet,expected,counts):
    demand(set(record)=={'format','source','root','limits','cards','external','entries','stats','scope'} and record['scope']==SCOPE,'record fields and stated scope')
    demand(record['format']=='ProofAtlasSourceCutRecord/1','record format')
    demand(record['source']=={k:expected[k] for k in ['name','indexSha256','sourceSha256']},'pinned source identity')
    bounds=record['limits'];demand(set(bounds)==set(LIMITS),'bound fields')
    for key,value in LIMITS.items():
        demand(natural(bounds[key]) and 1<=bounds[key]<=value,'record bound')
        if key not in ['entries','encodedBytes']:demand(bounds[key]==value,'fixed bound')
    demand(len(json.dumps(record,ensure_ascii=False,separators=(',',':')).encode())<=bounds['encodedBytes'],'encoded record bound')
    demand(set(record['root'])=={'node','route','namespace'},'root fields')
    root,base=route(record['root']['route']);root_node,_,external=occurrence(packet,root,base)
    demand(record['root']['namespace'] in ['source-expression','kernel-rule'] and natural(record['root']['node']) and record['root']['node']==root_node,'source root')
    namespace='kernel-rule' if packet['declaration']['rootPaths'][root].startswith('root.rule.') else 'source-expression'
    demand(record['root']['namespace']==namespace,'source namespace does not match packet root')
    for b in record['external']:demand(set(b)=={'node','kind','route'} and natural(b['node']) and route(b['route']),'external binder fields')
    demand(record['external']==external,'original enclosing context')
    cards=record['cards'];demand(0<len(cards)<=32,'card bound');card_at={}
    for i,card in enumerate(cards):
        demand(set(card)=={'id','node','route','retained'},'card fields');r,s=route(card['route'])
        demand(r==root and s[:len(base)]==base,'card outside source root');node,name,_=occurrence(packet,r,s)
        demand(natural(card['node']) and card['node']==node and card['id']==name,'card source identity');relative=s[len(base):];demand(relative not in card_at,'duplicate card root');card_at[relative]=i
    demand(card_at.get(())==0,'root card')
    entries=record['entries'];demand(0<len(entries)<=bounds['entries'],'cut entry bound');seen=set();seen_cards=set();owned=[0]*len(cards);retained=0;hidden=0;variables=0;bound=0
    # Read the cut in preorder. Every constructor receives every source child;
    # a hole stops traversal. Original DAG sharing is never expanded below holes.
    todo=[(0,root_node,(),[(b,{'external':j})for j,b in enumerate(external)],0)]
    while todo:
        index,node,slots,context,owner=todo.pop();demand(index==len(seen) and index<len(entries),'canonical preorder or repeated entry');seen.add(index)
        demand(len(base)+len(slots)<=512,'cut route depth');e=entries[index]
        demand(natural(e['node']) and e['node']==node and tuple(e['slots'])==slots and all(natural(s) and s<=2 for s in e['slots']),'source occurrence slots')
        owner=card_at.get(slots,owner);demand(natural(e['owner']) and e['owner']==owner,'nearest displayed card owner')
        if e['tag']=='hole':
            demand(set(e)=={'tag','node','slots','occurrences','owner'} and slots not in card_at,'hidden root shape');demand(decimal(e['occurrences'])==counts[node],'hidden source count');hidden+=counts[node];continue
        demand(e['tag']=='node','cut tag');kind=packet['kind'][node];fields={'tag','node','slots','constructor','owner','children'}|({'binding'}if kind==0 else set());demand(set(e)==fields,'retained constructor fields')
        demand(e['constructor']==KINDS[kind] and len(e['children'])==len(packet['children'][node]),'retained constructor slots');owned[owner]+=1;retained+=1
        if slots in card_at:seen_cards.add(owner)
        if kind==0:
            variables+=1;debruijn=packet['payloads'][node]['index'];target=context[-1-debruijn][1] if debruijn<len(context) else None
            binding=e['binding'];demand(set(binding)=={'index','target'} and natural(binding['index']),'binding fields')
            if binding['target'] is not None:demand(len(binding['target'])==1 and set(binding['target'])<={'entry','external'} and all(natural(v) for v in binding['target'].values()),'binding reference')
            demand(e['binding']=={'index':debruijn,'target':target},'lexical binder target');bound+=int(target is not None)
        for slot in reversed(range(len(e['children']))):
            child=e['children'][slot];demand(natural(child) and index<child<len(entries),'cut child reference');next_context=context
            if extends(kind,slot):next_context=context+[({'node':node,'kind':KINDS[kind],'route':{'root':root,'slots':list(base+slots)}},{'entry':index})]
            todo.append((child,packet['children'][node][slot],slots+(slot,),next_context,owner))
    demand(len(seen)==len(entries) and len(seen_cards)==len(cards),'unreachable record or card')
    demand(all(decimal(card['retained'])==owned[i] for i,card in enumerate(cards)),'per-card ownership')
    demand(natural(record['stats']['variables']) and natural(record['stats']['boundVariables']),'variable statistics')
    demand(record['stats']=={'retained':str(retained),'hidden':str(hidden),'represented':str(retained+hidden),'variables':variables,'boundVariables':bound},'cut statistics')
    demand(retained+hidden==counts[root_node],'complete source partition')
    return {'entries':len(entries),'bindings':bound,'externalTargets':sum(1 for e in entries if e.get('binding',{}).get('target') is not None and 'external' in e['binding']['target'])}

def run(path):
    demand(path.stat().st_size<=67108864,'request byte bound');request=json.loads(path.read_bytes());expected=request['expected'];packet_path=Path(request['packetFile'])
    with gzip.open(packet_path,'rb') as f:raw=f.read(67108865)
    demand(len(raw)<=67108864 and hashlib.sha256(raw).hexdigest()==expected['indexSha256'],'immutable packet SHA-256')
    packet=json.loads(raw);counts=graph(packet,expected);records=request['records'];demand(isinstance(records,list) and 1<=len(records)<=4096,'request record bound')
    checked=[check(c,packet,expected,counts) for c in records]
    pairs=request.get('refinements',[]);demand(len(pairs)<=4096,'refinement comparison bound')
    for pair in pairs:
        demand(len(pair)==2 and all(natural(i) and i<len(records) for i in pair),'refinement record reference')
        refinement(records[pair[0]],records[pair[1]])
    rejected=request.get('rejectedRefinements',[]);demand(len(rejected)<=4096,'counterexample bound')
    for pair in rejected:
        demand(len(pair)==2 and all(natural(i) and i<len(records) for i in pair),'counterexample record reference')
        try:refinement(records[pair[0]],records[pair[1]])
        except ValueError:pass
        else:raise ValueError('Expected non-refinement was accepted')
    return {'status':'PASS','records':len(checked),'refinements':len(pairs),'rejectedRefinements':len(rejected),'entries':sum(c['entries'] for c in checked),'bindings':sum(c['bindings'] for c in checked),'externalTargets':sum(c['externalTargets'] for c in checked),'sourceSha256Verified':False,'packetSha256Verified':True,'scope':'Independent sparse source-cut and lexical correspondence only; no kernel typing or verified decoder claim.'}

def refinement(before,after):
    # Inputs have already passed check against the same independently pinned DAG.
    demand(before['source']==after['source'] and before['root']==after['root'],'refinement source')
    previous={tuple(e['slots']):e for e in before['entries'] if e['tag']=='node'}
    following={tuple(e['slots']):e for e in after['entries'] if e['tag']=='node'}
    demand(set(previous)<=set(following),'previously visible path hidden')
    for p,e in previous.items():demand(e['node']==following[p]['node'] and e['constructor']==following[p]['constructor'],'retained source changed')
    old_holes={tuple(e['slots']) for e in before['entries'] if e['tag']=='hole'}
    for e in after['entries']:
        if e['tag']=='hole':demand(any(tuple(e['slots'][:i]) in old_holes for i in range(len(e['slots'])+1)),'new hidden region outside original holes')
    delta=decimal(after['stats']['retained'])-decimal(before['stats']['retained'])
    demand(delta>=0 and delta==decimal(before['stats']['hidden'])-decimal(after['stats']['hidden']) and before['stats']['represented']==after['stats']['represented'],'exact refinement transfer')
    return delta

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('requests',type=Path,nargs='+');args=p.parse_args()
    results=[run(path) for path in args.requests]
    print(json.dumps({'status':'PASS','packets':len(results),'records':sum(r['records']for r in results),'refinements':sum(r['refinements']for r in results),'rejectedRefinements':sum(r['rejectedRefinements']for r in results),'entries':sum(r['entries']for r in results),'bindings':sum(r['bindings']for r in results),'externalTargets':sum(r['externalTargets']for r in results)}))
