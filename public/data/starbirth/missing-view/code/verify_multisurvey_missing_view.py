"""Independent raw-data, model algebra and spatial-readout verification."""
import argparse,csv,gzip,hashlib,json,math
from collections import defaultdict
from pathlib import Path
import numpy as np
from scipy.spatial.distance import cdist
from scipy.special import expit

ROOT=Path(__file__).resolve().parents[1]
REG=ROOT/'artifacts/multisurvey_missing_view_registration_20261012.json'
METHODS=['embedding','linear','nonlinear','infrared_only']


def csv_rows(path):
    with (gzip.open(path,'rt') if path.suffix=='.gz' else path.open()) as f:yield from csv.DictReader(f)


def value(s):
    try:return float(s)
    except (ValueError,TypeError):return float('nan')


def sha(p):
    h=hashlib.sha256()
    with p.open('rb') as f:
        while b:=f.read(1024**2):h.update(b)
    return h.hexdigest()


def angular(a,b,c,d):
    a,b,c,d=map(math.radians,map(float,(a,b,c,d)));dl=c-a
    return math.degrees(math.atan2(math.hypot(math.cos(d)*math.sin(dl),math.cos(b)*math.sin(d)-math.sin(b)*math.cos(d)*math.cos(dl)),
                                  math.sin(b)*math.sin(d)+math.cos(b)*math.cos(d)*math.cos(dl)))*3600


