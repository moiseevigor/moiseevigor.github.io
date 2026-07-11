#!/usr/bin/env python3
"""P5-T3 -- fetch an HMI LOS sequence across the AR11158 flux-emergence day
(2011-02-13, the textbook emergence event), to hunt a forming null pair.

Best-effort VSO download into artifacts/hmi/seq/ (gitignored)."""
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "artifacts" / "hmi" / "seq"
OUT.mkdir(parents=True, exist_ok=True)

TIMES = ["2011/02/13 00:00", "2011/02/13 06:00", "2011/02/13 12:00",
         "2011/02/13 18:00", "2011/02/14 00:00"]


def main():
    from sunpy.net import Fido, attrs as a
    got = 0
    for t0 in TIMES:
        t1 = t0[:-5] + f"{int(t0[-5:-3]):02d}:{20}"
        try:
            q = Fido.search(a.Time(t0, t0[:11] + t0[11:13] + ":20"),
                            a.Instrument.hmi, a.Physobs.los_magnetic_field)
            tbl = q[0]
            idx = None
            for i, row in enumerate(tbl):
                fid = str(row["fileid"]).lower()
                if ("m_45s" in fid or "m_720s" in fid) and "err" not in fid \
                        and "map" not in fid:
                    idx = i
                    break
            if idx is None:
                print(f"{t0}: no plain magnetogram record")
                continue
            files = Fido.fetch(q[0, idx], path=str(OUT / "{file}"), progress=False)
            got += len(files)
            print(f"{t0}: fetched {[Path(f).name for f in files]}")
        except Exception as e:
            print(f"{t0}: FAILED {type(e).__name__}: {e}")
    print(f"total: {got}/{len(TIMES)}")
    return 0 if got >= 3 else 1


if __name__ == "__main__":
    sys.exit(main())
