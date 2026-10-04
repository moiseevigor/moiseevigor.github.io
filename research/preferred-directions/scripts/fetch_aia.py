#!/usr/bin/env python3
"""Fetch a real SDO/AIA 171 A EUV image of AR11429 (2012-03-07, the skeleton's day)
via VSO, into artifacts/hmi/ (gitignored). Best-effort, like fetch_hmi.py."""
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "artifacts" / "hmi"
OUT.mkdir(parents=True, exist_ok=True)


def main():
    import astropy.units as u
    from sunpy.net import Fido, attrs as a
    q = Fido.search(a.Time("2012/03/07 00:00", "2012/03/07 00:06"),
                    a.Instrument.aia, a.Wavelength(171 * u.angstrom))
    n = sum(len(b) for b in q)
    print(f"records: {n}")
    if n == 0:
        return 1
    files = Fido.fetch(q[0, 0], path=str(OUT / "{file}"), progress=False)
    print("fetched:", [Path(f).name for f in files])
    return 0 if files else 1


if __name__ == "__main__":
    sys.exit(main())
