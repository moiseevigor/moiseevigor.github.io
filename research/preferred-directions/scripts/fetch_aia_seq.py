#!/usr/bin/env python3
"""Fetch an SDO/AIA 171 A sequence across the X5.4 flare of 2012-03-07
(onset 00:02, peak ~00:24 UT; a second X1.3 at ~01:14) for the flare GIF.
32 frames (00:00-03:06), 6-minute cadence, into artifacts/hmi/aia_seq/
(gitignored). Skips frames already on disk."""
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "artifacts" / "hmi" / "aia_seq"
OUT.mkdir(parents=True, exist_ok=True)


def main():
    import astropy.units as u
    from sunpy.net import Fido, attrs as a
    got = 0
    for k in range(32):
        m = 6 * k
        t0 = f"2012/03/07 {m // 60:02d}:{m % 60:02d}"
        t1 = f"2012/03/07 {m // 60:02d}:{m % 60 + 1:02d}"
        if any(OUT.glob(f"*171A_2012_03_07T{m // 60:02d}_{m % 60:02d}*")):
            got += 1
            continue
        try:
            q = Fido.search(a.Time(t0, t1), a.Instrument.aia,
                            a.Wavelength(171 * u.angstrom))
            if sum(len(b) for b in q) == 0:
                print(f"{t0}: none")
                continue
            files = Fido.fetch(q[0, 0], path=str(OUT / "{file}"), progress=False)
            got += len(files)
            print(f"{t0}: {Path(files[0]).name if files else 'fail'}")
        except Exception as e:
            print(f"{t0}: FAILED {type(e).__name__}")
    print(f"total {got}/32")
    return 0 if got >= 24 else 1


if __name__ == "__main__":
    sys.exit(main())
