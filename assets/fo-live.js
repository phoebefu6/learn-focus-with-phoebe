/* fo-live.js - the attention bench for learn-focus-with-phoebe (session 4)
 *
 * Two parts, both computed in this browser.
 *
 * PART 1, MEASURED ON YOU. A sustained-attention go/no-go task in the style of the SART
 *   (Robertson, Manly, Andrade, Baddeley and Yiend 1997): digits 1 to 9, press for every digit
 *   except 3. Timing as in Seli, Jonker, Cheyne and Smilek (2013): the digit shows for 250 ms,
 *   then a circled-x mask for 900 ms, 1150 ms a trial whether you press or not; five digit sizes.
 *   Four steps: baseline block -> block with simulated chat banners -> a 2-minute break ->
 *   block with the banners muted. Per block the page prints your mean reaction time (go trials),
 *   its coefficient of variation (SD / mean), commission errors (presses on a 3) and omission
 *   errors (missed presses on other digits). Timing uses performance.now(). Results stay in this
 *   browser (localStorage) and nowhere else.
 *
 * PART 2, MODELLED, and labelled so on the widget. A seeded pool of 200 synthetic participants,
 *   each with a starting reaction time, variability, commission tendency and a susceptibility s
 *   to time on task. With t = minutes on task and f = s * t / (t + 6):
 *     no-go: P(commission) = min(.95, p0 + .30 f + .20 if a banner arrived in the last 4 trials)
 *     go:    P(omission)   = min(.90, .01 + .08 f + .10 if disrupted)
 *            RT = rt0 (1 - .05 f) (1 + cv z), cv = cv0 (1 + .9 f) (x1.5 if disrupted), z ~ Irwin-Hall
 *   A 2-minute break gives back 80 percent of the time on task. Banner gaps are 12 to 28 seconds.
 *   Settings are illustrative and fitted to nobody: only the direction of each change is claimed.
 *   The model uses + - * / and sqrt only, so materials/fo_reference.py reproduces it exactly.
 */
