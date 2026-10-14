"""Bounded cached cohort construction; labels deliberately remain unknown."""
import csv, gzip, hashlib, io, json, math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REG = ROOT/'artifacts/validation_cohort_registration_20261014.json'
STAGE = ROOT/'artifacts/validation_cohort_20261014'

def digest(path):
    h=hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda:f.read(1048576),b''): h.update(b)
    return h.hexdigest()

def rows(path):
    with (gzip.open(path,'rt') if path.suffix=='.gz' else path.open()) as f:
        yield from csv.DictReader(f)

def write(name, records):
    with (STAGE/name).open('xb') as raw:
        with gzip.GzipFile(filename='',fileobj=raw,mode='wb',mtime=0) as z:
            with io.TextIOWrapper(z,newline='') as f:
                w=csv.DictWriter(f,fieldnames=list(records[0]),lineterminator='\n')
                w.writeheader();w.writerows(records)

def main():
    reg=json.loads(REG.read_text())
    for x in reg['inputs']:
        p=ROOT/x['path']; assert p.stat().st_size==x['bytes'] and digest(p)==x['sha256'],x['path']
    def index(path, fields):
        result={}
        for r in rows(ROOT/path):
            key=r['designation'];assert key not in result
            result[key]={k:r[k] for k in fields}
        return result
    coverage=index(reg['coverage'],['fir_state','wise_anchor_present','neowise_requested','neowise_rows','temporal_support','malt90_records','one_record_unshared','one_record_unshared_violation'])
    identity=index(reg['identity'],['e13_sample','spicy_ids','malt90_consumed','almagal_consumed','control_sample'])
    ranking=index(reg['ranking'],['group','tile','fold','proxy_state','temporal_observed_features','molecular_observed_features','embedding_all_requested_review','nonlinear_all_requested_review'])
    assert len(ranking)==19328 and ranking.keys()==coverage.keys()==identity.keys()
    parents={}
    for r in rows(ROOT/'cache/higal360clump.csv'):
        try: distance=float(r['dist'])
        except ValueError:continue
        if r['evol_flag']=='1' and math.isfinite(distance) and 0<distance<=4:
            assert r['designation'] not in parents
            parents[r['designation']]={k:r[k] for k in ['ra','dec','glon','glat','dist','mass','temp','surf_dens','diam']}
    assert parents.keys()==ranking.keys()
    native=json.loads((ROOT/'tools/review/backend/evidence_v5/native-cards.json').read_text())['evidence_cases']
    native_ids={x['case_id']:x['geometrically_best_catalogue_record']['designation'] for x in native}
    groups=defaultdict(list);reasons={}
    for name,r in ranking.items():
        groups[r['group']].append(name);i=identity[name]
        reasons[name]=[k for k in ['e13_sample','malt90_consumed','almagal_consumed','control_sample'] if i[k]=='1']
        if i['spicy_ids']:reasons[name].append('spicy_candidate_consumed')
        if r['proxy_state']!='unknown':reasons[name].append('qualifying_proxy_consumed')
    strata=defaultdict(list);states={};excluded={}
    for group,members in groups.items():
        members.sort();excluded[group]=sorted(set(x for name in members for x in reasons[name]))
        a=any(ranking[n]['embedding_all_requested_review']=='1' for n in members)
        b=any(ranking[n]['nonlinear_all_requested_review']=='1' for n in members)
        state='both' if a and b else 'embedding_only' if a else 'nonlinear_only' if b else 'neither'
        temporal=any(ranking[n]['temporal_observed_features']=='4' for n in members)
        states[group]=state+('|temporal' if temporal else '|no_temporal')
        if not excluded[group]:strata[states[group]].append(group)
    chosen={};strata_counts={}
    for key in [a+'|'+b for a in ['both','embedding_only','nonlinear_only','neither'] for b in ['temporal','no_temporal']]:
        population=strata[key];ordered=sorted(population,key=lambda g:(hashlib.sha256((reg['seed']+'|'+g).encode()).digest(),g))
        selected=ordered[:30];strata_counts[key]={'groups':len(ordered),'sampled_groups':len(selected),'frame_members':sum(len(groups[g]) for g in ordered),'sampled_members':sum(len(groups[g]) for g in selected)}
        for g in selected:chosen[g]=(len(selected),len(ordered))
    ledger=[];counts=Counter();cross=Counter()
    for name in sorted(ranking):
        r=ranking[name];c=coverage[name];i=identity[name];g=r['group'];sampled=g in chosen
        n,N=chosen.get(g,(0,len(strata[states[g]]) if not excluded[g] else 0))
        molecular='none_retained' if c['malt90_records']=='0' else 'geometric_unique_unshared' if c['one_record_unshared']=='1' else 'ambiguous_or_shared'
        owner='native_id_retained_association_gate_failed' if name in native_ids else 'projected_anchor_native_id_missing' if c['wise_anchor_present']=='1' else 'no_retained_anchor'
        row=dict(designation=name,**parents[name],group=g,tile=r['tile'],fold=r['fold'],group_members=len(groups[g]),stratum=states[g],prospective_frame=int(not excluded[g]),exclusion_reasons=';'.join(excluded[g]),review_sample=int(sampled),stratum_groups=N,sampled_stratum_groups=n,inclusion_numerator=n,inclusion_denominator=N,inverse_inclusion_weight=N/n if sampled else '',proxy_state=r['proxy_state'],spicy_ids=i['spicy_ids'],fir_value_error_support=int(c['fir_state']=='OOOOEE'),wise_anchor_present=c['wise_anchor_present'],native_infrared_id=native_ids.get(name,''),infrared_ownership=owner,neowise_requested=c['neowise_requested'],neowise_rows=c['neowise_rows'],screened_temporal_support=c['temporal_support'],model_temporal_support=int(r['temporal_observed_features']=='4'),model_molecular_features=r['molecular_observed_features'],molecular_records=c['malt90_records'],molecular_ownership=molecular,embedding_review=r['embedding_all_requested_review'],nonlinear_review=r['nonlinear_all_requested_review'],footprint_completeness='unverified',physical_membership='unknown',independent_truth='unknown',certified_validation_eligible=0,adjudication_status='external_evidence_required',prior_feature_readout='consumed_unlabelled_features')
        ledger.append(row)
        counts['parent']+=1;counts['prospective_frame_members']+=row['prospective_frame'];counts['sampled_members']+=sampled
        for k in ['fir_value_error_support','wise_anchor_present','screened_temporal_support','model_temporal_support']:counts[k]+=int(row[k])
        counts['molecular_'+molecular]+=1;counts['infrared_'+owner]+=1
        cross[(r['proxy_state'],row['model_temporal_support'],molecular)]+=1
    queue=[r for r in ledger if r['review_sample']]
    assert len(chosen)<=240 and len(queue)<=480 and all(not excluded[r['group']] for r in queue)
    write('population.csv.gz',ledger);write('review-cohort.csv.gz',queue)
    write('molecular-alternatives.csv.gz',list(rows(ROOT/reg['edges'])))
    with (STAGE/'coverage.csv').open('x') as f:
        w=csv.writer(f,lineterminator='\n');w.writerow(['proxy_state','model_temporal_support','molecular_geometry','parents'])
        w.writerows((*key,value) for key,value in sorted(cross.items()))
    outputs=[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':digest(p)} for p in sorted(STAGE.iterdir()) if p.name.endswith(('.gz','.csv'))]
    summary=dict(schema='independent-evidence-cohort/1',registration_sha256=digest(REG),counts=dict(counts),groups=len(groups),frame_groups=sum(len(v) for v in strata.values()),excluded_groups=sum(bool(v) for v in excluded.values()),sampled_groups=len(chosen),strata=strata_counts,independent_truth_manifest=None,certified_validation_eligible=0,truth_unknown=19328,physical_validation=False,models_fitted=False,rankings_changed=False,new_stars=0,new_births=0,all_inputs_previously_inspected=True,footprint_completeness='unverified',outputs=outputs)
    (STAGE/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps({k:v for k,v in summary.items() if k not in ['outputs','strata']},indent=2))

if __name__=='__main__':main()
