/* Merge rules for Math Quest Worlds saves, shared by the Worker and the test stand-in.
   A save carries the copy it started from (base). mergeState lays this page's changes since base onto the copy
   another device stored. Every character record merges on its own: coins move by the difference, xp/runs/wins/
   kills by the non-negative difference, cleared regions and everything found or owned are kept from both, hearts
   keep the higher value, and choices (what is equipped, worn, which pet is out, which character is playing) follow this page. */
const isObj = o => o && typeof o === 'object' && !Array.isArray(o);
const num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;
const clone = o => JSON.parse(JSON.stringify(o));
const delta = (a, b) => num(a) - num(b);
const strs = a => Array.isArray(a) ? a.filter(x => typeof x === 'string') : [];
const union = (a, b) => [...new Set([...strs(a), ...strs(b)])];
const INV = ['melee', 'ranged', 'armor'];

export const KIDS = ['charlie', 'riley', 'yan'];

export function mergeState(mine, theirs, base) {
  mine = isObj(mine) ? mine : {}; theirs = isObj(theirs) ? theirs : {}; base = isObj(base) ? base : {};
  const out = clone(theirs);
  if (typeof mine.cur === 'string') out.cur = mine.cur;
  out.chars = isObj(theirs.chars) ? clone(theirs.chars) : {};
  const mc = isObj(mine.chars) ? mine.chars : {}, bc = isObj(base.chars) ? base.chars : {};
  for (const key in mc) {
    const m = isObj(mc[key]) ? mc[key] : {}, b = isObj(bc[key]) ? bc[key] : {};
    if (!isObj(out.chars[key])) { out.chars[key] = clone(m); continue; }
    const t = out.chars[key];
    t.coins = Math.max(0, num(t.coins) + delta(m.coins, b.coins));
    for (const k of ['xp', 'runs', 'wins', 'kills']) t[k] = num(t[k]) + Math.max(0, delta(m[k], b[k]));
    t.hearts = Math.max(num(t.hearts), num(m.hearts));
    t.clears = Object.assign({}, isObj(t.clears) ? t.clears : {}, isObj(m.clears) ? m.clears : {});
    const ti = isObj(t.inv) ? t.inv : {}, mi = isObj(m.inv) ? m.inv : {};
    t.inv = {}; for (const k of INV) t.inv[k] = union(ti[k], mi[k]);
    if (isObj(m.equip)) t.equip = clone(m.equip);
    for (const k of ['own', 'pets', 'petOwn']) t[k] = union(t[k], m[k]);
    for (const k of ['wear', 'pet', 'petWear', 'petTag']) if (k in m) t[k] = clone(m[k]);
  }
  out.updated = Date.now();
  return out;
}

/* true when a save would throw away earned progress: a character, its xp, hearts, a cleared region or something found */
export function lowersProgress(next, cur) {
  if (!isObj(cur) || !isObj(next)) return false;
  const cc = isObj(cur.chars) ? cur.chars : {}, nc = isObj(next.chars) ? next.chars : {};
  for (const key in cc) {
    const c = cc[key], n = nc[key];
    if (!isObj(c)) continue;
    if (!isObj(n)) return true;
    if (num(n.xp) < num(c.xp) || num(n.hearts) < num(c.hearts)) return true;
    const cl = isObj(c.clears) ? c.clears : {}, nl = isObj(n.clears) ? n.clears : {};
    for (const r in cl) if (cl[r] && !nl[r]) return true;
    const ci = isObj(c.inv) ? c.inv : {}, ni = isObj(n.inv) ? n.inv : {};
    for (const k of INV) { const have = strs(ni[k]); for (const id of strs(ci[k])) if (!have.includes(id)) return true; }
    for (const k of ['own', 'pets', 'petOwn']) { const have = strs(n[k]); for (const id of strs(c[k])) if (!have.includes(id)) return true; }
  }
  return false;
}