def independent_features(ids):
    index={name:i for i,name in enumerate(ids)};n=len(ids);x=np.full((n,28),np.nan);y=np.full(n,-1,np.int8)
    native=['']*n;flags=['']*n;longitudes={}
    for row in csv_rows(ROOT/'cache/higal360clump.csv'):
        if row['designation'] not in index:continue
        name=row['designation'];i=index[name];longitudes[name]=value(row['glon'])
        assert row['evol_flag']=='1' and 0<value(row['dist'])<=4
        for col,key in zip(range(5),['mass','temp','dist','surf_dens','diam']):
            v=value(row[key])
            if math.isfinite(v) and v>0:x[i,col]=v if col==1 else math.log10(v)
    association={r['designation']:{k:r[k] for k in ('temporal_support','one_record_unshared','wise_ra','wise_dec','wise_separation_arcsec','association_component')} for r in csv_rows(ROOT/'artifacts/multisurvey_association_compact_20261012/sources.csv.gz')}
    for row in csv_rows(ROOT/'cache/higal360_fir.csv'):
        if row['designation'] not in index:continue
        i=index[row['designation']];logs=[]
        for key,err in [('f160','df160'),('f250','df250'),('fsc350',None),('fsc500',None)]:
            v=value(row[key]);good=math.isfinite(v) and v>0 and (err is None or (math.isfinite(value(row[err])) and value(row[err])>0))
            logs.append(math.log(v) if good else math.nan)
        x[i,5:9]=logs;x[i,9:12]=np.diff(-np.array(logs))
    for row in csv_rows(ROOT/'artifacts/e12b/allwise_features.csv.gz'):
        name=row['designation']
        if name not in index:continue
        a=association[name];f=row['cc_flags'];magnitudes=[]
        if not a['wise_separation_arcsec'] or value(a['wise_separation_arcsec'])>3 or value(row['ext_flg'])!=0:continue
        for band in range(1,5):
            v=value(row[f'w{band}mpro']);snr=value(row[f'w{band}snr'])
            good=math.isfinite(v) and math.isfinite(snr) and snr>=5 and len(f)==4 and f[band-1]=='0'
            magnitudes.append(v if good else math.nan)
        x[index[name],12:15]=np.diff(-np.array(magnitudes));x[index[name],15]=magnitudes[1]
    targets=[{k:r[k] for k in ('designation','ra','dec')} for r in csv_rows(ROOT/'artifacts/e1_full/pilot_targets.csv')]
    epoch_records=defaultdict(set)
    for row in csv_rows(ROOT/'artifacts/e1_full/neowise_rows_on.csv'):
        j=int(row['tid']);assert str(j)==row['tid'] and 0<=j<len(targets)
        t=targets[j];name=t['designation']
        assert abs(value(row['t_ra'])-value(t['ra']))<=1e-6 and abs(value(row['t_dec'])-value(t['dec']))<=1e-6
        a=association[name]
        if a['temporal_support']!='1':continue
        ra,dec,mjd,mag,err,snr,frame,nb=[value(row[k]) for k in ('ra','dec','mjd','w2mpro','w2sigmpro','w2snr','qual_frame','nb')]
        if not all(math.isfinite(v) for v in (ra,dec,mjd,mag,err,snr,frame,nb)):continue
        if not (0<=ra<360 and -90<=dec<=90 and err>0 and snr>=5 and frame>0 and nb==1 and len(row['cc_flags'])==4 and row['cc_flags'][1]=='0'):continue
        if angular(a['wise_ra'],a['wise_dec'],ra,dec)>2:continue
        epoch_records[name].add(json.dumps([row[k] for k in ('mjd','ra','dec','w2mpro','w2sigmpro')],separators=(',',':')).encode())
    for name,records in epoch_records.items():
        values=sorted([list(map(float,json.loads(b))) for b in records],key=lambda r:r[0]);visits=[];last=None
        for r in values:
            if last is None or r[0]-last>30:visits.append([])
            visits[-1].append(r);last=r[0]
        v=[]
        for visit in visits:
            if len(visit)<5:continue
            w=[1/r[4]**2 for r in visit];total=sum(w)
            v.append((sum(a*r[0] for a,r in zip(w,visit))/total,sum(a*r[3] for a,r in zip(w,visit))/total,1/total+.03**2))
        assert len(v)>=3 and values[-1][0]-values[0][0]>=365
        w=[1/r[2] for r in v];total=sum(w);mean=sum(a*r[1] for a,r in zip(w,v))/total;tmean=sum(a*r[0] for a,r in zip(w,v))/total
        chi=sum(a*(r[1]-mean)**2 for a,r in zip(w,v))/(len(v)-1)
        slope=sum(a*(r[0]-tmean)*(r[1]-mean) for a,r in zip(w,v))/sum(a*(r[0]-tmean)**2 for a,r in zip(w,v))*365.25
        x[index[name],16:20]=[mean,math.log1p(chi),max(r[1] for r in v)-min(r[1] for r in v),slope]
    del epoch_records
    needed={}
    for r in csv_rows(ROOT/'artifacts/multisurvey_association_compact_20261012/molecular_edges.csv.gz'):
        if r['in_parent']=='1' and association[r['designation']]['one_record_unshared']=='1':
            ordinal=int(r['malt90_source_row']);assert ordinal not in needed
            needed[ordinal]=(index[r['designation']],r['malt90_id'])
    for ordinal,r in enumerate(csv_rows(ROOT/'cache/n1/malt90_rathborne2016.csv'),1):
        if ordinal not in needed:continue
        i,nid=needed[ordinal];assert r['ID']==nid;native[i]=nid
        ds=[r[k] for k in ('DHC3N','DHNCO404','DCH3CN','DSIO')];flags[i]='|'.join(ds)
        y[i]=1 if any(d=='Y' for d in ds) else (0 if all(d=='N' for d in ds) else -1)
        for j,line in enumerate(['HCOP','HNC','N2HP','HCN']):
            if value(r['NG'+line]) in (1,2,3):
                ii=value(r['II'+line]);err=value(r['e_II'+line]);width=value(r['FWHM'+line])
                if math.isfinite(ii) and math.isfinite(err) and err>0:x[i,20+2*j]=math.asinh(ii/err)
                if math.isfinite(width) and width>0:x[i,21+2*j]=math.log(width)
    return x,y,native,flags,longitudes,association


