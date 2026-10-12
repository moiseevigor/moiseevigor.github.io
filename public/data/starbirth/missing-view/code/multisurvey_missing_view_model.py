"""Frozen label-free completion plus supervised consumed-proxy rankers."""
import numpy as np
from scipy.optimize import minimize
from scipy.special import expit


def robust_fit(x):
    med=np.zeros(x.shape[1]);scale=np.ones(x.shape[1])
    for j in range(x.shape[1]):
        v=x[np.isfinite(x[:,j]),j]
        if len(v):
            med[j]=np.median(v);q=np.percentile(v,[25,75]);scale[j]=q[1]-q[0] if q[1]-q[0]>=1e-8 else 1
    return med,scale


def transform(x,med,scale):
    mask=np.isfinite(x);return np.where(mask,np.clip((x-med)/scale,-5,5),0),mask


def complete(z,mask,weights):
    observed=z*weights;filled=observed.copy();rank=min(6,z.shape[1])
    for _ in range(20):
        center=filled.mean(axis=0);u,s,vt=np.linalg.svd(filled-center,full_matrices=False)
        reconstructed=(u[:,:rank]*s[:rank])@vt[:rank]+center
        filled=np.where(mask,observed,np.clip(reconstructed,-5*weights,5*weights))
    center=filled.mean(axis=0);_,s,vt=np.linalg.svd(filled-center,full_matrices=False)
    basis=vt[:rank];return center,basis,s[:rank]


def encode(z,mask,weights,center,basis):
    result=np.zeros((len(z),len(basis)))
    for i in range(len(z)):
        b=basis[:,mask[i]];observed=z[i,mask[i]]*weights[mask[i]]-center[mask[i]]
        result[i]=np.linalg.solve(b@b.T+.01*np.eye(len(basis)),b@observed)
    return result


def class_weights(y):
    n=len(y);return np.where(y==1,n/(2*np.sum(y==1)),n/(2*np.sum(y==0)))


def logistic(a,y):
    w=class_weights(y);n=len(y)
    def objective(beta):
        t=beta[0]+a@beta[1:];loss=np.dot(w,np.logaddexp(0,t)-y*t)/n+.025*np.dot(beta[1:],beta[1:])
        residual=w*(expit(t)-y)/n
        grad=np.r_[residual.sum(),a.T@residual+.05*beta[1:]]
        return loss,grad
    opt=minimize(objective,np.zeros(a.shape[1]+1),jac=True,method='L-BFGS-B',options={'maxiter':300,'gtol':1e-7,'ftol':1e-12})
    gradient=np.max(np.abs(objective(opt.x)[1]));assert opt.success or gradient<=1e-4,(opt.message,gradient)
    return opt.x,gradient


def squared(a,b):
    return np.maximum(0,np.sum(a*a,axis=1)[:,None]+np.sum(b*b,axis=1)[None,:]-2*a@b.T)


def kernel(a,y):
    d=squared(a,a);positive=d[d>1e-12];sigma2=np.median(positive) if len(positive) else 1
    k=np.exp(-d/(2*sigma2));w=class_weights(y)
    alpha=np.linalg.solve(k+np.diag(1/w),2*y-1)
    return alpha,float(sigma2)


def predict_kernel(a,train,alpha,sigma2):
    return np.exp(-squared(a,train)/(2*sigma2))@alpha


def self_test():
    x=np.array([[1.,np.nan,3.],[2.,4.,5.],[3.,6.,7.],[4.,8.,9.]])
    med,scale=robust_fit(x);z,mask=transform(x,med,scale)
    c,b,s=complete(z,mask,np.ones(3));e=encode(z,mask,np.ones(3),c,b)
    assert np.isfinite(e).all() and np.isfinite(encode(np.zeros((1,3)),np.zeros((1,3),bool),np.ones(3),c,b)).all()
    assert not mask[0,1] and z[0,1]==0
    a=np.array([[-2.],[-1.],[1.],[2.]]);y=np.array([0,0,1,1]);beta,g=logistic(a,y)
    assert beta[1]>0 and g<1e-4
    alpha,sig=kernel(a,y);assert predict_kernel(a,a,alpha,sig)[0]<predict_kernel(a,a,alpha,sig)[-1]
    print('Synthetic missingness, zero-observation encoding and solver checks passed')
