"""Pre-read scientific invariants, not observations or a model benchmark."""
import numpy as np
from multisurvey_missing_view_model import self_test
from multisurvey_missing_view_geometry import training_allowed,split_sources
from multisurvey_missing_view_data import sep
from run_multisurvey_missing_view import reviews
self_test()
assert abs(sep(359.9999,0,.0001,0)-.72)<1e-7
assert not training_allowed(359.5,4,0) and not training_allowed(10.5,1,0)
assert training_allowed(11.01,1,0) and not training_allowed(5,1,0)
ids=['a','b','c'];rows=[dict(designation=k,association_component=k,wise_ra='1' if k!='c' else '',wise_dec='2' if k!='c' else '') for k in ids]
s=split_sources(rows,dict(a=9.999,b=10.001,c=30.0));assert s[0]['group']==s[1]['group'] and s[0]['fold']==s[1]['fold']
select=reviews(np.array([1.,1.,1.]),np.array([0,0,0]),ids,np.ones(3,bool));assert select.tolist()==[True,False,False]
# Withheld proxy arrays are absent from representation/scaling function signatures.
import inspect
from multisurvey_missing_view_model import complete,robust_fit
assert 'y' not in inspect.signature(complete).parameters and 'y' not in inspect.signature(robust_fit).parameters
x=np.arange(24,dtype=float).reshape(8,3);mask=np.ones_like(x,bool)
c,b,_=complete(x,mask,np.ones(3));c2,b2,_=complete(x,mask,np.ones(3))
assert np.array_equal(c,c2) and np.array_equal(b,b2)
print('RA wrap, exact tie order, buffered boundary and shared-anchor split invariants passed')
