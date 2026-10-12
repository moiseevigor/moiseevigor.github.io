"""Registered feature contract; masks and consumed proxy kept distinct."""
from collections import defaultdict
import csv,gzip,hashlib,math
from pathlib import Path
import numpy as np

FEATURES=['log_mass','temperature','log_distance','log_surface_density','log_diameter',
 'ln_f160','ln_f250','ln_fsc350','ln_fsc500','ln_160_250','ln_250_350','ln_350_500',
 'w1_w2','w2_w3','w3_w4','w2_magnitude','visit_w2_mean','ln1p_visit_chi2','visit_range','visit_slope_per_year']
for line in ('HCOP','HNC','N2HP','HCN'):FEATURES.extend(['asinh_snr_'+line,'ln_width_'+line])


def table(p):
    with (gzip.open(p,'rt') if p.suffix=='.gz' else p.open()) as f:yield from csv.DictReader(f)


def num(s):
    try:return float(s)
    except (ValueError,TypeError):return math.nan


def sep(a,b,c,d):
    a,b,c,d=map(math.radians,map(float,(a,b,c,d)))
    v=math.sin((b-d)/2)**2+math.cos(b)*math.cos(d)*math.sin((a-c)/2)**2
    return 7200/math.pi*180*math.asin(math.sqrt(min(1,max(0,v))))


