#!/usr/bin/env python3
"""Fetch HMI m_45s magnetograms matching the 16 AIA flare frames (2012-03-07
00:00-01:30, 6-min cadence) so the flare GIF skeleton can EVOLVE in time.
Best-effort VSO download into artifacts/hmi/hmi_seq/ (gitignored)."""
import sys
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "artifacts" / "hmi" / "hmi_seq"
OUT.mkdir(parents=True, exist_ok=True)

TIMES = [f"2012/03/07 {6*k//60:02d}:{6*k%60:02d}" for k in range(16)]


def main():
    from sunpy.net import Fido, attrs as a
    got = 0
    from datetime import datetime, timedelta
    for t0 in TIMES:
        dt0 = datetime.strptime(t0, "%Y/%m/%d %H:%M")
        t1 = (dt0 + timedelta(minutes=2)).strftime("%Y/%m/%d %H:%M")
        try:
            q = Fido.search(a.Time(t0, t1),
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
