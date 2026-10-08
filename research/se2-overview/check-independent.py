"""Check reduced pendulum motion against canonical Hamilton equations (SciPy)."""
import json,sys
from pathlib import Path
import numpy as np
from scipy.integrate import solve_ivp
import sympy as s
th,px,py,h2=s.symbols('theta px py h2',real=True)
h1=px*s.cos(th)+py*s.sin(th);h3=px*s.sin(th)-py*s.cos(th)
assert s.simplify(s.diff(h1,th)*h2+h2*h3)==0
assert s.simplify(-s.diff((h1*h1+h2*h2)/2,th)-h1*h3)==0
assert s.simplify(s.diff(h3,th)*h2-h1*h2)==0
worst=0;cases=0
for row in json.loads((Path(sys.argv[1]) if len(sys.argv)>1 else Path(__file__).with_name('canonical-fixtures.json')).read_text()):
 px0=np.sin(row['gamma']/2);py0=-row['c']/2;pt0=-np.cos(row['gamma']/2)
 def rhs(t,q):
  x,y,theta,pt=q;h=px0*np.cos(theta)+py0*np.sin(theta)
  return [h*np.cos(theta),h*np.sin(theta),pt,h*(px0*np.sin(theta)-py0*np.cos(theta))]
 sol=solve_ivp(rhs,[0,row['time']],[0,0,0,pt0],method='DOP853',rtol=2e-13,atol=2e-14)
 assert sol.success
 expected=np.array(row['v'][2:]);actual=sol.y[:3,-1]
 residual=np.linalg.norm(expected-actual);assert residual<2e-9
 worst=max(worst,residual);cases+=1
print(json.dumps({'independent_canonical_ODE_cases':cases,'max_pose_error':worst,'symbolic_Hamiltonian_identities':3}))
