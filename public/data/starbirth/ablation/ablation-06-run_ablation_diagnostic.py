"""Fixed retrospective contrasts; never choose a winning model from consumed outcomes."""
import argparse,csv,gzip,hashlib,io,json,math
from pathlib import Path
import numpy as np
from scipy.stats import rankdata
from multisurvey_missing_view_model import robust_fit,transform,encode,squared,class_weights
ROOT=Path(__file__).resolve().parents[1]
OLD=ROOT/'artifacts/multisurvey_missing_view_20261012'
REG=ROOT/'artifacts/ablation_execution3_registration_20261014.json'
METHODS=['embedding','linear','nonlinear','infrared_embedding','physical','availability','infrared_raw','no_molecular','no_temporal','molecular','latent_only','embedding_no_masks','rank2','rank12','ridge01','ridge10']
RAW={'physical':list(range(5)),'infrared_raw':list(range(16)),'no_molecular':list(range(20)),'no_temporal':list(range(16))+list(range(20,28)),'molecular':list(range(20,28))}
WEIGHTS=np.r_[np.full(16,.25),np.full(4,.5),np.full(8,1/math.sqrt(8))]
def sha(p):
 h=hashlib.sha256()
 with Path(p).open('rb') as f:
  for b in iter(lambda:f.read(2**20),b''):h.update(b)
 return h.hexdigest()
def save(p,v):
 with p.open('x') as f:json.dump(v,f,indent=2,allow_nan=False);f.write('\n')
def table(p):
 with gzip.open(p,'rt') as f:return list(csv.DictReader(f))
def discrimination(y,s):
 p=y==1;n=y==0
 if not p.any() or not n.any():return None
 auc=(rankdata(s)[p].sum()-p.sum()*(p.sum()+1)/2)/(p.sum()*n.sum())
 order=np.argsort(-s,kind='stable');ys=y[order];ss=s[order];ends=np.r_[np.flatnonzero(ss[:-1]!=ss[1:]),len(s)-1];tp=np.cumsum(ys)[ends];fp=ends+1-tp
 ap=np.sum(np.diff(np.r_[0,tp])*tp/(tp+fp))/p.sum()
 return dict(auc=float(auc),ap=float(ap),positive=int(p.sum()),negative=int(n.sum()),prevalence=float(p.mean()))
def select(s,tiles,ids,scope):
 out=np.zeros(len(s),bool)
 for t in sorted(set(tiles[scope])):
  rows=np.flatnonzero(scope&(tiles==t));order=sorted(rows,key=lambda i:(-s[i],ids[i]));out[order[:math.ceil(.05*len(rows))]]=True
 return out
def completion(z,m,rank):
 observed=z*WEIGHTS;filled=observed.copy()
 for _ in range(20):
  c=filled.mean(0);u,s,b=np.linalg.svd(filled-c,full_matrices=False);rec=(u[:,:rank]*s[:rank])@b[:rank]+c
  filled=np.where(m,observed,np.clip(rec,-5*WEIGHTS,5*WEIGHTS))
 c=filled.mean(0);_,s,b=np.linalg.svd(filled-c,full_matrices=False);return c,b[:rank],s[:rank]
def fit_kernel(a,y,ridge=1):
 d=squared(a,a);v=d[d>1e-12];sig=float(np.median(v)) if len(v) else 1.;k=np.exp(-d/(2*sig));alpha=np.linalg.solve(k+np.diag(ridge/class_weights(y)),2*y-1)
 return alpha,sig
def predict(a,ref,alpha,sig):
 unique,inverse=np.unique(a,axis=0,return_inverse=True);out=np.empty(len(unique))
 for start in range(0,len(unique),512):out[start:start+512]=np.exp(-squared(unique[start:start+512],ref)/(2*sig))@alpha
 return out[inverse]
def feature_set(name,z,m,old,extra):
 if name in RAW:
  cols=RAW[name];return np.c_[z[:,cols],m[:,cols]]
 if name in ('linear','nonlinear'):return np.c_[z,m]
 if name=='availability':return m.astype(float)
 if name=='infrared_embedding':
  ir=encode(z[:,:16],m[:,:16],WEIGHTS[:16],old['ablation_center'],old['ablation_basis']);cont=(np.c_[ir,z[:,:5]]-old['ablation_mean'])/old['ablation_std'];return np.c_[cont,m[:,:16]]
 if name in ('rank2','rank12'):
  em=encode(z,m,WEIGHTS,extra[name+'_center'],extra[name+'_basis']);return np.c_[(np.c_[em,z[:,:5]]-extra[name+'_mean'])/extra[name+'_std'],m]
 em=encode(z,m,WEIGHTS,old['pca_center'],old['pca_basis']);std=(np.c_[em,z[:,:5]]-old['embed_mean'])/old['embed_std']
 if name=='latent_only':return std[:,:6].copy()
 if name=='embedding_no_masks':return std
 return np.c_[std,m]

