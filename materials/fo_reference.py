"""Independent reference for the modelled pool on the attention bench (session 4).

Re-implements assets/fo-live.js PART 2 from the written model, not by translation of the UI:
a mulberry32 generator, 200 synthetic participants, the time-on-task drift f = s*t/(t+6),
banner disruption for 4 trials, an 80 percent restore at a break, windows of the first and last
fifth of trials, and a Pearson test-retest correlation across two seeded runs.
Only + - * / and sqrt are used, so node and Python must agree exactly.
Run: python3 materials/fo_reference.py   (prints the canon as sorted JSON)
"""
import json, math

M32 = 0xFFFFFFFF
SQRT3 = 1.7320508075688772
P = dict(N=200, SEED=20261012, SOA=1150, H=6, GAP_MIN=12, GAP_SPAN=16, DISRUPT=4, RESTORE=0.8, WIN=0.2)


def imul(a, b):
    return (a * b) & M32


def mulberry32(seed):
    st = [seed & M32]

    def r():
        st[0] = (st[0] + 0x6D2B79F5) & M32
        a = st[0]
        t = imul(a ^ (a >> 15), 1 | a)
        t = ((t + imul(t ^ (t >> 7), 61 | t)) & M32) ^ t
        return ((t ^ (t >> 14)) & M32) / 4294967296
    return r


def clamp(x, lo, hi):
    return lo if x < lo else hi if x > hi else x


def z12(r):
    s = 0.0
    for _ in range(12):
        s += r()
    return s - 6


def pool():
    r = mulberry32(P["SEED"])
    out = []
    for _ in range(P["N"]):
        rt0 = clamp(400 + 45 * z12(r), 280, 600)
        cv0 = clamp(0.17 + 0.04 * z12(r), 0.08, 0.32)
        p0 = clamp(0.22 + 0.10 * z12(r), 0.03, 0.6)
        s = clamp(0.55 + 0.22 * z12(r), 0.05, 1.2)
        out.append(dict(rt0=rt0, cv0=cv0, p0=p0, s=s))
    return out


def n_trials(minutes):
    return math.floor(minutes * 60000 / P["SOA"] + 0.5)


def simulate(pp, i, run, blocks):
    r = mulberry32(P["SEED"] + 7919 * (i + 1) + 104729 * (run + 1))
    trials, teff = [], 0.0
    for b, bl in enumerate(blocks):
        n = n_trials(bl["min"])
        if b > 0:
            teff = teff * (1 - P["RESTORE"])
        next_banner = P["GAP_MIN"] + P["GAP_SPAN"] * r()
        since = 99
        for k in range(n):
            tsec = k * P["SOA"] / 1000
            if tsec >= next_banner:
                since = 0
                next_banner += P["GAP_MIN"] + P["GAP_SPAN"] * r()
            dis = bl["banners"] and since < P["DISRUPT"]
            f = pp["s"] * teff / (teff + P["H"])
            uD = r(); uR = r()
            zz = (r() + r() + r() + r() - 2) * SQRT3
            digit = 1 + math.floor(9 * uD)
            pc = min(0.95, pp["p0"] + 0.30 * f + (0.20 if dis else 0))
            if digit == 3:
                t = (True, uR < pc, None)
            else:
                q = min(0.9, 0.01 + 0.08 * f + (0.10 if dis else 0))
                if uR < q:
                    t = (False, False, None)
                else:
                    cv = pp["cv0"] * (1 + 0.9 * f) * (1.5 if dis else 1)
                    t = (False, True, max(150, pp["rt0"] * (1 - 0.05 * f) * (1 + cv * zz)))
            trials.append(t + (pc,))
            since += 1
            teff += P["SOA"] / 60000
    return trials


def score(trials):
    nogo = go = com = om = 0
    rts = []
    for ng, pr, rt, _pe in trials:
        if ng:
            nogo += 1
            com += 1 if pr else 0
        else:
            go += 1
            if not pr:
                om += 1
            else:
                rts.append(rt)
    m = 0.0
    for x in rts:
        m += x
    m = m / len(rts) if rts else 0
    sd = 0.0
    for x in rts:
        sd += (x - m) * (x - m)
    sd = math.sqrt(sd / (len(rts) - 1)) if len(rts) > 1 else 0
    return dict(nogo=nogo, go=go, com=com, om=om, comPct=100 * com / nogo if nogo else 0,
                omPct=100 * om / go if go else 0, meanRT=m, cv=sd / m if m else 0)


def window(runs, lo_f, hi_f):
    sel = []
    for tr in runs:
        n = len(tr)
        sel.extend(tr[math.floor(n * lo_f):math.floor(n * hi_f)])
    return score(sel)


def built_in(runs):
    lo = hi = 0.0
    nlo = nhi = 0
    for tr in runs:
        n = len(tr)
        a, b = math.floor(n * P["WIN"]), math.floor(n * (1 - P["WIN"]))
        for t in tr[:a]:
            lo += t[3]; nlo += 1
        for t in tr[b:]:
            hi += t[3]; nhi += 1
    return 100 * (hi / nhi - lo / nlo)


def pearson(a, b):
    n = len(a)
    ma = mb = 0.0
    for i in range(n):
        ma += a[i]; mb += b[i]
    ma /= n; mb /= n
    sab = saa = sbb = 0.0
    for j in range(n):
        sab += (a[j] - ma) * (b[j] - mb); saa += (a[j] - ma) * (a[j] - ma); sbb += (b[j] - mb) * (b[j] - mb)
    return sab / math.sqrt(saa * sbb) if saa and sbb else 0


PRESETS = {
    "b3": [dict(min=3, banners=False)],
    "b10": [dict(min=10, banners=False)],
    "b20": [dict(min=20, banners=False)],
    "brk": [dict(min=5, banners=False), dict(min=5, banners=False)],
    "ban": [dict(min=10, banners=True)],
    "s30": [dict(min=0.5, banners=False)],
}


def run_blocks(blocks):
    pp = pool()
    runA, a, b = [], [], []
    for i, p in enumerate(pp):
        ta = simulate(p, i, 0, blocks)
        tb = simulate(p, i, 1, blocks)
        runA.append(ta)
        a.append(score(ta)["comPct"]); b.append(score(tb)["comPct"])
    first, last = window(runA, 0, P["WIN"]), window(runA, 1 - P["WIN"], 1)
    nogo_each = sum(score(t)["nogo"] for t in runA) / len(runA)
    return dict(builtIn=built_in(runA), trials=len(runA[0]), nogoPerPerson=nogo_each, firstCom=first["comPct"], lastCom=last["comPct"],
                decrement=last["comPct"] - first["comPct"], firstCV=first["cv"], lastCV=last["cv"],
                lastOm=last["omPct"], retest=pearson(a, b))


if __name__ == "__main__":
    r4 = lambda x: round(x, 4) if isinstance(x, float) else x
    out = {k: {kk: r4(vv) for kk, vv in run_blocks(v).items()} for k, v in PRESETS.items()}
    print(json.dumps(out, indent=1, sort_keys=True))
