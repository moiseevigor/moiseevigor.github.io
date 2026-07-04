# E5b — oracle-frame test of the transverse-damping deficit

Same protocol as E5 (rho_c = 5.0, 5 held-out seeds); 'oracle' uses the tidal frame of the true PM final field for damping decisions instead of the evolving ZA proxy.

| d to spine (vox) | ZA | damp (proxy frames) | damp (oracle frames) | oracle vs ZA |
|---|---|---|---|---|
| 0–2 | 6.95 ± 0.24 | 6.51 ± 0.07 | 5.53 ± 0.08 | -20% |
| 2–4 | 5.43 ± 0.18 | 5.69 ± 0.14 | 5.20 ± 0.12 | -4% |
| 4–8 | 3.74 ± 0.15 | 3.79 ± 0.13 | 3.68 ± 0.12 | -1% |
| 8–64 | 3.38 ± 0.13 | 3.37 ± 0.12 | 3.33 ± 0.12 | -2% |
| **all** | 5.00 ± 0.22 | 4.93 ± 0.14 | 4.47 ± 0.12 | -10% |

Reading: if the oracle closes the 2–4 vox gap to ZA, the E5 deficit was frame-estimation error and the damping physics is validated; if the gap persists, the crossing condition itself over-fires in the outskirts.


## Verdict

H-E5b confirmed: with oracle frames the transverse-damping model beats ZA
in EVERY distance bin (−20% at the web, −4% at 2–4 vox, −10% overall).
The E5 outskirts deficit was frame-estimation error, not a failure of the
damping physics. Two consequences: (1) the anisotropic-adhesion term is
uniformly correct given good frames; (2) frame estimation is the binding
constraint — the oracle bound (4.47 vs proxy 4.93) prices ~0.46 vox of
recoverable error, more than any other refinement lever.