def feature_data(root,split):
    ids=[r['designation'] for r in split];index={name:i for i,name in enumerate(ids)}
    n=len(ids);x=np.full((n,28),np.nan);y=np.full(n,-1,dtype=np.int8)
    association={r['designation']:{k:r[k] for k in ('one_record_unshared','temporal_support','wise_ra','wise_dec','wise_separation_arcsec','malt90_records','fir_state','neowise_rows')} for r in table(root/'artifacts/multisurvey_association_compact_20261012/sources.csv.gz')}
    native=['']*n;flags=['']*n
    for r in table(root/'cache/higal360clump.csv'):
        if r['designation'] not in index:continue
        i=index[r['designation']]
        for k,key in enumerate(('mass','temp','dist','surf_dens','diam')):
            v=num(r[key])
            if math.isfinite(v) and v>0:x[i,k]=v if k==1 else math.log10(v)
    for r in table(root/'cache/higal360_fir.csv'):
        if r['designation'] not in index:continue
        i=index[r['designation']];flux=[]
        for key,err in (('f160','df160'),('f250','df250'),('fsc350',None),('fsc500',None)):
            v=num(r[key]);ok=math.isfinite(v) and v>0
            if err:ok=ok and math.isfinite(num(r[err])) and num(r[err])>0
            flux.append(math.log(v) if ok else math.nan)
        x[i,5:9]=flux
        for j in range(3):x[i,9+j]=flux[j]-flux[j+1]
    for r in table(root/'artifacts/e12b/allwise_features.csv.gz'):
        name=r['designation']
        if name not in index:continue
        a=association[name]
        if not a['wise_separation_arcsec'] or num(a['wise_separation_arcsec'])>3 or num(r['ext_flg'])!=0:continue
        f=r['cc_flags'];mags=[]
        for j in range(4):
            v=num(r[f'w{j+1}mpro']);snr=num(r[f'w{j+1}snr'])
            mags.append(v if math.isfinite(v) and math.isfinite(snr) and snr>=5 and len(f)==4 and f[j]=='0' else math.nan)
        i=index[name];x[i,12:15]=[mags[j]-mags[j+1] for j in range(3)];x[i,15]=mags[1]
    targets=[{k:r[k] for k in ('designation','ra','dec')} for r in table(root/'artifacts/e1_full/pilot_targets.csv')]
    measurements=defaultdict(set)
    for r in table(root/'artifacts/e1_full/neowise_rows_on.csv'):
        tid=int(r['tid']);assert str(tid)==r['tid'] and 0<=tid<len(targets)
        t=targets[tid];name=t['designation']
        assert all(math.isfinite(num(r[k])) and abs(num(r[k])-num(t[q]))<=1e-6 for k,q in (('t_ra','ra'),('t_dec','dec')))
        if association[name]['temporal_support']!='1':continue
        vals={k:num(r[k]) for k in ('ra','dec','mjd','w2mpro','w2sigmpro','w2snr','qual_frame','nb')}
        if not all(math.isfinite(v) for v in vals.values()):continue
        if not (0<=vals['ra']<360 and -90<=vals['dec']<=90 and vals['w2sigmpro']>0 and vals['w2snr']>=5 and vals['qual_frame']>0 and vals['nb']==1 and len(r['cc_flags'])==4 and r['cc_flags'][1]=='0'):continue
        a=association[name]
        if sep(a['wise_ra'],a['wise_dec'],r['ra'],r['dec'])>2:continue
        keys=[r[k] for k in ('mjd','ra','dec','w2mpro','w2sigmpro')];assert all('\x1f' not in k for k in keys)
        measurements[name].add('\x1f'.join(keys).encode())
    for name,keys in measurements.items():
        data=sorted((tuple(map(float,k.decode().split('\x1f'))) for k in keys),key=lambda v:v[0])
        visits=[]
        for v in data:
            if not visits or v[0]-visits[-1][-1][0]>30:visits.append([])
            visits[-1].append(v)
        vt,vm,vvar=[],[],[]
        for visit in visits:
            if len(visit)<5:continue
            arr=np.asarray(visit);w=1/arr[:,4]**2;sw=w.sum()
            vt.append(float(np.dot(w,arr[:,0])/sw));vm.append(float(np.dot(w,arr[:,3])/sw));vvar.append(float(1/sw+.03**2))
        assert len(vm)>=3 and data[-1][0]-data[0][0]>=365,name
        vt,vm,vvar=map(np.asarray,(vt,vm,vvar));w=1/vvar;mu=np.dot(w,vm)/w.sum();tbar=np.dot(w,vt)/w.sum()
        slope=np.dot(w*(vt-tbar),vm-mu)/np.dot(w,(vt-tbar)**2)*365.25
        x[index[name],16:20]=[mu,math.log1p(np.dot(w,(vm-mu)**2)/(len(vm)-1)),np.ptp(vm),slope]
    del measurements
    edge_native={}
    for r in table(root/'artifacts/multisurvey_association_compact_20261012/molecular_edges.csv.gz'):
        if r['in_parent']=='1' and association[r['designation']]['one_record_unshared']=='1':
            assert r['designation'] not in edge_native
            edge_native[r['designation']]=(int(r['malt90_source_row']),r['malt90_id'])
    row_to_name={row:name for name,(row,native_id) in edge_native.items()}
    assert len(row_to_name)==len(edge_native), 'Shared molecular record violates frozen isolation'
    for ordinal,r in enumerate(table(root/'cache/n1/malt90_rathborne2016.csv'),1):
        if ordinal not in row_to_name:continue
        name=row_to_name[ordinal];i=index[name];assert r['ID']==edge_native[name][1]
        native[i]=r['ID'];outcome=[r[k] for k in ('DHC3N','DHNCO404','DCH3CN','DSIO')];flags[i]='|'.join(outcome)
        if 'Y' in outcome:y[i]=1
        elif outcome==['N']*4:y[i]=0
        for j,line in enumerate(('HCOP','HNC','N2HP','HCN')):
            if num(r['NG'+line]) not in (1,2,3):continue
            value,error,width=map(num,(r['II'+line],r['e_II'+line],r['FWHM'+line]))
            if math.isfinite(value) and math.isfinite(error) and error>0:x[i,20+j*2]=math.asinh(value/error)
            if math.isfinite(width) and width>0:x[i,21+j*2]=math.log(width)
    return x,y,native,flags,association
