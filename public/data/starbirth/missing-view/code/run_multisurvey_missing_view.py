"""One frozen retrospective proxy-ranking experiment; all source IDs retained."""
import argparse,csv,gzip,hashlib,io,json,math
from pathlib import Path
import numpy as np
from multisurvey_missing_view_data import FEATURES,feature_data,table
from multisurvey_missing_view_model import robust_fit,transform,complete,encode,logistic,kernel,predict_kernel

ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/multisurvey_missing_view_registration_20261012.json'
METHODS=['embedding','linear','nonlinear','infrared_only']


def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        for b in iter(lambda:f.read(2**20),b''):h.update(b)
    return h.hexdigest()


def save(p,value):
    with p.open('x') as f:json.dump(value,f,indent=2);f.write('\n')


def write_csv(p,fields,rows):
    with p.open('xb') as raw:
        with gzip.GzipFile(filename='',fileobj=raw,mode='wb',mtime=0) as gz:
            with io.TextIOWrapper(gz,encoding='utf8',newline='') as t:
                w=csv.DictWriter(t,fieldnames=fields);w.writeheader();w.writerows(rows)


def reviews(score,tiles,ids,scope):
    selected=np.zeros(len(ids),bool)
    for tile in sorted(set(tiles[scope])):
        rows=np.flatnonzero(scope & (tiles==tile));k=math.ceil(.05*len(rows))
        ordering=sorted(rows,key=lambda i:(-score[i],ids[i]));selected[ordering[:k]]=True
    return selected


def metrics(scores,y,tiles,ids,x,mask):
    valid=np.isfinite(scores[:,:3]).all(axis=1);known=y>=0;common=known & valid
    p=(y==1);neg=y==0
    primary=np.column_stack([reviews(scores[:,j],tiles,ids,common) for j in range(4)])
    all_flags=np.column_stack([reviews(scores[:,j],tiles,ids,np.isfinite(scores[:,j])) for j in range(4)])
    recovery=[float(np.sum(primary[:,j]&p)/np.sum(p)) if np.sum(p) else None for j in range(4)]
    blocks=sorted(set(tiles[common]));boot=[];discarded=0;rng=np.random.default_rng(20261012)
    positives=np.array([np.sum(p & common & (tiles==t)) for t in blocks])
    selected_positive=np.array([[np.sum(primary[:,j]&p&(tiles==t)) for j in range(3)] for t in blocks])
    if len(blocks):
        for _ in range(2000):
            sample=rng.integers(0,len(blocks),len(blocks));denom=positives[sample].sum()
            if not denom:discarded+=1;continue
            tp=selected_positive[sample].sum(axis=0);boot.append(float(min(tp[0]-tp[1],tp[0]-tp[2])/denom))
    delta=min(recovery[0]-recovery[1],recovery[0]-recovery[2]) if recovery[0] is not None else None
    ci=np.percentile(boot,[2.5,97.5]).tolist() if boot else None
    adequate=np.sum(p)>=15 and np.sum(neg)>=80 and len(blocks)>=4 and valid[known].all() and len(boot)>=1900
    status='insufficient_evidence' if not adequate else ('retrospective_proxy_support' if delta>=.10 and ci[0]>0 else 'no_retrospective_gain_demonstrated')
    strata={}
    divisions={'mass':0,'temperature':1,'distance':2,'surface_density':3}
    for key,col in divisions.items():
        center=float(np.nanmedian(x[:,col]));strata[key]={}
        for label,scope in [('low',x[:,col]<=center),('high',x[:,col]>center),('missing',~np.isfinite(x[:,col]))]:
            q=scope & common;count=int(np.sum(p&q));strata[key][label]=dict(qualifying=int(q.sum()),positives=count,
                selected_positive={m:int(np.sum(primary[:,j]&p&q)) for j,m in enumerate(METHODS)})
    for key,scope in [('temporal_present',mask[:,16:20].any(axis=1)),('temporal_missing',~mask[:,16:20].any(axis=1)),
                      ('gas_present',mask[:,20:28].any(axis=1)),('gas_missing',~mask[:,20:28].any(axis=1))]:
        q=scope&common;strata[key]=dict(qualifying=int(q.sum()),positives=int(np.sum(p&q)),selected_positive={m:int(np.sum(primary[:,j]&p&q)) for j,m in enumerate(METHODS)})
    result=dict(schema='retrospective-missing-view-ranking/1',status=status,
       requested=len(y),qualifying_positives=int(p.sum()),qualifying_proxy_negatives=int(neg.sum()),unknown=int(np.sum(y<0)),
       common_qualifying=int(common.sum()),unpredicted_qualifying=int(np.sum(known&~valid)),populated_tiles=len(blocks),
       primary_minimum_recovery_difference=delta,spatial_bootstrap_ci95=ci,bootstrap_retained=len(boot),bootstrap_discarded=discarded,
       review_fraction_requested=.05,primary_adequacy=bool(adequate),recovery=dict(zip(METHODS,recovery)),
       primary={m:dict(reviews=int(primary[:,j].sum()),actual_review_fraction=float(primary[:,j].sum()/common.sum()) if common.sum() else None,
             selected_proxy_positive=int(np.sum(primary[:,j]&p)),selected_proxy_negative=int(np.sum(primary[:,j]&neg))) for j,m in enumerate(METHODS)},
       all_requested={m:dict(reviews=int(all_flags[:,j].sum()),selected_proxy_positive=int(np.sum(all_flags[:,j]&p)),
             selected_proxy_negative=int(np.sum(all_flags[:,j]&neg)),selected_unknown=int(np.sum(all_flags[:,j]&(y<0))),
             unscored=int(np.sum(~np.isfinite(scores[:,j])))) for j,m in enumerate(METHODS)},
       strata=strata,validation_role='consumed chemistry proxy; retrospective and selected',
       physical_validation=False,calibrated_probabilities=False,new_stars=0,new_births=0,occurrence_measured=False)
    covariates={}
    for key,col in divisions.items():
        covariates[key]={}
        for label,scope in [('qualifying',known),('unknown',~known)]:
            v=x[scope,col];v=v[np.isfinite(v)]
            covariates[key][label]=dict(finite=len(v),mean=float(np.mean(v)) if len(v) else None,min=float(np.min(v)) if len(v) else None,max=float(np.max(v)) if len(v) else None)
    result['covariate_domains_transformed']=covariates
    return result,primary,all_flags,np.asarray(boot)


