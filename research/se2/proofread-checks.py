"""Bounded, independent checks of the SE(2) web equations.
Requires NumPy, SciPy, SymPy and mpmath. Run from the repository root.
These checks are not an interval certificate or a complete proof audit.
"""
import json
import subprocess
from pathlib import Path
import numpy as np
import sympy as sp
import mpmath as mp
from scipy.integrate import solve_ivp
from scipy.special import ellipj

root = Path(__file__).resolve().parents[2]
# Exact algebra, independent of the browser inverse implementation.
z, C, D = sp.symbols('z C D', real=True, nonzero=True)
H = 1 + z*z
U = C*C + D*D - z*z
f, g = U/(2*C*sp.sqrt(H)), (D*D-z*z-C*C)/(2*C*sp.sqrt(H))
m = (z*z+(U/(2*C))**2)/H
identities = [f-g-C/sp.sqrt(H), f*f-g*g-(D*D-z*z)/H,
              f*f+z*z/H-m, g*g+D*D/H-m,
              m-1-(U-2*C)*(U+2*C)/(4*C*C*H)]
assert all(sp.simplify(v) == 0 for v in identities)
# Get predictions, then test them through a separate Hamiltonian/variational ODE.
js = r"""
import * as M from './public/js/se2/se2math.js';
const records=[];
for (const k of [.25,.75,.97]) for (const phase of [0,.6,1,1.8]) {
 const c=M.cellData(k,1),psi=phase*c.K;
 const p=M.conjugateTimes(psi,k,c.p1+1e-5,3200).find(p=>p>=c.p0-1e-7);
 if(p===undefined) throw Error('Missing first root');
 const t=2*k*p;
 records.push({k,psi,t,q:M.expC2(psi,k,t)});
}
const inverse=M.rotatingSources(-1,-2,-.9,400,40).map(s=>({...s,q:{x:-1,y:-2,theta:-.9}}));
for(const theta of [.7,-.7]) { const a=theta/2,x=1.45*Math.sin(a),y=-1.45*Math.cos(a);
 inverse.push(...M.rotatingSources(x,y,theta,400,40).map(s=>({...s,q:{x,y,theta}}))); }
console.log(JSON.stringify({records,inverse}));
"""
fixtures = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=root, text=True))

def rhs(_, y):
    gamma, c, x, yy, theta = y[:5]
    sh, ch = np.sin(gamma/2), np.cos(gamma/2)
    st, ct = np.sin(theta), np.cos(theta)
    velocity = np.array([c, -np.sin(gamma), sh*ct, sh*st, -ch])
    jac = np.zeros((5,5))
    jac[0,1] = 1
    jac[1,0] = -np.cos(gamma)
    jac[2,0], jac[2,4] = .5*ch*ct, -sh*st
    jac[3,0], jac[3,4] = .5*ch*st, sh*ct
    jac[4,0] = .5*sh
    return np.r_[velocity, (jac@y[5:].reshape(5,2)).ravel()]

worst_endpoint, worst_det = 0., 0.
for row in fixtures['records'] + fixtures['inverse']:
    k, psi, t = row['k'], row['psi'], row['t']
    sn, cn, dn, _ = ellipj(psi, k*k)
    eps = row.get('eps', 1)
    initial = np.r_[[2*np.arctan2(eps*sn, cn), 2*eps*dn/k, 0, 0, 0], np.eye(5,2).ravel()]
    sol = solve_ivp(rhs, (0,t), initial, method='DOP853', rtol=2e-12, atol=2e-14)
    assert sol.success
    end = sol.y[:,-1]
    q = row['q']
    error = max(abs(end[2]-q['x']), abs(end[3]-q['y']), abs(np.angle(np.exp(1j*(end[4]-q['theta'])))))
    assert error < 2e-8, (row, error)
    worst_endpoint = max(worst_endpoint, error)
    if row in fixtures['records']:
        sens = end[5:].reshape(5,2)[2:]
        velocity = rhs(t,end)[2:5]
        columns = np.column_stack([sens, velocity])
        singular_values = np.linalg.svd(columns, compute_uv=False)
        normalized_det = singular_values[-1]/singular_values[0]
        assert normalized_det < 2e-8, (row,normalized_det)
        worst_det = max(worst_det, normalized_det)
# Critical modulus and fourth-order contact, with 80-digit arithmetic.
mp.mp.dps = 80
m0 = mp.findroot(lambda v: mp.ellipk(v)-2*mp.ellipe(v), (.82,.83))
K, E = mp.ellipk(m0), mp.ellipe(m0)
expected = (1-m0)/3
quartic_errors=[]
for n in [1,2,4]:
    sigma=mp.mpf('1e-6')
    p=2*n*K+sigma
    e=2*n*E+mp.quad(lambda u: mp.ellipfun('dn',u,m0)**2,[0,sigma])
    sn,cn,dn=[mp.ellipfun(fn,p,m0) for fn in ['sn','cn','dn']]
    alpha1=cn*dn*(p-2*e)+sn*(dn*dn+e*(p-e))
    alpha=(1-m0)*sn*alpha1
    beta=(cn*(e-p)-dn*sn)*(cn*e-dn*sn)
    tau=K+p
    J=alpha*mp.ellipfun('sn',tau,m0)**2+beta*mp.ellipfun('cn',tau,m0)**2
    error=abs(J/sigma**4-expected)
    assert error < mp.mpf('1e-10'), (n, float(J/sigma**4), float(expected), float(error))
    quartic_errors.append(float(error))
result = dict(exact_algebra_identities=len(identities), ode_conjugate_cases=len(fixtures['records']),
              ode_inverse_sources=len(fixtures['inverse']), maximum_endpoint_error=worst_endpoint,
              maximum_conjugate_singular_value_ratio=worst_det, critical_modulus=float(mp.sqrt(m0)),
              quartic_cells=[1,2,4], maximum_quartic_coefficient_error=max(quartic_errors),
              scope='Web equations only; bounded independent checks, not full proof certification')
print(json.dumps(result,indent=2))