def macro(records):
 if not records:return None
 return dict(train_auc=float(np.mean([r['train']['auc'] for r in records])),test_auc=float(np.mean([r['test']['auc'] for r in records])),gap=float(np.mean([r['train']['auc']-r['test']['auc'] for r in records])),train_ap=float(np.mean([r['train']['ap'] for r in records])),test_ap=float(np.mean([r['test']['ap'] for r in records])),eligible_folds=len(records))
def diagnosis(summary,curves):
 out={}
 for name in ('embedding','nonlinear'):
  base=summary[name];folds=base['folds'];large=sum(r['train']['auc']-r['test']['auc']>=.1 for r in folds)
  paired=[]
  for f in range(5):
   r=[v for v in curves if v['method']==name and v['fold']==f and v['fraction'] in (.5,1.) and v['valid']]
   if len(r)==2:paired.append(sorted(r,key=lambda v:v['fraction']))
  change=None
  if paired:
   lo=macro([p[0] for p in paired]);hi=macro([p[1] for p in paired]);change=dict(paired_folds=len(paired),test_auc_increase=hi['test_auc']-lo['test_auc'],gap_reduction=lo['gap']-hi['gap'])
  regularization=(name=='embedding' and summary['ridge10']['macro']['test_auc']-base['macro']['test_auc']>=.02)
  curve=change and change['paired_folds']>=4 and change['test_auc_increase']>=.02 and change['gap_reduction']>=.03
  low=sum(r['train']['auc']<=.7 and r['test']['auc']<=.7 for r in folds)
  capacity=False
  if name=='embedding':
   for other in ('rank12','ridge01'):
    a=summary[other]['macro'];b=base['macro'];capacity|=a['train_auc']-b['train_auc']>=.05 and a['test_auc']-b['test_auc']>=.05 and a['gap']-b['gap']<=.03
  out[name]=dict(verdict='consistent_with_overfit' if large>=4 and (regularization or curve) else ('consistent_with_underfit' if low>=4 and capacity else 'mixed_or_inconclusive'),large_gap_folds=large,low_train_and_test_folds=low,ridge10_improves_test_auc=bool(regularization),label_curve_change=change)
 return out

def self_test():
 assert discrimination(np.array([0,1]),np.array([0.,0.]))['auc']==.5
 assert discrimination(np.array([0,1]),np.array([0.,0.]))['ap']==.5
 assert discrimination(np.array([0,1,1]),np.array([0.,2.,1.]))['ap']==1
 ids=['a','b','c'];flags=select(np.ones(3),np.array([0,0,1]),ids,np.ones(3,bool));assert flags.tolist()==[True,False,True]
 a=np.array([[-2.],[-1.],[1.],[2.]]);y=np.array([0,0,1,1]);alpha,sig=fit_kernel(a,y,10)
 residual=(np.exp(-squared(a,a)/(2*sig))+np.diag(10/class_weights(y)))@alpha-(2*y-1);assert np.max(abs(residual))<1e-12
 med,scale=robust_fit(np.array([[1.,np.nan],[3.,4.]]));z,m=transform(np.array([[999.,np.nan]]),med,scale);assert z.tolist()==[[5.,0.]] and not m[0,1]
 assert np.array([-1,0,1])[np.array([-1,0,1])>=0].tolist()==[0,1]
 duplicated=np.repeat(a[:1],1025,axis=0);assert len(np.unique(predict(duplicated,a,alpha,sig)))==1
 rng=np.random.default_rng(7);low=rng.normal(size=(12,2))@rng.normal(size=(2,28));c,b,s=completion(low,np.ones_like(low,dtype=bool),2);assert np.max(abs(((low*WEIGHTS-c)@b.T)@b+c-low*WEIGHTS))<1e-10
 missing=np.ones_like(low,dtype=bool);missing[0]=False;assert np.isfinite(encode(low,missing,WEIGHTS,c,b)).all()
 print('Tied AUC/AP, exact reviews, unknown preservation, scaling and ridge controls passed',flush=True)

