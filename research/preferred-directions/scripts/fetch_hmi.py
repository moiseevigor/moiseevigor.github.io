#!/usr/bin/env python3
"""Attempt to fetch additional REAL SDO/HMI LOS magnetograms via VSO (R3 data leg).

Best-effort: any failure leaves the R3 gallery running on the sample magnetogram's
multiple active regions. Downloads land in artifacts/hmi/ (gitignored). Run under the
Bash tool's timeout; VSO can be slow or down.
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts" / "hmi"
OUT.mkdir(parents=True, exist_ok=True)

WANT = [("2012/03/07 00:00", "2012/03/07 00:20"),   # AR11429, X5.4-flare day
        ("2014/10/22 00:00", "2014/10/22 00:20")]   # AR12192, largest AR of cycle 24


def main():
    from sunpy.net import Fido, attrs as a
    got = []
    for t0, t1 in WANT:
        try:
            q = Fido.search(a.Time(t0, t1), a.Instrument.hmi,
                            a.Physobs.los_magnetic_field)
            n = sum(len(b) for b in q)
            print(f"{t0}: {n} records")
            if n == 0:
                continue
            files = Fido.fetch(q[0, 0], path=str(OUT / "{file}"), progress=False)
            got += list(files)
            print("  fetched:", [Path(f).name for f in files])
        except Exception as e:
            print(f"  FAILED {t0}: {type(e).__name__}: {e}")
    print(f"total fetched: {len(got)}")
    return 0 if got else 1


if __name__ == "__main__":
    sys.exit(main())
