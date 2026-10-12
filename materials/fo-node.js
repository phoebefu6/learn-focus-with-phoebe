// Runs the browser engine (assets/fo-live.js) headless and prints the same canon as
// materials/fo_reference.py.  Run: node materials/fo-node.js
const path = require("path");
global.window = global;
const FO = require(path.join(__dirname, "../assets/fo-live.js"));
const r4 = x => Number.isInteger(x) ? x : Math.round(x * 1e4) / 1e4;
const keys = ["builtIn", "trials", "nogoPerPerson", "firstCom", "lastCom", "decrement", "firstCV", "lastCV", "lastOm", "retest"];
const out = {};
for (const p of FO.PRESETS) { const r = FO.runPreset(p.id); out[p.id] = {}; for (const k of keys.sort()) out[p.id][k] = r4(r[k]); }
const sorted = Object.keys(out).sort().reduce((a, k) => (a[k] = out[k], a), {});
console.log(JSON.stringify(sorted, null, 1));
