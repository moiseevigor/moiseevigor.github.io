"""Reproduce the blog figures and counts. Requires numpy and matplotlib.
Run: MPLCONFIGDIR=/tmp/mpl python prime_spirals.py --output figures
"""
from pathlib import Path
import argparse
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image  # ships with matplotlib

def sieve(limit):
    result = np.ones(limit + 1, dtype=bool)
    result[:2] = False
    for d in range(2, int(limit ** .5) + 1):
        if result[d]:
            result[d*d::d] = False
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='figures')
    args = parser.parse_args()
    output = Path(args.output)
    output.mkdir(parents=True, exist_ok=True)
    n = np.arange(1, 6001)
    mask = sieve(6000)[1:]
    beta = 1 / ((1 + np.sqrt(5)) / 2) ** 2
    r = np.sqrt(n)
    # Transparent ground and mid-range plasma (no pale yellow, no near-black
    # purple), so the same PNG reads on the light and the dark page theme.
    cmap = matplotlib.colors.ListedColormap(plt.get_cmap('plasma')(np.linspace(.25, .85, 256)))
    for mode in ('sunflower', 'prime-sunflower', 'sacks'):
        theta = 2*np.pi*(r if mode == 'sacks' else beta*n)
        x, y = r*np.cos(theta), r*np.sin(theta)
        fig, ax = plt.subplots(figsize=(6, 6))
        ax.set_aspect('equal')
        ax.axis('off')
        if mode != 'sunflower':
            ax.scatter(x, y, s=4, c='#8c8a99', alpha=.35, linewidths=0)
            ax.scatter(x[mask], y[mask], s=11, c=n[mask], cmap=cmap, linewidths=0)
        else:
            ax.scatter(x, y, s=7, c=n, cmap=cmap, linewidths=0)
        fig.tight_layout(pad=.2)
        path = output / (mode + '.png')
        fig.savefig(path, dpi=150, transparent=True)
        plt.close(fig)
        # 256-colour palette keeps the transparent PNG near its opaque size.
        Image.open(path).convert('RGBA').quantize(256, method=Image.FASTOCTREE).save(path, optimize=True)
    # Card thumbnail: primes only, large dots, so the spiral survives at ~160px.
    theta = 2*np.pi*r
    fig, ax = plt.subplots(figsize=(4, 4))
    ax.set_aspect('equal')
    ax.axis('off')
    ax.scatter((r*np.cos(theta))[mask], (r*np.sin(theta))[mask], s=9, c=n[mask], cmap=cmap, linewidths=0)
    fig.tight_layout(pad=.1)
    path = output / 'thumb.png'
    fig.savefig(path, dpi=100, transparent=True)
    plt.close(fig)
    Image.open(path).convert('RGBA').quantize(256, method=Image.FASTOCTREE).save(path, optimize=True)
    s = sieve(1_000_042)
    k = np.arange(1000)
    for name, values in [('k^2+k', k*k+k), ('k^2+1', k*k+1),
                         ('k^2+k+41', k*k+k+41)]:
        count = int(s[values].sum())
        print(f'{name}: {count}/1000 prime values')
    counts = [int(s[v].sum()) for v in (k*k+k, k*k+1, k*k+k+41)]
    assert counts == [1, 112, 581]
    # Independently check the finite table by trial division.
    def trial_prime(v):
        return v >= 2 and all(v % d for d in range(2, int(v**.5)+1))
    for values, expected in zip((k*k+k, k*k+1, k*k+k+41), counts):
        assert sum(trial_prime(int(v)) for v in values) == expected
    for q in (2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37):
        assert all((a*a+a+41) % q for a in range(q))
    assert all(trial_prime(k*k+k+41) for k in range(40))
    assert 40*40+40+41 == 41**2
    assert mask.sum() == 783
    print('All arithmetic checks passed.')

if __name__ == '__main__':
    main()