def run(stage):
    reg=json.loads(REG.read_text())
    for item in reg['inputs']:
        p=ROOT/item['path'];assert p.stat().st_size==item['bytes'] and sha(p)==item['sha256'],item['path']
    split=list(table(ROOT/'artifacts/multisurvey_missing_view_splits_20261012.csv.gz'))
    ids=[r['designation'] for r in split];assert ids==sorted(set(ids)) and len(ids)==19328
    tiles=np.array([int(r['tile']) for r in split]);folds=np.array([int(r['fold']) for r in split]);n=len(ids)
    x,y,native,flags,association=feature_data(ROOT,split);mask=np.isfinite(x)
    assert len(FEATURES)==28 and np.all(y[np.array([association[name]['one_record_unshared']!='1' for name in ids])]==-1)
    np.savez_compressed(stage/'features.npz',features=x,mask=mask,proxy=y,tiles=tiles,folds=folds)
    print('Registered feature and consumed-proxy contract read; no test tuning',flush=True)
    scores=np.full((n,4),np.nan);latents=np.full((n,6),np.nan);records=[]
    weights=np.r_[np.full(16,1/4),np.full(4,1/2),np.full(8,1/math.sqrt(8))]
    for fold in range(5):
        train=np.array([r[f'train_{fold}']=='1' for r in split]);test=folds==fold;reference=train & (y>=0)
        assert not (train&test).any()
        positives=int(np.sum(y[reference]==1));negatives=int(np.sum(y[reference]==0))
        record=dict(fold=fold,training_parent=int(train.sum()),training_positive=positives,training_negative=negatives,
                    held_out=int(test.sum()),held_out_qualifying=int(np.sum(test&(y>=0))),valid=False)
        if positives<5 or negatives<20:
            record['reason']='insufficient_training_proxy_classes';records.append(record);continue
        med,scale=robust_fit(x[train]);z,m=transform(x,med,scale);raw=np.c_[z,m.astype(float)]
        center,basis,singular=complete(z[train],m[train],weights)
        embedded=encode(z,m,weights,center,basis);continuous=np.c_[embedded,z[:,:5]]
        emean=continuous[reference].mean(axis=0);estd=continuous[reference].std(axis=0);estd=np.where(estd>=1e-8,estd,1)
        efeatures=np.c_[(continuous-emean)/estd,m.astype(float)]
        beta,gradient=logistic(raw[reference],y[reference]);a,sigma2=kernel(raw[reference],y[reference]);ea,esigma2=kernel(efeatures[reference],y[reference])
        acenter,abasis,asingular=complete(z[train,:16],m[train,:16],weights[:16]);ae=encode(z[:,:16],m[:,:16],weights[:16],acenter,abasis)
        acontinuous=np.c_[ae,z[:,:5]];amean=acontinuous[reference].mean(axis=0);astd=acontinuous[reference].std(axis=0);astd=np.where(astd>=1e-8,astd,1)
        afeatures=np.c_[(acontinuous-amean)/astd,m[:,:16].astype(float)];aa,asigma2=kernel(afeatures[reference],y[reference])
        scores[test,0]=predict_kernel(efeatures[test],efeatures[reference],ea,esigma2)
        scores[test,1]=beta[0]+raw[test]@beta[1:]
        scores[test,2]=predict_kernel(raw[test],raw[reference],a,sigma2)
        scores[test,3]=predict_kernel(afeatures[test],afeatures[reference],aa,asigma2)
        latents[test]=embedded[test]
        np.savez_compressed(stage/f'fold_{fold}.npz',train=np.flatnonzero(train),test=np.flatnonzero(test),reference=np.flatnonzero(reference),
            median=med,scale=scale,weights=weights,pca_center=center,pca_basis=basis,pca_singular=singular,
            embed_mean=emean,embed_std=estd,linear_beta=beta,nonlinear_alpha=a,nonlinear_sigma2=sigma2,
            embedding_alpha=ea,embedding_sigma2=esigma2,ablation_center=acenter,ablation_basis=abasis,
            ablation_singular=asingular,ablation_mean=amean,ablation_std=astd,ablation_alpha=aa,ablation_sigma2=asigma2)
        record.update(valid=True,logistic_gradient_inf=gradient);records.append(record)
        print(json.dumps(record),flush=True)
    result,primary,all_flags,bootstrap=metrics(scores,y,tiles,ids,x,mask)
    result['folds']=records;result['feature_names']=FEATURES
    np.savez_compressed(stage/'predictions.npz',scores=scores,fold_specific_coordinates=latents,primary_selected=primary,all_requested_selected=all_flags,bootstrap=bootstrap)
    fields=['designation','tile','fold','group','native_malt90_id','consumed_proxy_flags','proxy_state','validation_role',
            'infrared_observed_features','temporal_observed_features','molecular_observed_features','domain',
            'missing_view_policy','physical_stage','birth_status']
    for method in METHODS:fields.extend([method+'_score',method+'_primary_review',method+'_all_requested_review'])
    def source_rows():
        for i,name in enumerate(ids):
            r=dict(designation=name,tile=int(tiles[i]),fold=int(folds[i]),group=split[i]['group'],native_malt90_id=native[i],
                consumed_proxy_flags=flags[i],proxy_state='qualifying_positive' if y[i]==1 else ('qualifying_proxy_negative' if y[i]==0 else 'unknown'),
                validation_role='consumed_chemistry_proxy',infrared_observed_features=int(mask[i,:16].sum()),temporal_observed_features=int(mask[i,16:20].sum()),
                molecular_observed_features=int(mask[i,20:28].sum()),domain='proxy_evaluation_support' if y[i]>=0 else 'outside_qualifying_proxy_support',
                missing_view_policy='explicit_masks_and_training_only_completion',physical_stage='unknown',birth_status='not_established')
            for j,method in enumerate(METHODS):
                r[method+'_score']=float(scores[i,j]) if math.isfinite(scores[i,j]) else ''
                r[method+'_primary_review']=int(primary[i,j]);r[method+'_all_requested_review']=int(all_flags[i,j])
            yield r
    write_csv(stage/'sources.csv.gz',fields,source_rows());save(stage/'summary.json',result)
    output_files={p.name:dict(bytes=p.stat().st_size,sha256=sha(p)) for p in stage.iterdir() if p.suffix in ('.npz','.gz') or p.name=='summary.json'}
    save(stage/'checkpoint.json',dict(schema='missing-view-worker-checkpoint/1',registration_sha256=sha(REG),outputs=output_files,
           independent_verification_pending=True,full_goal_achieved=False))
    print(json.dumps({k:v for k,v in result.items() if k not in ('strata','covariate_domains_transformed','feature_names','folds')},indent=2),flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--stage',type=Path,required=True);args=p.parse_args();run(args.stage)
