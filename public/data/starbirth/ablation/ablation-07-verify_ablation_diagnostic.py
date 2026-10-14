"""Independent replay without importing the worker or its model implementation."""
import argparse,csv,gzip,hashlib,json,math,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OLD=ROOT/'artifacts/multisurvey_missing_view_20261012';REG=ROOT/'artifacts/ablation_execution3_registration_20261014.json'
VREG=ROOT/'artifacts/ablation_verification_execution6_registration_20261014.json'
NAMES=['embedding','linear','nonlinear','infrared_embedding','physical','availability','infrared_raw','no_molecular','no_temporal','molecular','latent_only','embedding_no_masks','rank2','rank12','ridge01','ridge10']
COLS={'physical':list(range(5)),'infrared_raw':list(range(16)),'no_molecular':list(range(20)),'no_temporal':list(range(16))+list(range(20,28)),'molecular':list(range(20,28))}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def rows(p):
 with gzip.open(p,'rt') as f:return list(csv.DictReader(f))
def close(a,b,tol=1e-7):assert np.allclose(a,b,atol=tol,rtol=tol,equal_nan=False),np.max(abs(np.asarray(a)-np.asarray(b)))
def check_tree(a,b):
 if isinstance(a,dict):
  assert set(a)==set(b),(set(a),set(b))
  for k in a:check_tree(a[k],b[k])
 elif isinstance(a,list):
  assert len(a)==len(b)
  for x,y in zip(a,b):check_tree(x,y)
 elif isinstance(a,float):assert abs(a-b)<1e-7,(a,b)
 else:assert a==b,(a,b)
def metric(labels,score):
 pos=score[labels==1];neg=score[labels==0]
 if not len(pos) or not len(neg):return None
 auc=np.mean((pos[:,None]>neg[None,:])+.5*(pos[:,None]==neg[None,:]));previous=0;area=0.
 for threshold in sorted(set(score),reverse=True):
  selected=score>=threshold;tp=int(np.sum(selected&(labels==1)));area+=(tp-previous)*tp/np.sum(selected);previous=tp
 return dict(auc=float(auc),ap=float(area/len(pos)),positive=len(pos),negative=len(neg),prevalence=float(len(pos)/len(labels)))
def aggregate(records):
 return dict(train_auc=float(np.mean([r['train']['auc'] for r in records])),test_auc=float(np.mean([r['test']['auc'] for r in records])),gap=float(np.mean([r['train']['auc']-r['test']['auc'] for r in records])),train_ap=float(np.mean([r['train']['ap'] for r in records])),test_ap=float(np.mean([r['test']['ap'] for r in records])),eligible_folds=len(records))
def coordinates(z,m,w,c,b):
 out=np.empty((len(z),len(b)))
 for pattern in np.unique(m,axis=0):
  ix=np.flatnonzero(np.all(m==pattern,axis=1));v=b[:,pattern];normal=v@v.T+.01*np.eye(len(b));rhs=(z[ix][:,pattern]*w[pattern]-c[pattern])@v.T;out[ix]=np.linalg.solve(normal,rhs.T).T
 return out
def completed(z,m,w,rank):
 observed=z*w;fill=observed.copy()
 for _ in range(20):
  center=np.mean(fill,axis=0);u,s,v=np.linalg.svd(fill-center,full_matrices=False);reconstruction=center+np.matmul(u[:,:rank]*s[:rank],v[:rank]);fill[~m]=np.clip(reconstruction,-5*w,5*w)[~m]
 center=fill.mean(0);_,s,v=np.linalg.svd(fill-center,full_matrices=False);return center,s[:rank],v[:rank]
def kernel_scores(a,reference,labels,alpha,width,ridge):
 train=a[reference];d=np.sum((train[:,None,:]-train[None,:,:])**2,axis=2);positive=d[d>1e-12];close(width,np.median(positive) if len(positive) else 1.)
 weights=np.array([len(labels)/(2*np.sum(labels==v)) for v in labels]);normal=np.exp(-d/(2*width))+np.diag(ridge/weights);close(normal@alpha,2*labels-1,tol=1e-8)
 unique,inverse=np.unique(a,axis=0,return_inverse=True);output=np.empty(len(unique))
 # Direct distance, independent of worker dot-product cancellation formula.
 for start in range(0,len(unique),128):
  d=np.zeros((min(128,len(unique)-start),len(train)))
  for col in range(a.shape[1]):d+=(unique[start:start+128,col,None]-train[None,:,col])**2
  output[start:start+128]=np.exp(-d/(2*width))@alpha
 return output[inverse]