(function (root) {
  "use strict";

  /* ---------- shared: seeded generator and scoring ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var SQRT3 = 1.7320508075688772;

  /* trials: [{nogo: bool, pressed: bool, rt: ms or null}] */
  function score(trials) {
    var nogo = 0, go = 0, com = 0, om = 0, rts = [];
    for (var i = 0; i < trials.length; i++) {
      var t = trials[i];
      if (t.nogo) { nogo++; if (t.pressed) com++; }
      else { go++; if (!t.pressed) om++; else rts.push(t.rt); }
    }
    var m = 0, sd = 0;
    for (var j = 0; j < rts.length; j++) m += rts[j];
    m = rts.length ? m / rts.length : 0;
    for (var k = 0; k < rts.length; k++) sd += (rts[k] - m) * (rts[k] - m);
    sd = rts.length > 1 ? Math.sqrt(sd / (rts.length - 1)) : 0;
    return { n: trials.length, nogo: nogo, go: go, com: com, om: om,
             comPct: nogo ? 100 * com / nogo : 0, omPct: go ? 100 * om / go : 0,
             meanRT: m, sdRT: sd, cv: m ? sd / m : 0 };
  }

  /* ---------- PART 2: the modelled pool (mirrors materials/fo_reference.py) ---------- */
  var P = { N: 200, SEED: 20261012, SOA: 1150, H: 6, GAP_MIN: 12, GAP_SPAN: 16, DISRUPT: 4,
            RESTORE: 0.8, WIN: 0.2 };

  function clamp(x, lo, hi) { return x < lo ? lo : x > hi ? hi : x; }
  function z12(r) { var s = 0; for (var i = 0; i < 12; i++) s += r(); return s - 6; }

  var _pool = null;
  function pool() {
    if (_pool) return _pool;
    var r = mulberry32(P.SEED), out = [];
    for (var i = 0; i < P.N; i++) {
      out.push({ rt0: clamp(400 + 45 * z12(r), 280, 600), cv0: clamp(0.17 + 0.04 * z12(r), 0.08, 0.32),
                 p0: clamp(0.22 + 0.10 * z12(r), 0.03, 0.6), s: clamp(0.55 + 0.22 * z12(r), 0.05, 1.2) });
    }
    _pool = out;
    return out;
  }

  function nTrials(min) { return Math.floor(min * 60000 / P.SOA + 0.5); }

  /* one synthetic participant, one run, a list of blocks; a break sits between consecutive blocks */
  function simulate(pp, i, run, blocks) {
    var r = mulberry32(P.SEED + 7919 * (i + 1) + 104729 * (run + 1));
    var trials = [], teff = 0;
    for (var b = 0; b < blocks.length; b++) {
      var bl = blocks[b], n = nTrials(bl.min);
      if (b > 0) teff = teff * (1 - P.RESTORE);
      var nextBanner = P.GAP_MIN + P.GAP_SPAN * r(), since = 99;
      for (var k = 0; k < n; k++) {
        var tsec = k * P.SOA / 1000;
        if (tsec >= nextBanner) { since = 0; nextBanner += P.GAP_MIN + P.GAP_SPAN * r(); }
        var dis = bl.banners && since < P.DISRUPT;
        var f = pp.s * teff / (teff + P.H);
        var uD = r(), uR = r(), zz = (r() + r() + r() + r() - 2) * SQRT3;
        var digit = 1 + Math.floor(9 * uD), t;
        var pc = Math.min(0.95, pp.p0 + 0.30 * f + (dis ? 0.20 : 0));
        if (digit === 3) {
          t = { nogo: true, pressed: uR < pc, rt: null };
        } else {
          var q = Math.min(0.9, 0.01 + 0.08 * f + (dis ? 0.10 : 0));
          if (uR < q) t = { nogo: false, pressed: false, rt: null };
          else {
            var cv = pp.cv0 * (1 + 0.9 * f) * (dis ? 1.5 : 1);
            t = { nogo: false, pressed: true, rt: Math.max(150, pp.rt0 * (1 - 0.05 * f) * (1 + cv * zz)) };
          }
        }
        t.block = b; t.pe = pc;
        trials.push(t);
        since++;
        teff += P.SOA / 60000;
      }
    }
    return trials;
  }

  function pearson(a, b) {
    var n = a.length, ma = 0, mb = 0, sab = 0, saa = 0, sbb = 0;
    for (var i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
    ma /= n; mb /= n;
    for (var j = 0; j < n; j++) { sab += (a[j] - ma) * (b[j] - mb); saa += (a[j] - ma) * (a[j] - ma); sbb += (b[j] - mb) * (b[j] - mb); }
    return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
  }

  var PRESETS = [
    { id: "b3", label: "One 3-minute block", blocks: [{ min: 3, banners: false }], note: "The length of each block you just ran." },
    { id: "b10", label: "One 10-minute block", blocks: [{ min: 10, banners: false }], note: "Same task, more time on it." },
    { id: "b20", label: "One 20-minute block", blocks: [{ min: 20, banners: false }], note: "Roughly a stand-up and a half." },
    { id: "brk", label: "Two 5-minute blocks, 2-minute break", blocks: [{ min: 5, banners: false }, { min: 5, banners: false }], note: "Ten minutes of task, split, with a pause between." },
    { id: "ban", label: "10 minutes with chat banners on", blocks: [{ min: 10, banners: true }], anti: true, note: "Anti-lever: a banner every 12 to 28 seconds, never answered." },
    { id: "s30", label: "Break it: a 30-second task", blocks: [{ min: 0.5, banners: false }], brk: true, note: "Break button: about 26 trials, 3 of them no-go." }
  ];
  function preset(id) { for (var i = 0; i < PRESETS.length; i++) if (PRESETS[i].id === id) return PRESETS[i]; return null; }

  /* the drift the model builds in: mean expected commission probability, last fifth minus first */
  function builtIn(allRuns) {
    var lo = 0, nlo = 0, hi = 0, nhi = 0;
    for (var i = 0; i < allRuns.length; i++) {
      var tr = allRuns[i], n = tr.length, a = Math.floor(n * P.WIN), b = Math.floor(n * (1 - P.WIN));
      for (var k = 0; k < a; k++) { lo += tr[k].pe; nlo++; }
      for (var k2 = b; k2 < n; k2++) { hi += tr[k2].pe; nhi++; }
    }
    return 100 * (hi / nhi - lo / nlo);
  }

  function windowStats(allRuns, from, to) {
    var sel = [];
    for (var i = 0; i < allRuns.length; i++) {
      var tr = allRuns[i], n = tr.length, lo = Math.floor(n * from), hi = Math.floor(n * to);
      for (var k = lo; k < hi; k++) sel.push(tr[k]);
    }
    return score(sel);
  }

  /* per-minute pooled commission rate for the chart */
  function perMinute(allRuns) {
    var perMin = Math.floor(60000 / P.SOA + 0.5), out = [];
    var n = allRuns[0].length, bins = Math.ceil(n / perMin);
    for (var b = 0; b < bins; b++) {
      var sel = [];
      for (var i = 0; i < allRuns.length; i++) for (var k = b * perMin; k < Math.min(n, (b + 1) * perMin); k++) sel.push(allRuns[i][k]);
      out.push(score(sel).comPct);
    }
    return out;
  }

  var _cache = {};
  function runBlocks(blocks) {
    var key = JSON.stringify(blocks);
    if (_cache[key]) return _cache[key];
    var pp = pool(), runA = [], runB = [], a = [], b = [];
    for (var i = 0; i < pp.length; i++) {
      var ta = simulate(pp[i], i, 0, blocks), tb = simulate(pp[i], i, 1, blocks);
      runA.push(ta); runB.push(tb);
      a.push(score(ta).comPct); b.push(score(tb).comPct);
    }
    var first = windowStats(runA, 0, P.WIN), last = windowStats(runA, 1 - P.WIN, 1), all = windowStats(runA, 0, 1);
    var nogoEach = 0;
    for (var j = 0; j < runA.length; j++) nogoEach += score(runA[j]).nogo;
    var res = { trials: runA[0].length, nogoPerPerson: nogoEach / runA.length,
                builtIn: builtIn(runA), firstCom: first.comPct, lastCom: last.comPct, decrement: last.comPct - first.comPct,
                firstCV: first.cv, lastCV: last.cv, lastOm: last.omPct, allCom: all.comPct,
                retest: pearson(a, b), perMinute: perMinute(runA) };
    _cache[key] = res;
    return res;
  }
  function runPreset(id) { return runBlocks(preset(id).blocks); }

  /* ---------- PART 1: the learner's task ---------- */
  var LEARNER_BLOCKS = [
    { id: "base", label: "Block 1 · baseline", banners: false, note: "Press for every digit except 3. Nothing else on screen." },
    { id: "ban", label: "Block 2 · banners on", banners: true, note: "Chat banners slide in now and then. Do not answer them; keep pressing." },
    { id: "rest", label: "Break · 2 minutes", rest: true, note: "Look away from the screen, stand if you can. The clock runs here." },
    { id: "mute", label: "Block 3 · banners muted", banners: false, note: "Notifications muted: messages still arrive, nothing appears on screen." }
  ];
  var SIZES = [48, 72, 94, 100, 120];
  var BANNER_TEXT = [
    "#data-eng · Priya: is the nightly load late again?",
    "Marco: got 2 min? quick q on the schema",
    "#incidents · 3 new messages",
    "Ana: lunch at 12:30?",
    "#data-eng · Priya: never mind, found it",
    "Calendar: stand-up moved to 10:15",
    "Marco: also, the dashboard looks off",
    "#random · someone brought cake"
  ];
  /* one block's trial plan: digits shuffled in runs of nine (each digit once per run), sizes, banner times */
  function plan(blockIdx, minutes) {
    var r = mulberry32(1000003 + 7 * blockIdx), n = nTrials(minutes), digits = [], sizes = [], banners = [];
    while (digits.length < n) {
      var run = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (var i = 8; i > 0; i--) { var j = Math.floor(r() * (i + 1)), x = run[i]; run[i] = run[j]; run[j] = x; }
      digits = digits.concat(run);
    }
    digits = digits.slice(0, n);
    for (var k = 0; k < n; k++) sizes.push(SIZES[Math.floor(r() * 5)]);
    var tb = P.GAP_MIN + P.GAP_SPAN * r(), bi = 0;
    while (tb < minutes * 60 - 3) { banners.push({ at: tb, text: BANNER_TEXT[bi % BANNER_TEXT.length] }); bi++; tb += P.GAP_MIN + P.GAP_SPAN * r(); }
    return { n: n, digits: digits, sizes: sizes, banners: banners };
  }

  var api = { P: P, PRESETS: PRESETS, preset: preset, pool: pool, simulate: simulate, runBlocks: runBlocks,
              runPreset: runPreset, score: score, pearson: pearson, nTrials: nTrials, plan: plan,
              mulberry32: mulberry32, LEARNER_BLOCKS: LEARNER_BLOCKS };
  root.FO = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  /* ---------- UI helpers ---------- */
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
  function f1(x) { return (Math.round(x * 10) / 10).toFixed(1); }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  var STORE = "lwp-focus-bench:v1";
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(STORE, JSON.stringify(o)); } catch (e) {} }

  /* ---------- PART 1 UI ---------- */
  function mountLearner(host) {
    var state = load();
    if (!state.res) state.res = {};
    if (typeof state.min !== "number") state.min = 3;
    var run = null;

    host.innerHTML = "";
    var w = el("div", "mb-wrap");
    w.appendChild(el("h4", "", 'Part 1 · measured on you <span class="mb-mkind is-measured">measured</span>'));
    w.appendChild(el("p", "mb-intro", "Press the space bar (or the big button) for every digit except 3. Your numbers stay in this browser only; nothing is sent anywhere. Not a medical or diagnostic test: one sitting on one device measures that sitting, on that device."));
    var lenRow = el("div", "ab-pick fo-len");
    lenRow.innerHTML = '<label for="fo-len">Block length</label>';
    var sel = el("select"); sel.id = "fo-len";
    sel.innerHTML = '<option value="3">3 minutes (157 trials, about 17 no-go)</option><option value="0.5">30 seconds: the break button (26 trials, about 3 no-go)</option>';
    sel.value = String(state.min);
    lenRow.appendChild(sel);
    w.appendChild(lenRow);
    var steps = el("div", "fo-steps");
    w.appendChild(steps);
    var stage = el("div", "fo-stage");
    stage.setAttribute("aria-live", "polite");
    w.appendChild(stage);
    var resWrap = el("div", "fo-results");
    w.appendChild(resWrap);
    host.appendChild(w);

    sel.addEventListener("change", function () { state.min = +sel.value; state.res = {}; save(state); stop(); drawSteps(); drawResults(); });

    function stop() {
      if (run) { run.dead = true; if (run.timer) clearTimeout(run.timer); if (run.tick) clearInterval(run.tick); document.removeEventListener("keydown", run.key); }
      run = null; stage.innerHTML = ""; stage.classList.remove("is-live");
    }

    function drawSteps() {
      steps.innerHTML = "";
      LEARNER_BLOCKS.forEach(function (b, bi) {
        var done = state.res[b.id];
        var card = el("div", "fo-step" + (done ? " is-done" : "") + (b.rest ? " is-rest" : ""));
        card.innerHTML = '<span class="fo-snum">Step ' + (bi + 1) + "</span><b>" + esc(b.label) + '</b><span class="fo-snote">' + esc(b.note) + "</span>";
        var btn = el("button", "btn" + (done ? "" : " primary"), done ? (b.rest ? "Take it again" : "Run again") : (b.rest ? "Start the break" : "Start " + b.label.split(" · ")[0].toLowerCase()));
        btn.type = "button"; btn.id = "fo-start-" + b.id;
        btn.addEventListener("click", function () { if (b.rest) startRest(); else startBlock(bi); });
        card.appendChild(btn);
        steps.appendChild(card);
      });
    }

    function startRest() {
      stop();
      var left = 120, box = el("div", "fo-rest");
      box.innerHTML = '<b>Break.</b> Look at something far away. <span class="fo-clock">2:00</span>';
      var skip = el("button", "btn", "End the break early"); skip.type = "button"; skip.id = "fo-rest-end";
      box.appendChild(skip);
      stage.appendChild(box);
      run = { key: function () {} };
      var t0 = performance.now();
      run.tick = setInterval(function () {
        left = Math.max(0, 120 - Math.floor((performance.now() - t0) / 1000));
        box.querySelector(".fo-clock").textContent = Math.floor(left / 60) + ":" + ("0" + (left % 60)).slice(-2);
        if (left <= 0) finishRest(120);
      }, 250);
      skip.addEventListener("click", function () { finishRest(Math.round((performance.now() - t0) / 1000)); });
    }
    function finishRest(sec) { state.res.rest = { sec: sec }; save(state); stop(); drawSteps(); drawResults(); }

    function startBlock(bi) {
      stop();
      var b = LEARNER_BLOCKS[bi], pl = plan(bi, state.min);
      stage.classList.add("is-live");
      stage.innerHTML = '<div class="fo-screen"><div class="fo-banner" hidden></div><div class="fo-digit"></div></div>' +
        '<div class="fo-bar"><button class="btn primary fo-press" type="button" id="fo-press">Press (space)</button><span class="fo-left"></span><button class="btn fo-quit" type="button">Stop</button></div>';
      var digitEl = stage.querySelector(".fo-digit"), bannerEl = stage.querySelector(".fo-banner"), leftEl = stage.querySelector(".fo-left");
      run = { b: b, bi: bi, pl: pl, k: -1, trials: [], t0: 0, onset: 0, pressed: false, timer: null };
      function press() {
        if (!run || run.k < 0 || run.pressed) return;
        run.pressed = true; run.rt = performance.now() - run.onset;
      }
      run.key = function (e) { if (e.code === "Space" || e.key === " ") { e.preventDefault(); press(); } };
      document.addEventListener("keydown", run.key);
      stage.querySelector(".fo-press").addEventListener("pointerdown", function (e) { e.preventDefault(); press(); });
      stage.querySelector(".fo-quit").addEventListener("click", function () { stop(); });
      var mask = '<svg class="fo-mask" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="24"/><path d="M14 14 L46 46 M46 14 L14 46"/></svg>';

      function closeTrial() {
        if (run.k >= 0) run.trials.push({ nogo: pl.digits[run.k] === 3, pressed: run.pressed, rt: run.pressed ? run.rt : null });
      }
      function next() {
        if (!run || run.dead) return;
        closeTrial();
        run.k++;
        if (run.k >= pl.n) { record(); return; }
        run.pressed = false; run.rt = null;
        var d = pl.digits[run.k];
        digitEl.innerHTML = "";
        digitEl.textContent = String(d);
        digitEl.style.fontSize = (pl.sizes[run.k] * 0.75) + "px";
        run.onset = performance.now();
        if (!run.t0) run.t0 = run.onset;
        var el2 = (run.onset - run.t0) / 1000;
        if (b.banners) {
          var showing = null;
          for (var i = 0; i < pl.banners.length; i++) if (el2 >= pl.banners[i].at && el2 < pl.banners[i].at + 3) showing = pl.banners[i];
          if (showing) { bannerEl.textContent = showing.text; bannerEl.hidden = false; } else bannerEl.hidden = true;
        }
        leftEl.textContent = Math.max(0, Math.ceil((pl.n - run.k) * P.SOA / 1000)) + " s left";
        run.timer = setTimeout(function () {
          if (!run || run.dead) return;
          digitEl.innerHTML = mask;
          var due = run.onset + P.SOA - performance.now();
          run.timer = setTimeout(next, Math.max(0, due));
        }, 250);
      }
      next();
    }

    function record(synthetic) {
      var s = score(run.trials);
      s.min = state.min; s.at = Date.now();
      if (synthetic) s.synthetic = true;
      state.res[run.b.id] = s;
      save(state);
      stop(); drawSteps(); drawResults();
    }

    function drawResults() {
      var R = state.res, rows = LEARNER_BLOCKS.filter(function (b) { return !b.rest && R[b.id]; });
      if (!rows.length) { resWrap.innerHTML = '<p class="fo-empty">No blocks yet. Start with block 1.</p>'; return; }
      var h = '<div class="dt-tablewrap"><table class="clean fo-table"><thead><tr><th>Block</th><th>Mean RT</th><th>RT variability (CV)</th><th>Commission errors</th><th>Omission errors</th></tr></thead><tbody>';
      rows.forEach(function (b) {
        var x = R[b.id];
        h += "<tr><td>" + esc(b.label) + (x.synthetic ? " (test run)" : "") + "</td><td>" + Math.round(x.meanRT) + " ms</td><td>" + f2(x.cv) + "</td><td>" + x.com + " of " + x.nogo + " (" + Math.round(x.comPct) + "%)</td><td>" + x.om + " of " + x.go + " (" + f1(x.omPct) + "%)</td></tr>";
      });
      h += "</tbody></table></div>";
      var notes = [], small = rows.some(function (b) { return R[b.id].nogo < 8; });
      if (small) notes.push(["is-bad", "Some blocks had fewer than 8 no-go trials. One press on a 3 then moves the commission rate by more than 12 points: read those rows as noise, not as you."]);
      if (R.base && R.ban) {
        var dc = R.ban.com - R.base.com, dcv = R.ban.cv - R.base.cv;
        notes.push(["is-ok", "Banners on vs baseline: commission errors " + R.base.com + " to " + R.ban.com + " (" + (dc >= 0 ? "+" : "") + dc + "), CV " + f2(R.base.cv) + " to " + f2(R.ban.cv) + ", mean RT " + Math.round(R.base.meanRT) + " to " + Math.round(R.ban.meanRT) + " ms." + (Math.abs(dc) <= 2 ? " A difference of two errors or fewer is within what chance alone produces in 17 no-go trials." : "")]);
      }
      if (R.mute && R.ban) notes.push(["is-ok", "After the break, banners muted: commission errors " + R.mute.com + " of " + R.mute.nogo + ", CV " + f2(R.mute.cv) + ". Block 3 came after a break and after practice, so it mixes two changes."]);
      if (rows.length >= 2) {
        var slow = rows.slice().sort(function (a, b2) { return R[b2.id].meanRT - R[a.id].meanRT; })[0];
        notes.push(["is-ok", "Read errors next to speed: your slowest block was " + slow.label.split(" · ")[0].toLowerCase() + " (" + Math.round(R[slow.id].meanRT) + " ms). Slower pressing usually buys fewer commission errors, so an error count on its own cannot tell attention from caution."]);
      }
      h += notes.map(function (n) { return '<p class="mb-verdict ' + n[0] + ' fo-note">' + esc(n[1]) + "</p>"; }).join("");
      h += '<button class="btn" type="button" id="fo-clear">Clear my results</button>';
      resWrap.innerHTML = h;
      document.getElementById("fo-clear").addEventListener("click", function () { state.res = {}; save(state); drawSteps(); drawResults(); });
    }

    /* headless check hook: run a block instantly with a synthetic responder (marked as a test run) */
    function simulateBlock(bi, opts) {
      stop();
      opts = opts || {};
      var pl = plan(bi, state.min), r = mulberry32(42 + bi), tr = [];
      for (var k = 0; k < pl.n; k++) {
        var nogo = pl.digits[k] === 3, pr = nogo ? r() < (opts.com || 0.3) : r() >= (opts.om || 0.02);
        tr.push({ nogo: nogo, pressed: pr, rt: pr ? (opts.rt || 380) + 60 * (r() - 0.5) : null });
      }
      run = { b: LEARNER_BLOCKS[bi], trials: tr, key: function () {} };
      record(true);
    }

    drawSteps();
    drawResults();
    host._fo = { start: startBlock, simulate: simulateBlock, state: state, plan: plan };
  }

  /* ---------- PART 2 UI ---------- */
  function mountModel(host) {
    var state = { id: host.getAttribute("data-preset") || "b10" };
    host.innerHTML = "";
    var w = el("div", "mb-wrap");
    w.appendChild(el("h4", "", 'Part 2 · 200 synthetic participants <span class="mb-mkind is-heuristic">modelled</span>'));
    w.appendChild(el("p", "mb-intro", "Modelled, not measured. A seeded pool of 200 invented people runs the same task. Each has a starting speed, variability and error tendency, and drifts with minutes on task; a banner disrupts the next four trials; a break gives back most of the drift. Settings are illustrative and fitted to nobody: the direction of each change is the claim, not the size. The pool runs every setting twice with fresh randomness, so you can see whether the measure would rank people the same way twice."));
    var pres = el("div", "mb-presets"), btns = {};
    PRESETS.forEach(function (p) {
      var l = el("label", "mb-preset" + (p.anti || p.brk ? " is-anti" : ""));
      l.innerHTML = '<input type="radio" name="fo-preset" value="' + p.id + '"><span><span class="mb-pname">' + esc(p.label) + "</span>" +
        (p.anti ? ' <span class="mb-anti">anti-lever</span>' : "") + (p.brk ? ' <span class="mb-anti">break button</span>' : "") +
        '</span><span class="mb-pnote">' + esc(p.note) + "</span>";
      l.querySelector("input").addEventListener("change", function () { state.id = p.id; render(); });
      btns[p.id] = l; pres.appendChild(l);
    });
    w.appendChild(pres);
    var verdict = el("p", "mb-verdict"), metrics = el("div", "mb-metrics"), chart = el("div", "ab-stage fo-chart");
    w.appendChild(verdict); w.appendChild(metrics); w.appendChild(chart);
    host.appendChild(w);

    function metric(label, val, unit) {
      return '<div class="mb-metric"><span class="mb-mkind is-heuristic">modelled</span><span class="mb-mlabel">' + esc(label) +
        '</span><span class="mb-mvalue">' + esc(val) + '</span><span class="mb-munit">' + esc(unit) + "</span></div>";
    }

    function render() {
      var pr = preset(state.id);
      Object.keys(btns).forEach(function (k) { btns[k].classList.toggle("is-on", k === state.id); btns[k].querySelector("input").checked = k === state.id; });
      var r = runPreset(state.id), b10 = runPreset("b10");
      var v;
      if (pr.anti) v = "Anti-lever. Banners on for 10 minutes: commission rate in the last fifth " + f1(r.lastCom) + "%, against " + f1(b10.lastCom) + "% with no banners. Never answering them does not make them free.";
      else if (pr.brk) v = "Broken on purpose. In 30 seconds the model builds in a drift of only " + f1(r.builtIn) + " points; the measure reports " + f1(r.decrement) + ", which is noise, and two runs of the same people agree at r = " + f2(r.retest) + ". About 3 no-go trials each cannot measure anyone.";
      else if (pr.id === "brk") v = "Two 5-minute blocks with a break: last fifth " + f1(r.lastCom) + "%, against " + f1(b10.lastCom) + "% for 10 minutes straight. Same minutes on task, less drift at the end.";
      else v = pr.label + ": commission rate " + f1(r.firstCom) + "% in the first fifth, " + f1(r.lastCom) + "% in the last fifth, a drift of " + f1(r.decrement) + " points.";
      verdict.className = "mb-verdict " + (pr.anti || pr.brk ? "is-bad" : pr.id === "brk" ? "is-good" : "is-ok");
      verdict.textContent = v;
      metrics.innerHTML =
        metric("Commission rate, first fifth", f1(r.firstCom) + "%", "presses on a 3") +
        metric("Commission rate, last fifth", f1(r.lastCom) + "%", "drift " + (r.decrement >= 0 ? "+" : "") + f1(r.decrement) + " points") +
        metric("RT variability, first to last", f2(r.firstCV) + " to " + f2(r.lastCV), "coefficient of variation") +
        metric("Drift built into the model", (r.builtIn >= 0 ? "+" : "") + f1(r.builtIn) + " points", "what the measure should find") +
        metric("Same people, run twice", "r = " + f2(r.retest), "agreement of the two runs") +
        metric("No-go trials per person", f1(r.nogoPerPerson), r.trials + " trials in all");
      chart.innerHTML = draw(r, runPreset("b3"));
    }

    function draw(r, base) {
      var W = 620, H = 250, x0 = 54, x1 = 600, y0 = 200, y1 = 20, maxMin = 21, ymax = 60;
      function X(m) { return x0 + (x1 - x0) * m / maxMin; }
      function Y(v) { return y0 - (y0 - y1) * Math.min(v, ymax) / ymax; }
      var s = '<svg class="fo-curve" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Modelled commission rate minute by minute for the chosen setting, against the 3-minute block.">';
      s += '<line class="ab-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x1 + '" y2="' + y0 + '"/><line class="ab-axis" x1="' + x0 + '" y1="' + y0 + '" x2="' + x0 + '" y2="' + y1 + '"/>';
      [0, 5, 10, 15, 20].forEach(function (m) { s += '<text class="ab-tick" x="' + X(m) + '" y="' + (y0 + 16) + '" text-anchor="middle">' + m + " min</text>"; });
      [0, 20, 40, 60].forEach(function (v) { s += '<text class="ab-tick" x="' + (x0 - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + v + "%</text>"; });
      function path(pm, cls) {
        if (pm.length === 1) return '<circle class="fo-pt ' + cls + '" cx="' + X(0.25) + '" cy="' + Y(pm[0]) + '" r="5"/>';
        return '<path class="fo-line ' + cls + '" d="' + pm.map(function (v, i) { return (i ? "L" : "M") + X(i + 0.5).toFixed(1) + " " + Y(v).toFixed(1); }).join(" ") + '"/>';
      }
      s += path(base.perMinute, "fo-c-base");
      s += path(r.perMinute, "fo-c-sel");
      s += '<text class="ab-cap" x="' + ((x0 + x1) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">thick line: chosen setting · thin: one 3-minute block · presses on a 3, per minute</text>';
      return s + "</svg>";
    }
    render();
    host._fo = { set: function (id) { state.id = id; render(); } };
  }

  function boot() {
    var a = document.getElementById("fo-learner"); if (a) mountLearner(a);
    var b = document.getElementById("fo-model"); if (b) mountModel(b);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})(typeof window !== "undefined" ? window : globalThis);
