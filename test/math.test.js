/* Puzzle generators and the region builder: node math.test.js
   Rolls every puzzle hundreds of times per grade and tier and checks each one is solvable, in range and unique. */
const assert = require('assert');
const M = require('../src/math.js');
global.MQMath = M;
const Wd = require('../src/world.js');
let n = 0;
const check = (ok, what) => { n++; if (!ok) { console.log('  FAIL', what); process.exitCode = 1; } };
const sum = a => a.reduce((x, y) => x + y, 0);
for (const g of [3, 4]) for (let t = 1; t <= 8; t++) {
  for (let i = 0; i < 300; i++) {
    const s = M.stones(g, t);
    check(s.cols.length === 5 && s.cols.every(c => c.length === 3), 'stones: 5 columns of 3');
    check(s.cols.filter(c => sum(c) === s.target).length === 1, `stones: exactly one column makes ${s.target} (g${g} t${t})`);
    check(sum(s.cols[s.answer]) === s.target, 'stones: the answer column is right');
    check(s.cols.every(c => c.every(v => v >= 2 && v <= (g === 3 ? 14 : 40))), 'stones: values in range');
    const d = M.doors(g, t);
    check(d.nums.length === 4 && new Set(d.nums).size === 4, 'doors: four different numbers');
    const okIdx = d.nums.map((v, j) => (d.kind === 'factor' ? d.m % v === 0 : v % d.m === 0) ? j : -1).filter(j => j >= 0);
    check(okIdx.length === 1 && okIdx[0] === d.answer, `doors: exactly one ${d.label} (${d.nums.join(' ')})`);
    const r = M.riddle(g, t);
    check(Number.isInteger(r.answer) && r.answer >= 0 && r.answer <= 1000 && /number/.test(r.text), `riddle: integer answer (${r.kind}: ${r.answer})`);
    const tl = M.toll(g, t, { pet: 'your pup' });
    check(tl.answer === tl.p * tl.legs && tl.answer > 0, 'toll: price times legs');
    const tr = M.trader(g, t, { cur: 'pearls' });
    check(tr.answer === tr.r * tr.n, 'trader: rate times count');
    const b = M.brew(g, t);
    check(Number.isInteger(b.answer) && b.answer >= 1, `brew: at least one bottle (${b.text})`);
    const sh = M.share(g, t, { pet: 'your pup' });
    check(Number.isInteger(sh.answer) && sh.answer >= 0, 'share: whole answer');
    const f = M.fork(g, t, {});
    check(f.options.length >= 2 && f.options.every(o => o.value > 0) && f.options.every((o, j) => o.value <= f.options[f.best].value), 'fork: best is the biggest');
    const hp = M.battleHP(g, t, [6, 9, 15], { boss: i % 2 === 0 });
    check(hp.hp === sum(hp.plan) && hp.plan.every(v => [6, 9, 15, 12, 18, 30].includes(v)), 'battle: HP is a sum of moves');
    check(M.monsterPower(g, t, false) >= 1 && M.monsterPower(g, t, false) <= 4, 'battle: monster power in range');
  }
  for (let i = 0; i < 20; i++) {
    const reg = Wd.makeRegion('lagoon', g, t, { cur: 'pearls', name: 'Axolotl Lagoon', pet: null });
    const tags = Object.keys(reg.byTag);
    check(tags.length === 13, 'region: 13 rooms');
    check(reg.byTag.boss.ry === -1 && reg.byTag.boss.rx === reg.byTag.bossgate.rx, 'region: the boss room sits above the boss gate hall');
    /* every opening matches the neighbour's opening */
    const roomAt = (rx, ry) => reg.rooms[Wd.key(rx, ry)];
    for (const tag of tags) { const rm = reg.byTag[tag];
      for (const side of ['top', 'bottom', 'left', 'right']) { const cells = rm.openings[side]; if (!cells.length) continue;
        if (tag === 'entrance' && side === 'bottom') continue;
        const nb = side === 'top' ? roomAt(rm.rx, rm.ry - 1) : side === 'bottom' ? roomAt(rm.rx, rm.ry + 1) : side === 'left' ? roomAt(rm.rx - 1, rm.ry) : roomAt(rm.rx + 1, rm.ry);
        const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
        check(nb && nb.openings[opp].join() === cells.join(), `region: ${tag} ${side} opening meets ${nb && nb.tag} (${cells.join()} vs ${nb && nb.openings[opp].join()})`);
        /* the opening tiles are walkable or a gate/boss door */
        cells.forEach(c => { const v = side === 'top' ? Wd.at(rm, c, 0) : side === 'bottom' ? Wd.at(rm, c, Wd.H - 1) : side === 'left' ? Wd.at(rm, 0, c) : Wd.at(rm, Wd.W - 1, c);
          check([Wd.T.FLOOR, Wd.T.GATE, Wd.T.BOSSDOOR, Wd.T.OPEN].includes(v), `region: ${tag} ${side} opening tile ${c} is ${v}`); });
      } }
    const st = reg.byTag.stones, stoneVals = Object.values(st.obj).filter(o => o.type === 'stone');
    check(stoneVals.length === 15, 'stones room has 15 stones');
    const doors = Object.values(reg.byTag.doors.obj).filter(o => o.type === 'door');
    check(doors.length === 4 && doors.filter(o => o.ok).length === 1, 'doors room has four doors, one right');
    check(Object.values(reg.byTag.riddle.obj).some(o => o.type === 'chest' && o.content === 'key'), 'riddle room holds a key chest');
    check(reg.byTag.den.enemies.length === 3 && reg.byTag.boss.enemies[0].boss, 'den has three monsters, boss room a boss');
    /* the start tile is floor and the entrance exit is open */
    check(Wd.at(reg.byTag.entrance, Math.floor(reg.start.x), Math.floor(reg.start.y)) !== Wd.T.WALL, 'start tile is open');
  }
}
console.log(`${n - (process.exitCode ? 1 : 0)} checks run${process.exitCode ? ', some FAILED' : ', all passed'}`);