def independent_split(ids,longitudes,association):
    adjacency=defaultdict(set);components=defaultdict(list);anchors=defaultdict(list)
    for name in ids:
        a=association[name];components[a['association_component']].append(name)
        if a['wise_ra'] and a['wise_dec']:anchors[(value(a['wise_ra']),value(a['wise_dec']))].append(name)
    for members in list(components.values())+list(anchors.values()):
        for name in members:adjacency[name].update(members)
    groups={};seen=set()
    for first in ids:
        if first in seen:continue
        stack=[first];members=set()
        while stack:
            item=stack.pop()
            if item in members:continue
            members.add(item);stack.extend(adjacency[item]-members)
        seen.update(members);leader=min(members)
        for name in members:groups[name]=leader
    output=[]
    for name in ids:
        lon=longitudes[name];tile=int(lon//10);fold=int(longitudes[groups[name]]//10)%5
        r=dict(designation=name,tile=str(tile),fold=str(fold),group=groups[name])
        for j in range(5):
            # distance to nearest held-out interval by its endpoints on a 50-degree circle
            offset=(lon-j*10)%50;inside=offset<=10
            distance=0 if inside else min(offset-10,50-offset)
            r[f'train_{j}']=str(int(fold!=j and distance>1))
        output.append(r)
    return output


def replay_basis(z,mask,weights):
    fixed=z*weights;filled=fixed.copy();rank=6
    for _ in range(20):
        center=np.mean(filled,axis=0);a=filled-center
        _,vectors=np.linalg.eigh(a.T@a);b=vectors[:,-rank:].T
        reconstruction=a@b.T@b+center
        filled=np.where(mask,fixed,np.minimum(np.maximum(reconstruction,-5*weights),5*weights))
    center=filled.mean(axis=0);_,vectors=np.linalg.eigh((filled-center).T@(filled-center));b=vectors[:,-rank:].T
    return center,b


def latent(z,mask,weights,center,basis):
    out=[]
    for r,m in zip(z,mask):
        a=basis[:,m].T;b=r[m]*weights[m]-center[m]
        extended=np.vstack([a,.1*np.eye(6)]);target=np.r_[b,np.zeros(6)]
        out.append(np.linalg.lstsq(extended,target,rcond=None)[0])
    return np.asarray(out)


def weights_for(y):
    result=np.empty(len(y));result[y==1]=len(y)/(2*np.sum(y==1));result[y==0]=len(y)/(2*np.sum(y==0));return result


def check_kernel(train,y,alpha,sigma2,test):
    d=cdist(train,train,'sqeuclidean');p=d[d>1e-12];expected=np.median(p) if p.size else 1
    assert np.isclose(sigma2,expected,rtol=1e-9,atol=1e-9)
    k=np.exp(-d/(2*sigma2));res=(k+np.diag(1/weights_for(y)))@alpha-(2*y-1)
    assert np.max(np.abs(res))<1e-7
    return np.exp(-cdist(test,train,'sqeuclidean')/(2*sigma2))@alpha


def select(score,tiles,ids,scope):
    selection=np.zeros(len(ids),bool);names=np.array(ids)
    for tile in np.unique(tiles[scope]):
        ix=np.flatnonzero(scope&(tiles==tile));order=np.lexsort((names[ix],-score[ix]));k=int(np.ceil(len(ix)/20))
        selection[ix[order[:k]]]=True
    return selection


def verify(stage,out):
    reg=json.loads(REG.read_text())
    for item in reg['inputs']:
        p=ROOT/item['path'];assert sha(p)==item['sha256'] and p.stat().st_size==item['bytes'],item['path']
    cp=json.loads((stage/'checkpoint.json').read_text());assert cp['registration_sha256']==sha(REG)
    for name,item in cp['outputs'].items():assert sha(stage/name)==item['sha256'] and (stage/name).stat().st_size==item['bytes']
    splits=list(csv_rows(ROOT/'artifacts/multisurvey_missing_view_splits_20261012.csv.gz'));ids=[r['designation'] for r in splits];assert len(ids)==19328 and ids==sorted(set(ids))
    x,y,native,flags,lon,association=independent_features(ids)
    assert splits==independent_split(ids,lon,association)
    with np.load(stage/'features.npz',allow_pickle=False) as f:
        assert np.array_equal(f['proxy'],y) and np.array_equal(f['mask'],np.isfinite(x))
        assert np.allclose(f['features'],x,rtol=1e-9,atol=1e-9,equal_nan=True)
        tiles=f['tiles'].copy();folds=f['folds'].copy()
        assert np.array_equal(tiles,[int(r['tile']) for r in splits]) and np.array_equal(folds,[int(r['fold']) for r in splits])
    with np.load(stage/'predictions.npz',allow_pickle=False) as p:
        scores=p['scores'].copy();coordinates=p['fold_specific_coordinates'].copy();primary=p['primary_selected'].copy();all_selected=p['all_requested_selected'].copy();bootstrap=p['bootstrap'].copy()
    summary=json.loads((stage/'summary.json').read_text());model_count=0
    for fold in range(5):
        train=np.array([r[f'train_{fold}']=='1' for r in splits]);test=folds==fold;reference=train&(y>=0);labels=y[reference]
        eligible=np.sum(labels==1)>=5 and np.sum(labels==0)>=20
        assert summary['folds'][fold]['valid']==bool(eligible)
        assert summary['folds'][fold]['training_positive']==int(np.sum(labels==1)) and summary['folds'][fold]['training_negative']==int(np.sum(labels==0))
        if not eligible:assert np.isnan(scores[test]).all();continue
        model_count+=1
        with np.load(stage/f'fold_{fold}.npz',allow_pickle=False) as f:model={k:f[k].copy() for k in f.files}
        for key,mask in [('train',train),('test',test),('reference',reference)]:assert np.array_equal(model[key],np.flatnonzero(mask))
        expected_med=[];expected_scale=[]
        for col in x.T:
            values=col[train&np.isfinite(col)]
            if len(values):
                expected_med.append(np.percentile(values,50));q=np.percentile(values,[25,75]);expected_scale.append(q[1]-q[0] if q[1]-q[0]>=1e-8 else 1)
            else:expected_med.append(0);expected_scale.append(1)
        assert np.allclose(model['median'],expected_med) and np.allclose(model['scale'],expected_scale)
        mask=np.isfinite(x);z=np.where(mask,np.clip((x-model['median'])/model['scale'],-5,5),0);raw=np.concatenate([z,mask.astype(float)],axis=1)
        for prefix,cols in [('',28),('ablation_',16)]:
            center,basis=replay_basis(z[train,:cols],mask[train,:cols],model['weights'][:cols])
            keycenter=prefix+'center' if prefix else 'pca_center';keybasis=prefix+'basis' if prefix else 'pca_basis'
            assert np.allclose(center,model[keycenter],atol=1e-7,rtol=1e-7)
            assert np.allclose(basis.T@basis,model[keybasis].T@model[keybasis],atol=1e-6,rtol=1e-6)
        latent_all=latent(z,mask,model['weights'],model['pca_center'],model['pca_basis']);assert np.allclose(latent_all[test],coordinates[test],atol=1e-7,rtol=1e-7)
        continuous=np.c_[latent_all,z[:,:5]];assert np.allclose(model['embed_mean'],continuous[reference].mean(axis=0))
        std=continuous[reference].std(axis=0);std=np.where(std>=1e-8,std,1);assert np.allclose(std,model['embed_std'])
        embedded=np.c_[(continuous-model['embed_mean'])/model['embed_std'],mask.astype(float)]
        b=model['linear_beta'];logits=b[0]+raw[reference]@b[1:];r=weights_for(labels)*(expit(logits)-labels)/len(labels)
        gradient=np.r_[r.sum(),raw[reference].T@r+.05*b[1:]];assert np.max(np.abs(gradient))<=1e-4
        expected=np.c_[check_kernel(embedded[reference],labels,model['embedding_alpha'],float(model['embedding_sigma2']),embedded[test]),
             b[0]+raw[test]@b[1:],check_kernel(raw[reference],labels,model['nonlinear_alpha'],float(model['nonlinear_sigma2']),raw[test])]
        assert np.allclose(expected,scores[test,:3],atol=1e-7,rtol=1e-7)
        ae=latent(z[:,:16],mask[:,:16],model['weights'][:16],model['ablation_center'],model['ablation_basis']);ac=np.c_[ae,z[:,:5]]
        assert np.allclose(model['ablation_mean'],ac[reference].mean(axis=0))
        astd=ac[reference].std(axis=0);astd=np.where(astd>=1e-8,astd,1);assert np.allclose(astd,model['ablation_std'])
        af=np.c_[(ac-model['ablation_mean'])/model['ablation_std'],mask[:,:16].astype(float)]
        assert np.allclose(check_kernel(af[reference],labels,model['ablation_alpha'],float(model['ablation_sigma2']),af[test]),scores[test,3],atol=1e-7,rtol=1e-7)
        print('Fold independently verified',fold,flush=True)
    common=(y>=0)&np.isfinite(scores[:,:3]).all(axis=1);p=y==1;negative=y==0;blocks=np.unique(tiles[common]);rec=[]
    for j,name in enumerate(METHODS):
        selections=select(scores[:,j],tiles,ids,common);all_flags=select(scores[:,j],tiles,ids,np.isfinite(scores[:,j]))
        assert np.array_equal(primary[:,j],selections) and np.array_equal(all_selected[:,j],all_flags)
        rec.append(float(np.sum(selections&p)/p.sum()) if p.sum() else None)
        a=summary['primary'][name];assert a['reviews']==int(selections.sum()) and a['selected_proxy_positive']==int(np.sum(selections&p)) and a['selected_proxy_negative']==int(np.sum(selections&negative))
        a=summary['all_requested'][name];assert a['reviews']==int(all_flags.sum()) and a['selected_proxy_positive']==int(np.sum(all_flags&p)) and a['selected_proxy_negative']==int(np.sum(all_flags&negative)) and a['selected_unknown']==int(np.sum(all_flags&(y<0)))
    deltas=[];rng=np.random.default_rng(20261012);discarded=0
    if len(blocks):
        for draw in rng.integers(0,len(blocks),size=(2000,len(blocks))):
            w=np.bincount(draw,minlength=len(blocks));denom=sum(int(w[k])*int(np.sum(p&common&(tiles==t))) for k,t in enumerate(blocks))
            if denom==0:discarded+=1;continue
            tp=[sum(int(w[k])*int(np.sum(primary[:,j]&p&(tiles==t))) for k,t in enumerate(blocks)) for j in range(3)]
            deltas.append(min(tp[0]-tp[1],tp[0]-tp[2])/denom)
    assert np.array_equal(bootstrap,np.array(deltas));ci=np.percentile(deltas,[2.5,97.5]).tolist() if deltas else None
    adequate=p.sum()>=15 and negative.sum()>=80 and len(blocks)>=4 and np.isfinite(scores[(y>=0),:3]).all() and len(deltas)>=1900
    delta=min(rec[0]-rec[1],rec[0]-rec[2]) if rec[0] is not None else None
    expected_status='insufficient_evidence' if not adequate else ('retrospective_proxy_support' if delta>=.1 and ci[0]>0 else 'no_retrospective_gain_demonstrated')
    assert summary['status']==expected_status and summary['primary_adequacy']==bool(adequate)
    assert summary['primary_minimum_recovery_difference']==delta and summary['spatial_bootstrap_ci95']==ci
    assert summary['bootstrap_retained']==len(deltas) and summary['bootstrap_discarded']==discarded
    for key,v in dict(requested=len(ids),qualifying_positives=int(p.sum()),qualifying_proxy_negatives=int(negative.sum()),unknown=int(np.sum(y<0)),common_qualifying=int(common.sum()),unpredicted_qualifying=int(np.sum((y>=0)&~common)),populated_tiles=len(blocks)).items():assert summary[key]==v
    source_names=[r['designation'] for r in csv_rows(stage/'sources.csv.gz')];assert source_names==ids
    for i,r in enumerate(csv_rows(stage/'sources.csv.gz')):
        assert r['native_malt90_id']==native[i] and r['consumed_proxy_flags']==flags[i]
        assert r['group']==splits[i]['group'] and int(r['fold'])==folds[i] and int(r['tile'])==tiles[i]
        assert r['proxy_state']==('qualifying_positive' if y[i]==1 else ('qualifying_proxy_negative' if y[i]==0 else 'unknown'))
        assert r['physical_stage']=='unknown' and r['birth_status']=='not_established'
        for j,name in enumerate(METHODS):
            assert int(r[name+'_primary_review'])==int(primary[i,j]) and int(r[name+'_all_requested_review'])==int(all_selected[i,j])
            assert (not r[name+'_score'] and np.isnan(scores[i,j])) or value(r[name+'_score'])==scores[i,j]
    # Independently recompute all stratified counts and covariate-domain summaries.
    masks=np.isfinite(x)
    strata={}
    for key,col in [('mass',0),('temperature',1),('distance',2),('surface_density',3)]:
        c=float(np.nanmedian(x[:,col]));strata[key]={}
        for label,s in [('low',x[:,col]<=c),('high',x[:,col]>c),('missing',~np.isfinite(x[:,col]))]:
            q=s&common;strata[key][label]=dict(qualifying=int(q.sum()),positives=int(np.sum(p&q)),selected_positive={name:int(np.sum(primary[:,j]&p&q)) for j,name in enumerate(METHODS)})
        for label,s in [('qualifying',y>=0),('unknown',y<0)]:
            values=x[s,col];values=values[np.isfinite(values)];expected=dict(finite=len(values),mean=float(values.mean()) if len(values) else None,min=float(values.min()) if len(values) else None,max=float(values.max()) if len(values) else None)
            assert summary['covariate_domains_transformed'][key][label]==expected
    for key,s in [('temporal_present',masks[:,16:20].any(axis=1)),('temporal_missing',~masks[:,16:20].any(axis=1)),('gas_present',masks[:,20:].any(axis=1)),('gas_missing',~masks[:,20:].any(axis=1))]:
        q=s&common;strata[key]=dict(qualifying=int(q.sum()),positives=int(np.sum(p&q)),selected_positive={name:int(np.sum(primary[:,j]&p&q)) for j,name in enumerate(METHODS)})
    assert summary['strata']==strata
    assert not summary['physical_validation'] and not summary['calibrated_probabilities'] and summary['new_stars']==summary['new_births']==0
    combined=sum(p.stat().st_size for d in (stage,out) for p in d.rglob('*') if p.is_file());assert combined<16*1024**2
    result=dict(schema='missing-view-independent-verification/1',verified=True,method='Raw independent feature/label/graph extraction; eigenvalue completion replay; augmented least-squares encoders; solver algebra; exact paired spatial readout',
        registration_sha256=sha(REG),summary_sha256=sha(stage/'summary.json'),sources_sha256=sha(stage/'sources.csv.gz'),
        sources=len(ids),features_checked=28,valid_models=model_count,status=expected_status,primary_delta=delta,ci95=ci,
        combined_bytes_before_receipt=combined,physical_validation=False,new_stars=0,new_births=0)
    (out/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2),flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--stage',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();verify(a.stage,a.output)