def run(stage):
 reg=json.loads(REG.read_text())
 for item in reg['inputs']:
  p=ROOT/item['path'];assert sha(p)==item['sha256'] and p.stat().st_size==item['bytes'],p
 data=np.load(OLD/'features.npz');x=data['features'];m=data['mask'];y=data['proxy'];tiles=data['tiles'];folds=data['folds'];rows=table(ROOT/'artifacts/multisurvey_missing_view_splits_20261012.csv.gz');ids=[r['designation'] for r in rows];assert len(ids)==len(set(ids))==19328
 scores=np.full((len(y),len(METHODS)),np.nan);records={name:[] for name in METHODS};curves=[];permutations=[]
 for fold in range(5):
  old=np.load(OLD/f'fold_{fold}.npz');train=old['train'];test=old['test'];reference=old['reference'];held=test[y[test]>=0];z,_=transform(x,old['median'],old['scale']);extra={}
  for rank in (2,12):
   name=f'rank{rank}';center,basis,s=completion(z[train],m[train],rank);emb=encode(z,m,WEIGHTS,center,basis);cont=np.c_[emb,z[:,:5]];mean=cont[reference].mean(0);std=cont[reference].std(0);std=np.where(std>=1e-8,std,1)
   extra.update({name+'_center':center,name+'_basis':basis,name+'_singular':s,name+'_mean':mean,name+'_std':std})
  del emb,cont
  models=dict(extra);aux={};aux_meta=[]
  for j,name in enumerate(METHODS):
   a=feature_set(name,z,m,old,extra);ridge=.1 if name=='ridge01' else (10 if name=='ridge10' else 1)
   if name=='linear':pred=old['linear_beta'][0]+a@old['linear_beta'][1:];models[name+'_beta']=old['linear_beta']
   else:
    if name in ('embedding','nonlinear','infrared_embedding'):
     prefix='ablation' if name=='infrared_embedding' else name;alpha=old[prefix+'_alpha'];sig=float(old[prefix+'_sigma2'])
    else:alpha,sig=fit_kernel(a[reference],y[reference],ridge)
    models[name+'_alpha']=alpha;models[name+'_sigma2']=sig;pred=predict(a,a[reference],alpha,sig)
   scores[test,j]=pred[test];records[name].append(dict(fold=fold,train=discrimination(y[reference],pred[reference]),test=discrimination(y[held],pred[held])))
  groups=sorted(set(rows[i]['group'] for i in reference),key=lambda g:hashlib.sha256(('20261014:'+g).encode()).hexdigest());rng=np.random.default_rng(20261014+fold)
  for fraction in (.5,.75,1.):
   chosen=set(groups[:math.ceil(fraction*len(groups))]);sub=np.array([i for i in reference if rows[i]['group'] in chosen]);valid=np.sum(y[sub]==1)>=5 and np.sum(y[sub]==0)>=20
   for name in ('embedding','nonlinear'):
    rec=dict(method=name,fold=fold,fraction=fraction,valid=bool(valid),positive=int(np.sum(y[sub]==1)),negative=int(np.sum(y[sub]==0)),components=len(chosen));key=f'curve_{name}_{fraction}'
    aux[key+'_reference']=sub;aux[key+'_labels']=y[sub]
    if valid:
     a=feature_set(name,z,m,old,extra);alpha,sig=fit_kernel(a[sub],y[sub]);pred=predict(a[np.r_[sub,held]],a[sub],alpha,sig);rec.update(train=discrimination(y[sub],pred[:len(sub)]),test=discrimination(y[held],pred[len(sub):]));aux[key+'_alpha']=alpha;aux[key+'_sigma2']=sig
    aux_meta.append(dict(key=key,record=rec));curves.append(rec)
  for draw in range(10):
   labels=y[reference].copy()
   for t in sorted(set(tiles[reference])):
    ix=np.flatnonzero(tiles[reference]==t);labels[ix]=rng.permutation(labels[ix])
   for name in ('embedding','nonlinear'):
    a=feature_set(name,z,m,old,extra);alpha,sig=fit_kernel(a[reference],labels);pred=predict(a[held],a[reference],alpha,sig);rec=dict(method=name,fold=fold,draw=draw,test=discrimination(y[held],pred),mixed_training_tiles=int(sum(len(set(y[reference][tiles[reference]==t]))==2 for t in set(tiles[reference]))));key=f'perm_{name}_{draw}'
    aux.update({key+'_reference':reference,key+'_labels':labels,key+'_alpha':alpha,key+'_sigma2':sig});aux_meta.append(dict(key=key,record=rec));permutations.append(rec)
  np.savez_compressed(stage/f'models_{fold}.npz',**models);np.savez_compressed(stage/f'auxiliary_{fold}.npz',**aux);save(stage/f'auxiliary_{fold}.json',aux_meta)
  print(f'Fold {fold}: all 16 contrasts, nested label curves and ten tile-preserving controls complete',flush=True)
  del a,pred,models,aux,extra,z
  old.close()
 original=np.load(OLD/'predictions.npz')['scores'];assert np.max(abs(scores[:,:4]-original))<1e-7
 primary=np.column_stack([select(scores[:,j],tiles,ids,y>=0) for j in range(len(METHODS))]);all_flags=np.column_stack([select(scores[:,j],tiles,ids,np.ones(len(y),bool)) for j in range(len(METHODS))]);baseline=np.load(OLD/'predictions.npz');assert np.array_equal(primary[:,:4],baseline['primary_selected']) and np.array_equal(all_flags[:,:4],baseline['all_requested_selected']);summary={};blocks=sorted(set(tiles[y>=0]));counts=np.array([np.sum((y==1)&(tiles==t)) for t in blocks]);tp=np.array([[np.sum(primary[:,j]&(y==1)&(tiles==t)) for j in range(len(METHODS))] for t in blocks]);rng=np.random.default_rng(20261014);boot=[]
 for _ in range(2000):
  sample=rng.integers(0,len(blocks),len(blocks));denom=counts[sample].sum()
  if denom:boot.append((tp[sample].sum(0)-tp[sample,0].sum())/denom)
 boot=np.asarray(boot)
 for j,name in enumerate(METHODS):
  summary[name]=dict(folds=records[name],macro=macro(records[name]),reviews=int(primary[:,j].sum()),recovered_positive=int(np.sum(primary[:,j]&(y==1))),selected_proxy_negative=int(np.sum(primary[:,j]&(y==0))),all_requested_reviews=int(all_flags[:,j].sum()),all_requested_positive=int(np.sum(all_flags[:,j]&(y==1))),all_requested_proxy_negative=int(np.sum(all_flags[:,j]&(y==0))),all_requested_unknown=int(np.sum(all_flags[:,j]&(y<0))),delta_recovery_vs_embedding=float((np.sum(primary[:,j]&(y==1))-np.sum(primary[:,0]&(y==1)))/27),delta_spatial_ci95=np.percentile(boot[:,j],[2.5,97.5]).tolist())
 result=dict(schema='retrospective-ablation/1',status='diagnostic_only_not_model_selection',methods=METHODS,requested=len(y),proxy_positive=27,proxy_negative=235,unknown=19066,permutations=permutations,label_curves=curves,results=summary,diagnosis=diagnosis(summary,curves),temporal_positive=int(np.sum((y==1)&m[:,16:20].any(1))),bootstrap_retained=len(boot),registration_sha256=sha(REG),physical_truth=False,full_goal_achieved=False)
 save(stage/'summary.json',result);np.savez_compressed(stage/'predictions.npz',scores=scores,primary_selected=primary,all_requested_selected=all_flags,bootstrap=boot)
 with (stage/'sources.csv.gz').open('xb') as raw:
  with gzip.GzipFile(filename='',fileobj=raw,mode='wb',mtime=0) as gz:
   with io.TextIOWrapper(gz,encoding='utf8',newline='') as f:
    fields=['designation','fold','tile','proxy_state','physical_stage']+[v+s for v in METHODS for s in ('_score','_review','_all_review')];w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
    for i,name in enumerate(ids):
     row=dict(designation=name,fold=int(folds[i]),tile=int(tiles[i]),proxy_state='unknown' if y[i]<0 else ('positive_proxy' if y[i]==1 else 'negative_proxy'),physical_stage='unknown')
     for j,v in enumerate(METHODS):row.update({v+'_score':float(scores[i,j]),v+'_review':int(primary[i,j]),v+'_all_review':int(all_flags[i,j])})
     w.writerow(row)
 save(stage/'checkpoint.json',dict(outputs={p.name:dict(bytes=p.stat().st_size,sha256=sha(p)) for p in stage.iterdir() if p.suffix in ('.npz','.gz','.json')},independent_verification_pending=True))
 print(json.dumps(result['diagnosis'],indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path);p.add_argument('--self-test',action='store_true');a=p.parse_args()
 if a.self_test:self_test()
 else:run(a.stage)