def selection(score,tiles,ids,scope):
 chosen=set()
 for tile in np.unique(tiles[scope]):
  pool=[i for i in range(len(ids)) if scope[i] and tiles[i]==tile];pool.sort(key=lambda i:(-score[i],ids[i]));chosen.update(pool[:int(math.ceil(len(pool)/20))])
 return np.array([i in chosen for i in range(len(ids))])
def verify(stage,out):
 reg=json.loads(REG.read_text());verification_reg=json.loads(VREG.read_text())
 for item in verification_reg['inputs']:
  p=ROOT/item['path'];assert digest(p)==item['sha256'] and p.stat().st_size==item['bytes']
 for item in reg['inputs']:
  p=ROOT/item['path']
  if item['path']=='research/verify_ablation_diagnostic.py':
   original=subprocess.check_output(['git','show','9ac5cb76:'+item['path']],cwd=ROOT);assert hashlib.sha256(original).hexdigest()==item['sha256'] and len(original)==item['bytes']
  else:assert digest(p)==item['sha256'] and p.stat().st_size==item['bytes']
 cp=json.loads((stage/'checkpoint.json').read_text())
 for name,item in cp['outputs'].items():assert digest(stage/name)==item['sha256'] and (stage/name).stat().st_size==item['bytes']
 f=np.load(OLD/'features.npz');x=f['features'];m=f['mask'];y=f['proxy'];tiles=f['tiles'];folds=f['folds'];split=rows(ROOT/'artifacts/multisurvey_missing_view_splits_20261012.csv.gz');ids=[r['designation'] for r in split];assert ids==sorted(set(ids)) and len(ids)==19328;assert np.array_equal(m,np.isfinite(x));assert np.array_equal(folds,[int(r['fold']) for r in split]);assert np.array_equal(tiles,[int(r['tile']) for r in split]);assert list(np.unique(y,return_counts=True)[1])==[19066,235,27]
 archive=np.load(stage/'predictions.npz');saved={key:archive[key] for key in archive.files};archive.close();summary=json.loads((stage/'summary.json').read_text());assert summary['registration_sha256']==digest(REG) and summary['methods']==NAMES and summary['physical_truth'] is False and summary['full_goal_achieved'] is False
 reconstructed=np.empty_like(saved['scores']);records={name:[] for name in NAMES};curves=[];perms=[];w=np.r_[np.repeat(.25,16),np.repeat(.5,4),np.repeat(1/math.sqrt(8),8)];count=0
 for fold in range(5):
  old=np.load(OLD/f'fold_{fold}.npz');model=np.load(stage/f'models_{fold}.npz');aux=np.load(stage/f'auxiliary_{fold}.npz');train=np.flatnonzero([r[f'train_{fold}']=='1' for r in split]);test=np.flatnonzero(folds==fold);reference=train[y[train]>=0];held=test[y[test]>=0]
  for key,value in [('train',train),('test',test),('reference',reference)]:assert np.array_equal(old[key],value)
  assert not set(split[i]['group'] for i in train)&set(split[i]['group'] for i in test)
  med=[];scale=[]
  for j in range(28):
   values=x[train,j];values=values[np.isfinite(values)];med.append(np.median(values) if len(values) else 0.);q=np.quantile(values,[.25,.75]) if len(values) else [0.,0.];scale.append(q[1]-q[0] if q[1]-q[0]>=1e-8 else 1.)
  close(med,old['median']);close(scale,old['scale']);z=np.zeros_like(x);standard=np.clip((x-med)/scale,-5,5);z[m]=standard[m]
  em=coordinates(z,m,w,old['pca_center'],old['pca_basis']);cont=np.c_[em,z[:,:5]];close(cont[reference].mean(0),old['embed_mean']);s=cont[reference].std(0);s[s<1e-8]=1.;close(s,old['embed_std']);std=(cont-old['embed_mean'])/old['embed_std']
  ir=coordinates(z[:,:16],m[:,:16],w[:16],old['ablation_center'],old['ablation_basis']);irc=(np.c_[ir,z[:,:5]]-old['ablation_mean'])/old['ablation_std']
  def matrix(name):
   if name in COLS:
    cols=COLS[name];return np.c_[z[:,cols],m[:,cols]]
   if name in ('linear','nonlinear'):return np.c_[z,m]
   if name=='availability':return m.astype(float)
   if name=='latent_only':return std[:,:6].copy()
   if name=='embedding_no_masks':return std
   if name=='infrared_embedding':return np.c_[irc,m[:,:16]]
   if name in ('rank2','rank12'):
    latent=coordinates(z,m,w,model[name+'_center'],model[name+'_basis']);return np.c_[(np.c_[latent,z[:,:5]]-model[name+'_mean'])/model[name+'_std'],m]
   return np.c_[std,m]
  for rank in (2,12):
   name=f'rank{rank}';c,s,b=completed(z[train],m[train],w,rank);close(c,model[name+'_center']);close(s,model[name+'_singular']);close(b.T@b,model[name+'_basis'].T@model[name+'_basis']);em=coordinates(z,m,w,model[name+'_center'],model[name+'_basis']);cont=np.c_[em,z[:,:5]];close(cont[reference].mean(0),model[name+'_mean']);s=cont[reference].std(0);s[s<1e-8]=1.;close(s,model[name+'_std'])
  for j,name in enumerate(NAMES):
   a=matrix(name)
   if name=='linear':
    beta=model[name+'_beta'];close(beta,old['linear_beta']);prediction=beta[0]+a@beta[1:]
   else:prediction=kernel_scores(a,reference,y[reference],model[name+'_alpha'],float(model[name+'_sigma2']),.1 if name=='ridge01' else (10 if name=='ridge10' else 1))
   reconstructed[test,j]=prediction[test];records[name].append(dict(fold=fold,train=metric(y[reference],prediction[reference]),test=metric(y[held],prediction[held])));count+=1
  groups=sorted(set(split[i]['group'] for i in reference),key=lambda g:hashlib.sha256(('20261014:'+g).encode()).hexdigest());rng=np.random.default_rng(20261014+fold);expected=[]
  for fraction in (.5,.75,1.):
   chosen=set(groups[:math.ceil(fraction*len(groups))]);sub=np.array([i for i in reference if split[i]['group'] in chosen]);valid=np.sum(y[sub]==1)>=5 and np.sum(y[sub]==0)>=20
   for name in ('embedding','nonlinear'):
    key=f'curve_{name}_{fraction}';assert np.array_equal(sub,aux[key+'_reference']) and np.array_equal(y[sub],aux[key+'_labels']);rec=dict(method=name,fold=fold,fraction=fraction,valid=bool(valid),positive=int(np.sum(y[sub]==1)),negative=int(np.sum(y[sub]==0)),components=len(chosen))
    if valid:
     # Only subset and held rows required here; remap reference for independent replay.
     a=matrix(name)[np.r_[sub,held]];pred=kernel_scores(a,np.arange(len(sub)),y[sub],aux[key+'_alpha'],float(aux[key+'_sigma2']),1);rec.update(train=metric(y[sub],pred[:len(sub)]),test=metric(y[held],pred[len(sub):]))
    curves.append(rec);expected.append(dict(key=key,record=rec))
  for draw in range(10):
   labels=y[reference].copy()
   for tile in sorted(set(tiles[reference])):
    ix=np.flatnonzero(tiles[reference]==tile);labels[ix]=rng.permutation(labels[ix])
   for name in ('embedding','nonlinear'):
    key=f'perm_{name}_{draw}';assert np.array_equal(reference,aux[key+'_reference']) and np.array_equal(labels,aux[key+'_labels']);a=matrix(name)[np.r_[reference,held]];pred=kernel_scores(a,np.arange(len(reference)),labels,aux[key+'_alpha'],float(aux[key+'_sigma2']),1);rec=dict(method=name,fold=fold,draw=draw,test=metric(y[held],pred[len(reference):]),mixed_training_tiles=int(sum(len(set(y[reference][tiles[reference]==t]))==2 for t in set(tiles[reference]))));perms.append(rec);expected.append(dict(key=key,record=rec))
  check_tree(expected,json.loads((stage/f'auxiliary_{fold}.json').read_text()));print(f'Independent fold {fold}: feature fits, rank fits, scores, subsets, tile permutations and metrics passed',flush=True)
  del matrix,a,std,irc,em,cont,z,standard
  old.close();model.close();aux.close()
 close(reconstructed,saved['scores']);close(reconstructed[:,:4],np.load(OLD/'predictions.npz')['scores']);primary=np.column_stack([selection(saved['scores'][:,j],tiles,ids,y>=0) for j in range(16)]);all_flags=np.column_stack([selection(saved['scores'][:,j],tiles,ids,np.ones(len(y),bool)) for j in range(16)]);assert np.array_equal(primary,saved['primary_selected']) and np.array_equal(all_flags,saved['all_requested_selected'])
 blocks=sorted(set(tiles[y>=0]));counts=np.array([np.sum((y==1)&(tiles==t)) for t in blocks]);tp=np.array([[np.sum(primary[:,j]&(y==1)&(tiles==t)) for j in range(16)] for t in blocks]);rng=np.random.default_rng(20261014);boot=[]
 for _ in range(2000):
  sample=rng.integers(0,len(blocks),len(blocks));denom=counts[sample].sum()
  if denom:boot.append((tp[sample].sum(0)-tp[sample,0].sum())/denom)
 close(boot,saved['bootstrap']);assert len(boot)==summary['bootstrap_retained']
 for j,name in enumerate(NAMES):
  expected=dict(folds=records[name],macro=aggregate(records[name]),reviews=int(primary[:,j].sum()),recovered_positive=int(np.sum(primary[:,j]&(y==1))),selected_proxy_negative=int(np.sum(primary[:,j]&(y==0))),all_requested_reviews=int(all_flags[:,j].sum()),all_requested_positive=int(np.sum(all_flags[:,j]&(y==1))),all_requested_proxy_negative=int(np.sum(all_flags[:,j]&(y==0))),all_requested_unknown=int(np.sum(all_flags[:,j]&(y<0))),delta_recovery_vs_embedding=float((np.sum(primary[:,j]&(y==1))-np.sum(primary[:,0]&(y==1)))/27),delta_spatial_ci95=np.percentile(boot, [2.5,97.5],axis=0)[:,j].tolist());check_tree(expected,summary['results'][name])
 check_tree(curves,summary['label_curves']);check_tree(perms,summary['permutations']);assert summary['temporal_positive']==int(np.sum((y==1)&m[:,16:20].any(1)))==0
 # Recompute the fixed diagnostic decision without importing the worker.
 for name in ('embedding','nonlinear'):
  b=summary['results'][name];large=sum(r['train']['auc']-r['test']['auc']>=.1 for r in records[name]);low=sum(r['train']['auc']<=.7 and r['test']['auc']<=.7 for r in records[name]);paired=[]
  for fold in range(5):
   pair=[r for r in curves if r['method']==name and r['fold']==fold and r['fraction'] in (.5,1.) and r['valid']]
   if len(pair)==2:paired.append(sorted(pair,key=lambda r:r['fraction']))
  change=None
  if paired:
   lo=aggregate([v[0] for v in paired]);hi=aggregate([v[1] for v in paired]);change=dict(paired_folds=len(paired),test_auc_increase=hi['test_auc']-lo['test_auc'],gap_reduction=lo['gap']-hi['gap'])
  regularization=name=='embedding' and summary['results']['ridge10']['macro']['test_auc']-b['macro']['test_auc']>=.02;curve=change and len(paired)>=4 and change['test_auc_increase']>=.02 and change['gap_reduction']>=.03;capacity=False
  if name=='embedding':
   for other in ('rank12','ridge01'):
    a=summary['results'][other]['macro'];capacity|=a['train_auc']-b['macro']['train_auc']>=.05 and a['test_auc']-b['macro']['test_auc']>=.05 and a['gap']-b['macro']['gap']<=.03
  expected=dict(verdict='consistent_with_overfit' if large>=4 and (regularization or curve) else ('consistent_with_underfit' if low>=4 and capacity else 'mixed_or_inconclusive'),large_gap_folds=large,low_train_and_test_folds=low,ridge10_improves_test_auc=bool(regularization),label_curve_change=change);check_tree(expected,summary['diagnosis'][name])
 with gzip.open(stage/'sources.csv.gz','rt') as stream:
  i=-1
  for i,row in enumerate(csv.DictReader(stream)):
   assert row['designation']==ids[i] and row['physical_stage']=='unknown' and row['proxy_state']==('unknown' if y[i]<0 else ('positive_proxy' if y[i]==1 else 'negative_proxy'))
   assert np.array_equal([float(row[name+'_score']) for name in NAMES],saved['scores'][i])
   assert np.array_equal([int(row[name+'_review']) for name in NAMES],primary[i]) and np.array_equal([int(row[name+'_all_review']) for name in NAMES],all_flags[i])
  assert i+1==len(ids)
 for item in reg['inputs']:
  if item['path']!='research/verify_ablation_diagnostic.py':assert digest(ROOT/item['path'])==item['sha256']
 for item in verification_reg['inputs']:assert digest(ROOT/item['path'])==item['sha256']
 receipt=dict(schema='independent-ablation-verification/1',status='verified',registration_sha256=digest(REG),verification_registration_sha256=digest(VREG),verifier_allocation_correction=True,study_checkpoint_sha256=digest(stage/'checkpoint.json'),summary_sha256=digest(stage/'summary.json'),source_ledger_sha256=digest(stage/'sources.csv.gz'),requested=19328,proxy_positive=27,proxy_negative=235,unknown=19066,main_fold_models=count,auxiliary_fold_models=len(perms)+sum(r['valid'] for r in curves),input_immutability=True,all_scores_and_selections_replayed=True,training_only_preprocessing=True,physical_truth=False,full_goal_achieved=False)
 with (out/'verification.json').open('x') as f:json.dump(receipt,f,indent=2);f.write('\n')
 print(json.dumps(receipt,indent=2),flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--stage',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();verify(a.stage,a.output)
