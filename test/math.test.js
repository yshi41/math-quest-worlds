/* Puzzle generators and the region builder: node math.test.js
   Rolls every puzzle hundreds of times per grade and tier and checks each one is solvable, in range and unique. */
const M = require('../src/math.js');
global.MQMath = M;
const Wd = require('../src/world.js');
let n = 0;
const check = (ok, what) => { n++; if (!ok) { console.log('  FAIL', what); process.exitCode = 1; } };
const sum = a => a.reduce((x, y) => x + y, 0);
const evalExpr = s => { const m = String(s).match(/^(\d+) ([×+−]) (\d+)$/); if (!m) return +s; const a = +m[1], b = +m[3]; return m[2] === '×' ? a * b : m[2] === '+' ? a + b : a - b; };
for (const g of [3, 4]) for (let t = 1; t <= 8; t++) {
  const ctx = { M: 2, R: 3, divs: [2, 3, 5] };
  for (let i = 0; i < 200; i++) {
    const r = M.rule(g, t); const rn = M.ruleNumbers(r, 8, 3);
    check(rn.nums.length === 8 && rn.okIdx.length === 3 && rn.nums.every((v, j) => r.test(v) === rn.okIdx.includes(j)), `rule ${r.label}: 3 of 8 fit (${rn.nums.join(' ')})`);
    const s = M.stones(g, t, ctx);
    check(s.cols.length === 5 && s.cols.every(c => c.length === 3), 'stones: 5 columns of 3');
    if (s.variant === 'sum') { check(s.cols.filter(c => sum(c) === s.target).length === 1 && sum(s.cols[s.answer]) === s.target, `stones sum: one column makes ${s.target}`); }
    else if (s.variant === 'rule') { check(s.cols.filter(c => c.every(s.rule.test)).length === 1 && s.cols[s.answer].every(s.rule.test), `stones rule: one column all ${s.rule.label}`); }
    else { const good = s.cols[s.answer]; check(good[0] === s.start && good[1] === s.start + s.k && good[2] === s.start + 2 * s.k, 'stones count: the answer column counts up'); check(s.cols.filter(c => c[0] === good[0] && c[1] === good[1] && c[2] === good[2]).length === 1, 'stones count: only one column counts'); }
    const d = M.doors(g, t);
    check(d.nums.length === 4 && new Set(d.nums).size === 4 && d.nums.filter(v => d.rule.test(v)).length === 1 && d.rule.test(d.nums[d.answer]), `doors: one of four fits (${d.label}: ${d.nums.join(' ')})`);
    const tg = M.targets(g, t);
    check(tg.nums.length === 6 && tg.ok.length >= 2 && tg.ok.length <= 3, 'targets: six targets, two or three right (' + tg.variant + ')');
    if (tg.variant === 'pair') check(tg.ok.length === 2 && tg.nums[tg.ok[0]] + tg.nums[tg.ok[1]] === tg.target && tg.nums.filter((v, j) => tg.nums.some((w, k) => k !== j && v + w === tg.target)).length === 2, `targets pair: only one pair makes ${tg.target} (${tg.nums.join(' ')})`);
    if (tg.variant === 'equal') check(tg.nums.every((e, j) => (evalExpr(e) === tg.target) === tg.ok.includes(j)), `targets equal: expressions match ${tg.target} (${tg.nums.join(' | ')})`);
    if (tg.variant === 'rule') check(tg.nums.every((v, j) => tg.rule.test(v) === tg.ok.includes(j)), 'targets rule: ok set matches the rule');
    const b = M.blocks(g, t);
    if (b.variant === 'sum') { const pairs = []; for (let x = 0; x < 4; x++) for (let y = x + 1; y < 4; y++) pairs.push(b.vals[x] + b.vals[y]); check(pairs.filter(v => v === b.target).length === 1, `blocks sum: one pair makes ${b.target} (${b.vals.join(' ')})`); }
    else if (b.variant === 'balance') { const v = b.vals, splits = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 3, 1, 2]].filter(s => v[s[0]] + v[s[1]] === v[s[2]] + v[s[3]]); check(splits.length === 1, `blocks balance: one split (${v.join(' ')})`); }
    else { const v = b.vals, trip = []; for (let x = 0; x < 5; x++) for (let y = x + 1; y < 5; y++) for (let z = y + 1; z < 5; z++) trip.push(v[x] + v[y] + v[z]); check(trip.filter(s => s === b.target).length === 1, `blocks row: one triple makes ${b.target}`); }
    const mu = M.muncher(g, t);
    check(mu.nums.length === 15 && mu.ok.length >= 4 && mu.ok.length <= 6, 'muncher: 15 tiles, 4-6 right');
    if (mu.variant === 'rule') check(mu.nums.every((v, j) => mu.rule.test(v) === mu.ok.includes(j)), 'muncher: ok set matches the rule');
    else check(mu.nums.every((e, j) => (evalExpr(e) === mu.target) === mu.ok.includes(j)), 'muncher equal: expressions match');
    const sk = M.skipPath(g, t);
    check(sk.seq.length === 7 && sk.path.length === 7 && sk.path.every((p, j) => sk.grid[p[1]][p[0]] === sk.seq[j]), 'skip: the path holds the sequence');
    check(sk.grid.flat().filter(v => v === sk.seq[1]).length === 1, 'skip: the second number appears once');
    const to = M.torches(g, t);
    check(to.seq.length === 5 && to.shown.slice().sort((a, c) => a - c).join() === to.seq.slice().sort((a, c) => a - c).join(), 'torches: the five shown values are the sequence');
    const di = M.dials(g, t);
    check(di.v >= 0 && di.v <= 99 && di.digits.length === 2 && di.digits[0] * 10 + di.digits[1] === di.v, `dials: two digits for ${di.v}`);
    const ns = M.numSlimes(g, t, ctx);
    check(ns.length === 3 && ns.every(v => { for (let a = 0; a * 2 <= v; a++) if ((v - a * 2) % 3 === 0) return true; return false; }), 'number slimes: reachable with 2s and 3s (' + ns.join(' ') + ')');
    const be = M.beetles(g, t, ctx);
    check(be.length === 3 && be.every(v => { let x = v; for (const dv of [2, 3, 5]) while (x % dv === 0) x /= dv; return x === 1 && v > 1; }), 'beetles: products of owned numbers (' + be.join(' ') + ')');
    const bs = M.bossShield(g, t, ctx); check(bs.phases.length === 3 && bs.phases.every(v => v > 0), 'shield boss: three phases');
    const bf = M.bossFactor(g, t, ctx); check(bf.phases.length === 3 && bf.phases.every(v => v > 1), 'factor boss: three phases above 1');
    const bm = M.bossMinions(g, t); let okc = 0; for (let j = 0; j < 40; j++) if (bm.rule.test(M.minionNumber(bm.rule))) okc++; check(okc >= 4 && okc <= 36, 'minion boss: both kinds of minion appear (' + okc + '/40)');
    const bp = M.bossPattern(g, t); check(bp.rounds.length === 4 && bp.rounds.every(r => r.opts.length === 6 && r.opts.includes(r.answer) && new Set(r.opts).size === 6), 'pattern boss: four rounds of six plates');
    const f = M.fork(g, t, {}); check(f.options.length >= 2 && f.options.every((o, j) => o.value <= f.options[f.best].value), 'fork: best is the biggest');
    check(M.monsterHP(g, t, 'slime') >= 2 && M.monsterHP(g, t, 'slime') <= 5, 'monster hp stays small (' + M.monsterHP(g, t, 'slime') + ')');
  }
  for (let i = 0; i < 16; i++) {
    const keyName = ['lagoon', 'candy', 'canopy', 'ocean', 'bows', 'boba', 'birds', 'cheer'][i % 8];
    const reg = Wd.makeRegion(keyName, g, t, Object.assign({ cur: 'pearls', name: keyName, secretItem: 'h1' }, ctx));
    const tags = Object.keys(reg.byTag);
    check(tags.length === 13, 'region: 13 rooms');
    check(new Set(reg.kinds).size === 5, 'region: five different puzzle kinds (' + reg.kinds.join(' ') + ')');
    const roomAt = (rx, ry) => reg.rooms[Wd.key(rx, ry)];
    for (const tag of tags) { const rm = reg.byTag[tag];
      for (const side of ['top', 'bottom', 'left', 'right']) { const cells = rm.openings[side]; if (!cells.length) continue;
        if (tag === 'entrance' && side === 'bottom') continue;
        const nb = side === 'top' ? roomAt(rm.rx, rm.ry - 1) : side === 'bottom' ? roomAt(rm.rx, rm.ry + 1) : side === 'left' ? roomAt(rm.rx - 1, rm.ry) : roomAt(rm.rx + 1, rm.ry);
        const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
        check(nb && nb.openings[opp].join() === cells.join(), `region: ${tag} ${side} opening meets ${nb && nb.tag}`);
        /* the opening and the tile just inside it are walkable (or the boss door) */
        cells.forEach(c => { const [ox, oy, ix, iy] = side === 'top' ? [c, 0, c, 1] : side === 'bottom' ? [c, Wd.H - 1, c, Wd.H - 2] : side === 'left' ? [0, c, 1, c] : [Wd.W - 1, c, Wd.W - 2, c];
          check([Wd.T.FLOOR, Wd.T.BOSSDOOR, Wd.T.OPEN, Wd.T.PATH].includes(Wd.at(rm, ox, oy)), `region: ${tag} ${side} opening tile ${c} is open`);
          check(!Wd.SOLID.has(Wd.at(rm, ix, iy)), `region: ${tag} ${side} tile inside the opening ${c} is walkable (${Wd.at(rm, ix, iy)})`); }); }
      rm.enemies.forEach(e => check(!Wd.SOLID.has(Wd.at(rm, e.x, e.y)), `region: ${tag} monster spawns on open floor`));
      const ch = Object.values(rm.obj).filter(o => o.type === 'chest');
      ch.forEach(c => { const free = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !Wd.SOLID.has(Wd.at(rm, c.x + dx, c.y + dy))); check(free, `region: ${tag} chest at ${c.x},${c.y} can be reached`); });
    }
    check(reg.byTag.boss.boss && ['shield', 'factor', 'minions', 'pattern'].includes(reg.byTag.boss.boss.type), 'region: the boss has a type');
    if (reg.byTag.boss.boss.type === 'pattern') check(reg.byTag.boss.plates.length === 6, 'pattern boss: six plates');
    const arena = reg.byTag.arena; check(arena.enemies.length === 3 && arena.enemies.every(e => e.n > 0), 'arena: three math monsters');
    for (const tag of ['pA', 'pB', 'pC', 'pD', 'pE', 'secret']) { const rm = reg.byTag[tag]; check(rm.puzzle && rm.reward && rm.reward.locked === 'puzzle', `${tag}: puzzle with a locked chest (${rm.kind})`);
      if (rm.kind === 'blocks') check(rm.plates.length >= 2 && Object.values(rm.obj).filter(o => o.type === 'block').length >= rm.plates.length, 'blocks: plates and enough blocks');
      if (rm.kind === 'stones') check(Object.values(rm.obj).filter(o => o.type === 'stone').length === 15, 'stones: 15 stones');
      if (rm.kind === 'targets') check(Object.values(rm.obj).filter(o => o.type === 'target').length === 6, 'targets: six targets');
      if (rm.kind === 'torches') check(Object.values(rm.obj).filter(o => o.type === 'torch').length === 5, 'torches: five torches');
      if (rm.kind === 'muncher' || rm.kind === 'skip') check(Object.values(rm.obj).filter(o => o.type === 'numtile').length === 15, rm.kind + ': fifteen tiles'); }
  }
}
console.log(`${n} checks run${process.exitCode ? ', some FAILED' : ', all passed'}`);
